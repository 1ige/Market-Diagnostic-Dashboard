"""
Sector Projection API Endpoints

Provides REST API access to sector ETF performance projections computed by the transparent
scoring system. Includes latest projections, historical data, and manual refresh capabilities.

Endpoints:
- GET /sectors/projections/latest: Current projections for all sectors across all horizons
- GET /sectors/projections/history: Time-series of projection runs for trend analysis
- POST /sectors/projections/refresh: Trigger immediate recomputation (admin use)

All projections include:
- Composite score (0-100) and component scores (trend, relative strength, risk, regime)
- Ranking and classification (Winner/Neutral/Loser)
- Raw metrics (returns, volatility, drawdown, etc.)
"""

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.utils.db_helpers import get_db_session
from app.models.sector_projection import SectorProjectionRun, SectorProjectionValue
from app.services.sector_projection import (
    compute_sector_projections,
    detect_duplicate_series,
    detect_stale_series,
    fetch_sector_price_history,
    MODEL_VERSION,
    WEIGHTS,
)
from app.models.system_status import SystemStatus
from typing import List, Dict, Any
from functools import lru_cache

router = APIRouter()

# Cache historical scores since they don't change (based on date)
_historical_scores_cache = {}
_cache_date = None

def _get_or_compute_historical_scores(db: Session) -> Dict[str, float]:
    """Get cached historical scores or compute them once per day (UTC)."""
    global _historical_scores_cache, _cache_date
    
    today_utc = datetime.utcnow().date()
    
    # Return cached result if we have it for today
    if _cache_date == today_utc and _historical_scores_cache:
        return _historical_scores_cache

    # Avoid expensive Yahoo history pulls during requests.
    # This prevents long-running requests that can trigger 504s.
    _historical_scores_cache = {}
    _cache_date = today_utc
    return _historical_scores_cache

@router.get("/sectors/projections/latest")
def get_latest_projections():
    import math
    def clean_float(val):
        """Convert NaN/Inf to None for JSON serialization"""
        if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
            return None
        return val
    
    with get_db_session() as db:
        run = db.query(SectorProjectionRun).order_by(SectorProjectionRun.as_of_date.desc()).first()
        if not run:
            raise HTTPException(status_code=404, detail="No sector projections available.")
        values = db.query(SectorProjectionValue).filter_by(run_id=run.id).all()
        result = {}
        # Group by horizon first to get correct count per horizon
        for v in values:
            result.setdefault(v.horizon, [])
        
        # Now add each value with correct classification
        for v in values:
            n_sectors = len([val for val in values if val.horizon == v.horizon])
            result[v.horizon].append({
                "sector_symbol": v.sector_symbol,
                "sector_name": v.sector_name,
                "score_total": clean_float(v.score_total),
                "score_trend": clean_float(v.score_trend),
                "score_rel": clean_float(v.score_rel),
                "score_risk": clean_float(v.score_risk),
                "score_regime": clean_float(v.score_regime),
                "rank": v.rank,
                "metrics": {k: clean_float(val) for k, val in (v.metrics_json or {}).items()},
                "classification": classify_rank(v.rank, n_sectors),
            })
        
        # Compute or get cached historical scores
        historical_scores = _get_or_compute_historical_scores(db)
        
        return {
            "run_id": run.id,
            "as_of_date": str(run.as_of_date),
            "created_at": run.created_at.isoformat(),
            "model_version": run.model_version,
            "system_state": run.system_state,
            "data_warnings": (run.config_json or {}).get("data_warnings", []),
            "projections": result,
            "historical": historical_scores,  # {sector_symbol: score_3m_ago}
        }

@router.get("/sectors/projections/warnings")
def get_projection_warnings():
    with get_db_session() as db:
        run = db.query(SectorProjectionRun).order_by(SectorProjectionRun.created_at.desc()).first()
        if not run:
            raise HTTPException(status_code=404, detail="No sector projections available.")
        return {
            "run_id": run.id,
            "as_of_date": str(run.as_of_date),
            "created_at": run.created_at.isoformat(),
            "system_state": run.system_state,
            "data_warnings": (run.config_json or {}).get("data_warnings", []),
        }

def classify_rank(rank, n):
    if rank <= 3:
        return "Winner"
    elif rank > n - 3:
        return "Loser"
    return "Neutral"

