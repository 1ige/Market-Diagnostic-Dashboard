from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import List
from sqlalchemy import func, desc
import statistics

from app.models.precious_metals import (
    MetalPrice, MetalRatio, CBHolding, CBPurchase, COMEXInventory, 
    ETFHolding, SupplyData, DemandData, MetalCorrelation, 
    MetalRegimeClassification, BackwardationData, LBMAPremium, MetalVolatility,
    RegimeType, GoldBiasType, SilverBiasType, PGMBiasType, RiskLevel
)
from app.utils.db_helpers import get_db_session

router = APIRouter(prefix="/precious-metals", tags=["precious-metals"])


# ==================== HELPER FUNCTIONS ====================

def calculate_structural_monetary_bid(db) -> float:
    """
    SMB = 0.5 × (Net Purchase Momentum) 
        + 0.3 × (CB Gold % Reserves Change)
        + 0.2 × (EM Accumulation Trend)
    """
    # Get most recent quarterly purchases (last 4 quarters)
    recent_purchases = db.query(CBPurchase).filter(
        CBPurchase.tonnes_net_yoy_pct.isnot(None)
    ).order_by(desc(CBPurchase.period)).limit(4).all()
    
    if not recent_purchases:
        return 0.0
    
    # Net purchase momentum: avg of recent YoY %
    net_purchase_momentum = sum([p.tonnes_net_yoy_pct for p in recent_purchases]) / len(recent_purchases)
    
    # CB Gold % Reserve Change
    recent_holdings = db.query(CBHolding).filter(
        CBHolding.pct_of_reserves.isnot(None)
    ).order_by(desc(CBHolding.date)).limit(2).all()
    
    cb_reserve_change = 0.0
    if len(recent_holdings) >= 2:
        pct_change = (recent_holdings[0].pct_of_reserves - recent_holdings[1].pct_of_reserves) / recent_holdings[1].pct_of_reserves * 100
        cb_reserve_change = pct_change
    
    # EM Accumulation Trend (proxy: recent purchases from top EM countries)
    em_countries = ["China", "India", "Russia", "Saudi Arabia", "UAE"]
    em_purchases = db.query(CBPurchase).filter(
        CBPurchase.country.in_(em_countries),
        CBPurchase.period >= str(datetime.utcnow().year - 1)
    ).all()
    
    em_accumulation_trend = sum([p.tonnes_net_yoy_pct for p in em_purchases]) / len(em_purchases) if em_purchases else 0.0
    
    # Compute SMB
    smb = (0.5 * net_purchase_momentum) + (0.3 * cb_reserve_change) + (0.2 * em_accumulation_trend)
    return max(-100, min(100, smb))  # Clamp to [-100, 100]


def calculate_monetary_hedge_strength(db) -> float:
    """
    MHS = (Au/DXY_Z + Real_Rate_Signal + 0.5 × M2_Growth_Signal) / 2.5
    Normalized to 0-100
    """
    # Get latest Au/DXY ratio z-score
    latest_au_dxy = db.query(MetalRatio).filter(
        MetalRatio.metal1 == "AU",
        MetalRatio.metal2 == "DXY"
    ).order_by(desc(MetalRatio.date)).first()
    
    au_dxy_zscore = latest_au_dxy.zscore_2y if latest_au_dxy else 0.0
    
    # Real rate signal (inverted: low rates = positive for gold)
    # Would need to fetch from FRED data model or indicators
    real_rate_signal = -0.5  # Placeholder; integrate with core dashboard
    
    # M2 growth signal (placeholder)
    m2_growth_signal = 0.2  # Placeholder
    
    mhs_raw = (au_dxy_zscore + real_rate_signal + (0.5 * m2_growth_signal)) / 2.5
    mhs_score = 50 + (mhs_raw * 50)  # Normalize to 0-100
    return max(0, min(100, mhs_score))


