"""
Sector Summary API - Aggregate Metrics for Dashboard Integration

Provides high-level sector analysis metrics for dashboard widgets and quick insights.
Focuses on macro positioning indicators rather than detailed sector-by-sector breakdowns.

Key Metrics:
- Defensive vs Cyclical Performance: Average scores for each category
- Regime Alignment: How well current positioning matches expected market behavior
- Sector Breadth: Count of improving vs deteriorating sectors across horizons

This endpoint powers the SectorDivergenceWidget on the main Dashboard.
"""

from fastapi import APIRouter, HTTPException
from app.utils.db_helpers import get_db_session
from app.models.sector_projection import SectorProjectionRun, SectorProjectionValue
from app.models.system_status import SystemStatus

router = APIRouter()

# Sector classifications
DEFENSIVE_SECTORS = ["XLU", "XLP", "XLV"]  # Utilities, Staples, Healthcare
CYCLICAL_SECTORS = ["XLE", "XLF", "XLK", "XLY"]  # Energy, Financials, Tech, Discretionary
OTHER_SECTORS = ["XLI", "XLB", "XLRE", "XLC"]  # Industrials, Materials, Real Estate, Communications


@router.get("/sectors/summary")
def get_sector_summary():
    """
    Get aggregate sector metrics for dashboard integration:
    - Defensive vs Cyclical performance split
    - Regime alignment score
    - Sector breadth (improving vs deteriorating)
    """
    with get_db_session() as db:
        # Get latest projection run
        run = db.query(SectorProjectionRun).order_by(SectorProjectionRun.as_of_date.desc()).first()
        if not run:
            raise HTTPException(status_code=404, detail="No sector projections available")
        
        # Get all values for the latest run
        values = db.query(SectorProjectionValue).filter_by(run_id=run.id).all()
        
        # Organize by horizon
        by_horizon = {"T": [], "3m": [], "6m": [], "12m": []}
        for v in values:
            if v.horizon in by_horizon:
                by_horizon[v.horizon].append({
                    "symbol": v.sector_symbol,
                    "name": v.sector_name,
                    "score": v.score_total,
                    "rank": v.rank,
                })
        
        # Calculate defensive vs cyclical split (using 3m scores)
        data_3m = by_horizon["3m"]
        defensive_scores = [s["score"] for s in data_3m if s["symbol"] in DEFENSIVE_SECTORS]
        cyclical_scores = [s["score"] for s in data_3m if s["symbol"] in CYCLICAL_SECTORS]
        
        defensive_avg = sum(defensive_scores) / len(defensive_scores) if defensive_scores else 50
        cyclical_avg = sum(cyclical_scores) / len(cyclical_scores) if cyclical_scores else 50
        
        # Regime alignment: In RED, defensives should score higher; in GREEN, cyclicals should score higher
        system_state = run.system_state
        if system_state == "RED":
            # Expected: defensive > cyclical
            alignment_score = max(0, min(100, 50 + (defensive_avg - cyclical_avg)))
        elif system_state == "GREEN":
            # Expected: cyclical > defensive
            alignment_score = max(0, min(100, 50 + (cyclical_avg - defensive_avg)))
        else:
            # YELLOW: neutral expectation
            alignment_score = 50
        
        # Sector breadth: count sectors improving across horizons
        improving = 0
        deteriorating = 0
        for sector in data_3m:
            sym = sector["symbol"]
            score_3m = sector["score"]
            score_6m = next((s["score"] for s in by_horizon["6m"] if s["symbol"] == sym), score_3m)
            score_12m = next((s["score"] for s in by_horizon["12m"] if s["symbol"] == sym), score_3m)
            
            # Check trend: 3m < 6m < 12m = improving
            if score_3m < score_6m < score_12m:
                improving += 1
            elif score_3m > score_6m > score_12m:
                deteriorating += 1
        
        # Top defensive and cyclical sectors (3m)
        defensive_top = sorted([s for s in data_3m if s["symbol"] in DEFENSIVE_SECTORS], 
                               key=lambda x: x["score"], reverse=True)[:2]
        cyclical_top = sorted([s for s in data_3m if s["symbol"] in CYCLICAL_SECTORS], 
                              key=lambda x: x["score"], reverse=True)[:2]
        
        return {
            "as_of_date": str(run.as_of_date),
            "system_state": system_state,
            "defensive_avg": round(defensive_avg, 1),
            "cyclical_avg": round(cyclical_avg, 1),
            "defensive_vs_cyclical": round(defensive_avg - cyclical_avg, 1),
            "regime_alignment_score": round(alignment_score, 1),
            "sector_breadth": {
                "improving": improving,
                "deteriorating": deteriorating,
                "stable": 11 - improving - deteriorating,
            },
            "top_defensive": defensive_top,
            "top_cyclical": cyclical_top,
        }
