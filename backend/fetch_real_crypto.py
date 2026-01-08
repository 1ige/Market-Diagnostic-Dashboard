"""
Backfill real crypto prices from CoinGecko API
"""
from datetime import datetime, timedelta
import requests
import time
from app.core.db import SessionLocal
from app.models.alternative_assets import CryptoPrice

COINGECKO_API = "https://api.coingecko.com/api/v3"

def fetch_crypto_history(days=90):
    """Fetch historical crypto data from CoinGecko"""
    db = SessionLocal()
    
    try:
        print(f"\n🔄 Fetching {days} days of crypto data from CoinGecko...")
        
        # Delete seed data first
        deleted = db.query(CryptoPrice).filter(CryptoPrice.source == 'SEED').delete()
        db.commit()
        print(f"  Deleted {deleted} seed records")
        
        # Fetch BTC data
        print("\n  Fetching BTC data...")
        btc_response = requests.get(
            f"{COINGECKO_API}/coins/bitcoin/market_chart",
            params={"vs_currency": "usd", "days": days, "interval": "daily"}
        )
        btc_data = btc_response.json()
        
        # Fetch ETH data  
        print("  Fetching ETH data...")
        time.sleep(1)  # Rate limit
        eth_response = requests.get(
            f"{COINGECKO_API}/coins/ethereum/market_chart",
            params={"vs_currency": "usd", "days": days, "interval": "daily"}
        )
        eth_data = eth_response.json()
        
        # Fetch global market data
        print("  Fetching global crypto market data...")
        time.sleep(1)
        global_response = requests.get(f"{COINGECKO_API}/global")
        global_data = global_response.json()
        
        # Process daily data
        btc_prices = btc_data.get('prices', [])
        btc_mcaps = btc_data.get('market_caps', [])
        btc_volumes = btc_data.get('total_volumes', [])
        eth_prices = eth_data.get('prices', [])
        
        added = 0
        for i in range(min(len(btc_prices), len(eth_prices))):
            timestamp = btc_prices[i][0] / 1000  # Convert to seconds
            date = datetime.fromtimestamp(timestamp).replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Get current global data for approximation
            btc_dominance = global_data['data']['market_cap_percentage'].get('btc', 40.0)
            total_mcap = btc_mcaps[i][1] / (btc_dominance / 100) if btc_dominance > 0 else btc_mcaps[i][1] * 2.5
            
            crypto_price = CryptoPrice(
                date=date,
                btc_usd=btc_prices[i][1],
                eth_usd=eth_prices[i][1],
                total_crypto_mcap=total_mcap / 1_000_000_000,  # Convert to billions
                btc_dominance=btc_dominance,
                btc_gold_ratio=None,  # Will be calculated
                btc_volume_24h=btc_volumes[i][1] if i < len(btc_volumes) else None,
                source='COINGECKO'
            )
            db.add(crypto_price)
            added += 1
            
            if added % 10 == 0:
                print(f"    {added}/{days} days processed...")
        
        db.commit()
        print(f"\n✅ Added {added} real crypto price records from CoinGecko")
        
    except Exception as e:
        print(f"❌ Error fetching crypto data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fetch_crypto_history(90)
