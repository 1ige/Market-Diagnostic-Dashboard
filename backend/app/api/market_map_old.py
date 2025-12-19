"""
Market Map API Endpoints

This module provides real-time S&P 500 market visualization data.

Features:
- Fetches daily performance and volume data for all S&P 500 stocks
- Groups stocks by sector (11 GICS sectors)
- Provides intraday SPY performance with 15-minute granularity
- Implements caching and concurrent fetching for performance
- Retry logic to ensure maximum data coverage

Endpoints:
- GET /market-map/data: Main market map data (450+ stocks)
- GET /market-map/spy-intraday: Intraday SPY performance

Performance Optimizations:
- ThreadPoolExecutor with 15 workers for parallel fetching
- 5-minute server-side caching to reduce API calls
- Automatic retry with fallback methods for failed stocks

Data Sources:
- Yahoo Finance API via yfinance library
- Real-time and historical stock data
- GICS sector classifications

Author: Market Diagnostic Dashboard
Last Updated: 2025-12-18
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import yfinance as yf
from typing import Dict, List, Any, Optional
from collections import defaultdict
import pandas as pd
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache

router = APIRouter()

# =============================================================================
# CONFIGURATION
# =============================================================================

# Cache configuration - stores fetched data to reduce API calls
# TTL: Time-to-live in seconds (5 minutes = 300 seconds)
_market_cache = {"data": None, "timestamp": None}
_intraday_cache = {"data": None, "timestamp": None}
CACHE_TTL = 300  # 5 minutes - adjust based on data freshness requirements

# Worker configuration for concurrent fetching
MAX_WORKERS = 15  # Balance between speed and rate limiting
FETCH_TIMEOUT = 25  # Seconds to wait for each stock fetch
RETRY_ATTEMPTS = 3  # Number of retry attempts per stock

# =============================================================================
# S&P 500 CONSTITUENTS BY SECTOR
# =============================================================================
# Full list of S&P 500 stocks grouped by GICS (Global Industry Classification Standard) sectors
# Last updated: December 2025
# Note: S&P 500 composition changes quarterly. Update this list as needed.
# Source: S&P Dow Jones Indices
#
# Sectors:
# 1. Technology (Information Technology)
# 2. Financials
# 3. Health Care
# 4. Discretionary (Consumer Discretionary)
# 5. Communication Services
# 6. Industrials
# 7. Staples (Consumer Staples)
# 8. Energy
# 9. Utilities
# 10. Materials
# 11. Real Estate
#
# Total: ~450 stocks (some may be delisted or replaced over time)
SP500_SECTORS = {
    "Technology": ["AAPL", "MSFT", "NVDA", "AVGO", "ORCL", "CSCO", "ADBE", "CRM", "INTC", "AMD", "NOW", "TXN", "QCOM", "INTU", "AMAT", "ADI", "MU", "LRCX", "KLAC", "SNPS", "CDNS", "MCHP", "FTNT", "ANSS", "ADSK", "PANW", "ANET", "ROP", "CRWD", "MPWR", "ZBRA", "KEYS", "GDDY", "TYL", "PTC", "VRSN", "TRMB", "JBL", "JNPR", "SWKS", "NTAP", "ENPH", "AKAM", "FFIV", "FICO"],
    "Financials": ["BRK.B", "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "C", "AXP", "SPGI", "BLK", "CB", "SCHW", "PGR", "AON", "MMC", "USB", "PNC", "TFC", "AIG", "AFL", "ALL", "MET", "PRU", "TRV", "AJG", "CME", "ICE", "MCO", "TROW", "BK", "FITB", "FIS", "AMP", "COF", "DFS", "SYF", "RF", "HBAN", "KEY", "CFG", "WRB", "L", "CINF", "NTRS", "GL", "IVZ", "ZION", "BEN", "CBOE"],
    "Health Care": ["UNH", "JNJ", "LLY", "ABBV", "MRK", "CVS", "TMO", "ABT", "PFE", "AMGN", "DHR", "BMY", "MDT", "ISRG", "CI", "REGN", "VRTX", "SYK", "BSX", "GILD", "ELV", "ZTS", "HCA", "MCK", "CVS", "BDX", "IDXX", "EW", "RMD", "HUM", "COR", "IQV", "A", "MTD", "DXCM", "GEHC", "BIIB", "WST", "WAT", "STE", "LH", "HOLX", "ALGN", "PODD", "TECH", "MOH", "INCY", "VTRS", "CRL", "TFX", "HSIC"],
    "Discretionary": ["AMZN", "TSLA", "HD", "MCD", "NKE", "SBUX", "LOW", "TGT", "TJX", "BKNG", "CMG", "MAR", "GM", "F", "ABNB", "ORLY", "AZO", "DHI", "LEN", "YUM", "ROST", "HLT", "GPC", "BBY", "LVS", "EBAY", "EXPE", "POOL", "ULTA", "DRI", "TPR", "RL", "PHM", "WHR", "HAS", "LKQ", "APTV", "BWA", "KMX", "AAP", "CZR", "WYNN", "MGM", "NCLH", "RCL", "CCL", "MHK", "NVR", "TSCO", "DPZ"],
    "Communication Services": ["META", "GOOGL", "GOOG", "NFLX", "DIS", "CMCSA", "T", "VZ", "TMUS", "CHTR", "EA", "TTWO", "MTCH", "FOXA", "FOX", "OMC", "IPG", "PARA", "NWSA", "NWS", "LYV"],
    "Industrials": ["UNP", "CAT", "RTX", "BA", "HON", "UPS", "LMT", "DE", "GE", "MMM", "FDX", "NSC", "CSX", "EMR", "ITW", "GD", "NOC", "ETN", "PH", "CMI", "TT", "CARR", "PCAR", "ODFL", "JCI", "WM", "RSG", "GWW", "FAST", "PAYX", "VRSK", "IEX", "AME", "OTIS", "DAL", "UAL", "LUV", "AAL", "IR", "ROK", "XYL", "DOV", "FTV", "VLTO", "HUBB", "LDOS", "TXT", "J", "SWK", "CHRW", "JBHT", "EXPD"],
    "Staples": ["WMT", "PG", "COST", "KO", "PEP", "PM", "MO", "CL", "MDLZ", "KMB", "GIS", "STZ", "SYY", "HSY", "K", "CHD", "CLX", "TSN", "MKC", "CPB", "CAG", "HRL", "SJM", "KHC", "LW", "TAP", "EL", "KR", "DG", "DLTR"],
    "Energy": ["XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO", "OXY", "KMI", "WMB", "OKE", "HAL", "DVN", "HES", "FANG", "BKR", "TRGP", "LNG", "MRO", "APA", "CTRA"],
    "Utilities": ["NEE", "DUK", "SO", "D", "AEP", "EXC", "SRE", "PCG", "XEL", "ES", "ED", "WEC", "DTE", "PEG", "EIX", "AWK", "PPL", "FE", "AEE", "CMS", "ETR", "EVRG", "ATO", "CNP", "NI", "LNT", "PNW", "NRG"],
    "Materials": ["LIN", "APD", "SHW", "FCX", "NEM", "ECL", "CTVA", "NUE", "DD", "DOW", "ALB", "VMC", "MLM", "PPG", "EMN", "BALL", "AVY", "CF", "MOS", "FMC", "CE", "IP", "PKG", "AMCR", "SEE"],
    "Real Estate": ["AMT", "PLD", "CCI", "EQIX", "PSA", "WELL", "DLR", "O", "SPG", "AVB", "EQR", "VTR", "WY", "SBAC", "INVH", "ARE", "VICI", "ESS", "MAA", "EXR", "KIM", "DOC", "UDR", "CPT", "HST", "REG", "FRT", "BXP", "VNO", "IRM"]
}


# =============================================================================
# DATA FETCHING FUNCTIONS
# =============================================================================

def fetch_stock_data(ticker: str, start_date: datetime, end_date: datetime, retries: int = RETRY_ATTEMPTS) -> Optional[Dict[str, Any]]:
    """
    Fetch latest stock data with comprehensive retry logic.
    
    This function attempts to fetch stock data using multiple methods to ensure
    maximum reliability. It tries date ranges, period-based queries, and implements
    progressive retry delays.
    
    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL', 'MSFT')
        start_date: Start date for historical data
        end_date: End date for historical data
        retries: Number of retry attempts (default: RETRY_ATTEMPTS constant)
    
    Returns:
        Dictionary containing stock data:
            - ticker: Stock symbol
            - price: Current price
            - pct_change: Percentage change from previous close
            - volume: Trading volume
            - market_cap: Rough market cap estimate (volume * price)
        
        Returns None if data cannot be fetched after all retries
    
    Fetch Strategy:
        1. Try date range query (most precise)
        2. Try 5-day period query (more reliable)
        3. Try 1-month period query (fallback)
        4. Try 3-month period query (extended fallback)
        5. Implement progressive delays between retries
    
    Error Handling:
        - Validates data before returning (volume > 0, price > 0)
        - Logs failures for debugging
        - Returns None for truly unavailable data
    """
    import time
    
    for attempt in range(retries):
        try:
            stock = yf.Ticker(ticker)
            hist = None
            
            # FETCH STRATEGY: Try multiple methods with increasing fallback scope
            
            # Method 1: Date range query (most precise for specific timeframe)
            try:
                hist = stock.history(start=start_date, end=end_date, timeout=30, prepost=False)
            except Exception as e:
                # Silent failure, will try next method
                pass
            
            # Method 2: Period-based query (more reliable, uses Yahoo's shortcuts)
            if hist is None or hist.empty or len(hist) < 2:
                time.sleep(0.3 * attempt)  # Progressive delay to avoid rate limiting
                try:
                    hist = stock.history(period="5d", timeout=30, prepost=False)
                except:
                    pass
            
            # Method 3: Extended period as fallback (1 month of data)
            if hist is None or hist.empty or len(hist) < 2:
                time.sleep(0.3 * attempt)
                try:
                    hist = stock.history(period="1mo", timeout=30, prepost=False)
                except:
                    pass
            
            # Method 4: Even longer period as final fallback (3 months)
            if hist is None or hist.empty or len(hist) < 2:
                time.sleep(0.3 * attempt)
                try:
                    hist = stock.history(period="3mo", timeout=30, prepost=False)
                except:
                    pass
                
            # VALIDATION: Check if we have sufficient data
            if hist is None or hist.empty or len(hist) < 2:
                if attempt < retries - 1:
                    # Not last attempt - retry with exponential backoff
                    time.sleep(0.5 * (attempt + 1))
                    continue
                else:
                    # Last attempt failed - log and return None
                    print(f"⚠️  No data available for {ticker} after {retries} attempts")
                    return None
            
            # CALCULATE METRICS: Extract latest trading data
            latest = hist.iloc[-1]    # Most recent trading day
            previous = hist.iloc[-2]  # Previous trading day for comparison
            
            # Percentage change from previous close
            pct_change = ((latest['Close'] - previous['Close']) / previous['Close']) * 100
            volume = float(latest['Volume'])
            
            # DATA VALIDATION: Ensure values are sensible
            if volume <= 0 or latest['Close'] <= 0:
                print(f"⚠️  Invalid data for {ticker} (volume={volume}, price={latest['Close']})")
                return None
            
            return {
                "ticker": ticker,
                "price": float(latest['Close']),
                "pct_change": float(pct_change),
                "volume": volume,
                "market_cap": volume * latest['Close']
            }
            
        except Exception as e:
            if attempt == retries - 1:
                print(f"❌ Error fetching {ticker} after {retries} attempts: {str(e)[:100]}")
            time.sleep(0.3 * (attempt + 1))
    
    return None


@router.get("/market-map/data")
async def get_market_map_data(days: int = 5):
    """
    Get S&P 500 Market Map Data
    
    Fetches current performance, volume, and sector data for all S&P 500 stocks.
    This is the primary endpoint for the Market Map visualization.
    
    Query Parameters:
        days (int): Number of trading days to analyze (default: 5)
            - Used for calculating week performance
            - Typically set to 5 for one trading week
    
    Returns:
        JSON object containing:
            - week_performance: Array of daily SPY performance
                - date: ISO date string
                - day_name: Day of week (Monday, Tuesday, etc.)
                - close: Closing price
                - pct_change: Percentage change from previous close
            
            - sectors: Array of sector objects
                - name: Sector name (e.g., "Technology", "Financials")
                - pct_change: Average sector performance
                - stocks: Array of stock objects
                    - ticker: Stock symbol
                    - price: Current price
                    - pct_change: Daily percentage change
                    - volume: Trading volume
                    - market_cap: Rough estimate (volume * price)
    
    Performance:
        - First request: ~15-30 seconds (fetches all stocks)
        - Cached requests: <1 second (returns cached data)
        - Cache TTL: 5 minutes
        - Concurrent workers: 15 parallel requests
    
    Error Handling:
        - Individual stock failures don't prevent sector data return
        - Failed stocks are logged but don't raise exceptions
        - Returns partial data if some stocks fail
    
    Rate Limiting:
        - Implements automatic retries with backoff
        - Uses multiple fetch strategies per stock
        - Respects Yahoo Finance rate limits
    
    Example Response:
        {
            "week_performance": [
                {"date": "2025-12-18", "day_name": "Wednesday", "close": 478.5, "pct_change": 0.7}
            ],
            "sectors": [
                {
                    "name": "Technology",
                    "pct_change": 1.2,
                    "stocks": [
                        {"ticker": "AAPL", "price": 195.5, "pct_change": 1.5, "volume": 50000000, ...}
                    ]
                }
            ]
        }
    """
    try:
        # CACHE CHECK: Return cached data if still valid
        now = datetime.now()
        if _market_cache["data"] and _market_cache["timestamp"]:
            age = (now - _market_cache["timestamp"]).total_seconds()
            if age < CACHE_TTL:
                print(f"📦 Returning cached market data (age: {age:.0f}s)")
                return _market_cache["data"]
        
        # SETUP: Calculate date range for historical data
        end_date = now
        start_date = end_date - timedelta(days=days + 10)  # Extra days to ensure enough trading days
        
        result = {
            "week_performance": [],  # Will hold daily SPY performance
            "sectors": []            # Will hold all sector data
        }
        
        # FETCH SPY DATA: Get overall market benchmark performance
        spy = yf.Ticker("SPY")
        spy_data = spy.history(start=start_date, end=end_date)
        
        if not spy_data.empty:
            spy_data = spy_data.tail(days)
            for idx, (date, row) in enumerate(spy_data.iterrows()):
                prev_close = spy_data.iloc[idx - 1]['Close'] if idx > 0 else row['Open']
                pct_change = ((row['Close'] - prev_close) / prev_close) * 100
                
                result["week_performance"].append({
                    "date": date.strftime("%Y-%m-%d"),
                    "day_name": date.strftime("%A"),
                    "close": float(row['Close']),
                    "pct_change": float(pct_change)
                })
        
        # Fetch all stocks concurrently using ThreadPoolExecutor
        # Use moderate workers to balance speed and reliability
        print(f"\n{'='*60}")
        print(f"Starting market data fetch at {now.strftime('%H:%M:%S')}")
        print(f"{'='*60}\n")
        
        with ThreadPoolExecutor(max_workers=15) as executor:
            for sector_name, tickers in SP500_SECTORS.items():
                print(f"📊 {sector_name}: Fetching {len(tickers)} stocks...")
                
                # Submit all tickers in this sector concurrently
                futures = {executor.submit(fetch_stock_data, ticker, start_date, end_date): ticker 
                          for ticker in tickers}
                
                sector_stocks = []
                sector_total_change = 0
                valid_stocks = 0
                failed_tickers = []
                
                # Collect results as they complete
                from concurrent.futures import as_completed
                for future in as_completed(futures, timeout=30):
                    ticker = futures[future]
                    try:
                        stock_data = future.result(timeout=25)
                        if stock_data:
                            sector_stocks.append(stock_data)
                            sector_total_change += stock_data["pct_change"]
                            valid_stocks += 1
                        else:
                            failed_tickers.append(ticker)
                    except TimeoutError:
                        print(f"⏱️  Timeout for {ticker}")
                        failed_tickers.append(ticker)
                    except Exception as e:
                        print(f"❌ Future exception for {ticker}: {str(e)[:50]}")
                        failed_tickers.append(ticker)
                
                # Log results
                success_rate = (valid_stocks / len(tickers)) * 100 if tickers else 0
                status = "✅" if success_rate >= 90 else "⚠️" if success_rate >= 70 else "❌"
                print(f"{status} {sector_name}: {valid_stocks}/{len(tickers)} stocks ({success_rate:.1f}%)")
                
                if failed_tickers and len(failed_tickers) <= 10:
                    print(f"   Failed: {', '.join(failed_tickers)}")
                elif failed_tickers:
                    print(f"   Failed: {', '.join(failed_tickers[:10])} ... and {len(failed_tickers)-10} more")
                
                # Always add sector even if some stocks failed
                if valid_stocks > 0:
                    result["sectors"].append({
                        "name": sector_name,
                        "pct_change": sector_total_change / valid_stocks,
                        "stocks": sector_stocks
                    })
                else:
                    print(f"⚠️  WARNING: No stocks fetched for {sector_name}!")
        
        print(f"\n{'='*60}")
        print(f"Fetch completed - {sum(len(s['stocks']) for s in result['sectors'])} total stocks")
        print(f"{'='*60}\n")
        
        # Update cache
        _market_cache["data"] = result
        _market_cache["timestamp"] = now
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching market map data: {str(e)}")


@router.get("/market-map/spy-intraday")
async def get_spy_intraday():
    """
    Get Major Index Intraday Performance Data
    
    Fetches high-resolution intraday price data for major market indices with
    15-minute intervals across the last 5 trading days. Includes:
    - SPY: S&P 500 ETF
    - ^DJI: Dow Jones Industrial Average
    - ^RUT: Russell 2000 Index
    
    Used for the detailed week performance chart in the Market Map view.
    
    Returns:
        JSON object containing:
            - data: Array of intraday data points
                - timestamp: ISO timestamp of the data point
                - date: Date string (YYYY-MM-DD)
                - day_name: Day of week
                - price: SPY price at that time
                - pct_change: Percentage change from day's open
                - hour: Hour of trading day (for filtering/grouping)
    
    Performance:
        - Interval: 15 minutes (26 data points per trading day)
        - Coverage: Last 5 trading days (~130 data points)
        - Cache TTL: 5 minutes
        - Typical response time: <2 seconds (1-5s first fetch, <1s cached)
    
    Data Characteristics:
        - Only includes regular trading hours (9:30 AM - 4:00 PM ET)
        - Percentage change resets at market open each day
        - Provides detailed price action vs daily snapshot
    
    Use Cases:
        - Detailed intraday trend visualization
        - Understanding volatility within trading days
        - Identifying key price movements by time of day
        - Showing market open/close patterns
    
    Example Response:
        {
            "data": [
                {
                    "timestamp": "2025-12-18T09:30:00-05:00",
                    "date": "2025-12-18",
                    "day_name": "Wednesday",
                    "price": 478.25,
                    "pct_change": 0.0,
                    "hour": 9
                },
                {
                    "timestamp": "2025-12-18T09:45:00-05:00",
                    "date": "2025-12-18",
                    "day_name": "Wednesday",
                    "price": 478.89,
                    "pct_change": 0.13,
                    "hour": 9
                }
            ]
        }
    """
    try:
        # Check cache
        now = datetime.now()
        if _intraday_cache["data"] and _intraday_cache["timestamp"]:
            age = (now - _intraday_cache["timestamp"]).total_seconds()
            if age < CACHE_TTL:
                return _intraday_cache["data"]
        
        # Fetch data for all three indices
        end_date = now
        start_date = end_date - timedelta(days=7)  # Extra days to ensure we get 5 trading days
        
        indices = {
            "SPY": "SPY",      # S&P 500 ETF
            "DJI": "^DJI",     # Dow Jones Industrial Average
            "RTY": "^RUT"      # Russell 2000
        }
        
        result = {"data": []}
        
        # Fetch each index with error handling
        for index_name, ticker_symbol in indices.items():
            try:
                ticker = yf.Ticker(ticker_symbol)
                data = ticker.history(start=start_date, end=end_date, interval="15m", timeout=20)
                
                if data.empty:
                    print(f"⚠️  No intraday data for {index_name} ({ticker_symbol})")
                    continue
                
                # Process intraday data
                data['Date'] = data.index.date
                
                # Get the last 5 unique trading days
                unique_dates = data['Date'].unique()[-5:]
                
                for date in unique_dates:
                    day_data = data[data['Date'] == date]
                    if not day_data.empty:
                        day_start = day_data.iloc[0]['Open']
                        day_name = pd.Timestamp(date).strftime("%A")
                        
                        for timestamp, row in day_data.iterrows():
                            pct_from_open = ((row['Close'] - day_start) / day_start) * 100
                            
                            result["data"].append({
                                "timestamp": timestamp.isoformat(),
                                "date": str(date),
                                "day_name": day_name,
                                "price": float(row['Close']),
                                "pct_change": float(pct_from_open),
                                "hour": timestamp.hour,
                                "index": index_name  # Identify which index this data point belongs to
                            })
                
                print(f"✅ Fetched intraday data for {index_name}: {len(unique_dates)} days")
                
            except Exception as e:
                print(f"❌ Error fetching {index_name} intraday: {e}")
                continue
        
        # Update cache
        _intraday_cache["data"] = result
        _intraday_cache["timestamp"] = now
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching SPY intraday data: {str(e)}")
