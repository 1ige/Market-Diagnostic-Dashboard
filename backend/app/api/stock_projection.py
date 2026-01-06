"""
Stock Projection API Endpoints

Provides REST API access to individual stock performance projections using the same
transparent scoring methodology as sector projections.

Endpoints:
- GET /stocks/{ticker}/projections: Get multi-horizon projections for a single stock

All projections include:
- Composite score (0-100) and component scores (trend, relative strength, risk, regime)
- Raw metrics (returns, volatility, drawdown, etc.)
"""

from fastapi import APIRouter, HTTPException, Path
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
import numpy as np
from app.models.system_status import SystemStatus
from app.utils.db_helpers import get_db_session

router = APIRouter()

HORIZONS = {
    "T": 0,    # Today (uses T_WINDOW_DAYS for calculation)
    "3m": 63,
    "6m": 126,
    "12m": 252,
}
T_WINDOW_DAYS = 21

def fetch_stock_data(ticker: str, days: int = 2000) -> pd.DataFrame:
    """Fetch historical price data for a stock"""
    try:
        stock = yf.Ticker(ticker)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        df = stock.history(start=start_date, end=end_date)
        if df.empty:
            raise ValueError(f"No data available for ticker {ticker}")
        
        df['returns'] = df['Close'].pct_change()
        return df
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Unable to fetch data for {ticker}: {str(e)}")


def calculate_atr(df: pd.DataFrame, period: int = 14) -> float:
    """Calculate Average True Range for volatility measurement"""
    high_low = df['High'] - df['Low']
    high_close = abs(df['High'] - df['Close'].shift())
    low_close = abs(df['Low'] - df['Close'].shift())
    
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = ranges.max(axis=1)
    atr = true_range.rolling(period).mean()
    
    return atr.iloc[-1] if not pd.isna(atr.iloc[-1]) else 0


def compute_conviction(trend_score: float, rel_strength_score: float, risk_score: float, volatility: float, composite_score: float) -> float:
    """
    Calculate conviction (confidence) in the projection (0-100)
    High conviction = strong signals aligned, low volatility
    Low conviction = mixed signals, high volatility
    """
    # Score alignment: how close are the component scores to the composite?
    component_scores = [trend_score, rel_strength_score, risk_score]
    avg_component = np.mean(component_scores)
    alignment = 100 - np.std(component_scores)  # Lower std = better alignment = higher conviction
    
    # Volatility factor: lower volatility = higher conviction
    volatility_factor = max(0, 100 - (volatility * 2))
    
    # Strength factor: scores far from neutral (50) = higher conviction
    strength = abs(composite_score - 50) / 50 * 100
    
    # Weighted conviction
    conviction = (
        0.40 * alignment +           # Component alignment (40%)
        0.35 * volatility_factor +   # Low volatility confidence (35%)
        0.25 * strength              # Signal strength (25%)
    )
    
    return np.clip(conviction, 0, 100)


def calculate_take_profit(current_price: float, return_pct: float, volatility: float, horizon_days: int) -> float:
    """
    Calculate take profit target based on:
    - Expected return over horizon
    - Volatility adjustment
    - Time horizon scaling
    """
    # Base target from return
    base_target = current_price * (1 + return_pct)
    
    # Volatility-adjusted upside (reduce profits in high vol)
    vol_adjustment = 1 - (volatility / 100 * 0.1)  # Reduce by up to 10% for very high vol
    
    # Horizon scaling (longer horizons can justify higher targets)
    horizon_multiplier = 1 + (horizon_days / 252 * 0.15)
    
    target = base_target * vol_adjustment * horizon_multiplier
    return target


def calculate_stop_loss(current_price: float, volatility: float, risk_score: float, horizon_days: int) -> float:
    """
    Calculate stop loss based on:
    - Volatility (higher vol = wider stops)
    - Risk score (higher risk = tighter stops)
    - Time horizon
    """
    # Base stop: 2 ATR equivalent
    atr_equivalent = current_price * (volatility / 100) * 0.5
    
    # Risk adjustment (low risk score = higher stop loss, allowing more room)
    risk_adjustment = (100 - risk_score) / 100 * 1.5  # Up to 1.5x ATR for low-risk assets
    
    # Horizon adjustment (shorter horizons = tighter stops)
    horizon_factor = 1 + (min(horizon_days, 252) / 252 * 0.3)
    
    stop_loss = current_price - (atr_equivalent * (1 + risk_adjustment) * horizon_factor)
    return stop_loss


