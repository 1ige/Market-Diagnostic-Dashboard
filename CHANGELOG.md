# Changelog

All notable changes to the Market Diagnostic Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [2.0.0] - 2026-01-04 - Sector Projections Module

### Added
- **New Sector Projections Page** (`/sector-projections`)
  - Multi-horizon analysis: 3-month, 6-month, and 12-month projections for 11 sector ETFs
  - Transparent, rules-based scoring with four weighted components:
    - Trend (45%): Return + momentum (SMA distance)
    - Relative Strength (30%): Outperformance vs SPY benchmark  
    - Risk (20%): Volatility + drawdown (inverted - lower risk = higher score)
    - Regime (5%): Context-aware adjustments based on market state
  - Smooth line chart visualization tracking score evolution across horizons
  - Winner/Neutral/Loser classifications (top 3, middle 5, bottom 3)
  - Collapsible methodology section with detailed technical documentation
  
- **Sector Divergence Widget** on Dashboard
  - Defensive vs Cyclical sector performance comparison
  - Visual line chart showing score trends across horizons  
  - Market interpretation system with five narratives:
    - "Flight to Safety": Defensives leading in RED market (expected)
    - "Risk Appetite Emerging": Cyclicals gaining in RED market (recovery signal)
    - "Risk-On Mode": Cyclicals leading in GREEN market (healthy)
    - "Caution Creeping In": Defensives leading in GREEN market (warning)
    - "Balanced Rotation": No clear bias
  - Leading/Lagging sectors lists with trend arrows
  - Regime alignment score (0-100) with color-coded status
  - Sector breadth: improving/stable/deteriorating counts

- **Sector Alerts Widget** on Dashboard
  - Real-time divergence alerts when sector leadership conflicts with market regime
  - Five alert types with INFO/WARNING severity:
    1. Recovery Signal: Cyclicals leading in RED market
    2. Extreme Flight to Safety: Defensive spread >15 in RED
    3. Caution Signal: Defensives leading in GREEN market
    4. Strong Risk-On: Cyclical spread >15 in GREEN
    5. Regime Transition: Extreme bias (>15) in YELLOW market
  - Detailed metrics for each alert (spread, averages, system state)

- **Market Map Integration**
  - Sector projection scores overlaid on sector cards  
  - Trend arrows showing 3M→12M direction (↗ improving, → flat, ↘ declining)
  - Color-coded indicators (green/gray/red based on trend)

- **System Breakdown Updates**
  - Updated text: "11 indicators across 7 domains" (added Sector Regime)
  - New domain card: "Sector Regime - Defensive vs Cyclical Alignment"
  - Backend virtual indicator framework created (SECTOR_REGIME_ALIGNMENT)

- **Backend Infrastructure**
  - New models: `SectorProjectionRun`, `SectorProjectionValue`
  - New services: `sector_projection.py` (scoring engine), `sector_alerts.py` (divergence detection)
  - New API endpoints:
    - `GET /sectors/projections/latest`: Current projections
    - `GET /sectors/projections/history`: Time-series data
    - `POST /sectors/projections/refresh`: Manual recomputation
    - `GET /sectors/summary`: Dashboard aggregate metrics
    - `GET /sectors/alerts`: Active divergence alerts
  - Scheduler integration: Auto-compute every 4 hours during market hours
  - Virtual indicator framework for dynamically computed indicators

### Technical Details
- Data sources: yfinance for 11 SPDR sector ETFs + SPY benchmark
- Lookback: 800 days for robust statistical calculations
- Scoring: Percentile ranking (0-100 scale) with NaN/Inf handling
- Regime adjustments: +5 for defensives in RED, -5 for high-vol in RED
- Frontend: Smooth Bezier curves, responsive 3-column grid, dynamic highlighting
- All components fully documented with JSDoc headers and inline comments

