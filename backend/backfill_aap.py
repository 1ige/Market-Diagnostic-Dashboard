"""
Backfill AAP (Alternative Asset Pressure) indicator data.

This script populates historical AAP calculations by running AAP calculations for the past 90 days.
"""

from datetime import datetime, timedelta
from app.core.db import SessionLocal
from app.services.aap_calculator import AAPCalculator
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def backfill_aap_data():
    """Backfill AAP indicator data."""
    db = SessionLocal()
    
    try:
        logger.info("🚀 Starting AAP data backfill...")
        
        # Calculate AAP for the past 365 days
        logger.info("🧮 Calculating AAP indicator for past 365 days...")
        
        from app.models.alternative_assets import AAPIndicator
        
        calculator = AAPCalculator(db)
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        successful_calculations = 0
        failed_calculations = 0
        skipped_calculations = 0
        
        for days_ago in range(365, -1, -1):
            target_date = today - timedelta(days=days_ago)
            
            # Check if indicator already exists for this date
            existing = db.query(AAPIndicator).filter(
                AAPIndicator.date == target_date
            ).first()
            
            if existing:
                skipped_calculations += 1
                if days_ago % 10 == 0:
                    logger.info(f"  ⏭ {target_date.date()}: Already exists (Score={existing.stability_score:.1f})")
                continue
            
            try:
                indicator = calculator.calculate_for_date(target_date)
                if indicator:
                    successful_calculations += 1
                    if days_ago % 10 == 0:
                        logger.info(f"  ✓ {target_date.date()}: Score={indicator.stability_score:.1f}, Regime={indicator.regime}")
                else:
                    failed_calculations += 1
                    if days_ago % 10 == 0:
                        logger.warning(f"  ⚠ {target_date.date()}: Insufficient data")
            except Exception as e:
                failed_calculations += 1
                logger.error(f"  ✗ {target_date.date()}: Error - {e}")
        
        logger.info(f"\n📈 Backfill complete!")
        logger.info(f"   ✅ Successful: {successful_calculations} days")
        logger.info(f"   ⏭  Skipped: {skipped_calculations} days (already exist)")
        logger.info(f"   ⚠️  Failed: {failed_calculations} days")
        
        # Show most recent calculation
        latest = db.query(AAPIndicator).order_by(AAPIndicator.date.desc()).first()
        if latest:
            logger.info(f"\n🎯 Latest AAP Reading:")
            logger.info(f"   Date: {latest.date.date()}")
            logger.info(f"   Stability Score: {latest.stability_score:.1f}")
            logger.info(f"   Regime: {latest.regime}")
            logger.info(f"   Primary Driver: {latest.primary_driver}")
            logger.info(f"   Metals: {latest.metals_contribution:.1%}")
            logger.info(f"   Crypto: {latest.crypto_contribution:.1%}")
        
    except Exception as e:
        logger.error(f"❌ Backfill failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    backfill_aap_data()
