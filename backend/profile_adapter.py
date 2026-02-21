"""
profile_adapter.py
-------------------
Adjusts fraud-detection emphasis based on the user's risk profile.

Supported profiles
------------------
- student        – more susceptible to reward scams and urgency
- elderly        – more susceptible to fear, authority, and OTP scams
- business_owner – more susceptible to authority impersonation and KYC scams

Each profile defines *multipliers* for scam categories.  Categories not
listed in a profile keep a default multiplier of 1.0.
"""

from __future__ import annotations

from typing import Any

# ============================================================================
# Profile multiplier maps
# Keys = scam / psych category names (as returned by rule_engine / psych)
# Values = float multiplier applied to the contribution of that category.
# ============================================================================

PROFILE_MULTIPLIERS: dict[str, dict[str, float]] = {
    "student": {
        "reward_scam": 1.4,
        "hindi_reward": 1.4,
        "Reward": 1.4,
        "urgency": 1.3,
        "hindi_urgency": 1.3,
        "Urgency": 1.3,
        "otp": 1.2,
        "hindi_otp_personal": 1.2,
        "Scarcity": 1.2,
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
    },
}

# Default multiplier for categories not listed in a profile
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
        multipliers_applied  – dict[str, float]  (for transparency)
    """
    multipliers = PROFILE_MULTIPLIERS.get(profile, {})

    if not multipliers:
        # Unknown or "general" profile → no adjustment
        return {
            "adjusted_rule_score": score_data.get("rule_score", 0),
            "adjusted_psych_score": score_data.get("psych_score", 0),
            "profile_used": profile if profile else "general",
            "multipliers_applied": {},
        }

    # --- Compute combined multiplier from matched categories -----------------
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

    # Average multiplier (fallback to 1.0 if no categories)
    avg_multiplier = (combined_multiplier / count) if count > 0 else 1.0

    # Apply to scores
    adjusted_rule = int(min(score_data.get("rule_score", 0) * avg_multiplier, 100))
    adjusted_psych = int(min(score_data.get("psych_score", 0) * avg_multiplier, 100))

    return {
        "adjusted_rule_score": adjusted_rule,
        "adjusted_psych_score": adjusted_psych,
        "profile_used": profile,
        "multipliers_applied": applied,
    }