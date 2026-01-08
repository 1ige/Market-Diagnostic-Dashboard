# 🚀 Deploy AAP Full System - Ready to Execute

## ✅ All Changes Committed & Pushed

All code is ready on GitHub. Run these commands on your production server to deploy the complete 18-component AAP system.

---

## 📋 Deployment Commands

SSH into your server and run:

```bash
# 1. SSH into production server
ssh ubuntu@100.49.90.221

# 2. Navigate to project directory
cd ~/Market-Diagnostic-Dashboard

# 3. Pull latest changes (includes all AAP components + UI updates)
git pull origin main

# 4. Run automated deployment script
./deploy_full_aap.sh
```

---

## 🔍 What deploy_full_aap.sh Does

The script automates these 5 phases:

### Phase 1: Data Refresh (5 scripts)
- `fetch_real_crypto.py` - BTC/ETH from FRED
- `fetch_real_macro.py` - M2, Fed balance sheet, RRP
- `fetch_cb_holdings.py` - Central bank gold holdings
- `fetch_comex_data.py` - COMEX inventory estimates
- `fetch_extended_crypto.py` - DeFi TVL, BTC dominance

### Phase 2: Component Implementation
- `complete_aap_components.py` - Adds all 8 missing components:
  * Gold real rate divergence (FRED DFII10)
  * BTC real rate correlation break
  * Backwardation signal
  * ETF flow divergence
  * BTC dominance momentum
  * Altcoin performance signal
  * Platinum z-score
  * Palladium z-score

### Phase 3: Quality Check
- Validates 18/18 components are operational
- Requires 70% threshold (13/18) to proceed

### Phase 4: Historical Backfill
- `backfill_aap.py` - Backfills 90 days of AAP calculations

### Phase 5: Verification
- Queries `/aap/current` endpoint
- Confirms AAP score is calculating with fresh data

---

## 🎯 Expected Outcome

After deployment completes (2-3 minutes):

✅ **18/18 components operational** (100%, well above 70% threshold)
✅ **Fresh AAP score** calculated from today's data
✅ **90 days of historical data** for trend analysis
✅ **System Breakdown page updated** with AAP section
✅ **Component breakdown page** accessible at `/aap-breakdown`

---

## 🔧 Manual Verification (Optional)

After deployment, verify everything works:

```bash
# Check API health
curl http://localhost:8000/health

# Get current AAP score
curl http://localhost:8000/aap/current | jq

# View component breakdown
curl http://localhost:8000/aap/components/breakdown | jq

# Check component count
curl http://localhost:8000/aap/components/breakdown | jq '.components | length'
# Should return: 18
```

---

## 🌐 Frontend Updates

The following pages have been updated:

1. **System Breakdown** (`/system-breakdown`)
   - New AAP section at bottom with full 18-component explanation
   - Calculation methodology
   - Data source quality ratings
   - Link to component breakdown

2. **AAP Component Breakdown** (`/aap-breakdown`)
   - Visual display of all 18 components
   - Real-time status indicators
   - Metals (50%) vs Crypto (50%) subsystem weights
   - Individual component contributions

3. **README.md**
   - Comprehensive documentation consolidating all AAP info
   - Quick start guide
   - Architecture overview
   - API endpoint reference

---

## 📊 Component Status Reference

**Before deployment:** 10/18 (55.6%) - Below 70% threshold
**After deployment:** 18/18 (100%) - Fully operational

### Metals Subsystem (10 components, 50% weight)
✅ Gold z-score
✅ Silver z-score  
✅ Au/Ag ratio signal
✅ Platinum z-score (NEW)
✅ Palladium z-score (NEW)
✅ Real rate divergence (NEW)
✅ COMEX inventory stress (NEW)
✅ Central bank accumulation (NEW)
✅ ETF flow divergence (NEW)
✅ Backwardation signal (NEW)

### Crypto Subsystem (8 components, 50% weight)
✅ BTC momentum (USD)
✅ BTC vs gold signal
✅ BTC real rate break (NEW)
✅ BTC dominance momentum (NEW)
✅ Altcoin performance signal (NEW)
✅ Crypto/M2 ratio
✅ Crypto/Fed BS ratio
✅ DeFi TVL growth

---

## 🆘 Troubleshooting

### If deployment script fails:

```bash
# Check Docker containers are running
docker ps

# View backend logs
docker logs market_backend --tail=100

# Restart backend if needed
docker-compose restart backend

# Re-run deployment manually
cd ~/Market-Diagnostic-Dashboard
docker exec market_backend python complete_aap_components.py
docker exec market_backend python backfill_aap.py
```

### If components aren't calculating:

```bash
# Check indicator seeding
docker exec market_backend python seed_indicators.py

# Verify database connection
docker exec market_backend python -c "from app.core.db import SessionLocal; db = SessionLocal(); print('DB connected'); db.close()"

# Check FRED API key
docker exec market_backend python -c "import os; print(os.getenv('FRED_API_KEY'))"
```

---

## 🎉 Success Indicators

You'll know deployment succeeded when:

1. ✅ Script completes all 5 phases without errors
2. ✅ API returns AAP score > 0 with today's timestamp
3. ✅ Component breakdown shows 18/18 active
4. ✅ Frontend displays "18/18 COMPONENTS" badge
5. ✅ System Breakdown page shows new AAP section

---

## 📞 Support

If you encounter issues:
- Check `deploy_full_aap.sh` logs for error messages
- Verify all environment variables are set in `devops/env/backend.env`
- Ensure FRED API key is valid (6f12b75f50396346d15aa95aac7beaef)
- Contact development team with specific error messages

---

**Ready to deploy? Run the commands above on your production server!** 🚀
