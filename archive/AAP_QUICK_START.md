# Alternative Asset Pressure (AAP) - Quick Implementation Guide

## Setup & Deployment

### 1. Database Migration

The AAP indicator requires new database tables. They will be auto-created on next startup via SQLAlchemy:

```bash
# Tables created automatically:
- crypto_prices
- macro_liquidity_data
- aap_components
- aap_indicator
- aap_regime_history
```

### 2. API Key Configuration

Add to `devops/env/backend.env`:

```bash
# FRED API (Federal Reserve Economic Data)
# Sign up at https://fred.stlouisfed.org/docs/api/api_key.html
FRED_API_KEY=your_fred_api_key_here
```

Update `app/core/config.py`:

```python
class Settings(BaseSettings):
    # ... existing settings ...
    FRED_API_KEY: str = "YOUR_FRED_API_KEY"
```

### 3. Install Dependencies

```bash
cd backend
pip install requests  # For external API calls (may already be installed)
```

### 4. Seed Initial Data

**Option A: Manual seed script**

```bash
cd backend
python -c "
from app.core.db import SessionLocal
from app.services.ingestion.aap_data_ingestion import CryptoDataIngestion, MacroDataIngestion

db = SessionLocal()

# Seed crypto data
crypto = CryptoDataIngestion(db)
print('Fetching current crypto prices...')
crypto.fetch_current_prices()

# Backfill historical (optional, may hit rate limits)
# crypto.fetch_historical_prices(days=90)

# Seed macro data (requires FRED API key)
macro = MacroDataIngestion(db, fred_api_key='YOUR_KEY')
print('Fetching macro data...')
macro.fetch_current_macro_data()
macro.seed_estimated_global_m2()

db.close()
print('Seeding complete!')
"
```

**Option B: Let scheduler handle it**

Data will be automatically fetched on next scheduled run (every 4 hours).

### 5. Calculate First AAP Reading

```bash
# Using API endpoint
curl -X POST "http://localhost:8000/aap/calculate"

# Or via Python
python -c "
from datetime import datetime
from app.core.db import SessionLocal
from app.services.aap_calculator import AAPCalculator

db = SessionLocal()
calculator = AAPCalculator(db)
result = calculator.calculate_for_date(datetime.utcnow())

if result:
    print(f'AAP Score: {result.stability_score:.1f}')
    print(f'Regime: {result.regime}')
    print(f'Driver: {result.primary_driver}')
else:
    print('Insufficient data for calculation')

db.close()
"
```

### 6. Verify Installation

```bash
# Check API endpoints
curl http://localhost:8000/aap/current

# Expected response:
# {
#   "date": "2026-01-08T00:00:00",
#   "stability_score": 65.0,
#   "regime": "mild_caution",
#   ...
# }
```

---

## API Usage Examples

### Get Current AAP Reading

```bash
curl http://localhost:8000/aap/current | jq
```

**Response:**
```json
{
  "date": "2026-01-08T00:00:00",
  "stability_score": 67.3,
  "regime": "mild_caution",
  "regime_confidence": 0.85,
  "primary_driver": "coordinated",
  "stress_type": "monetary",
  "metals_contribution": 0.18,
  "crypto_contribution": 0.15,
  "is_critical": false,
  "changes": {
    "1d": -2.1,
    "5d": -5.4
  },
  "interpretation": {
    "summary": "Early alternative asset accumulation detected",
    "meaning": "Hedging behavior emerging...",
    "implications": "Monitor for acceleration...",
    "watch_for": "Coordinated moves in metals and crypto..."
  }
}
```

### Get Historical Data

```bash
curl "http://localhost:8000/aap/history?days=90" | jq
```

### Get Component Breakdown

```bash
curl http://localhost:8000/aap/components/current | jq
```

### Get Dashboard Summary

```bash
# Comprehensive data for main dashboard widget
curl http://localhost:8000/aap/dashboard | jq
```

### Manual Calculation Trigger

```bash
# Calculate for today
curl -X POST http://localhost:8000/aap/calculate

# Calculate for specific date
curl -X POST "http://localhost:8000/aap/calculate?date=2026-01-07"
```

---

## Frontend Integration

