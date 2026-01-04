"""
Background Scheduler for ETL Jobs

Automatically refreshes indicator data at regular intervals.
"""

import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.services.ingestion.etl_runner import ETLRunner
from app.services.sector_projection import compute_sector_projections, fetch_sector_price_history, MODEL_VERSION, WEIGHTS
from app.models.sector_projection import SectorProjectionRun, SectorProjectionValue
from app.models.system_status import SystemStatus
from app.utils.db_helpers import get_db_session
from datetime import datetime

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
etl = ETLRunner()


async def scheduled_etl_job():
    """
    Background task that ingests all indicators, updates system status, and computes sector projections.
    Runs on a schedule (default: every 4 hours during market hours).
    """
    try:
        logger.info("🔄 Starting scheduled ETL job...")
        results = await etl.ingest_all_indicators()
        status = etl.update_system_status()
        success_count = sum(1 for r in results if "error" not in r)
        error_count = len(results) - success_count
        logger.info(
            f"✅ ETL job completed: {success_count} success, "
            f"{error_count} errors. System state: {status['system_state']}"
        )
        # --- Sector Projections ---
        logger.info("🔮 Computing sector projections...")
        # Get system state
        system_state = status["system_state"] if status and "system_state" in status else "YELLOW"
        price_data = fetch_sector_price_history()
        projections = compute_sector_projections(price_data, system_state=system_state)
        if projections:
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
            logger.info(f"✅ Sector projections computed and stored for {as_of_date}")
        else:
            logger.warning("⚠️ No sector projections computed.")
    except Exception as e:
        logger.error(f"❌ ETL job failed: {str(e)}")


def start_scheduler():
    """
    Initialize and start the background scheduler.
    
    Schedule:
    - Run every 4 hours during weekdays (market data updates)
    - Skip weekends when markets are closed
    """
    # Run every 4 hours on weekdays (Mon-Fri), 8 AM to 8 PM ET
    scheduler.add_job(
        scheduled_etl_job,
        CronTrigger(
            day_of_week="mon-fri",
            hour="8-20/4",  # 8 AM, 12 PM, 4 PM, 8 PM
            timezone="America/New_York"
        ),
        id="etl_job",
        name="Indicator Data Ingestion",
        replace_existing=True,
    )
    
    scheduler.start()
    logger.info("📅 Scheduler started - ETL will run every 4 hours during market hours")


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("🛑 Scheduler stopped")


async def run_initial_etl():
    """
    Run ETL immediately on startup to ensure fresh data.
    This ensures the dashboard has current data even if the scheduled job hasn't run yet.
    """
    logger.info("🚀 Running initial ETL on startup...")
    await scheduled_etl_job()
