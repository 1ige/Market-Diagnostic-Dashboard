# Precious Metals Diagnostic Page — Technical Specification

## Executive Summary

This page answers **why precious metals behave as they do**, not what they'll do next. It synthesizes macro-structural indicators to classify the metals complex into monetary regimes, industrial demand states, and physical/paper dislocation signals. Complements the core Market Stability Diagnostic by providing a dedicated view of metal-specific stress signals and structural flows.

---

## 1. Page Architecture & Layout

### High-Level Structure

```
PRECIOUS METALS DIAGNOSTIC
├─ Regime Classification Panel (PINNED TOP)
│  └─ Status cards: Gold Bias | Silver Bias | PGM Bias | Paper/Physical Risk | Overall Regime
├─ 4-Column Dashboard Grid
│  ├─ Section 1: Monetary & Central Bank Context
│  ├─ Section 2: Price vs Monetary Anchors
│  ├─ Section 3: Relative Value Inside Metals Complex
│  └─ Section 4: Physical vs Paper Market Stress
├─ 2-Column Analysis Row
│  ├─ Section 5: Supply-Side Constraints
│  └─ Section 6: Demand Decomposition
├─ Single-Column Deep Dive (Collapsible Tabs)
│  ├─ Section 7: Capitalization & Monetary Weight
│  ├─ Section 8: Volatility, Correlation & Tail Risk
│  └─ Section 9: COT Positioning (Secondary)
└─ Regime Deep Dive (Modal/Accordion)
   └─ Section 10: Regime Detection Logic & Historical Classification
```

### Responsive Design
- **Desktop**: Full 4-column grids for maximum signal density
- **Tablet**: 2-column layouts with collapsible deep dives
- **Mobile**: Single column with expandable sections

### Data Freshness Indicators
- **Real-Time**: Spot prices (daily updates)
- **Daily**: Futures, ratios, valuations (end of day)
- **Weekly**: ETF flows, COT positioning (Friday close)
- **Monthly**: Central bank holdings, supply/demand (quarterly lags)
- Last-updated timestamps on each section header

---

## 2. Core Data Requirements & Sources

### 2.1 Precious Metals Price Data (Daily)

| Metal | Primary Source | Secondary | Symbol |
|-------|---|---|---|
| **Gold** | FRED (GOLDAMZNND) | Yahoo (GC=F) | GLD (ETF) |
| **Silver** | FRED (SILVAMZNND) | Yahoo (SI=F) | SLV (ETF) |
| **Platinum** | Yahoo (PL=F) | Kitco API | PPLT (ETF) |
| **Palladium** | Yahoo (PA=F) | Kitco API | PALL (ETF) |

**Processing:**
- Normalize to USD per troy oz
- Calculate daily % change
- Compute 20/50/200-day EMAs
- Z-score against 1-year rolling mean/std

### 2.2 Monetary Anchor Data (Daily/Real-Time)

| Indicator | Source | Symbol | Cadence |
|-----------|--------|--------|---------|
| **DXY (USD Index)** | Yahoo (DXY=F) | DXY | Real-time |
| **10Y TIPS Yield** | FRED (T10YIFR) | T10YIFR | Daily |
| **10Y Nominal Yield** | FRED (DGS10) | DGS10 | Daily |
| **2Y Yield** | FRED (DGS2) | DGS2 | Daily |
| **Real 10Y Rate (derived)** | T10YIFR (5Y forward implied) | — | Daily |
| **Fed Funds Rate** | FRED (FEDFUNDS) | FEDFUNDS | Daily |
| **M2 Supply** | FRED (M2SL) | M2SL | Weekly |

**Processing:**
- Real rates = Nominal 10Y − Expected inflation (5Y breakeven)
- Create DXY/Gold, DXY/Silver ratios
- Z-score ratios against 2-year window
- Calculate rate-of-change of real rates (delta, delta-delta)

### 2.3 Central Bank & Monetary Structure (Monthly/Quarterly)

| Indicator | Source | Cadence | Notes |
|-----------|--------|---------|-------|
| **Global Central Bank Gold Holdings** | World Gold Council | Quarterly | By country, EM vs DM split |
| **CB Net Purchases** | WGC, IMF | Monthly | YoY % change, trend |
| **Foreign Exchange Reserves Composition** | IMF COFER | Quarterly | % allocated to gold |
| **Fed Balance Sheet (MBS + Treasuries)** | FRED (WALCL) | Weekly | Proxy for liquidity injection |
| **RRP (Reverse Repo)** | FRED (RRPONTSV) | Daily | Proxy for funding stress |

**Processing:**
- CB gold as % of total reserves (by country/region)
- Calculate net purchase momentum (3m, 12m)
- EM CB accumulation trend (China, Russia, India, Gulf states)
- Derive "Structural Monetary Bid" (composite of net purchases + % allocation increase)

### 2.4 Relative Value Ratios (Daily)

| Ratio | Calculation | Significance | Normal Range |
|-------|-------------|--------------|--------------|
| **Gold/Silver** | GC/SI (futures) or GLD/SLV (ETF) | Monetary vs industrial mix | 45–90 |
| **Platinum/Gold** | PL/GC | Growth optimism vs recession | 0.5–1.0 |
| **Palladium/Gold** | PA/GC | Auto industrial demand | 0.3–0.8 |
| **Gold/DXY** | GC / (DXY inverse) | Currency hedging demand | Ranges |
| **Silver/Real Rates** | SI / (inverse 10Y TIPS) | Inflation hedge sensitivity | Ranges |

**Processing:**
- Z-score each ratio against 2-year rolling window
- Flag regime breaks (> ±2 σ)
- Highlight mean-reversion vs structural breaks
- Calculate 20-day momentum of each ratio

### 2.5 Physical vs Paper Market Stress (Weekly)

| Indicator | Source | Cadence | Notes |
|-----------|--------|---------|-------|
| **COMEX Gold Registered Inventory** | COMEX/CME | Daily | Eligible + Registered |
| **COMEX Silver Registered Inventory** | COMEX/CME | Daily | Same |
| **Futures Open Interest (Gold, Silver)** | COMEX/CME | Daily | OI vs Registered ratio |
| **Backwardation/Contango (Front Curve)** | Yahoo / COMEX | Daily | Near-month vs 6-month |
| **GLD ETF Holdings** | Yahoo (GLD) | Daily | Holdings (grams) + daily flow |
| **SLV ETF Holdings** | Yahoo (SLV) | Daily | Holdings (oz) + daily flow |
| **PPLT, PALL ETF Holdings** | Yahoo | Daily | Same |
| **LBMA Premiums (London Bullion)** | LBMA | Daily | Bid/ask spreads + convenience yields |