### Fixed
- NaN handling in sector scoring (multiple .fillna() calls, na_option='bottom')
- JSON serialization with clean_float() helper for NaN/Inf values
- Classification logic: per-horizon thresholds instead of global
- DataFrame initialization: Added mdf creation before scoring operations


## [2026-01-02] System History & Data Quality Improvements

### Added
- **Dynamic System History**: Backend now calculates historical composite scores on-the-fly from indicator data
  - Supports arbitrary date ranges (90, 180, 365 days)
  - Aggregates scores by day with proper weighting
  - Eliminates dependency on limited SystemStatus table records
- **NaN/Inf Protection**: Added comprehensive handling for invalid float values in LIQUIDITY_PROXY components
  - Enhanced z-score calculations with `np.nan_to_num()`
  - Safe float conversion function prevents JSON serialization errors

### Changed
- **Dashboard Chart X-Axis**: Converted to numeric timestamps with proper time-scale rendering
  - Fixes repeating date labels
  - Added `tickCount` for better label spacing
  - Date range buttons (90d/6mo/1yr) now work correctly
- **Code Cleanup**: Removed debug logging and test buttons throughout the application
  - Removed console.log statements from SystemOverviewWidget, SystemBreakdown
  - Removed debug button from IndicatorDetail component
  - Kept appropriate error logging (console.error)

### Fixed
- **Chart Date Rendering**: Dashboard composite score chart now properly displays date ranges
- **Liquidity Proxy Components**: Fixed 500 error caused by NaN values in z-score calculations
- **Raw Value Chart**: Fully removed duplicate raw value chart from indicator detail pages
- **Syntax Error**: Fixed orphaned button tag in IndicatorDetail that caused module loading failure

## [2026-01-02] Sparkline Visualization Enhancements

### Added
- **Bit Smoothing**: Applied 3-point moving average to sparkline charts to reduce visual noise while preserving trend direction
- **Comprehensive Code Documentation**: Added detailed comments to StateSparkline component explaining smoothing algorithm, data sampling, and rendering logic

### Changed
- **Sparkline Display**: Converted from isolated dots to connected line charts with color-coded segments
- **Data Sampling**: Optimized for both daily indicators (60 points) and monthly indicators (all points)
- **Adaptive History**: Monthly indicators now fetch 365 days vs 60 days for daily/weekly indicators

### Fixed
- **Raw Value Chart**: Hidden redundant raw value chart on indicator detail pages (stability score chart provides sufficient information)

## [2026-01-02] AWS Deployment Configuration

### Added
- **AWS Deployment Support**: Added configurable environment-based deployment for AWS EC2
- **Proxy Mode**: Vite dev server now proxies API requests to avoid CORS and port issues
- **Environment-Based CORS**: Backend CORS configuration now reads from `CORS_ORIGINS` environment variable
- **Flexible API URL**: Frontend API URL configurable via `VITE_API_URL` environment variable
- **AWS Documentation**: Added comprehensive AWS deployment guides
  - `AWS_DEPLOYMENT.md` - Complete deployment guide with troubleshooting
  - `AWS_QUICK_FIX.md` - Quick reference for common issues
  - `configure_aws.sh` - Interactive configuration script for AWS deployments

### Changed
- **Backend CORS**: Now configurable via `CORS_ORIGINS` environment variable (supports comma-separated origins or `*`)
- **Frontend API**: Uses `/api` prefix by default for proxy mode, configurable via environment
- **Code Organization**: Created `src/utils/apiUtils.ts` for centralized API URL management

### Fixed
- **Mobile Network Issues**: Proxy mode eliminates mobile browser port blocking issues
- **Environment Isolation**: Environment files properly separated for different deployment contexts

## [2025-12-20] Analyst Confidence & CORS Overhaul

