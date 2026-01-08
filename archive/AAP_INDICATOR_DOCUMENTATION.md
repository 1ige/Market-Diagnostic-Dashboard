# Alternative Asset Pressure (AAP) Indicator

## Technical Documentation & Implementation Guide

---

## Executive Summary

The **Alternative Asset Pressure (AAP)** indicator is a composite macro diagnostic that measures systemic pressure away from traditional financial assets toward alternative stores of value (precious metals and cryptocurrencies). It is designed as a **regime and trust diagnostic**, not a price momentum or trading signal.

### Core Invariant

**Stability Score: 0-100 scale**
- **100** = Maximum confidence in traditional system, minimal alternative asset pressure
- **0** = Maximum systemic distrust, extreme pressure toward alternatives

Higher score = More stable traditional system  
Lower score = Greater alternative asset accumulation / monetary stress

---

## Indicator Architecture

### Conceptual Framework

```
AAP Stability Score = 100 - (Pressure_Index × 100)

Pressure_Index = (
    0.50 × Metals_Pressure_Component +
    0.50 × Crypto_Pressure_Component
) × Cross_Asset_Confidence_Multiplier

Where:
- Metals_Pressure_Component: 0-1 scale (higher = more pressure)
- Crypto_Pressure_Component: 0-1 scale (higher = more pressure)
- Cross_Asset_Confidence_Multiplier: 0.6-1.4 (amplifies coordinated signals)
```

### Component Weights

#### Metals Subsystem (50% total)

**A. Monetary Metals Strength (20%)**
| Component | Weight | Signal |
|-----------|--------|--------|
| Gold/USD z-score | 3.5% | Rising gold = declining fiat confidence |
| Gold vs Real Rates divergence | 4.0% | Gold up + high real rates = distrust |
| CB gold accumulation | 2.5% | Central bank buying = institutional distrust |
| Silver/USD z-score | 2.0% | Silver strength = monetary stress |

**B. Metals Ratio Signals (15%)**
| Component | Weight | Signal |
|-----------|--------|--------|
| Gold/Silver ratio | 6.0% | High GSR (>85) = defensive regime |
| Platinum/Gold ratio | 5.0% | Low Pt/Au = industrial pessimism |
| Palladium/Gold ratio | 4.0% | Low Pd/Au = weak industrial demand |

**C. Physical vs Paper Stress (15%)**
| Component | Weight | Signal |
|-----------|--------|--------|
| COMEX stress ratio | 6.0% | High OI/registered = paper squeeze risk |
| Backwardation | 5.0% | Persistent backwardation = physical premium |
| ETF flow divergence | 4.0% | Outflows + price strength = shortage |

#### Crypto Subsystem (50% total)

**A. Bitcoin as Monetary Barometer (20%)**
| Component | Weight | Signal |
|-----------|--------|--------|
| BTC/USD z-score | 7.0% | BTC outperformance = alternative bid |
| BTC/Gold ratio | 7.0% | BTC vs gold relative strength |
| BTC vs real rates break | 6.0% | BTC up + high rates = monetary distrust |

**B. Crypto Market Structure (15%)**
| Component | Weight | Signal |
|-----------|--------|--------|
| Crypto mcap / global M2 | 7.0% | Rising ratio = monetary escape |
| BTC dominance momentum | 5.0% | Rising dominance = flight to hardest crypto |
| Altcoin vs BTC | 3.0% | Weak alts = defensive crypto posture |

**C. Crypto vs Liquidity (15%)**
| Component | Weight | Signal |
|-----------|--------|--------|
| Crypto vs Fed balance sheet | 8.0% | Crypto up + QT = deep decoupling |
| Crypto QT resilience | 7.0% | Strength during tightening = distrust |

### Cross-Asset Confirmation Layer

The cross-asset multiplier adjusts the final pressure reading based on correlation patterns:

| Scenario | Multiplier | Interpretation |
|----------|-----------|----------------|
| Both metals & crypto elevated | 1.3× | Strong coordinated signal |
| One elevated, one neutral | 1.0× | Mixed, single-driver |
| Crypto up, metals flat | 0.7× | Likely speculative, not systemic |
| Both declining | 0.8× | No alternative pressure |
| Fed tightening + both rising | +0.1 | Enhanced systemic stress |
| High VIX + both rising | +0.15 | Crisis amplification |

---

## Regime Classification

### Score Ranges

