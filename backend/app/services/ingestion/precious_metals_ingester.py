"""
Data ingestion service for precious metals
Handles daily price updates, ratio calculations, and periodic fundamental data
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import statistics
import yfinance as yf
import requests

from app.utils.db_helpers import get_db_session
from app.models.precious_metals import (
    MetalPrice, MetalRatio, CBHolding, COMEXInventory, ETFHolding,
    MetalCorrelation, BackwardationData, LBMAPremium, MetalVolatility,
    SupplyData, DemandData
)
from app.core.config import settings

logger = logging.getLogger(__name__)

METAL_SYMBOLS = {
    "AU": {"fred": "GOLDAMZNND", "yahoo": "GC=F", "etf": "GLD"},
    "AG": {"fred": "SILVAMZNND", "yahoo": "SI=F", "etf": "SLV"},
    "PT": {"yahoo": "PL=F", "etf": "PPLT"},
    "PD": {"yahoo": "PA=F", "etf": "PALL"},
}


class PreciousMetalsIngester:
    """Main ingestion orchestrator"""

    def __init__(self):
        self.session = requests.Session()

    def ingest_daily_data(self) -> Dict[str, int]:
        """Run daily ingestion: prices, ratios, ETF flows, correlations"""
        results = {
            "prices_ingested": 0,
            "ratios_computed": 0,
            "etf_flows_ingested": 0,
            "correlations_computed": 0,
            "errors": 0
        }

        try:
            # 1. Ingest spot prices
            results["prices_ingested"] = self._ingest_spot_prices()
            logger.info(f"Ingested {results['prices_ingested']} metal prices")

            # 2. Compute ratios
            results["ratios_computed"] = self._compute_ratios()
            logger.info(f"Computed {results['ratios_computed']} metal ratios")

            # 3. Ingest ETF holdings and flows
            results["etf_flows_ingested"] = self._ingest_etf_data()
            logger.info(f"Ingested {results['etf_flows_ingested']} ETF records")

            # 4. Compute correlations
            results["correlations_computed"] = self._compute_correlations()
            logger.info(f"Computed correlation matrices")

            # 5. Compute volatility
            self._compute_volatility()

        except Exception as e:
            logger.error(f"Error in daily metals ingestion: {str(e)}")
            results["errors"] += 1

        return results

    def ingest_weekly_data(self) -> Dict[str, int]:
        """Run weekly ingestion: COT, COMEX, LBMA premiums"""
        results = {
            "comex_ingested": 0,
            "lbma_ingested": 0,
            "errors": 0
        }

        try:
            # 1. COMEX inventory
            results["comex_ingested"] = self._ingest_comex_data()
            logger.info(f"Ingested {results['comex_ingested']} COMEX records")

            # 2. LBMA premiums
            results["lbma_ingested"] = self._ingest_lbma_premiums()
            logger.info(f"Ingested {results['lbma_ingested']} LBMA premium records")

        except Exception as e:
            logger.error(f"Error in weekly metals ingestion: {str(e)}")
            results["errors"] += 1

        return results

    def ingest_monthly_data(self) -> Dict[str, int]:
        """Run monthly ingestion: CB holdings, supply/demand"""
        results = {
            "cb_holdings_ingested": 0,
            "supply_ingested": 0,
            "errors": 0
        }

        try:
            # 1. CB holdings (quarterly, but check monthly)
            results["cb_holdings_ingested"] = self._ingest_cb_holdings()
            logger.info(f"Ingested {results['cb_holdings_ingested']} CB holding records")

            # 2. Supply data (quarterly, but check monthly)
            results["supply_ingested"] = self._ingest_supply_data()
            logger.info(f"Ingested {results['supply_ingested']} supply records")

        except Exception as e:
            logger.error(f"Error in monthly metals ingestion: {str(e)}")
            results["errors"] += 1

        return results

    # ==================== DAILY INGESTION ====================

    def _ingest_spot_prices(self) -> int:
        """Ingest daily spot prices from FRED and Yahoo"""
        count = 0
        with get_db_session() as db:
            today = datetime.utcnow().date()

            for metal, symbols in METAL_SYMBOLS.items():
                try:
                    # Check if already ingested today
                    existing = db.query(MetalPrice).filter(
                        MetalPrice.metal == metal,
                        MetalPrice.source == "YAHOO",
                        MetalPrice.date >= datetime(today.year, today.month, today.day)
                    ).first()

                    if existing:
                        logger.info(f"Price for {metal} already ingested today, skipping")
                        continue

                    # Fetch from Yahoo
                    ticker = yf.Ticker(symbols["yahoo"])
                    data = ticker.history(period="1d")

                    if not data.empty:
                        price = float(data["Close"].iloc[-1])
                        metal_price = MetalPrice(
                            metal=metal,
                            date=datetime.utcnow(),
                            price_usd_per_oz=price,
                            source="YAHOO"
                        )
                        db.add(metal_price)
                        count += 1

                except Exception as e:
                    logger.error(f"Error ingesting {metal} price: {str(e)}")

            db.commit()
        return count

    def _compute_ratios(self) -> int:
        """Compute metal-to-metal and metal-to-USD ratios"""
        count = 0
        with get_db_session() as db:
            today = datetime.utcnow().date()

            # Get latest prices
            au_price = db.query(MetalPrice).filter(
                MetalPrice.metal == "AU",
                MetalPrice.date >= datetime(today.year, today.month, today.day)
            ).order_by(MetalPrice.date.desc()).first()

            ag_price = db.query(MetalPrice).filter(
                MetalPrice.metal == "AG",
                MetalPrice.date >= datetime(today.year, today.month, today.day)
            ).order_by(MetalPrice.date.desc()).first()

            pt_price = db.query(MetalPrice).filter(
                MetalPrice.metal == "PT",
                MetalPrice.date >= datetime(today.year, today.month, today.day)
            ).order_by(MetalPrice.date.desc()).first()

            pd_price = db.query(MetalPrice).filter(
                MetalPrice.metal == "PD",
                MetalPrice.date >= datetime(today.year, today.month, today.day)
            ).order_by(MetalPrice.date.desc()).first()

            if not au_price:
                return 0

            # Compute ratios
            ratios_to_compute = []

            if ag_price:
                ratios_to_compute.append(("AU", "AG", au_price.price_usd_per_oz / ag_price.price_usd_per_oz))
            if pt_price:
                ratios_to_compute.append(("PT", "AU", pt_price.price_usd_per_oz / au_price.price_usd_per_oz))
            if pd_price:
                ratios_to_compute.append(("PD", "AU", pd_price.price_usd_per_oz / au_price.price_usd_per_oz))

            # Add DXY ratio (placeholder: would fetch from indicators)
            # For now, assume DXY = 103.5 (hypothetical)
            ratios_to_compute.append(("AU", "DXY", au_price.price_usd_per_oz / 103.5))
            if ag_price:
                ratios_to_compute.append(("AG", "DXY", ag_price.price_usd_per_oz / 103.5))

            # Calculate z-scores (2-year window)
            cutoff_2y = datetime.utcnow() - timedelta(days=730)

            for metal1, metal2, ratio_value in ratios_to_compute:
                # Get historical ratios for z-score
                historical = db.query(MetalRatio).filter(
                    MetalRatio.metal1 == metal1,
                    MetalRatio.metal2 == metal2,
                    MetalRatio.date >= cutoff_2y
                ).all()

                if historical:
                    values = [r.ratio_value for r in historical]
                    mean = statistics.mean(values)
                    std = statistics.stdev(values) if len(values) > 1 else 1.0
                    zscore = (ratio_value - mean) / std if std > 0 else 0.0
                else:
                    zscore = 0.0

                ratio = MetalRatio(
                    date=datetime.utcnow(),
                    metal1=metal1,
                    metal2=metal2,
                    ratio_value=ratio_value,
                    zscore_2y=zscore
                )
                db.add(ratio)
                count += 1

            db.commit()
        return count

    def _ingest_etf_data(self) -> int:
        """Ingest ETF holdings and compute daily flows"""
        count = 0
        with get_db_session() as db:
            today = datetime.utcnow().date()

            etfs = ["GLD", "SLV", "PPLT", "PALL"]

            for etf in etfs:
                try:
                    ticker = yf.Ticker(etf)
                    # Note: yfinance doesn't directly expose holdings; would need alternative source
                    # Placeholder: use price * shares outstanding proxy or fetch from ETF provider API

                    # For now, just fetch price as proxy
                    data = ticker.history(period="1d")
                    if not data.empty:
                        price = float(data["Close"].iloc[-1])
                        # Holdings would come from separate API (Grayscale, iShares, etc.)
                        holdings = price * 100  # Placeholder

                        etf_holding = ETFHolding(
                            date=datetime.utcnow(),
                            ticker=etf,
                            holdings=holdings,
                            source="YAHOO"
                        )
                        db.add(etf_holding)
                        count += 1

                except Exception as e:
                    logger.error(f"Error ingesting ETF {etf}: {str(e)}")

            db.commit()
        return count

    def _compute_correlations(self) -> int:
        """Compute rolling 30/60-day correlations"""
        count = 0
        with get_db_session() as db:
            try:
                # Fetch price history for past 60 days
                cutoff_60d = datetime.utcnow() - timedelta(days=60)
                cutoff_30d = datetime.utcnow() - timedelta(days=30)

                au_prices = db.query(MetalPrice).filter(
                    MetalPrice.metal == "AU",
                    MetalPrice.date >= cutoff_60d
                ).order_by(MetalPrice.date).all()

                if len(au_prices) < 30:
                    return 0

                # Convert to returns for correlation
                au_returns = [
                    (au_prices[i].price_usd_per_oz - au_prices[i - 1].price_usd_per_oz) / au_prices[i - 1].price_usd_per_oz
                    for i in range(1, len(au_prices))
                ]

                # For each other metal, compute correlation
                ag_prices = db.query(MetalPrice).filter(
                    MetalPrice.metal == "AG",
                    MetalPrice.date >= cutoff_60d
                ).order_by(MetalPrice.date).all()

                if len(ag_prices) == len(au_prices):
                    ag_returns = [
                        (ag_prices[i].price_usd_per_oz - ag_prices[i - 1].price_usd_per_oz) / ag_prices[i - 1].price_usd_per_oz
                        for i in range(1, len(ag_prices))
                    ]

                    # Compute Pearson correlation
                    au_ag_corr_60d = self._pearson_correlation(au_returns, ag_returns)

                    # Compute 30-day subset
                    au_ag_corr_30d = self._pearson_correlation(au_returns[-30:], ag_returns[-30:])

                    # Store correlation
                    correlation = MetalCorrelation(
                        date=datetime.utcnow(),
                        au_ag_60d=au_ag_corr_60d,
                        au_ag_30d=au_ag_corr_30d
                    )
                    db.add(correlation)
                    count += 1
                    db.commit()

            except Exception as e:
                logger.error(f"Error computing correlations: {str(e)}")

        return count

    def _compute_volatility(self) -> int:
        """Compute rolling volatility"""
        count = 0
        with get_db_session() as db:
            try:
                cutoff_252d = datetime.utcnow() - timedelta(days=252)
                cutoff_60d = datetime.utcnow() - timedelta(days=60)
                cutoff_30d = datetime.utcnow() - timedelta(days=30)

                for metal in ["AU", "AG", "PT", "PD"]:
                    prices_252d = db.query(MetalPrice).filter(
                        MetalPrice.metal == metal,
                        MetalPrice.date >= cutoff_252d
                    ).order_by(MetalPrice.date).all()

                    prices_60d = db.query(MetalPrice).filter(
                        MetalPrice.metal == metal,
                        MetalPrice.date >= cutoff_60d
                    ).order_by(MetalPrice.date).all()

                    prices_30d = db.query(MetalPrice).filter(
                        MetalPrice.metal == metal,
                        MetalPrice.date >= cutoff_30d
                    ).order_by(MetalPrice.date).all()

                    if len(prices_252d) > 1:
                        vol_252d = self._compute_volatility_from_prices(prices_252d)
                        vol_60d = self._compute_volatility_from_prices(prices_60d) if len(prices_60d) > 1 else vol_252d
                        vol_30d = self._compute_volatility_from_prices(prices_30d) if len(prices_30d) > 1 else vol_60d

                        volatility = MetalVolatility(
                            date=datetime.utcnow(),
                            metal=metal,
                            volatility_252d=vol_252d,
                            volatility_60d=vol_60d,
                            volatility_30d=vol_30d
                        )
                        db.add(volatility)
                        count += 1

                db.commit()
            except Exception as e:
                logger.error(f"Error computing volatility: {str(e)}")

        return count

    # ==================== WEEKLY INGESTION ====================

    def _ingest_comex_data(self) -> int:
        """Ingest COMEX inventory data"""
        count = 0
        with get_db_session() as db:
            try:
                # Placeholder: would fetch from CME API or data provider
                # For now, return 0 (requires API key and subscription)
                logger.info("COMEX data ingestion requires CME/Bloomberg subscription")
            except Exception as e:
                logger.error(f"Error ingesting COMEX data: {str(e)}")

        return count

    def _ingest_lbma_premiums(self) -> int:
        """Ingest LBMA premiums"""
        count = 0
        with get_db_session() as db:
            try:
                # Placeholder: would fetch from LBMA API
                logger.info("LBMA data ingestion requires API access")
            except Exception as e:
                logger.error(f"Error ingesting LBMA data: {str(e)}")

        return count

    # ==================== MONTHLY INGESTION ====================

    def _ingest_cb_holdings(self) -> int:
        """Ingest central bank gold holdings (quarterly data)"""
        count = 0
        with get_db_session() as db:
            try:
                # Placeholder: would fetch from IMF COFER API or WGC
                logger.info("CB holdings data requires IMF/WGC subscription")
            except Exception as e:
                logger.error(f"Error ingesting CB holdings: {str(e)}")

        return count

    def _ingest_supply_data(self) -> int:
        """Ingest supply data (quarterly)"""
        count = 0
        with get_db_session() as db:
            try:
                # Placeholder: would fetch from USGS or S&P Global
                logger.info("Supply data requires USGS/S&P subscription")
            except Exception as e:
                logger.error(f"Error ingesting supply data: {str(e)}")

        return count

    # ==================== UTILITY FUNCTIONS ====================

    @staticmethod
    def _pearson_correlation(x: List[float], y: List[float]) -> float:
        """Calculate Pearson correlation coefficient"""
        if len(x) < 2 or len(y) < 2 or len(x) != len(y):
            return 0.0

        mean_x = statistics.mean(x)
        mean_y = statistics.mean(y)
        std_x = statistics.stdev(x) if len(x) > 1 else 1.0
        std_y = statistics.stdev(y) if len(y) > 1 else 1.0

        if std_x == 0 or std_y == 0:
            return 0.0

        covariance = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(len(x))) / len(x)
        correlation = covariance / (std_x * std_y)

        return max(-1.0, min(1.0, correlation))

    @staticmethod
    def _compute_volatility_from_prices(prices: List[MetalPrice]) -> float:
        """Calculate volatility (annualized standard deviation of returns)"""
        if len(prices) < 2:
            return 0.0

        returns = [
            (prices[i].price_usd_per_oz - prices[i - 1].price_usd_per_oz) / prices[i - 1].price_usd_per_oz
            for i in range(1, len(prices))
        ]

        if not returns:
            return 0.0

        daily_vol = statistics.stdev(returns) if len(returns) > 1 else 0.0
        annualized_vol = daily_vol * (252 ** 0.5)  # 252 trading days

        return annualized_vol


def ingest_precious_metals_daily():
    """Scheduled job for daily ingestion"""
    ingester = PreciousMetalsIngester()
    return ingester.ingest_daily_data()


def ingest_precious_metals_weekly():
    """Scheduled job for weekly ingestion"""
    ingester = PreciousMetalsIngester()
    return ingester.ingest_weekly_data()


def ingest_precious_metals_monthly():
    """Scheduled job for monthly ingestion"""
    ingester = PreciousMetalsIngester()
    return ingester.ingest_monthly_data()
