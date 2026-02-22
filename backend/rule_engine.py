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

PATCH v6 (CONTEXT-AWARE FINANCIAL DETECTION):
  - Split financial keywords into neutral terms vs action verbs
  - financial_data_request ONLY triggers on compound match:
      (neutral financial term) + (action verb)
      OR (financial term) + (dynamic urgency)
      OR (financial term) + (URL detected)
      OR (financial term) + (OTP detected)
  - Standalone neutral financial mentions produce score 0
  - Added negative-intent suppression (successfully, completed, etc.)
  - Preserves all strong cases: refund phish, vendor scam, OTP, etc.
  - No changes to thresholds, overrides, fusion, or URL scanner

PATCH v7 (SOCIAL IMPERSONATION MONEY DETECTION):
  - Added numeric money pattern detection (3+ digit numbers) to
    _detect_social_impersonation for reliable has_money_request flagging
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
# CONTEXT-AWARE FINANCIAL DETECTION (v6)
# ============================================================================
# financial_data_request is NO LONGER in SCAM_KEYWORDS.
# It is detected separately via compound logic below.
#
# Split into two concept groups:
#   1. NEUTRAL financial terms — benign on their own
#   2. ACTION verbs — indicate the sender wants the victim to DO something
#
# financial_data_request triggers ONLY when:
#   (neutral term) + (action verb)
#   OR (neutral term) + (dynamic urgency)
#   OR (neutral term) + (suspicious URL)
#   OR (neutral term) + (OTP request)
# ============================================================================

FINANCIAL_NEUTRAL_TERMS: list[str] = [
    "refund", "payment", "vendor payment", "bank details",
    "bank account", "transaction", "billing", "invoice",
    "wire transfer", "transfer funds", "account information",
    "account details", "payment method", "payment failed",
    "payment rejected", "payment pending", "processing issue",
    "billing issue", "refund could not be processed",
    "vendor", "salary", "credited", "processed",
    "invoice overdue",
]

FINANCIAL_ACTION_VERBS: list[str] = [
    "confirm", "update", "verify", "submit", "provide",
    "share", "re-enter", "click", "enter", "complete",
    "avoid cancellation", "prevent cancellation",
    "to avoid cancellation", "avoid account closure",
    "account closure", "temporary suspension",
    "account restricted",
]

FINANCIAL_WEIGHT: int = 16

# Negative-intent phrases: if these appear AND no action verbs are found,
# suppress financial_data_request entirely.
NEGATIVE_INTENT_PHRASES: list[str] = [
    "successfully",
    "completed",
    "no further action required",
    "no action required",
    "thank you",
    "has been credited",
    "has been processed successfully",
    "has been processed",
    "payment successful",
    "processed successfully",
    "successfully processed",
    "no action needed",
    "no further action needed",
    "refund processed",
    "refund completed",
    "salary credited",
    "invoice paid",
    "payment completed",
]


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
# COMPOUND FINANCIAL DETECTION PATTERNS (legacy, kept for account+action)
# ============================================================================

_ACCOUNT_RE = re.compile(r"\baccount\b", re.IGNORECASE)
_CONFIRM_VERIFY_UPDATE_RE = re.compile(
    r"\b(?:confirm|verify|update)\b", re.IGNORECASE
)

# Normalisation divisor.
_NORMALISATION_DIVISOR: int = 60

# ============================================================================
# FINANCIAL + DYNAMIC URGENCY RAW FLOOR
# ============================================================================
_FINANCIAL_DYNAMIC_URGENCY_RAW_FLOOR: int = 37


# ============================================================================
# Word-boundary matching helpers
# ============================================================================

_regex_cache: dict[str, re.Pattern] = {}


def _phrase_to_regex(phrase: str) -> re.Pattern:
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
    regex = _phrase_to_regex(phrase)
    return bool(regex.search(text))


# ============================================================================
# Detection helpers
# ============================================================================

