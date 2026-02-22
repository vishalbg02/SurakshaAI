"""
rule_engine.py
--------------
Rule-based fraud detection engine.
Maintains keyword dictionaries for multiple scam categories in both
English and Hindi/Hinglish.  Each category carries a configurable weight.
Detection is case-insensitive.

Delegates URL scanning to url_scanner.py.

ENHANCEMENT v2:
  - Added social_impersonation category (weight 20)
  - Added family keyword + money request compound detection
  - Added secondary boost rule (social_impersonation + urgency = +10)
  - Added has_money_request flag
  - Improved scoring realism for compound scam patterns

Returns a normalised score (0-100), matched phrases with categories,
and boolean flags for OTP presence, suspicious URL detection,
and money request detection.
"""

from __future__ import annotations

import re
from typing import Any

from url_scanner import scan_urls

# ============================================================================
# KEYWORD DICTIONARIES  –  { category: (weight, [phrases]) }
# weight represents how much a single hit in that category contributes
# to the raw score.
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
# SOCIAL IMPERSONATION – compound detection keywords
# These are NOT added to SCAM_KEYWORDS because detection requires
# compound logic (family + money, or new_number + urgency).
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

# Maximum possible raw score normalisation divisor.
# Tuned so that hitting 3-4 categories comfortably pushes
# the score into the 60-90 range.
_NORMALISATION_DIVISOR: int = 60


# ============================================================================
# Detection helpers
# ============================================================================

def _detect_keywords(text: str) -> tuple[int, list[str], list[dict[str, str]]]:
    """
    Scan *text* against every category in SCAM_KEYWORDS and return:
      raw_score, matched_categories, matched_phrases_list
    """
    text_lower = text.lower()
    raw_score: int = 0
    categories_seen: set[str] = set()
    matched_phrases: list[dict[str, str]] = []

    for category, (weight, phrases) in SCAM_KEYWORDS.items():
        for phrase in phrases:
            if phrase.lower() in text_lower:
                raw_score += weight
                categories_seen.add(category)
                matched_phrases.append(
                    {"phrase": phrase, "category": category}
                )

    return raw_score, sorted(categories_seen), matched_phrases


