"""
Market Map API Endpoints - Version 2

Improved reliability using yfinance batch downloads instead of individual ticker fetching.
"""

from typing import Dict, Any, List
from fastapi import APIRouter
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd

router = APIRouter()

# Cache
_cache = {"data": None, "timestamp": None, "intraday": None, "intraday_timestamp": None}
CACHE_TTL = 300  # 5 minutes

# S&P 500 Sectors (GICS classification)
SP500_SECTORS = {
    "Technology": ["AAPL", "MSFT", "NVDA", "AVGO", "CRM", "ORCL", "CSCO", "ADBE", "ACN", "AMD", 
                   "NOW", "TXN", "QCOM", "INTU", "AMAT", "PANW", "MU", "ADI", "INTC", "KLAC",
                   "LRCX", "SNPS", "CDNS", "APH", "MSI", "ADSK", "ROP", "FTNT", "FICO", "ANSS",
                   "TEL", "IT", "KEYS", "IBM", "TYL", "MPWR", "ZBRA", "STX", "AKAM", "NTAP",
                   "PTC", "TER", "GLW", "HPQ", "WDC", "FFIV", "JNPR", "SMCI", "GEN"],
    
    "Financials": ["BRK.B", "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "SPGI", "BLK",
                   "C", "AXP", "PGR", "CB", "MMC", "BX", "ICE", "CME", "AON", "TFC",
                   "USB", "FI", "PNC", "COF", "AIG", "MET", "PRU", "AFL", "ALL", "TRV",
                   "AJG", "HIG", "MSCI", "AMP", "WTW", "MCO", "BK", "STT", "TROW", "DFS",
                   "MTB", "SYF", "RF", "FITB", "CFG", "KEY", "HBAN", "WRB", "CINF", "L",
                   "NTRS", "GL", "BRO", "IVZ", "JKHY", "CBOE", "FDS", "BEN", "EG", "RJF", "ZION"],
    
    "Health Care": ["LLY", "UNH", "JNJ", "ABBV", "MRK", "TMO", "ABT", "DHR", "AMGN", "ISRG",
                    "PFE", "BSX", "VRTX", "SYK", "ELV", "GILD", "MDT", "CI", "REGN", "ZTS",
                    "MCK", "CVS", "BDX", "HCA", "COR", "EW", "A", "IQV", "RMD", "IDXX",
                    "HUM", "DXCM", "CNC", "MTD", "WST", "WAT", "STE", "ZBH", "LH", "ALGN",
                    "HOLX", "PODD", "MOH", "DGX", "BAX", "TFX", "UHS", "VTRS", "INCY", "TECH",
                    "COO", "BIO", "HSIC", "DVA", "RVTY", "CRL"],
    
    "Consumer Discretionary": ["AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "SBUX", "TJX", "BKNG", "CMG",
                                "AZO", "ORLY", "MAR", "GM", "F", "ABNB", "DHI", "YUM", "DECK", "LULU",
                                "ROST", "HLT", "GRMN", "LEN", "ULTA", "PHM", "GPC", "DRI", "LVS", "TSCO",
                                "POOL", "NVR", "EXPE", "TPR", "BBY", "WHR", "KMX", "DPZ", "MHK", "RL",
                                "CZR", "LKQ", "APTV", "MGM", "HAS"],
    
    "Communication Services": ["META", "GOOGL", "GOOG", "NFLX", "DIS", "CMCSA", "VZ", "T", "TMUS", "CHTR",
                               "EA", "TTWO", "WBD", "OMC", "LYV", "PARA", "FOXA", "FOX", "MTCH", "NWSA",
                               "IPG", "NYT"],
    
    "Industrials": ["GE", "CAT", "RTX", "UNP", "HON", "UPS", "BA", "ADP", "DE", "LMT",
                    "GD", "TDG", "ETN", "ITW", "WM", "PH", "MMM", "EMR", "PCAR", "NSC",
                    "CSX", "FDX", "NOC", "JCI", "CARR", "GWW", "CMI", "PAYX", "RSG", "ODFL",
                    "URI", "PWR", "FAST", "AME", "OTIS", "VRSK", "DAL", "AXON", "HWM", "IR",
                    "ROK", "SWK", "UAL", "CPRT", "DOV", "EFX", "HUBB", "XYL", "VLTO", "BR",
                    "LUV", "LDOS", "IEX", "BLDR", "J", "EXPD", "SNA", "PNR", "TXT", "JBHT",
                    "CHRW", "LHX", "WAB", "ALLE", "MAS", "AOS", "GNRC"],
    
    "Consumer Staples": ["WMT", "PG", "COST", "KO", "PEP", "PM", "MO", "MDLZ", "CL", "TGT",
                         "GIS", "KMB", "MNST", "SYY", "KHC", "HSY", "K", "CHD", "CLX", "TSN",
                         "HRL", "MKC", "CAG", "SJM", "LW", "TAP", "CPB", "BG", "KDP"],
    
    "Energy": ["XOM", "CVX", "COP", "EOG", "SLB", "PSX", "MPC", "VLO", "OXY", "WMB",
               "HES", "KMI", "BKR", "HAL", "MRO", "LNG", "TRGP", "FANG", "DVN", "CTRA",
               "APA", "EQT"],
    
    "Utilities": ["NEE", "SO", "DUK", "CEG", "SRE", "AEP", "D", "PEG", "EXC", "XEL",
                  "ES", "ED", "EIX", "ETR", "WEC", "AWK", "DTE", "PPL", "AEE", "FE",
                  "CMS", "CNP", "NRG", "ATO", "NI", "LNT", "EVRG", "PNW"],
    
    "Materials": ["LIN", "APD", "SHW", "ECL", "FCX", "CTVA", "NEM", "DD", "DOW", "VMC",
                  "NUE", "MLM", "PPG", "STLD", "IFF", "ALB", "BALL", "CE", "EMN", "SW",
                  "MOS", "FMC", "AVY", "CF", "IP"],
    
    "Real Estate": ["AMT", "PLD", "EQIX", "CCI", "PSA", "WELL", "SPG", "DLR", "O", "SBAC",
                    "EQR", "AVB", "WY", "VICI", "VTR", "ARE", "INVH", "EXR", "MAA", "ESS",
                    "DOC", "KIM", "HST", "UDR", "CPT", "REG", "FRT", "BXP", "PEAK", "AIV"],
}


