"""
url_scanner.py
--------------
Extracts and analyzes URLs from message text.
Detects:
  - Shortened links (bit.ly, tinyurl, etc.)
  - Suspicious domain patterns (random character strings)
  - Typosquatting (amaz0n, paytm-secure, sbi-verify, etc.)
  - Non-HTTPS links
Returns a risk score, list of suspicious URLs, and reasons.
"""

import re
from typing import Any

# ---------------------------------------------------------------------------
# Regex to capture URLs (http/https/ftp or bare www. prefixed domains)
# ---------------------------------------------------------------------------
URL_REGEX = re.compile(
    r'https?://[^\s<>"\']+|www\.[^\s<>"\']+',
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Known URL shortener domains
# ---------------------------------------------------------------------------
SHORTENER_DOMAINS: set[str] = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
    "is.gd", "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at",
    "tiny.cc", "lnkd.in", "soo.gd", "s2r.co", "clicky.me",
    "bl.ink", "short.io",
}

# ---------------------------------------------------------------------------
# Typosquatting patterns – brand names commonly impersonated
# Each tuple: (regex_pattern, friendly_label)
# ---------------------------------------------------------------------------
TYPOSQUAT_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"amaz[0o]n", re.IGNORECASE), "amazon"),
    (re.compile(r"paytm[\-_]?(secure|verify|update|link)", re.IGNORECASE), "paytm"),
    (re.compile(r"sbi[\-_]?(kyc|verify|secure|update|link)", re.IGNORECASE), "sbi"),
    (re.compile(r"hdfc[\-_]?(kyc|verify|secure|update|link)", re.IGNORECASE), "hdfc"),
    (re.compile(r"icici[\-_]?(kyc|verify|secure|update|link)", re.IGNORECASE), "icici"),
    (re.compile(r"pan[\-_]?(update|verify|link|card)", re.IGNORECASE), "pan-card"),
    (re.compile(r"g00gle|go0gle|googl\b", re.IGNORECASE), "google"),
    (re.compile(r"faceb[0o]{2}k|faceb00k", re.IGNORECASE), "facebook"),
    (re.compile(r"micros[0o]ft", re.IGNORECASE), "microsoft"),
    (re.compile(r"paypa[l1][\-_]?(verify|secure|update)?", re.IGNORECASE), "paypal"),
    (re.compile(r"flipk[a@]rt", re.IGNORECASE), "flipkart"),
    (re.compile(r"phonepe[\-_]?(verify|secure|update|link)", re.IGNORECASE), "phonepe"),
]

# ---------------------------------------------------------------------------
# Pattern for domains that look randomly generated (many consonant clusters)
# ---------------------------------------------------------------------------
RANDOM_DOMAIN_REGEX = re.compile(
    r"[bcdfghjklmnpqrstvwxyz]{5,}", re.IGNORECASE
)


def _extract_domain(url: str) -> str:
    """Return the domain portion of a URL in lower-case."""
    cleaned = re.sub(r"^https?://", "", url, flags=re.IGNORECASE)
    cleaned = re.sub(r"^www\.", "", cleaned, flags=re.IGNORECASE)
    domain = cleaned.split("/")[0].split("?")[0].split("#")[0]
    return domain.lower()


def _is_shortened(domain: str) -> bool:
    """Check whether the domain belongs to a known URL shortener."""
    for shortener in SHORTENER_DOMAINS:
        if domain == shortener or domain.endswith("." + shortener):
            return True
    return False


def _check_typosquatting(domain: str) -> list[str]:
    """Return list of brand names the domain may be impersonating."""
    hits: list[str] = []
    for pattern, brand in TYPOSQUAT_PATTERNS:
        if pattern.search(domain):
            hits.append(brand)
    return hits


def _is_random_domain(domain: str) -> bool:
    """Heuristic: domain contains a long consonant cluster → possibly random."""
    # Strip TLD before checking
    base = domain.split(".")[0]
    return bool(RANDOM_DOMAIN_REGEX.search(base))


def _is_non_https(url: str) -> bool:
    """Return True if the URL explicitly uses http:// (not https://)."""
    return url.lower().startswith("http://")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def scan_urls(text: str) -> dict[str, Any]:
    """
    Scan *text* for URLs and return a risk assessment.

    Returns
    -------
    dict with keys:
        url_score        – int 0-100
        suspicious_urls  – list[str]
        reasons          – list[str]
    """
    urls: list[str] = URL_REGEX.findall(text)

    if not urls:
        return {
            "url_score": 0,
            "suspicious_urls": [],
            "reasons": [],
        }

    suspicious_urls: list[str] = []
    reasons: list[str] = []
    raw_score: int = 0  # accumulate; will be capped at 100

    for url in urls:
        domain = _extract_domain(url)
        url_is_suspicious = False

        # --- shortened link --------------------------------------------------
        if _is_shortened(domain):
            reasons.append(f"Shortened URL detected: {url}")
            raw_score += 25
            url_is_suspicious = True

        # --- typosquatting ----------------------------------------------------
        typo_brands = _check_typosquatting(domain)
        if typo_brands:
            reasons.append(
                f"Possible typosquatting ({', '.join(typo_brands)}): {url}"
            )
            raw_score += 35
            url_is_suspicious = True

        # --- random domain ----------------------------------------------------
        if _is_random_domain(domain):
            reasons.append(f"Randomly generated domain pattern: {url}")
            raw_score += 20
            url_is_suspicious = True

        # --- non-HTTPS --------------------------------------------------------
        if _is_non_https(url):
            reasons.append(f"Non-HTTPS link: {url}")
            raw_score += 15
            url_is_suspicious = True

        if url_is_suspicious:
            suspicious_urls.append(url)

    # Cap at 100
    url_score = min(raw_score, 100)

    return {
        "url_score": url_score,
        "suspicious_urls": suspicious_urls,
        "reasons": reasons,
    }