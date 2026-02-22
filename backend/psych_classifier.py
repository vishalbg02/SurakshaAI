"""
psych_classifier.py
--------------------
Detects psychological manipulation tactics used in scam messages.

Categories
----------
- Fear                      – threats of loss, legal action, account closure
- Urgency                   – time pressure, countdown, deadlines
- Authority                 – impersonation of banks, government, police
- Reward                    – promises of prizes, gifts, money
- Scarcity                  – limited availability, exclusive offers
- Emotional Manipulation    – family impersonation, trust exploitation (v2)
- Financial Pressure (v3)   – refund/billing threats to create monetary fear

ENHANCEMENT v3 (HARDENING):
  - Migrated ALL matching to word-boundary regex (\b...\b)
  - Eliminated substring false positives ("fir" inside "confirm")
  - Expanded Fear triggers with soft coercion phrases
  - Added Financial Pressure category (weight 25)

Returns a psych_score (0-100) and human-readable explanation.
"""

from __future__ import annotations

import re
from typing import Any

# ============================================================================
# Word-boundary matching (replaces raw substring matching)
# ============================================================================

_psych_regex_cache: dict[str, re.Pattern] = {}


def _psych_word_match(keyword: str, text: str) -> bool:
    """
    Word-boundary match for psychological keywords.
    Prevents substring false positives (e.g. "fir" inside "confirm",
    "arrest" inside "arrested" is fine because both are the same root).

    Multi-word phrases get \b at start and end only.
    """
    if keyword not in _psych_regex_cache:
        escaped = re.escape(keyword)
        _psych_regex_cache[keyword] = re.compile(
            r"\b" + escaped + r"\b", re.IGNORECASE
        )
    return bool(_psych_regex_cache[keyword].search(text))


# ============================================================================
# Psychological trigger keyword banks
# Each category maps to (weight_per_hit, keyword_list).
# ============================================================================

PSYCH_TRIGGERS: dict[str, tuple[int, list[str]]] = {
    "Fear": (
        18,
        [
            # English
            "blocked", "suspended", "terminated", "legal action",
            "arrest", "police", "fir registered", "penalty", "blacklisted",
            "fraud detected", "unauthorized access", "security alert",
            "compromised", "investigation", "frozen",
            "permanently closed", "will be deactivated",
            # v3 expanded fear triggers
            "account closure", "avoid cancellation", "failure to comply",
            "account suspended", "temporary restriction",
            "service termination", "final warning",
            "immediate action required",
            # Hindi/Hinglish
            "band ho jayega", "block ho jayega", "giraftari",
            "kanuni karyavahi", "khatam ho jayega", "suspend",
            "fir hoga", "police case",
        ],
    ),
    "Urgency": (
        14,
        [
            # English
            "immediately", "urgent", "right now", "within 24 hours",
            "act now", "last chance", "hurry", "time is running out",
            "expires today", "limited time", "final warning",
            "action required", "do it now", "before it's too late",
            # Hindi/Hinglish
            "turant", "abhi", "jaldi", "foran", "jaldi karein",
            "waqt khatam", "der mat karo", "jald se jald",
        ],
    ),
    "Authority": (
        16,
        [
            # English
            "reserve bank", "rbi", "income tax", "government",
            "sbi", "hdfc bank", "icici bank", "customs",
            "police department", "cyber crime", "trai",
            "ministry of finance", "sebi", "epfo",
            # Hindi/Hinglish
            "bhartiya reserve bank", "sarkar", "sarkari suchna",
            "income tax vibhag", "police vibhag", "cyber cell",
        ],
    ),
    "Reward": (
        12,
        [
            # English
            "you have won", "congratulations", "lucky winner",
            "claim your prize", "gift card", "cash prize",
            "lottery", "reward points", "free gift",
            "selected for a reward", "bonus credited", "cashback",
            # Hindi/Hinglish
            "aapne jeeta hai", "inaam", "lucky draw",
            "muft gift", "badhai ho", "aapko chuna gaya hai",
        ],
    ),
    "Scarcity": (
        10,
        [
            # English
            "limited offer", "only a few left", "exclusive access",
            "first come first served", "once in a lifetime",
            "available for today only", "while stocks last",
            "limited seats", "offer ending soon",
            # Hindi/Hinglish
            "sirf aaj ke liye", "simit samay", "pehle aao pehle pao",
            "ant mein", "khatam hone wala hai",
        ],
    ),

    # v2: Emotional Manipulation
    "Emotional Manipulation": (
        20,
        [
            "hi dad", "hi mom", "hi papa", "hi mummy",
            "lost phone", "lost my phone", "new number",
            "new phone", "this is my new number",
            "old number stopped working",
            "help", "emergency", "urgently need",
            "please help", "need your help",
            "i'm in trouble", "stuck somewhere",
            "madad karo", "mushkil mein", "phone kho gaya",
            "naya number", "meri madad karo",
        ],
    ),

    # ------------------------------------------------------------------
    # NEW v3: Financial Pressure
    # Detects attempts to create monetary fear/anxiety.
    # Higher weight (25) because financial pressure combined with
    # action demands is a hallmark of refund phishing and billing scams.
    # ------------------------------------------------------------------
    "Financial Pressure": (
        25,
        [
            "refund", "refund failed", "refund rejected",
            "payment failed", "payment declined",
            "transaction declined", "transaction failed",
            "billing issue", "billing problem",
            "update payment", "update payment method",
            "processing issue", "processing error",
            "avoid cancellation", "to avoid cancellation",
            "account closure", "avoid account closure",
            "temporary suspension", "account restricted",
        ],
    ),
}

