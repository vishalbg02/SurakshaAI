"""
main.py
-------
SurakshaAI – Explainable Multilingual Fraud Intelligence Engine

FastAPI application entry-point.

ENHANCEMENT v3 (HARDENING):
  - Passes has_financial_request and has_dynamic_urgency flags through pipeline
  - All new flags are additive — no existing fields removed
  - Full backward compatibility with frontend
"""

from __future__ import annotations

import logging
import re
import time
from collections import defaultdict
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

# ---- Internal modules -------------------------------------------------------
from rule_engine import analyze as rule_analyze
from ai_engine import analyze_text as ai_analyze, is_model_loaded
from psych_classifier import classify as psych_classify
from profile_adapter import apply_profile_adjustment
from workflow import compute_final
from phrase_highlighter import highlight as highlight_phrases
from education_engine import get_safety_tips
from database import (
    init_db,
    save_analysis,
    get_history as db_get_history,
    get_analysis_by_id,
    get_trends as db_get_trends,
)
from report_generator import generate_report

# ============================================================================
# Logging
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("suraksha")

# ============================================================================
# FastAPI application
# ============================================================================

app = FastAPI(
    title="SurakshaAI",
    description=(
        "Explainable Multilingual Fraud Intelligence Engine – "
        "detects scam SMS, WhatsApp messages, and call transcripts "
        "using rule-based + AI-based + psychological analysis."
    ),
    version="3.0.0",
)

# ---- CORS middleware ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Rate Limiting (in-memory, no Redis)
# ============================================================================

_rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX_REQUESTS: int = 20
RATE_LIMIT_WINDOW_SECONDS: float = 60.0