def _detect_keywords(text: str) -> tuple[int, list[str], list[dict[str, str]]]:
    """
    Scan *text* against every category in SCAM_KEYWORDS.
    NOTE: financial_data_request is NOT in SCAM_KEYWORDS anymore.
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


def _detect_context_aware_financial(
    text: str,
    has_dynamic_urgency: bool,
    has_suspicious_url: bool,
    has_otp: bool,
) -> tuple[int, list[dict[str, str]]]:
    """
    Context-aware financial detection (v6).

    Returns (score_bonus, matched_phrases).

    financial_data_request triggers ONLY when a neutral financial
    term co-occurs with at least one escalation signal:
      - An action verb (confirm, update, verify, etc.)
      - Dynamic urgency (within X hours, etc.)
      - A suspicious URL
      - An OTP request

    If negative-intent phrases are present AND no action verbs
    are found, detection is suppressed entirely.
    """
    # Step 1: Find all neutral financial terms present
    found_neutral: list[str] = []
    for term in FINANCIAL_NEUTRAL_TERMS:
        if _word_boundary_match(term, text):
            found_neutral.append(term)

    if not found_neutral:
        return 0, []

    # Step 2: Find all action verbs present
    found_actions: list[str] = []
    for verb in FINANCIAL_ACTION_VERBS:
        if _word_boundary_match(verb, text):
            found_actions.append(verb)

    # Step 3: Check negative intent
    has_negative_intent = False
    for neg_phrase in NEGATIVE_INTENT_PHRASES:
        if _word_boundary_match(neg_phrase, text):
            has_negative_intent = True
            break

    # Step 4: If negative intent present AND no action verbs AND
    # no urgency/URL/OTP → suppress completely
    if has_negative_intent and not found_actions and not has_dynamic_urgency and not has_suspicious_url and not has_otp:
        return 0, []

    # Step 5: Check compound conditions
    has_compound = False
    compound_reason = ""

    if found_actions:
        has_compound = True
        compound_reason = f"financial term + action verb ({found_actions[0]})"
    elif has_dynamic_urgency:
        has_compound = True
        compound_reason = "financial term + dynamic urgency"
    elif has_suspicious_url:
        has_compound = True
        compound_reason = "financial term + suspicious URL"
    elif has_otp:
        has_compound = True
        compound_reason = "financial term + OTP request"

    if not has_compound:
        # Neutral financial terms alone → no trigger
        return 0, []

    # Step 6: Build matched phrases
    matched: list[dict[str, str]] = []
    for term in found_neutral:
        matched.append({"phrase": term, "category": "financial_data_request"})
    for verb in found_actions:
        matched.append({"phrase": verb, "category": "financial_data_request"})

    # Add a compound-reason entry for explainability
    matched.append({
        "phrase": compound_reason,
        "category": "financial_data_request",
    })

    return FINANCIAL_WEIGHT, matched


def _detect_compound_financial_legacy(
    text: str,
    existing_categories: set[str],
    has_dynamic_urgency: bool,
) -> tuple[int, list[dict[str, str]]]:
    """
    Legacy compound detection: "account" + "confirm/verify/update" + time pressure.
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
        return FINANCIAL_WEIGHT, [
            {"phrase": "account + confirm/verify/update + time pressure",
             "category": "financial_data_request"},
        ]

    return 0, []


def _detect_social_impersonation(
    text: str,
    existing_categories: list[str],
) -> tuple[int, bool, list[dict[str, str]]]:
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

    # PATCH v7: Detect numeric money pattern (₹, rs, or 3+ digit number)
    # to reliably set has_money_request when social impersonation is triggered
    money_pattern = re.search(r"\b\d{3,}\b", text)
    if triggered and money_pattern:
        has_money_request = True

    return bonus_score, has_money_request, extra_phrases


