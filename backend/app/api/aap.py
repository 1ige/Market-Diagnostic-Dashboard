"""
Alternative Asset Pressure (AAP) Indicator API Endpoints

Provides access to AAP indicator data, components, and regime analysis.
"""

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from typing import List, Optional

from app.utils.db_helpers import get_db_session
from app.models.alternative_assets import (
    AAPIndicator,
    AAPComponent,
    AAPRegimeHistory,
    CryptoPrice,
    MacroLiquidityData
)
from app.services.aap_calculator import AAPCalculator

router = APIRouter(prefix="/aap", tags=["Alternative Asset Pressure"])


@router.get("/current")
def get_current_aap():
    """
    Get the most recent AAP indicator reading.
    
    Returns:
        - stability_score: 0-100 (higher = more stable, less alternative pressure)
        - regime: Current market regime classification
        - primary_driver: What's driving the signal (metals/crypto/coordinated)
        - stress_type: Type of stress being indicated
    """
    with get_db_session() as db:
        indicator = db.query(AAPIndicator).order_by(
            desc(AAPIndicator.date)
        ).first()
        
        if not indicator:
            raise HTTPException(status_code=404, detail="No AAP data available")
        
        return {
            "date": indicator.date.isoformat(),
            "stability_score": round(indicator.stability_score, 1),
        "pressure_index": round(indicator.pressure_index, 3),
        "regime": indicator.regime,
        "regime_confidence": round(indicator.regime_confidence, 2),
        "regime_days_persistent": indicator.regime_days_persistent,
        "primary_driver": indicator.primary_driver,
        "stress_type": indicator.stress_type,
        "metals_contribution": round(indicator.metals_contribution, 3),
        "crypto_contribution": round(indicator.crypto_contribution, 3),
        "is_critical": bool(indicator.is_critical),
        "is_transitioning": bool(indicator.is_transitioning),
        "changes": {
            "1d": round(indicator.score_1d_change, 1) if indicator.score_1d_change else None,
            "5d": round(indicator.score_5d_change, 1) if indicator.score_5d_change else None,
        },
        "averages": {
            "20d": round(indicator.score_20d_avg, 1) if indicator.score_20d_avg else None,
            "90d": round(indicator.score_90d_avg, 1) if indicator.score_90d_avg else None,
        },
        "context": {
            "vix_level": round(indicator.vix_level, 1) if indicator.vix_level else None,
            "liquidity_regime": indicator.liquidity_regime,
            "fed_pivot_signal": round(indicator.fed_pivot_signal, 2) if indicator.fed_pivot_signal else None,
        },
        "data_quality": {
            "completeness": round(indicator.data_completeness, 2),
            "notes": indicator.calculation_notes,
        },
            "interpretation": _get_regime_interpretation(indicator.regime, indicator.stress_type),
        }


@router.get("/history")
def get_aap_history(
    days: int = Query(90, ge=1, le=730, description="Number of days of history")
):
    """
    Get historical AAP indicator values.
    
    Query params:
        - days: Number of days to retrieve (default 90, max 730)
    """
    with get_db_session() as db:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        indicators = db.query(AAPIndicator).filter(
            AAPIndicator.date >= start_date
        ).order_by(AAPIndicator.date).all()
        
        if not indicators:
            raise HTTPException(status_code=404, detail="No historical data available")
        
        return {
            "period": {
            "start": indicators[0].date.isoformat(),
            "end": indicators[-1].date.isoformat(),
            "days": len(indicators),
        },
        "data": [
            {
                "date": ind.date.isoformat(),
                "stability_score": round(ind.stability_score, 1),
                "regime": ind.regime,
                "primary_driver": ind.primary_driver,
                "metals_contribution": round(ind.metals_contribution, 3),
                "crypto_contribution": round(ind.crypto_contribution, 3),
                "is_critical": bool(ind.is_critical),
            }
            for ind in indicators
        ],
        "summary": {
            "current_score": round(indicators[-1].stability_score, 1),
            "avg_score": round(sum(ind.stability_score for ind in indicators) / len(indicators), 1),
            "min_score": round(min(ind.stability_score for ind in indicators), 1),
            "max_score": round(max(ind.stability_score for ind in indicators), 1),
                "volatility": round(
                    np.std([ind.stability_score for ind in indicators]), 1
                ) if len(indicators) > 1 else 0,
            }
        }


