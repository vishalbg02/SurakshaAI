"""
rule_engine.py
--------------
Rule-based fraud detection engine.
Maintains keyword dictionaries for multiple scam categories in both
English and Hindi/Hinglish.  Each category carries a configurable weight.
Detection is case-insensitive and uses word-boundary matching to prevent
substring false positives.

Delegates URL scanning to url_scanner.py.

ENHANCEMENT v2:
  - Added social_impersonation category (weight 20)
  - Added family keyword + money request compound detection
  - Added secondary boost rule (social_impersonation + urgency = +10)
  - Added has_money_request flag

ENHANCEMENT v3 (HARDENING):
  - Added financial_data_request category
  - Added dynamic_urgency regex detection
  - Added financial + urgency escalation floor
  - Added compound financial detection
  - Migrated ALL keyword matching to word-boundary regex
  - Eliminated substring false positives

ENHANCEMENT v4 (FINANCIAL HARDENING):
  - Expanded financial_data_request with corporate/vendor/invoice phrases
  - Strengthened dynamic urgency regex

PATCH v5 (SCORING PROPORTIONALITY):
  - Reduced financial_data_request weight from 22 to 16
  - Reduced dynamic_urgency weight from 15 to 10
  - Removed raw score forcing to 100
  - Floors only enforce minimum, never inflate to ceiling
  - Preserves detection coverage, restores score differentiation
"""

from __future__ import annotations

import re
from typing import Any

from url_scanner import scan_urls

# ============================================================================
# KEYWORD DICTIONARIES  –  { category: (weight, [phrases]) }
# ============================================================================

SCAM_KEYWORDS: dict[str, tuple[int, list[str]]] = {
    # ------------------------------------------------------------------
    # English categories
    # ------------------------------------------------------------------
    "urgency": (
        12,
        [
            "immediately", "urgent", "right now", "within 24 hours",
            "act now", "last chance", "hurry", "time is running out",
            "expires today", "don't delay", "limited time",
            "before it's too late", "expire soon", "do it now",
            "final warning", "action required immediately",
            "permanently closed", "account will be closed",
            "suspended within", "will be blocked",
        ],
    ),
    "fear": (
        14,
        [
            "blocked", "suspended", "terminated", "legal action",
            "police complaint", "arrest warrant", "fir registered",
            "your account has been compromised", "unauthorized access",
            "security alert", "fraud detected on your account",
            "account frozen", "penalty", "blacklisted",
            "under investigation", "will be deactivated",
        ],
    ),
    "otp": (
        18,
        [
            "otp", "one time password", "verification code",
            "share the code", "send the otp", "enter otp",
            "tell me your otp", "otp received", "confirm otp",
            "share your pin", "share pin",
        ],
    ),
    "personal_data": (
        15,
        [
            "pan card", "aadhaar", "bank account number",
            "credit card number", "cvv", "expiry date",
            "date of birth", "mother's maiden name",
            "social security", "debit card details",
            "upi pin", "atm pin", "net banking password",
            "card details", "share your details",
        ],
    ),
    "authority_impersonation": (
        16,
        [
            "rbi", "reserve bank", "income tax department",
            "sbi", "hdfc bank", "icici bank", "government of india",
            "cyber crime", "police department", "customs department",
            "state bank", "ministry of finance", "trai",
            "telecom authority", "insurance regulatory",
            "sebi", "epfo", "nabard",
        ],
    ),
    "reward_scam": (
        10,
        [
            "you have won", "congratulations", "lucky winner",
            "claim your prize", "gift card", "cash prize",
            "lottery", "reward points", "free gift",
            "selected for a reward", "you've been chosen",
            "scratch card", "bonus credited",
            "cashback of", "you won a",
        ],
    ),
    "kyc_scam": (
        14,
        [
            "kyc", "kyc expiry", "kyc update", "kyc verification",
            "update your kyc", "complete kyc", "re-kyc",
            "know your customer", "verify kyc",
        ],
    ),

    # ------------------------------------------------------------------
    # Financial data request / refund phishing / corporate fraud
    # PATCH v5: weight reduced from 22 → 16 to prevent score inflation
    # when multiple financial phrases match in a single message.
    # Detection coverage is unchanged; only per-hit contribution is lower.
    # ------------------------------------------------------------------
    "financial_data_request": (
        16,
        [
            "refund", "rejected", "transaction declined",
            "payment failed", "billing issue",
            "update payment", "update payment method",
            "confirm your account", "confirm account details",
            "confirm your details", "verify your details",
            "verify your account", "account verification",
            "avoid cancellation", "to avoid cancellation",
            "avoid account closure", "account closure",
            "temporary suspension", "account restricted",
            "processing issue",
            "bank details",
            "update bank details",
            "confirm bank details",
            "vendor payment",
            "payment rejected",
            "payment pending",
            "process payment",
            "invoice overdue",
            "wire transfer",
            "transfer funds",
            "account information",
            "update account information",
            "confirm account information",
            "refund could not be processed",
        ],
    ),

    # ------------------------------------------------------------------
    # Hindi / Hinglish categories
    # ------------------------------------------------------------------
    "hindi_urgency": (
        12,
        [
            "turant", "abhi", "jaldi", "foran", "jaldi karein",
            "abhi karo", "waqt khatam ho raha hai", "samay seema",
            "der mat karo", "jald se jald",
        ],
    ),
    "hindi_fear": (
        14,
        [
            "band ho jayega", "block ho jayega", "khatam ho jayega",
            "kanuni karyavahi", "police case", "giraftari",
            "account band", "suspend ho jayega", "fir hoga",
            "kala suchi mein",
        ],
    ),
    "hindi_otp_personal": (
        18,
        [
            "otp bhejein", "otp batayein", "pin share karein",
            "apna otp dijiye", "code bhejiye", "pan card link",
            "aadhaar link", "apni jaankari dein", "bank details dein",
        ],
    ),
    "hindi_reward": (
        10,
        [
            "aapne jeeta hai", "inaam", "lucky draw",
            "cash prize jeetein", "muft gift", "badhai ho",
            "aapko chuna gaya hai",
        ],
    ),
    "hindi_authority": (
        16,
        [
            "bhartiya reserve bank", "sarkar ki taraf se",
            "income tax vibhag", "police vibhag",
            "cyber cell", "sarkari suchna",
        ],
    ),

    # ------------------------------------------------------------------
    # Call-transcript scam patterns
    # ------------------------------------------------------------------
    "call_transcript": (
        14,
        [
            "press 1 to", "press 2 to", "stay on the line",
            "do not disconnect", "this call is being recorded",
            "transfer to officer", "speak to the officer",
            "your case number is", "federal investigation",
            "we are calling from", "this is a courtesy call",
            "you need to pay immediately",
        ],
    ),
}

