"""
Backfill Historical System Status Records

This script reconstructs historical composite scores and system states
from existing indicator data, filling the system_status table with 
historical records for trending and analysis.
"""

import sys
from datetime import datetime, timedelta
from collections import defaultdict
from app.models.indicator import Indicator
from app.models.indicator_value import IndicatorValue
from app.models.system_status import SystemStatus
from app.utils.db_helpers import get_db_session

# Indicator weights (same as frontend and ETL)
WEIGHTS = {
    'VIX': 1.5,
    'SPY': 1.4,
    'DFF': 1.3,
    'T10Y2Y': 1.6,
    'UNRATE': 1.2,
    'CONSUMER_HEALTH': 1.4,
    'BOND_MARKET_STABILITY': 1.8,
    'LIQUIDITY_PROXY': 1.6,
    'ANALYST_ANXIETY': 1.7,
    'SENTIMENT_COMPOSITE': 1.6,
}

def classify_state(score: float) -> str:
    """Classify score into RED/YELLOW/GREEN state."""
    if score >= 70:
        return "GREEN"
    elif score >= 40:
        return "YELLOW"
    else:
        return "RED"

def calculate_composite_score(indicator_scores: dict) -> float:
    """Calculate weighted composite score from indicator scores."""
    total_weighted = 0.0
    total_weight = 0.0
    
    for code, score in indicator_scores.items():
        weight = WEIGHTS.get(code, 1.0)
        total_weighted += score * weight
        total_weight += weight
    
    return total_weighted / total_weight if total_weight > 0 else 50.0

def main():
    print("🔄 Backfilling historical system status records...")
    
    with get_db_session() as db:
        # Get all indicators
        indicators = db.query(Indicator).all()
        indicator_map = {ind.id: ind.code for ind in indicators}
        
        print(f"Found {len(indicators)} indicators")
        
        # Fetch all indicator values from last 365 days
        cutoff = datetime.utcnow() - timedelta(days=365)
        values = (
            db.query(IndicatorValue)
            .filter(IndicatorValue.timestamp >= cutoff)
            .order_by(IndicatorValue.timestamp)
            .all()
        )
        
        print(f"Found {len(values)} indicator values since {cutoff.date()}")
        
        # Group values by date (YYYY-MM-DD)
        daily_scores = defaultdict(dict)
        
        for value in values:
            date_key = value.timestamp.date()
            indicator_code = indicator_map.get(value.indicator_id)
            
            if indicator_code and indicator_code in WEIGHTS:
                # Keep only the latest score for each indicator on each date
                if indicator_code not in daily_scores[date_key] or value.timestamp > daily_scores[date_key][indicator_code]['timestamp']:
                    daily_scores[date_key][indicator_code] = {
                        'score': value.score,
                        'timestamp': value.timestamp
                    }
        
        print(f"Aggregated data into {len(daily_scores)} unique dates")
        
        # Calculate composite score for each date
        system_records = []
        for date_key in sorted(daily_scores.keys()):
            day_scores = {code: data['score'] for code, data in daily_scores[date_key].items()}
            
            # Only create record if we have data for most indicators (at least 7 out of 10)
            if len(day_scores) >= 7:
                composite = calculate_composite_score(day_scores)
                state = classify_state(composite)
                
                # Count states
                red_count = sum(1 for score in day_scores.values() if score < 40)
                yellow_count = sum(1 for score in day_scores.values() if 40 <= score < 70)
                green_count = sum(1 for score in day_scores.values() if score >= 70)
                
                # Use the latest timestamp from that date
                latest_ts = max(data['timestamp'] for data in daily_scores[date_key].values())
                
                system_records.append({
                    'timestamp': latest_ts,
                    'composite_score': composite,
                    'state': state,
                    'red_count': red_count,
                    'yellow_count': yellow_count,
                })
        
        print(f"Generated {len(system_records)} system status records")
        
        if not system_records:
            print("⚠️  No records to insert. Need more indicator data.")
            return
        
        # Clear existing records and insert new ones
        print("🗑️  Clearing existing system_status records...")
        db.query(SystemStatus).delete()
        
        print("💾 Inserting backfilled records...")
        for record in system_records:
            status = SystemStatus(**record)
            db.add(status)
        
        db.commit()
        
        print(f"✅ Successfully backfilled {len(system_records)} system status records")
        print(f"   Date range: {min(r['timestamp'] for r in system_records).date()} to {max(r['timestamp'] for r in system_records).date()}")
        
        # Show recent sample
        recent = system_records[-5:]
        print("\n📊 Recent 5 records:")
        for r in recent:
            print(f"   {r['timestamp'].date()}: {r['state']} (score={r['composite_score']:.1f}, R:{r['red_count']} Y:{r['yellow_count']})")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