**Processing:**
- **Paper Credibility Score**: OI / Registered ratio (high OI relative to physical = potential stress)
- **Physical Tightness Risk**: Registered / Daily volume ratio; backwardation magnitude
- **ETF Flow Divergence**: GLD inflow vs spot price divergence (stress signal)
- **Premium Compression**: LBMA premiums declining = stress, widening = normal

### 2.6 Supply Data (Monthly/Quarterly)

| Indicator | Source | Cadence | Notes |
|-----------|--------|---------|-------|
| **Mine Production (Gold, Silver, Pt, Pd)** | USGS, S&P Global | Monthly | YoY comparison |
| **All-In Sustaining Costs (AISC)** | Company reports, WGC | Quarterly | Cash cost curve proxy |
| **Recycling Supply** | USGS, Refinery data | Quarterly | % of total supply |
| **Fabrication Demand** | USGS, WGC, Silver Institute | Quarterly | Industrial use |

**Processing:**
- YoY % change in production
- AISC trend (cost inflation vs prices)
- Recycling lag effect (typically 6–12 months)
- Calculate production elasticity (supply response to price changes)

### 2.7 Demand Data (Monthly/Quarterly)

| Category | Source | Cadence | Metals Affected |
|----------|--------|---------|-----------------|
| **Investment Demand** | WGC, Silver Institute | Quarterly | Au, Ag primarily |
| **ETF Flows** | Bloomberg, Refinitiv | Daily | Subset of investment |
| **Jewelry Demand** | WGC, Metals Focus | Quarterly | Au (Asia), limited Ag |
| **Industrial Demand** | USGS, Company reports | Quarterly | Ag, Pt, Pd (auto, solar) |
| **Dental/Medical** | Refinery reports | Annual | Au, Ag, Pt |

**Processing:**
- Disaggregate total demand by category
- Identify which demand type is marginal (price-setting)
- Calculate growth rates per category
- Cross-reference with industrial production indices

### 2.8 Market Capitalization Data (Derived)

| Measure | Calculation | Comparison Set |
|---------|-------------|-----------------|
| **Above-Ground Gold Stock** | Est. 200,000 tonnes × current price | Global M2, Sovereign Debt, Equity Cap |
| **Above-Ground Silver Stock** | Est. 2 million tonnes × current price | — |
| **Platinum/Palladium Stocks** | Smaller absolute values | Industrial commodity markets |

**Processing:**
- Recalculate market cap daily as prices move
- Compare to global M2, US Treasury debt, global equity market cap
- Ratio analysis: Au market cap / M2 = implicit "monetary weight"
- Scenario repricing (what if Au $3000/oz, $5000/oz, etc.)

### 2.9 Volatility & Correlation (Rolling 30/60/252-day)

| Metric | Calculation | Notes |
|--------|-------------|-------|
| **Metal Volatility** | Std dev of daily returns | Au, Ag, Pt, Pd individually |
| **VIX vs Metal Vols** | Correlation over rolling windows | Stress-regime marker |
| **Au vs Equity (SPY)** | Rolling correlation | Negative = safe-haven; positive = risk-on |
| **Au vs Bonds (TLT)** | Rolling correlation | Risk-off signal if positive |
| **Au vs USD (DXY)** | Rolling correlation | Currency substitution |
| **Inter-metal correlations** | Au–Ag, Au–Pt, Au–Pd | Regime-dependent |

**Processing:**
- Flag correlation breakdowns (regime shifts)
- Calculate rolling betas (Au vs SPY, Au vs VIX)
- Volatility term structure (current vol vs historical average)

### 2.10 Positioning & Sentiment (Weekly)

| Indicator | Source | Cadence | Notes |
|-----------|--------|---------|-------|
| **COT (Commitment of Traders)** | CFTC | Weekly | Commercials vs Managed Money |
| **Leveraged Fund Positioning** | COT breakdown | Weekly | Indicator of extremes |
| **Retail Sentiment** | Refinitiv Sentiment, News Vol | Daily | Emotional extremes |

**Processing:**
- Commercial positioning as % of total open interest
- Managed money positioning (long/short extremes)
- Highlight when positioning is 1-sigma extreme
- Use as **context only**, not primary signal

---

## 3. Derived Indicators & Regime Classification

### 3.1 Primary Computed Indicators

#### **Structural Monetary Bid (SMB)**
```
SMB = 0.5 × (CB_Net_Purchase_Momentum) 
    + 0.3 × (CB_Gold_%_Reserves_Change)
    + 0.2 × (EM_CB_Accumulation_Trend)

Range: -100 to +100
> 0 = Structural demand from monetary authorities
< 0 = Structural disinterest or sales pressure
```

**Cadence**: Monthly (quarterly CB data lags 6 weeks)
**Interpretation**: Leading indicator of long-term demand

---

#### **Monetary Hedge Strength (MHS)**
```
MHS_Au = Z-score(Au/DXY) 
       + Z-score(-Real_10Y_Rate) 
       + 0.5 × Z-score(M2_Growth_YoY)

Range: -3 to +3 (normalized)
Standardized to -100 to +100
> 0 = Au acting as monetary hedge
< 0 = Au acting as commodity/financial asset
```

**Cadence**: Daily
**Interpretation**: Is gold priced as currency protection or economic asset?

---

#### **Paper Credibility Index (PCI)**
```
PCI = 100 - (OI_to_Registered_Ratio / Historical_90th_Percentile) × 100

Adjusted for:
- Backwardation severity
- Bid/ask spread compression
- Registered inventory trend

Range: 0–100
> 75 = Healthy market structure
50–75 = Rising stress
< 50 = Acute dislocation risk
```

**Cadence**: Daily
**Interpretation**: Can futures market settle into physical without stress?

---

#### **Industrial Demand Proxy (IDP)**
```
IDP = 0.4 × Z-score(Silver_Price_Momentum)
    + 0.3 × Z-score(Platinum_vs_Gold_Ratio)
    + 0.2 × Z-score(Palladium_vs_Gold_Ratio)
    + 0.1 × Z-score(Electronics_Production_Index)

Range: -3 to +3 (normalized to -100 to +100)
> 0 = Industrial demand strengthening
< 0 = Industrial cycle weakening
```

