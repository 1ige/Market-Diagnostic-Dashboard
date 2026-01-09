"""
Fetch historical crypto prices from CoinGecko API (no key required)
"""
from datetime import datetime, timedelta
import requests
import time
from app.core.db import SessionLocal
from app.models.alternative_assets import CryptoPrice

COINGECKO_API = "https://api.coingecko.com/api/v3"

def fetch_coingecko_market_chart(coin_id, vs_currency="usd", days=365):
    """Fetch market chart data from CoinGecko"""
    url = f"{COINGECKO_API}/coins/{coin_id}/market_chart"
    params = {
        "vs_currency": vs_currency,
        "days": days,
        "interval": "daily"
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching {coin_id}: {e}")
        return None

def fetch_crypto_history_coingecko(days=365):
    """Fetch historical crypto data from CoinGecko"""
    db = SessionLocal()
    
    try:
        print(f"\n🔄 Fetching {days} days of crypto data from CoinGecko...")
        
        # Delete FRED data to replace with CoinGecko
        deleted = db.query(CryptoPrice).filter(CryptoPrice.source == 'FRED').delete()
        db.commit()
        print(f"  Deleted {deleted} FRED records")
        
        # Fetch BTC data
        print("\n  Fetching BTC prices...")
        btc_data = fetch_coingecko_market_chart("bitcoin", days=days)
        time.sleep(1)
        
        # Fetch ETH data
        print("  Fetching ETH prices...")
        eth_data = fetch_coingecko_market_chart("ethereum", days=days)
        time.sleep(1)
        
        if not btc_data or not btc_data.get('prices'):
            print(f"  ⚠️  No BTC data returned from CoinGecko")
            return
        
        btc_prices = {datetime.fromtimestamp(p[0]/1000).date(): p[1] 
                      for p in btc_data.get('prices', [])}
        eth_prices = {datetime.fromtimestamp(p[0]/1000).date(): p[1] 
                      for p in eth_data.get('prices', [])} if eth_data else {}
        
        print(f"\n  CoinGecko Data fetched:")
        print(f"    BTC prices: {len(btc_prices)} data points")
        print(f"    ETH prices: {len(eth_prices)} data points")
        
        # Get all unique dates
        all_dates = sorted(set(list(btc_prices.keys()) + list(eth_prices.keys())))
        
        added = 0
        for date_obj in all_dates:
            date = datetime.combine(date_obj, datetime.min.time())
            
            btc_price = btc_prices.get(date_obj)
            eth_price = eth_prices.get(date_obj)
            
            # Skip if no BTC price
            if not btc_price:
                continue
            
            # Estimate market cap (BTC supply ~21M, dominance ~40%)
            btc_mcap = btc_price * 21_000_000
            total_mcap = btc_mcap / 0.40 if btc_price else None
            
            crypto_price = CryptoPrice(
                date=date,
                btc_usd=btc_price,
                eth_usd=eth_price,
                total_crypto_mcap=total_mcap / 1_000_000_000 if total_mcap else None,
                btc_dominance=40.0,  # Approximate
                btc_gold_ratio=None,
                btc_volume_24h=None,
                source='COINGECKO'
            )
            db.add(crypto_price)
            added += 1
            
            if added % 50 == 0:
                print(f"    {added} days processed...")
        
        db.commit()
        print(f"\n✅ Added {added} crypto price records from CoinGecko")
        
    except Exception as e:
        print(f"❌ Error fetching crypto data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fetch_crypto_history_coingecko(365)
