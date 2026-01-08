"""
Metal Projections Service
Computes technical projections for precious metals with support/resistance analysis
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any
from sqlalchemy import desc

from app.models.precious_metals import MetalPrice
from app.utils.db_helpers import get_db_session


def fetch_metal_price_history(metal: str, days: int = 365) -> pd.DataFrame:
    """Fetch historical price data for a metal"""
    with get_db_session() as db:
        cutoff = datetime.utcnow() - timedelta(days=days)
        prices = db.query(MetalPrice).filter(
            MetalPrice.metal == metal,
            MetalPrice.date >= cutoff
        ).order_by(MetalPrice.date).all()
        
        if not prices:
            return pd.DataFrame()
        
        df = pd.DataFrame([{
            'date': p.date,
            'price': p.price_usd_per_oz
        } for p in prices])
        
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        return df


def compute_metal_projection(metal: str, metal_name: str, etf_symbol: str) -> Dict[str, Any]:
    """
    Compute technical projection for a precious metal
    
    Returns projection with:
    - Current price and momentum
    - Support/resistance levels
    - Technical score
    - Price targets
    """
    df = fetch_metal_price_history(metal, days=365)
    
    if df.empty or len(df) < 30:
        return {
            "metal": metal,
            "metal_name": metal_name,
            "etf_symbol": etf_symbol,
            "error": "Insufficient historical data"
        }
    
    current_price = float(df['price'].iloc[-1])
    
    # Calculate technical indicators
    df['sma_20'] = df['price'].rolling(window=20).mean()
    df['sma_50'] = df['price'].rolling(window=50).mean()
    df['sma_200'] = df['price'].rolling(window=200).mean()
    
    # RSI calculation
    delta = df['price'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))
    
    # Momentum
    df['momentum_5d'] = df['price'].pct_change(periods=5) * 100
    df['momentum_20d'] = df['price'].pct_change(periods=20) * 100
    df['momentum_60d'] = df['price'].pct_change(periods=60) * 100
    
    # Volatility
    df['returns'] = df['price'].pct_change()
    volatility_30d = df['returns'].rolling(window=30).std() * np.sqrt(252) * 100
    
    latest = df.iloc[-1]
    
    # Calculate distance from moving averages (gap analysis)
    sma_20_distance = ((current_price - latest['sma_20']) / latest['sma_20'] * 100) if pd.notna(latest['sma_20']) else 0
    sma_50_distance = ((current_price - latest['sma_50']) / latest['sma_50'] * 100) if pd.notna(latest['sma_50']) else 0
    sma_200_distance = ((current_price - latest['sma_200']) / latest['sma_200'] * 100) if pd.notna(latest['sma_200']) else 0
    
    # Technical scoring with exhaustion penalties
    score_trend = 0
    if pd.notna(latest['sma_20']) and pd.notna(latest['sma_50']):
        # Base trend score
        if current_price > latest['sma_20']:
            # Penalty for being too extended above SMA20
            if sma_20_distance > 10:
                score_trend += 10  # Extended, potential exhaustion
            elif sma_20_distance > 5:
                score_trend += 20  # Moderately extended
            else:
                score_trend += 25  # Healthy uptrend
        else:
            score_trend += 5  # Below SMA20
            
        if current_price > latest['sma_50']:
            if sma_50_distance > 15:
                score_trend += 10  # Very extended
            elif sma_50_distance > 8:
                score_trend += 20
            else:
                score_trend += 25
        else:
            score_trend += 5
            
        if pd.notna(latest['sma_200']) and current_price > latest['sma_200']:
            if sma_200_distance > 25:
                score_trend += 10  # Extremely extended from long-term mean
            elif sma_200_distance > 15:
                score_trend += 20
            else:
                score_trend += 25
        else:
            score_trend += 5
            
        if latest['sma_20'] > latest['sma_50']:
            score_trend += 25
        else:
            score_trend += 10  # Bearish alignment
    
    # RSI scoring with overbought/oversold considerations
    score_momentum = 0
    if pd.notna(latest['rsi']):
        rsi = latest['rsi']
        if 45 <= rsi <= 55:
            score_momentum = 100  # Neutral - most room to run
        elif 40 <= rsi < 45 or 55 < rsi <= 60:
            score_momentum = 90  # Slight bias but still good
        elif 35 <= rsi < 40 or 60 < rsi <= 65:
            score_momentum = 75  # Getting extended
        elif 30 <= rsi < 35 or 65 < rsi <= 70:
            score_momentum = 50  # Oversold/overbought territory
        elif rsi < 30:
            score_momentum = 30  # Deeply oversold - risky
        elif rsi > 70:
            score_momentum = 25  # Overbought - exhaustion risk
        elif 30 <= rsi < 40 or 60 < rsi <= 70:
            score_momentum = 75
        elif 20 <= rsi < 30 or 70 < rsi <= 80:
            score_momentum = 50
        else:
            score_momentum = 25
    
    # Support/Resistance levels from recent price action
    recent_df = df.tail(90)
    support_levels = []
    resistance_levels = []
    
    # Find local minima/maxima
    window = 5
    for i in range(window, len(recent_df) - window):
        price_window = recent_df['price'].iloc[i-window:i+window+1]
        current = recent_df['price'].iloc[i]
        
        if current == price_window.min():
            support_levels.append(float(current))
        if current == price_window.max():
            resistance_levels.append(float(current))
    
    # Get top 3 support/resistance levels
    support_levels = sorted(set([s for s in support_levels if s < current_price]))[-3:] if support_levels else []
    resistance_levels = sorted(set([r for r in resistance_levels if r > current_price]))[:3] if resistance_levels else []
    
    # Price targets
    take_profit = current_price * 1.10  # 10% upside target
    stop_loss = current_price * 0.95    # 5% downside protection
    
    # Overall score
    score_total = (score_trend * 0.6 + score_momentum * 0.4)
    
    # Classification
    if score_total >= 75:
        classification = "Strong"
    elif score_total >= 60:
        classification = "Bullish"
    elif score_total >= 40:
        classification = "Neutral"
    elif score_total >= 25:
        classification = "Bearish"
    else:
        classification = "Weak"
    
    return {
        "metal": metal,
        "metal_name": metal_name,
        "etf_symbol": etf_symbol,
        "current_price": current_price,
        "score_total": round(score_total, 1),
        "score_trend": score_trend,
        "score_momentum": score_momentum,
        "classification": classification,
        "technicals": {
            "sma_20": float(latest['sma_20']) if pd.notna(latest['sma_20']) else None,
            "sma_50": float(latest['sma_50']) if pd.notna(latest['sma_50']) else None,
            "sma_200": float(latest['sma_200']) if pd.notna(latest['sma_200']) else None,
            "rsi": float(latest['rsi']) if pd.notna(latest['rsi']) else None,
            "momentum_5d": float(latest['momentum_5d']) if pd.notna(latest['momentum_5d']) else None,
            "momentum_20d": float(latest['momentum_20d']) if pd.notna(latest['momentum_20d']) else None,
            "momentum_60d": float(latest['momentum_60d']) if pd.notna(latest['momentum_60d']) else None,
            "volatility_30d": float(volatility_30d.iloc[-1]) if pd.notna(volatility_30d.iloc[-1]) else None,
        },
        "levels": {
            "support": support_levels,
            "resistance": resistance_levels,
            "take_profit": round(take_profit, 2),
            "stop_loss": round(stop_loss, 2),
        },
        "as_of": datetime.utcnow().isoformat()
    }


def compute_all_metal_projections() -> Dict[str, Any]:
    """Compute projections for all precious metals"""
    metals = [
        ("AU", "Gold", "GLD"),
        ("AG", "Silver", "SLV"),
        ("PT", "Platinum", "PPLT"),
        ("PD", "Palladium", "PALL"),
    ]
    
    projections = []
    for metal, name, etf in metals:
        proj = compute_metal_projection(metal, name, etf)
        if "error" not in proj:
            projections.append(proj)
    
    # Sort by score to determine winners/losers
    projections.sort(key=lambda x: x['score_total'], reverse=True)
    
    # Add rank and classification
    for i, proj in enumerate(projections):
        proj['rank'] = i + 1
        if i == 0:
            proj['relative_classification'] = "Winner"
        elif i == len(projections) - 1:
            proj['relative_classification'] = "Loser"
        else:
            proj['relative_classification'] = "Neutral"
    
    return {
        "projections": projections,
        "as_of": datetime.utcnow().isoformat(),
        "model_version": "1.0"
    }
