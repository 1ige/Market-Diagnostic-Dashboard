"""
Sector Projection Service (Option B)

This service implements a transparent, rules-based scoring system for evaluating sector ETF
performance across multiple time horizons. Unlike black-box machine learning approaches,
every score component is calculable and interpretable by analysts.

Key Features:
- Multi-horizon analysis: 3-month, 6-month, and 12-month projections
- Four weighted scoring components: Trend (45%), Relative Strength (30%), Risk (20%), Regime (5%)
- Regime-aware adjustments: Favors defensive sectors in RED markets, cyclical in GREEN
- Transparent percentile ranking: All scores normalized to 0-100 scale
- Classification system: Winner (top 3), Neutral (middle 5), Loser (bottom 3)

Designed for extensibility - Option A machine learning overlay can be added in future.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.services.ingestion.yahoo_client import YahooClient
import logging

# =============================================================================
# CONFIGURATION CONSTANTS
# =============================================================================

# 11 SPDR Sector Select ETFs covering all GICS sectors
SECTOR_ETFS = [
    {"symbol": "XLE", "name": "Energy"},
    {"symbol": "XLF", "name": "Financials"},
    {"symbol": "XLK", "name": "Technology"},
    {"symbol": "XLY", "name": "Consumer Discretionary"},
    {"symbol": "XLP", "name": "Consumer Staples"},
    {"symbol": "XLV", "name": "Health Care"},
    {"symbol": "XLI", "name": "Industrials"},
    {"symbol": "XLU", "name": "Utilities"},
    {"symbol": "XLB", "name": "Materials"},
    {"symbol": "XLRE", "name": "Real Estate"},
    {"symbol": "XLC", "name": "Communication Services"},
]
# Benchmark for relative strength calculations
BENCHMARK = {"symbol": "SPY", "name": "S&P 500"}

# Time horizons mapped to trading days (assuming ~252 trading days per year)
HORIZONS = {
    "T": 0,    # Today (uses T_WINDOW_DAYS for calculation)
    "3m": 63,
    "6m": 126,
    "12m": 252,
}
T_WINDOW_DAYS = 21

# Model versioning for tracking projection methodology changes
MODEL_VERSION = "option_b_v1"

# Score component weights - sum to 1.0 for final scoring
# These weights reflect relative importance of each factor in sector evaluation
WEIGHTS = {
    "trend": 0.45,
    "rel_strength": 0.30,
    "risk": 0.20,
    "regime": 0.05,
}

# =============================================================================
# CORE PROJECTION COMPUTATION
# =============================================================================

logger = logging.getLogger(__name__)

def detect_duplicate_series(
    price_data: Dict[str, pd.DataFrame],
    tail_points: int = 30,
) -> List[Dict[str, Any]]:
    """Return duplicate series signatures for data integrity checks."""
    signatures: Dict[tuple, str] = {}
    duplicates: List[Dict[str, Any]] = []
    for symbol, df in price_data.items():
        if df.empty or "value" not in df.columns:
            continue
        tail = df["value"].tail(tail_points).tolist()
        sig = (len(df), tuple(round(v, 8) for v in tail))
        if sig in signatures:
            duplicates.append({
                "symbol_a": signatures[sig],
                "symbol_b": symbol,
                "points": len(df),
            })
        else:
            signatures[sig] = symbol
    return duplicates

def detect_stale_series(
    price_data: Dict[str, pd.DataFrame],
    max_age_days: int = 2,
) -> List[Dict[str, Any]]:
    """Return series that lag behind the most recent date."""
    latest_dates = {}
    for symbol, df in price_data.items():
        if df.empty or "date" not in df.columns:
            continue
        try:
            latest_dates[symbol] = pd.to_datetime(df["date"]).max()
        except Exception:
            continue

    if not latest_dates:
        return []

    overall_latest = max(latest_dates.values())
    stale = []
    for symbol, date_val in latest_dates.items():
        lag_days = (overall_latest - date_val).days
        if lag_days > max_age_days:
            stale.append({
                "symbol": symbol,
                "latest_date": date_val.date().isoformat(),
                "lag_days": lag_days,
            })
    return stale

def compute_sector_projections(price_data: Dict[str, pd.DataFrame], system_state: str = "YELLOW") -> List[Dict[str, Any]]:
    """
    Compute sector projections for each ETF and horizon.
    
    This is the heart of the transparent scoring system. For each sector and time horizon,
    we calculate four independent scores (Trend, Relative Strength, Risk, Regime), then
    combine them using weighted average to produce a final 0-100 score.
    
    Args:
        price_data: dict of {symbol: pd.DataFrame with 'date' and 'value' columns}
        system_state: Current market regime - RED/YELLOW/GREEN (affects regime score)
    
    Returns:
        list of dicts containing all scores, metrics, and classifications for each sector/horizon
    
    Process Flow:
        1. For each horizon (3m, 6m, 12m):
        2.   Extract price data for lookback period
        3.   Calculate raw metrics (returns, volatility, drawdown, relative strength)
        4.   Normalize metrics to 0-100 scores using percentile ranks
        5.   Apply regime adjustments based on market state
        6.   Compute weighted final score
        7.   Rank sectors and assign Winner/Neutral/Loser classifications
    """
    projections = []
    today = datetime.utcnow().date()
    
    # Process each time horizon independently
    for horizon, lookback in HORIZONS.items():
        effective_lookback = T_WINDOW_DAYS if lookback == 0 else lookback
        # ------------------------------------------------------------------
        # STEP 1: Collect raw metrics for all sectors at this horizon
        # ------------------------------------------------------------------
        metrics = {}  # Will store {symbol: {metric_name: value}}
        
        for etf in SECTOR_ETFS:
            sym = etf["symbol"]
            df = price_data.get(sym)
            spy = price_data.get(BENCHMARK["symbol"])
            
            # Data validation
            if df is None or len(df) < effective_lookback + 10 or spy is None:
                continue
                
            df = df.sort_values("date").reset_index(drop=True)
            spy = spy.sort_values("date").reset_index(drop=True)
            
            # Align dates between sector and benchmark
            common_dates = set(df["date"]).intersection(set(spy["date"]))
            df = df[df["date"].isin(common_dates)]
            spy = spy[spy["date"].isin(common_dates)]
            
            if len(df) < effective_lookback:
                continue
                
            # Use most recent lookback+1 days (need +1 to calculate returns)
            df = df.iloc[-(effective_lookback + 1):]
            spy = spy.iloc[-(effective_lookback + 1):]
            # ------------------------------------------------------------------
            # STEP 2: Calculate raw financial metrics
            # ------------------------------------------------------------------
            
            # Total return over period
            ret = (df["value"].iloc[-1] / df["value"].iloc[0]) - 1
            spy_ret = (spy["value"].iloc[-1] / spy["value"].iloc[0]) - 1
            
            # Distance from 200-day SMA (momentum indicator)
            sma_window = min(200, len(df))
            sma = df["value"].rolling(sma_window).mean().iloc[-1]
            sma_dist = (df["value"].iloc[-1] / sma) - 1 if sma else 0
            
            # Realized volatility (annualized 20-day)
            vol = df["value"].pct_change().rolling(20).std().iloc[-1] * np.sqrt(252)
            
            # Maximum drawdown over full period
            roll_max = df["value"].cummax()
            drawdown = (df["value"] / roll_max - 1).min()
            
            # Relative return vs benchmark (alpha)
            rel_ret = ret - spy_ret
            metrics[sym] = {
                "sector_name": etf["name"],
                "return": ret,
                "sma_dist": sma_dist,
                "vol": vol,
                "drawdown": drawdown,
                "rel_ret": rel_ret,
            }
        
        # ------------------------------------------------------------------
        # STEP 3: Convert raw metrics to 0-100 scores via percentile ranking
        # ------------------------------------------------------------------
        
        # Convert metrics dict to DataFrame for vectorized operations
        mdf = pd.DataFrame.from_dict(metrics, orient="index")
        if mdf.empty:
            continue
        
        # Data cleaning: Replace inf/-inf with NaN, then fill with 0
        mdf.replace([np.inf, -np.inf], np.nan, inplace=True)
        mdf.fillna(0, inplace=True)
        
        # Percentile ranking function - converts any metric to 0-100 score
        def to_score(series, invert=False):
            """Convert metric to 0-100 score using percentile ranks.
            Higher percentile = higher score (unless inverted for "bad" metrics like volatility)"""
            ranks = series.rank(pct=True, na_option='bottom')
            if invert:
                scores = 100 * (1 - ranks)  # Invert for risk metrics
            else:
                scores = 100 * ranks  # Higher is better
            return scores.clip(0, 100).fillna(50)  # Default to 50 if still NaN
        
        # Trend Score (45%): Combination of return and momentum
        mdf["score_trend"] = to_score(mdf["return"] + 0.5 * mdf["sma_dist"])
        
        # Relative Strength Score (30%): Outperformance vs SPY
        mdf["score_rel"] = to_score(mdf["rel_ret"])
        
        # Risk Score (20%): Lower risk = higher score (inverted)
        mdf["score_risk"] = to_score(mdf["vol"] + 0.5 * np.abs(mdf["drawdown"]), invert=True)
        # ------------------------------------------------------------------
        # STEP 4: Apply regime-based adjustments (5% weight)
        # ------------------------------------------------------------------
        # Regime Score: Context-aware bonus/penalty based on sector characteristics
        regime_adj = np.zeros(len(mdf))
        if system_state == "RED":
            # RED market: Reward defensive sectors, penalize high-vol cyclicals
            for i, sym in enumerate(mdf.index):
                if mdf.loc[sym, "sector_name"] in ["Utilities", "Consumer Staples", "Health Care"]:
                    regime_adj[i] = 5  # Defensive bonus
                elif mdf.loc[sym, "vol"] > mdf["vol"].median():
                    regime_adj[i] = -5  # High volatility penalty
        mdf["score_regime"] = 50 + regime_adj
        # ------------------------------------------------------------------
        # STEP 5: Calculate final weighted score and classify sectors
        # ------------------------------------------------------------------
        
        # Weighted average of all components
        mdf["score_total"] = (
            WEIGHTS["trend"] * mdf["score_trend"] +
            WEIGHTS["rel_strength"] * mdf["score_rel"] +
            WEIGHTS["risk"] * mdf["score_risk"] +
            WEIGHTS["regime"] * mdf["score_regime"]
        ).fillna(50)
        
        # Rank sectors 1-11 (1 = best)
        mdf["rank"] = mdf["score_total"].rank(ascending=False, method="min", na_option='bottom')
        mdf["rank"] = mdf["rank"].fillna(len(mdf) // 2).astype(int)
        
        # Classification: Winner (1-3), Neutral (4-8), Loser (9-11)
        mdf["classification"] = "Neutral"
        mdf.loc[mdf["rank"] <= 3, "classification"] = "Winner"
        mdf.loc[mdf["rank"] > (len(mdf) - 3), "classification"] = "Loser"
        # Output
        for sym, row in mdf.iterrows():
            projections.append({
                "sector_symbol": sym,
                "sector_name": row["sector_name"],
                "horizon": horizon,
                "score_total": float(row["score_total"]),
                "score_trend": float(row["score_trend"]),
                "score_rel": float(row["score_rel"]),
                "score_risk": float(row["score_risk"]),
                "score_regime": float(row["score_regime"]),
                "rank": int(row["rank"]),
                "classification": row["classification"],
                "metrics": {
                    "return": float(row["return"]),
                    "sma_dist": float(row["sma_dist"]),
                    "vol": float(row["vol"]),
                    "drawdown": float(row["drawdown"]),
                    "rel_ret": float(row["rel_ret"]),
                },
                "as_of_date": str(today),
                "model_version": MODEL_VERSION,
            })
    return projections

# --- Data Fetch Helper ---
def fetch_sector_price_history(days: int = 8000) -> Dict[str, pd.DataFrame]:
    """
    Fetch price history for all sector ETFs and SPY. Returns dict of DataFrames.
    """
    client = YahooClient()
    end = datetime.utcnow().date()
    start = end - timedelta(days=days)
    result = {}
    for etf in SECTOR_ETFS + [BENCHMARK]:
        data = client.fetch_series(etf["symbol"], start_date=str(start), end_date=str(end))
        if data:
            df = pd.DataFrame(data)
            result[etf["symbol"]] = df

    duplicates = detect_duplicate_series(result)
    for dup in duplicates:
        logger.warning(
            "Duplicate sector price series detected: %s and %s",
            dup["symbol_a"],
            dup["symbol_b"],
        )

    return result
