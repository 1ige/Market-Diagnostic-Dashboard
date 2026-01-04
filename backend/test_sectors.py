from app.services.sector_projection import fetch_sector_price_history, compute_sector_projections, HORIZONS, SECTOR_ETFS, BENCHMARK
import pandas as pd
import numpy as np

print("Fetching price data...")
price_data = fetch_sector_price_history()
print(f"Fetched {len(price_data)} symbols")

# Test with just 3m horizon manually
horizon = "3m"
lookback = HORIZONS[horizon]
print(f"\nTesting {horizon} (lookback={lookback})")

etf = SECTOR_ETFS[0]  # XLE
sym = etf["symbol"]
df = price_data.get(sym)
spy = price_data.get(BENCHMARK["symbol"])

print(f"XLE rows: {len(df)}, SPY rows: {len(spy)}")
print(f"XLE columns: {list(df.columns)}")
print(f"XLE first value: {df['value'].iloc[0]}, last: {df['value'].iloc[-1]}")

# Align and slice
df = df.sort_values("date").reset_index(drop=True)
spy = spy.sort_values("date").reset_index(drop=True)
common_dates = set(df["date"]).intersection(set(spy["date"]))
df = df[df["date"].isin(common_dates)]
spy = spy[spy["date"].isin(common_dates)]
df = df.iloc[-(lookback+1):]
spy = spy.iloc[-(lookback+1):]

print(f"After slicing: XLE {len(df)} rows")

# Calculate metrics
ret = (df["value"].iloc[-1] / df["value"].iloc[0]) - 1
print(f"Return: {ret}")

vol = df["value"].pct_change().rolling(20).std().iloc[-1] * np.sqrt(252)
print(f"Vol: {vol}")

print("\n" + "="*50)
print("Full projection computation:")
proj = compute_sector_projections(price_data, 'RED')
print(f"Projections: {len(proj)} computed")

if proj:
    three_m = [p for p in proj if p['horizon'] == '3m']
    print(f"\n3m projections: {len(three_m)}")
    for p in three_m[:3]:
        print(f"  {p['sector_name']}: score={p['score_total']:.2f}, rank={p['rank']}")