### React/TypeScript Component Example

```typescript
import { useApi } from '@/hooks/useApi';

interface AAPData {
  stability_score: number;
  regime: string;
  primary_driver: string;
  is_critical: boolean;
  changes: {
    "1d": number;
    "5d": number;
  };
  interpretation: {
    summary: string;
    meaning: string;
  };
}

export function AAPWidget() {
  const { data, isLoading, error } = useApi<AAPData>('/aap/current');
  
  if (isLoading) return <div>Loading AAP...</div>;
  if (error) return <div>Error loading AAP</div>;
  
  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    if (score >= 20) return 'text-red-600';
    return 'text-red-900';
  };
  
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">
        Alternative Asset Pressure
      </h3>
      
      <div className={`text-3xl font-bold ${getStatusColor(data.stability_score)}`}>
        {data.stability_score.toFixed(1)}
      </div>
      
      <div className="text-sm text-gray-600 mt-1">
        {data.regime.replace('_', ' ').toUpperCase()}
      </div>
      
      {data.is_critical && (
        <div className="mt-2 px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
          CRITICAL ALERT
        </div>
      )}
      
      <div className="mt-4 text-sm">
        <div className="flex justify-between">
          <span>1D Change:</span>
          <span className={data.changes["1d"] < 0 ? 'text-red-600' : 'text-green-600'}>
            {data.changes["1d"] > 0 ? '+' : ''}{data.changes["1d"].toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Driver:</span>
          <span className="font-medium">{data.primary_driver}</span>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-700">
        {data.interpretation.summary}
      </div>
    </div>
  );
}
```

### Add to Dashboard Page

```typescript
// src/pages/Dashboard.tsx

import { AAPWidget } from '@/components/widgets/AAPWidget';

export function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Existing widgets */}
      <SystemStatusWidget />
      <LiquidityWidget />
      
      {/* New AAP Widget */}
      <AAPWidget />
      
      {/* Other widgets */}
    </div>
  );
}
```

---

## Monitoring & Troubleshooting

### Check Scheduler Logs

```bash
# Backend logs will show AAP ingestion and calculation
docker logs -f market-diagnostic-dashboard-backend-1 | grep AAP
```

Expected output:
```
📊 Ingesting AAP data (crypto & macro)...
✅ AAP data ingestion completed
🎯 Calculating AAP indicator...
✅ AAP calculated: Score=67.3, Regime=mild_caution
```

### Common Issues

#### Issue: "No AAP data available"

**Cause**: No crypto or metals price data in database  
**Solution**:
```bash
# Check if crypto data exists
curl http://localhost:8000/aap/current

# If empty, run manual ingestion
python backend/app/services/ingestion/aap_data_ingestion.py
```

#### Issue: "Insufficient data for AAP calculation"

**Cause**: Need at least 80% of components available  
**Solution**:
```bash
# Check component completeness
curl http://localhost:8000/aap/components/current | jq '.data_quality'

# Ensure both crypto AND metals data present
# May need to backfill metals data first
```

#### Issue: FRED API key errors

**Cause**: Invalid or missing FRED API key  
**Solution**:
1. Get key from https://fred.stlouisfed.org/
2. Add to backend.env
3. Restart backend service

#### Issue: Rate limiting from CoinGecko

**Cause**: Free tier limited to 10-50 calls/min  
**Solution**:
- Reduce calculation frequency
- Consider CoinGecko Pro API
- Use alternative crypto API (CoinCap, CryptoCompare)

---

## Data Source Configuration

### Primary Sources (Free Tier)

1. **CoinGecko** (Crypto)
   - URL: https://api.coingecko.com/api/v3
   - Rate Limit: 10-50 calls/min
   - No API key required

2. **FRED** (Macro)
   - URL: https://api.stlouisfed.org/fred/
   - Rate Limit: Generous (1000s/day)
   - Requires free API key

3. **Existing Metals APIs** (Already configured)
   - Use existing precious metals ingestion

### Alternative Sources (If Needed)

1. **CoinCap API**
   ```python
   # Alternative crypto source
   COINCAP_BASE = "https://api.coincap.io/v2"
   ```