def calculate_paper_credibility_index(db) -> float:
    """
    PCI = 100 - (OI_to_Registered_Ratio / Historical_90th_Percentile) × 100
    Adjusted for backwardation & spreads
    """
    # Get latest COMEX inventory
    latest_comex = db.query(COMEXInventory).order_by(desc(COMEXInventory.date)).first()
    
    if not latest_comex or not latest_comex.oi_to_registered_ratio:
        return 75.0  # Default healthy
    
    # Get historical 90th percentile
    all_ratios = db.query(COMEXInventory.oi_to_registered_ratio).filter(
        COMEXInventory.oi_to_registered_ratio.isnot(None)
    ).all()
    
    if not all_ratios:
        return 75.0
    
    ratios_list = [r[0] for r in all_ratios]
    p90 = statistics.quantiles(ratios_list, n=10)[8] if len(ratios_list) > 10 else max(ratios_list)
    
    stress_factor = (latest_comex.oi_to_registered_ratio / p90) if p90 > 0 else 1.0
    pci = 100 - (stress_factor * 100)
    
    # Adjust for backwardation
    latest_backwardation = db.query(BackwardationData).order_by(desc(BackwardationData.date)).first()
    if latest_backwardation and latest_backwardation.backwardation_bps > 500:
        pci -= 15  # Penalize deep backwardation
    
    return max(0, min(100, pci))


def classify_regime(db) -> tuple:
    """
    Classify metals regime based on indicator combination
    Returns: (regime, gold_bias, silver_bias, pgm_bias, paper_physical_risk)
    """
    smb = calculate_structural_monetary_bid(db)
    mhs = calculate_monetary_hedge_strength(db)
    pci = calculate_paper_credibility_index(db)
    
    # Get latest ratios
    au_ag_latest = db.query(MetalRatio).filter(
        MetalRatio.metal1 == "AU",
        MetalRatio.metal2 == "AG"
    ).order_by(desc(MetalRatio.date)).first()
    
    pt_au_latest = db.query(MetalRatio).filter(
        MetalRatio.metal1 == "PT",
        MetalRatio.metal2 == "AU"
    ).order_by(desc(MetalRatio.date)).first()
    
    # Get industrial demand proxy (silver price momentum + PGM ratios)
    recent_silver_prices = db.query(MetalPrice).filter(
        MetalPrice.metal == "AG"
    ).order_by(desc(MetalPrice.date)).limit(60).all()
    
    silver_momentum = 0.0
    if len(recent_silver_prices) >= 2:
        silver_momentum = (recent_silver_prices[0].price_usd_per_oz - recent_silver_prices[-1].price_usd_per_oz) / recent_silver_prices[-1].price_usd_per_oz * 100
    
    # Regime logic
    if mhs > 60 and smb > 30:
        regime = RegimeType.MONETARY_STRESS
    elif mhs > 40 and silver_momentum > 10:
        regime = RegimeType.INFLATION_HEDGE
    elif pt_au_latest and pt_au_latest.ratio_value > 0.8:
        regime = RegimeType.GROWTH_REFLATION
    elif pci < 50:
        regime = RegimeType.LIQUIDITY_CRISIS
    else:
        regime = RegimeType.INDUSTRIAL_COMMODITY
    
    # Gold bias
    if mhs > 60:
        gold_bias = GoldBiasType.MONETARY_HEDGE
    elif mhs > 40:
        gold_bias = GoldBiasType.NEUTRAL
    else:
        gold_bias = GoldBiasType.FINANCIAL_ASSET
    
    # Silver bias
    if au_ag_latest and au_ag_latest.ratio_value > 70:
        silver_bias = SilverBiasType.INDUSTRIAL_MONETARY  # Ag underperforming due to industrial weakness
    elif au_ag_latest and au_ag_latest.ratio_value < 50:
        silver_bias = SilverBiasType.INDUSTRIAL  # Ag outperforming on industrial demand
    else:
        silver_bias = SilverBiasType.INDUSTRIAL_MONETARY
    
    # PGM bias
    if pt_au_latest and pt_au_latest.ratio_value < 0.6:
        pgm_bias = PGMBiasType.RECESSION
    elif pt_au_latest and pt_au_latest.ratio_value > 0.85:
        pgm_bias = PGMBiasType.GROWTH
    else:
        pgm_bias = PGMBiasType.NEUTRAL
    
    # Paper/Physical risk
    if pci > 75:
        paper_physical_risk = RiskLevel.LOW
    elif pci > 50:
        paper_physical_risk = RiskLevel.MODERATE
    else:
        paper_physical_risk = RiskLevel.HIGH
    
    return regime, gold_bias, silver_bias, pgm_bias, paper_physical_risk


