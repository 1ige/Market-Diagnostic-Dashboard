# Changelog

All notable changes to the Market Diagnostic Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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