| Score Range | Regime | Interpretation |
|------------|--------|----------------|
| 90-100 | **NORMAL CONFIDENCE** | Traditional assets trusted, alternatives diversifying |
| 70-89 | **MILD CAUTION** | Early hedging behavior, monitor for acceleration |
| 40-69 | **MONETARY STRESS** | Coordinated alternative strength, policy uncertainty |
| 20-39 | **LIQUIDITY CRISIS** | Sharp reallocation, paper/physical divergences |
| 0-19 | **SYSTEMIC BREAKDOWN** | Flight from fiat, regime change questions |

### Regime Characteristics

#### NORMAL CONFIDENCE (90-100)
- **Metals**: Range-bound, industrial metals leading precious
- **Crypto**: Correlating with tech/risk assets
- **Implication**: System functioning normally, use equities/credit
- **Watch For**: Early signs of alternative accumulation

#### MILD CAUTION (70-89)
- **Metals**: Gold beginning to outperform
- **Crypto**: Bitcoin showing relative strength
- **Implication**: Hedging activity emerging
- **Watch For**: Coordination between metals and crypto

#### MONETARY STRESS (40-69)
- **Metals**: Gold/Silver outperforming, GSR elevated
- **Crypto**: BTC dominance rising, alts weak
- **Implication**: Inflation fears, policy uncertainty
- **Watch For**: Physical market stress, liquidity tightening

#### LIQUIDITY CRISIS (20-39)
- **Metals**: Backwardation, ETF outflows with price strength
- **Crypto**: Decoupling from risk assets
- **Implication**: Collateral calls, dollar shortage paradox
- **Watch For**: Forced liquidations, central bank intervention

#### SYSTEMIC BREAKDOWN (0-19)
- **Metals**: Vertical moves, extreme ratio dislocations
- **Crypto**: Bitcoin as last refuge
- **Implication**: Monetary regime questions active
- **Watch For**: Emergency policy actions, currency crises

---

## Historical Context Examples

### March 2020 (COVID Crash)

**Phase 1: Initial Liquidity Shock**
- Day 1-5: Score drops to **25** (liquidity crisis)
- Gold initially sold, BTC crashed (forced liquidation)
- Physical premiums exploded (paper/physical divergence)

**Phase 2: Policy Response**
- Day 15-30: Score **40-50** (monetary stress)
- Fed announces unlimited QE
- Gold and BTC rally sharply
- Alternative asset bid signals distrust in fiat response

### Q4 2022 (Fed Tightening Peak)

- Score: **60-70** (monetary stress)
- Crypto crashed from leverage unwind
- Gold resilient despite rising rates
- Cross-asset multiplier low (divergence penalty)
- Signal: Speculative excess clearing, not systemic crisis

### Hypothetical QE Return (Future Scenario)

**Initial Response**
- Score improves: **55 → 70** (stress easing)

**3 Months Later**
- Score paradoxically drops to **40**
- Both metals and crypto rally despite easing
- Interpretation: Deeper distrust - loss of faith in QE efficacy
- Multiplier captures regime shift

---

## Integration with Other Dashboard Indicators

### With Liquidity Proxy

| AAP Score | Liquidity | Interpretation |
|-----------|-----------|----------------|
| Low (<40) | Tight | **CRITICAL** - Coordinated system stress |
| Low (<40) | Loose | **PARADOX** - Loss of faith in QE |
| High (>70) | Tight | **NORMAL** - Tightening working as designed |
| High (>70) | Loose | **RISK-ON** - Normal liquidity conditions |

### With Bond Market Stability

| AAP Score | Bond Stress | Interpretation |
|-----------|-------------|----------------|
| Low | High | **SOVEREIGN CRISIS** - Full system questioning |
| Low | Low | **INFLATION PSYCHOLOGY** - Monetary not credit |
| High | High | **GROWTH SCARE** - Real economy, not monetary |
| High | Low | **STABLE** - Normal conditions |

### With Analyst Anxiety

| AAP Score | Anxiety | Interpretation |
|-----------|---------|----------------|
| Low | High | **CONFIRMATION** - Market aware of stress |
| Low | Low | **EARLY WARNING** - Market unaware |
| High | High | **FALSE ALARM** - Technical not systemic |

### Dashboard Priority Logic