# ==================== API ENDPOINTS ====================

@router.get("/regime")
def get_regime_classification():
    """
    Get current precious metals regime classification
    """
    with get_db_session() as db:
        try:
            regime, gold_bias, silver_bias, pgm_bias, paper_physical_risk = classify_regime(db)
            smb = calculate_structural_monetary_bid(db)
            mhs = calculate_monetary_hedge_strength(db)
            pci = calculate_paper_credibility_index(db)
            
            # Get latest ratios
            au_ag = db.query(MetalRatio).filter(
                MetalRatio.metal1 == "AU", MetalRatio.metal2 == "AG"
            ).order_by(desc(MetalRatio.date)).first()
            
            pt_au = db.query(MetalRatio).filter(
                MetalRatio.metal1 == "PT", MetalRatio.metal2 == "AU"
            ).order_by(desc(MetalRatio.date)).first()
            
            pd_au = db.query(MetalRatio).filter(
                MetalRatio.metal1 == "PD", MetalRatio.metal2 == "AU"
            ).order_by(desc(MetalRatio.date)).first()
            
            au_dxy = db.query(MetalRatio).filter(
                MetalRatio.metal1 == "AU", MetalRatio.metal2 == "DXY"
            ).order_by(desc(MetalRatio.date)).first()
            
            ag_dxy = db.query(MetalRatio).filter(
                MetalRatio.metal1 == "AG", MetalRatio.metal2 == "DXY"
            ).order_by(desc(MetalRatio.date)).first()
            
            # Get COMEX data
            comex = db.query(COMEXInventory).order_by(desc(COMEXInventory.date)).first()
            comex_change = 0.0
            if comex:
                prior_comex = db.query(COMEXInventory).filter(
                    COMEXInventory.date < comex.date
                ).order_by(desc(COMEXInventory.date)).first()
                if prior_comex:
                    comex_change = (comex.total_oz - prior_comex.total_oz) / prior_comex.total_oz * 100
            
            return {
                "regime": {
                    "overall_regime": regime.value,
                    "gold_bias": gold_bias.value,
                    "silver_bias": silver_bias.value,
                    "pgm_bias": pgm_bias.value,
                    "paper_physical_risk": paper_physical_risk.value
                },
                "cb_context": {
                    "global_cb_gold_pct_reserves": 11.2,  # Placeholder; would fetch from aggregated holdings
                    "net_purchases_yoy": 15.0,  # Placeholder
                    "structural_monetary_bid": smb,
                    "em_accumulation_momentum": 18.5  # Placeholder
                },
                "price_anchors": {
                    "au_dxy_ratio_zscore": au_dxy.zscore_2y if au_dxy else 0.0,
                    "ag_dxy_ratio_zscore": ag_dxy.zscore_2y if ag_dxy else 0.0,
                    "real_rate_signal": -0.5,  # Placeholder
                    "monetary_hedge_strength": mhs
                },
                "relative_value": {
                    "au_ag_ratio": au_ag.ratio_value if au_ag else 65.0,
                    "au_ag_ratio_zscore": au_ag.zscore_2y if au_ag else 0.0,
                    "pt_au_ratio": pt_au.ratio_value if pt_au else 0.7,
                    "pt_au_ratio_zscore": pt_au.zscore_2y if pt_au else 0.0,
                    "pd_au_ratio": pd_au.ratio_value if pd_au else 0.5,
                    "pd_au_ratio_zscore": pd_au.zscore_2y if pd_au else 0.0
                },
                "physical_paper": {
                    "paper_credibility_index": pci,
                    "oi_registered_ratio": comex.oi_to_registered_ratio if comex else 1.0,
                    "comex_registered_inventory_change_yoy": comex_change,
                    "backwardation_severity": 0.0,  # Placeholder
                    "etf_flow_divergence": 0.0  # Placeholder
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/cb-holdings")
def get_cb_holdings():
    """
    Get central bank holdings by country (most recent)
    """
    with get_db_session() as db:
        try:
            latest_date = db.query(func.max(CBHolding.date)).scalar()
            if not latest_date:
                return []
            
            holdings = db.query(CBHolding).filter(
                CBHolding.date == latest_date
            ).order_by(desc(CBHolding.gold_tonnes)).limit(20).all()
            
            # Get YoY change
            result = []
            for holding in holdings:
                prior_year = db.query(CBHolding).filter(
                    CBHolding.country == holding.country,
                    CBHolding.date < holding.date - timedelta(days=365)
                ).order_by(desc(CBHolding.date)).first()
                
                yoy_pct = 0.0
                if prior_year:
                    yoy_pct = (holding.gold_tonnes - prior_year.gold_tonnes) / prior_year.gold_tonnes * 100
                
                result.append({
                    "country": holding.country,
                    "gold_tonnes": holding.gold_tonnes,
                    "pct_of_reserves": holding.pct_of_reserves,
                    "net_purchase_qty": 0.0,  # Computed separately if available
                    "net_purchase_yoy_pct": yoy_pct
                })
            
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/supply")
def get_supply_data():
    """
    Get latest supply data (production, AISC, recycling)
    """
    with get_db_session() as db:
        try:
            latest_period = db.query(func.max(SupplyData.period)).scalar()
            if not latest_period:
                return []
            
            supply = db.query(SupplyData).filter(
                SupplyData.period == latest_period
            ).all()
            
            result = []
            for s in supply:
                result.append({
                    "metal": s.metal,
                    "production_tonnes_yoy_pct": s.production_yoy_pct or 0.0,
                    "aisc_per_oz": s.aisc_per_oz or 0.0,
                    "current_spot_price": 2100.0,  # Placeholder; fetch from MetalPrice
                    "margin_pct": ((2100 - (s.aisc_per_oz or 0)) / (s.aisc_per_oz or 1)) * 100 if s.aisc_per_oz else 0,
                    "recycling_pct_of_supply": s.recycling_pct or 0.0
                })
            
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/correlations")
def get_correlations():
    """
    Get latest rolling correlations
    """
    with get_db_session() as db:
        try:
            latest = db.query(MetalCorrelation).order_by(desc(MetalCorrelation.date)).first()
            
            if not latest:
                # Return default neutral correlations if no data
                return {
                    "timestamp": datetime.utcnow().isoformat(),
                    "au_ag": 0.72,
                    "au_pt": 0.61,
                    "au_pd": 0.48,
                    "ag_pt": 0.68,
                    "ag_pd": 0.52,
                    "pt_pd": 0.71,
                    "au_spy": -0.15,
                    "au_tlt": 0.42,
                    "au_dxy": -0.68,
                    "au_vix": 0.55
                }
            
            return {
                "timestamp": latest.date.isoformat(),
                "au_ag": latest.au_ag_60d or 0.72,
                "au_pt": latest.au_pt_60d or 0.61,
                "au_pd": latest.au_pd_60d or 0.48,
                "ag_pt": latest.ag_pt_60d or 0.68,
                "ag_pd": latest.ag_pd_60d or 0.52,
                "pt_pd": (latest.au_pd_60d or 0.5),  # Placeholder
                "au_spy": latest.au_spy_60d or -0.15,
                "au_tlt": latest.au_tlt_60d or 0.42,
                "au_dxy": latest.au_dxy_60d or -0.68,
                "au_vix": latest.au_vix_60d or 0.55
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{metal}")
def get_metal_price_history(metal: str, days: int = 365):
    """
    Get historical price data for a metal
    """
    with get_db_session() as db:
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            prices = db.query(MetalPrice).filter(
                MetalPrice.metal == metal.upper(),
                MetalPrice.date >= cutoff_date
            ).order_by(MetalPrice.date).all()
            
            return [
                {
                    "date": p.date.isoformat(),
                    "price": p.price_usd_per_oz
                }
                for p in prices
            ]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
