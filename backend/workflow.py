"""
workflow.py
-----------
Orchestration module that combines outputs from the rule engine,
AI engine, and psychological classifier into a single final risk
assessment.

DESIGN PRINCIPLE – Protective Fusion
-------------------------------------
False negatives (missing real fraud) are far more dangerous than
false positives.  The fusion strategy is asymmetrically protective.

PATCH v5 (SCORING PROPORTIONALITY):
  - Clamped psych contribution: min(psych_score, 70) * weight
  - Tiered financial + urgency floors based on signal count
  - Financial + urgency WITHOUT URL/OTP → floor 65 (not 90, not 100)
  - Financial + urgency + suspicious URL → floor 85
  - OTP + suspicious URL → floor 90 (UNCHANGED)
  - Prevents over-escalation to 100 for moderate-risk scams
  - Preserves strong detection for genuine high-risk stacked phishing

Protective guards (applied in order)
-------------------------------------
1. Rule protection floor (rule >= 80 → max(base, rule))
2. Psychological escalation (psych >= 80 → max(final, 75))
3. Money request + urgency floor (→ max(final, 60))
4. Financial + urgency (no URL/OTP) → max(final, 65)
5. Financial + urgency + suspicious URL → max(final, 85)
6. Social impersonation elderly boost (1.2x)
7. AI dominance override (AI > 0.75 + rule < 20 → max(final, 45))
8. Critical override: OTP + suspicious URL → max(final, 90)
9. Clamp [0, 100]

Risk mapping (UNCHANGED)
------------------------
0–30  → Low
31–60 → Medium
61–80 → High
81–100 → Critical
"""

from __future__ import annotations

from typing import Any


# ============================================================================
# Risk-level mapping (UNCHANGED)
# ============================================================================

def _risk_level(score: int) -> str:
    """Map a 0-100 score to a human-readable risk level."""
    if score <= 30:
        return "Low"
    elif score <= 60:
        return "Medium"
    elif score <= 80:
        return "High"
    else:
        return "Critical"


# ============================================================================
# Agreement assessment
# ============================================================================

def _agreement_level(rule_score: int, ai_probability: float) -> str:
    """Backward-compatible agreement level: HIGH or MODERATE."""
    ai_scaled = ai_probability * 100
    if abs(rule_score - ai_scaled) < 15:
        return "HIGH"
    return "MODERATE"


def _agreement_type(
    rule_score: int,
    ai_probability: float,
    ai_dominant_escalation: bool = False,
) -> str:
    """
    Determine which engine is dominant.
    """
    if ai_dominant_escalation:
        return "AI_DOMINANT_ESCALATION"
    if rule_score >= 70 and ai_probability < 0.2:
        return "RULE_DOMINANT"
    elif ai_probability >= 0.8 and rule_score < 30:
        return "AI_DOMINANT"
    else:
        return "BALANCED"


# ============================================================================
# Public API
# ============================================================================