```python
if AAP < 30 AND Liquidity < 40:
    ALERT: "CRITICAL SYSTEM STRESS"
    Priority: HIGHEST
    
elif AAP < 40 AND Bond_Stability < 35:
    ALERT: "SOVEREIGN RISK WARNING"
    Priority: HIGH
    
elif AAP < 50 AND Crypto_Component > Metals_Component:
    ALERT: "MONITOR - May be speculative excess"
    Priority: MEDIUM
    
else:
    Status: "Contextual reading - no priority alert"
```

---

## Implementation Details

### Data Sources

#### Crypto Data
- **Primary**: CoinGecko API (free tier)
- **Metrics**: BTC/ETH prices, total crypto mcap, BTC dominance
- **Frequency**: Daily snapshots
- **Alternative**: CoinCap, CryptoCompare

#### Precious Metals
- **Sources**: Existing metals API integration
- **Metrics**: Au, Ag, Pt, Pd prices; COMEX inventory; CB holdings
- **Frequency**: Daily for prices, monthly for CB data

#### Macro Liquidity
- **Primary**: FRED API (Federal Reserve Economic Data)
- **Metrics**: Fed balance sheet, federal funds rate, 10Y yield, CPI
- **Frequency**: Weekly for balance sheet, daily for rates

### Calculation Cadence

- **Component calculation**: Daily at market close
- **Regime classification**: Weekly rolling (avoid whipsaw)
- **Trend analysis**: Monthly for structural shifts
- **Z-score windows**: 20-30 days (short-term), 2 years (structural)

### Data Quality Safeguards

1. **Crypto Volatility Protection**
   - Use log returns, not raw prices
   - Cap daily contributions at 2σ
   - Require 3-day confirmation for regime shifts

2. **False Positive Prevention**
   - Check equity/crypto correlation
   - If ρ > 0.7, reduce crypto weight by 30%
   - Speculative filter active

3. **Circuit Breakers**
   - VIX > 40: Accelerate indicator response 2×
   - Flash "DEVELOPING" status during acute crises
   - Prevent lag during rapid events

4. **Data Completeness**
   - Require ≥80% of components available
   - Track data quality score (0-1)
   - Flag calculation warnings

---

## API Endpoints

### Core Endpoints

#### `GET /aap/current`
Returns most recent AAP reading with full context.

**Response:**
```json
{
  "date": "2026-01-08T00:00:00",
  "stability_score": 67.3,
  "regime": "mild_caution",
  "regime_confidence": 0.85,
  "primary_driver": "coordinated",
  "stress_type": "monetary",
  "metals_contribution": 0.18,
  "crypto_contribution": 0.15,
  "is_critical": false,
  "changes": {"1d": -2.1, "5d": -5.4},
  "interpretation": { /* detailed regime info */ }
}
```

#### `GET /aap/history?days=90`
Historical AAP values for charting.

#### `GET /aap/components/current`
Detailed component breakdown for diagnostics.

#### `GET /aap/regime/current`
Current regime with interpretation.

#### `GET /aap/dashboard`
Comprehensive dashboard summary (main display endpoint).

#### `POST /aap/calculate`
Manual calculation trigger (admin/dev).

---

## Pitfalls & Design Constraints

### Critical Guardrails

1. **Do NOT use as trading signal**
   - This is a slow-moving structural indicator
   - Short-term noise is explicitly filtered
   - Designed for regime diagnosis, not entries/exits

2. **Avoid over-weighting crypto volatility**
   - Crypto naturally more volatile than metals
   - Log transformations and caps essential
   - Cross-asset confirmation prevents false positives

3. **Context is everything**
   - AAP alone is insufficient for decisions
   - Must be read with Liquidity, Bonds, Sentiment
   - Dashboard integration is mandatory

4. **False positives during risk-on melts**
   - Crypto can rally on pure speculation
   - Check equity correlation to filter
   - Metals must confirm for systemic signal

5. **Data lag during acute crises**
   - Daily calculation means 24hr lag minimum
   - Circuit breakers help but not perfect
   - Use "DEVELOPING" status for uncertainty

### Implementation Warnings

- **Crypto data quality**: Multiple exchanges, potential discrepancies
- **CB holdings**: Quarterly only, interpolation unreliable
- **Global M2**: Complex to calculate, use estimates cautiously
- **COMEX data**: May be incomplete on weekends/holidays
- **Real rates**: CPI data lags, calculation may be stale

---

## Database Schema

### Tables

#### `crypto_prices`
- Daily crypto price snapshots
- BTC, ETH, total mcap, dominance
- BTC/Gold ratio pre-calculated