**Cadence**: Daily (with monthly fundamentals)
**Interpretation**: Are manufacturers pulling forward on metals?

---

#### **Supply Inelasticity Score (SIS)**
```
SIS = 0.5 × (AISC_Trend / Au_Price_Change)
    + 0.3 × (Recycling_Lag_Effect)
    + 0.2 × (Mine_Production_Decline_YoY)

High SIS = Supply cannot respond to price, bottleneck risk
Low SIS = Supply is responsive, no constraint
```

**Cadence**: Monthly (quarterly updates with AISC)
**Interpretation**: How locked-in is supply? Price risks?

---

### 3.2 Regime Classification Framework

**Five Core Regimes:**

| Regime | Gold Signal | Silver Signal | Pt/Pd Signal | Key Drivers | Duration |
|--------|------------|---------------|--------------|------------|----------|
| **Monetary Stress** | Au rallies on rates decline + CB demand | Ag lags (industrial weak) | Pt rallies | Central bank panic, real rates collapse, M2 acceleration | 3–18m |
| **Inflation Hedge** | Au stable or up with CPI | Ag up (CPI + industrial) | Pt down (recession fear) | Realized inflation, M2 past peak, breakeven rates up | 6–24m |
| **Growth Reflation** | Au flat to down (real rates up) | Ag rallies (industrial demand) | Pd rallies (autos) | Nominal rates rise, real rates positive, EPS growth | 12–36m |
| **Liquidity Crisis** | Au rallies on risk-off | Ag crashes (forced selling) | Pt/Pd crash (industrial) | Stress events, margin calls, cross-currency stress | 1–3m |
| **Industrial Commodity** | Au suppressed (real rates matter) | Ag leads (supply/demand fundamentals) | Pd/Pt lead (cycle specific) | Normal growth, financial engineering, supply bottlenecks | 24m+ |

**Regime Signals (Leading → Lagging):**

1. **Real rates** (10Y TIPS, inverted)
2. **DXY moves** (if strong → Au pressure)
3. **CB purchases** (momentum, quarterly)
4. **Gold/Silver ratio** (rising → monetary stress)
5. **Platinum/Gold ratio** (falling → recession)
6. **ETF flows** (early indicator of trend reversal)
7. **Spot price move** (confirmation)

---

## 4. Page Sections — Detailed Specifications

### **SECTION 1: Regime Classification Panel (Pinned Top)**

**Purpose**: Immediate visual synthesis; tells analyst the story at a glance.

**Layout**: 5 horizontal status cards (side-scroll on mobile)

```
┌─────────────────────────────────────────────────────────┐
│ PRECIOUS METALS REGIME DIAGNOSTIC                       │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────┐ ┌──────┐
│ │ GOLD BIAS   │ │ SILVER BIAS │ │ PGM BIAS    │ │ P/P  │ │REGIME│
│ │  Monetary   │ │  Ind + Mon  │ │  Growth     │ │Risk: │ │ Mone │
│ │  Hedge      │ │  Mixed      │ │  Weighted   │ │ LOW  │ │ tary │
│ │   GREEN     │ │   YELLOW    │ │  RED        │ │      │ │Stress│
│ └─────────────┘ └─────────────┘ └─────────────┘ └──────┘ └──────┘
│                                                                    │
│ Last Updated: 2026-01-08 16:45 UTC                               │
│ Data Freshness: Spot prices real-time | CB data as of 2025-Q4   │
└─────────────────────────────────────────────────────────────────┘
```

**Card Contents:**

- **Gold Bias**: MONETARY HEDGE | NEUTRAL | FINANCIAL ASSET
- **Silver Bias**: INDUSTRIAL + MONETARY | INDUSTRIAL | MONETARY
- **PGM Bias**: GROWTH | NEUTRAL | RECESSION (based on Pt/Pd breadth)
- **Paper vs Physical Risk**: LOW | MODERATE | HIGH (PCI score)
- **Overall Regime**: Enum of 5 regimes above

**Data Refresh**: Real-time spot + daily ratios; regime classification runs daily at market close

**Mobile Optimization**: Stack vertically with carousel navigation or tabbed view

---

### **SECTION 2: Monetary & Central Bank Context (2-Column Card)**

**Purpose**: Answer "Is monetary policy driving metals? What's the structural demand signal?"

**Left Column: CB Holdings & Accumulation**

```
Component A: Global CB Gold as % of Reserves
  - Stacked area chart (1990–present)
  - Breakdown: Advanced Economies vs Emerging Markets
  - Current allocation %: 10–12%
  - Trend: Rising past 10-year average

Component B: Net CB Purchases (YoY)
  - Bar chart: YoY net purchases (MT or $B)
  - 5-year trend
  - Highlight 2024 vs 2023
  - Derived signal: "Accumulation Momentum" (3m, 12m)
  - Green if > 200 MT, Yellow if 100–200, Red if < 100

Component C: Regional Breakdown
  - Table: Top 10 CB accumulating (China, India, Russia, Gulf)
  - Recent quarter purchases
  - YoY % change
```

**Right Column: Derived Structural Signals**

```
Component D: Structural Monetary Bid Score
  - Large gauge/dial: -100 to +100
  - Current position + 12m trend
  - Interpretation text: "EM central banks accelerating gold hoarding...
    suggests fear of currency debasement and reserve diversification"

Component E: CB Activity Calendar
  - Timeline of recent major CB purchases
  - IMF, ECB, China, India, Russia actions
  - Quarterly lookback

Component F: Reserve Composition Shift
  - Dual axis: % of reserves in gold vs foreign currency
  - 10-year view
  - Comment: "Rising gold %, flat FX suggests reallocation to hard assets"
```

**Data Refresh**: Monthly (CB data quarterly + 6-week lag)
**Mobile**: Stack vertically, combine tables into summary cards

---

### **SECTION 3: Price vs Monetary Anchors (2-Column Card + Time Series)**

**Purpose**: "Why is gold moving right now? Is it currency, rates, or demand?"

**Layout:**

