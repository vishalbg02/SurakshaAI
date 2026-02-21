"""
phrase_highlighter.py
---------------------
Converts matched scam phrases from rule_engine output into a
frontend-friendly structure with positional spans.

Each span includes:
    - phrase     : the matched text
    - category   : scam category label
    - start      : character index where the phrase begins (case-insensitive)
    - end        : character index where the phrase ends
"""

from __future__ import annotations

import re
from typing import Any


# ============================================================================
# Category → display-colour mapping (for frontend convenience)
# ============================================================================

CATEGORY_COLORS: dict[str, str] = {
    "urgency": "#FF6B6B",
    "fear": "#E63946",
    "otp": "#D00000",
    "personal_data": "#E85D04",
    "authority_impersonation": "#6A040F",
    "reward_scam": "#F48C06",
    "kyc_scam": "#DC2F02",
    "suspicious_url": "#9D0208",
    "hindi_urgency": "#FF6B6B",
    "hindi_fear": "#E63946",
    "hindi_otp_personal": "#D00000",
    "hindi_reward": "#F48C06",
    "hindi_authority": "#6A040F",
    "call_transcript": "#370617",
}

DEFAULT_COLOR: str = "#ADB5BD"


# ============================================================================
# Public API
# ============================================================================

def highlight(
    text: str,
    matched_phrases: list[dict[str, str]],
) -> list[dict[str, Any]]:
    """
    Produce a list of highlight spans for the given *text*.

    Parameters
    ----------
    text : str
        The original message.
    matched_phrases : list[dict]
        Each dict must have keys ``phrase`` and ``category``
        (as returned by ``rule_engine.analyze``).

    Returns
    -------
    list[dict]
        Each dict contains:
            phrase   – str
            category – str
            color    – str (hex colour code for frontend rendering)
            start    – int
            end      – int
        Sorted by ``start`` ascending.
    """
    spans: list[dict[str, Any]] = []
    text_lower = text.lower()

    for item in matched_phrases:
        phrase: str = item["phrase"]
        category: str = item["category"]
        phrase_lower = phrase.lower()

        # Find ALL occurrences of the phrase in the text (case-insensitive)
        # Using simple string search; avoids regex special-char issues.
        search_start = 0
        while True:
            idx = text_lower.find(phrase_lower, search_start)
            if idx == -1:
                break
            spans.append(
                {
                    "phrase": text[idx : idx + len(phrase)],  # preserve original casing
                    "category": category,
                    "color": CATEGORY_COLORS.get(category, DEFAULT_COLOR),
                    "start": idx,
                    "end": idx + len(phrase),
                }
            )
            search_start = idx + 1  # move past this occurrence

    # Sort by position so the frontend can render left-to-right
    spans.sort(key=lambda s: s["start"])

    return spans