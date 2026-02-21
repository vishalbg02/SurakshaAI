"""
report_generator.py
--------------------
Generates downloadable PDF fraud-analysis reports using ReportLab.

Each report contains:
  - Original message text
  - Rule-based score
  - AI score
  - Psychological categories
  - Final risk assessment
  - Safety tips
  - Timestamp
"""

from __future__ import annotations

import os
import textwrap
from datetime import datetime
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ============================================================================
# Output directory
# ============================================================================

REPORTS_DIR: str = str(Path(__file__).resolve().parent / "reports")

# Ensure the reports folder exists
os.makedirs(REPORTS_DIR, exist_ok=True)


# ============================================================================
# Colour helper – map risk level to a reportlab colour
# ============================================================================

RISK_COLOURS: dict[str, colors.Color] = {
    "Low": colors.HexColor("#27AE60"),
    "Medium": colors.HexColor("#F39C12"),
    "High": colors.HexColor("#E74C3C"),
    "Critical": colors.HexColor("#8E44AD"),
}


# ============================================================================
# Public API
# ============================================================================

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

    Parameters
    ----------
    analysis_id     : int       database primary key
    message         : str       original text analysed
    rule_score      : int       0-100
    ai_score        : float     0-1 (fraud probability)
    psych_score     : int       0-100
    psych_categories: list[str] detected psychological tactics
    final_score     : int       0-100 combined score
    risk_level      : str       Low / Medium / High / Critical
    safety_tips     : list[str] contextual advice
    profile_used    : str       user profile applied
    timestamp       : str|None  ISO timestamp (defaults to now)

    Returns
    -------
    str – absolute path to the generated PDF file.
    """
    if timestamp is None:
        timestamp = datetime.utcnow().isoformat()

    filename = f"suraksha_report_{analysis_id}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    # --- ReportLab setup -----------------------------------------------------
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=22,
        spaceAfter=6 * mm,
        textColor=colors.HexColor("#2C3E50"),
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        spaceAfter=3 * mm,
        textColor=colors.HexColor("#2C3E50"),
    )
    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
    )
    tip_style = ParagraphStyle(
        "TipStyle",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
        leftIndent=10 * mm,
        bulletIndent=5 * mm,
        textColor=colors.HexColor("#2C3E50"),
    )

    elements: list[Any] = []

    # --- Title ---------------------------------------------------------------
    elements.append(Paragraph("SurakshaAI &ndash; Fraud Analysis Report", title_style))
    elements.append(Spacer(1, 4 * mm))

    # --- Metadata table ------------------------------------------------------
    risk_colour = RISK_COLOURS.get(risk_level, colors.black)

    meta_data = [
        ["Report ID", str(analysis_id)],
        ["Profile", profile_used.capitalize()],
        ["Generated At", timestamp],
        ["Final Score", f"{final_score} / 100"],
        ["Risk Level", risk_level],
    ]
    meta_table = Table(meta_data, colWidths=[50 * mm, 120 * mm])
    meta_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#ECF0F1")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TEXTCOLOR", (1, 4), (1, 4), risk_colour),
                ("FONTNAME", (1, 4), (1, 4), "Helvetica-Bold"),
                ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    elements.append(meta_table)
    elements.append(Spacer(1, 6 * mm))

    # --- Original message ----------------------------------------------------
    elements.append(Paragraph("Original Message", heading_style))
    # Wrap long messages and escape XML-sensitive characters for ReportLab
    safe_msg = (
        message.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    wrapped_msg = "<br/>".join(textwrap.wrap(safe_msg, width=90))
    elements.append(Paragraph(wrapped_msg, body_style))
    elements.append(Spacer(1, 6 * mm))

    # --- Score breakdown -----------------------------------------------------
    elements.append(Paragraph("Score Breakdown", heading_style))
    score_data = [
        ["Component", "Score"],
        ["Rule-Based Score", f"{rule_score} / 100"],
        ["AI Fraud Probability", f"{ai_score:.2%}"],
        ["Psychological Score", f"{psych_score} / 100"],
        ["Combined Final Score", f"{final_score} / 100"],
    ]
    score_table = Table(score_data, colWidths=[80 * mm, 90 * mm])
    score_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    elements.append(score_table)
    elements.append(Spacer(1, 6 * mm))

    # --- Psychological analysis ----------------------------------------------
    elements.append(Paragraph("Psychological Manipulation Detected", heading_style))
    if psych_categories:
        psych_text = ", ".join(psych_categories)
    else:
        psych_text = "None detected"
    elements.append(Paragraph(psych_text, body_style))
    elements.append(Spacer(1, 6 * mm))

    # --- Safety tips ---------------------------------------------------------
    elements.append(Paragraph("Safety Recommendations", heading_style))
    if safety_tips:
        for i, tip in enumerate(safety_tips, 1):
            safe_tip = (
                tip.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
            )
            elements.append(
                Paragraph(f"<b>{i}.</b> {safe_tip}", tip_style)
            )
            elements.append(Spacer(1, 1.5 * mm))
    else:
        elements.append(Paragraph("No specific recommendations.", body_style))

    elements.append(Spacer(1, 10 * mm))

    # --- Footer disclaimer ---------------------------------------------------
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["BodyText"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#7F8C8D"),
        alignment=1,  # center
    )
    elements.append(
        Paragraph(
            "This report was generated by SurakshaAI &ndash; an explainable "
            "multilingual fraud intelligence engine. It is intended for "
            "informational purposes only and does not constitute legal or "
            "financial advice. Always verify suspicious communications "
            "through official channels.",
            disclaimer_style,
        )
    )

    # --- Build the PDF -------------------------------------------------------
    doc.build(elements)

    return filepath