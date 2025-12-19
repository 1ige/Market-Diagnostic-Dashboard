from fastapi import APIRouter, HTTPException
from app.services.ingestion.etl_runner import ETLRunner

router = APIRouter()
etl = ETLRunner()


@router.post("/ingest/run")
async def run_all_indicators():
    """Trigger ingestion for ALL indicators."""
    try:
        results = await etl.ingest_all_indicators()
        status = etl.update_system_status()
        return {
            "message": "Ingestion completed",
            "results": results,
            "system_status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest/{code}")
async def run_single_indicator(code: str):
    """Trigger ingestion for a single indicator."""
    try:
        result = await etl.ingest_indicator(code)
        status = etl.update_system_status()
        return {
            "message": f"Ingestion completed for {code}",
            "result": result,
            "system_status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/status/update")
def update_system_status():
    """Re-run only the system status aggregation."""
    try:
        status = etl.update_system_status()
        return {
            "message": "System status updated",
            "system_status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backfill")
async def backfill_historical_data(days: int = 365):
    """Backfill historical data for all indicators."""
    try:
        results = await etl.backfill_all_indicators(days=days)
        status = etl.update_system_status()
        
        success_count = sum(1 for r in results if "error" not in r)
        total_backfilled = sum(r.get("backfilled", 0) for r in results if "backfilled" in r)
        
        return {
            "message": f"Backfill completed for {days} days",
            "success_count": success_count,
            "total_count": len(results),
            "total_datapoints": total_backfilled,
            "results": results,
            "system_status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear-refetch/{code}")
async def clear_and_refetch_indicator(code: str, days: int = 365):
    """Clear all data for an indicator and refetch it. Useful for fixing corrupt data."""
    from app.core.db import SessionLocal
    from app.models.indicator_value import IndicatorValue
    from app.models.indicator import Indicator
    
    try:
        db = SessionLocal()
        
        # Find the indicator
        indicator = db.query(Indicator).filter(Indicator.code == code).first()
        if not indicator:
            db.close()
            raise HTTPException(status_code=404, detail=f"Indicator {code} not found")
        
        # Delete all values for this indicator
        deleted_count = db.query(IndicatorValue).filter(
            IndicatorValue.indicator_id == indicator.id
        ).delete()
        
        db.commit()
        db.close()
        
        # Refetch the data
        result = await etl.ingest_indicator(code, backfill_days=days)
        status = etl.update_system_status()
        
        return {
            "message": f"Cleared {deleted_count} records and refetched {code}",
            "deleted_records": deleted_count,
            "result": result,
            "system_status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))