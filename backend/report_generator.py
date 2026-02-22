"""
report_generator.py
--------------------
Generates PDF reports for SurakshaAI analyses.

Premium cyber intelligence report style.
Dark header, clear sections, modern typography.

FIX v2 (PDF CORRUPTION):
  - Replaced FPDF default fonts with DejaVu (Unicode-safe)
  - Falls back to Latin-1 sanitised text if font files not found
  - Wraps ai_score in float() to prevent TypeError on string input
  - Ensures filepath is only returned AFTER pdf.output() completes
  - Removes stale files before generation to prevent serving old corrupt PDFs
  - Explicit error propagation — no silent failures
"""

from __future__ import annotations

import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

try:
    from fpdf import FPDF
    _HAS_FPDF = True
except ImportError:
    _HAS_FPDF = False

REPORTS_DIR = str(Path(__file__).resolve().parent / "reports")

# ---------------------------------------------------------------------------
# DejaVu font paths (bundled with many OS / can be placed in backend/fonts/)
# These fonts support full Unicode including ₹, Hindi, etc.
# ---------------------------------------------------------------------------
_FONT_DIR = str(Path(__file__).resolve().parent / "fonts")
_DEJAVU_REGULAR = os.path.join(_FONT_DIR, "DejaVuSans.ttf")
_DEJAVU_BOLD = os.path.join(_FONT_DIR, "DejaVuSans-Bold.ttf")
_DEJAVU_MONO = os.path.join(_FONT_DIR, "DejaVuSansMono.ttf")
_HAS_DEJAVU = (
    os.path.isfile(_DEJAVU_REGULAR)
    and os.path.isfile(_DEJAVU_BOLD)
    and os.path.isfile(_DEJAVU_MONO)
)


def _sanitize_latin1(text: str) -> str:
    """
    Remove characters that cannot be encoded in Latin-1.
    Used as a fallback when DejaVu fonts are not available.
    Replaces ₹ with Rs. and strips other non-Latin-1 chars.
    """
    text = text.replace("₹", "Rs.")
    return text.encode("latin-1", errors="replace").decode("latin-1")


