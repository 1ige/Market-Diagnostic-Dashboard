# Market Stability Diagnostic Dashboard

A comprehensive real-time market health monitoring system featuring **11 core indicators** tracking volatility, rates, liquidity, and sentiment across multiple timeframes.

🌐 **Live at**: https://marketdiagnostictool.com

---

## 📊 System Overview

### Core Market Indicators (11)
- **VIX**: Market volatility and fear gauge
- **SPY**: S&P 500 trend strength (50-day EMA distance)
- **Federal Funds Rate**: Rate-of-change momentum
- **10Y-2Y Treasury Curve**: Yield curve inversion detector
- **Unemployment Rate**: Labor market health
- **Consumer Health**: Composite consumer strength indicator
- **Bond Market Stability**: 4-component weighted (credit, curve, momentum, volatility)
- **Liquidity Proxy**: 3-component z-score (M2, Fed BS, RRP)
- **Analyst Confidence**: Market sentiment gauge
- **Sentiment Composite**: Combined consumer & corporate sentiment

---

## 🚀 Key Features

### Real-Time Monitoring
- **Automated Data Ingestion**: 4-hour ETL pipeline from FRED API & Yahoo Finance
- **365-Day Historical Backfill**: Complete historical context on startup
- **Manual Refresh**: One-click data updates on dashboard
- **Data Freshness Indicators**: Visual status showing last update times

### Advanced Analytics
- **Dow Theory Market Strain**: Direction and strain analysis based on Dow Theory principles
- **Composite Scoring**: Weighted system health calculation across all indicators
- **Precious Metals Diagnostic**: Comprehensive metals market regime analysis
- **Market Map**: Visual sector performance heatmap
- **Sector & Stock Projections**: Forward-looking analysis and alerts

### User Experience
- **Responsive Design**: Mobile-first, works on all devices
- **Market News Integration**: Cached Seeking Alpha headlines with ticker filtering
- **System Breakdown**: Historical heatmap and indicator state distribution visualization

---

## 🏗️ Architecture

### Backend (FastAPI + PostgreSQL)
```
backend/
├── app/
│   ├── api/          # REST endpoints
│   ├── models/       # SQLAlchemy models
│   ├── services/     # Business logic (calculators, ingestion)
│   └── utils/        # Helper functions
├── backfill_*.py     # Data backfill scripts
├── fetch_*.py        # Data fetcher scripts
└── complete_aap_components.py  # AAP full implementation
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/        # Route pages
│   ├── hooks/        # Custom React hooks
│   ├── types/        # TypeScript definitions
│   └── utils/        # Helper functions
```

### Deployment (Docker)
- **Docker Compose**: Orchestrates backend, frontend, and PostgreSQL
- **Multi-arch Support**: Works on Mac ARM64 and x86_64
- **Production Ready**: Nginx reverse proxy, health checks, auto-restart

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Development Setup
```bash
# Clone repository
git clone https://github.com/meyer-s/Market-Diagnostic-Dashboard.git
cd Market-Diagnostic-Dashboard

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access dashboard
open http://localhost:3000
```

### Production Deployment
```bash
# On production server
cd ~/Market-Diagnostic-Dashboard
git pull

# Deploy full AAP system (runs all data fetchers + backfills)
./deploy_full_aap.sh

# Or manual deployment
docker-compose up -d --build
docker exec market_backend python seed_indicators.py
docker exec market_backend python complete_aap_components.py
docker exec market_backend python backfill_aap.py
```

---

## 📦 Data Sources

### Primary APIs
- **FRED (Federal Reserve Economic Data)**: Macro indicators, crypto prices (CBBTCUSD, CBETHUSD), rates
- **Yahoo Finance**: Precious metals prices (AU, AG, PT, PD), equity data
- **DeFiLlama**: DeFi TVL, stablecoin supply (free, no key required)
- **CoinGecko**: Crypto market data (dominance, market caps)