# ============================================================================
# SOCIAL IMPERSONATION – compound detection keywords
# ============================================================================

FAMILY_KEYWORDS: list[str] = [
    "hi dad", "hi mom", "hi mummy", "hi papa",
    "dad,", "mom,", "hey dad", "hey mom",
    "hello dad", "hello mom", "papa,", "mummy,",
    "hi papa", "hi mummy",
]

NEW_NUMBER_KEYWORDS: list[str] = [
    "this is my new number", "lost my phone", "new phone",
    "new whatsapp number", "my old number stopped working",
    "changed my number", "new sim", "got a new phone",
    "old phone broken", "phone got stolen",
]

MONEY_REQUEST_KEYWORDS: list[str] = [
    "send", "transfer", "need", "please send",
    "urgent help", "emergency", "send 10", "send rs",
    "send ₹", "google pay", "phonepe", "paytm",
    "bank transfer", "upi", "gpay", "send money",
    "lend me", "need money", "pay for me",
    "bhej do", "paise bhejo", "paise chahiye",
    "transfer karo", "send karo",
]

URGENCY_KEYWORDS_FOR_COMPOUND: list[str] = [
    "urgent", "urgently", "immediately", "right now",
    "asap", "quickly", "fast", "hurry",
    "turant", "abhi", "jaldi", "foran",
    "emergency",
]

SOCIAL_IMPERSONATION_WEIGHT: int = 20
SOCIAL_URGENCY_BOOST: int = 10

# ============================================================================
# DYNAMIC TIME PRESSURE REGEX
# PATCH v5: weight reduced from 15 → 10. Urgency alone should not
# inflate score excessively. The detection patterns are unchanged.
# ============================================================================

