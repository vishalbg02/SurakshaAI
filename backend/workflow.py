"""
workflow.py
-----------
Orchestration module that combines outputs from the rule engine,
AI engine, and psychological classifier into a single final risk
assessment.

DESIGN PRINCIPLE – Protective Fusion
-------------------------------------
In a fraud-detection system, false negatives (missing real fraud) are
far more dangerous than false positives (flagging legitimate messages).
The fusion strategy is **asymmetrically protective**.

ENHANCEMENT v2:
  - Added money_request + urgency override (floor = 60)
  - Added social_impersonation + elderly profile boost (1.2x rule)
  - Added agreement_type field (RULE_DOMINANT / AI_DOMINANT / BALANCED)
  - Preserved all existing overrides and backward compatibility

Fusion formula (base score)
---------------------------
- AI disabled:
    final = rule_score

- AI enabled, confidence >= 0.4:
    base = (0.45 × rule) + (0.45 × ai×100) + (0.10 × psych)

- AI enabled, confidence < 0.4:
    base = (0.70 × rule) + (0.20 × ai×100) + (0.10 × psych)

Protective guards (applied in order)
-------------------------------------
1. Rule protection floor:
     If rule_score >= 80 → final = max(base, rule_score)

2. Psychological escalation:
     If psych_score >= 80 → final = max(final, 75)

3. Money request + urgency floor (NEW v2):
     If has_money_request AND urgency → final = max(final, 60)

4. Social impersonation elderly boost (NEW v2):
     If social_impersonation AND profile == "elderly"
     → rule_score *= 1.2 (recompute final)

5. Critical override:
     If has_otp AND has_suspicious_url → final = max(final, 90)

6. Clamp to [0, 100].

Agreement logic (ENHANCED v2)
-----------------------------
agreement_level: HIGH / MODERATE  (backward compatible)
agreement_type:  RULE_DOMINANT / AI_DOMINANT / BALANCED  (new field)

Risk mapping (unchanged)
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
# Agreement assessment (ENHANCED v2)
# ============================================================================

def _agreement_level(rule_score: int, ai_probability: float) -> str:
    """
    Determine how closely rule-based and AI scores agree.
    Returns the backward-compatible agreement level.
    """
    ai_scaled = ai_probability * 100
    if abs(rule_score - ai_scaled) < 15:
        return "HIGH"
    return "MODERATE"


def _agreement_type(rule_score: int, ai_probability: float) -> str:
    """
    Determine which engine is dominant in the analysis.

    Returns:
      "RULE_DOMINANT"  – rule_score >= 70 AND ai < 0.2
                         (rules caught it, AI didn't – common for
                          keyword-heavy scams with novel phrasing)
      "AI_DOMINANT"    – ai >= 0.8 AND rule_score < 30
                         (AI detected semantic fraud that keyword
                          matching missed – indicates sophisticated scam)
      "BALANCED"       – both engines roughly agree or neither dominates
    """
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
    Combine all sub-scores into a final risk assessment using a
    protective fusion strategy.

    Parameters
    ----------
    rule_score         : int   0-100  from rule_engine
    ai_probability     : float 0-1   fraud probability from ai_engine
    ai_confidence      : float 0-1   top-label confidence from ai_engine
    psych_score        : int   0-100  from psych_classifier
    ai_enabled         : bool         whether the user opted into AI analysis
    has_otp            : bool         OTP flag from rule_engine
    has_suspicious_url : bool         suspicious-URL flag from rule_engine
    has_money_request  : bool         money request flag from rule_engine (NEW v2)
    categories         : list[str]    detected categories (NEW v2)
    profile            : str          user profile for contextual boosts (NEW v2)

    Returns
    -------
    dict
        final_score     – int 0-100
        risk_level      – str
        agreement_level – str  (backward compatible)
        agreement_type  – str  (NEW v2: RULE_DOMINANT / AI_DOMINANT / BALANCED)
    """
    cats = set(categories or [])

    # -----------------------------------------------------------------------
    # Step 0 (NEW v2): Social impersonation + elderly profile boost
    # WHY: Elderly users are disproportionately targeted by family
    # impersonation scams.  A 1.2x multiplier on the rule score
    # ensures these scams are scored more aggressively for this
    # vulnerable profile.
    # -----------------------------------------------------------------------
    effective_rule_score = rule_score
    if "social_impersonation" in cats and profile == "elderly":
        effective_rule_score = int(min(rule_score * 1.2, 100))

    # -----------------------------------------------------------------------
    # Step 1: Compute base score using the weighted fusion formula
    # -----------------------------------------------------------------------
    if not ai_enabled:
        # AI is disabled – rely entirely on the rule engine.
        final = float(effective_rule_score)
    else:
        ai_scaled = ai_probability * 100

        if ai_confidence >= 0.4:
            base = (0.45 * effective_rule_score) + (0.45 * ai_scaled) + (0.10 * psych_score)
        else:
            base = (0.70 * effective_rule_score) + (0.20 * ai_scaled) + (0.10 * psych_score)

        # -------------------------------------------------------------------
        # Step 2: Protective guards (applied in strict order)
        # -------------------------------------------------------------------

        # Guard 1 – Rule protection floor
        # WHY: A rule_score >= 80 means the message matched multiple
        # high-weight scam patterns.  A low AI probability should
        # NEVER be able to average the final score downward.
        if effective_rule_score >= 80:
            final = max(base, float(effective_rule_score))
        else:
            final = base

        # Guard 2 – Psychological escalation
        # WHY: psych_score >= 80 indicates heavy manipulation stacking.
        if psych_score >= 80:
            final = max(final, 75.0)

        # Guard 3 (NEW v2) – Money request + urgency floor
        # WHY: When someone is asking for money AND using urgency
        # tactics, this is a strong scam signal regardless of what
        # the AI thinks.  Floor at 60 ensures at least "Medium" risk.
        urgency_present = bool(
            cats & {"urgency", "hindi_urgency"}
        ) or has_money_request  # money requests inherently carry urgency
        if has_money_request and urgency_present:
            final = max(final, 60.0)

        # Guard 4 – Critical override (OTP + suspicious URL)
        # WHY: OTP solicitation + suspicious link = unambiguous phishing.
        if has_otp and has_suspicious_url:
            final = max(final, 90.0)

    # -----------------------------------------------------------------------
    # Step 3: Clamp to valid range [0, 100]
    # -----------------------------------------------------------------------
    final_score = int(min(max(final, 0), 100))

    # -----------------------------------------------------------------------
    # Step 4: Agreement level (backward compatible) + type (NEW v2)
    # -----------------------------------------------------------------------
    agreement = _agreement_level(rule_score, ai_probability)
    ag_type = _agreement_type(rule_score, ai_probability)

    # -----------------------------------------------------------------------
    # Step 5: Risk level mapping (UNCHANGED)
    # -----------------------------------------------------------------------
    risk = _risk_level(final_score)

    return {
        "final_score": final_score,
        "risk_level": risk,
        "agreement_level": agreement,
        "agreement_type": ag_type,
    }