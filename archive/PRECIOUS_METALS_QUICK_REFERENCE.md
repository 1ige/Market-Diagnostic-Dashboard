# Precious Metals Diagnostic — Quick Visual Reference

## Page Layout & Component Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRECIOUS METALS DIAGNOSTIC                        │
│                                                                       │
│ "Macro-structural analysis of precious metals as monetary hedges,   │
│  industrial commodities, and risk-off assets."                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ REGIME CLASSIFICATION PANEL (PINNED TOP)                            │
├─────────────────────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────────┐ │
│ │ GOLD   │ │ SILVER │ │  PGM   │ │ P/P    │ │      REGIME        │ │
│ │ BIAS   │ │ BIAS   │ │ BIAS   │ │ RISK   │ │  Classification    │ │
│ │        │ │        │ │        │ │        │ │                    │ │
│ │ GREEN  │ │YELLOW  │ │ RED    │ │ LOW    │ │ MONETARY_STRESS    │ │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────────────────┘ │
│                                                                       │
│ Last Updated: 2026-01-08 | Data Freshness: Real-time | CB (Q lag)  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TAB NAVIGATION                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ [OVERVIEW] | [DEEP DIVE]                                            │
└─────────────────────────────────────────────────────────────────────┘

OVERVIEW TAB:
┌─────────────────────────────────┬─────────────────────────────────┐
│                                 │                                 │
│  SECTION 2:                     │  SECTION 3:                     │
│  Monetary & CB Context          │  Price vs Monetary Anchors      │
│                                 │                                 │
│  • CB gold % reserves           │  • Au/DXY ratio (z-score)       │
│  • Net purchases YoY            │  • Real rates signal            │
│  • Structural Monetary Bid      │  • MHS gauge                    │
│  • Top accumulators (table)     │  • Correlation matrix           │
│                                 │                                 │
└─────────────────────────────────┴─────────────────────────────────┘

┌─────────────────────────────────┬─────────────────────────────────┐
│                                 │                                 │
│  SECTION 4:                     │  SECTION 5:                     │
│  Relative Value: Metals         │  Physical vs Paper              │
│                                 │                                 │
│  • Au/Ag ratio + z-score        │  • Paper Credibility Index      │
│  • Pt/Au ratio + interpretation │  • OI/Registered ratio          │
│  • Pd/Au ratio + z-score        │  • Inventory change YoY         │
│  • Metals leadership scorecard  │  • Backwardation severity       │
│                                 │  • LBMA premiums                │
│                                 │                                 │
└─────────────────────────────────┴─────────────────────────────────┘

┌─────────────────────────────────┬─────────────────────────────────┐
│                                 │                                 │
│  SECTION 6:                     │  SECTION 7:                     │
│  Supply-Side Constraints        │  Demand Decomposition           │
│                                 │                                 │
│  • Production trends YoY %      │  • Investment demand            │
│  • AISC vs spot price margin    │  • Industrial demand (by metal) │
│  • Recycling contribution       │  • Jewelry demand (regional)    │
│  • Supply inelasticity gauge    │  • Demand cycle indicators      │
│                                 │  • ETF flow trending            │
│                                 │  • Marginal demand ID           │
│                                 │                                 │
└─────────────────────────────────┴─────────────────────────────────┘

DEEP DIVE TAB:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  SECTION 8: Market Cap & Monetary Weight                         │
│                                                                  │
│  • Above-ground stock valuation (~$17T)                          │
│  • Metals / Global M2 (8.5%)                                    │
│  • Repricing scenarios (non-predictive context)                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  SECTION 9: Volatility, Correlation & Tail Risk                 │
│                                                                  │
│  • Rolling correlation matrix (Au, Ag, Pt, Pd)                  │
│  • Metal volatility vs equity                                   │
│  • Beta analysis (SPY, VIX, TLT, DXY)                           │
│  • Tail-risk behavior patterns                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                             │
└─────────────────────────────────────────────────────────────────┘