def compute_final(
    rule_score: int,
    ai_probability: float,
    ai_confidence: float,
    psych_score: int,
    ai_enabled: bool,
    has_otp: bool,
    has_suspicious_url: bool,
    has_money_request: bool = False,
    categories: list[str] | None = None,
    profile: str = "general",
) -> dict[str, Any]:
    """
    Combine all sub-scores into a final risk assessment.

    Parameters
    ----------
    rule_score         : int   0-100
    ai_probability     : float 0-1
    ai_confidence      : float 0-1
    psych_score        : int   0-100
    ai_enabled         : bool
    has_otp            : bool
    has_suspicious_url : bool
    has_money_request  : bool
    categories         : list[str]  detected rule categories
    profile            : str

    Returns
    -------
    dict
        final_score     – int 0-100
        risk_level      – str
        agreement_level – str
        agreement_type  – str
    """
    cats = set(categories or [])
    ai_dominant_escalation = False

    # -----------------------------------------------------------------------
    # Step 0: Social impersonation + elderly profile boost (v2)
    # -----------------------------------------------------------------------
    effective_rule_score = rule_score
    if "social_impersonation" in cats and profile == "elderly":
        effective_rule_score = int(min(rule_score * 1.2, 100))

    # -----------------------------------------------------------------------
    # Step 1: Compute base score
    #
    # PATCH v5: Psych contribution is CLAMPED to prevent psychological
    # score alone from pushing the final score to 100.
    # psych_component = min(psych_score, 70) * psych_weight
    # This means even a psych_score of 100 contributes at most 7 points
    # (70 * 0.10) to the fusion, not 10.
    # -----------------------------------------------------------------------
    clamped_psych = min(psych_score, 70)

    if not ai_enabled:
        final = float(effective_rule_score)
    else:
        ai_scaled = ai_probability * 100

        if ai_confidence >= 0.4:
            base = (
                (0.45 * effective_rule_score)
                + (0.45 * ai_scaled)
                + (0.10 * clamped_psych)
            )
        else:
            base = (
                (0.70 * effective_rule_score)
                + (0.20 * ai_scaled)
                + (0.10 * clamped_psych)
            )

        # -------------------------------------------------------------------
        # Step 2: Protective guards (applied in strict order)
        # -------------------------------------------------------------------

        # Guard 1 – Rule protection floor
        # If the rule engine is very confident (>= 80), the AI cannot
        # drag the score down.
        if effective_rule_score >= 80:
            final = max(base, float(effective_rule_score))
        else:
            final = base

        # Guard 2 – Psychological escalation
        # Heavy manipulation stacking is itself a strong fraud signal.
        if psych_score >= 80:
            final = max(final, 75.0)

        # Guard 3 – Money request + urgency floor (v2)
        urgency_present = bool(
            cats & {"urgency", "hindi_urgency", "dynamic_urgency"}
        )
        if has_money_request and urgency_present:
            final = max(final, 60.0)

        # -------------------------------------------------------------------
        # Guard 4 (PATCH v5) – TIERED financial + urgency escalation
        #
        # Instead of a single floor, we use tiered escalation based on
        # how many high-risk signals are present.  This restores score
        # differentiation between:
        #   - financial + urgency only (moderate risk → 65)
        #   - financial + urgency + suspicious URL (high risk → 85)
        #   - OTP + URL (critical → 90, handled by Guard 7)
        #
        # This prevents vendor scams with no URL/OTP from hitting 100
        # while ensuring they don't drop below Medium.
        # -------------------------------------------------------------------
        has_financial = "financial_data_request" in cats
        has_any_urgency = bool(
            cats & {"urgency", "hindi_urgency", "dynamic_urgency"}
        )

        if has_financial and has_any_urgency:
            if has_suspicious_url:
                # Financial + urgency + suspicious URL = strong phishing signal
                # Floor at 85 (High/Critical boundary)
                final = max(final, 85.0)
            elif not has_otp:
                # Financial + urgency but NO suspicious URL and NO OTP
                # This is likely a vendor scam or refund phish without
                # a malicious link.  Floor at 65 (solidly Medium-High).
                # Does NOT escalate to Critical.
                final = max(final, 65.0)
            # If has_otp but no URL, Guard 7 won't trigger the ≥90 override,
            # but the OTP category weight (18) already pushes rule_score up.

        # Guard 5 – Social impersonation elderly boost is handled in Step 0.

        # Guard 6 – AI dominance override (v3)
        # When AI detects fraud but rules missed it (novel language).
        if ai_probability > 0.75 and rule_score < 20:
            if final < 45:
                final = 45.0
                ai_dominant_escalation = True

        # Guard 7 – Critical override: OTP + suspicious URL
        # This is the HIGHEST priority override. Applied LAST so nothing
        # downstream can reduce it.  UNCHANGED from v1.
        if has_otp and has_suspicious_url:
            final = max(final, 90.0)

    # -----------------------------------------------------------------------
    # Step 3: Clamp to [0, 100]
    # -----------------------------------------------------------------------
    final_score = int(min(max(final, 0), 100))

    # -----------------------------------------------------------------------
    # Step 4: Agreement
    # -----------------------------------------------------------------------
    agreement = _agreement_level(rule_score, ai_probability)
    ag_type = _agreement_type(rule_score, ai_probability, ai_dominant_escalation)

    # -----------------------------------------------------------------------
    # Step 5: Risk level (UNCHANGED thresholds)
    # -----------------------------------------------------------------------
    risk = _risk_level(final_score)

    return {
        "final_score": final_score,
        "risk_level": risk,
        "agreement_level": agreement,
        "agreement_type": ag_type,
    }