def _safe_float(value: Any) -> float:
    """Safely convert ai_score to float, handling strings and None."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def generate_report(
    analysis_id: int,
    message: str,
    rule_score: int,
    ai_score: float,
    psych_score: int,
    psych_categories: list[str],
    final_score: int,
    risk_level: str,
    safety_tips: list[str],
    profile_used: str,
    timestamp: str | None = None,
) -> str:
    """
    Generate a PDF report and return the absolute file path.

    Raises
    ------
    RuntimeError
        If PDF generation fails for any reason.
    """
    os.makedirs(REPORTS_DIR, exist_ok=True)
    filepath = os.path.join(REPORTS_DIR, f"suraksha_report_{analysis_id}.pdf")

    # Remove stale file to prevent serving a corrupt cached version
    if os.path.isfile(filepath):
        try:
            os.remove(filepath)
        except OSError:
            pass

    if not _HAS_FPDF:
        # Fallback: write a text file
        txt_path = filepath.replace(".pdf", ".txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(f"SurakshaAI Report #{analysis_id}\n")
            f.write(f"Risk: {risk_level} ({final_score}/100)\n")
            f.write(f"Message: {message}\n")
            f.write(f"Rule: {rule_score} | AI: {_safe_float(ai_score) * 100:.1f}% | Psych: {psych_score}\n")
            f.write(f"Profile: {profile_used}\n")
            f.write(f"Psych: {', '.join(psych_categories)}\n")
            f.write("Tips:\n")
            for tip in safety_tips:
                f.write(f"  - {tip}\n")
        return txt_path

    # Safely convert ai_score
    ai_score_f = _safe_float(ai_score)

    risk_colors = {
        "Low": (16, 185, 129),
        "Medium": (245, 158, 11),
        "High": (249, 115, 22),
        "Critical": (239, 68, 68),
    }
    rc = risk_colors.get(risk_level, (107, 114, 128))

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=25)

    # ---- Register Unicode fonts if available ----
    if _HAS_DEJAVU:
        pdf.add_font("DejaVu", "", _DEJAVU_REGULAR, uni=True)
        pdf.add_font("DejaVu", "B", _DEJAVU_BOLD, uni=True)
        pdf.add_font("DejaVuMono", "", _DEJAVU_MONO, uni=True)
        FONT_SANS = "DejaVu"
        FONT_MONO = "DejaVuMono"
        sanitize = lambda t: t  # No sanitization needed
    else:
        FONT_SANS = "Helvetica"
        FONT_MONO = "Courier"
        sanitize = _sanitize_latin1
        logger.warning(
            "DejaVu fonts not found in %s — falling back to Helvetica (Latin-1 only). "
            "Unicode characters like ₹ and Hindi text will be replaced.",
            _FONT_DIR,
        )

    pdf.add_page()

    # ---- DARK HEADER ----
    pdf.set_fill_color(11, 18, 32)
    pdf.rect(0, 0, 210, 52, "F")

    pdf.set_text_color(241, 245, 249)
    pdf.set_font(FONT_SANS, "B", 20)
    pdf.set_xy(15, 12)
    pdf.cell(0, 10, "SurakshaAI", ln=False)

    pdf.set_font(FONT_SANS, "", 8)
    pdf.set_text_color(148, 163, 184)
    pdf.set_xy(15, 23)
    pdf.cell(0, 5, "Fraud Intelligence Report", ln=True)

    # Report meta
    pdf.set_font(FONT_SANS, "", 7)
    pdf.set_text_color(100, 116, 139)
    pdf.set_xy(15, 32)
    ts = timestamp or datetime.now().isoformat()
    pdf.cell(
        0, 4,
        sanitize(f"Report #{analysis_id}  |  Profile: {profile_used}  |  Generated: {ts}"),
        ln=True,
    )

    # Risk badge
    pdf.set_xy(15, 40)
    pdf.set_fill_color(*rc)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(FONT_SANS, "B", 9)
    badge_text = f"  {risk_level.upper()} RISK  -  {final_score}/100  "
    pdf.cell(pdf.get_string_width(badge_text) + 6, 7, badge_text, fill=True, ln=True)

    pdf.set_y(60)

    # ---- SECTION HELPER ----
    def section(title: str) -> None:
        pdf.set_font(FONT_SANS, "B", 10)
        pdf.set_text_color(31, 41, 55)
        pdf.cell(0, 8, title.upper(), ln=True)
        pdf.set_draw_color(59, 130, 246)
        pdf.line(15, pdf.get_y(), 60, pdf.get_y())
        pdf.ln(3)

    # ---- RISK ASSESSMENT ----
    section("Risk Assessment")
    pdf.set_font(FONT_SANS, "B", 24)
    pdf.set_text_color(*rc)
    pdf.cell(0, 12, f"{final_score}", ln=False)
    pdf.set_font(FONT_SANS, "", 10)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 12, f"  /100  -  {risk_level} Risk", ln=True)
    pdf.ln(2)

    # Score breakdown
    pdf.set_font(FONT_SANS, "", 9)
    pdf.set_text_color(55, 65, 81)
    scores = [
        ("Rule Engine Score", str(rule_score)),
        ("AI Probability", f"{ai_score_f * 100:.1f}%"),
        ("Psychology Score", str(psych_score)),
    ]
    for label, val in scores:
        pdf.set_x(15)
        pdf.cell(60, 6, label, ln=False)
        pdf.set_font(FONT_SANS, "B", 9)
        pdf.cell(0, 6, val, ln=True)
        pdf.set_font(FONT_SANS, "", 9)
    pdf.ln(4)

    # ---- ORIGINAL MESSAGE ----
    section("Original Message")
    pdf.set_fill_color(248, 250, 252)
    pdf.set_x(15)
    pdf.set_font(FONT_MONO, "", 8)
    pdf.set_text_color(31, 41, 55)
    # Truncate very long messages
    display_msg = message if len(message) <= 800 else message[:800] + "..."
    pdf.multi_cell(180, 4.5, sanitize(display_msg), fill=True)
    pdf.ln(4)

    # ---- PSYCHOLOGICAL ANALYSIS ----
    if psych_categories:
        section("Psychological Tactics Detected")
        for cat in psych_categories:
            pdf.set_font(FONT_SANS, "B", 9)
            pdf.set_text_color(139, 92, 246)
            pdf.set_x(15)
            pdf.cell(0, 6, sanitize(f"  {cat}"), ln=True)
        pdf.ln(4)

    # ---- SAFETY RECOMMENDATIONS ----
    if safety_tips:
        section("Safety Recommendations")
        for i, tip in enumerate(safety_tips, 1):
            pdf.set_font(FONT_SANS, "B", 8)
            pdf.set_text_color(59, 130, 246)
            pdf.set_x(15)
            pdf.cell(6, 5, f"{i}.", ln=False)
            pdf.set_font(FONT_SANS, "", 8)
            pdf.set_text_color(55, 65, 81)
            pdf.multi_cell(170, 5, sanitize(tip))
            pdf.ln(1)
        pdf.ln(2)

    # ---- FOOTER ----
    pdf.set_y(-25)
    pdf.set_draw_color(229, 231, 235)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(3)
    pdf.set_font(FONT_SANS, "", 7)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 4, "SurakshaAI - Explainable Multilingual Fraud Intelligence Engine", ln=True, align="C")
    pdf.cell(
        0, 4,
        "This report is generated automatically. Verify findings independently before taking action.",
        ln=True, align="C",
    )

    # ---- WRITE PDF ----
    # pdf.output() writes the complete file. If this line throws,
    # no filepath is returned and the endpoint will 500 correctly.
    pdf.output(filepath)

    # Verify the file was actually written and is non-trivial
    if not os.path.isfile(filepath):
        raise RuntimeError(f"PDF file was not created at {filepath}")

    file_size = os.path.getsize(filepath)
    if file_size < 500:  # A valid FPDF-generated PDF is always > 1KB
        raise RuntimeError(
            f"PDF file at {filepath} is suspiciously small ({file_size} bytes) — likely corrupt"
        )

    logger.info("PDF report generated: %s (%d bytes)", filepath, file_size)
    return filepath