DAILY (16:00 UTC)
├─ Yahoo Finance
│  ├─ GC=F, SI=F, PL=F, PA=F (spot prices)
│  ├─ GLD, SLV, PPLT, PALL (ETF prices/volumes)
│  └─ DXY=F (USD index)
│
├─ FRED
│  ├─ GOLDAMZNND, SILVAMZNND (alternative spot data)
│  ├─ DGS10, DGS2, T10YIFR (rates & TIPS)
│  ├─ FEDFUNDS, M2SL (monetary)
│  └─ WALCL, RRPONTSV (Fed balance sheet)
│
└─ Computed from price data
   ├─ Metal ratios (Au/Ag, Pt/Au, Pd/Au, Au/DXY, Ag/DXY)
   ├─ Z-scores (2-year rolling)
   ├─ Volatility (30/60/252-day annualized)
   └─ Correlations (30/60-day rolling)

WEEKLY (Friday 18:00 UTC)
├─ CME Group [REQUIRES SUBSCRIPTION]
│  ├─ COMEX gold inventory (registered + eligible)
│  ├─ Open interest
│  └─ Backwardation/contango curves
│
└─ LBMA [REQUIRES SUBSCRIPTION]
   ├─ Gold/Silver/Platinum/Palladium premiums
   └─ Bid-ask spreads

MONTHLY (1st 08:00 UTC) [QUARTERLY ACTUAL]
├─ IMF COFER [PUBLIC, 6-WEEK LAG]
│  ├─ Global CB gold holdings (by country)
│  ├─ % of reserves (by country)
│  └─ Allocation shifts
│
├─ World Gold Council [PUBLIC]
│  ├─ Net CB purchases (monthly aggregates)
│  ├─ EM vs DM accumulation trends
│  └─ Supply/demand statistics
│
├─ USGS [PUBLIC, QUARTERLY]
│  ├─ Global mine production (Au, Ag, Pt, Pd)
│  └─ Recycling estimates
│
└─ S&P Global [REQUIRES SUBSCRIPTION]
   ├─ All-in sustaining costs (AISC)
   ├─ Supply forecasts
   └─ Industry commentary

                    ↓ INGESTION ↓

┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
└─────────────────────────────────────────────────────────────────┘

12 Tables:
├─ MetalPrice (daily, indexed on metal + date)
├─ MetalRatio (daily, composite index)
├─ ETFHolding (daily)
├─ MetalVolatility (daily)
├─ MetalCorrelation (daily)
├─ CBHolding (quarterly, indexed on country + date)
├─ CBPurchase (quarterly)
├─ SupplyData (quarterly)
├─ DemandData (quarterly)
├─ BackwardationData (weekly)
├─ LBMAPremium (weekly)
└─ MetalRegimeClassification (daily)

                    ↓ COMPUTATION ↓

┌─────────────────────────────────────────────────────────────────┐
│              INDICATOR CALCULATION ENGINE                        │
└─────────────────────────────────────────────────────────────────┘

Real-Time (Daily):
├─ Structural Monetary Bid (SMB) = f(net purchases, CB allocation, EM trends)
├─ Monetary Hedge Strength (MHS) = f(Au/DXY z-score, real rates, M2)
├─ Paper Credibility Index (PCI) = f(OI/Reg ratio, backwardation, spreads)
├─ Industrial Demand Proxy (IDP) = f(Ag momentum, Pt/Au, Pd/Au, PMI)
├─ Regime Classification = f(SMB, MHS, PCI, IDP, Au/Ag, Pt/Au)
└─ Bias Scores = f(regime, anchors, ratios)

                    ↓ API DELIVERY ↓

┌─────────────────────────────────────────────────────────────────┐
│                    REST API ENDPOINTS                            │
└─────────────────────────────────────────────────────────────────┘

GET /precious-metals/regime
├─ regime (classification)
├─ biases (gold, silver, pgm)
├─ risk levels
├─ all computed indicators
└─ timestamp

GET /precious-metals/cb-holdings
├─ Top 20 countries
├─ Holdings (tonnes)
├─ % of reserves
└─ YoY change %