```
Left Panel: Correlation Matrix (Rolling 60-day)
┌──────────────────────────────────┐
│ GOLD CORRELATION MATRIX          │
├──────────────────────────────────┤
│        Au    Ag    Pt    Pd      │
│ SPY   -0.15 -0.22  0.35  0.48   │
│ TLT   +0.42 +0.38  0.12  -0.05  │
│ DXY   -0.68 -0.64 -0.55  -0.52  │
│ VIX   +0.55 +0.48  0.22  0.18   │
│       (updated hourly)           │
└──────────────────────────────────┘

Center Panel: Metal Price vs Anchors (Dual Axis Chart)
  X-axis: Time (1-year rolling)
  Y1: Au/DXY ratio (normalized 0–100)
  Y2: Real 10Y rate (inverted, -3 to +3)
  Y3: Metal spot price (right scale)
  Visual: Where ratios diverge = regime break opportunity

Right Panel: Z-Score Status
┌──────────────────────────────────┐
│ CURRENT Z-SCORES (vs 2Y window)  │
├──────────────────────────────────┤
│ Au/DXY ratio:    +1.8 σ HIGH     │
│ Ag/DXY ratio:    +1.2 σ NORMAL   │
│ Pt/Au ratio:     -0.3 σ NEUTRAL  │
│ Pd/Au ratio:     -1.5 σ LOW      │
│ Gold vs Real Rt: +2.2 σ STRESS   │
│                                  │
│ Interpretation: Gold priced high │
│ relative to USD/rates. Suggests  │
│ monetary premium embedded.       │
└──────────────────────────────────┘

Bottom: Time Series Chart
  - 3 overlays selectable: Gold, Silver, Platinum, Palladium
  - Dual Y-axis: Price (left) vs DXY (right, inverted)
  - Highlight divergence events
  - Annotation: "Au fell -2% while DXY weakened—industrial demand weakness signal"
```

**Key Interpretations Box:**

```
PRICE DYNAMICS SUMMARY
├─ If Au/DXY ratio rising + Real rates falling:
│  → Monetary hedge demand strengthening
├─ If Au flat but DXY strong:
│  → Au losing currency hedge appeal
├─ If Ag/Au ratio rising + Au flat:
│  → Industrial demand recovering
└─ If Au rallies despite DXY strength:
   → Extreme monetary distress signal
```

**Data Refresh**: Real-time (daily end-of-day consolidation)
**Mobile**: Swap matrix for expanded time series; make charts tap-to-enlarge

---

### **SECTION 4: Relative Value Inside Metals Complex (3-Panel Card)**

**Purpose**: "Is the metals complex pricing growth, stress, or just commodity cycles?"

**Panel A: Gold/Silver Ratio**

```
Chart: Gold/Silver Ratio (5-year)
  - Current value (e.g., 65)
  - 20/50/200-day EMAs
  - Historical bands (5th, 25th, median, 75th, 95th percentile)
  - Shaded regions: 
    * Green zone: 50–60 (balanced)
    * Yellow: 60–75 (monetary stress bias)
    * Red: >75 (acute stress)

Interpretation Table:
├─ Ratio > 75: Ag underperforming Au (monetary risk-off)
├─ Ratio 50–60: Balanced au/ag allocation
├─ Ratio < 50: Ag outperforming (growth/industrial demand)
└─ Rising ratio: Shift to monetary asset (au); falling = industrial rotation
```

**Panel B: Platinum/Gold & Palladium/Gold Ratios**

```
Dual-axis chart (1-year rolling):
  - Y1: Pt/Au ratio
  - Y2: Pd/Au ratio
  - Overlay with SPY 50-day momentum (shaded background)

Interpretation:
├─ Pt/Au rising + SPY strong: Growth is backing into PGMs
├─ Pd/Au rising while Pt/Au flat: Auto demand (Pd) specific strength
├─ Both falling: Recession/cycle downturn expectations
└─ Pd > Pt (rare): Severe industrial demand shock

Z-Score Status:
  Pt/Au: ±σ indicator of recession/growth premium
  Pd/Au: Specific to auto cycle (EV demand, traditional auto mix)
```

**Panel C: Relative Strength Scorecard**

```
┌────────────────────────────────────┐
│ METALS COMPLEX LEADERSHIP          │
├────────────────────────────────────┤
│ Gold:      Leading (52w high %)    │  GREEN ✓
│ Silver:    Neutral (middle 50%)    │  YELLOW
│ Platinum:  Lagging (52w low %)     │  RED ✗
│ Palladium: Weak (52w low %)        │  RED ✗
│                                    │
│ Story: Monetary drivers dominant   │
│        Industrial cycle weak       │
└────────────────────────────────────┘
```

**Data Refresh**: Daily (end-of-day ratios)
**Mobile**: Carousel of ratio charts; summarize into one-line status

---

### **SECTION 5: Physical vs Paper Market Stress (2-Column Card)**

**Purpose**: "Is the futures/ETF market under strain? Can it deliver physical without dislocation?"

**Left Column: COMEX Inventory & Open Interest**

```
A. Stacked Area: Registered + Eligible Inventory (Gold)
   - 2-year view
   - Trend line overlay
   - Current: "Registered inventory at 3-year low"
   - Trigger: If reg inventory < 10M oz, flag as stress watch

B. Ratio Chart: Futures OI to Registered Ratio
   - 2-year rolling
   - Red zone: OI/Registered > 80th percentile historical
   - Current reading + 12m high/low
   - Text: "OI/Reg at 1.2x, above normal 0.9–1.0 range"

C. Backwardation Status
   - Front curve (near-term vs 6-month futures)
   - Current backwardation basis (if negative = contango, red)
   - 30-day average
   - Interpretation: "Shallow backwardation = normal; steep = stress"
```

**Right Column: ETF Flows & Physical Premium Stress**

```
D. GLD & SLV Holdings + Daily Flows
   - Dual chart: Holdings (left Y, tonnes/millions oz)
   - Daily flow (right Y, as % of volume)
   - 1-year view
   - Divergence signal: When flows reverse but spot prices don't

E. Paper Credibility Index (PCI Gauge)
   - Large dial: 0–100 scale
   - Current position
   - 30-day trend (arrow up/down/flat)
   - Color coding: Green > 75, Yellow 50–75, Red < 50
   - Text: "Markets can easily swap futures to physical. Low stress."

F. LBMA Premiums Table
   - Gold premium (bid-ask): Normal 0.1–0.3 $/oz
   - Silver premium: Normal 0.05–0.15 $/oz
   - Platinum premium: Context
   - Red if premiums compress > 1 std dev below normal
   - Text: "Tight premium = market stress signal"
```

**Interpretation Box:**

