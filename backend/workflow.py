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

ENHANCEMENT v2:
  - Added money_request + urgency override (floor = 60)
  - Added social_impersonation + elderly profile boost (1.2x)
  - Added agreement_type field

ENHANCEMENT v3 (HARDENING):
  - Added financial_data_request + urgency escalation floor (60)
  - Added AI dominance override (AI > 0.75 + rule < 20 → floor 45)
  - agreement_type now includes AI_DOMINANT_ESCALATION
  - All existing overrides preserved

Protective guards (applied in order)
-------------------------------------
1. Rule protection floor (rule >= 80 → max(base, rule))
2. Psychological escalation (psych >= 80 → max(final, 75))
3. Money request + urgency floor (→ max(final, 60))
4. Financial data request + urgency floor (NEW v3 → max(final, 60))
5. Social impersonation elderly boost (1.2x)
6. AI dominance override (NEW v3 → max(final, 45))
7. Critical override (OTP + URL → max(final, 90))
8. Clamp [0, 100]

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

    Returns:
      "RULE_DOMINANT"           – rule >= 70, AI < 0.2
      "AI_DOMINANT"             – AI >= 0.8, rule < 30
      "AI_DOMINANT_ESCALATION"  – NEW v3: AI > 0.75, rule < 20, escalation applied
      "BALANCED"                – neither dominates
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
        agreement_level – str  (backward compatible)
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
    # -----------------------------------------------------------------------
    if not ai_enabled:
        final = float(effective_rule_score)
    else:
        ai_scaled = ai_probability * 100

        if ai_confidence >= 0.4:
            base = (0.45 * effective_rule_score) + (0.45 * ai_scaled) + (0.10 * psych_score)
        else:
            base = (0.70 * effective_rule_score) + (0.20 * ai_scaled) + (0.10 * psych_score)

        # -------------------------------------------------------------------
        # Step 2: Protective guards
        # -------------------------------------------------------------------

        # Guard 1 – Rule protection floor
        if effective_rule_score >= 80:
            final = max(base, float(effective_rule_score))
        else:
            final = base

        # Guard 2 – Psychological escalation
        if psych_score >= 80:
            final = max(final, 75.0)

        # Guard 3 – Money request + urgency floor (v2)
        urgency_present = bool(
            cats & {"urgency", "hindi_urgency", "dynamic_urgency"}
        )
        if has_money_request and urgency_present:
            final = max(final, 60.0)

        # Guard 4 (NEW v3) – Financial data request + urgency floor
        # WHY: Refund phishing and billing scams combine financial action
        # requests with time pressure.  If the rule engine detected
        # financial_data_request AND any form of urgency, the final score
        # must be at least 60 (Medium) to ensure the user is warned.
        has_financial = "financial_data_request" in cats
        has_any_urgency = bool(
            cats & {"urgency", "hindi_urgency", "dynamic_urgency"}
        )
        if has_financial and has_any_urgency:
            final = max(final, 60.0)

        # Guard 5 (NEW v3) – AI dominance override
        # WHY: When the AI model detects strong fraud semantics
        # (probability > 0.75) but the rule engine scored low (< 20),
        # it means the scam uses novel language that keyword matching
        # missed.  We escalate to at least 45 so the message doesn't
        # slip through as "Low" risk.
        if ai_probability > 0.75 and rule_score < 20:
            if final < 45:
                final = 45.0
                ai_dominant_escalation = True

        # Guard 6 – Critical override (OTP + suspicious URL)
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