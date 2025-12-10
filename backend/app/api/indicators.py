from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from typing import List, Generator

from app.core.db import SessionLocal
from app.models.indicator import Indicator
from app.models.indicator_value import IndicatorValue
from app.services.indicator_metadata import get_indicator_metadata

router = APIRouter()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/indicators")
def list_indicators():
    """Return basic metadata for all indicators."""
    db = SessionLocal()
    indicators: List[Indicator] = db.query(Indicator).all()
    db.close()

    return [
        {
            "code": ind.code,
            "name": ind.name,
            "source": ind.source,
            "source_symbol": ind.source_symbol,
            "category": ind.category,
            "direction": ind.direction,
            "lookback_days_for_z": ind.lookback_days_for_z,
            "weight": ind.weight,
        }
        for ind in indicators
    ]


@router.get("/indicators/{code}")
def get_indicator_detail(code: str):
    """Return metadata + latest value for a single indicator."""
    db = SessionLocal()

    ind: Indicator | None = (
        db.query(Indicator)
        .filter(Indicator.code == code)
        .first()
    )

    if not ind:
        db.close()
        raise HTTPException(status_code=404, detail=f"Indicator {code} not found")

    latest: IndicatorValue | None = (
        db.query(IndicatorValue)
        .filter(IndicatorValue.indicator_id == ind.id)
        .order_by(IndicatorValue.timestamp.desc())
        .first()
    )

    metadata = get_indicator_metadata(code)
    
    db.close()

    if not latest:
        return {
            "code": ind.code,
            "name": ind.name,
            "has_data": False,
            "metadata": metadata,
        }

    return {
        "code": ind.code,
        "name": ind.name,
        "source": ind.source,
        "source_symbol": ind.source_symbol,
        "category": ind.category,
        "direction": ind.direction,
        "lookback_days_for_z": ind.lookback_days_for_z,
        "weight": ind.weight,
        "latest": {
            "timestamp": latest.timestamp.isoformat(),
            "raw_value": latest.raw_value,
            "normalized_value": latest.normalized_value,
            "score": latest.score,
            "state": latest.state,
        },
        "metadata": metadata,
    }


@router.get("/indicators/{code}/history")
def get_indicator_history(code: str, days: int = 365):
    """Return time-series history for a single indicator (raw + score + state)."""
    from datetime import datetime, timedelta

    db = SessionLocal()

    ind: Indicator | None = (
        db.query(Indicator)
        .filter(Indicator.code == code)
        .first()
    )

    if not ind:
        db.close()
        raise HTTPException(status_code=404, detail=f"Indicator {code} not found")

    cutoff = datetime.utcnow() - timedelta(days=days)

    values: List[IndicatorValue] = (
        db.query(IndicatorValue)
        .filter(
            IndicatorValue.indicator_id == ind.id,
            IndicatorValue.timestamp >= cutoff,
        )
        .order_by(IndicatorValue.timestamp.asc())
        .all()
    )

    db.close()

    return [
        {
            "timestamp": v.timestamp.isoformat(),
            "raw_value": v.raw_value,
            "score": v.score,
            "state": v.state,
        }
        for v in values
    ]


@router.get("/indicators/{code}/components")
def get_indicator_components(code: str, days: int = 365):
    """
    Return component breakdown for derived indicators.
    Currently supports: CONSUMER_HEALTH (returns PCE, PI, CPI data)
    """
    from datetime import datetime, timedelta
    import asyncio
    from app.services.ingestion.fred_client import FredClient
    
    if code != "CONSUMER_HEALTH":
        raise HTTPException(
            status_code=400, 
            detail=f"Component breakdown not available for {code}"
        )
    
    # Fetch component data
    async def fetch_components():
        client = FredClient()
        cutoff = datetime.utcnow() - timedelta(days=days)
        start_date = cutoff.strftime("%Y-%m-%d")
        
        pce_series = await client.fetch_series("PCE", start_date=start_date)
        cpi_series = await client.fetch_series("CPIAUCSL", start_date=start_date)
        pi_series = await client.fetch_series("PI", start_date=start_date)
        
        return pce_series, cpi_series, pi_series
    
    pce_data, cpi_data, pi_data = asyncio.run(fetch_components())
    
    # Calculate MoM% for each
    def calc_mom_pct(series):
        result = []
        for i in range(len(series)):
            if i == 0:
                result.append({"date": series[i]["date"], "value": series[i]["value"], "mom_pct": 0.0})
            else:
                prev_val = series[i-1]["value"]
                curr_val = series[i]["value"]
                mom_pct = ((curr_val - prev_val) / prev_val * 100) if prev_val != 0 else 0.0
                result.append({"date": series[i]["date"], "value": curr_val, "mom_pct": mom_pct})
        return result
    
    pce_with_mom = calc_mom_pct(pce_data)
    cpi_with_mom = calc_mom_pct(cpi_data)
    pi_with_mom = calc_mom_pct(pi_data)
    
    # Align by date and calculate spreads
    pce_dict = {x["date"]: x for x in pce_with_mom}
    cpi_dict = {x["date"]: x for x in cpi_with_mom}
    pi_dict = {x["date"]: x for x in pi_with_mom}
    
    common_dates = sorted(set(pce_dict.keys()) & set(cpi_dict.keys()) & set(pi_dict.keys()))
    
    result = []
    for date in common_dates:
        pce_mom = pce_dict[date]["mom_pct"]
        cpi_mom = cpi_dict[date]["mom_pct"]
        pi_mom = pi_dict[date]["mom_pct"]
        
        pce_vs_cpi = pce_mom - cpi_mom
        pi_vs_cpi = pi_mom - cpi_mom
        consumer_health = pce_vs_cpi + pi_vs_cpi
        
        result.append({
            "date": date,
            "pce": {
                "value": pce_dict[date]["value"],
                "mom_pct": pce_mom,
            },
            "cpi": {
                "value": cpi_dict[date]["value"],
                "mom_pct": cpi_mom,
            },
            "pi": {
                "value": pi_dict[date]["value"],
                "mom_pct": pi_mom,
            },
            "spreads": {
                "pce_vs_cpi": pce_vs_cpi,
                "pi_vs_cpi": pi_vs_cpi,
                "consumer_health": consumer_health,
            }
        })
    
    return result