```
MARKET STRUCTURE HEALTH
├─ Healthy: 
│  ├─ Registered inventory stable/growing
│  ├─ OI/Reg ratio < 1.0
│  ├─ Normal backwardation
│  ├─ ETF flows tracking prices
│  └─ LBMA premiums normal
│
├─ Caution (Yellow):
│  ├─ Inventory 5–10% YoY decline
│  ├─ OI/Reg ratio 1.0–1.3
│  ├─ Backwardation steepening
│  ├─ ETF flow divergence emerging
│  └─ Premiums widening
│
└─ Stress (Red):
   ├─ Inventory > 10% YoY decline
   ├─ OI/Reg > 1.5 (extreme)
   ├─ Deep backwardation or contango
   ├─ Large ETF outflows with price support
   └─ Premiums at decade highs
```

**Data Refresh**: Daily (inventory daily, flows real-time, premiums hourly)
**Mobile**: Stack panels; prioritize PCI gauge + inventory chart

---

### **SECTION 6: Supply-Side Constraints (2-Column Card)**

**Purpose**: "Is supply the price-setter? What's the elasticity?"

**Left Column: Mine Production & AISC**

```
A. Global Mine Production Trend (5-year)
   - Separate lines: Gold, Silver, Platinum, Palladium
   - YoY % change displayed
   - Current: Au declining -2% YoY, Ag flat, Pt down -3%, Pd down -5%
   - Annotation: "Palladium supply tightening"

B. All-In Sustaining Cost (AISC) Trends
   - Stacked bar: Mining cost vs current spot price
   - Current Au AISC: ~$1,000/oz (hypothetical)
   - Spot: $2,100/oz
   - Margin: 110% above cost
   - Alert if margin compresses below 50%

C. Production Cost Inflation
   - 3-year view: Cost per oz rising/flat/declining
   - Component breakdown: Labor, energy, capital
   - Impact: If AISC rising > inflation, supply is under pressure
```

**Right Column: Recycling & Supply Elasticity**

```
D. Recycling Supply Contribution
   - Pie chart: Primary (mine) vs secondary (recycling)
   - Au: ~30% recycling, 70% mine
   - Ag: ~25% recycling, 75% mine
   - Pt: ~35% recycling (used catalytic converters)
   - Pd: ~40% recycling (catalytic converters, jewelry)
   - Trend: Recycling as % total (rising as prices rise)

E. Supply Elasticity Gauge
   - Score: -100 to +100
   - Negative = inelastic (supply can't respond to price)
   - Current: -30 (inelastic; Pd especially constrained)
   - Text: "Supply bottleneck risk. Price pressure likely if demand rises."

F. Production Restart Risk
   - Table: Top 5 mines on care/maintenance or idle
   - Restart timeline / capex required
   - Probability of restart next 12m
   - Impact if all restarted: "+5% global supply equivalent"
```

**Data Refresh**: Monthly (production), quarterly (AISC), daily (recycling lags)
**Mobile**: Simplify to production trend + elasticity gauge

---

### **SECTION 7: Demand Decomposition (2-Column Card)**

**Purpose**: "Which demand type is marginal? Growth or hoarding?"

**Left Column: Disaggregated Demand (Annual/Quarterly)**

```
A. Gold Demand Breakdown (Stacked Area, 5-year)
   - Investment demand (bars + line for trend)
   - Jewelry demand (Asia focus)
   - Industrial (dental, electronics, dentistry)
   - Central bank official sector
   - Current quarter: 
     * Investment: 400T (up 15% QoQ)
     * Jewelry: 450T (down 5% seasonal)
     * Industrial: 80T (flat)
     * CB: 200T (up 25% YoY)

B. Silver Demand Breakdown (Stacked, 5-year)
   - Investment (ETFs, bars, coins)
   - Industrial (solar ~40%, autos ~15%, electronics ~20%, other)
   - Jewelry: ~7%
   - Photography (fading): ~1%
   - Current: Industrial at 60% of total (growing)

C. Platinum & Palladium (By Use)
   - Platinum: Auto catalysts 35%, jewelry 25%, industrial 40%
   - Palladium: Auto catalysts 85%, jewelry 5%, industrial 10%
   - Note: EV growth = structural headwind for PGM demand
```

**Right Column: Demand Cycle Indicators**

```
D. Industrial Demand Proxy (IDP Score)
   - Large gauge: -100 to +100
   - Current: +15 (slightly positive)
   - 12m trend overlay
   - Interpretation: "Industrial demand stabilizing, not accelerating"

E. Jewelry Demand Seasonality
   - Heatmap: Month-by-month demand (seasonal patterns)
   - Current month vs historical average
   - Regional: India, China, Western (holiday cycles differ)
   - Note: "Diwali/Chinese New Year demand cycles embedded"

F. Investment Demand Momentum
   - Chart: Net ETF flows (GLD, SLV, PPLT, PALL)
   - 6-month rolling
   - Current: GLD inflow +$2B; SLV flat; PPLT outflow -$500M
   - Interpretation: "Flight to monetary gold; PGM liquidation"
```

**Marginal Demand ID Box:**

```
WHAT'S SETTING THE PRICE?
├─ Gold:    Monetary demand (investment)
│          └─ Jewelry/industrial = price-taker, not setter
├─ Silver:  Mix of investment + industrial
│          └─ Tight: Industrial demand can push prices
├─ Platinum: Industrial (catalysts) — key flex point
│          └─ EV cycle = structural headwind
└─ Palladium: Extremely concentrated on auto (catalytic)
            └─ EV adoption = death of demand???
```

**Data Refresh**: Quarterly (WGC, Silver Institute data lags); daily (ETF flows)
**Mobile**: Collapse stacks into single bar per metal; highlight current quarterly data

---

### **SECTION 8: Market Cap & Monetary Weight (Collapsible Tab)**

**Purpose**: "How big is the metals complex? Could it backstop monetary system?"

**Content:**