def _check_rate_limit(client_ip: str) -> bool:
    """Return True if the request should be BLOCKED."""
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS

    _rate_limit_store[client_ip] = [
        ts for ts in _rate_limit_store[client_ip] if ts > window_start
    ]

    if len(_rate_limit_store[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        return True

    _rate_limit_store[client_ip].append(now)
    return False


# ============================================================================
# Input Sanitisation
# ============================================================================

MAX_MESSAGE_LENGTH: int = 5000


def _sanitize_message(text: str) -> str:
    """
    Clean up input text.
    Raises ValueError if empty or exceeds MAX_MESSAGE_LENGTH.
    """
    text = text.strip()

    if not text:
        raise ValueError("Message cannot be empty.")

    if len(text) > MAX_MESSAGE_LENGTH:
        raise ValueError(
            f"Message exceeds maximum length of {MAX_MESSAGE_LENGTH} characters "
            f"(received {len(text)})."
        )

    text = re.sub(r"[^\S\n]+", " ", text)
    return text


# ============================================================================
# Startup event
# ============================================================================

@app.on_event("startup")
def on_startup() -> None:
    """Initialise SQLite database tables on server start."""
    logger.info("Initialising database …")
    init_db()
    logger.info("Database ready.")
    logger.info("AI model loaded: %s", is_model_loaded())


# ============================================================================
# Request / Response schemas
# ============================================================================

class AnalyzeRequest(BaseModel):
    """Body for POST /analyze."""
    message: str = Field(..., min_length=1, description="Message text to analyse")
    profile: str = Field(
        default="general",
        description="User risk profile: student | elderly | business_owner | general",
    )
    ai_enabled: bool = Field(
        default=True,
        description="Whether to include AI-based semantic analysis",
    )


class BatchAnalyzeRequest(BaseModel):
    """Body for POST /analyze-batch."""
    messages: str = Field(
        ...,
        min_length=1,
        description="Multiple messages separated by newlines",
    )
    profile: str = Field(default="general")
    ai_enabled: bool = Field(default=True)


# ============================================================================
# Core analysis pipeline
# ============================================================================

def _run_analysis(
    message: str,
    profile: str,
    ai_enabled: bool,
) -> dict[str, Any]:
    """
    Execute the full SurakshaAI analysis pipeline on a single message.

    Steps
    -----
    1. Rule-based detection  (rule_engine)
    2. AI semantic detection (ai_engine)  – optional
    3. Psychological classification (psych_classifier)
    4. Profile adjustment   (profile_adapter)
    5. Score fusion          (workflow)
    6. Phrase highlighting   (phrase_highlighter)
    7. Safety tips           (education_engine)
    8. Persist to database   (database)

    Returns a comprehensive result dict.
    """
    # ----- Step 1: Rule-based analysis ----------------------------------------
    rule_result: dict[str, Any] = rule_analyze(message)
    rule_score: int = rule_result["score"]
    rule_categories: list[str] = rule_result["categories"]
    matched_phrases: list[dict[str, str]] = rule_result["matched_phrases"]
    has_otp: bool = rule_result["flags"]["has_otp"]
    has_suspicious_url: bool = rule_result["flags"]["has_suspicious_url"]
    has_money_request: bool = rule_result["flags"].get("has_money_request", False)
    has_financial_request: bool = rule_result["flags"].get("has_financial_request", False)
    has_dynamic_urgency: bool = rule_result["flags"].get("has_dynamic_urgency", False)

    # ----- Step 2: AI analysis (if enabled) -----------------------------------
    if ai_enabled and is_model_loaded():
        ai_result: dict[str, Any] = ai_analyze(message)
    else:
        ai_result = {"probability": 0.0, "confidence": 0.0, "label": "disabled"}

    ai_probability: float = ai_result["probability"]
    ai_confidence: float = ai_result["confidence"]

    # ----- Step 3: Psychological classification --------------------------------
    psych_result: dict[str, Any] = psych_classify(message)
    psych_score: int = psych_result["psych_score"]
    psych_categories: list[str] = psych_result["categories"]

    # ----- Step 4: Profile adjustment -----------------------------------------
    profile_input = {
        "rule_score": rule_score,
        "psych_score": psych_score,
        "rule_categories": rule_categories,
        "psych_categories": psych_categories,
    }
    adjusted = apply_profile_adjustment(profile_input, profile)
    adj_rule_score: int = adjusted["adjusted_rule_score"]
    adj_psych_score: int = adjusted["adjusted_psych_score"]

    # ----- Step 5: Score fusion -----------------------------------------------
    fusion = compute_final(
        rule_score=adj_rule_score,
        ai_probability=ai_probability,
        ai_confidence=ai_confidence,
        psych_score=adj_psych_score,
        ai_enabled=ai_enabled and is_model_loaded(),
        has_otp=has_otp,
        has_suspicious_url=has_suspicious_url,
        has_money_request=has_money_request,
        categories=rule_categories,
        profile=profile,
    )
    final_score: int = fusion["final_score"]
    risk_level: str = fusion["risk_level"]
    agreement_level: str = fusion["agreement_level"]
    agreement_type: str = fusion.get("agreement_type", "BALANCED")

    # ----- Step 6: Phrase highlighting ----------------------------------------
    highlights = highlight_phrases(message, matched_phrases)

    # ----- Step 7: Safety tips ------------------------------------------------
    all_categories = list(set(rule_categories + psych_categories))
    tips = get_safety_tips(all_categories)

    # ----- Step 8: Persist to database ----------------------------------------
    analysis_id = save_analysis(
        message=message,
        rule_score=adj_rule_score,
        ai_score=ai_probability,
        psych_score=adj_psych_score,
        final_score=final_score,
        risk_level=risk_level,
        profile_used=profile,
        categories=rule_categories,
        psych_categories=psych_categories,
        has_money_request=has_money_request,
    )

    # ----- Assemble response --------------------------------------------------
    # All fields are backward compatible.  New fields (agreement_type,
    # has_financial_request, has_dynamic_urgency in flags) are additive.
    # The frontend can safely ignore fields it doesn't yet render.
    return {
        "id": analysis_id,
        "message": message,
        "rule_analysis": {
            "score": adj_rule_score,
            "original_score": rule_score,
            "categories": rule_categories,
            "matched_phrases": matched_phrases,
            "flags": rule_result["flags"],
            "url_analysis": rule_result["url_analysis"],
        },
        "ai_analysis": {
            "enabled": ai_enabled and is_model_loaded(),
            "probability": ai_probability,
            "confidence": ai_confidence,
            "label": ai_result["label"],
        },
        "psych_analysis": {
            "score": adj_psych_score,
            "original_score": psych_score,
            "categories": psych_categories,
            "explanation": psych_result["explanation"],
        },
        "profile_adjustment": {
            "profile_used": adjusted["profile_used"],
            "multipliers_applied": adjusted["multipliers_applied"],
        },
        "final_assessment": {
            "final_score": final_score,
            "risk_level": risk_level,
            "agreement_level": agreement_level,
            "agreement_type": agreement_type,
        },
        "highlights": highlights,
        "safety_tips": tips,
    }


# ============================================================================
# Endpoints
# ============================================================================

# ---------- POST /analyze ----------------------------------------------------

@app.post("/analyze", summary="Analyse a single message for fraud indicators")
async def analyze_message(body: AnalyzeRequest, request: Request) -> dict[str, Any]:
    """
    Accept a suspicious SMS / WhatsApp message / call transcript and
    return a comprehensive fraud analysis.
    """
    # --- Rate limiting ---
    client_ip = request.client.host if request.client else "unknown"
    if _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 20 requests per minute.",
        )

    # --- Input sanitisation ---
    try:
        sanitized_message = _sanitize_message(body.message)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    logger.info(
        "POST /analyze  profile=%s  ai=%s  len=%d  ip=%s",
        body.profile, body.ai_enabled, len(sanitized_message), client_ip,
    )

    try:
        result = _run_analysis(
            message=sanitized_message,
            profile=body.profile,
            ai_enabled=body.ai_enabled,
        )
        return {"status": "success", "data": result}
    except Exception as exc:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail=str(exc))


