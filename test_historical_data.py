"""
Test script to verify historical data accuracy for stocks and sectors
Compares simulated -3M data with actual historical scores
"""

import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

def calculate_score_at_date(ticker: str, target_date: datetime, spy_df: pd.DataFrame) -> dict:
    """Calculate what the score would have been at a historical date"""
    
    # Fetch data up to the target date
    stock = yf.Ticker(ticker)
    end_date = target_date
    start_date = end_date - timedelta(days=500)  # Need enough lookback
    
    df = stock.history(start=start_date, end=end_date)
    if df.empty or len(df) < 63:
        return {"error": "Insufficient data"}
    
    df['returns'] = df['Close'].pct_change()
    
    # Use 3-month horizon (63 days) from the target date
    horizon_days = 63
    window_df = df.iloc[-horizon_days:]
    
    # Filter SPY data up to target date and get last 63 days
    spy_filtered = spy_df[spy_df.index <= pd.Timestamp(target_date).tz_localize(spy_df.index.tz)]
    spy_window = spy_filtered.iloc[-horizon_days:] if len(spy_filtered) >= horizon_days else spy_filtered
    
    # 1. TREND SCORE (45% weight)
    total_return = (window_df['Close'].iloc[-1] / window_df['Close'].iloc[0]) - 1
    sma_200 = df['Close'].rolling(200).mean().iloc[-1]
    sma_distance = (df['Close'].iloc[-1] / sma_200) - 1 if not pd.isna(sma_200) else 0
    trend_raw = total_return + (0.5 * sma_distance)
    trend_score = max(0, min(100, (trend_raw + 0.5) * 100))
    
    # 2. RELATIVE STRENGTH SCORE (30% weight)
    spy_return = (spy_window['Close'].iloc[-1] / spy_window['Close'].iloc[0]) - 1
    relative_strength_raw = total_return - spy_return
    rel_strength_score = max(0, min(100, (relative_strength_raw + 0.5) * 100))
    
    # 3. RISK SCORE (20% weight)
    volatility = window_df['returns'].rolling(20).std().mean() * np.sqrt(252) * 100
    cumulative = (1 + window_df['returns']).cumprod()
    running_max = cumulative.expanding().max()
    drawdown = ((cumulative - running_max) / running_max * 100).min()
    max_drawdown = abs(drawdown)
    risk_raw = volatility + (0.5 * max_drawdown)
    risk_score = max(0, min(100, 100 - (risk_raw * 2)))
    
    # 4. REGIME ADJUSTMENT (5%)
    regime_score = 50
    
    # COMPOSITE SCORE
    composite_score = (
        0.45 * trend_score +
        0.30 * rel_strength_score +
        0.20 * risk_score +
        0.05 * regime_score
    )
    
    return {
        "date": target_date.strftime("%Y-%m-%d"),
        "composite_score": round(composite_score, 1),
        "trend_score": round(trend_score, 1),
        "rel_strength_score": round(rel_strength_score, 1),
        "risk_score": round(risk_score, 1),
        "total_return_pct": round(total_return * 100, 2)
    }


def test_stock_historical_accuracy(ticker: str = "AAPL"):
    """Test a stock's historical vs current scores"""
    
    print(f"\n{'='*60}")
    print(f"TESTING HISTORICAL DATA ACCURACY FOR {ticker}")
    print(f"{'='*60}\n")
    
    # Fetch SPY for benchmark comparisons
    spy = yf.Ticker("SPY")
    spy_df = spy.history(start=datetime.now() - timedelta(days=500), end=datetime.now())
    
    # Calculate scores at different dates
    today = datetime.now()
    three_months_ago = today - timedelta(days=90)
    
    print(f"Today's Date: {today.strftime('%Y-%m-%d')}")
    print(f"3 Months Ago: {three_months_ago.strftime('%Y-%m-%d')}\n")
    
    # Get historical score from 3 months ago
    historical_score = calculate_score_at_date(ticker, three_months_ago, spy_df)
    print("ACTUAL HISTORICAL SCORE (3 months ago):")
    print(f"  Composite: {historical_score.get('composite_score', 'N/A')}")
    print(f"  Trend: {historical_score.get('trend_score', 'N/A')}")
    print(f"  Rel Strength: {historical_score.get('rel_strength_score', 'N/A')}")
    print(f"  Risk: {historical_score.get('risk_score', 'N/A')}")
    print(f"  Return: {historical_score.get('total_return_pct', 'N/A')}%\n")
    
    # Get current score
    current_score = calculate_score_at_date(ticker, today, spy_df)
    print("CURRENT SCORE (today):")
    print(f"  Composite: {current_score.get('composite_score', 'N/A')}")
    print(f"  Trend: {current_score.get('trend_score', 'N/A')}")
    print(f"  Rel Strength: {current_score.get('rel_strength_score', 'N/A')}")
    print(f"  Risk: {current_score.get('risk_score', 'N/A')}")
    print(f"  Return: {current_score.get('total_return_pct', 'N/A')}%\n")
    
    # Compare with simulated value
    simulated_historical = current_score.get('composite_score', 0) - 8
    actual_historical = historical_score.get('composite_score', 0)
    difference = abs(simulated_historical - actual_historical)
    
    print("COMPARISON:")
    print(f"  Simulated -3M score: {simulated_historical}")
    print(f"  Actual -3M score: {actual_historical}")
    print(f"  Difference: {difference} points")
    
    if difference > 15:
        print(f"  ⚠️  WARNING: Large discrepancy! Consider using real historical data.")
    elif difference > 8:
        print(f"  ⚠️  CAUTION: Moderate discrepancy. Simulated data is approximate.")
    else:
        print(f"  ✓ OK: Small discrepancy. Simulated data is reasonable.")
    
    print(f"\n{'='*60}\n")


if __name__ == "__main__":
    # Test a few different stocks
    test_stocks = ["AAPL", "TSLA", "DVLT", "SPY"]
    
    for ticker in test_stocks:
        try:
            test_stock_historical_accuracy(ticker)
        except Exception as e:
            print(f"\nError testing {ticker}: {str(e)}\n")