def compute_stock_projection(ticker: str, df: pd.DataFrame, spy_df: pd.DataFrame, horizon_days: int, system_state: str) -> dict:
    """Compute projection scores for a single stock at a given horizon"""
    
    if len(df) < horizon_days:
        raise ValueError(f"Insufficient data: need {horizon_days} days, have {len(df)}")
    
    # Get the lookback window
    window_df = df.iloc[-horizon_days:]
    spy_window = spy_df.iloc[-horizon_days:]
    
    # 1. TREND SCORE (45% weight)
    # Return over period
    total_return = (window_df['Close'].iloc[-1] / window_df['Close'].iloc[0]) - 1
    
    # SMA distance (200-day)
    sma_200 = df['Close'].rolling(200).mean().iloc[-1]
    sma_distance = (df['Close'].iloc[-1] / sma_200) - 1 if not pd.isna(sma_200) else 0
    
    # Trend composite (normalize to 0-100 scale)
    trend_raw = total_return + (0.5 * sma_distance)
    trend_score = max(0, min(100, (trend_raw + 0.5) * 100))  # Simple normalization
    
    # 2. RELATIVE STRENGTH SCORE (30% weight)
    spy_return = (spy_window['Close'].iloc[-1] / spy_window['Close'].iloc[0]) - 1
    relative_strength_raw = total_return - spy_return
    rel_strength_score = max(0, min(100, (relative_strength_raw + 0.5) * 100))
    
    # 3. RISK SCORE (20% weight, inverted)
    # Realized volatility (20-day rolling, annualized)
    volatility = window_df['returns'].rolling(20).std().mean() * np.sqrt(252) * 100
    
    # Max drawdown
    cumulative = (1 + window_df['returns']).cumprod()
    running_max = cumulative.expanding().max()
    drawdown = ((cumulative - running_max) / running_max * 100).min()
    max_drawdown = abs(drawdown)
    
    # Risk composite (lower risk = higher score)
    risk_raw = volatility + (0.5 * max_drawdown)
    risk_score = max(0, min(100, 100 - (risk_raw * 2)))  # Inverted and normalized
    
    # 4. REGIME ADJUSTMENT (5% weight)
    regime_score = 50  # Neutral baseline
    if system_state == "RED":
        # Penalize high volatility in red market
        if volatility > 30:
            regime_score = 45
    
    # COMPOSITE SCORE
    composite_score = (
        0.45 * trend_score +
        0.30 * rel_strength_score +
        0.20 * risk_score +
        0.05 * regime_score
    )
    
    # CONVICTION CALCULATION (confidence in the projection)
    # Based on score consistency and direction strength
    conviction = compute_conviction(
        trend_score, 
        rel_strength_score, 
        risk_score, 
        volatility,
        composite_score
    )
    
    # PRICE TARGETS (Take Profit and Stop Loss)
    current_price = df['Close'].iloc[-1]
    atr_20 = calculate_atr(df, 20)
    
    # Take profit: based on positive return + volatility adjustment
    take_profit = calculate_take_profit(
        current_price,
        total_return,
        volatility,
        horizon_days
    )
    
    # Stop loss: based on volatility and risk score
    stop_loss = calculate_stop_loss(
        current_price,
        volatility,
        risk_score,
        horizon_days
    )
    
    return {
        "score_total": round(composite_score, 2),
        "score_trend": round(trend_score, 2),
        "score_relative_strength": round(rel_strength_score, 2),
        "score_risk": round(risk_score, 2),
        "score_regime": round(regime_score, 2),
        "return_pct": round(total_return * 100, 2),
        "volatility": round(volatility, 2),
        "max_drawdown": round(max_drawdown, 2),
        "conviction": round(conviction, 2),
        "current_price": round(current_price, 2),
        "take_profit": round(take_profit, 2),
        "stop_loss": round(stop_loss, 2),
    }


@router.get("/stocks/{ticker}/projections")
def get_stock_projections(
    ticker: str = Path(..., description="Stock ticker symbol (e.g., AAPL, TSLA)")
):
    """
    Get multi-horizon projections for a single stock
    
    Returns composite scores and component breakdowns for 3M, 6M, and 12M horizons
    """
    
    ticker = ticker.upper()
    
    data_warnings = []

    # Fetch stock data
    df = fetch_stock_data(ticker)
    
    # Fetch SPY for relative strength comparison
    spy_df = fetch_stock_data("SPY")

    # Data freshness checks
    try:
        latest_stock_date = pd.to_datetime(df.index).max()
        latest_spy_date = pd.to_datetime(spy_df.index).max()
        if latest_stock_date < latest_spy_date:
            lag_days = (latest_spy_date - latest_stock_date).days
            if lag_days > 2:
                data_warnings.append({
                    "type": "stale_series",
                    "details": {
                        "symbol": ticker,
                        "latest_date": latest_stock_date.date().isoformat(),
                        "lag_days": lag_days,
                    },
                })
    except Exception:
        pass
    
    # Get current system state
    with get_db_session() as db:
        status = db.query(SystemStatus).order_by(SystemStatus.timestamp.desc()).first()
        system_state = status.state if status else "YELLOW"
    
    # Get stock name
    try:
        stock_info = yf.Ticker(ticker).info
        stock_name = stock_info.get('longName') or stock_info.get('shortName') or ticker
    except:
        stock_name = ticker
    
    # Compute projections for each horizon
    projections = {}
    for horizon_name, horizon_days in HORIZONS.items():
        try:
            effective_days = T_WINDOW_DAYS if horizon_days == 0 else horizon_days
            projection = compute_stock_projection(ticker, df, spy_df, effective_days, system_state)
            projection.update({
                "ticker": ticker,
                "name": stock_name,
                "horizon": horizon_name,
            })
            projections[horizon_name] = projection
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error computing {horizon_name} projection: {str(e)}")
    
    # Compute HISTORICAL score from 3 months ago (for chart visualization)
    historical_score = None
    try:
        # Calculate what the 3M score was 90 days ago
        three_months_ago_idx = len(df) - 90  # Go back 90 days from today
        if three_months_ago_idx > 63:  # Need at least 63 days of lookback data
            historical_df = df.iloc[:three_months_ago_idx]
            historical_spy = spy_df.iloc[:three_months_ago_idx]
            historical_score = compute_stock_projection(
                ticker, 
                historical_df, 
                historical_spy, 
                HORIZONS["3m"],  # 63 days
                system_state
            )["score_total"]
    except Exception as e:
        # If we can't compute historical, that's okay - frontend will handle it
        print(f"Warning: Could not compute historical score for {ticker}: {str(e)}")
    
    return {
        "ticker": ticker,
        "name": stock_name,
        "as_of_date": datetime.now().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "data_warnings": data_warnings,
        "projections": projections,
        "historical": {
            "score_3m_ago": historical_score  # What the score was 90 days ago
        }
    }
