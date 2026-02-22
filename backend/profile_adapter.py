"""
profile_adapter.py
-------------------
Adjusts fraud-detection emphasis based on the user's risk profile.

ENHANCEMENT v3 (HARDENING):
  - Added financial_data_request and dynamic_urgency multipliers
  - Added Financial Pressure psychological category multipliers
  - Elderly profile now has elevated sensitivity to financial scams
"""

from __future__ import annotations

from typing import Any

# ============================================================================
# Profile multiplier maps
# ============================================================================

PROFILE_MULTIPLIERS: dict[str, dict[str, float]] = {
    "student": {
        "reward_scam": 1.4,
        "hindi_reward": 1.4,
        "Reward": 1.4,
        "urgency": 1.3,
        "hindi_urgency": 1.3,
        "dynamic_urgency": 1.3,
        "Urgency": 1.3,
        "otp": 1.2,
        "hindi_otp_personal": 1.2,
        "Scarcity": 1.2,
        "financial_data_request": 1.1,
        "Financial Pressure": 1.1,
    },
    "elderly": {
        "fear": 1.5,
        "hindi_fear": 1.5,
        "Fear": 1.5,
        "authority_impersonation": 1.5,
        "hindi_authority": 1.5,
        "Authority": 1.5,
        "otp": 1.6,
        "hindi_otp_personal": 1.6,
        "personal_data": 1.4,
        "call_transcript": 1.3,
        # v3: Elderly are disproportionately targeted by refund phishing
        "financial_data_request": 1.5,
        "dynamic_urgency": 1.3,
        "Financial Pressure": 1.5,
        "Emotional Manipulation": 1.4,
    },
    "business_owner": {
        "authority_impersonation": 1.4,
        "hindi_authority": 1.4,
        "Authority": 1.4,
        "kyc_scam": 1.5,
        "personal_data": 1.3,
        "call_transcript": 1.2,
        "fear": 1.2,
        "hindi_fear": 1.2,
        "Fear": 1.2,
        # v3: Business owners targeted by payment/billing scams
        "financial_data_request": 1.4,
        "dynamic_urgency": 1.2,
        "Financial Pressure": 1.3,
    },
}

_DEFAULT_MULTIPLIER: float = 1.0


# ============================================================================
# Public API
# ============================================================================

def apply_profile_adjustment(
    score_data: dict[str, Any],
    profile: str,
) -> dict[str, Any]:
    """
    Adjust rule-engine and psych scores based on the selected *profile*.

    Parameters
    ----------
    score_data : dict
        Must contain at minimum:
            rule_score : int
            psych_score : int
            rule_categories : list[str]
            psych_categories : list[str]
    profile : str
        One of "student", "elderly", "business_owner".
        Unknown profiles return scores unchanged.

    Returns
    -------
    dict with keys:
        adjusted_rule_score  – int (0-100)
        adjusted_psych_score – int (0-100)
        profile_used         – str
        multipliers_applied  – dict[str, float]
    """
    multipliers = PROFILE_MULTIPLIERS.get(profile, {})

    if not multipliers:
        return {
            "adjusted_rule_score": score_data.get("rule_score", 0),
            "adjusted_psych_score": score_data.get("psych_score", 0),
            "profile_used": profile if profile else "general",
            "multipliers_applied": {},
        }

    all_categories: list[str] = (
        score_data.get("rule_categories", [])
        + score_data.get("psych_categories", [])
    )

    applied: dict[str, float] = {}
    combined_multiplier: float = 0.0
    count: int = 0

    for cat in all_categories:
        m = multipliers.get(cat, _DEFAULT_MULTIPLIER)
        combined_multiplier += m
        count += 1
        if cat in multipliers:
            applied[cat] = m

    avg_multiplier = (combined_multiplier / count) if count > 0 else 1.0

    adjusted_rule = int(min(score_data.get("rule_score", 0) * avg_multiplier, 100))
    adjusted_psych = int(min(score_data.get("psych_score", 0) * avg_multiplier, 100))

    return {
        "adjusted_rule_score": adjusted_rule,
        "adjusted_psych_score": adjusted_psych,
        "profile_used": profile,
        "multipliers_applied": applied,
    }