@router.get("/sectors/projections/history")
def get_projection_history(days: int = Query(365, ge=1, le=1095)):
    cutoff = datetime.utcnow().date() - timedelta(days=days)
    with get_db_session() as db:
        runs = (
            db.query(SectorProjectionRun)
            .filter(SectorProjectionRun.as_of_date >= cutoff)
            .order_by(SectorProjectionRun.as_of_date)
            .all()
        )
        history: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}

        for run in runs:
            values = db.query(SectorProjectionValue).filter_by(run_id=run.id).all()
            for v in values:
                history.setdefault(v.sector_symbol, {}).setdefault(v.horizon, []).append({
                    "as_of_date": str(run.as_of_date),
                    "created_at": run.created_at.isoformat(),
                    "run_id": run.id,
                    "score_total": v.score_total,
                    "rank": v.rank,
                })

        # Include cached previous run if present on the latest run.
        if runs:
            latest_run = runs[-1]
            prev_cache = (latest_run.config_json or {}).get("previous_run_cache")
            if prev_cache and prev_cache.get("as_of_date"):
                try:
                    prev_date = datetime.fromisoformat(prev_cache["as_of_date"]).date()
                except ValueError:
                    prev_date = None
                if prev_date and prev_date >= cutoff:
                    for v in prev_cache.get("values", []):
                        history.setdefault(v["sector_symbol"], {}).setdefault(v["horizon"], []).append({
                            "as_of_date": prev_cache["as_of_date"],
                            "created_at": prev_cache.get("created_at"),
                            "run_id": prev_cache.get("run_id"),
                            "score_total": v["score_total"],
                            "rank": v["rank"],
                        })
        return history

@router.post("/sectors/projections/refresh")
def refresh_projections():
    # Get current system state
    with get_db_session() as db:
        status = db.query(SystemStatus).order_by(SystemStatus.timestamp.desc()).first()
        system_state = status.state if status else "YELLOW"
    # Fetch data and compute projections
    price_data = fetch_sector_price_history()
    duplicates = detect_duplicate_series(price_data)
    stale = detect_stale_series(price_data)
    warnings = []
    if duplicates:
        warnings.append({"type": "duplicate_series", "details": duplicates})
    if stale:
        warnings.append({"type": "stale_series", "details": stale})
    if duplicates:
        raise HTTPException(
            status_code=500,
            detail="Duplicate sector price series detected; aborting projection refresh.",
        )
    projections = compute_sector_projections(price_data, system_state=system_state)
    if not projections:
        raise HTTPException(status_code=500, detail="Failed to compute projections.")
    # Store in DB
    as_of_date = datetime.utcnow().date()
    with get_db_session() as db:
        prev_run = (
            db.query(SectorProjectionRun)
            .order_by(SectorProjectionRun.created_at.desc())
            .first()
        )
        prev_cache = None
        if prev_run:
            prev_values = (
                db.query(SectorProjectionValue)
                .filter_by(run_id=prev_run.id)
                .all()
            )
            prev_cache = {
                "run_id": prev_run.id,
                "as_of_date": str(prev_run.as_of_date),
                "created_at": prev_run.created_at.isoformat(),
                "system_state": prev_run.system_state,
                "model_version": prev_run.model_version,
                "values": [
                    {
                        "horizon": v.horizon,
                        "sector_symbol": v.sector_symbol,
                        "sector_name": v.sector_name,
                        "score_total": v.score_total,
                        "rank": v.rank,
                    }
                    for v in prev_values
                ],
            }

        run = SectorProjectionRun(
            as_of_date=as_of_date,
            created_at=datetime.utcnow(),
            system_state=system_state,
            model_version=MODEL_VERSION,
            config_json={
                "weights": WEIGHTS,
                "data_warnings": warnings,
                "previous_run_cache": prev_cache,
            },
        )
        db.add(run)
        db.flush()
        for p in projections:
            db.add(SectorProjectionValue(
                run_id=run.id,
                horizon=p["horizon"],
                sector_symbol=p["sector_symbol"],
                sector_name=p["sector_name"],
                score_total=p["score_total"],
                score_trend=p["score_trend"],
                score_rel=p["score_rel"],
                score_risk=p["score_risk"],
                score_regime=p["score_regime"],
                metrics_json=p["metrics"],
                rank=p["rank"],
            ))
        db.commit()
    return {"status": "ok", "as_of_date": str(as_of_date), "count": len(projections)}