```
A. Above-Ground Stock Valuation
   ┌──────────────────────────────────┐
   │ Estimated above-ground metal     │
   │ stock at current prices (2026)   │
   ├──────────────────────────────────┤
   │ Gold:      ~$15.0T (200k tonnes) │
   │ Silver:    ~$1.5T (2M tonnes)    │
   │ Platinum:  ~$0.3T (200k tonnes)  │
   │ Palladium: ~$0.15T (50k tonnes)  │
   │ ─────────────────────────────    │
   │ TOTAL:     ~$17.0T               │
   └──────────────────────────────────┘

B. Relative to Key Monetary/Financial Measures
   ┌────────────────────────────────────┐
   │ Metals / Global M2:                │
   │ $17T / $200T = 8.5% (historical:   │
   │ pre-1971: ~20%, post-1980: 2–5%)   │
   │                                    │
   │ Metals / Sovereign Debt:           │
   │ $17T / $100T = 17% (has room)      │
   │                                    │
   │ Metals / Global Equity Cap:        │
   │ $17T / $120T = 14%                 │
   │                                    │
   │ Gold / Bitcoin Market Cap:         │
   │ $15T / $2T = 7.5x (traditional     │
   │ monetary premium holds)            │
   └────────────────────────────────────┘

C. Scenario Analysis (Non-Predictive Context)
   ┌────────────────────────────────────┐
   │ "What if" repricing scenarios:     │
   │                                    │
   │ If Au → $3,000/oz:                 │
   │  Metals stock → $20.5T (+20%)      │
   │  Au/M2 → 10.2% (modest increase)   │
   │                                    │
   │ If Au → $5,000/oz:                 │
   │  Metals stock → $24T (+40%)        │
   │  Au/M2 → 12% (implies deflation    │
   │           or M2 contraction)       │
   │                                    │
   │ If Au → $10,000/oz:                │
   │  Metals stock → $32T               │
   │  Au/M2 → 16% (structural reset,    │
   │           approaching gold std)    │
   │                                    │
   │ Note: Scenarios for context only.  │
   │ No predictive value embedded.      │
   └────────────────────────────────────┘

D. Historical Comparison
   - Chart: Au price vs Au market cap / Global M2 ratio (1980–present)
   - Show: Gold std era, Bretton Woods collapse, floating era, post-2008
   - Annotation: "Current 8.5% ratio = below historical avg, room for normalization"
```

**Data Refresh**: Daily (as prices update)
**Mobile**: Collapse scenario box; show main metrics in card format

---

### **SECTION 9: Volatility, Correlation & Tail-Risk Role (Collapsible Tab)**

**Purpose**: "How do metals behave in different market states? Are they hedges or risks?"

**Content:**

```
A. Volatility Comparison (Rolling 30/60/252-day)
   ┌────────────────────────────────────┐
   │ 30-Day Realized Volatility:        │
   │ Gold:      8.5%                    │
   │ Silver:    14.2% (1.7x Au)         │
   │ Platinum:  16.3%                   │
   │ Palladium: 19.1%                   │
   │ SPY:       12.1%                   │
   │ VIX Index: 18.5%                   │
   │ TLT Bonds: 6.2%                    │
   ├────────────────────────────────────┤
   │ Interpretation:                    │
   │ Au = stable vs equity market       │
   │ Ag, Pt, Pd = more volatile         │
   │ Pd = commodity tail-risk proxy     │
   └────────────────────────────────────┘

B. Rolling Correlation Matrix (60-day window)
   ┌──────────────────────────────────────────┐
   │        Au    Ag    Pt    Pd   SPY  TLT  │
   │ Au    1.00  0.72  0.61  0.48 -0.15 0.42│
   │ Ag    0.72  1.00  0.68  0.52 -0.22 0.38│
   │ Pt    0.61  0.68  1.00  0.71 +0.35 0.12│
   │ Pd    0.48  0.52  0.71  1.00 +0.48 -0.05│
   │ SPY  -0.15 -0.22  0.35  0.48 1.00  -0.25│
   │ TLT   0.42  0.38  0.12 -0.05 -0.25 1.00│
   └──────────────────────────────────────────┘
   
   Interpretation:
   ├─ Au–TLT +0.42: Gold acts as bond substitute in stress
   ├─ Au–SPY -0.15: Weak negative = portfolio diversifier (not strong hedge)
   ├─ Pt–SPY +0.35: Platinum pro-cyclical (growth sensitive)
   ├─ Pd–SPY +0.48: Palladium high beta to cycle (industrial)
   └─ Ag–Au +0.72: High correlation (both monetary), not diversifying

C. Tail-Risk Behavior (VIX >25 events)
   ┌────────────────────────────────────┐
   │ When VIX spikes (stress events):   │
   │                                    │
   │ Au: Tends to rally                 │
   │ Typical intra-event move: +2 to +5% │
   │ Average return during VIX>25: +0.8% │
   │                                    │
   │ Ag: Mixed (commodity sold for cash)│
   │ Typical move: -3 to +1%            │
   │ Average: -0.2%                     │
   │                                    │
   │ Pt/Pd: Sold hard (forced deleveraging) │
   │ Typical: -5 to -10%                │
   │ Average: -3.2%                     │
   │                                    │
   │ Interpretation: Au = safe-haven   │
   │ (works in stress). Ag/PGMs = risk │
   │ (performance suffers in margin    │
   │ calls).                           │
   └────────────────────────────────────┘

D. Beta & Sensitivity Analysis
   ┌────────────────────────────────────┐
   │ Metal Beta to SPY (60-day rolling) │
   │ Au Beta: 0.08 (neutral)            │
   │ Ag Beta: 0.15 (slightly positive)  │
   │ Pt Beta: 0.35 (pro-cyclical)       │
   │ Pd Beta: 0.48 (high beta equity)   │
   │                                    │
   │ Metal Beta to VIX (60-day rolling) │
   │ Au Beta to VIX: +0.55 (safe haven) │
   │ Ag Beta to VIX: +0.48              │
   │ Pt Beta to VIX: +0.22              │
   │ Pd Beta to VIX: +0.18              │
   │                                    │
   │ Interpretation: Au has positive    │
   │ VIX beta = strengthens in stress   │
   └────────────────────────────────────┘

E. Correlation Breakdown Events (Historical)
   - Table: Recent 3–5 events where Au/Ag/Pt correlations broke down
   - Date, trigger, duration, outcome
   - Patterns: 2008 crisis, 2020 pandemic, 2022 Fed shock
   - Learn: How to ID next breakdown early
```

**Data Refresh**: Daily (rolling recalculation)
**Mobile**: Show current correlations + beta in scorecard; collapse tail-risk table

---

### **SECTION 10: COT Positioning (Optional/Secondary, Collapsed by Default)**

**Purpose**: "Context for extremes; not a primary signal. Highlight when unusual."

**Content:**

