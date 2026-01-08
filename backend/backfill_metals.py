"""
Backfill historical precious metals price data
Run this script to populate the database with historical prices
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ingestion.precious_metals_ingester import PreciousMetalsIngester
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    days = 365
    if len(sys.argv) > 1:
        days = int(sys.argv[1])
    
    logger.info(f"Starting backfill of {days} days of precious metals prices...")
    
    ingester = PreciousMetalsIngester()
    count = ingester.backfill_historical_prices(days)
    
    logger.info(f"Backfill complete! Inserted {count} price records.")
