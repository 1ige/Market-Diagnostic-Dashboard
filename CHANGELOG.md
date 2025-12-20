# Changelog

All notable changes to the Market Diagnostic Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
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