DYNAMIC_TIME_PATTERNS: list[re.Pattern] = [
    re.compile(
        r"\bwithin\s+\d+\s*(?:hours?|hrs?|days?|minutes?|mins?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bin\s+\d+\s*(?:hours?|hrs?|days?|minutes?|mins?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bbefore\s+\d{1,2}\s*(?:am|pm)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bby\s+\d{1,2}\s*(?:am|pm)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bby\s+(?:today|tomorrow)\b",
        re.IGNORECASE,
    ),
]

DYNAMIC_URGENCY_WEIGHT: int = 10

# ============================================================================
# COMPOUND FINANCIAL DETECTION PATTERNS
# ============================================================================

_ACCOUNT_RE = re.compile(r"\baccount\b", re.IGNORECASE)
_CONFIRM_VERIFY_UPDATE_RE = re.compile(
    r"\b(?:confirm|verify|update)\b", re.IGNORECASE
)

# Normalisation divisor.
_NORMALISATION_DIVISOR: int = 60

# ============================================================================
# FINANCIAL + DYNAMIC URGENCY ESCALATION FLOOR
# PATCH v5: The raw floor is set so normalised score lands around 60-65,
# NOT at 100.  This is a MINIMUM, not a target.
#   floor_raw / 60 * 100 ~= 62  →  floor_raw = 37
# ============================================================================
_FINANCIAL_DYNAMIC_URGENCY_RAW_FLOOR: int = 37


# ============================================================================
# Word-boundary matching helpers
# ============================================================================

_regex_cache: dict[str, re.Pattern] = {}


def _phrase_to_regex(phrase: str) -> re.Pattern:
    """
    Convert a keyword/phrase to a word-boundary-aware compiled regex.
    """
    if phrase in _regex_cache:
        return _regex_cache[phrase]

    escaped = re.escape(phrase)

    if phrase.endswith(","):
        pattern = r"\b" + escaped
    else:
        pattern = r"\b" + escaped + r"\b"

    compiled = re.compile(pattern, re.IGNORECASE)
    _regex_cache[phrase] = compiled
    return compiled


def _word_boundary_match(phrase: str, text: str) -> bool:
    """
    Return True if *phrase* appears in *text* as a whole-word match.
    """
    regex = _phrase_to_regex(phrase)
    return bool(regex.search(text))


# ============================================================================
# Detection helpers
# ============================================================================

def _detect_keywords(text: str) -> tuple[int, list[str], list[dict[str, str]]]:
    """
    Scan *text* against every category in SCAM_KEYWORDS using
    word-boundary matching.
    """
    raw_score: int = 0
    categories_seen: set[str] = set()
    matched_phrases: list[dict[str, str]] = []

    for category, (weight, phrases) in SCAM_KEYWORDS.items():
        for phrase in phrases:
            if _word_boundary_match(phrase, text):
                raw_score += weight
                categories_seen.add(category)
                matched_phrases.append(
                    {"phrase": phrase, "category": category}
                )

    return raw_score, sorted(categories_seen), matched_phrases


def _detect_dynamic_urgency(text: str) -> tuple[int, list[dict[str, str]]]:
    """
    Detect dynamic time-pressure phrases using regex.
    Only counts ONE hit to avoid over-scoring.
    """
    bonus: int = 0
    phrases: list[dict[str, str]] = []

    for pattern in DYNAMIC_TIME_PATTERNS:
        match = pattern.search(text)
        if match:
            bonus = DYNAMIC_URGENCY_WEIGHT
            phrases.append({
                "phrase": match.group(0),
                "category": "dynamic_urgency",
            })
            break

    return bonus, phrases


def _detect_compound_financial(
    text: str,
    existing_categories: set[str],
    has_dynamic_urgency: bool,
) -> tuple[int, list[dict[str, str]]]:
    """
    Compound detection: "account" + "confirm/verify/update" + time pressure
    → flag as financial_data_request.
    Only triggers if financial_data_request is NOT already detected.
    """
    if "financial_data_request" in existing_categories:
        return 0, []

    has_account = bool(_ACCOUNT_RE.search(text))
    has_action = bool(_CONFIRM_VERIFY_UPDATE_RE.search(text))
    has_time_pressure = has_dynamic_urgency or bool(
        existing_categories & {"urgency", "hindi_urgency"}
    )

    if has_account and has_action and has_time_pressure:
        # Use the reduced weight (16) for compound detection too
        return 16, [
            {"phrase": "account + confirm/verify/update + time pressure",
             "category": "financial_data_request"},
        ]

    return 0, []


