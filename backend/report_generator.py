"""
report_generator.py
--------------------
Generates PDF reports for SurakshaAI analyses.

REDESIGN: Premium cyber intelligence report style.
Dark header, clear sections, modern typography.
"""

from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    from fpdf import FPDF
    _HAS_FPDF = True
except ImportError:
    _HAS_FPDF = False

REPORTS_DIR = str(Path(__file__).resolve().parent / "reports")


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
    """Generate a PDF report and return the file path."""
    os.makedirs(REPORTS_DIR, exist_ok=True)
    filepath = os.path.join(REPORTS_DIR, f"suraksha_report_{analysis_id}.pdf")

    if not _HAS_FPDF:
        # Fallback: write a text file
        with open(filepath.replace(".pdf", ".txt"), "w") as f:
            f.write(f"SurakshaAI Report #{analysis_id}\n")
            f.write(f"Risk: {risk_level} ({final_score}/100)\n")
            f.write(f"Message: {message}\n")
            f.write(f"Rule: {rule_score} | AI: {ai_score:.2f} | Psych: {psych_score}\n")
            f.write(f"Profile: {profile_used}\n")
            f.write(f"Psych: {', '.join(psych_categories)}\n")
            f.write(f"Tips:\n")
            for tip in safety_tips:
                f.write(f"  - {tip}\n")
        return filepath.replace(".pdf", ".txt")

    risk_colors = {
        "Low": (16, 185, 129),
        "Medium": (245, 158, 11),
        "High": (249, 115, 22),
        "Critical": (239, 68, 68),
    }
    rc = risk_colors.get(risk_level, (107, 114, 128))

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # ---- DARK HEADER ----
    pdf.set_fill_color(11, 18, 32)
    pdf.rect(0, 0, 210, 52, "F")

    pdf.set_text_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_xy(15, 12)
    pdf.cell(0, 10, "SurakshaAI", ln=False)

    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(148, 163, 184)
    pdf.set_xy(15, 23)
    pdf.cell(0, 5, "Fraud Intelligence Report", ln=True)

    # Report meta
    pdf.set_font("Helvetica", "", 7)
    pdf.set_text_color(100, 116, 139)
    pdf.set_xy(15, 32)
    ts = timestamp or datetime.now().isoformat()
    pdf.cell(0, 4, f"Report #{analysis_id}  |  Profile: {profile_used}  |  Generated: {ts}", ln=True)

    # Risk badge
    pdf.set_xy(15, 40)
    pdf.set_fill_color(*rc)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 9)
    badge_text = f"  {risk_level.upper()} RISK  -  {final_score}/100  "
    pdf.cell(pdf.get_string_width(badge_text) + 6, 7, badge_text, fill=True, ln=True)

    pdf.set_y(60)

    # ---- SECTION HELPER ----
    def section(title):
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(31, 41, 55)
        pdf.cell(0, 8, title.upper(), ln=True)
        pdf.set_draw_color(59, 130, 246)
        pdf.line(15, pdf.get_y(), 60, pdf.get_y())
        pdf.ln(3)

    def body_text(text, indent=0):
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(55, 65, 81)
        pdf.set_x(15 + indent)
        pdf.multi_cell(180 - indent, 5, text)
        pdf.ln(1)

    # ---- RISK ASSESSMENT ----
    section("Risk Assessment")
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(*rc)
    pdf.cell(0, 12, f"{final_score}", ln=False)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 12, f"  /100  -  {risk_level} Risk", ln=True)
    pdf.ln(2)

    # Score breakdown
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(55, 65, 81)
    scores = [
        ("Rule Engine Score", str(rule_score)),
        ("AI Probability", f"{ai_score * 100:.1f}%"),
        ("Psychology Score", str(psych_score)),
    ]
    for label, val in scores:
        pdf.set_x(15)
        pdf.cell(60, 6, label, ln=False)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(0, 6, val, ln=True)
        pdf.set_font("Helvetica", "", 9)
    pdf.ln(4)

    # ---- ORIGINAL MESSAGE ----
    section("Original Message")
    pdf.set_fill_color(248, 250, 252)
    pdf.set_x(15)
    pdf.set_font("Courier", "", 8)
    pdf.set_text_color(31, 41, 55)
    # Truncate very long messages
    display_msg = message if len(message) <= 800 else message[:800] + "..."
    pdf.multi_cell(180, 4.5, display_msg, fill=True)
    pdf.ln(4)

    # ---- PSYCHOLOGICAL ANALYSIS ----
    if psych_categories:
        section("Psychological Tactics Detected")
        for cat in psych_categories:
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(139, 92, 246)
            pdf.set_x(15)
            pdf.cell(0, 6, f"  {cat}", ln=True)
        pdf.ln(4)

    # ---- SAFETY RECOMMENDATIONS ----
    if safety_tips:
        section("Safety Recommendations")
        for i, tip in enumerate(safety_tips, 1):
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_text_color(59, 130, 246)
            pdf.set_x(15)
            pdf.cell(6, 5, f"{i}.", ln=False)
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(55, 65, 81)
            pdf.multi_cell(170, 5, tip)
            pdf.ln(1)
        pdf.ln(2)

    # ---- FOOTER ----
    pdf.set_y(-25)
    pdf.set_draw_color(229, 231, 235)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 7)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 4, "SurakshaAI - Explainable Multilingual Fraud Intelligence Engine", ln=True, align="C")
    pdf.cell(0, 4, "This report is generated automatically. Verify findings independently before taking action.", ln=True, align="C")

    pdf.output(filepath)
    return filepath