```
A. Managed Money vs Commercial Positioning (Weekly COT)
   ┌────────────────────────────────────┐
   │ Gold Futures (COMEX):              │
   │ Commercial Net:    -150k contracts │
   │ Managed Money Net: +220k contracts │
   │ Leveraged Funds:   +50k contracts  │
   │                                    │
   │ Interpretation:                    │
   │ Commercials SHORT (hedging supply) │
   │ MM LONG (speculative bet)          │
   │ Position = extreme but not unusual │
   │                                    │
   │ Silver:                            │
   │ Commercial: -40k                   │
   │ MM: +85k                           │
   │ Leverage: +15k                     │
   │ Status: Balanced, not extreme      │
   └────────────────────────────────────┘

B. Positioning Extremes Alert
   - Flag when positioning hits >90th/< 10th percentile (historical)
   - Current alerts: None
   - Previous extreme: Au MM long +250k (Jan 2024) → Preceded 8% pullback

C. Usage Note
   - COT data lags 2 days (reported Tuesday for Tuesday prior)
   - Use as **context only**, not primary trading signal
   - Extremes can persist for weeks (not rapid reversal)
   - Better for identifying potential top/bottom formation risk
   - SECONDARY indicator: Confirm with macro signals first
```

**Data Refresh**: Weekly (Tuesday after close, delayed 2 business days)
**Mobile**: Hide by default; link to "Show COT Data" button

---

## 5. Integration with Core Market Diagnostic Dashboard

### 5.1 Cross-Dashboard Consistency

**Shared Principles:**
- Neutral, macro-first tone
- Regime classification over price targets
- Ratios and relative measures prioritized
- Actual vs "should be" framing (not directional)
- Timely data freshness indicators

**Links to Core Dashboard:**
1. **From System Overview** → "Precious Metals Deep Dive" link (when monetary stress detected)
2. **From Bond Market Stability** → Link to "Real Rates vs Gold" in Section 3
3. **From Liquidity Proxy** → Link to "Structural Monetary Bid" in Section 2 (M2 component shared)
4. **From Analyst Confidence** → Link to "ETF Flows & Positioning" in Section 5

**Data Dependencies:**
- Real rates: Uses same 10Y TIPS calculation as bond section
- M2 growth: Reuses liquidity proxy input
- USD (DXY): Same FX reference
- VIX: Real-time correlation feeds from System Overview

### 5.2 Alert Propagation

**Precious Metals → System Dashboard (Upstream Signals):**
- Structural Monetary Bid score ties into overall liquidity assessment
- Paper Credibility Index flags would raise system-level stress alert (if < 50)
- Supply Inelasticity + inflation breakeven → potential bond market stress

**System Dashboard → Precious Metals (Downstream Context):**
- If System state = RED → expect monetary metals to rally
- If Liquidity Proxy = RED → expect Physical/Paper dislocation risk
- If Consumer Health = RED → expect industrial PGM weakness

---

## 6. Implementation Roadmap

### Phase 1: Core Sections (Weeks 1–2)
1. Regime Classification Panel (Section 1)
2. Monetary & CB Context (Section 2)
3. Price vs Monetary Anchors (Section 3)
4. Relative Value (Section 4)
5. Physical vs Paper (Section 5)

**Deliverables:**
- React page component
- Backend indicator calculations
- Database schema for metals data
- API endpoints for data delivery

### Phase 2: Extended Analytics (Weeks 3–4)
1. Supply-Side (Section 6)
2. Demand Decomposition (Section 7)
3. Collapsible Tabs: Market Cap & Correlations (Sections 8–9)

**Deliverables:**
- Quarterly data ingestion
- Historical supply/demand tables
- Correlation calculations

### Phase 3: Refinement & Monitoring (Week 5+)
1. COT positioning (Section 10, optional)
2. Alert system integration
3. Performance optimization
4. Mobile responsiveness tuning
5. Backtesting regime classifier on historical data

---

## 7. Data Integration Architecture

### Backend Changes Required

**New Database Tables:**
```
- metal_price (metal_id, date, open, high, low, close, volume)
- metal_ratio (metal1_id, metal2_id, date, ratio, z_score)
- cb_holdings (country_id, date, gold_tonnes, pct_of_reserves)
- cb_purchases (country_id, quarter, tonnes_purchased, net_purchase_yoy)
- comex_inventory (metal_id, date, registered_oz, eligible_oz, oi)
- etf_holdings (etf_id, date, holdings, daily_flow)
- metal_fundamental (metal_id, quarter, production, aisc, recycling_pct)
- demand_supply (metal_id, quarter, investment, industrial, jewelry, jewelry_regional)
- correlation_matrix (date, pair, correlation_30d, correlation_60d, correlation_252d)
```

**New API Endpoints:**
```
GET /precious-metals/regime            # Return regime classification
GET /precious-metals/cb-context        # CB holdings + purchases
GET /precious-metals/anchors           # Real rates, DXY, ratios
GET /precious-metals/relative-value    # Ratio metrics
GET /precious-metals/physical-paper    # COMEX, ETF, spreads
GET /precious-metals/supply-demand     # Production, AISC, demand
GET /precious-metals/correlations      # Rolling correlation matrix
GET /precious-metals/history?days=365&metal=AU  # Price history
```

**New Scheduler Jobs:**
```
- Daily (16:00 UTC): Spot prices from FRED/Yahoo
- Daily (17:00 UTC): Futures data, COMEX inventory
- Daily (18:00 UTC): ETF holdings, flows
- Weekly (Friday 18:00): COT positioning, LBMA premiums
- Monthly (1st): CB holdings update (after IMF publication lag)
- Quarterly (15 days after quarter end): Demand/supply fundamentals
```

**New Data Sources:**
- FRED (GOLDAMZNND, SILVAMZNND)
- Yahoo Finance (GC=F, SI=F, PL=F, PA=F, GLD, SLV, PPLT, PALL)
- World Gold Council API (quarterly CB data)
- COMEX/CME (inventory, OI, backwardation)
- LBMA (premiums)
- US Geological Survey (quarterly supply/demand)
- Metal Focus, Silver Institute (quarterly)

---

## 8. Key Risk Factors & Limitations

### Data Quality Issues
1. **CB data lags**: Central bank holdings published quarterly, with 6-week lag
   - **Mitigation**: Use IMF COFER preliminary releases; update retroactively
2. **COMEX inventory delays**: Published daily but can have week-long lags
   - **Mitigation**: Indicate data freshness; use prior-week data if unavailable