def _detect_social_impersonation(
    text: str,
    existing_categories: list[str],
) -> tuple[int, bool, list[dict[str, str]]]:
    """
    Compound detection for social/family impersonation scams.
    """
    found_family = [kw for kw in FAMILY_KEYWORDS if _word_boundary_match(kw, text)]
    found_new_number = [kw for kw in NEW_NUMBER_KEYWORDS if _word_boundary_match(kw, text)]
    found_money = [kw for kw in MONEY_REQUEST_KEYWORDS if _word_boundary_match(kw, text)]
    found_urgency = [kw for kw in URGENCY_KEYWORDS_FOR_COMPOUND if _word_boundary_match(kw, text)]

    has_money_request = len(found_money) > 0
    bonus_score: int = 0
    extra_phrases: list[dict[str, str]] = []
    triggered = False

    def _add_unique(kw: str) -> None:
        if not any(p["phrase"] == kw and p["category"] == "social_impersonation" for p in extra_phrases):
            extra_phrases.append({"phrase": kw, "category": "social_impersonation"})

    if found_family and found_money:
        triggered = True
        for kw in found_family:
            _add_unique(kw)
        for kw in found_money:
            _add_unique(kw)

    if found_new_number and found_urgency:
        triggered = True
        for kw in found_new_number:
            _add_unique(kw)
        for kw in found_urgency:
            _add_unique(kw)

    if found_money and found_urgency:
        triggered = True
        for kw in found_money:
            _add_unique(kw)
        for kw in found_urgency:
            _add_unique(kw)

    if triggered:
        bonus_score += SOCIAL_IMPERSONATION_WEIGHT

    urgency_in_existing = any(
        cat in existing_categories for cat in ("urgency", "hindi_urgency")
    )
    if triggered and (urgency_in_existing or found_urgency):
        bonus_score += SOCIAL_URGENCY_BOOST

    return bonus_score, has_money_request, extra_phrases


def _has_otp_request(matched_categories: list[str]) -> bool:
    """Check whether OTP-related categories were triggered."""
    otp_cats = {"otp", "hindi_otp_personal"}
    return bool(otp_cats & set(matched_categories))


# ============================================================================
# Public API
# ============================================================================

