# Precious Metals Projections Feature

## Overview
Added comprehensive technical analysis and projection system for precious metals (AU, AG, PT, PD) with winners/losers classification, similar to existing stock and sector projections.

## Backend Implementation

### 1. Metal Projections Service (`backend/app/services/metal_projections.py`)
- **Technical Indicators Computed:**
  - SMA 20/50/200 (Simple Moving Averages)
  - RSI (Relative Strength Index, 14-period)
  - Momentum: 5-day, 20-day, 60-day percentage changes
  - Volatility: 30-day annualized standard deviation
  
- **Scoring System:**
  - **Trend Score (60% weight):**
    - Price above SMA 20: +25 points
    - Price above SMA 50: +25 points
    - Price above SMA 200: +25 points
    - SMA 20 > SMA 50: +25 points
  - **Momentum Score (40% weight):**
    - RSI 40-60 (neutral): 100 points
    - RSI 30-40 or 60-70: 75 points
    - RSI 20-30 or 70-80: 50 points
    - RSI <20 or >80: 25 points
  
- **Classification Levels:**
  - Strong: Score ≥ 75
  - Bullish: Score ≥ 60
  - Neutral: Score ≥ 40
  - Bearish: Score ≥ 25
  - Weak: Score < 25

- **Support/Resistance Detection:**
  - Identifies local minima (support) and maxima (resistance)
  - Uses 5-period rolling window
  - Returns top 3 levels of each type
  - Filters support < current price, resistance > current price

- **Price Targets:**
  - Take Profit: +10% from current price
  - Stop Loss: -5% from current price

### 2. API Endpoint (`backend/app/api/metal_projections.py`)
- **Route:** `GET /precious-metals/projections/latest`
- **Returns:**
  - Array of projections for all 4 metals
  - Sorted by score (highest to lowest)
  - Relative classification (Winner/Neutral/Loser)
  - Rank (1-4)
  - Timestamp and model version

### 3. Historical Data Backfill
- **New Method:** `backfill_historical_prices(days=365)` in `precious_metals_ingester.py`
- **Process:**
  - Fetches 365 days of historical data from yfinance
  - Inserts into `metal_prices` table
  - Checks for duplicates before inserting
  - Commits per metal to avoid rollback issues
  
- **Backfill Script:** `backend/backfill_metals.py`
  - Standalone script for manual execution
  - Can specify number of days as argument
  - Successfully backfilled 1,199 price records on production

## Frontend Implementation

### 1. ProjectionsPanel Component
- **Location:** `frontend/src/pages/PreciousMetalsDiagnostic.tsx`
- **Features:**
  - Winners/Losers summary cards (4-column grid)
  - Detailed technical analysis cards (2-column responsive grid)
  - Support/resistance levels display
  - Momentum breakdown (5d, 20d, 60d)
  - Score breakdown (trend + momentum)
  - Price targets (take profit, stop loss)
  - Color-coded classification badges

### 2. Data Integration
- **New Hook:** `useApi<{ projections: MetalProjection[] }>("/precious-metals/projections/latest")`
- **Interface:** `MetalProjection` with full typing for all fields
- **Positioning:** Projections panel renders above price history chart

### 3. UI Design
- **Winner Badge:** Emerald background, emerald border, emerald text
- **Loser Badge:** Red background, red border, red text
- **Neutral Badge:** Blue background, blue border, blue text
- **Classification Colors:**
  - Strong: Emerald 400
  - Bullish: Green 400
  - Neutral: Yellow 400
  - Bearish: Orange 400
  - Weak: Red 400

## Current Results (Production Data)

### Gold (AU) - Rank #1 - Winner
- Current: $4,426.70
- Score: 100/100 (Strong)
- RSI: 55.4
- Momentum: +2.3% (5d), +5.2% (20d), +7.7% (60d)
- Support: $3,947.70, $4,056.50
- Resistance: $4,529.10

### Silver (AG) - Rank #2 - Neutral
- Current: $74.46
- Score: 100/100 (Strong)
- RSI: 58.0
- Momentum: +6.2% (5d), +23.8% (20d), +48.5% (60d)
- Support: $40.88, $46.56, $49.87

### Platinum (PT) - Rank #3 - Neutral
- Current: $2,183.10
- Score: 100/100 (Strong)
- RSI: 56.4
- Momentum: +7.3% (5d), +28.8% (20d), +30.8% (60d)
- Support: $1,600.70, $1,641.80, $2,034.50
- Resistance: $2,467.70

### Palladium (PD) - Rank #4 - Loser
- Current: $1,756.00
- Score: 100/100 (Strong)
- RSI: 52.5
- Momentum: +7.8% (5d), +16.2% (20d), +16.3% (60d)
- Support: $1,388.10, $1,402.70, $1,629.20
- Resistance: $1,984.70

## Notes
- All metals currently showing "Strong" classification (100/100 scores)
- All prices above SMA 20, 50, and 200 (maximum trend score)
- RSI values in neutral range (50-60) indicate healthy momentum
- Winner/Loser is **relative** classification (top vs bottom performer)
- Historical data now available for full year (365 days)
- Price history chart will now display complete trend lines

## Future Enhancements (Not Yet Implemented)
1. **ETF Options Walls:**
   - Requires options data subscription
   - Would fetch put/call walls for GLD, SLV, PPLT, PALL
   - Display as support/resistance overlays on chart
   
2. **Multi-Horizon Projections:**
   - Currently single horizon (implicit short-term)
   - Could add 3m, 6m, 12m projections like stock page
   
3. **Historical Scoring:**
   - Track projection accuracy over time
   - Compare predicted vs actual moves
   
4. **Regime-Aware Adjustments:**
   - Weight technical signals differently per regime
   - Example: RSI matters less in monetary stress regime

## Deployment Checklist
- [x] Backend service created
- [x] API endpoint registered in main.py
- [x] Historical data backfilled (1,199 records)
- [x] Frontend component created
- [x] Data fetching integrated
- [x] UI rendering tested
- [x] Code committed to GitHub
- [x] Deployed to production (100.49.90.221)
- [x] Backend restarted
- [x] Frontend rebuilt
- [ ] Visual verification on live site

## Testing
```bash
# Test API endpoint
curl "http://100.49.90.221:8000/precious-metals/projections/latest"

# Verify historical data count
docker compose exec backend python -c "from app.core.db import get_db_session; from app.models.precious_metals import MetalPrice; db = get_db_session().__enter__(); print(f'Total prices: {db.query(MetalPrice).count()}')"
```

## Files Modified
1. `backend/app/services/metal_projections.py` - NEW
2. `backend/app/api/metal_projections.py` - NEW
3. `backend/backfill_metals.py` - NEW
4. `backend/app/services/ingestion/precious_metals_ingester.py` - MODIFIED (added backfill method)
5. `backend/app/main.py` - MODIFIED (registered new API route)
6. `frontend/src/pages/PreciousMetalsDiagnostic.tsx` - MODIFIED (added interface, projections fetch, ProjectionsPanel component)