### Data Quality
- ✅ **100% Real Data**: All seed data replaced with live sources
- ✅ **Daily Updates**: Scheduled ingestion every 4 hours
- ✅ **Historical Depth**: 90-365 days depending on indicator
- ✅ **Source Attribution**: All data tagged with origin

---

## 🔧 Key Scripts

### Operational Scripts
- **`seed_indicators.py`**: Initialize 11 core indicators in database
- **`backfill_metals.py`**: Backfill precious metals data
- **`fetch_real_macro.py`**: Fetch macro liquidity data from FRED
- **`fetch_cb_holdings.py`**: Fetch central bank gold holdings
- **`fetch_comex_data.py`**: Estimate COMEX inventory stress
- **`refresh_aap_data.py`**: Master script to refresh all data sources

### Deployment Scripts
- **`deploy_full_aap.sh`**: One-command full system deployment
- Pulls code, runs all data fetchers, backfills historical data

### Maintenance Scripts (in `backend/maintenance_scripts/`)
- One-time use scripts for debugging and development
- Archived documentation in `archive/` folder

---

## 🎯 API Endpoints

### Core Indicators
- `GET /indicators` - List all 11 indicators with current values
- `GET /indicators/{code}` - Detailed indicator data
- `GET /indicators/{code}/history?days=90` - Historical data

### System
- `GET /health` - System health check
- `GET /admin/status` - Detailed system status
- `GET /dow-theory/strain` - Dow Theory analysis
- `GET /precious-metals/regime` - Metals diagnostic

### Sector Analysis
- `GET /sector-projections` - Forward sector analysis
- `GET /stock-projections` - Individual stock signals
- `GET /sector-alerts` - Active sector alerts

---

## 📊 Frontend Pages

### Main Pages
- `/` - Dashboard with all 11 indicators overview
- `/indicators` - All indicators with sparklines and detailed data
- `/system-breakdown` - Historical heatmap and indicator state distribution
- `/market-map` - Sector performance visualization
- `/news` - Market news with ticker filtering

### Specialized Pages
- `/precious-metals` - Comprehensive metals diagnostic
- `/sector-projections` - Sector forward analysis
- `/stock-projections` - Individual stock projections

---

## 🛠️ Development

### Environment Variables
```bash
# Backend (.env or devops/env/backend.env)
DATABASE_URL=postgresql://user:pass@db:5432/market_diagnostic
FRED_API_KEY=your_fred_api_key

# Frontend (devops/env/frontend.env)
VITE_API_URL=http://localhost:8000
```

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Database Migrations
```bash
# Create migration
docker exec market_backend alembic revision --autogenerate -m "description"

# Apply migration
docker exec market_backend alembic upgrade head
```

---

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

---

## 📄 License

Proprietary - All rights reserved © 2026 Steven J Meyer LLC

---

## 🔗 Links

- **Production**: https://marketdiagnostictool.com
- **Repository**: https://github.com/meyer-s/Market-Diagnostic-Dashboard
- **Documentation**: See `DEPLOYMENT_GUIDE.md` and `AAP_FULL_IMPLEMENTATION.md`

---

## 📝 Version History

### v2.1 (January 2026)
- ✅ Integrated CoinGecko for 365-day crypto historical data
- ✅ Added precious metals diagnostic page
- ✅ Comprehensive system breakdown visualization
- ✅ Removed AAP from main dashboard (moved to specialized section)
- ✅ Improved data freshness indicators

### v2.0 (January 2026)
- ✅ Added Alternative Asset Stability (AAS) indicator
- ✅ Implemented 18-component framework
- ✅ Replaced all seed data with real sources
- ✅ Comprehensive documentation and deployment automation

### v1.0 (Initial Release)
- ✅ 11 core market indicators
- ✅ Real-time dashboard and analytics
- ✅ Docker deployment
- ✅ FRED + Yahoo Finance integration