def analyze(text: str) -> dict[str, Any]:
    """
    Run rule-based analysis on *text*.

    Returns
    -------
    dict
        score                      – int 0-100 (normalised)
        categories                 – list[str]
        matched_phrases            – list[dict]
        flags.has_otp              – bool
        flags.has_suspicious_url   – bool
        flags.has_money_request    – bool
        flags.has_financial_request – bool
        flags.has_dynamic_urgency  – bool
        url_analysis               – full output from url_scanner
    """
    # --- keyword detection (word-boundary safe) ------------------------------
    raw_score, categories, matched_phrases = _detect_keywords(text)

    # --- dynamic urgency regex -----------------------------------------------
    dyn_bonus, dyn_phrases = _detect_dynamic_urgency(text)
    raw_score += dyn_bonus
    matched_phrases.extend(dyn_phrases)
    has_dynamic_urgency = dyn_bonus > 0
    if has_dynamic_urgency:
        categories = sorted(set(categories) | {"dynamic_urgency"})

    # --- compound financial detection ----------------------------------------
    cats_set = set(categories)
    compound_bonus, compound_phrases = _detect_compound_financial(
        text, cats_set, has_dynamic_urgency
    )
    raw_score += compound_bonus
    matched_phrases.extend(compound_phrases)
    if compound_bonus > 0:
        categories = sorted(set(categories) | {"financial_data_request"})
        cats_set.add("financial_data_request")

    # --- social impersonation compound detection ------------------------------
    social_bonus, has_money_request, social_phrases = _detect_social_impersonation(
        text, categories
    )
    raw_score += social_bonus
    matched_phrases.extend(social_phrases)
    if social_bonus > 0:
        categories = sorted(set(categories) | {"social_impersonation"})
        cats_set.add("social_impersonation")

    # --- URL scanning --------------------------------------------------------
    url_result = scan_urls(text)
    url_score: int = url_result["url_score"]
    raw_score += url_score
    if url_result["suspicious_urls"]:
        categories = sorted(set(categories) | {"suspicious_url"})

    # --- Flags ---------------------------------------------------------------
    has_financial_request = "financial_data_request" in set(categories)
    has_any_urgency = bool(
        {"urgency", "hindi_urgency", "dynamic_urgency"} & set(categories)
    )

    # --- Financial + urgency floor (MINIMUM only, never forces to ceiling) ---
    # PATCH v5: This floor ensures financial scams with urgency don't drop
    # below ~62 normalised, but does NOT inflate them to 100.
    # The floor is applied to raw_score BEFORE normalisation so the result
    # scales naturally with the divisor.
    if has_financial_request and has_any_urgency:
        raw_score = max(raw_score, _FINANCIAL_DYNAMIC_URGENCY_RAW_FLOOR)

    # --- Normalise to 0-100 --------------------------------------------------
    # PATCH v5: No forced raw_score = 100 anywhere.  The normalisation
    # formula is the sole determinant of the final rule score.
    normalised = int(min((raw_score / _NORMALISATION_DIVISOR) * 100, 100))

    # --- Build flags dict ----------------------------------------------------
    has_otp = _has_otp_request(categories)
    has_suspicious_url = len(url_result["suspicious_urls"]) > 0

    return {
        "score": normalised,
        "categories": categories,
        "matched_phrases": matched_phrases,
        "flags": {
            "has_otp": has_otp,
            "has_suspicious_url": has_suspicious_url,
            "has_money_request": has_money_request,
            "has_financial_request": has_financial_request,
            "has_dynamic_urgency": has_dynamic_urgency,
        },
        "url_analysis": url_result,
    }


# ============================================================================
# TEST CASES (comment block – not runtime code)
# ============================================================================
#
# === SCORING PROPORTIONALITY TESTS (v5) ===
#
# 1. Refund Phish (no URL, no OTP):
#    "Your refund could not be processed.
#     Confirm your account information to prevent cancellation."
#    → financial_data_request, score 60-75, Medium/High, NOT 100
#
# 2. Vendor Scam (no URL, no OTP):
#    "We are unable to process your vendor payment.
#     Please update bank details within 24 hours."
#    → financial_data_request + dynamic_urgency, score 65-80, High, NOT 100
#
# 3. Vendor + Suspicious URL:
#    "Update bank details within 24 hours at https://hdfc-secure-update.co.in"
#    → financial_data_request + dynamic_urgency + suspicious_url
#    → score 85-95, High/Critical
#
# 4. OTP + Suspicious URL:
#    "Share OTP immediately at http://fake-bank.in"
#    → OTP + suspicious URL override, score ≥ 90, Critical
#
# 5. Legitimate Reminder:
#    "Reminder: Your gym membership renews tomorrow."
#    → no categories, score 0-10, Low
#
# === LEGACY TESTS (still valid) ===
#
# 6. Social impersonation:
#    "Hi Dad I lost my phone send 10000 urgently"
#    → social_impersonation + urgency, has_money_request: True
#
# 7. Authority + fear + KYC:
#    "Your SBI account blocked due to KYC expiry click link to verify"
#    → authority_impersonation + fear + kyc_scam
#
# 8. Substring safety:
#    "Please confirm your booking for tomorrow."
#    → "fir" must NOT appear in matched phrases, Low
#
# 9. Invoice fraud:
#    "Invoice overdue. Wire transfer funds by tomorrow to avoid penalty."
#    → financial_data_request + dynamic_urgency + fear, 65-80
#
# 10. Full stacked phishing (all signals):
#     "Dear customer, your SBI account has been blocked due to KYC expiry.
#      Share OTP and click http://sbi-kyc-update.in to verify immediately
#      or account will be permanently closed within 24 hours."
#     → OTP + URL + authority + fear + urgency + KYC, score 95-100, Critical