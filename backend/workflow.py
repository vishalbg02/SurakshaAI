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
Therefore the fusion strategy is **asymmetrically protective**:

  • A low AI probability can NEVER suppress a high rule-based score.
  • A high AI probability CAN elevate a low rule-based score.
  • Psychological escalation provides a secondary safety floor.
  • The OTP + suspicious-URL override guarantees Critical classification
    for the most unambiguous scam indicators.

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
     Rationale: When the rule engine has very high confidence, the AI
     must not be able to drag the score down.  The rule engine's
     keyword dictionaries are hand-curated with high precision;
     a score ≥ 80 means multiple strong scam indicators fired.

2. Psychological escalation:
     If psych_score >= 80 → final = max(final, 75)
     Rationale: Heavy psychological manipulation (fear + urgency +
     authority stacking) is itself a strong fraud signal even if
     individual keywords didn't fire.

3. Critical override:
     If has_otp AND has_suspicious_url → final = max(final, 90)
     Rationale: OTP solicitation combined with a suspicious link is
     an unambiguous phishing pattern; must always be Critical.

4. Clamp to [0, 100].

Agreement logic
---------------
If abs(rule_score - ai_score*100) < 15 → HIGH else MODERATE

Risk mapping
------------
0–30  → Low
31–60 → Medium
61–80 → High
81–100 → Critical
"""

from __future__ import annotations

from typing import Any


# ============================================================================
# Risk-level mapping
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
    """
    Determine how closely rule-based and AI scores agree.

    Parameters
    ----------
    rule_score : int        0-100
    ai_probability : float  0-1 (will be scaled to 0-100 internally)
    """
    ai_scaled = ai_probability * 100
    if abs(rule_score - ai_scaled) < 15:
        return "HIGH"
    return "MODERATE"


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
) -> dict[str, Any]:
    """
    Combine all sub-scores into a final risk assessment using a
    protective fusion strategy.

    Parameters
    ----------
    rule_score      : int   0-100  from rule_engine
    ai_probability  : float 0-1   fraud probability from ai_engine
    ai_confidence   : float 0-1   top-label confidence from ai_engine
    psych_score     : int   0-100  from psych_classifier
    ai_enabled      : bool         whether the user opted into AI analysis
    has_otp         : bool         OTP flag from rule_engine
    has_suspicious_url : bool      suspicious-URL flag from rule_engine

    Returns
    -------
    dict
        final_score     – int 0-100
        risk_level      – str
        agreement_level – str
    """
    # -----------------------------------------------------------------------
    # Step 1: Compute base score using the weighted fusion formula
    # -----------------------------------------------------------------------
    if not ai_enabled:
        # AI is disabled – rely entirely on the rule engine.
        # This path preserves full backward compatibility: psych and AI
        # play no role, and the rule score IS the final score (before
        # protective guards).
        final = float(rule_score)
    else:
        ai_scaled = ai_probability * 100

        if ai_confidence >= 0.4:
            # AI is reasonably confident → equal weighting between
            # rule engine and AI, with a small psych contribution.
            base = (0.45 * rule_score) + (0.45 * ai_scaled) + (0.10 * psych_score)
        else:
            # AI confidence is low → lean heavily on rule engine.
            base = (0.70 * rule_score) + (0.20 * ai_scaled) + (0.10 * psych_score)

        # -------------------------------------------------------------------
        # Step 2: Protective guards (applied in strict order)
        # -------------------------------------------------------------------

        # Guard 1 – Rule protection floor
        # WHY: A rule_score >= 80 means the message matched multiple
        # high-weight scam patterns (OTP solicitation, KYC fraud,
        # authority impersonation, etc.).  These keyword dictionaries
        # are hand-curated with high precision.  A low AI probability
        # (e.g. 0.07) should NEVER be able to average the final score
        # downward into "Medium" territory.  The rule engine's verdict
        # acts as an inviolable floor.
        if rule_score >= 80:
            final = max(base, float(rule_score))
        else:
            final = base

        # Guard 2 – Psychological escalation
        # WHY: A psych_score >= 80 indicates heavy stacking of
        # manipulation tactics (e.g. fear + urgency + authority in a
        # single message).  Even if individual scam keywords scored
        # modestly, the psychological pressure pattern itself is a
        # strong fraud signal.  We enforce a floor of 75 ("High" risk).
        if psych_score >= 80:
            final = max(final, 75.0)

        # Guard 3 – Critical override (OTP + suspicious URL)
        # WHY: The combination of OTP solicitation and a suspicious
        # link is an unambiguous phishing pattern.  No matter what
        # the AI or rule scores individually suggest, this pattern
        # MUST result in Critical risk classification (>= 90).
        if has_otp and has_suspicious_url:
            final = max(final, 90.0)

    # -----------------------------------------------------------------------
    # Step 3: Clamp to valid range [0, 100]
    # -----------------------------------------------------------------------
    final_score = int(min(max(final, 0), 100))

    # -----------------------------------------------------------------------
    # Step 4: Agreement level (unchanged)
    # -----------------------------------------------------------------------
    agreement = _agreement_level(rule_score, ai_probability)

    # -----------------------------------------------------------------------
    # Step 5: Risk level mapping (unchanged)
    # -----------------------------------------------------------------------
    risk = _risk_level(final_score)

    return {
        "final_score": final_score,
        "risk_level": risk,
        "agreement_level": agreement,
    }