# Normalisation divisor
_NORMALISATION_DIVISOR: int = 50


# ============================================================================
# Compound financial pressure detection (NEW v3)
# ============================================================================

_FIN_COMPOUND_PAIRS: list[tuple[str, str]] = [
    ("refund", "confirm"),
    ("rejected", "verify"),
    ("billing", "update"),
    ("payment", "confirm"),
    ("payment", "verify"),
    ("transaction", "verify"),
]


def _detect_financial_pressure_compound(text: str) -> bool:
    """
    Return True if text contains a compound financial pressure pattern
    (e.g. "refund" + "confirm" both present).
    """
    for word_a, word_b in _FIN_COMPOUND_PAIRS:
        if _psych_word_match(word_a, text) and _psych_word_match(word_b, text):
            return True
    return False


# ============================================================================
# Explanation templates
# ============================================================================

_EMOTIONAL_EXPLANATION = (
    "This message attempts emotional manipulation by impersonating "
    "a trusted contact and requesting urgent assistance. Scammers "
    "exploit familial trust to bypass rational verification steps."
)

_FINANCIAL_PRESSURE_EXPLANATION = (
    "This message creates financial pressure by suggesting loss of money "
    "or a failed refund unless immediate action is taken. This is a common "
    "tactic in refund phishing and billing scams."
)


# ============================================================================
# Public API
# ============================================================================

def classify(text: str) -> dict[str, Any]:
    """
    Analyse *text* for psychological manipulation tactics.

    Returns
    -------
    dict
        psych_score  – int   0-100
        categories   – list[str]  matched psychological categories
        explanation  – str   human-readable summary
    """
    raw_score: int = 0
    triggered_categories: list[str] = []
    detail_parts: list[str] = []

    for category, (weight, keywords) in PSYCH_TRIGGERS.items():
        hits: list[str] = []
        for kw in keywords:
            # Word-boundary matching prevents substring false positives
            if _psych_word_match(kw, text):
                hits.append(kw)
                raw_score += weight

        if hits:
            triggered_categories.append(category)
            detail_parts.append(
                f"{category}: detected phrases – {', '.join(hits)}"
            )

    # Compound financial pressure detection (NEW v3)
    # If compound pair found but Financial Pressure not already triggered,
    # add it with its weight
    if "Financial Pressure" not in triggered_categories:
        if _detect_financial_pressure_compound(text):
            triggered_categories.append("Financial Pressure")
            raw_score += 25
            detail_parts.append(
                "Financial Pressure: compound pattern detected "
                "(financial term + action verb)"
            )

    # Normalise to 0-100
    psych_score: int = int(min((raw_score / _NORMALISATION_DIVISOR) * 100, 100))

    # Build explanation
    if triggered_categories:
        # Prioritise specific explanations for key categories
        preambles: list[str] = []
        if "Emotional Manipulation" in triggered_categories:
            preambles.append(_EMOTIONAL_EXPLANATION)
        if "Financial Pressure" in triggered_categories:
            preambles.append(_FINANCIAL_PRESSURE_EXPLANATION)

        if preambles:
            explanation = (
                " ".join(preambles) + " "
                + "Detailed analysis: "
                + "; ".join(detail_parts)
                + "."
            )
        else:
            explanation = (
                "This message employs psychological manipulation tactics. "
                + "; ".join(detail_parts)
                + "."
            )
    else:
        explanation = "No significant psychological manipulation tactics detected."

    return {
        "psych_score": psych_score,
        "categories": triggered_categories,
        "explanation": explanation,
    }