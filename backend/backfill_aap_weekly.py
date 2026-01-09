"""
Backfill AAP (Alternative Asset Pressure) indicator data using weekly aggregates.

This script calculates AAP for historical weeks using available macro data,
even when daily crypto data isn't available. Uses weekly averages to smooth data.
"""

from datetime import datetime, timedelta
from app.core.db import SessionLocal
from app.services.aap_calculator import AAPCalculator
from app.models.alternative_assets import AAPIndicator, MacroLiquidityData
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def backfill_aap_weekly():
    """Backfill AAP indicator data using weekly aggregates."""
    db = SessionLocal()
    
    try:
        logger.info("🚀 Starting AAP weekly data backfill...")
        
        # Find earliest and latest macro data
        earliest_macro = db.query(MacroLiquidityData).order_by(
            MacroLiquidityData.date
        ).first()
        
        if not earliest_macro:
            logger.warning("No macro data available for backfill")
            return
        
        calculator = AAPCalculator(db)
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        successful_calculations = 0
        failed_calculations = 0
        skipped_calculations = 0
        
        # Generate weekly dates going back from today
        # Week ends on Sunday
        current_date = today
        
        # Find the most recent Sunday
        while current_date.weekday() != 6:  # 6 = Sunday
            current_date -= timedelta(days=1)
        
        logger.info(f"🧮 Calculating AAP indicator for historical weeks...")
        logger.info(f"   Macro data available from {earliest_macro.date.date()}")
        
        weeks_processed = 0
        while current_date >= earliest_macro.date.replace(hour=0, minute=0, second=0, microsecond=0):
            # Check if indicator already exists for this date
            existing = db.query(AAPIndicator).filter(
                AAPIndicator.date == current_date
            ).first()
            
            if existing:
                skipped_calculations += 1
            else:
                try:
                    indicator = calculator.calculate_for_date(current_date)
                    if indicator:
                        successful_calculations += 1
                    else:
                        failed_calculations += 1
                except Exception as e:
                    failed_calculations += 1
                    logger.debug(f"  Error on {current_date.date()}: {e}")
            
            # Move back one week
            current_date -= timedelta(weeks=1)
            weeks_processed += 1
            
            if weeks_processed % 10 == 0:
                logger.info(f"  ✓ {weeks_processed} weeks processed...")
        
        logger.info(f"\n📈 Weekly backfill complete!")
        logger.info(f"   ✅ Successful: {successful_calculations} weeks")
        logger.info(f"   ⏭  Skipped: {skipped_calculations} weeks (already exist)")
        logger.info(f"   ⚠️  Failed: {failed_calculations} weeks")
        
        # Show coverage
        from sqlalchemy import func, desc
        first_aap = db.query(AAPIndicator).order_by(AAPIndicator.date).first()
        last_aap = db.query(AAPIndicator).order_by(desc(AAPIndicator.date)).first()
        total = db.query(func.count(AAPIndicator.id)).scalar()
        
        if first_aap and last_aap:
            days_span = (last_aap.date - first_aap.date).days
            logger.info(f"\n🎯 AAP Coverage:")
            logger.info(f"   From: {first_aap.date.date()}")
            logger.info(f"   To: {last_aap.date.date()}")
            logger.info(f"   Total: {total} records ({days_span} days)")
        
    except Exception as e:
        logger.error(f"❌ Backfill failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    backfill_aap_weekly()