@router.get("/components/current")
def get_current_components():
    """
    Get detailed component breakdown for the most recent AAP calculation.
    Useful for understanding what's driving the signal.
    """
    with get_db_session() as db:
        component = db.query(AAPComponent).order_by(
            desc(AAPComponent.date)
        ).first()
        
        if not component:
            raise HTTPException(status_code=404, detail="No component data available")
        
        return {
            "date": component.date.isoformat(),
            "subsystems": {
                "metals": {
                    "pressure_score": round(component.metals_pressure_score, 3),
                    "components": {": {
                        "monetary_strength": {
                            "gold_usd_zscore": round(component.gold_usd_zscore, 3) if component.gold_usd_zscore else None,
                        "gold_real_rate_divergence": round(component.gold_real_rate_divergence, 3) if component.gold_real_rate_divergence else None,
                        "cb_gold_momentum": round(component.cb_gold_momentum, 3) if component.cb_gold_momentum else None,
                        "silver_usd_zscore": round(component.silver_usd_zscore, 3) if component.silver_usd_zscore else None,
                    },
                    "ratio_signals": {
                        "gold_silver_ratio": round(component.gold_silver_ratio_signal, 3) if component.gold_silver_ratio_signal else None,
                        "platinum_gold_ratio": round(component.platinum_gold_ratio, 3) if component.platinum_gold_ratio else None,
                        "palladium_gold_ratio": round(component.palladium_gold_ratio, 3) if component.palladium_gold_ratio else None,
                    },
                    "physical_stress": {
                        "comex_stress_ratio": round(component.comex_stress_ratio, 3) if component.comex_stress_ratio else None,
                        "backwardation_signal": round(component.backwardation_signal, 3) if component.backwardation_signal else None,
                        "etf_flow_divergence": round(component.etf_flow_divergence, 3) if component.etf_flow_divergence else None,
                        }
                    }
                },
                "crypto": {
                    "pressure_score": round(component.crypto_pressure_score, 3),
                    "components": {": {
                        "monetary_barometer": {
                            "btc_usd_zscore": round(component.btc_usd_zscore, 3) if component.btc_usd_zscore else None,
                        "btc_gold_zscore": round(component.btc_gold_zscore, 3) if component.btc_gold_zscore else None,
                        "btc_real_rate_break": round(component.btc_real_rate_break, 3) if component.btc_real_rate_break else None,
                    },
                    "market_structure": {
                        "crypto_m2_ratio": round(component.crypto_m2_ratio, 3) if component.crypto_m2_ratio else None,
                        "btc_dominance_momentum": round(component.btc_dominance_momentum, 3) if component.btc_dominance_momentum else None,
                        "altcoin_btc_signal": round(component.altcoin_btc_signal, 3) if component.altcoin_btc_signal else None,
                    },
                    "liquidity_correlation": {
                        "crypto_vs_fed_bs": round(component.crypto_vs_fed_bs, 3) if component.crypto_vs_fed_bs else None,
                        "crypto_qt_resilience": round(component.crypto_qt_resilience, 3) if component.crypto_qt_resilience else None,
                        }
                    }
                }
            },
            "cross_asset": {
                "multiplier": round(component.cross_asset_multiplier, 2),
                "correlation_regime": component.correlation_regime,
            }
        }