### Changed
- Renamed all user-facing references of "Analyst Anxiety" to "Analyst Confidence" across frontend, backend, and documentation for clarity and consistency.
- Renamed IndicatorDetail page/component to AnalystConfidenceDetail for clarity.
- Updated all routes, imports, and references to use AnalystConfidenceDetail.
- Updated backend CORS middleware configuration to only allow specific origins with credentials, fixing CORS errors on frontend load.
- Updated all documentation to reflect the new "Analyst Confidence" terminology and scoring semantics.

### Fixed
- Fixed CORS errors that caused the dashboard to fail loading on first refresh.


### Changed
- **Stability Score Invariant Enforcement** (2025-12-20)
  - **CRITICAL**: Fixed direction inversion logic in analytics_stub.py - direction=1 now correctly inverts z-scores (was backwards)
  - **CRITICAL**: Fixed 3 indicators with wrong direction values (DFF, BOND_MARKET_STABILITY, LIQUIDITY_PROXY changed from -1 to 1)
  - Changed DFF to use 6-month cumulative rate change instead of daily ROC (eliminates saturation at 0/100, shows policy cycles)
  - Changed UNRATE to use 6-month unemployment change instead of daily ROC (tracks labor market momentum, not absolute level)
  - Added 30-day smoothing to LIQUIDITY_PROXY (reduced noise from mixed data frequencies)
  - Standardized all indicator thresholds to 40/70 (RED <40, YELLOW 40-69, GREEN ≥70)
  - Updated all frontend text to consistently use "stability score (higher = better)" semantics
  - Created centralized stabilityConstants.ts for threshold management
  - Removed direction field from frontend UI (backend normalization detail)
  - Updated SystemBreakdown.tsx with corrected composite indicator descriptions and formulas
  - Updated IndicatorDetail.tsx to clarify intermediate stress calculations vs final stability scores
  - See docs/STABILITY_SCORE_ENFORCEMENT.md and docs/INDICATOR_TRANSFORMATION_VERIFICATION.md for complete details

- **Project Structure Reorganization** (2025-12-19)
  - Created `docs/` folder and moved all documentation files (IMPLEMENTATION_STATUS.md, INDICATOR_FIXES.md, REFACTORING_SUMMARY.md)
  - Created `scripts/` folder and moved all launcher scripts (launch.ps1, launch.sh, install_market_stability_env.sh)
  - Cleaner root directory with improved organization
  - Updated README.md with new file paths and project structure section

### Removed
- **Cleanup** (2025-12-19)
  - Removed obsolete backup files (IndicatorDetail.tsx.backup, IndicatorDetail.tsx.old)
  - Removed old API implementations (market_map_old.py, market_map_v2.py)
  - Removed obsolete `version` attribute from docker-compose.yml (Docker Compose v3+ no longer requires it)

### Added
- **Enhanced .gitignore** (2025-12-19)
  - Added patterns for package lock files (pnpm-lock.yaml, yarn.lock, package-lock.json)
  - Added backup file patterns (*.backup, *.old, *.bak) to prevent future clutter

## [1.0.0] - 2025-12-15

### Added
- Initial release of Market Diagnostic Dashboard
- 8-indicator monitoring system with automatic seeding
- Dow Theory market strain analysis
- Real-time data ingestion from FRED API and Yahoo Finance
- Docker containerization for easy deployment
- One-command launch scripts for Windows and Mac/Linux
- Manual refresh functionality
- Data freshness indicators with visual feedback
- Alert system with configurable thresholds
- Comprehensive API documentation

### Features
- **Core Indicators**: VIX, SPY, Federal Funds Rate, Treasury Yield Curve, Unemployment Rate
- **Composite Indicators**: Consumer Health, Bond Market Stability, Liquidity Proxy
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: FastAPI + PostgreSQL + SQLAlchemy
- **Scheduling**: APScheduler for automated ETL (4-hour intervals)
- **Visualization**: Recharts for data visualization

### Fixed
- Federal Funds Rate now tracks rate-of-change with proper directional scoring
- SPY calculation uses EMA gap percentage for accurate trend analysis
- Improved error handling in ETL pipeline
