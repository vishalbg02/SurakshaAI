"""
psych_classifier.py
-------------------
Detects psychological manipulation tactics in text.

PATCH v6 (CONTEXT-AWARE):
  - Financial Pressure / Financial Coercion only trigger when
    loss, denial, rejection, suspension, or cancellation is implied.
  - Neutral financial outcomes (processed, credited, completed)
    do NOT trigger psychological financial categories.
"""

from __future__ import annotations

import re
from typing import Any


# ============================================================================
# TACTIC PATTERNS
# ============================================================================

TACTIC_PATTERNS: dict[str, list[str]] = {
    "Fear": [
        "blocked", "suspended", "terminated", "legal action",
        "arrest warrant", "fir registered", "compromised",
        "unauthorized access", "security alert", "fraud detected",
        "account frozen", "blacklisted", "under investigation",
        "will be deactivated", "will be blocked",
        "permanently closed", "penalty",
    ],
    "Urgency": [
        "immediately", "urgent", "right now", "act now",
        "last chance", "hurry", "time is running out",
        "expires today", "don't delay", "limited time",
        "before it's too late", "do it now", "final warning",
        "action required", "within 24 hours",
    ],
    "Authority": [
        "rbi", "reserve bank", "income tax", "sbi",
        "hdfc bank", "icici bank", "government",
        "cyber crime", "police department", "customs",
        "ministry", "trai", "sebi", "epfo",
        "inspector", "officer", "department",
    ],
    "Reward": [
        "you have won", "congratulations", "lucky winner",
        "claim your prize", "gift card", "cash prize",
        "lottery", "reward points", "free gift",
        "selected for a reward", "you've been chosen",
        "bonus credited", "cashback",
    ],
    "Scarcity": [
        "limited spots", "only few left", "offer expires",
        "closing soon", "last chance", "limited time",
        "exclusive offer", "first come", "running out",
    ],
    "Emotional Manipulation": [
        "hi dad", "hi mom", "lost my phone", "new number",
        "emergency", "please help", "i'm stuck",
        "need money", "send money", "urgent help",
        "i'm in trouble", "please send",
    ],
}

# ============================================================================
# FINANCIAL PRESSURE / COERCION — context-aware (v6)
#
# These categories ONLY trigger when the message implies:
#   - Loss, denial, rejection, suspension, or cancellation
#   - NOT when describing a successful/completed transaction
# ============================================================================

_FINANCIAL_LOSS_INDICATORS: list[str] = [
    "could not be processed", "unable to process",
    "payment failed", "payment rejected",
    "transaction declined", "billing issue",
    "processing issue", "account restricted",
    "temporary suspension", "avoid cancellation",
    "prevent cancellation", "account closure",
    "avoid account closure", "overdue",
    "rejected", "failed", "declined", "restricted",
    "suspended", "penalty",
]

_FINANCIAL_COERCION_INDICATORS: list[str] = [
    "confirm your", "update your", "verify your",
    "submit your", "provide your", "share your",
    "update bank details", "confirm bank details",
    "verify bank details", "confirm account",
    "update account", "verify account",
]

# Negative-intent phrases that suppress financial psych triggers
_FINANCIAL_NEGATIVE_INTENT: list[str] = [
    "successfully", "completed", "has been credited",
    "has been processed", "processed successfully",
    "payment successful", "no further action",
    "no action required", "no action needed",
    "thank you", "refund processed",
    "refund completed", "salary credited",
    "invoice paid", "payment completed",
]

# ============================================================================
# Word-boundary helpers
# ============================================================================

_psych_regex_cache: dict[str, re.Pattern] = {}


def _match(phrase: str, text: str) -> bool:
    if phrase not in _psych_regex_cache:
        escaped = re.escape(phrase)
        _psych_regex_cache[phrase] = re.compile(
            r"\b" + escaped + r"\b", re.IGNORECASE
        )
    return bool(_psych_regex_cache[phrase].search(text))


# ============================================================================
# Public API
# ============================================================================

def classify(text: str) -> dict[str, Any]:
    """
    Classify psychological manipulation tactics in *text*.

    Returns
    -------
    dict
        psych_score   – int 0-100
        categories    – list[str]
        explanation   – str
    """
    detected: dict[str, list[str]] = {}

    # Standard tactic detection
    for tactic, phrases in TACTIC_PATTERNS.items():
        matched = [p for p in phrases if _match(p, text)]
        if matched:
            detected[tactic] = matched

    # --- Context-aware Financial Pressure (v6) ---
    # Check for negative intent first
    has_negative_intent = any(_match(neg, text) for neg in _FINANCIAL_NEGATIVE_INTENT)

    if not has_negative_intent:
        # Financial Pressure: loss/denial indicators
        fp_matched = [p for p in _FINANCIAL_LOSS_INDICATORS if _match(p, text)]
        if fp_matched:
            detected["Financial Pressure"] = fp_matched

        # Financial Coercion: action demands on financial data
        fc_matched = [p for p in _FINANCIAL_COERCION_INDICATORS if _match(p, text)]
        if fc_matched:
            detected["Financial Coercion"] = fc_matched

    # --- Score calculation ---
    categories = sorted(detected.keys())
    total_matches = sum(len(v) for v in detected.values())

    if not categories:
        return {
            "psych_score": 0,
            "categories": [],
            "explanation": "No psychological manipulation tactics detected.",
        }

    # Base score: 15 per category + 5 per matched phrase, capped at 100
    base = len(categories) * 15
    phrase_bonus = total_matches * 5
    psych_score = min(base + phrase_bonus, 100)

    # Build explanation
    parts = []
    for cat in categories:
        phrases = detected[cat]
        sample = ", ".join(f'"{p}"' for p in phrases[:3])
        parts.append(f"{cat} ({sample})")

    explanation = (
        f"Detected {len(categories)} manipulation tactic(s): "
        + "; ".join(parts)
        + "."
    )

    return {
        "psych_score": psych_score,
        "categories": categories,
        "explanation": explanation,
    }