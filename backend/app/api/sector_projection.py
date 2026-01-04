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
from app.services.sector_projection import compute_sector_projections, fetch_sector_price_history, MODEL_VERSION, WEIGHTS
from app.models.system_status import SystemStatus
from typing import List, Dict, Any

router = APIRouter()

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
        return {
            "as_of_date": str(run.as_of_date),
            "model_version": run.model_version,
            "system_state": run.system_state,
            "projections": result,
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
        runs = db.query(SectorProjectionRun).filter(SectorProjectionRun.as_of_date >= cutoff).order_by(SectorProjectionRun.as_of_date).all()
        history = {}
        for run in runs:
            values = db.query(SectorProjectionValue).filter_by(run_id=run.id).all()
            for v in values:
                key = (v.sector_symbol, v.horizon)
                history.setdefault(key, []).append({
                    "as_of_date": str(run.as_of_date),
                    "score_total": v.score_total,
                    "rank": v.rank,
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
    projections = compute_sector_projections(price_data, system_state=system_state)
    if not projections:
        raise HTTPException(status_code=500, detail="Failed to compute projections.")
    # Store in DB
    as_of_date = datetime.utcnow().date()
    with get_db_session() as db:
        run = SectorProjectionRun(
            as_of_date=as_of_date,
            created_at=datetime.utcnow(),
            system_state=system_state,
            model_version=MODEL_VERSION,
            config_json={"weights": WEIGHTS},
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