def _has_otp_request(matched_categories: list[str]) -> bool:
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

    # --- URL scanning --------------------------------------------------------
    url_result = scan_urls(text)
    url_score: int = url_result["url_score"]
    raw_score += url_score
    if url_result["suspicious_urls"]:
        categories = sorted(set(categories) | {"suspicious_url"})

    has_suspicious_url = len(url_result["suspicious_urls"]) > 0

    # --- OTP detection (needed before financial check) -----------------------
    has_otp = _has_otp_request(categories)

    # --- context-aware financial detection (v6) ------------------------------
    cats_set = set(categories)
    fin_bonus, fin_phrases = _detect_context_aware_financial(
        text, has_dynamic_urgency, has_suspicious_url, has_otp
    )
    raw_score += fin_bonus
    matched_phrases.extend(fin_phrases)
    if fin_bonus > 0:
        categories = sorted(set(categories) | {"financial_data_request"})
        cats_set.add("financial_data_request")

    # --- legacy compound financial (account + action + urgency) ---------------
    compound_bonus, compound_phrases = _detect_compound_financial_legacy(
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

    # --- Flags ---------------------------------------------------------------
    has_financial_request = "financial_data_request" in set(categories)
    has_any_urgency = bool(
        {"urgency", "hindi_urgency", "dynamic_urgency"} & set(categories)
    )

    # --- Financial + urgency floor (MINIMUM only) ----------------------------
    if has_financial_request and has_any_urgency:
        raw_score = max(raw_score, _FINANCIAL_DYNAMIC_URGENCY_RAW_FLOOR)

    # --- Normalise to 0-100 --------------------------------------------------
    normalised = int(min((raw_score / _NORMALISATION_DIVISOR) * 100, 100))

    # --- Build flags dict ----------------------------------------------------
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
# TEST CASES (v6 — context-aware financial detection)
# ============================================================================
#
# === FALSE POSITIVE PREVENTION ===
#
# 1. Neutral vendor confirmation (MUST be LOW):
#    "We have processed your vendor payment successfully. No further action is required."
#    → score: 0, categories: [], risk: Low
#    Reason: "vendor payment" + "processed" + "successfully" + "no further action"
#            = neutral term + negative intent + no action verbs → SUPPRESSED
#
# 2. Salary notification (MUST be LOW):
#    "Your salary of ₹45,000 has been credited to your account."
#    → score: 0, categories: [], risk: Low
#    Reason: "salary" + "credited" = neutral term + negative intent → SUPPRESSED
#
# 3. Refund completed (MUST be LOW):
#    "Your refund of ₹2,499 has been processed successfully. Thank you."
#    → score: 0, categories: [], risk: Low
#    Reason: "refund" + "processed successfully" + "thank you" → SUPPRESSED
#
# 4. Invoice paid (MUST be LOW):
#    "Invoice #4829 has been paid. No action needed."
#    → score: 0, categories: [], risk: Low
#
# 5. Membership reminder (MUST be LOW):
#    "Reminder: Your gym membership renews tomorrow."
#    → score: 0, categories: [], risk: Low
#
# === STRONG DETECTION PRESERVATION ===
#
# 6. Refund phishing (MUST be HIGH):
#    "Your refund could not be processed.
#     Confirm your bank details within 6 hours."
#    → financial_data_request (refund + confirm + within 6 hours)
#    → score: 60-80, risk: High
#
# 7. Vendor update scam (MUST be HIGH):
#    "We are unable to process your vendor payment.
#     Please update bank details within 24 hours."
#    → financial_data_request (vendor payment + update + within 24 hours)
#    → score: 65-80, risk: High
#
# 8. Bank phishing with URL (MUST be HIGH/CRITICAL):
#    "Your HDFC account has been restricted.
#     Verify immediately at https://fake-bank.co.in"
#    → authority_impersonation + fear + urgency + suspicious_url
#    → score: 85-95, risk: High/Critical
#
# 9. OTP + URL (MUST be CRITICAL):
#    "Share OTP immediately at http://secure-update.in"
#    → OTP + URL override → score: ≥90, risk: Critical
#
# 10. Full stacked phishing (MUST be CRITICAL):
#     "Dear customer, your SBI account has been blocked due to KYC expiry.
#      Share OTP and click http://sbi-kyc-update.in to verify immediately
#      or account will be permanently closed within 24 hours."
#     → OTP + URL + authority + fear + urgency + KYC → 95-100, Critical
#
# 11. Vendor + URL (MUST be HIGH/CRITICAL):
#     "Update bank details within 24 hours at https://hdfc-secure-update.co.in"
#     → financial_data_request + dynamic_urgency + suspicious_url
#     → score: 85-95, risk: High/Critical
#
# 12. Standalone financial term, no action (MUST be LOW):
#     "Your payment was successful."
#     → score: 0, categories: [], risk: Low
#
# 13. Financial term + action verb, no urgency (MUST be MEDIUM):
#     "Please confirm your account details."
#     → financial_data_request (confirm = action verb)
#     → score: ~26, risk: Low/Medium
#
# 14. Social impersonation (MUST detect):
#     "Hi Dad I lost my phone send 10000 urgently"
#     → social_impersonation + urgency, has_money_request: True
#
# 15. Confirm + avoid cancellation (MUST be HIGH):
#     "Confirm your bank details within 6 hours to avoid cancellation."
#     → financial_data_request (confirm + avoid cancellation + within 6 hours)
#     → score: 70-85, risk: High/Critical