def fetch_all_stocks(days: int = 5) -> Dict[str, List[Dict[str, Any]]]:
    """
    Fetch all S&P 500 stocks using yfinance batch download - much more reliable.
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days + 5)  # Extra days for safety
    
    # Flatten all tickers
    all_tickers = []
    ticker_to_sector = {}
    for sector, tickers in SP500_SECTORS.items():
        for ticker in tickers:
            all_tickers.append(ticker)
            ticker_to_sector[ticker] = sector
    
    print(f"\ud83d\udcca Fetching {len(all_tickers)} stocks via batch download...")
    
    try:
        # Single batch download - most reliable method
        data = yf.download(
            tickers=all_tickers,
            start=start_date,
            end=end_date,
            group_by='ticker',
            auto_adjust=False,
            prepost=False,
            threads=True,
            progress=False,
            timeout=60
        )
        
        # Process results
        stock_data = {}
        for ticker in all_tickers:
            try:
                if len(all_tickers) == 1:
                    ticker_data = data
                else:
                    ticker_data = data[ticker]
                
                if ticker_data.empty or len(ticker_data) < 2:
                    continue
                
                latest = ticker_data.iloc[-1]
                previous = ticker_data.iloc[-2]
                
                # Validate
                if pd.isna(latest['Close']) or pd.isna(previous['Close']):
                    continue
                if previous['Close'] <= 0 or latest['Volume'] <= 0 or latest['Close'] <= 0:
                    continue
                
                pct_change = ((latest['Close'] - previous['Close']) / previous['Close']) * 100
                
                stock_data[ticker] = {
                    "ticker": ticker,
                    "price": float(latest['Close']),
                    "pct_change": float(pct_change),
                    "volume": int(latest['Volume']),
                    "market_cap": float(latest['Volume'] * latest['Close'])
                }
            except Exception as e:
                continue
        
        # Organize by sector
        sector_results = {}
        for sector, tickers in SP500_SECTORS.items():
            sector_stocks = []
            for ticker in tickers:
                if ticker in stock_data:
                    sector_stocks.append(stock_data[ticker])
            
            sector_results[sector] = sector_stocks
            
            # Log
            success_rate = (len(sector_stocks) / len(tickers)) * 100 if tickers else 0
            if success_rate == 100:
                print(f"\u2705 {sector}: {len(sector_stocks)}/{len(tickers)}")
            elif success_rate >= 50:
                print(f"\u26a0\ufe0f  {sector}: {len(sector_stocks)}/{len(tickers)} ({success_rate:.0f}%)")
            else:
                print(f"\u274c {sector}: {len(sector_stocks)}/{len(tickers)} ({success_rate:.0f}%)")
        
        total = sum(len(s) for s in sector_results.values())
        print(f"\n\ud83c\udfaf Total: {total}/{len(all_tickers)} stocks ({100*total/len(all_tickers):.1f}%)\n")
        
        return sector_results
        
    except Exception as e:
        print(f"\u274c Batch download failed: {e}")
        return {sector: [] for sector in SP500_SECTORS.keys()}


@router.get("/market-map/data")
async def get_market_map_data(days: int = 5):
    """Get S&P 500 market map data organized by sector."""
    global _cache
    
    # Check cache
    now = datetime.now()
    if _cache["data"] and _cache["timestamp"]:
        age = (now - _cache["timestamp"]).total_seconds()
        if age < CACHE_TTL:
            print(f"\ud83d\udce6 Cache hit (age: {int(age)}s)")
            return _cache["data"]
    
    # Fetch fresh data
    sector_results = fetch_all_stocks(days)
    
    # Format response
    formatted_sectors = []
    for sector_name, stocks in sector_results.items():
        if stocks:  # Only include sectors with data
            avg_pct = sum(s["pct_change"] for s in stocks) / len(stocks)
            formatted_sectors.append({
                "name": sector_name,
                "pct_change": avg_pct,
                "stocks": stocks
            })
    
    result = {
        "week_performance": [],
        "sectors": formatted_sectors
    }
    
    # Update cache
    _cache["data"] = result
    _cache["timestamp"] = now
    
    return result


@router.get("/market-map/spy-intraday")
async def get_spy_intraday():
    """Get intraday data for SPY, DJI, RTY indices."""
    global _cache
    
    # Check cache
    now = datetime.now()
    if _cache["intraday"] and _cache["intraday_timestamp"]:
        age = (now - _cache["intraday_timestamp"]).total_seconds()
        if age < CACHE_TTL:
            return _cache["intraday"]
    
    # Fetch fresh data
    end_date = now
    start_date = end_date - timedelta(days=7)
    
    indices = {"SPY": "SPY", "DJI": "^DJI", "RTY": "^RUT"}
    all_data = []
    
    for index_name, ticker_symbol in indices.items():
        try:
            ticker = yf.Ticker(ticker_symbol)
            data = ticker.history(start=start_date, end=end_date, interval="15m", timeout=30, prepost=False)
            
            if data.empty:
                continue
            
            data['Date'] = data.index.date
            unique_dates = data['Date'].unique()[-5:]
            
            for date in unique_dates:
                day_data = data[data['Date'] == date]
                if not day_data.empty:
                    day_start = day_data.iloc[0]['Open']
                    day_name = pd.Timestamp(date).strftime("%A")
                    
                    for timestamp, row in day_data.iterrows():
                        pct_from_open = ((row['Close'] - day_start) / day_start) * 100
                        
                        all_data.append({
                            "timestamp": timestamp.isoformat(),
                            "date": str(date),
                            "day_name": day_name,
                            "price": float(row['Close']),
                            "pct_change": float(pct_from_open),
                            "hour": timestamp.hour,
                            "index": index_name
                        })
            
            print(f"\u2705 {index_name} intraday: {len(unique_dates)} days")
        except Exception as e:
            print(f"\u274c {index_name} intraday failed: {e}")
    
    result = {"data": all_data}
    
    # Update cache
    _cache["intraday"] = result
    _cache["intraday_timestamp"] = now
    
    return result