def _detect_social_impersonation(
    text: str,
    existing_categories: list[str],
) -> tuple[int, bool, list[dict[str, str]]]:
    """
    Compound detection for social/family impersonation scams.

    Detection triggers if ANY of:
      1. family_keyword AND money_request_keyword found
      2. new_number_keyword AND urgency_keyword found
      3. money_request_keyword AND urgency_keyword found

    Returns:
      bonus_score  – int to add to raw_score
      has_money_request – bool flag
      extra_matched_phrases – list of matched phrase dicts
    """
    text_lower = text.lower()

    # Check each keyword group
    found_family: list[str] = [kw for kw in FAMILY_KEYWORDS if kw.lower() in text_lower]
    found_new_number: list[str] = [kw for kw in NEW_NUMBER_KEYWORDS if kw.lower() in text_lower]
    found_money: list[str] = [kw for kw in MONEY_REQUEST_KEYWORDS if kw.lower() in text_lower]
    found_urgency: list[str] = [kw for kw in URGENCY_KEYWORDS_FOR_COMPOUND if kw.lower() in text_lower]

    has_money_request = len(found_money) > 0
    bonus_score: int = 0
    extra_phrases: list[dict[str, str]] = []
    triggered = False

    # Compound condition 1: family + money
    if found_family and found_money:
        triggered = True
        for kw in found_family:
            extra_phrases.append({"phrase": kw, "category": "social_impersonation"})
        for kw in found_money:
            extra_phrases.append({"phrase": kw, "category": "social_impersonation"})

    # Compound condition 2: new_number + urgency
    if found_new_number and found_urgency:
        triggered = True
        for kw in found_new_number:
            extra_phrases.append({"phrase": kw, "category": "social_impersonation"})
        for kw in found_urgency:
            # Only add if not already added by another category
            if not any(p["phrase"] == kw and p["category"] == "social_impersonation" for p in extra_phrases):
                extra_phrases.append({"phrase": kw, "category": "social_impersonation"})

    # Compound condition 3: money + urgency
    if found_money and found_urgency:
        triggered = True
        for kw in found_money:
            if not any(p["phrase"] == kw and p["category"] == "social_impersonation" for p in extra_phrases):
                extra_phrases.append({"phrase": kw, "category": "social_impersonation"})
        for kw in found_urgency:
            if not any(p["phrase"] == kw and p["category"] == "social_impersonation" for p in extra_phrases):
                extra_phrases.append({"phrase": kw, "category": "social_impersonation"})

    if triggered:
        bonus_score += SOCIAL_IMPERSONATION_WEIGHT

    # --- Secondary boost: social_impersonation + urgency ---
    # If social impersonation was triggered AND urgency is present
    # (either from SCAM_KEYWORDS urgency category or compound detection),
    # apply an additional +10 boost.
    urgency_in_existing = any(
        cat in existing_categories
        for cat in ("urgency", "hindi_urgency")
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
        score              – int 0-100 (normalised)
        categories         – list[str]
        matched_phrases    – list[dict] each with 'phrase' and 'category'
        flags.has_otp      – bool
        flags.has_suspicious_url – bool
        flags.has_money_request  – bool  (NEW in v2)
        url_analysis       – full output from url_scanner
    """
    # --- keyword detection ---------------------------------------------------
    raw_score, categories, matched_phrases = _detect_keywords(text)

    # --- social impersonation compound detection (NEW) -----------------------
    social_bonus, has_money_request, social_phrases = _detect_social_impersonation(
        text, categories
    )
    raw_score += social_bonus
    matched_phrases.extend(social_phrases)
    if social_bonus > 0:
        categories = sorted(set(categories) | {"social_impersonation"})

    # --- URL scanning --------------------------------------------------------
    url_result = scan_urls(text)
    url_score: int = url_result["url_score"]

    # Merge URL score into raw_score
    raw_score += url_score
    if url_result["suspicious_urls"]:
        categories = sorted(set(categories) | {"suspicious_url"})

    # --- normalise to 0-100 --------------------------------------------------
    normalised = int(min((raw_score / _NORMALISATION_DIVISOR) * 100, 100))

    # --- flags ---------------------------------------------------------------
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
        },
        "url_analysis": url_result,
    }


# ============================================================================
# TEST CASES (comment block – not runtime code)
# ============================================================================
#
# Example messages and expected categories:
#
# 1. Social impersonation + urgency:
#    "Hi Dad I lost my phone send 10000 urgently"
#    → Expected: social_impersonation + urgency
#    → has_money_request: True
#    → Score: High (social weight 20 + urgency 12 + boost 10 = 42 raw → ~70)
#
# 2. Authority + fear + KYC:
#    "Your SBI account blocked due to KYC expiry click link to verify"
#    → Expected: authority_impersonation + fear + kyc_scam
#    → has_money_request: False
#
# 3. Reward scam:
#    "Congratulations you won 500 reward points"
#    → Expected: reward_scam
#    → has_money_request: False
#
# 4. WhatsApp impersonation:
#    "Hi mom this is my new number. My old number stopped working.
#     Can you please send Rs 5000 on Google Pay? Need it urgently."
#    → Expected: social_impersonation + urgency
#    → has_money_request: True
#    → Score: Very High (family + new_number + money + urgency all trigger)
#
# 5. Legitimate message:
#    "Your Amazon order #402-1234567 has been shipped."
#    → Expected: no categories
#    → Score: 0 (Low)
#
# 6. Hindi social impersonation:
#    "Papa mera phone kho gaya hai. Jaldi paise bhejo Google Pay pe."
#    → Expected: social_impersonation + hindi_urgency
#    → has_money_request: True