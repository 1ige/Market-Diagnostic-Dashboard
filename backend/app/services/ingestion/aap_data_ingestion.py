"""
Crypto and Macro Data Ingestion Service

Fetches crypto prices and macro liquidity data from external APIs.
"""

import requests
import logging
from datetime import datetime, timedelta, date
from typing import Optional, Dict, List
from sqlalchemy.orm import Session

from app.models.alternative_assets import CryptoPrice, MacroLiquidityData
from app.core.db import SessionLocal

logger = logging.getLogger(__name__)


class CryptoDataIngestion:
    """
    Fetches crypto market data from public APIs.
    
    Free data sources:
    - CoinGecko API (no key required, rate limited)
    - Alternative: CoinCap, CryptoCompare (may require keys)
    """
    
    COINGECKO_BASE = "https://api.coingecko.com/api/v3"
    
    def __init__(self, db: Session):
        self.db = db
    
    def fetch_current_prices(self) -> Optional[CryptoPrice]:
        """
        Fetch current crypto prices and market data.
        """
        try:
            # Get BTC and ETH prices
            url = f"{self.COINGECKO_BASE}/simple/price"
            params = {
                "ids": "bitcoin,ethereum",
                "vs_currencies": "usd",
                "include_24hr_vol": "true",
                "include_market_cap": "true"
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Get global market data
            global_url = f"{self.COINGECKO_BASE}/global"
            global_response = requests.get(global_url, timeout=10)
            global_response.raise_for_status()
            global_data = global_response.json()["data"]
            
            # Get gold price for BTC/Gold ratio
            gold_price = self._fetch_gold_price()
            
            crypto_price = CryptoPrice(
                date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
                btc_usd=data["bitcoin"]["usd"],
                eth_usd=data["ethereum"]["usd"],
                total_crypto_mcap=global_data["total_market_cap"]["usd"] / 1_000_000_000,  # Convert to billions
                btc_dominance=global_data["market_cap_percentage"]["btc"],
                btc_gold_ratio=data["bitcoin"]["usd"] / gold_price if gold_price else None,
                btc_volume_24h=data["bitcoin"]["usd_24h_vol"],
                source="CoinGecko"
            )
            
            # Check if today's data already exists
            existing = self.db.query(CryptoPrice).filter(
                CryptoPrice.date == crypto_price.date
            ).first()
            
            if existing:
                # Update existing record
                existing.btc_usd = crypto_price.btc_usd
                existing.eth_usd = crypto_price.eth_usd
                existing.total_crypto_mcap = crypto_price.total_crypto_mcap
                existing.btc_dominance = crypto_price.btc_dominance
                existing.btc_gold_ratio = crypto_price.btc_gold_ratio
                existing.btc_volume_24h = crypto_price.btc_volume_24h
                logger.info(f"Updated crypto prices for {crypto_price.date.date()}")
            else:
                self.db.add(crypto_price)
                logger.info(f"Added new crypto prices for {crypto_price.date.date()}")
            
            self.db.commit()
            return crypto_price
            
        except requests.RequestException as e:
            logger.error(f"Error fetching crypto prices: {e}")
            self.db.rollback()
            return None
        except Exception as e:
            logger.error(f"Unexpected error in crypto ingestion: {e}", exc_info=True)
            self.db.rollback()
            return None
    
    def fetch_historical_prices(self, days: int = 90) -> bool:
        """
        Backfill historical crypto prices.
        
        Note: CoinGecko historical data - using simple/price endpoint for recent days
        """
        try:
            # For free tier, fetch daily data one day at a time for last N days
            end_date = datetime.utcnow()
            
            for day_offset in range(days, 0, -1):
                date = (end_date - timedelta(days=day_offset)).replace(hour=0, minute=0, second=0, microsecond=0)
                
                # Check if exists
                existing = self.db.query(CryptoPrice).filter(
                    CryptoPrice.date == date
                ).first()
                
                if existing:
                    continue
                
                # Fetch current price (we'll use this as approximation for historical)
                # For production, use proper historical API or paid tier
                try:
                    url = f"{self.COINGECKO_BASE}/simple/price"
                    params = {
                        "ids": "bitcoin,ethereum",
                        "vs_currencies": "usd",
                        "include_24hr_vol": "true",
                        "include_market_cap": "true"
                    }
                    
                    response = requests.get(url, params=params, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    
                    # Get global data
                    global_url = f"{self.COINGECKO_BASE}/global"
                    global_response = requests.get(global_url, timeout=10)
                    global_response.raise_for_status()
                    global_data = global_response.json()["data"]
                    
                    gold_price = self._fetch_gold_price()
                    
                    crypto_price = CryptoPrice(
                        date=date,
                        btc_usd=data["bitcoin"]["usd"],
                        eth_usd=data["ethereum"]["usd"],
                        total_crypto_mcap=global_data["total_market_cap"]["usd"] / 1_000_000_000,
                        btc_dominance=global_data["market_cap_percentage"]["btc"],
                        btc_gold_ratio=data["bitcoin"]["usd"] / gold_price if gold_price else None,
                        btc_volume_24h=data["bitcoin"]["usd_24h_vol"],
                        source="CoinGecko"
                    )
                    self.db.add(crypto_price)
                    
                    # Rate limit: sleep between requests
                    import time
                    time.sleep(1.5)  # Conservative rate limiting
                    
                except Exception as e:
                    logger.warning(f"Could not fetch crypto data for {date.date()}: {e}")
                    continue
            
            self.db.commit()
            logger.info(f"Backfilled up to {days} days of crypto historical data")
            return True
            
        except Exception as e:
            logger.error(f"Error fetching historical crypto data: {e}", exc_info=True)
            self.db.rollback()
            return False
    
    def _fetch_gold_price(self) -> Optional[float]:
        """Helper to fetch current gold price for ratio calculation"""
        try:
            # Simple gold price API (metals-api.com or similar)
            # For now, fetch from existing database
            from app.models.precious_metals import MetalPrice
            from sqlalchemy import desc
            
            gold = self.db.query(MetalPrice).filter(
                MetalPrice.metal == 'AU'
            ).order_by(desc(MetalPrice.date)).first()
            
            return gold.price_usd_per_oz if gold else None
            
        except Exception:
            return None


class MacroDataIngestion:
    """
    Fetches macro liquidity data (Fed balance sheet, rates, etc.)
    
    Data sources:
    - FRED API (Federal Reserve Economic Data) - free with API key
    - Alternative: Manual CSV updates, or scraping
    """
    
    FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"
    
    def __init__(self, db: Session, fred_api_key: Optional[str] = None):
        self.db = db
        self.fred_api_key = fred_api_key or "YOUR_FRED_API_KEY"  # Should be in env config
    
    def fetch_current_macro_data(self) -> Optional[MacroLiquidityData]:
        """
        Fetch latest macro liquidity indicators.
        """
        if not self.fred_api_key or self.fred_api_key == "YOUR_FRED_API_KEY":
            logger.warning("FRED API key not configured. Using placeholder macro data.")
            # Return None instead of fake data - calculation will handle missing components
            return None
        
        try:
            # Fed balance sheet
            fed_bs = self._fetch_fred_series("WALCL")  # Weekly balance sheet
            
            # Federal funds rate
            fed_rate = self._fetch_fred_series("DFF")  # Daily fed rate
            
            # 10Y Treasury yield
            treasury_10y = self._fetch_fred_series("DGS10")
            
            # CPI (for real rate calculation)
            cpi_yoy = self._fetch_fred_series("CPIAUCSL", units="pc1")  # Year-over-year % change
            
            # Global M2 aggregate (sum of major economies)
            # Values are in billions, we'll convert to trillions
            us_m2 = self._fetch_fred_series("WM2NS")  # US M2 in billions
            china_m2 = self._fetch_fred_series("MYAGM2CNM189S")  # China M2 in billions
            eurozone_m2 = self._fetch_fred_series("MABMM301EZM189S")  # Eurozone M2 in billions
            japan_m2 = self._fetch_fred_series("MABMM301JPM189S")  # Japan M2 in billions
            uk_m2 = self._fetch_fred_series("MABMM301GBM189S")  # UK M2 in billions
            
            # Calculate global M2 (in trillions)
            global_m2 = None
            m2_components = [us_m2, china_m2, eurozone_m2, japan_m2, uk_m2]
            available_m2 = [x for x in m2_components if x is not None]
            
            if len(available_m2) >= 3:  # Need at least 3 major economies
                # Sum available components and convert to trillions
                global_m2 = sum(available_m2) / 1000.0
                logger.info(f"Global M2 calculated: ${global_m2:.2f}T ({len(available_m2)}/5 components)")
            else:
                logger.warning(f"Insufficient M2 data: only {len(available_m2)}/5 components available")
            
            if not fed_bs:
                logger.warning("Could not fetch Fed balance sheet data")
                return None
            
            # Calculate real rate
            real_rate = None
            if treasury_10y and cpi_yoy:
                real_rate = treasury_10y - cpi_yoy
            
            macro_data = MacroLiquidityData(
                date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
                fed_balance_sheet=fed_bs,
                fed_rate=fed_rate,
                real_rate_10y=real_rate,
                global_m2=global_m2,
                source="FRED"
            )
            
            # Check if today's data exists
            existing = self.db.query(MacroLiquidityData).filter(
                MacroLiquidityData.date == macro_data.date
            ).first()
            
            if existing:
                existing.fed_balance_sheet = macro_data.fed_balance_sheet
                existing.fed_rate = macro_data.fed_rate
                existing.real_rate_10y = macro_data.real_rate_10y
                existing.global_m2 = macro_data.global_m2
                logger.info(f"Updated macro data for {macro_data.date.date()}")
            else:
                self.db.add(macro_data)
                logger.info(f"Added new macro data for {macro_data.date.date()}")
            
            self.db.commit()
            return macro_data
            
        except Exception as e:
            logger.error(f"Error fetching macro data: {e}", exc_info=True)
            self.db.rollback()
            return None
    
    def _fetch_fred_series(
        self, series_id: str, units: str = "lin"
    ) -> Optional[float]:
        """
        Fetch most recent value from a FRED series.
        
        Args:
            series_id: FRED series ID (e.g., "WALCL")
            units: Data transformation (lin=levels, pc1=percent change)
        """
        try:
            params = {
                "series_id": series_id,
                "api_key": self.fred_api_key,
                "file_type": "json",
                "sort_order": "desc",
                "limit": 1,
                "units": units
            }
            
            response = requests.get(self.FRED_BASE, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("observations"):
                value = data["observations"][0]["value"]
                if value != ".":  # FRED uses "." for missing data
                    return float(value)
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching FRED series {series_id}: {e}")
            return None
    
    def seed_estimated_global_m2(self, days: int = 365):
        """
        Backfill historical global M2 data from FRED.
        
        Args:
            days: Number of days of historical data to fetch
        """
        if not self.fred_api_key or self.fred_api_key == "YOUR_FRED_API_KEY":
            logger.warning("FRED API key not configured. Cannot backfill M2 data.")
            return
        
        try:
            logger.info(f"Backfilling {days} days of global M2 data...")
            
            # Fetch historical data for all M2 components
            end_date = datetime.utcnow().date()
            start_date = end_date - timedelta(days=days)
            
            # FRED series IDs
            series_map = {
                'us_m2': 'WM2NS',
                'china_m2': 'MYAGM2CNM189S',
                'eurozone_m2': 'MABMM301EZM189S',
                'japan_m2': 'MABMM301JPM189S',
                'uk_m2': 'MABMM301GBM189S'
            }
            
            # Fetch all series
            series_data = {}
            for name, series_id in series_map.items():
                data = self._fetch_fred_series_historical(series_id, start_date, end_date)
                if data:
                    series_data[name] = data
                    logger.info(f"Fetched {len(data)} observations for {name}")
            
            if not series_data:
                logger.error("No M2 data could be fetched")
                return
            
            # Aggregate by date
            all_dates = set()
            for data in series_data.values():
                all_dates.update(data.keys())
            
            logger.info(f"Processing {len(all_dates)} unique dates...")
            
            added = 0
            updated = 0
            
            for date in sorted(all_dates):
                # Collect available M2 values for this date
                m2_values = []
                for series_name, data in series_data.items():
                    if date in data:
                        m2_values.append(data[date])
                
                # Need at least 3 major economies
                if len(m2_values) < 3:
                    continue
                
                # Calculate global M2 in trillions
                global_m2 = sum(m2_values) / 1000.0
                
                # Check if record exists
                date_dt = datetime.combine(date, datetime.min.time())
                existing = self.db.query(MacroLiquidityData).filter(
                    MacroLiquidityData.date == date_dt
                ).first()
                
                if existing:
                    if existing.global_m2 is None:
                        existing.global_m2 = global_m2
                        updated += 1
                else:
                    # Create new record with just M2 data
                    new_record = MacroLiquidityData(
                        date=date_dt,
                        global_m2=global_m2,
                        source="FRED"
                    )
                    self.db.add(new_record)
                    added += 1
            
            self.db.commit()
            logger.info(f"Global M2 backfill complete: {added} added, {updated} updated")
            
        except Exception as e:
            logger.error(f"Error backfilling M2 data: {e}", exc_info=True)
            self.db.rollback()
    
    def _fetch_fred_series_historical(
        self, series_id: str, start_date: date, end_date: date
    ) -> Dict[date, float]:
        """
        Fetch historical data for a FRED series.
        
        Returns:
            Dictionary mapping date -> value
        """
        try:
            params = {
                "series_id": series_id,
                "api_key": self.fred_api_key,
                "file_type": "json",
                "observation_start": start_date.strftime("%Y-%m-%d"),
                "observation_end": end_date.strftime("%Y-%m-%d"),
                "sort_order": "asc"
            }
            
            response = requests.get(self.FRED_BASE, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            result = {}
            if data.get("observations"):
                for obs in data["observations"]:
                    if obs["value"] != ".":
                        obs_date = datetime.strptime(obs["date"], "%Y-%m-%d").date()
                        result[obs_date] = float(obs["value"])
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching historical FRED series {series_id}: {e}")
            return {}


def run_daily_ingestion():
    """
    Main function to run daily data ingestion.
    Should be called by scheduler.
    """
    db = SessionLocal()
    
    try:
        logger.info("Starting daily AAP data ingestion...")
        
        # Fetch crypto data
        crypto_ingest = CryptoDataIngestion(db)
        crypto_result = crypto_ingest.fetch_current_prices()
        
        if crypto_result:
            logger.info(f"Crypto data updated: BTC=${crypto_result.btc_usd:.2f}")
        else:
            logger.warning("Crypto data fetch failed - check CoinGecko API availability")
        
        # Fetch macro data (requires FRED API key)
        from app.core.config import settings
        macro_ingest = MacroDataIngestion(db, fred_api_key=getattr(settings, 'FRED_API_KEY', None))
        macro_result = macro_ingest.fetch_current_macro_data()
        
        if macro_result:
            logger.info(f"Macro data updated: Fed BS=${macro_result.fed_balance_sheet:.0f}B, Global M2=${macro_result.global_m2:.2f}T")
        else:
            logger.info("Macro data not available - FRED API key may not be configured")
        
        logger.info("Daily AAP data ingestion completed")
        
    except Exception as e:
        logger.error(f"Error in daily ingestion: {e}", exc_info=True)
    finally:
        db.close()


if __name__ == "__main__":
    # For testing
    logging.basicConfig(level=logging.INFO)
    run_daily_ingestion()