GET /precious-metals/supply
├─ [Au, Ag, Pt, Pd]
├─ Production YoY %
├─ AISC
├─ Margin %
└─ Recycling %

GET /precious-metals/correlations
├─ All inter-metal correlations
├─ Au correlations (SPY, TLT, DXY, VIX)
└─ 60-day rolling basis

GET /precious-metals/history/{metal}
├─ Date
├─ Spot price
└─ 1-year history (365 days)

                    ↓ FRONTEND RENDERING ↓

┌─────────────────────────────────────────────────────────────────┐
│                  REACT COMPONENT LAYER                           │
└─────────────────────────────────────────────────────────────────┘

Main Component: PreciousMetalsDiagnostic.tsx
├─ State Management: React hooks (useState, useEffect)
├─ Data Fetching: useApi<T> hook
├─ Responsive Design: Tailwind CSS grid system
├─ Tab Navigation: Overview | Deep Dive
└─ 10 Sub-Components:
   ├─ RegimePanel (top pinned)
   ├─ CBContextPanel
   ├─ PriceAnchorsPanel
   ├─ RelativeValuePanel
   ├─ PhysicalPaperPanel
   ├─ SupplyPanel
   ├─ DemandPanel
   ├─ MarketCapPanel
   ├─ CorrelationPanel
   └─ (COT optional)

Responsive Breakpoints:
├─ Mobile: < 768px (1-column, stacked)
├─ Tablet: 768–1024px (2-column where possible)
└─ Desktop: > 1024px (full 4-column grids)
```

---

## Regime Classification Decision Tree

```
START: Analyze regime indicators daily

1. CHECK MONETARY STRESS SIGNALS
   ├─ IF: MHS > 60 AND SMB > 30
   │  └─ REGIME = MONETARY_STRESS
   │     Gold bias: MONETARY_HEDGE ✓
   │     Silver bias: INDUSTRIAL_MONETARY (Ag lags)
   │     PGM bias: GROWTH (Pt rallies)
   │
   ├─ ELSE: Continue to (2)

2. CHECK INFLATION HEDGE SIGNALS
   ├─ IF: MHS > 40 AND Silver_Momentum > 10%
   │  └─ REGIME = INFLATION_HEDGE
   │     Gold bias: NEUTRAL
   │     Silver bias: INDUSTRIAL_MONETARY (CPI + Ag)
   │     PGM bias: RECESSION (fear priced)
   │
   ├─ ELSE: Continue to (3)

3. CHECK GROWTH REFLATION SIGNALS
   ├─ IF: Pt/Au Ratio > 0.8 (PGMs not discounted)
   │  └─ REGIME = GROWTH_REFLATION
   │     Gold bias: FINANCIAL_ASSET (down on rates)
   │     Silver bias: INDUSTRIAL (demand pickup)
   │     PGM bias: GROWTH ✓
   │
   ├─ ELSE: Continue to (4)

4. CHECK LIQUIDITY CRISIS SIGNALS
   ├─ IF: PCI < 50 (Paper/physical stress)
   │  └─ REGIME = LIQUIDITY_CRISIS
   │     Gold bias: MONETARY_HEDGE (rally on crisis)
   │     Silver bias: INDUSTRIAL (crash on deleveraging)
   │     PGM bias: RECESSION (forced selling)
   │
   ├─ ELSE: Continue to (5)

5. DEFAULT (Normal Conditions)
   └─ REGIME = INDUSTRIAL_COMMODITY
      Gold bias: NEUTRAL
      Silver bias: INDUSTRIAL_MONETARY (mix)
      PGM bias: NEUTRAL (balanced)

OUTPUT: Regime + Biases + Risk Level
```

---

## Key Ratio Interpretation Guide

### Gold/Silver Ratio (Au/Ag)

```
    50 ← Pure industrial demand, Ag outperforming
    ├─ [50–60] Balanced au/ag allocation
    │ ├─ 65–75 Monetary stress bias (Ag underperforming)
    │ │ ├─ >75 ACUTE MONETARY STRESS, Ag liquidation pressure
    │ │ │
    └─ Rising = Shift to monetary (Au), defensive
    └─ Falling = Shift to industrial (Ag), growth
