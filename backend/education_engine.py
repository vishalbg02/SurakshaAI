"""
education_engine.py
--------------------
Maps detected scam categories to contextual safety tips.

ENHANCEMENT v3 (HARDENING):
  - Added financial_data_request safety tips
  - Added dynamic_urgency safety tips
  - Added Financial Pressure psychological category tips
"""

from __future__ import annotations

from typing import Any

# ============================================================================
# Safety-tip database
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

    # v2: Social impersonation
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

    # -----------------------------------------------------------------------
    # NEW v3: Financial data request / refund phishing
    # -----------------------------------------------------------------------
    "financial_data_request": [
        "Legitimate companies process refunds automatically — they never ask "
        "you to 'confirm account details' to receive a refund.",
        "If you receive a message about a failed payment or billing issue, "
        "log into the service directly (not via a link) to check.",
        "Refund phishing scams often create urgency ('within 6 hours') to "
        "pressure you into sharing banking details. Take your time.",
        "Never update payment methods through links in emails or messages. "
        "Go to the official website or app instead.",
        "If a message threatens 'account closure' unless you act, it is "
        "almost certainly a scam. Real services send multiple reminders "
        "through official channels.",
    ],

    # NEW v3: Dynamic urgency
    "dynamic_urgency": [
        "Messages with specific time deadlines ('within 6 hours', "
        "'before 5 PM') are designed to create panic. Genuine deadlines "
        "are communicated through official channels.",
        "If a message gives you a short window to act, step back and verify "
        "independently. Scammers use artificial time pressure.",
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
    "Emotional Manipulation": [
        "Be wary of messages from unknown numbers claiming to be a family "
        "member. Verify by calling their known number.",
        "Emotional manipulation exploits trust and love. Take a breath and "
        "verify before sending money or sharing information.",
        "If someone claims to be a relative in an emergency, ask them a "
        "question only that person would know the answer to.",
    ],

    # -----------------------------------------------------------------------
    # NEW v3: Financial Pressure (psychological category)
    # -----------------------------------------------------------------------
    "Financial Pressure": [
        "Messages suggesting you'll lose money (failed refund, billing issue) "
        "unless you act immediately are a hallmark of phishing scams.",
        "Never click links or provide financial details in response to "
        "unsolicited messages about payments or refunds.",
        "If you're told a refund failed, check your bank statement directly. "
        "Do not rely on the message sender for financial information.",
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
        Maximum number of tips to return.

    Returns
    -------
    list[str]
    """
    tips: list[str] = []
    seen: set[str] = set()

    for cat in categories:
        for tip in SAFETY_TIPS.get(cat, []):
            if tip not in seen:
                tips.append(tip)
                seen.add(tip)

    if not tips:
        tips = list(GENERAL_TIPS)

    return tips[:max_tips]