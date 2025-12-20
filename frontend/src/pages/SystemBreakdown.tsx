import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import { IndicatorStatus } from "../types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getLegacyApiUrl } from "../utils/apiUtils";

interface SystemHistoryPoint {
  timestamp: string;
  composite_score: number;
  state: string;
  red_count: number;
  yellow_count: number;
  green_count: number;
}

interface HeatmapDataPoint {
  date: string;
  indicator: string;
  state: string;
  score: number;
}

interface IndicatorMetadata {
  code: string;
  name: string;
  weight: number;
  direction: number;
}

export default function SystemBreakdown() {
  const { data: indicators } = useApi<IndicatorStatus[]>("/indicators");
  const [metadata, setMetadata] = useState<IndicatorMetadata[]>([]);
  const [history, setHistory] = useState<SystemHistoryPoint[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch indicator metadata from backend
        const apiUrl = getLegacyApiUrl();
        const metaResponse = await fetch(`${apiUrl}/indicators`);
        const indicatorData = await metaResponse.json();
        
        // For now, we'll use hardcoded weights (should come from backend)
        const metaWithWeights: IndicatorMetadata[] = indicatorData.map((ind: IndicatorStatus) => ({
          code: ind.code,
          name: ind.name,
          weight: getIndicatorWeight(ind.code),
          direction: getIndicatorDirection(ind.code),
        }));
        
        setMetadata(metaWithWeights);
        
        // Fetch historical data for all 10 indicators
        // Structure: Map<date, Map<indicator_code, {state, score}>>
        const dateIndicatorMap = new Map<string, Map<string, { state: string; score: number }>>();
        const indicatorCodes = indicatorData.map((ind: IndicatorStatus) => ind.code);
        
        await Promise.all(
          indicatorCodes.map(async (code: string) => {
            try {
              const response = await fetch(`${apiUrl}/indicators/${code}/history?days=365`);
              const data = await response.json();
              
              if (Array.isArray(data)) {
                // Group by date and take the latest point per day for this indicator
                const dailyData = new Map<string, any>();
                data.forEach((point: any) => {
                  const dateKey = point.timestamp.split('T')[0];
                  // Keep the latest timestamp for each date
                  if (!dailyData.has(dateKey) || point.timestamp > dailyData.get(dateKey).timestamp) {
                    dailyData.set(dateKey, point);
                  }
                });
                
                // Now add to the main map - one entry per indicator per day
                dailyData.forEach((point, dateKey) => {
                  if (!dateIndicatorMap.has(dateKey)) {
                    dateIndicatorMap.set(dateKey, new Map());
                  }
                  const indicatorMap = dateIndicatorMap.get(dateKey)!;
                  
                  // Determine state based on score
                  let state = 'GREEN';
                  if (point.score < 40) {
                    state = 'RED';
                  } else if (point.score < 70) {
                    state = 'YELLOW';
                  }
                  
                  indicatorMap.set(code, { state, score: point.score });
                });
              }
            } catch (error) {
              console.error(`Failed to fetch history for ${code}:`, error);
            }
          })
        );
        
        // Build heatmap data and state count data
        const heatmapPoints: HeatmapDataPoint[] = [];
        const historyPoints: SystemHistoryPoint[] = [];
        
        // Get indicator names for heatmap
        const indicatorNames = new Map(indicatorData.map((ind: IndicatorStatus) => [ind.code, ind.name]));
        
        // Process each date
        const sortedDates = Array.from(dateIndicatorMap.keys()).sort();
        sortedDates.forEach(date => {
          const indicatorMap = dateIndicatorMap.get(date)!;
          
          // Count states for this date
          let redCount = 0;
          let yellowCount = 0;
          let greenCount = 0;
          
          // Build heatmap data for each indicator on this date
          indicatorCodes.forEach((code: string) => {
            const indicatorData = indicatorMap.get(code);
            if (indicatorData) {
              heatmapPoints.push({
                date,
                indicator: indicatorNames.get(code) || code,
                state: indicatorData.state,
                score: indicatorData.score,
              });
              
              // Count for state distribution
              if (indicatorData.state === 'RED') redCount++;
              else if (indicatorData.state === 'YELLOW') yellowCount++;
              else greenCount++;
            }
          });
          
          // Add to history data
          historyPoints.push({
            timestamp: date,
            composite_score: 0,
            state: 'YELLOW',
            red_count: redCount,
            yellow_count: yellowCount,
            green_count: greenCount,
          });
        });
        
        console.log(`Loaded ${historyPoints.length} days with ${heatmapPoints.length} total data points`);
        console.log('Sample history:', historyPoints[historyPoints.length - 1]);
        setHistory(historyPoints);
        setHeatmapData(heatmapPoints);
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch system breakdown data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper functions for weights and directions (should come from backend)
  const getIndicatorWeight = (code: string): number => {
    const weights: Record<string, number> = {
      VIX: 1.5,
      SPY: 1.4,
      DFF: 1.3,
      T10Y2Y: 1.6,
      UNRATE: 1.2,
      CONSUMER_HEALTH: 1.4,
      BOND_MARKET_STABILITY: 1.8,
      LIQUIDITY_PROXY: 1.6,
      ANALYST_ANXIETY: 1.7,
      SENTIMENT_COMPOSITE: 1.6,
    };
    return weights[code] || 1.0;
  };

  const getIndicatorDirection = (code: string): number => {
    const directions: Record<string, number> = {
      VIX: 1,
      SPY: -1,
      DFF: -1,
      T10Y2Y: -1,
      UNRATE: 1,
      CONSUMER_HEALTH: -1,
      BOND_MARKET_STABILITY: -1,
      LIQUIDITY_PROXY: -1,
      ANALYST_ANXIETY: -1,
      SENTIMENT_COMPOSITE: -1,
    };
    return directions[code] || 1;
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-200">
        <h2 className="text-2xl font-bold mb-6">System Breakdown</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-stealth-800 rounded"></div>
          <div className="h-64 bg-stealth-800 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate current distribution
  const currentDistribution = indicators
    ? indicators.reduce(
        (acc, ind) => {
          acc[ind.state]++;
          return acc;
        },
        { GREEN: 0, YELLOW: 0, RED: 0 } as Record<string, number>
      )
    : { GREEN: 0, YELLOW: 0, RED: 0 };

  const pieData = [
    { name: "Green", value: currentDistribution.GREEN, color: "#10b981" },
    { name: "Yellow", value: currentDistribution.YELLOW, color: "#eab308" },
    { name: "Red", value: currentDistribution.RED, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Prepare chart data with numeric timestamps
  const chartData = history.map(point => ({
    ...point,
    timestampNum: new Date(point.timestamp).getTime(),
  }));

  const totalWeight = metadata.reduce((sum, m) => sum + m.weight, 0);

  return (
    <div className="p-3 md:p-6 text-gray-200">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 md:mb-6">System Breakdown & Methodology</h2>

      {/* Overview Section */}
      <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-stealth-100">System Overview</h3>
        <p className="text-xs sm:text-sm text-stealth-300 leading-relaxed mb-3 md:mb-4">
          This Market Diagnostic Dashboard provides a comprehensive, real-time assessment of market stability by monitoring 
          and analyzing <strong>ten critical indicators</strong> across six domains: <strong>volatility</strong> (VIX), 
          <strong>equities</strong> (SPY), <strong>interest rates</strong> (DFF, T10Y2Y), <strong>employment</strong> (UNRATE), 
          <strong>bonds</strong> (Bond Market Stability), <strong>liquidity</strong> (Liquidity Proxy), <strong>consumers</strong> (Consumer Health), 
          and <strong>sentiment</strong> (Analyst Anxiety, Consumer & Corporate Sentiment). 
          Each indicator is independently scored on a 0-100 scale using statistical normalization techniques, then combined into 
          a weighted composite score that reflects overall market health.
        </p>
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 text-center">
            <div className="text-xs font-semibold text-stealth-200">VIX + SPY</div>
            <div className="text-xs text-stealth-400">Volatility & Equity</div>
          </div>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 text-center">
            <div className="text-xs font-semibold text-stealth-200">DFF + T10Y2Y</div>
            <div className="text-xs text-stealth-400">Rates & Yield Curve</div>
          </div>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 text-center">
            <div className="text-xs font-semibold text-stealth-200">UNRATE</div>
            <div className="text-xs text-stealth-400">Employment</div>
          </div>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 text-center">
            <div className="text-xs font-semibold text-stealth-200">Consumer Health</div>
            <div className="text-xs text-stealth-400">PCE, PI, CPI</div>
          </div>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 text-center">
            <div className="text-xs font-semibold text-stealth-200">Bond Market</div>
            <div className="text-xs text-stealth-400">Credit + Curve + Volatility</div>
          </div>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 text-center">
            <div className="text-xs font-semibold text-stealth-200">Liquidity Proxy</div>
            <div className="text-xs text-stealth-400">M2 + Fed BS + RRP</div>
          </div>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 text-center">
            <div className="text-xs font-semibold text-stealth-200">Analyst Anxiety</div>
            <div className="text-xs text-stealth-400">VIX + MOVE + HY OAS + ERP</div>
          </div>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 text-center">
            <div className="text-xs font-semibold text-stealth-200">Sentiment Composite</div>
            <div className="text-xs text-stealth-400">Michigan + NFIB + ISM + CapEx</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 md:p-4">
            <div className="text-green-400 text-xl md:text-2xl mb-1 md:mb-2">🟢 GREEN</div>
            <div className="text-xs text-stealth-400 mb-1">Composite Score: 0-39</div>
            <div className="text-xs text-stealth-300">Market conditions are <strong>stable</strong>. Low volatility, healthy growth, minimal systemic risks.</div>
          </div>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 md:p-4">
            <div className="text-yellow-400 text-xl md:text-2xl mb-1 md:mb-2">🟡 YELLOW</div>
            <div className="text-xs text-stealth-400 mb-1">Composite Score: 40-69</div>
            <div className="text-xs text-stealth-300">Market shows <strong>caution signals</strong>. Increased volatility, mixed indicators, elevated monitoring required.</div>
          </div>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 md:p-4">
            <div className="text-red-400 text-xl md:text-2xl mb-1 md:mb-2">🔴 RED</div>
            <div className="text-xs text-stealth-400 mb-1">Composite Score: 70-100</div>
            <div className="text-xs text-stealth-300">Market under <strong>stress</strong>. High volatility, recession signals, significant systemic concerns.</div>
          </div>
        </div>
      </div>

      {/* Composite Score Calculation */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-stealth-100">Composite Score Calculation</h3>
        <div className="space-y-4">
          <div className="bg-stealth-900 border border-stealth-600 rounded p-4">
            <div className="text-sm font-mono text-cyan-400 mb-3">
              Composite Score = Σ (Indicator Score × Weight) / Σ Weights
            </div>
            <div className="text-xs text-stealth-300 space-y-2">
              <p><strong>Step 1:</strong> Each indicator is normalized to a 0-100 scale where lower scores indicate better market stability.</p>
              <p><strong>Step 2:</strong> Individual scores are multiplied by their assigned weights to reflect importance.</p>
              <p><strong>Step 3:</strong> Weighted scores are summed and divided by total weight to produce the composite.</p>
              <p><strong>Step 4:</strong> The composite score is classified: GREEN (&lt;40), YELLOW (40-69), or RED (≥70).</p>
            </div>
          </div>
          
          <div className="bg-stealth-900 border border-stealth-600 rounded p-4">
            <h4 className="text-sm font-semibold text-stealth-200 mb-2">Example Calculation</h4>
            <div className="text-xs font-mono text-stealth-300 space-y-1">
              <div>VIX Score: 30 × Weight: 1.5 = 45.0</div>
              <div>SPY Score: 52 × Weight: 1.4 = 72.8</div>
              <div>DFF Score: 47 × Weight: 1.3 = 61.1</div>
              <div>T10Y2Y Score: 6 × Weight: 1.6 = 9.6</div>
              <div>UNRATE Score: 100 × Weight: 1.2 = 120.0</div>
              <div>CONSUMER_HEALTH Score: 92 × Weight: 1.4 = 128.8</div>
              <div>BOND_MARKET Score: 75 × Weight: 1.8 = 135.0</div>
              <div>LIQUIDITY Score: 41 × Weight: 1.6 = 65.6</div>
              <div>ANALYST_ANXIETY Score: 27 × Weight: 1.7 = 45.9</div>
              <div>SENTIMENT Score: 21 × Weight: 1.6 = 33.6</div>
              <div className="pt-2 border-t border-stealth-700 mt-2">Total Weighted: 717.4 / Total Weight: 14.6 = <strong className="text-yellow-400">49.1 (YELLOW)</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Weights */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-stealth-100">Indicator Weights & Configuration</h3>
        <p className="text-xs sm:text-sm text-stealth-300 mb-3 md:mb-4">
          Each indicator is assigned a weight based on its historical significance in predicting market instability. 
          Weights reflect how strongly each metric influences the composite score and overall system state.
        </p>
        <div className="space-y-3">
          {metadata.map((meta) => {
            const indicator = indicators?.find(i => i.code === meta.code);
            const weightPercentage = ((meta.weight / totalWeight) * 100).toFixed(1);
            
            // Detailed descriptions for each indicator
            const descriptions: Record<string, string> = {
              VIX: "CBOE Volatility Index - Market fear gauge. Higher values indicate increased expected volatility and investor anxiety. Real-time measure of equity market stress.",
              SPY: "S&P 500 ETF - 50-day EMA gap analysis. Measures momentum and trend strength of broad equity market. Negative gap (price below EMA) signals distribution and weakness.",
              DFF: "Federal Funds Rate - Rate-of-change tracks Fed monetary policy aggressiveness. Rapid rate increases signal restrictive policy and recession risk.",
              T10Y2Y: "10Y-2Y Treasury Spread - Yield curve indicator. Inversions (negative spread) historically precede recessions by 12-18 months. Key recession predictor.",
              UNRATE: "Unemployment Rate - Labor market health. Rising unemployment signals economic slowdown and consumer stress. Lagging but critical recession indicator.",
              CONSUMER_HEALTH: "Derived indicator combining Personal Consumption Expenditures, Personal Income, and CPI to assess real consumer purchasing power and spending capacity.",
              BOND_MARKET_STABILITY: "Composite of credit spreads (HY, IG), yield curve stress, rate momentum, and Treasury volatility. Captures systemic stress in fixed income markets.",
              LIQUIDITY_PROXY: "Combines M2 money supply growth, Fed balance sheet changes, and overnight reverse repo usage. Measures systemic liquidity availability and tightness.",
              ANALYST_ANXIETY: "Composite sentiment indicator aggregating VIX (equity vol), MOVE (rates vol), high-yield credit spreads, and equity risk premium. Captures institutional fear.",
              SENTIMENT_COMPOSITE: "Consumer & corporate confidence composite from Michigan Consumer Sentiment, NFIB Small Business Optimism, ISM New Orders, and CapEx commitments. Forward-looking demand indicator."
            };
            
            return (
              <div key={meta.code} className="bg-stealth-900 border border-stealth-600 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className="font-semibold text-stealth-100 min-w-[180px]">{meta.name}</div>
                    <div className="text-sm text-stealth-400">
                      Weight: <span className="text-stealth-200 font-mono">{meta.weight.toFixed(1)}</span> ({weightPercentage}%)
                    </div>
                    <div className="text-sm text-stealth-400">
                      Direction: <span className="text-stealth-200 font-mono">{meta.direction === 1 ? "↑ Higher is better" : "↓ Lower is better"}</span>
                    </div>
                  </div>
                  {indicator && (
                    <div className={`px-3 py-1 rounded font-semibold ${
                      indicator.state === "GREEN" ? "bg-green-500/20 text-green-400" :
                      indicator.state === "YELLOW" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {indicator.state}
                    </div>
                  )}
                </div>
                <div className="text-xs text-stealth-400 mt-2">
                  {descriptions[meta.code] || "Market stability indicator"}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-stealth-600">
          <div className="text-sm text-stealth-400 mb-2">
            Total Weight: <span className="text-stealth-200 font-mono">{totalWeight.toFixed(1)}</span>
          </div>
          <div className="text-xs text-stealth-500">
            Note: Weights are calibrated based on historical correlation with market downturns and systemic crises. 
            Bond Market Stability receives highest weight (1.8) as fixed income dysfunction typically precedes equity crashes. 
            Sentiment indicators (Analyst Anxiety 1.7, Sentiment Composite 1.6) capture forward-looking confidence shifts.
          </div>
        </div>
      </div>

      {/* Current Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-stealth-100">Current State Distribution</h3>
          <div className="flex items-center justify-center" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161619",
                    borderColor: "#555560",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-stealth-100">State Ratios</h3>
          <div className="space-y-4 mt-8">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-green-400 font-semibold">Green</span>
                <span className="text-stealth-300">{currentDistribution.GREEN} / {indicators?.length || 0}</span>
              </div>
              <div className="w-full bg-stealth-900 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${((currentDistribution.GREEN / (indicators?.length || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-yellow-400 font-semibold">Yellow</span>
                <span className="text-stealth-300">{currentDistribution.YELLOW} / {indicators?.length || 0}</span>
              </div>
              <div className="w-full bg-stealth-900 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all"
                  style={{ width: `${((currentDistribution.YELLOW / (indicators?.length || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-red-400 font-semibold">Red</span>
                <span className="text-stealth-300">{currentDistribution.RED} / {indicators?.length || 0}</span>
              </div>
              <div className="w-full bg-stealth-900 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all"
                  style={{ width: `${((currentDistribution.RED / (indicators?.length || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Indicator Scoring Methodology */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-stealth-100">Individual Indicator Scoring Methodology</h3>
        <p className="text-sm text-stealth-300 mb-4">
          Each indicator uses specialized scoring logic tailored to its characteristics and market significance.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* VIX */}
          <div className="bg-stealth-900 border border-stealth-600 rounded p-4">
            <h4 className="text-sm font-bold text-cyan-400 mb-2">VIX (CBOE Volatility Index)</h4>
            <div className="text-xs text-stealth-300 space-y-2">
              <p className="font-mono bg-stealth-950 p-2 rounded">
                Score = min(100, max(0, (VIX - 12) × 3.33))
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>12-20:</strong> Normal market conditions (0-26 score)</li>
                <li><strong>20-30:</strong> Elevated volatility (26-60 score)</li>
                <li><strong>30-40:</strong> High stress (60-93 score)</li>
                <li><strong>&gt;40:</strong> Extreme fear (93-100 score)</li>
              </ul>
              <p className="text-stealth-400 italic">Rationale: VIX above 30 historically signals market crises (2008, 2020).</p>
            </div>
          </div>

          {/* SPY */}
          <div className="bg-stealth-900 border border-stealth-600 rounded p-4">
            <h4 className="text-sm font-bold text-cyan-400 mb-2">SPY (S&P 500 ETF - 50-day EMA Gap)</h4>
            <div className="text-xs text-stealth-300 space-y-2">
              <p className="font-mono bg-stealth-950 p-2 rounded">
                Gap% = ((Price - EMA₅₀) / EMA₅₀) × 100<br/>
                Score = 50 - (Gap% × 2)
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>&gt;+10%:</strong> Strong uptrend (0-30 score - stable)</li>
                <li><strong>0 to +10%:</strong> Moderate uptrend (30-50 score)</li>
                <li><strong>-5% to 0:</strong> Consolidation (50-60 score)</li>
                <li><strong>&lt;-5%:</strong> Downtrend/breakdown (60-100 score)</li>
              </ul>
              <p className="text-stealth-400 italic">Rationale: Sustained divergence from EMA indicates trend weakness.</p>
            </div>
          </div>

          {/* DFF */}
          <div className="bg-stealth-900 border border-stealth-600 rounded p-4">
            <h4 className="text-sm font-bold text-cyan-400 mb-2">DFF (Federal Funds Rate - Rate of Change)</h4>
            <div className="text-xs text-stealth-300 space-y-2">
              <p className="font-mono bg-stealth-950 p-2 rounded">
                ROC = DFF(today) - DFF(previous)<br/>
                Score = 50 + (ROC × 20)
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Declining:</strong> Easing policy (0-40 score - supportive)</li>
                <li><strong>Stable:</strong> Neutral policy (40-60 score)</li>
                <li><strong>Rising fast:</strong> Tightening cycle (60-100 score - restrictive)</li>
              </ul>
              <p className="text-stealth-400 italic">Rationale: Rapid rate hikes historically precede market corrections.</p>
            </div>
          </div>

          {/* T10Y2Y */}
          <div className="bg-stealth-900 border border-stealth-600 rounded p-4">
            <h4 className="text-sm font-bold text-cyan-400 mb-2">T10Y2Y (10Y-2Y Treasury Spread)</h4>
            <div className="text-xs text-stealth-300 space-y-2">
              <p className="font-mono bg-stealth-950 p-2 rounded">
                Spread = 10Y Yield - 2Y Yield<br/>
                Score = 50 - (Spread × 20)
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>&gt;+1.5%:</strong> Steep curve (0-20 score - healthy)</li>
                <li><strong>0 to +1.5%:</strong> Normal curve (20-50 score)</li>
                <li><strong>-0.5% to 0:</strong> Flattening (50-60 score)</li>
                <li><strong>&lt;-0.5%:</strong> Inverted curve (60-100 score - recession warning)</li>
              </ul>
              <p className="text-stealth-400 italic">Rationale: Inversions preceded every recession since 1955.</p>
            </div>
          </div>

          {/* UNRATE */}
          <div className="bg-stealth-900 border border-stealth-600 rounded p-4">
            <h4 className="text-sm font-bold text-cyan-400 mb-2">UNRATE (Unemployment Rate)</h4>
            <div className="text-xs text-stealth-300 space-y-2">
              <p className="font-mono bg-stealth-950 p-2 rounded">
                Score = (UNRATE - 3.5) × 10
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>&lt;4%:</strong> Full employment (0-5 score)</li>
                <li><strong>4-5%:</strong> Healthy labor market (5-15 score)</li>
                <li><strong>5-7%:</strong> Weakening (15-35 score)</li>
                <li><strong>&gt;7%:</strong> Recession conditions (35-100 score)</li>
              </ul>
              <p className="text-stealth-400 italic">Rationale: Rising unemployment reduces consumer spending and GDP growth.</p>
            </div>
          </div>

          {/* CONSUMER_HEALTH */}
          <div className="bg-stealth-900 border border-stealth-600 rounded p-4">
            <h4 className="text-sm font-bold text-cyan-400 mb-2">CONSUMER_HEALTH (Derived Indicator)</h4>
            <div className="text-xs text-stealth-300 space-y-2">
              <p className="font-mono bg-stealth-950 p-2 rounded">
                CH = (PCE_MoM% - CPI_MoM%) + (PI_MoM% - CPI_MoM%)<br/>
                Score = 50 - (CH × 50)
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Positive CH:</strong> Real income/spending growth outpaces inflation (0-40 score)</li>
                <li><strong>Near 0:</strong> Neutral consumer capacity (40-60 score)</li>
                <li><strong>Negative CH:</strong> Inflation eroding purchasing power (60-100 score)</li>
              </ul>
              <p className="text-stealth-400 italic">Rationale: Consumer spending drives 70% of US GDP. Negative spreads signal demand destruction.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bond Market Stability Composite */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-3 text-stealth-100">Bond Market Stability Composite</h4>
        <div className="space-y-3 text-sm">
          <p className="text-stealth-300">
            <strong className="text-stealth-200">Weight: 1.8</strong> · Aggregates four bond market signals into a comprehensive stress score.
          </p>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 space-y-2">
            <div className="font-mono text-xs text-stealth-300">
              <div className="mb-2"><strong className="text-stealth-200">Components:</strong></div>
              <div className="ml-3 space-y-1">
                <div>• <span className="text-blue-400">Credit Spread Stress (44%)</span>: HY OAS + IG OAS z-scores</div>
                <div>• <span className="text-blue-400">Yield Curve Stress (23%)</span>: 10Y-2Y, 10Y-3M, 30Y-5Y spreads</div>
                <div>• <span className="text-blue-400">Rates Momentum Stress (17%)</span>: 3-month ROC of 2Y and 10Y yields</div>
                <div>• <span className="text-blue-400">Treasury Volatility Stress (16%)</span>: 20-day rolling std dev of DGS10</div>
              </div>
            </div>
            <div className="font-mono text-xs text-stealth-400 pt-2 border-t border-stealth-700">
              composite_stress = (0.44 × credit) + (0.23 × curve) + (0.17 × momentum) + (0.16 × volatility)
              <br />
              <span className="text-stealth-500">// Stored as stress score (0-100, higher = worse), direction=-1 inverts during normalization</span>
            </div>
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Rationale:</strong> Bond markets are leading indicators of systemic stress. 
            Credit spreads widen before equity crashes, yield curves invert before recessions, and Treasury volatility spikes during 
            liquidity crises. This composite captures bond market dislocations that precede broader market turmoil.
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Typical Ranges (Stress Score):</strong> 
            <span className="ml-2 text-emerald-400">LOW: 0-35</span> (stable credit, normal curves, low vol) · 
            <span className="ml-2 text-yellow-400">MODERATE: 35-65</span> (widening spreads, curve flattening) · 
            <span className="ml-2 text-red-400">HIGH: 65-100</span> (credit stress, inversions, volatility spikes)
          </div>
        </div>
      </div>

      {/* Liquidity Proxy Indicator */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6 mt-6">
        <h4 className="text-lg font-semibold mb-3 text-stealth-100">Liquidity Proxy Indicator</h4>
        <div className="space-y-3 text-sm">
          <p className="text-stealth-300">
            <strong className="text-stealth-200">Weight: 1.6</strong> · Measures systemic liquidity by combining money supply growth, 
            Fed balance sheet changes, and reverse repo usage.
          </p>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 space-y-2">
            <div className="font-mono text-xs text-stealth-300">
              <div className="mb-2"><strong className="text-stealth-200">Components:</strong></div>
              <div className="ml-3 space-y-1">
                <div>• <span className="text-purple-400">M2 Money Supply</span>: Year-over-year % growth</div>
                <div>• <span className="text-purple-400">Fed Balance Sheet</span>: Month-over-month delta (QE/QT)</div>
                <div>• <span className="text-purple-400">Reverse Repo (RRP)</span>: Daily usage level (inverse indicator)</div>
              </div>
            </div>
            <div className="font-mono text-xs text-stealth-400 pt-2 border-t border-stealth-700">
              liquidity_proxy = z_score(M2_YoY) + z_score(Δ_FedBS) - z_score(RRP_level)
              <br />
              stress_score = 50 - (liquidity_proxy × 15) → clipped to [0, 100]
              <br />
              <span className="text-stealth-500">// Stored as stress score (0-100, higher = worse liquidity), direction=-1 inverts</span>
            </div>
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Rationale:</strong> Liquidity is the lifeblood of markets. When M2 grows and the 
            Fed expands its balance sheet (QE), asset prices rise across the board. When the Fed tightens (QT) and RRP usage surges 
            (indicating idle reserves), liquidity drains from markets, causing broad-based sell-offs. This indicator captures the 
            liquidity regime driving all asset classes.
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Typical Ranges (Stress Score):</strong> 
            <span className="ml-2 text-emerald-400">LOW: 0-30</span> (M2 growth, QE, low RRP = abundant liquidity) · 
            <span className="ml-2 text-yellow-400">MODERATE: 30-60</span> (slowing M2, neutral Fed, rising RRP) · 
            <span className="ml-2 text-red-400">HIGH: 60-100</span> (M2 decline, aggressive QT, RRP peak = liquidity drought)
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Historical Context:</strong> 
            2020-2021 QE era: <span className="text-emerald-400">LOW STRESS</span> (M2 +25%, Fed +$4T, RRP near zero) · 
            2022 aggressive tightening: <span className="text-red-400">HIGH STRESS</span> (M2 declining, QT -$95B/month, RRP $2.5T) · 
            2023-2024 recovery: <span className="text-yellow-400">MODERATE</span> (stabilizing M2, slowing QT, RRP declining)
          </div>
        </div>
      </div>

      {/* Consumer Health Index Composite */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6 mt-6">
        <h4 className="text-lg font-semibold mb-3 text-stealth-100">Consumer Health Index</h4>
        <div className="space-y-3 text-sm">
          <p className="text-stealth-300">
            <strong className="text-stealth-200">Weight: 1.4</strong> · Measures real consumer purchasing power by comparing income and spending growth against inflation.
          </p>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 space-y-2">
            <div className="font-mono text-xs text-stealth-300">
              <div className="mb-2"><strong className="text-stealth-200">Components:</strong></div>
              <div className="ml-3 space-y-1">
                <div>• <span className="text-green-400">Personal Consumption Expenditures (PCE)</span>: Month-over-month % change</div>
                <div>• <span className="text-green-400">Personal Income (PI)</span>: Month-over-month % change</div>
                <div>• <span className="text-green-400">Consumer Price Index (CPI)</span>: Month-over-month % change (inflation baseline)</div>
              </div>
            </div>
            <div className="font-mono text-xs text-stealth-400 pt-2 border-t border-stealth-700">
              real_spending_capacity = (PCE_MoM% - CPI_MoM%) → PCE growth minus inflation
              <br />
              real_income_capacity = (PI_MoM% - CPI_MoM%) → Income growth minus inflation
              <br />
              consumer_health = real_spending_capacity + real_income_capacity
              <br />
              <span className="text-stealth-500">// Positive = real growth, Negative = inflation eroding purchasing power</span>
              <br />
              <span className="text-stealth-500">// Stored as spread value, direction=-1 means negative spread (stress) → low score (RED)</span>
            </div>
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Rationale:</strong> Consumer spending drives ~70% of US GDP. When real incomes rise and 
            consumers can afford to spend freely, economic growth accelerates. When inflation outpaces income/spending growth, consumers 
            cut discretionary spending, causing economic contraction. This index measures the fundamental capacity of consumers to drive 
            economic activity.
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Typical Ranges:</strong> 
            <span className="ml-2 text-emerald-400">HEALTHY: +1% to +3%</span> (real growth in both income and spending) · 
            <span className="ml-2 text-yellow-400">NEUTRAL: -0.5% to +1%</span> (keeping pace with inflation) · 
            <span className="ml-2 text-red-400">STRESS: -3% to -0.5%</span> (inflation eroding purchasing power, demand destruction)
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Historical Context:</strong> 
            2021 stimulus era: <span className="text-emerald-400">HEALTHY</span> (PI +15% YoY, strong PCE, moderate CPI) · 
            2022 inflation shock: <span className="text-red-400">SEVERE STRESS</span> (CPI +9% YoY, real incomes declining) · 
            2024 normalization: <span className="text-yellow-400">NEUTRAL</span> (CPI cooling to 3%, incomes catching up)
          </div>
        </div>
      </div>

      {/* Analyst Anxiety Composite */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6 mt-6">
        <h4 className="text-lg font-semibold mb-3 text-stealth-100">Analyst Anxiety (Institutional Sentiment)</h4>
        <div className="space-y-3 text-sm">
          <p className="text-stealth-300">
            <strong className="text-stealth-200">Weight: 1.7</strong> · Aggregates institutional fear indicators across equity volatility, 
            rates volatility, and credit stress to measure professional investor anxiety.
          </p>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 space-y-2">
            <div className="font-mono text-xs text-stealth-300">
              <div className="mb-2"><strong className="text-stealth-200">Components:</strong></div>
              <div className="ml-3 space-y-1">
                <div>• <span className="text-red-400">VIX (Equity Volatility) - 40%</span>: CBOE Volatility Index, equity fear gauge</div>
                <div>• <span className="text-red-400">MOVE Index (Rates Volatility) - 25%</span>: Bond market volatility (if available)</div>
                <div>• <span className="text-red-400">HY OAS (Credit Stress) - 25%</span>: High-yield option-adjusted spread</div>
                <div>• <span className="text-red-400">ERP Proxy (Risk Premium) - 10%</span>: BBB yield minus 10Y Treasury (if available)</div>
              </div>
            </div>
            <div className="font-mono text-xs text-stealth-400 pt-2 border-t border-stealth-700">
              // Each component normalized to z-score with 520-day lookback
              <br />
              // Includes momentum: z_blended = 0.75 × z_base + 0.25 × z_momentum (10-day ROC)
              <br />
              stress_score(component) = ((z_blended + 3) / 6) × 100 → [0, 100]
              <br />
              composite_stress = Σ(stress_score × weight) with dynamic weight redistribution if optional components unavailable
              <br />
              stability_score = 100 - composite_stress
              <br />
              <span className="text-stealth-500">// Stored as stability score, direction=-1 means low stability → low score (RED)</span>
            </div>
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Rationale:</strong> Institutional investors manage trillions in assets and react quickly 
            to perceived risks. When VIX spikes, MOVE rises, credit spreads widen, and equity risk premiums expand, it signals professionals 
            are hedging aggressively and reducing risk exposure. These fear indicators typically precede retail panic and broader market 
            dislocations. By blending volatility (VIX, MOVE), credit (HY OAS), and risk premium (ERP), this composite captures 
            multi-dimensional institutional anxiety.
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Typical Ranges (Stability Score):</strong> 
            <span className="ml-2 text-emerald-400">CALM: 65-100</span> (VIX &lt;20, MOVE &lt;100, HY OAS &lt;400 bps, narrow risk premiums) · 
            <span className="ml-2 text-yellow-400">ELEVATED: 35-65</span> (VIX 20-30, rising credit spreads, modest fear) · 
            <span className="ml-2 text-red-400">ANXIOUS: 0-35</span> (VIX &gt;30, MOVE &gt;150, HY OAS &gt;600 bps, wide risk premiums = panic hedging)
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Historical Context:</strong> 
            2019 pre-COVID: <span className="text-emerald-400">CALM</span> (VIX 12-16, HY OAS ~350 bps, low volatility regime) · 
            March 2020 COVID crash: <span className="text-red-400">EXTREME ANXIETY</span> (VIX 80+, MOVE 200+, HY OAS 1000+ bps) · 
            2024 soft landing: <span className="text-yellow-400">MODERATE</span> (VIX 15-18, normalized spreads, guarded optimism)
          </div>
        </div>
      </div>

      {/* Consumer & Corporate Sentiment Composite */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6 mt-6">
        <h4 className="text-lg font-semibold mb-3 text-stealth-100">Consumer & Corporate Sentiment Composite</h4>
        <div className="space-y-3 text-sm">
          <p className="text-stealth-300">
            <strong className="text-stealth-200">Weight: 1.6</strong> · Forward-looking confidence indicator combining consumer sentiment, 
            small business optimism, manufacturing demand, and capital expenditure commitments.
          </p>
          <div className="bg-stealth-900 border border-stealth-600 rounded p-3 space-y-2">
            <div className="font-mono text-xs text-stealth-300">
              <div className="mb-2"><strong className="text-stealth-200">Components:</strong></div>
              <div className="ml-3 space-y-1">
                <div>• <span className="text-yellow-400">Michigan Consumer Sentiment - 30%</span>: How consumers feel about economy & finances</div>
                <div>• <span className="text-yellow-400">NFIB Small Business Optimism - 30%</span>: Small business owner confidence & expectations</div>
                <div>• <span className="text-yellow-400">ISM New Orders (Manufacturing) - 25%</span>: Forward demand indicator, orders today = production tomorrow</div>
                <div>• <span className="text-yellow-400">CapEx Proxy (Capital Goods Orders) - 15%</span>: Corporate investment commitments (Nondefense ex-Aircraft)</div>
              </div>
            </div>
            <div className="font-mono text-xs text-stealth-400 pt-2 border-t border-stealth-700">
              // Each component normalized to z-score with 520-day lookback (monthly data)
              <br />
              confidence_score(component) = ((z + 3) / 6) × 100 → [0, 100]
              <br />
              composite_confidence = Σ(confidence_score × weight)
              <br />
              <span className="text-stealth-500">// Higher confidence = willingness to spend/invest/expand</span>
              <br />
              <span className="text-stealth-500">// Stored as confidence score, direction=-1 means low confidence → low score (RED)</span>
              <br />
              <span className="text-stealth-500">// Weights redistributed if optional components unavailable (Michigan always required)</span>
            </div>
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Rationale:</strong> Economic activity is driven by confidence, not just fundamentals. 
            When consumers feel optimistic, they make big purchases (homes, cars). When businesses are confident, they hire, expand, and 
            invest in equipment. This composite captures the psychological willingness to spend and invest across all economic actors. 
            New orders and CapEx are particularly forward-looking—they represent commitments made today that drive production and 
            employment 3-12 months forward. Sentiment surveys predict recessions 6-12 months in advance.
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Typical Ranges (Confidence Score):</strong> 
            <span className="ml-2 text-emerald-400">OPTIMISTIC: 65-100</span> (Michigan 90+, NFIB 100+, ISM new orders 55+, CapEx growing) · 
            <span className="ml-2 text-yellow-400">CAUTIOUS: 35-65</span> (Michigan 70-90, NFIB 95-100, ISM 50-55, stable CapEx) · 
            <span className="ml-2 text-red-400">PESSIMISTIC: 0-35</span> (Michigan &lt;70, NFIB &lt;95, ISM &lt;50 contraction, CapEx declining)
          </div>
          <div className="text-stealth-400">
            <strong className="text-stealth-300">Historical Context:</strong> 
            2018 tax cut optimism: <span className="text-emerald-400">VERY OPTIMISTIC</span> (Michigan 100+, NFIB 108, ISM 60+, CapEx surge) · 
            2020 COVID shock: <span className="text-red-400">COLLAPSE</span> (Michigan 70s, NFIB crash, ISM 35, CapEx freeze) · 
            2022 inflation shock: <span className="text-red-400">PESSIMISM</span> (Michigan hit 50-year low of 50.0, recession fears) · 
            2024 recovery: <span className="text-yellow-400">CAUTIOUS</span> (Michigan 70s, moderate confidence, guarded expansion)
          </div>
        </div>
      </div>

      {/* Historical State Distribution Heatmap */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6 mt-6">
        <h3 className="text-xl font-semibold mb-4 text-stealth-100">Historical State Distribution (1 Year)</h3>
        <p className="text-sm text-stealth-400 mb-4">Each row represents an indicator. Color shows state: Green (healthy), Yellow (caution), Red (stress)</p>
        
        <div className="overflow-x-auto">
          <div style={{ minWidth: '800px' }}>
            {/* Get unique indicator names */}
            {Array.from(new Set(heatmapData.map(d => d.indicator))).sort().map((indicatorName) => {
              // Get all data points for this indicator, sorted by date
              const indicatorPoints = heatmapData
                .filter(d => d.indicator === indicatorName)
                .sort((a, b) => a.date.localeCompare(b.date));
              
              // Sample every Nth point to avoid too many cells
              const samplingRate = Math.max(1, Math.floor(indicatorPoints.length / 100));
              const sampledPoints = indicatorPoints.filter((_, idx) => idx % samplingRate === 0);
              
              return (
                <div key={indicatorName} className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-48 text-xs text-stealth-300 font-medium truncate" title={indicatorName}>
                      {indicatorName}
                    </div>
                    <div className="flex-1 flex gap-0.5">
                      {sampledPoints.map((point, idx) => {
                        const color = 
                          point.state === 'GREEN' ? '#10b981' :
                          point.state === 'YELLOW' ? '#eab308' :
                          '#ef4444';
                        
                        return (
                          <div
                            key={idx}
                            className="flex-1 h-8 transition-opacity hover:opacity-75 cursor-pointer"
                            style={{ 
                              backgroundColor: color,
                              minWidth: '2px',
                            }}
                            title={`${point.date}: ${point.state} (${point.score.toFixed(1)})`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Time axis labels */}
            <div className="flex items-center gap-2 mt-4">
              <div className="w-48"></div>
              <div className="flex-1 flex justify-between text-xs text-stealth-400">
                <span>1 year ago</span>
                <span>6 months ago</span>
                <span>Today</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 justify-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <span className="text-stealth-300">Green (≥70)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#eab308' }}></div>
                <span className="text-stealth-300">Yellow (40-69)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-stealth-300">Red (&lt;40)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