```

### Platinum/Gold Ratio (Pt/Au)

```
    0.5 ← Recession fears priced in, Pt deeply discounted
    ├─ [0.6–0.8] Balanced growth expectations
    │ ├─ >0.85 Growth premium embedded
    │ │ ├─ >1.0 RARE, extreme growth optimism
    │ │ │
    └─ Falling = Growth concerns emerging
    └─ Rising = Growth optimism strengthening
```

### Palladium/Gold Ratio (Pd/Au)

```
    0.3 ← EV transition depressing Pd demand
    ├─ [0.4–0.6] Auto cycle neutral
    │ ├─ 0.7–0.8 Strong auto cycle
    │ │ ├─ >0.9 RARE, extreme automotive demand
    │ │ │
    └─ Specifically tracks: EV adoption, OEM demand, catalytic converter scrap cycles
    └─ Component: 85% catalytic converters, sensitive to emission regulations
```

---

## Alert Thresholds (What Triggers "Red"?)

```
SECTION 2: CB Context
├─ SMB < -30 = RED (accumulation reversed)
└─ Net purchases YoY < 100 MT = YELLOW

SECTION 3: Anchors
├─ MHS < 30 = RED (monetary premium collapsing)
├─ Au/DXY z-score > +2.5 σ = RED (extreme deviation)
└─ Real rates spiking = YELLOW (pressure on gold)

SECTION 4: Relative Value
├─ Au/Ag > 75 = RED (stress signal)
├─ Pt/Au < 0.5 = RED (recession fears)
└─ Pd/Au < 0.3 = RED (EV disruption)

SECTION 5: Physical/Paper
├─ PCI < 50 = RED (acute stress)
├─ OI/Registered > 1.5 = RED (leverage extreme)
├─ Backwardation > 500 bps = RED (scarcity signal)
└─ LBMA premiums > 2σ = YELLOW (dislocation)

SECTION 6: Supply
├─ Production -10% YoY = YELLOW (tightening)
├─ AISC margin < 40% = RED (profitability squeeze)
└─ Recycling collapsing = YELLOW (supply cut)
```

---

## Integration Checklist

### Pre-Launch
- [ ] Database tables created & indexed
- [ ] API endpoints tested (curl or Postman)
- [ ] Frontend component loads without errors
- [ ] Historical data backfilled (min 1 year)
- [ ] Scheduler jobs configured
- [ ] Error handling tested
- [ ] Documentation reviewed by team

### Post-Launch (Day 1)
- [ ] Monitor error logs
- [ ] Verify scheduled jobs ran on time
- [ ] Check data quality (no NaNs, reasonable ranges)
- [ ] Test user workflows (click through tabs, check responsive)
- [ ] Validate regime classification makes sense

### Week 1
- [ ] Gather user feedback
- [ ] Identify data refresh issues
- [ ] Plan Phase 2 enhancements
- [ ] Document any learnings

---

## File Manifest

```
Deliverables/
├─ PRECIOUS_METALS_SUMMARY.md (this file)
│  └─ Quick visual reference & summary
│
├─ PRECIOUS_METALS_PAGE_SPEC.md (10,000+ words)
│  └─ Complete system specification, all sections detailed
│
├─ PRECIOUS_METALS_IMPLEMENTATION_GUIDE.md (5,000+ words)
│  └─ Step-by-step implementation with checklists
│
├─ frontend/src/pages/PreciousMetalsDiagnostic.tsx (700+ lines)
│  └─ React component with full UI
│
├─ backend/app/models/precious_metals.py (280+ lines)
│  └─ SQLAlchemy models & database schema
│
├─ backend/app/api/precious_metals.py (420+ lines)
│  └─ FastAPI endpoints & indicator calculations
│
└─ backend/app/services/ingestion/precious_metals_ingester.py (600+ lines)
   └─ Data ingestion orchestration (daily/weekly/monthly)
```

---

**Ready to implement. Start with backend database setup. Estimated integration time: 2–3 days. 🚀**

