"""
Seed Indicators Script
----------------------
Creates all 8 indicator metadata entries in the database.
This script is automatically run on container startup via startup.sh.

Indicators:
- VIX: Volatility stress indicator (high = stress)
- SPY: S&P 500 ETF momentum (stores EMA gap %, below EMA = stress)
- DFF: Federal Funds Rate (stores absolute rate, scores based on rate-of-change)
- T10Y2Y: Treasury yield curve (inverted = stress)
- UNRATE: Unemployment rate (high = stress)
- CONSUMER_HEALTH: Derived from PCE, CPI, and PI (low = stress)
- BOND_MARKET_STABILITY: Derived from 10Y and 30Y volatility (high = stress)
- LIQUIDITY_PROXY: EFFR volatility (high = stress)

Real data will be fetched automatically by the ETL scheduler every 4 hours.
"""

from app.core.db import SessionLocal, Base, engine
from app.models.indicator import Indicator

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Define all 8 indicators
INDICATORS = [
    {
        "code": "VIX",
        "name": "CBOE Volatility Index (VIX)",
        "source": "yahoo",
        "source_symbol": "^VIX",
        "category": "volatility",
        "direction": 1,  # high VIX = stress
        "lookback_days_for_z": 252,
        "threshold_green_max": 30,
        "threshold_yellow_max": 60,
        "weight": 1.5,
    },
    {
        "code": "SPY",
        "name": "S&P 500 ETF (SPY)",
        "source": "yahoo",
        "source_symbol": "SPY",
        "category": "equity",
        "direction": -1,  # price below EMA = stress
        "lookback_days_for_z": 252,
        "threshold_green_max": 30,
        "threshold_yellow_max": 60,
        "weight": 1.4,
    },
    {
        "code": "DFF",
        "name": "Federal Funds Effective Rate",
        "source": "fred",
        "source_symbol": "DFF",
        "category": "rates",
        # CRITICAL: direction=-1 because we store RATE-OF-CHANGE, not absolute rate
        # Positive ROC = rates rising = tightening = stress (needs inversion)
        # Negative ROC = rates falling = easing = stability (becomes positive score after inversion)
        "direction": -1,
        "lookback_days_for_z": 252,
        "threshold_green_max": 30,
        "threshold_yellow_max": 60,
        "weight": 1.3,
    },
    {
        "code": "T10Y2Y",
        "name": "10-Year minus 2-Year Treasury Spread",
        "source": "fred",
        "source_symbol": "T10Y2Y",
        "category": "rates",
        "direction": -1,  # inverted curve = stress
        "lookback_days_for_z": 252,
        "threshold_green_max": 30,
        "threshold_yellow_max": 60,
        "weight": 1.6,
    },
    {
        "code": "UNRATE",
        "name": "U.S. Unemployment Rate",
        "source": "fred",
        "source_symbol": "UNRATE",
        "category": "employment",
        "direction": 1,  # high unemployment = stress
        "lookback_days_for_z": 252,
        "threshold_green_max": 30,
        "threshold_yellow_max": 60,
        "weight": 1.2,
    },
    {
        "code": "CONSUMER_HEALTH",
        "name": "Consumer Health Index",
        "source": "DERIVED",
        "source_symbol": "CONSUMER_COMPOSITE",
        "category": "consumer",
        "direction": -1,  # negative spread = stress
        "lookback_days_for_z": 252,
        "threshold_green_max": 30,
        "threshold_yellow_max": 60,
        "weight": 1.4,
    },
    {
        "code": "BOND_MARKET_STABILITY",
        "name": "Bond Market Stability Composite",
        "source": "DERIVED",
        "source_symbol": "BOND_COMPOSITE",
        "category": "bonds",
        "direction": -1,  # high score = healthy bond market, low = stress
        "lookback_days_for_z": 252,
        "threshold_green_max": 65,
        "threshold_yellow_max": 35,
        "weight": 1.8,
    },
    {
        "code": "LIQUIDITY_PROXY",
        "name": "Liquidity Proxy Indicator",
        "source": "DERIVED",
        "source_symbol": "LIQUIDITY_COMPOSITE",
        "category": "liquidity",
        "direction": -1,  # high liquidity = stability, low liquidity = stress
        "lookback_days_for_z": 252,
        "threshold_green_max": 60,
        "threshold_yellow_max": 30,
        "weight": 1.6,
    },
]

# Check which indicators already exist
new_indicators = []
for ind_data in INDICATORS:
    existing = db.query(Indicator).filter(Indicator.code == ind_data["code"]).first()
    if not existing:
        new_indicators.append(ind_data)

if not new_indicators:
    print("✅ All 8 indicators already exist")
    db.close()
    exit(0)

for ind_data in new_indicators:
    indicator = Indicator(**ind_data)
    db.add(indicator)
    print(f"✅ Adding {ind_data['name']}")

db.commit()
db.close()

print(f"\n✅ Created {len(new_indicators)} new indicator(s)")
print("\n📊 To backfill 365 days of historical data, run:")
print("   curl -X POST http://localhost:8000/admin/backfill")
print("\nOr the ETL scheduler will fetch latest data automatically.")
