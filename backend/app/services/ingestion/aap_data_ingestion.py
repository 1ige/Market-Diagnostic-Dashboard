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
        
        Note: Uses CoinGecko market chart data for daily history.
        """
        try:
            btc_chart = self._fetch_market_chart("bitcoin", days)
            eth_chart = self._fetch_market_chart("ethereum", days)
            global_chart = self._fetch_global_market_chart(days)

            if not btc_chart or "prices" not in btc_chart:
                logger.error("No BTC market chart data returned from CoinGecko")
                return False

            btc_prices = self._series_to_date_map(btc_chart.get("prices", []))
            btc_market_caps = self._series_to_date_map(btc_chart.get("market_caps", []))
            btc_volumes = self._series_to_date_map(btc_chart.get("total_volumes", []))
            eth_prices = self._series_to_date_map(eth_chart.get("prices", [])) if eth_chart else {}

            total_market_caps = {}
            if global_chart:
                total_market_caps = self._series_to_date_map(
                    global_chart.get("market_cap", []) or global_chart.get("market_caps", [])
                )

            all_dates = sorted(set(btc_prices.keys()) | set(eth_prices.keys()))

            added = 0
            for date_obj in all_dates:
                date = datetime.combine(date_obj, datetime.min.time())

                existing = self.db.query(CryptoPrice).filter(
                    CryptoPrice.date == date
                ).first()
                if existing:
                    continue

                btc_price = btc_prices.get(date_obj)
                if btc_price is None:
                    continue

                total_mcap = total_market_caps.get(date_obj)
                btc_mcap = btc_market_caps.get(date_obj)
                btc_dominance = None
                if total_mcap and btc_mcap:
                    btc_dominance = (btc_mcap / total_mcap) * 100

                gold_price = self._fetch_gold_price()

                crypto_price = CryptoPrice(
                    date=date,
                    btc_usd=btc_price,
                    eth_usd=eth_prices.get(date_obj),
                    total_crypto_mcap=(total_mcap / 1_000_000_000) if total_mcap else None,
                    btc_dominance=btc_dominance,
                    btc_gold_ratio=btc_price / gold_price if gold_price else None,
                    btc_volume_24h=btc_volumes.get(date_obj),
                    source="CoinGecko"
                )
                self.db.add(crypto_price)
                added += 1

            self.db.commit()
            logger.info(f"Backfilled {added} days of crypto historical data")
            return True
            
        except Exception as e:
            logger.error(f"Error fetching historical crypto data: {e}", exc_info=True)
            self.db.rollback()
            return False

    def _fetch_market_chart(self, coin_id: str, days: int) -> Optional[Dict[str, List[List[float]]]]:
        url = f"{self.COINGECKO_BASE}/coins/{coin_id}/market_chart"
        params = {
            "vs_currency": "usd",
            "days": days,
            "interval": "daily"
        }
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning(f"Error fetching {coin_id} market chart: {e}")
            return None

    def _fetch_global_market_chart(self, days: int) -> Optional[Dict[str, List[List[float]]]]:
        url = f"{self.COINGECKO_BASE}/global/market_cap_chart"
        params = {
            "vs_currency": "usd",
            "days": days
        }
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning(f"Error fetching global market cap chart: {e}")
            return None

    def _series_to_date_map(self, series: List[List[float]]) -> Dict[date, float]:
        data = {}
        for entry in series:
            if not entry or len(entry) < 2:
                continue
            timestamp_ms, value = entry[0], entry[1]
            day = datetime.utcfromtimestamp(timestamp_ms / 1000).date()
            data[day] = value
        return data
    
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
            
            # Global M2 aggregate (sum of major economies converted to USD trillions)
            # Note: FRED series have different units - need to normalize carefully
            
            m2_trillions_usd = []
            
            # US M2: Billions USD -> Trillions USD
            us_m2_billions = self._fetch_fred_series("WM2NS")  # Billions USD
            if us_m2_billions:
                us_m2_trillions = us_m2_billions / 1000.0
                m2_trillions_usd.append(us_m2_trillions)
                logger.debug(f"US M2: ${us_m2_trillions:.2f}T")
            
            # Eurozone M2: Millions EUR -> Trillions USD (1 EUR ≈ 1.1 USD)
            eurozone_m2_millions_eur = self._fetch_fred_series("MABMM301EZM189S")
            if eurozone_m2_millions_eur:
                eurozone_m2_trillions_usd = (eurozone_m2_millions_eur / 1_000_000) * 1.1
                m2_trillions_usd.append(eurozone_m2_trillions_usd)
                logger.debug(f"Eurozone M2: ${eurozone_m2_trillions_usd:.2f}T")
            
            # Japan M2: Millions JPY -> Trillions USD (1 USD ≈ 140 JPY)
            japan_m2_millions_jpy = self._fetch_fred_series("MABMM301JPM189S")
            if japan_m2_millions_jpy:
                japan_m2_trillions_usd = (japan_m2_millions_jpy / 1_000_000) / 140
                m2_trillions_usd.append(japan_m2_trillions_usd)
                logger.debug(f"Japan M2: ${japan_m2_trillions_usd:.2f}T")
            
            # UK M2: Millions GBP -> Trillions USD (1 GBP ≈ 1.27 USD)
            uk_m2_millions_gbp = self._fetch_fred_series("MABMM301GBM189S")
            if uk_m2_millions_gbp:
                uk_m2_trillions_usd = (uk_m2_millions_gbp / 1_000_000) * 1.27
                m2_trillions_usd.append(uk_m2_trillions_usd)
                logger.debug(f"UK M2: ${uk_m2_trillions_usd:.2f}T")
            
            # Calculate global M2 (already in trillions)
            global_m2 = None
            if len(m2_trillions_usd) >= 3:  # Need at least 3 major economies
                global_m2 = sum(m2_trillions_usd)
                logger.info(f"Global M2 calculated: ${global_m2:.2f}T from {len(m2_trillions_usd)} economies")
            else:
                logger.warning(f"Insufficient M2 data: only {len(m2_trillions_usd)} economies available")
            
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