@router.get("/regime/current")
def get_current_regime():
    """
    Get detailed information about the current market regime.
    """
    with get_db_session() as db:
        indicator = db.query(AAPIndicator).order_by(
            desc(AAPIndicator.date)
        ).first()
        
        if not indicator:
            raise HTTPException(status_code=404, detail="No regime data available")
        
        regime_history = db.query(AAPRegimeHistory).filter(
            AAPRegimeHistory.regime_end.is_(None)
        ).first()
        
        return {
            "current_regime": {
                "name": indicator.regime,
            "confidence": round(indicator.regime_confidence, 2),
            "days_persistent": indicator.regime_days_persistent,
            "started": regime_history.regime_start.isoformat() if regime_history else None,
        },
        "signals": {
            "primary_driver": indicator.primary_driver,
            "stress_type": indicator.stress_type,
            "stability_score": round(indicator.stability_score, 1),
        },
            "interpretation": _get_regime_interpretation(indicator.regime, indicator.stress_type),
            "context": {
                "liquidity_regime": indicator.liquidity_regime,
                "is_critical": bool(indicator.is_critical),
                "is_transitioning": bool(indicator.is_transitioning),
                "circuit_breaker_active": bool(indicator.circuit_breaker_active),
            }
        }


@router.get("/regime/history")
def get_regime_history(
    limit: int = Query(10, ge=1, le=50, description="Number of regime periods")
):
    """
    Get historical regime transitions and their characteristics.
    """
    with get_db_session() as db:
        regimes = db.query(AAPRegimeHistory).order_by(
            desc(AAPRegimeHistory.regime_start)
        ).limit(limit).all()
        
        if not regimes:
            raise HTTPException(status_code=404, detail="No regime history available")
        
        return {
            "regimes": [
                {   {
                    "name": regime.regime_name,
                    "started": regime.regime_start.isoformat(),
                    "ended": regime.regime_end.isoformat() if regime.regime_end else "ongoing",
                    "duration_days": regime.duration_days,
                    "stability_scores": {
                    "average": round(regime.avg_stability_score, 1) if regime.avg_stability_score else None,
                    "min": round(regime.min_stability_score, 1) if regime.min_stability_score else None,
                    "max": round(regime.max_stability_score, 1) if regime.max_stability_score else None,
                },
                    "outcome": regime.market_outcome,
                }
                for regime in regimes
            ]
        }


@router.get("/dashboard")
def get_dashboard_summary():
    """
    Get comprehensive AAP dashboard summary with all key metrics.
    Designed for main dashboard display.
    """
    with get_db_session() as db:
        # Current indicator
        current = db.query(AAPIndicator).order_by(
            desc(AAPIndicator.date)
        ).first()
        
        if not current:
            raise HTTPException(status_code=404, detail="No AAP data available")
        
        # Recent history for trend
        recent = db.query(AAPIndicator).filter(
            AAPIndicator.date >= current.date - timedelta(days=30)
        ).order_by(AAPIndicator.date).all()
        
        # Current regime details
        regime_history = db.query(AAPRegimeHistory).filter(
            AAPRegimeHistory.regime_end.is_(None)
        ).first()
        
        # Components
        components = db.query(AAPComponent).filter(
            AAPComponent.date == current.date
        ).first()
        
        return {
            "headline": {
            "stability_score": round(current.stability_score, 1),
            "regime": current.regime,
            "status": _get_status_level(current.stability_score),
            "trend": _calculate_trend(recent),
            "alert_level": "CRITICAL" if current.is_critical else "WATCH" if current.is_transitioning else "NORMAL",
        },
        "current_state": {
            "date": current.date.isoformat(),
            "regime": {
                "name": current.regime,
                "confidence": round(current.regime_confidence, 2),
                "days_persistent": current.regime_days_persistent,
            },
            "drivers": {
                "primary": current.primary_driver,
                "metals_pressure": round(current.metals_contribution, 2),
                "crypto_pressure": round(current.crypto_contribution, 2),
            },
            "stress_type": current.stress_type,
        },
        "subsystem_breakdown": {
            "metals": {
                "pressure": round(components.metals_pressure_score, 2) if components else None,
                "key_signals": _get_top_metal_signals(components) if components else []
            },
            "crypto": {
                "pressure": round(components.crypto_pressure_score, 2) if components else None,
                "key_signals": _get_top_crypto_signals(components) if components else []
            }
        },
        "context": {
            "liquidity_regime": current.liquidity_regime,
            "vix_level": round(current.vix_level, 1) if current.vix_level else None,
            "fed_pivot_signal": round(current.fed_pivot_signal, 2) if current.fed_pivot_signal else None,
        },
        "recent_changes": {
            "1d": round(current.score_1d_change, 1) if current.score_1d_change else None,
            "5d": round(current.score_5d_change, 1) if current.score_5d_change else None,
            "20d_avg": round(current.score_20d_avg, 1) if current.score_20d_avg else None,
        },
            "interpretation": _get_regime_interpretation(current.regime, current.stress_type),
            "chart_data": [
                {
                    "date": ind.date.isoformat(),
                    "score": round(ind.stability_score, 1),
                    "regime": ind.regime,
                }
                for ind in recent
            ]
        }


@router.post("/calculate")
def trigger_calculation(
    date: Optional[str] = Query(None, description="Date to calculate (YYYY-MM-DD), defaults to today")
):
    """
    Manually trigger AAP calculation for a specific date.
    Admin/development endpoint.
    """
    if date:
        try:
            target_date = datetime.fromisoformat(date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        target_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    with get_db_session() as db:
        calculator = AAPCalculator(db)
        indicator = calculator.calculate_for_date(target_date)
        
        if not indicator:
            raise HTTPException(
                status_code=500,
                detail="Calculation failed - insufficient data or error occurred"
            )
        
        return {
            "success": True,
            "date": indicator.date.isoformat(),
            "stability_score": round(indicator.stability_score, 1),
            "regime": indicator.regime,
        }
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        target_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    with get_db_session() as db:
        calculator = AAPCalculator(db)
        indicator = calculator.calculate_for_date(target_date)ate)
        
        if not indicator:
            raise HTTPException(
                status_code=500,
                detail="Calculation failed - insufficient data or error occurred"
            )
        
        return {
            "success": True,
            "date": indicator.date.isoformat(),
            "stability_score": round(indicator.stability_score, 1),
            "regime": indicator.regime,
        }
# ===== HELPER FUNCTIONS =====

def _get_regime_interpretation(regime: str, stress_type: str) -> dict:
    """Generate human-readable regime interpretation"""
    interpretations = {
        "normal_confidence": {
            "summary": "Traditional financial system functioning normally",
            "meaning": "Alternative assets behaving as portfolio diversifiers, not flight-to-safety vehicles. No systemic trust issues detected.",
            "implications": "Equities and credit markets likely stable. Normal risk-taking behavior.",
            "watch_for": "Early signs of monetary stress or liquidity tightening.",
        },
        "mild_caution": {
            "summary": "Early alternative asset accumulation detected",
            "meaning": "Hedging behavior emerging. Some participants questioning traditional asset valuations or monetary policy.",
            "implications": "Monitor for acceleration. May be precursor to broader stress or temporary volatility.",
            "watch_for": "Coordinated moves in metals and crypto. Liquidity conditions tightening.",
        },
        "monetary_stress": {
            "summary": "Significant pressure toward alternative assets",
            "meaning": "Fiat currency credibility questions emerging. Inflation fears or policy uncertainty driving allocation shifts.",
            "implications": "Elevated risk of market volatility. Traditional assets under pressure.",
            "watch_for": "Physical/paper divergences. Central bank policy errors. Regime transition signals.",
        },
        "liquidity_crisis": {
            "summary": "Sharp reallocation to alternative stores of value",
            "meaning": "System plumbing under strain. Paper markets disconnecting from physical. Dollar shortage or collateral stress likely.",
            "implications": "High-risk environment. Forced liquidations possible. Credit spreads widening.",
            "watch_for": "Systemic breaks. Intervention from central banks. Flight to ultimate liquidity.",
        },
        "systemic_breakdown": {
            "summary": "CRITICAL: Flight from fiat accelerating",
            "meaning": "Deep crisis of confidence in traditional monetary system. Monetary regime questions active.",
            "implications": "Extreme volatility. Potential for policy regime change. Historical inflection point.",
            "watch_for": "Central bank emergency actions. Currency crises. Political instability.",
        }
    }
    
    base = interpretations.get(regime, interpretations["normal_confidence"])
    
    # Add stress-type specific context
    stress_context = {
        "monetary": "Driven by inflation fears or currency debasement concerns",
        "liquidity": "Driven by tightness in financial plumbing and collateral markets",
        "speculative": "May be driven by risk-on speculation rather than systemic distrust",
        "systemic": "Fundamental questions about monetary regime sustainability",
    }
    
    base["stress_context"] = stress_context.get(stress_type, "Mixed signals")
    
    return base


def _get_status_level(stability_score: float) -> str:
    """Convert stability score to status level"""
    if stability_score >= 90:
        return "STABLE"
    elif stability_score >= 70:
        return "WATCH"
    elif stability_score >= 40:
        return "CAUTION"
    elif stability_score >= 20:
        return "WARNING"
    else:
        return "CRITICAL"


def _calculate_trend(indicators: List[AAPIndicator]) -> str:
    """Calculate recent trend direction"""
    if len(indicators) < 5:
        return "insufficient_data"
    
    recent_scores = [ind.stability_score for ind in indicators[-5:]]
    
    # Simple linear trend
    trend = recent_scores[-1] - recent_scores[0]
    
    if trend > 5:
        return "improving"
    elif trend < -5:
        return "deteriorating"
    else:
        return "stable"


def _get_top_metal_signals(component: AAPComponent) -> List[dict]:
    """Identify top metal signals driving pressure"""
    signals = []
    
    if component.comex_stress_ratio and component.comex_stress_ratio > 0.6:
        signals.append({
            "name": "COMEX Stress",
            "value": round(component.comex_stress_ratio, 2),
            "interpretation": "Physical vs paper tension high"
        })
    
    if component.gold_silver_ratio_signal and component.gold_silver_ratio_signal > 0.65:
        signals.append({
            "name": "Gold/Silver Ratio",
            "value": round(component.gold_silver_ratio_signal, 2),
            "interpretation": "Monetary stress signal elevated"
        })
    
    if component.gold_real_rate_divergence and component.gold_real_rate_divergence > 0.65:
        signals.append({
            "name": "Gold/Real Rate Divergence",
            "value": round(component.gold_real_rate_divergence, 2),
            "interpretation": "Gold strength despite high real rates"
        })
    
    return signals[:3]  # Top 3


def _get_top_crypto_signals(component: AAPComponent) -> List[dict]:
    """Identify top crypto signals driving pressure"""
    signals = []
    
    if component.btc_usd_zscore and component.btc_usd_zscore > 0.65:
        signals.append({
            "name": "BTC Strength",
            "value": round(component.btc_usd_zscore, 2),
            "interpretation": "Bitcoin outperforming significantly"
        })
    
    if component.crypto_vs_fed_bs and component.crypto_vs_fed_bs > 0.65:
        signals.append({
            "name": "Crypto/Fed BS Divergence",
            "value": round(component.crypto_vs_fed_bs, 2),
            "interpretation": "Crypto rising despite QT"
        })
    
    if component.btc_dominance_momentum and component.btc_dominance_momentum > 0.65:
        signals.append({
            "name": "BTC Dominance",
            "value": round(component.btc_dominance_momentum, 2),
            "interpretation": "Flight to hardest crypto"
        })
    
    return signals[:3]  # Top 3


import numpy as np  # For trend calculation
