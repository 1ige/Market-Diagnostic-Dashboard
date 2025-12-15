# Market Diagnostic Dashboard

A real-time market stability monitoring system that tracks key financial indicators and provides comprehensive market analysis.

## Features

- **8-Indicator Monitoring System**: 
  - **Core Indicators**: VIX, SPY (50-day EMA gap), Federal Funds Rate (rate-of-change), Treasury Yield Curve (10Y-2Y), Unemployment Rate
  - **Composite Indicators**: Consumer Health, Bond Market Stability (4-component weighted), Liquidity Proxy (3-component)
  - **Automatic Seeding**: All indicators automatically seeded on container startup
- **Dow Theory Market Strain Analysis**: Advanced market direction and strain calculations based on Dow Theory principles
- **System Overview Dashboard**: Composite scoring system with historical trends, alert notifications, and purpose description
- **Manual Refresh Button**: One-click data refresh on dashboard to fetch latest market data
- **Data Freshness Indicators**: Visual icons and tooltips showing data recency and update frequency
- **Automated Data Ingestion**: Scheduled ETL pipeline (4-hour intervals) pulling from FRED API and Yahoo Finance, with 365-day backfill capability
- **Alert System**: Configurable threshold-based alerting for market condition changes
- **Docker Support**: Full containerized deployment for both Mac (ARM64) and Windows (x86_64) with automatic startup
- **Advanced Technical Analysis**: 
  - SPY uses distance from 50-day EMA to capture trend strength
  - Federal Funds Rate tracks rate-of-change (not absolute rate) with proper directional scoring
  - Bond Market Stability: Weighted composite (44% credit, 23% curve, 17% momentum, 16% Treasury volatility)
  - Liquidity Proxy: Z-score combination of M2 growth, Fed balance sheet delta, and RRP usage

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Production database (SQLite for development)
- **SQLAlchemy**: ORM for database operations
- **APScheduler**: Automated data ingestion scheduling
- **yfinance**: Yahoo Finance data integration
- **FRED API**: Federal Reserve Economic Data integration

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **Recharts**: Data visualization library

## Quick Start

### Prerequisites
- Docker and Docker Compose
- FRED API Key (free from https://fred.stlouisfed.org/docs/api/api_key.html)
- (Optional) Python 3.11+ and Node.js 18+ for local development

### One-Command Launch 🚀

**Windows (PowerShell):**
```powershell
.\launch.ps1
```

**Mac/Linux:**
```bash
chmod +x launch.sh
./launch.sh
```

The launcher script will:
- ✅ Check and start Docker if needed
- ✅ Build and start all containers
- ✅ Automatically seed all 8 indicators on backend startup
- ✅ Backfill 365 days of historical data from FRED and Yahoo Finance
- ✅ Open the dashboard in your browser
- ✅ Display comprehensive setup status and service URLs

### Manual Setup

If you prefer to run commands individually:

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Market-Diagnostic-Dashboard
```

2. Create environment files (see Configuration section below)

3. Start all services:
```bash
docker-compose up -d --build
```

4. Backfill historical data (indicators are seeded automatically on startup):
```bash
curl -X POST http://localhost:8000/admin/backfill
```

5. Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database Admin**: http://localhost:8080 (Adminer)

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install -g pnpm
pnpm install
pnpm dev
```

## Configuration

### Environment Variables

The environment files should already exist in `devops/env/`. Update `devops/env/backend.env` with your FRED API key:
```env
DATABASE_URL=postgresql://market_user:market_pass@db:5432/market_db
FRED_API_KEY=your_fred_api_key_here  # Get free key from https://fred.stlouisfed.org/
PYTHONUNBUFFERED=1
```

**Important**: Replace `your_fred_api_key_here` with your actual FRED API key before launching.

Create `devops/env/db.env`:
```env
POSTGRES_USER=market_user
POSTGRES_PASSWORD=market_pass
POSTGRES_DB=marketdb
```

Create `devops/env/frontend.env`:
```env
VITE_API_URL=http://localhost:8000
```

## API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /system` - System overview with composite score
- `GET /indicators` - List all indicators with current values

### Data Management
- `POST /admin/backfill` - Backfill historical data (365 days)
- `GET /alerts` - Recent alerts (configurable timeframe)
- `POST /alerts/check` - Manually trigger alert condition check

### Market Analysis
- `GET /dow-theory` - Current Dow Theory market metrics
- `GET /dow-theory/history` - Historical market direction trend (90 days)

## Architecture

### Indicator Scoring System
- **Z-Score Normalization**: Rolling 252-day window for statistical normalization
- **Directional Logic**: Configurable interpretation (high=stress vs high=stability)
- **0-100 Scoring**: Normalized scores mapped to intuitive scale
- **State Classification**: RED/YELLOW/GREEN based on configurable thresholds
- **Enhanced Metrics**: 
  - SPY: Uses (Price - 50 EMA) / EMA percentage gap to capture trend strength
  - DFF: Uses rate-of-change instead of absolute level to measure policy velocity

### Data Pipeline
1. **Ingestion**: Automated fetching from FRED and Yahoo Finance
2. **Normalization**: Z-score calculation with directional adjustment
3. **Scoring**: Conversion to 0-100 stability scores
4. **Classification**: State assignment (RED/YELLOW/GREEN)
5. **Storage**: Timestamped storage in PostgreSQL

## Docker Commands

```bash
# View container status
docker-compose ps

# View logs
docker logs market_backend -f
docker logs market_frontend -f
docker logs market_postgres -f

# Restart a service
docker restart market_backend

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View all logs
docker-compose logs -f
```

## Development Notes

- Backend runs on port 8000
- Frontend runs on port 5173 (Vite default)
- PostgreSQL runs on port 5432
- Adminer (DB admin) runs on port 8080
- ETL scheduler runs every 4 hours during market hours
- Initial data load happens on application startup
- Backend automatically seeds all 8 indicators on container start

## Recent Improvements

### December 2025 Updates
- **Fixed Federal Funds Rate Direction**: Now correctly stores rate-of-change instead of absolute rate, with proper directional scoring (falling rates = GREEN, rising rates = RED)
- **Fixed SPY Calculation**: Now stores EMA gap percentage instead of absolute price for better trend analysis
- **Automatic Indicator Seeding**: Backend automatically seeds all indicators on startup - no manual intervention needed
- **One-Command Launcher**: Added `launch.ps1` (Windows) and `launch.sh` (Mac/Linux) scripts for complete automated setup
- **Manual Refresh Button**: Added dashboard refresh button to manually trigger data updates
- **Data Freshness Indicators**: 
  - Visual icons showing data recency (green check, gray clock, yellow warning)
  - Hover tooltips explaining update frequencies (Real-time, Daily, Weekly, Monthly)
  - Frequency badges on each indicator card
  - Smart detection of stale vs. waiting-for-source-data states
- **Improved Error Handling**: Better logging and error messages for ETL failures

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
