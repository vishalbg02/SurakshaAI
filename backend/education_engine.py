"""
education_engine.py
--------------------
Maps detected scam categories to contextual safety tips and educational
advice.  The tips are intended to be surfaced to the end-user alongside
the analysis results so they can learn to recognise similar scams in the
future.

ENHANCEMENT v2:
  - Added social_impersonation safety tips
  - Added Emotional Manipulation psychological category tips
"""

from __future__ import annotations

from typing import Any

# ============================================================================
# Safety-tip database – keyed by scam / psychological category
# ============================================================================

SAFETY_TIPS: dict[str, list[str]] = {
    # Rule-engine categories
    "urgency": [
        "Legitimate organisations rarely impose extreme time pressure. "
        "Take a moment to verify before acting.",
        "If a message says 'act within 24 hours or else', pause and call "
        "the organisation's official helpline.",
    ],
    "fear": [
        "Scammers use fear (account blocked, legal action) to cloud your "
        "judgement.  Verify threats through official channels.",
        "No bank or government body will threaten you via SMS or WhatsApp. "
        "Always cross-check.",
    ],
    "otp": [
        "NEVER share your OTP, PIN, or verification code with anyone – not "
        "even someone claiming to be from your bank.",
        "OTPs are meant only for you.  Bank employees will never ask for them.",
    ],
    "personal_data": [
        "Do not share PAN, Aadhaar, CVV, or bank details over SMS or calls.",
        "Genuine institutions already have your data on file; they will "
        "not ask you to send it via text.",
    ],
    "authority_impersonation": [
        "Verify the sender's identity independently. Scammers often pretend "
        "to be banks, government departments, or police.",
        "Call the organisation's official number (from their website) to "
        "confirm any request.",
    ],
    "reward_scam": [
        "If you didn't enter a contest, you didn't win one. Be sceptical "
        "of unsolicited prize messages.",
        "Legitimate rewards never require you to pay a fee or share "
        "sensitive details to claim them.",
    ],
    "kyc_scam": [
        "Banks perform KYC in-branch or through their official app. "
        "They never send links via SMS for KYC updates.",
        "If asked to 'update KYC' via a link, visit the bank's website "
        "directly instead.",
    ],
    "suspicious_url": [
        "Do not click on links in unexpected messages. Check the URL "
        "carefully for misspellings or unusual domains.",
        "Hover over (or long-press) a link to preview the actual URL "
        "before clicking.",
    ],
    "call_transcript": [
        "If a caller asks you to 'press 1' or 'stay on the line', hang up "
        "and call the organisation yourself.",
        "Scam callers create urgency and forbid you from disconnecting – a "
        "legitimate caller will understand if you call back.",
    ],

    # -----------------------------------------------------------------------
    # NEW v2: Social / family impersonation
    # -----------------------------------------------------------------------
    "social_impersonation": [
        "Always verify new numbers by calling the old saved contact directly. "
        "Do not rely on the new number for confirmation.",
        "Do not transfer money without confirming identity through a known "
        "channel — call, video chat, or in person.",
        "Family impersonation scams are extremely common on WhatsApp and SMS. "
        "Scammers often say 'I lost my phone' or 'this is my new number'.",
        "Scammers create urgency to prevent you from verifying. A real family "
        "member will understand if you take a moment to confirm.",
        "Ask a personal verification question only the real person would know — "
        "for example, a shared memory or a pet's name.",
    ],

    # Hindi / Hinglish categories
    "hindi_urgency": [
        "Agar koi message 'turant' ya 'abhi' karne ko kahe, toh pehle "
        "sochein aur verify karein.",
    ],
    "hindi_fear": [
        "Darne ki zaroorat nahi – koi bhi bank ya sarkari vibhag SMS se "
        "dhamki nahi deta.",
    ],
    "hindi_otp_personal": [
        "Apna OTP ya PIN kisi ko mat batayein – bank karmchari bhi "
        "kabhi nahi maangte.",
    ],
    "hindi_reward": [
        "Agar aapne koi contest mein hissa nahi liya, toh aapne kuch "
        "nahi jeeta. Aisi messages se savdhaan rahein.",
    ],
    "hindi_authority": [
        "Sarkari ya bank ki taraf se aane wale messages ko hamesha "
        "official number se confirm karein.",
    ],

    # Psychological categories
    "Fear": [
        "Recognise fear-based manipulation: scammers want you to panic "
        "so you skip verification steps.",
    ],
    "Urgency": [
        "Time-pressure tactics are designed to bypass rational thinking. "
        "Slow down and verify.",
    ],
    "Authority": [
        "Authority figures are impersonated to gain instant trust. "
        "Always verify credentials independently.",
    ],
    "Reward": [
        "Unexpected rewards are a classic lure.  If it sounds too good "
        "to be true, it probably is.",
    ],
    "Scarcity": [
        "Scarcity messaging ('limited time!') is a pressure tactic. "
        "Genuine offers don't expire in minutes.",
    ],

    # -----------------------------------------------------------------------
    # NEW v2: Emotional Manipulation (psychological category)
    # -----------------------------------------------------------------------
    "Emotional Manipulation": [
        "Be wary of messages from unknown numbers claiming to be a family "
        "member. Verify by calling their known number.",
        "Emotional manipulation exploits trust and love. Take a breath and "
        "verify before sending money or sharing information.",
        "If someone claims to be a relative in an emergency, ask them a "
        "question only that person would know the answer to.",
    ],
}

# Fallback tip when no specific category matched
GENERAL_TIPS: list[str] = [
    "Stay vigilant: never share personal or financial information "
    "through unsolicited messages.",
    "When in doubt, contact the organisation directly using a number "
    "from their official website.",
    "Report suspicious messages to your telecom provider or the "
    "national cyber-crime helpline (1930 in India).",
]


# ============================================================================
# Public API
# ============================================================================

def get_safety_tips(
    categories: list[str],
    max_tips: int = 8,
) -> list[str]:
    """
    Return contextual safety tips based on the detected scam *categories*.

    Parameters
    ----------
    categories : list[str]
        Category labels from rule_engine and/or psych_classifier.
    max_tips : int
        Maximum number of tips to return (to keep the response concise).
        Increased from 6 to 8 in v2 to accommodate social impersonation tips.

    Returns
    -------
    list[str]
    """
    tips: list[str] = []
    seen: set[str] = set()  # avoid duplicates

    for cat in categories:
        for tip in SAFETY_TIPS.get(cat, []):
            if tip not in seen:
                tips.append(tip)
                seen.add(tip)

    # If we found nothing specific, return general advice
    if not tips:
        tips = list(GENERAL_TIPS)

    # Trim to max
    return tips[:max_tips]