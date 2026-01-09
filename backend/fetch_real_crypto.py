"""
Backfill real crypto prices from FRED API
"""
from datetime import datetime, timedelta
import requests
import time
from app.core.db import SessionLocal
from app.models.alternative_assets import CryptoPrice

FRED_API_KEY = "6f12b75f50396346d15aa95aac7beaef"
FRED_API = "https://api.stlouisfed.org/fred/series/observations"

def fetch_fred_series(series_id, start_date):
    """Fetch a FRED series"""
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "observation_start": start_date.strftime("%Y-%m-%d"),
        "sort_order": "asc"
    }
    response = requests.get(FRED_API, params=params)
    data = response.json()
    return {obs['date']: float(obs['value']) if obs['value'] != '.' else None 
            for obs in data.get('observations', [])}

def fetch_crypto_history(days=365):
    """Fetch historical crypto data from FRED"""
    db = SessionLocal()
    
    try:
        print(f"\n🔄 Fetching {days} days of crypto data from FRED...")
        
        # Delete seed data first
        deleted = db.query(CryptoPrice).filter(CryptoPrice.source == 'SEED').delete()
        db.commit()
        print(f"  Deleted {deleted} seed records")
        
        start_date = datetime.utcnow() - timedelta(days=days+10)
        
        # Fetch BTC price from FRED (CBBTCUSD - Coinbase Bitcoin USD)
        print("\n  Fetching BTC price (CBBTCUSD)...")
        btc_data = fetch_fred_series("CBBTCUSD", start_date)
        time.sleep(1)
        
        # Fetch ETH price from FRED (CBETHUSD - Coinbase Ethereum USD)  
        print("  Fetching ETH price (CBETHUSD)...")
        eth_data = fetch_fred_series("CBETHUSD", start_date)
        time.sleep(1)
        
        print(f"\n  Data fetched:")
        print(f"    BTC prices: {len(btc_data)} data points")
        print(f"    ETH prices: {len(eth_data)} data points")
        
        if len(btc_data) == 0:
            print(f"  ⚠️  No BTC data returned from FRED")
            return
        
        # Get all unique dates
        all_dates = sorted(set(list(btc_data.keys()) + list(eth_data.keys())))
        
        added = 0
        for date_str in all_dates:
            date = datetime.strptime(date_str, "%Y-%m-%d")
            
            # Skip if too old
            if date < datetime.utcnow() - timedelta(days=days):
                continue
            
            btc_price = btc_data.get(date_str)
            eth_price = eth_data.get(date_str)
            
            # Skip if no BTC price
            if not btc_price:
                continue
            
            # Estimate market cap (BTC supply ~19.5M, dominance ~40%)
            btc_mcap = btc_price * 19_500_000
            total_mcap = btc_mcap / 0.40 if btc_price else None
            
            crypto_price = CryptoPrice(
                date=date,
                btc_usd=btc_price,
                eth_usd=eth_price,
                total_crypto_mcap=total_mcap / 1_000_000_000 if total_mcap else None,  # Convert to billions
                btc_dominance=40.0,  # Approximate
                btc_gold_ratio=None,  # Will be calculated
                btc_volume_24h=None,  # Not available from FRED
                source='FRED'
            )
            db.add(crypto_price)
            added += 1
            
            if added % 10 == 0:
                print(f"    {added} days processed...")
        
        db.commit()
        print(f"\n✅ Added {added} real crypto price records from FRED")
        
    except Exception as e:
        print(f"❌ Error fetching crypto data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fetch_crypto_history(90)
