"""
psych_classifier.py
--------------------
Detects psychological manipulation tactics used in scam messages.

Categories
----------
- Fear              – threats of loss, legal action, account closure
- Urgency           – time pressure, countdown, deadlines
- Authority         – impersonation of banks, government, police
- Reward            – promises of prizes, gifts, money
- Scarcity          – limited availability, exclusive offers
- Emotional Manipulation (NEW v2) – family impersonation, trust exploitation

Returns a psych_score (0-100) and human-readable explanation.
"""

from __future__ import annotations

from typing import Any

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
            "arrest", "police", "fir", "penalty", "blacklisted",
            "fraud detected", "unauthorized access", "security alert",
            "compromised", "investigation", "frozen",
            "permanently closed", "will be deactivated",
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

    # ------------------------------------------------------------------
    # NEW v2: Emotional Manipulation
    # Detects attempts to exploit trust and familial bonds.
    # Higher weight (20) because emotional manipulation targeting
    # family relationships is one of the most effective scam tactics.
    # ------------------------------------------------------------------
    "Emotional Manipulation": (
        20,
        [
            # Family impersonation triggers
            "dad", "mom", "papa", "mummy",
            "hi dad", "hi mom", "hi papa", "hi mummy",
            # Trust exploitation
            "lost phone", "lost my phone", "new number",
            "new phone", "this is my new number",
            "old number stopped working",
            # Urgency-emotional blend
            "help", "emergency", "urgently need",
            "please help", "need your help",
            "i'm in trouble", "stuck somewhere",
            # Hindi/Hinglish emotional
            "madad karo", "mushkil mein", "phone kho gaya",
            "naya number", "meri madad karo",
        ],
    ),
}

# Normalisation divisor – tuned so that 2-3 categories with a handful of
# hits reach a psych_score around 60-80.
_NORMALISATION_DIVISOR: int = 50


# ============================================================================
# Emotional manipulation – specific explanation template
# ============================================================================

_EMOTIONAL_EXPLANATION = (
    "This message attempts emotional manipulation by impersonating "
    "a trusted contact and requesting urgent assistance. Scammers "
    "exploit familial trust to bypass rational verification steps."
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
    text_lower: str = text.lower()
    raw_score: int = 0
    triggered_categories: list[str] = []
    detail_parts: list[str] = []

    for category, (weight, keywords) in PSYCH_TRIGGERS.items():
        hits: list[str] = []
        for kw in keywords:
            if kw.lower() in text_lower:
                hits.append(kw)
                raw_score += weight

        if hits:
            triggered_categories.append(category)
            detail_parts.append(
                f"{category}: detected phrases – {', '.join(hits)}"
            )

    # Normalise to 0-100
    psych_score: int = int(min((raw_score / _NORMALISATION_DIVISOR) * 100, 100))

    # Build explanation
    if triggered_categories:
        # If emotional manipulation was detected, prepend the specific explanation
        if "Emotional Manipulation" in triggered_categories:
            explanation = (
                _EMOTIONAL_EXPLANATION + " "
                + "Additional tactics detected: "
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