#### `macro_liquidity_data`
- Central bank balance sheets
- Interest rates and real rates
- Global M2 estimates

#### `aap_components`
- Detailed component calculations
- Full audit trail for debugging
- Subsystem pressure scores

#### `aap_indicator`
- Final indicator values
- Regime classification
- Rolling statistics and alerts

#### `aap_regime_history`
- Regime transition tracking
- Duration and characteristics
- Backtesting support

---

## Frontend Integration

### Dashboard Widget Design

**Primary Display:**
```
┌─────────────────────────────────────┐
│ Alternative Asset Pressure          │
│                                     │
│ Stability Score: 67.3  ▼ -2.1 (1d) │
│ Status: MILD CAUTION                │
│                                     │
│ Primary Driver: Coordinated         │
│ Stress Type: Monetary               │
│                                     │
│ [View Details] [Component Breakdown]│
└─────────────────────────────────────┘
```

**Color Coding:**
- 90-100: Green (Stable)
- 70-89: Yellow (Watch)
- 40-69: Orange (Caution)
- 20-39: Red (Warning)
- 0-19: Dark Red (Critical)

**Chart:**
- 90-day historical line chart
- Regime zones shaded
- Annotations for major events

---

## Testing & Validation

### Unit Tests Required

1. Component calculation accuracy
2. Z-score computation correctness
3. Cross-asset multiplier logic
4. Regime classification thresholds
5. Data quality checks

### Integration Tests

1. API endpoint responses
2. Database transactions
3. Scheduler integration
4. Error handling

### Backtesting

1. Historical regime identification
2. False positive rate analysis
3. Lead/lag vs actual crises
4. Cross-indicator correlation

---

## Maintenance & Monitoring

### Daily Checks

- Data ingestion success rate
- Component completeness percentage
- API response times
- Database query performance

### Weekly Reviews

- Regime stability/transitions
- Component contributions audit
- Data source health
- Cross-indicator coherence

### Monthly Analysis

- Regime accuracy review
- Weight adjustment consideration
- New data source evaluation
- User feedback integration

---

## Philosophy & Usage Guidelines

### Core Principles

1. **Treat alternatives as signals of trust, not bets**
   - Gold/crypto strength indicates systemic questions
   - Not a recommendation to buy/sell

2. **Assume crisis-period readership**
   - Clear, unambiguous messaging
   - Conservative classification (avoid false alarms)
   - Explicit uncertainty communication

3. **Conservative design**
   - False positives worse than late signals
   - Multiple confirmation layers
   - Slow-moving by design

4. **Contextual reading mandatory**
   - Never interpret AAP in isolation
   - Dashboard integration essential
   - Cross-indicator validation required

### Appropriate Use Cases

- Macro regime assessment
- Risk management framing
- Portfolio positioning context
- Central bank policy effectiveness monitoring
- Monetary system health diagnostic

### Inappropriate Use Cases

- Day trading signals
- Crypto/gold price predictions
- Short-term tactical allocation
- Single-indicator decision making
- Standalone investment advice

---

## Future Enhancements

### Phase 2 Additions

1. **Enhanced crypto signals**
   - On-chain metrics (wallet concentr ation)
   - Stablecoin dominance
   - DeFi TVL as liquidity proxy

2. **Improved metals data**
   - Futures curve analysis (backwardation)
   - ETF flow integration
   - Mining cost metrics

3. **Machine learning components**
   - Pattern recognition for regime shifts
   - Adaptive weighting based on conditions
   - Anomaly detection

4. **International coverage**
   - Emerging market currency stress
   - Regional CB gold buying patterns
   - Cross-currency crypto strength

### Long-term Roadmap

- Real-time calculation (sub-daily)
- Predictive regime modeling
- Integration with options market signals
- Alternative asset universe expansion (art, collectibles)

---

## Conclusion

The Alternative Asset Pressure (AAP) indicator provides a systematic framework for monitoring systemic trust and monetary regime health. By combining precious metals and crypto signals through a rigorous quantitative methodology, it offers a unique macro diagnostic tool for the Market Diagnostic Dashboard.

**Remember**: AAP measures trust erosion and regime stress, not investment opportunities. Use it to understand the macro environment, not to time markets.

---

**Version**: 1.0  
**Last Updated**: January 8, 2026  
**Status**: Production Ready (pending data source configuration)
