"""
database.py
-----------
SQLite persistence layer for SurakshaAI.

Provides:
  - init_db()        – create the analysis_results table if not exists
  - save_analysis()  – insert a completed analysis row
  - get_history()    – retrieve all past analyses (newest first)
  - get_trends()     – aggregate statistics for the dashboard

ENHANCEMENT v2:
  - Added has_money_request column (INTEGER DEFAULT 0)
  - Backward-compatible ALTER TABLE migration for existing databases

Uses plain sqlite3 – no ORM.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

# ============================================================================
# Database file path (project root / backend / suraksha.db)
# ============================================================================

DB_PATH: str = str(Path(__file__).resolve().parent / "suraksha.db")


def _get_connection() -> sqlite3.Connection:
    """Return a new connection with row_factory set to sqlite3.Row."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ============================================================================
# Schema initialisation
# ============================================================================

def init_db() -> None:
    """
    Create the analysis_results table if it does not already exist.
    Also applies backward-compatible migrations for new columns.
    """
    conn = _get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS analysis_results (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                message           TEXT    NOT NULL,
                rule_score        INTEGER NOT NULL,
                ai_score          REAL    NOT NULL,
                psych_score       INTEGER NOT NULL,
                final_score       INTEGER NOT NULL,
                risk_level        TEXT    NOT NULL,
                profile_used      TEXT    NOT NULL,
                categories        TEXT    NOT NULL DEFAULT '[]',
                psych_categories  TEXT    NOT NULL DEFAULT '[]',
                has_money_request INTEGER NOT NULL DEFAULT 0,
                timestamp         DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()

        # ---------------------------------------------------------------
        # MIGRATION v2: Add has_money_request column if it doesn't exist.
        # This handles the case where the table was created by v1 and
        # the column is missing.  ALTER TABLE ADD COLUMN is safe in
        # SQLite – it never deletes data.
        # ---------------------------------------------------------------
        _migrate_add_column(
            conn,
            table="analysis_results",
            column="has_money_request",
            col_type="INTEGER NOT NULL DEFAULT 0",
        )

        conn.commit()
    finally:
        conn.close()


def _migrate_add_column(
    conn: sqlite3.Connection,
    table: str,
    column: str,
    col_type: str,
) -> None:
    """
    Safely add a column to an existing table if it doesn't exist.
    Uses PRAGMA table_info to check existing columns.
    """
    cursor = conn.execute(f"PRAGMA table_info({table})")
    existing_columns = {row["name"] for row in cursor.fetchall()}

    if column not in existing_columns:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")


# ============================================================================
# Write operations
# ============================================================================

def save_analysis(
    message: str,
    rule_score: int,
    ai_score: float,
    psych_score: int,
    final_score: int,
    risk_level: str,
    profile_used: str,
    categories: list[str] | None = None,
    psych_categories: list[str] | None = None,
    has_money_request: bool = False,
) -> int:
    """
    Persist a single analysis result and return the new row id.

    Parameters
    ----------
    message           : original message text
    rule_score        : 0-100
    ai_score          : 0-1 (fraud probability)
    psych_score       : 0-100
    final_score       : 0-100
    risk_level        : Low / Medium / High / Critical
    profile_used      : student / elderly / business_owner / general
    categories        : scam categories from rule engine
    psych_categories  : psychological categories
    has_money_request : whether a money request was detected (NEW v2)

    Returns
    -------
    int – the auto-incremented id of the inserted row.
    """
    conn = _get_connection()
    try:
        cursor = conn.execute(
            """
            INSERT INTO analysis_results
                (message, rule_score, ai_score, psych_score, final_score,
                 risk_level, profile_used, categories, psych_categories,
                 has_money_request)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                message,
                rule_score,
                ai_score,
                psych_score,
                final_score,
                risk_level,
                profile_used,
                json.dumps(categories or []),
                json.dumps(psych_categories or []),
                1 if has_money_request else 0,
            ),
        )
        conn.commit()
        return cursor.lastrowid  # type: ignore[return-value]
    finally:
        conn.close()


# ============================================================================
# Read operations
# ============================================================================

def get_history(limit: int = 100) -> list[dict[str, Any]]:
    """
    Retrieve the most recent *limit* analysis results, newest first.
    """
    conn = _get_connection()
    try:
        rows = conn.execute(
            """
            SELECT id, message, rule_score, ai_score, psych_score,
                   final_score, risk_level, profile_used,
                   categories, psych_categories, has_money_request,
                   timestamp
            FROM analysis_results
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        results: list[dict[str, Any]] = []
        for row in rows:
            results.append(
                {
                    "id": row["id"],
                    "message": row["message"],
                    "rule_score": row["rule_score"],
                    "ai_score": row["ai_score"],
                    "psych_score": row["psych_score"],
                    "final_score": row["final_score"],
                    "risk_level": row["risk_level"],
                    "profile_used": row["profile_used"],
                    "categories": json.loads(row["categories"]),
                    "psych_categories": json.loads(row["psych_categories"]),
                    "has_money_request": bool(row["has_money_request"]),
                    "timestamp": row["timestamp"],
                }
            )
        return results
    finally:
        conn.close()


def get_analysis_by_id(analysis_id: int) -> dict[str, Any] | None:
    """Retrieve a single analysis by its primary-key *analysis_id*."""
    conn = _get_connection()
    try:
        row = conn.execute(
            """
            SELECT id, message, rule_score, ai_score, psych_score,
                   final_score, risk_level, profile_used,
                   categories, psych_categories, has_money_request,
                   timestamp
            FROM analysis_results
            WHERE id = ?
            """,
            (analysis_id,),
        ).fetchone()

        if row is None:
            return None

        return {
            "id": row["id"],
            "message": row["message"],
            "rule_score": row["rule_score"],
            "ai_score": row["ai_score"],
            "psych_score": row["psych_score"],
            "final_score": row["final_score"],
            "risk_level": row["risk_level"],
            "profile_used": row["profile_used"],
            "categories": json.loads(row["categories"]),
            "psych_categories": json.loads(row["psych_categories"]),
            "has_money_request": bool(row["has_money_request"]),
            "timestamp": row["timestamp"],
        }
    finally:
        conn.close()


# ============================================================================
# Analytics / Trends
# ============================================================================

def get_trends() -> dict[str, Any]:
    """
    Compute aggregate trend analytics across all stored results.

    Returns
    -------
    dict
        risk_distribution          – dict[str, int]  count per risk level
        most_common_scam_category  – str
        most_common_psych_trigger  – str
    """
    conn = _get_connection()
    try:
        # --- Risk distribution -----------------------------------------------
        risk_rows = conn.execute(
            """
            SELECT risk_level, COUNT(*) as cnt
            FROM analysis_results
            GROUP BY risk_level
            """
        ).fetchall()

        risk_distribution: dict[str, int] = {
            "Low": 0, "Medium": 0, "High": 0, "Critical": 0,
        }
        for row in risk_rows:
            risk_distribution[row["risk_level"]] = row["cnt"]

        # --- Most common scam category ---------------------------------------
        all_categories_rows = conn.execute(
            "SELECT categories FROM analysis_results"
        ).fetchall()

        cat_counter: dict[str, int] = {}
        for row in all_categories_rows:
            cats: list[str] = json.loads(row["categories"])
            for c in cats:
                cat_counter[c] = cat_counter.get(c, 0) + 1

        most_common_scam = (
            max(cat_counter, key=cat_counter.get)  # type: ignore[arg-type]
            if cat_counter
            else "N/A"
        )

        # --- Most common psychological trigger --------------------------------
        all_psych_rows = conn.execute(
            "SELECT psych_categories FROM analysis_results"
        ).fetchall()

        psych_counter: dict[str, int] = {}
        for row in all_psych_rows:
            pcats: list[str] = json.loads(row["psych_categories"])
            for p in pcats:
                psych_counter[p] = psych_counter.get(p, 0) + 1

        most_common_psych = (
            max(psych_counter, key=psych_counter.get)  # type: ignore[arg-type]
            if psych_counter
            else "N/A"
        )

        return {
            "risk_distribution": risk_distribution,
            "most_common_scam_category": most_common_scam,
            "most_common_psych_trigger": most_common_psych,
        }
    finally:
        conn.close()