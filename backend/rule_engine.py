"""
rule_engine.py
--------------
Rule-based fraud detection engine.
Maintains keyword dictionaries for multiple scam categories in both
English and Hindi/Hinglish.  Each category carries a configurable weight.
Detection is case-insensitive.

Delegates URL scanning to url_scanner.py.

Returns a normalised score (0-100), matched phrases with categories,
and boolean flags for OTP presence and suspicious URL detection.
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

# Maximum possible raw score if EVERY phrase in EVERY category matched.
# We use a softer normalisation: score = (raw / _NORMALISATION_DIVISOR) * 100
# capped at 100.  The divisor is tuned so that hitting 3-4 categories
# comfortably pushes the score into the 60-90 range.
_NORMALISATION_DIVISOR: int = 60


# ============================================================================
# Detection helpers
# ============================================================================

def _detect_keywords(text: str) -> tuple[int, list[str], list[dict[str, str]]]:
    """
    Scan *text* against every category and return:
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
        url_analysis       – full output from url_scanner
    """
    # --- keyword detection ---------------------------------------------------
    raw_score, categories, matched_phrases = _detect_keywords(text)

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
        },
        "url_analysis": url_result,
    }