2. **CryptoCompare**
   ```python
   # More reliable but requires API key
   CRYPTOCOMPARE_BASE = "https://min-api.cryptocompare.com/data"
   ```

3. **Manual CSV Updates**
   - For macro data if FRED unavailable
   - Create import scripts in `scripts/`

---

## Performance Optimization

### Database Indexes

Already configured in models:
- `ix_crypto_prices_date`
- `ix_macro_liquidity_date`
- `ix_aap_indicator_date`
- `ix_aap_indicator_score`

### Caching Strategy

```python
# Add Redis caching for frequently accessed endpoints
from functools import lru_cache

@lru_cache(maxsize=1)
@router.get("/aap/current")
def get_current_aap_cached(db: Session = Depends(get_db)):
    # Cache expires every 4 hours (scheduler interval)
    return get_current_aap(db)
```

### Query Optimization

```python
# Use select_related/joinedload for related data
from sqlalchemy.orm import joinedload

indicators = db.query(AAPIndicator).options(
    joinedload(AAPIndicator.components)
).all()
```

---

## Testing

### Unit Tests

```python
# tests/test_aap_calculator.py

import pytest
from datetime import datetime
from app.services.aap_calculator import AAPCalculator

def test_stability_score_invariant():
    """Test that stability score is always 100 - pressure_index * 100"""
    calculator = AAPCalculator(db_session)
    
    # Mock pressure index
    pressure = 0.35
    expected_score = 100 - (pressure * 100)  # 65.0
    
    assert expected_score == 65.0

def test_regime_classification():
    """Test regime thresholds"""
    assert classify_regime(95) == "normal_confidence"
    assert classify_regime(75) == "mild_caution"
    assert classify_regime(50) == "monetary_stress"
    assert classify_regime(25) == "liquidity_crisis"
    assert classify_regime(15) == "systemic_breakdown"

def test_cross_asset_multiplier():
    """Test coordinated signal amplification"""
    metals_pressure = 0.7
    crypto_pressure = 0.7
    multiplier, regime = compute_multiplier(metals_pressure, crypto_pressure)
    
    assert multiplier > 1.0  # Amplification
    assert regime == "coordinated"
```

### Integration Tests

```python
# tests/test_aap_api.py

def test_get_current_aap(client):
    """Test current AAP endpoint"""
    response = client.get("/aap/current")
    assert response.status_code == 200
    data = response.json()
    
    assert "stability_score" in data
    assert 0 <= data["stability_score"] <= 100
    assert "regime" in data

def test_calculate_aap(client):
    """Test manual calculation trigger"""
    response = client.post("/aap/calculate")
    assert response.status_code == 200
    assert response.json()["success"] == True
```

---

## Production Checklist

- [ ] FRED API key configured
- [ ] Database tables created
- [ ] Initial data seeded (crypto + macro + metals)
- [ ] First AAP calculation successful
- [ ] Scheduler integration verified
- [ ] API endpoints responding
- [ ] Frontend widget integrated
- [ ] Monitoring/alerting configured
- [ ] Documentation reviewed
- [ ] Team training completed

---

## Support & Maintenance

### Weekly Tasks
- Review regime classifications for accuracy
- Check data source health
- Monitor API rate limits
- Review error logs

### Monthly Tasks
- Analyze false positive/negative rates
- Consider weight adjustments
- Evaluate new data sources
- Update documentation

### Quarterly Tasks
- Backtest against historical crises
- Cross-indicator correlation analysis
- User feedback integration
- Model refinement

---

## Contact & Questions

For implementation questions or issues:
1. Review full documentation: `AAP_INDICATOR_DOCUMENTATION.md`
2. Check API docs: `http://localhost:8000/docs` (FastAPI auto-docs)
3. Review calculation logic: `app/services/aap_calculator.py`

---

**Quick Start Command:**

```bash
# One-command startup (after API keys configured)
cd backend
python -c "from app.services.ingestion.aap_data_ingestion import run_daily_ingestion; run_daily_ingestion()"
curl -X POST http://localhost:8000/aap/calculate
curl http://localhost:8000/aap/current | jq
```

---

**Version**: 1.0  
**Last Updated**: January 8, 2026