# ---------- POST /analyze-batch ----------------------------------------------

@app.post("/analyze-batch", summary="Analyse multiple messages (newline-separated)")
async def analyze_batch(body: BatchAnalyzeRequest, request: Request) -> dict[str, Any]:
    """
    Accept multiple messages separated by newlines and return an array
    of analysis results.
    """
    # --- Rate limiting ---
    client_ip = request.client.host if request.client else "unknown"
    if _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 20 requests per minute.",
        )

    # --- Input sanitisation ---
    try:
        sanitized = _sanitize_message(body.messages)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    raw_messages = [m.strip() for m in sanitized.split("\n") if m.strip()]

    if not raw_messages:
        raise HTTPException(status_code=400, detail="No messages provided.")

    logger.info(
        "POST /analyze-batch  count=%d  profile=%s  ai=%s  ip=%s",
        len(raw_messages), body.profile, body.ai_enabled, client_ip,
    )

    results: list[dict[str, Any]] = []
    for msg in raw_messages:
        try:
            if len(msg) > MAX_MESSAGE_LENGTH:
                results.append({
                    "message": msg[:100] + "…",
                    "error": f"Message exceeds {MAX_MESSAGE_LENGTH} character limit.",
                })
                continue

            result = _run_analysis(
                message=msg,
                profile=body.profile,
                ai_enabled=body.ai_enabled,
            )
            results.append(result)
        except Exception as exc:
            logger.error("Batch item failed: %s", exc)
            results.append({
                "message": msg,
                "error": str(exc),
            })

    return {
        "status": "success",
        "total": len(results),
        "results": results,
    }


# ---------- GET /history -----------------------------------------------------

@app.get("/history", summary="Retrieve past analysis results")
def get_history(limit: int = 100) -> dict[str, Any]:
    """Return the most recent *limit* analysis results from the database."""
    logger.info("GET /history  limit=%d", limit)
    try:
        history = db_get_history(limit=limit)
        return {
            "status": "success",
            "total": len(history),
            "results": history,
        }
    except Exception as exc:
        logger.exception("Failed to retrieve history")
        raise HTTPException(status_code=500, detail=str(exc))


# ---------- GET /trends ------------------------------------------------------

@app.get("/trends", summary="Aggregate trend analytics")
def get_trends() -> dict[str, Any]:
    """
    Return risk-level distribution, most common scam category, and most
    common psychological trigger across all stored analyses.
    """
    logger.info("GET /trends")
    try:
        trends = db_get_trends()
        return {"status": "success", "data": trends}
    except Exception as exc:
        logger.exception("Failed to compute trends")
        raise HTTPException(status_code=500, detail=str(exc))


# ---------- GET /report/{analysis_id} ----------------------------------------

@app.get(
    "/report/{analysis_id}",
    summary="Download a PDF report for a specific analysis",
)
def get_report(analysis_id: int) -> FileResponse:
    """
    Generate (or re-generate) a PDF report for the analysis identified by
    *analysis_id* and return it as a downloadable file.
    """
    logger.info("GET /report/%d", analysis_id)

    record = get_analysis_by_id(analysis_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    all_cats: list[str] = record.get("categories", []) + record.get("psych_categories", [])
    tips = get_safety_tips(all_cats)

    try:
        filepath = generate_report(
            analysis_id=record["id"],
            message=record["message"],
            rule_score=record["rule_score"],
            ai_score=record["ai_score"],
            psych_score=record["psych_score"],
            psych_categories=record.get("psych_categories", []),
            final_score=record["final_score"],
            risk_level=record["risk_level"],
            safety_tips=tips,
            profile_used=record["profile_used"],
            timestamp=record.get("timestamp"),
        )
    except Exception as exc:
        logger.exception("PDF generation failed")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {exc}")

    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        filename=f"suraksha_report_{analysis_id}.pdf",
    )


# ============================================================================
# Health check
# ============================================================================

@app.get("/health", summary="Health check")
def health_check() -> dict[str, Any]:
    """Return service status and AI model availability."""
    return {
        "status": "healthy",
        "ai_model_loaded": is_model_loaded(),
        "service": "SurakshaAI",
        "version": "3.0.0",
    }


# ============================================================================
# Run directly with: python main.py
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )