"""
ai_engine.py
------------
AI-based semantic fraud detection using facebook/bart-large-mnli
(zero-shot classification).

The model and tokenizer are loaded **once** at module import time so that
subsequent calls to `analyze_text()` are fast.

Runs on CPU only – no GPU required.
"""

from __future__ import annotations

import logging
from typing import Any

from transformers import pipeline  # type: ignore

logger = logging.getLogger(__name__)

# ============================================================================
# Global model loading – happens once when this module is first imported.
# ============================================================================

# Candidate labels for zero-shot classification
CANDIDATE_LABELS: list[str] = ["fraud", "suspicious", "legitimate"]

logger.info("Loading facebook/bart-large-mnli model (CPU) …")

try:
    _classifier = pipeline(
        task="zero-shot-classification",
        model="facebook/bart-large-mnli",
        device=-1,  # force CPU
    )
    _model_loaded: bool = True
    logger.info("Model loaded successfully.")
except Exception as exc:  # pragma: no cover
    logger.error("Failed to load AI model: %s", exc)
    _classifier = None
    _model_loaded = False


# ============================================================================
# Public API
# ============================================================================

def is_model_loaded() -> bool:
    """Return True if the model was loaded without errors."""
    return _model_loaded


def analyze_text(text: str) -> dict[str, Any]:
    """
    Run zero-shot classification on *text*.

    Parameters
    ----------
    text : str
        The message or transcript to classify.

    Returns
    -------
    dict
        probability – float 0-1 (score for the *fraud* label)
        confidence  – float 0-1 (highest score across all labels)
        label       – str   the winning label
    """
    # Fallback when the model could not be loaded
    if not _model_loaded or _classifier is None:
        logger.warning("AI model not available – returning neutral result.")
        return {
            "probability": 0.0,
            "confidence": 0.0,
            "label": "unknown",
        }

    try:
        result = _classifier(
            text,
            candidate_labels=CANDIDATE_LABELS,
            multi_label=False,
        )

        # result is a dict: { "labels": [...], "scores": [...], "sequence": ... }
        labels: list[str] = result["labels"]
        scores: list[float] = result["scores"]

        # Build a label → score mapping for easy look-up
        label_score_map: dict[str, float] = dict(zip(labels, scores))

        # Probability of fraud specifically
        fraud_prob: float = label_score_map.get("fraud", 0.0)

        # Overall confidence = the top score regardless of label
        top_score: float = max(scores) if scores else 0.0
        top_label: str = labels[0] if labels else "unknown"

        return {
            "probability": round(fraud_prob, 4),
            "confidence": round(top_score, 4),
            "label": top_label,
        }

    except Exception as exc:
        logger.error("AI analysis failed: %s", exc)
        return {
            "probability": 0.0,
            "confidence": 0.0,
            "label": "error",
        }