3. **Recycling estimates uncertain**: Industry estimates, not precise
   - **Mitigation**: Qualitative labeling ("~30% recycling"); flag uncertainty

### Interpretation Challenges
1. **Regime classification can lag**: Structural shifts take weeks to confirm
   - **Mitigation**: Show regime probabilities, not binary states
2. **Correlations unstable in crises**: Relationships break during extreme stress
   - **Mitigation**: Highlight "correlation breakdown" alerts; prefer z-scores
3. **Supply constraints hard to model**: Mine closures are project-specific
   - **Mitigation**: Flag top risks; don't attempt precise elasticity forecasts

### Coverage Gaps
1. **China metal demand opaque**: Large consumer, limited transparency
   - **Mitigation**: Use proxy indicators (Chinese manufacturing PMI, EV sales)
2. **Physical OTC markets hidden**: Much trading off-exchange
   - **Mitigation**: Use LBMA premiums as stress proxy
3. **Palladium cycle extreme**: Highly concentrated on catalytic converters
   - **Mitigation**: Highlight PGM positioning as "high-risk" asset class

### Caveat Statements (Per Section)
- **Section 1 (Regime)**: "Regime classifications are descriptive, not predictive. Confirmation lags by 1–3 weeks."
- **Section 2 (CB Context)**: "CB data published quarterly, with 6-week lag. Most recent data: [date]."
- **Section 3 (Anchors)**: "Z-scores calculated vs 2-year rolling window. Extreme readings (>2σ) signal regime breaks, not reversal timing."
- **Section 5 (Physical/Paper)**: "Paper/Physical stress signals reflect market structure health. Not equivalent to price direction."
- **Section 8 (Scenarios)**: "Repricing scenarios for context only. No embedded predictive model or targets."
- **Section 10 (COT)**: "COT positioning lags by 2 days. Use as confirmation context, not primary signal."

---

## 9. Success Metrics

### Dashboard Performance
- Page load: < 2s (frontend), < 500ms (API)
- Data freshness: Real-time spot prices, daily ratios, monthly CB data
- Mobile usability: 90%+ viewport coverage, no horizontal scroll on < 768px

### Analytical Effectiveness
- Regime classification accuracy: Back-test on 5 years of historical data
  - Target: Correct regime identification ≥70% of time (allowing 1-week lag)
- Alert signal quality: Track false positive rate (alert fired but no regime change)
  - Target: < 20% false positive rate
- User engagement: Metrics on most-viewed sections, average time on page

### Data Quality
- COMEX inventory: Update within 24h of publication
- ETF flows: Real-time (daily reconciliation)
- CB holdings: Within 2 weeks of IMF publication
- Price data: No gaps > 1 day except holidays

---

## 10. References & Further Research

### Data Sources (Full URLs in Implementation)
- FRED: https://fred.stlouisfed.org/
- World Gold Council: https://www.gold.org/
- USGS Mineral Commodity Summaries: https://www.usgs.gov/
- COMEX/CME: https://www.cmegroup.com/
- LBMA: https://www.lbma.org.uk/
- Kitco: https://www.kitco.com/
- Silver Institute: https://www.silverinstitute.org/

### Academic & Industry References
- BIS Quarterly Review (inflation dynamics, metals link to monetary policy)
- IMF COFER (central bank reserve composition)
- S&P Global Platts (metals supply/demand reports)
- Metals Focus (detailed supply/demand studies)
- CFTC COT Handbook (positioning interpretation)

### Historical Regime Examples
- **2008 Crisis** (Monetary Stress regime): Au +5.5%, Ag -26%, Pt -70%
  - Driver: Flight to safety, forced liquidation
- **2010–2011** (Inflation Hedge): Au +25%, Ag +48%, Pd +25%
  - Driver: Post-crisis QE, inflation expectations
- **2020–2021** (Growth Reflation): Au +0%, Ag +47%, Pd +50%
  - Driver: Strong EV cycle, auto demand, stimulus peak
- **2022** (Liquidity Crisis → Inflation Shock): Au -4%, Ag -26%, Pt +0%
  - Driver: Rate hikes, then stagflation fear

---

## Appendix: Formulas & Calculations

### SMB (Structural Monetary Bid)

```
EM_Accumulation_Momentum = (CB_Purchases_Q1 + Q2 + Q3) / (CB_Purchases_Q1_Prior_Year)
CB_Gold_Reserve_Delta = (CB_Gold_%_Current - CB_Gold_%_Prior_Year) / CB_Gold_%_Prior_Year
Net_Purchase_Trend = (3m_avg_purchases - 12m_avg_purchases) / 12m_avg_purchases

SMB_Raw = 0.5 × (Net_Purchase_Trend × 100)
        + 0.3 × (CB_Gold_Reserve_Delta × 100)
        + 0.2 × (EM_Accumulation_Momentum × 100)

SMB_Score = Normalize(SMB_Raw, -100, +100)
```

### PCI (Paper Credibility Index)

```
OI_to_Registered_Percentile = Percentile(OI / Registered, 90th percentile historical)
Backwardation_Severity = Front_Future_Price - Front_Plus_6m_Price (in basis points)
LBMA_Premium_Z = (Current_Premium - 5Y_Mean_Premium) / 5Y_Std_Premium

Stress_Factor = 0.5 × (OI/Reg_Percentile / 100)
              + 0.3 × Min(Backwardation / 500, 1)  # Cap at 500 bps
              + 0.2 × Max(LBMA_Premium_Z, 0)       # Only penalize widening

PCI = 100 - (Stress_Factor × 100)
```

### Monetary Hedge Strength (MHS)

```
Au_DXY_Z = (Au/DXY - 1Y_Mean(Au/DXY)) / 1Y_Std(Au/DXY)
Real_Rate_Signal = -1 × ((Real_10Y_Rate - Historical_Mean) / Historical_Std)
M2_Growth_Signal = ((M2_YoY% - 2%) / 3) # Detrend for normal 2% target

MHS_Raw = (Au_DXY_Z + Real_Rate_Signal + 0.5 × M2_Growth_Signal) / 2.5

MHS_Score = 50 + (MHS_Raw × 50)  # Normalize to 0–100
```

---

**End of Specification**

This specification is production-ready for frontend/backend development. It balances signal density with usability, maintains consistency with the existing dashboard architecture, and provides clear guidance on data sourcing, calculations, and limitations.

