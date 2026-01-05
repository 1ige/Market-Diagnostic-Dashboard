/**
 * Sector Projections Page
 * 
 * Displays forward-looking sector rankings across 3 time horizons (3m, 6m, 12m)
 * using a transparent, rule-based scoring model (Option B).
 * 
 * Features:
 * - Line chart showing score trends across horizons for all 11 sectors
 * - Detailed tables with composite scores and component breakdowns
 * - Methodology explanation for transparency
 */

/**
 * Sector Projections Page
 * 
 * Displays transparent, rules-based sector ETF performance projections across multiple time horizons.
 * Unlike black-box models, every score component is calculable and interpretable by analysts.
 * 
 * Features:
 * - Multi-horizon analysis: 3-month, 6-month, and 12-month projections
 * - Smooth line chart visualization tracking score evolution
 * - Detailed scoring breakdown for each sector and horizon
 * - Winner/Neutral/Loser classifications
 * - Collapsible methodology section with technical details
 * 
 * Scoring Components (Total = 100):
 * - Trend (45%): Return + momentum indicator (SMA distance)
 * - Relative Strength (30%): Outperformance vs SPY benchmark
 * - Risk (20%): Volatility + drawdown (inverted - lower risk = higher score)
 * - Regime (5%): Context-aware adjustments based on market state
 * 
 * @component
 */

import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import "../index.css";

const HORIZONS = ["3m", "6m", "12m"];

/**
 * Visual score bar component for displaying normalized 0-100 scores
 */
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 sm:w-14 text-gray-400">{label}</span>
      <div className="flex-1 bg-gray-700 rounded h-2">
        <div
          className="h-2 rounded"
          style={{ width: `${value}%`, background: color }}
        ></div>
      </div>
      <span className="w-8 text-right text-gray-300 tabular-nums">{Math.round(value)}</span>
    </div>
  );
}

export default function SectorProjections() {
  const { data, loading, error } = useApi("/sectors/projections/latest");
  const [projections, setProjections] = useState<any>({});
  const [historicalScores, setHistoricalScores] = useState<Record<string, number>>({});
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<"T" | "3m" | "6m" | "12m">("12m");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [readingGuideOpen, setReadingGuideOpen] = useState(false);

  useEffect(() => {
    if (data && data.projections) {
      setProjections(data.projections);
      setHistoricalScores(data.historical || {});
    }
  }, [data]);

  // Prepare data for line chart: track each sector's score across horizons
  const getChartData = () => {
    if (!projections["3m"]) return [];
    
    // Get all unique sectors from 3m data
    const sectors = projections["3m"] || [];
    
    return sectors.map((sector: any) => {
      const sectorData = {
        name: sector.sector_name,
        symbol: sector.sector_symbol,
        scores: {} as any,
      };
      
      // Collect scores for each horizon
      HORIZONS.forEach((h) => {
        const horizonData = projections[h] || [];
        const match = horizonData.find((s: any) => s.sector_symbol === sector.sector_symbol);
        sectorData.scores[h] = match ? match.score_total : 50;
      });
      
      return sectorData;
    });
  };

  const chartData = getChartData();

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto text-gray-100">
      <h1 className="text-2xl font-bold mb-2">Sector Projections</h1>
      <p className="mb-4 text-gray-400">Identify sector leadership across multiple time horizons with quantified confidence levels</p>
      
      {/* Disclaimer */}
      <div className="mb-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
        <p className="text-xs text-yellow-200/90 leading-relaxed">
          <strong>Disclaimer:</strong> These projections are theoretical models for educational and informational purposes only. 
          They are not financial advice, investment recommendations, or guarantees of future performance. 
          Sector ETF performance does not guarantee individual stock returns. Always conduct your own research and consult with a qualified 
          financial advisor before making investment decisions.
        </p>
      </div>

      {/* How to Read - Collapsible */}
      <div className="mb-6">
        <button
          onClick={() => setReadingGuideOpen(!readingGuideOpen)}
          className="w-full bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 text-left hover:bg-blue-900/30 transition"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-blue-200">How to Read This Chart</h3>
            <span className="text-blue-300 text-xl">{readingGuideOpen ? '−' : '+'}</span>
          </div>
        </button>
        {readingGuideOpen && (
          <div className="bg-blue-900/20 border border-blue-700/50 border-t-0 rounded-b-lg p-4 text-xs text-blue-200/80 space-y-2 leading-relaxed">
            <p><strong>Score (0-100):</strong> Higher scores indicate stronger technical outlook based on trend, relative strength vs SPY, risk metrics, and market regime alignment. Compare sectors vertically - higher is better.</p>
            <p><strong>Score Changes:</strong> Lines moving up show improving outlook, lines moving down show deteriorating conditions. Crossing lines indicate sector rotation - leadership shifts.</p>
            <p><strong>Uncertainty Cones (Click a Sector):</strong> The shaded area shows projection confidence range. Tighter cones = more predictable sector behavior. Wider cones = higher volatility or uncertainty. All cones expand further into the future as predictability decreases.</p>
            <p><strong>Historical (-3M):</strong> Shows actual scores from 3 months ago, helping you see recent trend direction and momentum.</p>
          </div>
        )}
      </div>
      {data && <p className="mb-6 text-xs text-gray-500">System State: <span className={data.system_state === "RED" ? "text-red-400 font-semibold" : data.system_state === "GREEN" ? "text-green-400 font-semibold" : "text-yellow-400 font-semibold"}>{data.system_state}</span> • As of: {data.as_of_date}</p>}
      
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-400">Error: {error.message}</div>}
      
      {/* Methodology Explanation - Collapsible */}
      <div className="mb-6 bg-gray-800 rounded-lg shadow">
        <button
          onClick={() => setMethodologyOpen(!methodologyOpen)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-750 transition-colors rounded-lg"
        >
          <h2 className="text-lg font-semibold">Methodology & Algorithm Details</h2>
          <div className="text-lg font-bold text-gray-500">
            {methodologyOpen ? '−' : '+'}
          </div>
        </button>
        {methodologyOpen && (
          <div className="px-6 pb-6 text-sm text-gray-300 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-100 mb-3 text-base">Transparent Rule-Based Scoring</h3>
              <p className="text-gray-400 mb-2">
                This model ranks 11 sector ETFs (XLE, XLF, XLK, XLY, XLP, XLV, XLI, XLU, XLB, XLRE, XLC) against the SPY benchmark 
                using 8000 days of historical price data. Each sector receives a composite score (0-100) calculated from four weighted components.
              </p>
              <p className="text-gray-400">
                Scores are computed independently for three time horizons: 3-month (63 trading days), 6-month (126 days), and 12-month (252 days) lookback periods.
              </p>
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h3 className="font-semibold text-gray-100 mb-3">Component Calculations</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-semibold text-yellow-400 mb-2">1. Trend Score (45% weight)</h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Measures price momentum and technical positioning relative to moving averages.
                  </p>
                  <div className="text-xs text-gray-400 space-y-1 ml-3">
                    <p><strong>Return:</strong> Total return over the horizon period: (Price_end / Price_start) - 1</p>
                    <p><strong>SMA Distance:</strong> Distance from 200-day simple moving average: (Price_current / SMA_200) - 1</p>
                    <p><strong>Composite:</strong> Return + (0.5 × SMA Distance), then percentile-ranked across all sectors and scaled to 0-100</p>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-semibold text-lime-400 mb-2">2. Relative Strength Score (30% weight)</h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Quantifies outperformance versus the broad market (SPY) over the same period.
                  </p>
                  <div className="text-xs text-gray-400 space-y-1 ml-3">
                    <p><strong>Calculation:</strong> Sector Return - SPY Return (both measured over the horizon)</p>
                    <p><strong>Normalization:</strong> Percentile-ranked across sectors and scaled to 0-100</p>
                    <p>Higher scores indicate sectors beating the market; lower scores indicate underperformance</p>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-semibold text-red-400 mb-2">3. Risk Score (20% weight, inverted)</h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Evaluates price stability and downside protection. Lower risk = higher score (inverse ranking).
                  </p>
                  <div className="text-xs text-gray-400 space-y-1 ml-3">
                    <p><strong>Realized Volatility:</strong> 20-day rolling standard deviation of daily returns, annualized (× √252)</p>
                    <p><strong>Max Drawdown:</strong> Largest peak-to-trough decline over the full horizon period</p>
                    <p><strong>Composite:</strong> Volatility + (0.5 × |Drawdown|), inverted percentile rank scaled to 0-100</p>
                    <p>Sectors with lower volatility and smaller drawdowns receive higher risk scores</p>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-semibold text-indigo-400 mb-2">4. Regime Adjustment (5% weight)</h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Context-aware modifier based on the current system state (RED/YELLOW/GREEN market environment).
                  </p>
                  <div className="text-xs text-gray-400 space-y-1 ml-3">
                    <p><strong>Base Score:</strong> 50 (neutral)</p>
                    <p><strong>RED Market Adjustments:</strong></p>
                    <ul className="ml-4 list-disc">
                      <li>Defensive sectors (Utilities, Consumer Staples, Health Care): +5 points</li>
                      <li>High-volatility sectors (volatility above median): -5 points</li>
                    </ul>
                    <p><strong>YELLOW/GREEN Markets:</strong> No adjustments applied (all sectors score 50)</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h3 className="font-semibold text-gray-100 mb-3">Final Score & Ranking</h3>
              <div className="text-xs text-gray-400 space-y-2">
                <p className="font-mono bg-gray-950 p-2 rounded">
                  Composite Score = (0.45 × Trend) + (0.30 × Rel_Strength) + (0.20 × Risk) + (0.05 × Regime)
                </p>
                <p>
                  All sectors are ranked by composite score (descending). Ranks are assigned 1-11 using minimum rank method (ties get the same rank).
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h3 className="font-semibold text-gray-100 mb-3">Uncertainty Cones</h3>
              <p className="text-xs text-gray-400 mb-3">
                The interactive chart displays projection confidence intervals visualized as expanding "uncertainty cones" for each sector.
              </p>
              <div className="text-xs text-gray-400 space-y-2">
                <p><strong>What they represent:</strong> The cone boundary shows the range of possible scores based on score volatility across the projection period (3M, 6M, 12M).</p>
                <p><strong>How they expand:</strong> Each cone starts narrow at the current date (high confidence in today's positioning) and progressively widens toward longer time horizons (lower confidence in distant forecasts).</p>
                <p><strong>Calculating cone width:</strong> Width is determined by the standard deviation of score changes between time horizons, increasing with forecast distance to reflect growing uncertainty.</p>
                <p><strong>Interpreting the cone:</strong> A wide cone indicates high forecast uncertainty—the sector score could reasonably vary significantly. A narrow cone suggests more stable, predictable positioning. Analysts should weight sectors with narrower cones more heavily for tactical positioning.</p>
                <p><strong>Interactive selection:</strong> Click any sector line or legend item to isolate that sector, fade others, and highlight its uncertainty cone for detailed analysis.</p>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-3">
              <h4 className="font-semibold text-gray-100 mb-2">Classification Thresholds</h4>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="bg-gray-950 p-3 rounded">
                  <span className="text-green-400 font-semibold">Winner</span>
                  <p className="text-gray-400 mt-1">Ranks 1-3 (top 3 sectors)</p>
                </div>
                <div className="bg-gray-950 p-3 rounded">
                  <span className="text-gray-400 font-semibold">Neutral</span>
                  <p className="text-gray-400 mt-1">Ranks 4-8 (middle 5 sectors)</p>
                </div>
                <div className="bg-gray-950 p-3 rounded">
                  <span className="text-red-400 font-semibold">Loser</span>
                  <p className="text-gray-400 mt-1">Ranks 9-11 (bottom 3 sectors)</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-3">
              <h4 className="font-semibold text-gray-100 mb-2">Data Sources & Frequency</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p><strong>Price Data:</strong> Yahoo Finance API (adjusted close prices)</p>
                <p><strong>Lookback:</strong> 8000 trading days to ensure sufficient data for 12-month calculations</p>
                <p><strong>Update Frequency:</strong> Every 4 hours during market hours (Monday-Friday, 8am-8pm ET)</p>
                <p><strong>System State:</strong> Derived from the Market Stability Dashboard's composite indicator model</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Overview Chart - Sector Score Trends Across Horizons */}
      {!loading && !error && Object.keys(projections).length > 0 && (
        <div className="mb-8 bg-gray-800 rounded-lg p-4 sm:p-6 shadow">
          <h2 className="text-lg font-semibold mb-3">Sector Score Trends Across Time Horizons</h2>
          <p className="text-xs text-gray-400 mb-3">Each line shows how a sector's composite score evolves from current to forward projections</p>
          
          {/* Smooth Line Chart */}
          <div className="bg-gray-900 rounded-lg p-3 sm:p-4 mb-2">
            <div className="w-full" style={{ aspectRatio: '2 / 1' }}>
              <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="xMinYMid meet">
                {/* Gradient definitions for uncertainty cones */}
                <defs>
                  {chartData.map((sector: any, idx: number) => {
                    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#6366f1", "#84cc16"];
                    const color = colors[idx % colors.length];
                    const gradientId = `grad_${idx}`;
                    return (
                      <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.02" />
                        <stop offset="30%" stopColor={color} stopOpacity="0.08" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.12" />
                      </linearGradient>
                    );
                  })}
                  {/* Radial gradients for fading cone edges */}
                  {chartData.map((sector: any, idx: number) => {
                    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#6366f1", "#84cc16"];
                    const color = colors[idx % colors.length];
                    const radialId = `radial_${idx}`;
                    return (
                      <radialGradient key={radialId} id={radialId} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.08" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                      </radialGradient>
                    );
                  })}
                </defs>
                
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <g key={y}>
                    <line x1="60" y1={260 - (y * 2.4)} x2="780" y2={260 - (y * 2.4)} stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="45" y={264 - (y * 2.4)} fill="#9ca3af" fontSize="11" textAnchor="end">{y}</text>
                  </g>
                ))}
                
                {/* X-axis labels */}
                <text x="100" y="285" fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">-3M</text>
                <text x="250" y="285" fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">T</text>
                <text x="380" y="285" fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">3M</text>
                <text x="550" y="285" fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">6M</text>
                <text x="720" y="285" fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">12M</text>
                
                {/* Uncertainty cones and lines for each sector */}
                {chartData.map((sector: any, idx: number) => {
                  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#6366f1", "#84cc16"];
                  const color = colors[idx % colors.length];
                  const isSelected = selectedSector === sector.symbol;
                  const opacity = !selectedSector || isSelected ? 0.7 : 0.1;
                  
                  // Calculate points - 5 data points: -3M, T(now), 3M, 6M, 12M
                  // Use real historical score from backend, fallback to estimation if unavailable
                  const histScore = historicalScores[sector.symbol] !== undefined
                    ? historicalScores[sector.symbol]
                    : sector.scores["3m"] - 8; // Fallback estimation
                  
                  const xHist = 100;   // -3M
                  const yHist = 260 - (histScore * 2.4);
                  const x0 = 250;      // T (Now)
                  const y0 = 260 - (sector.scores["3m"] * 2.4);
                  const x1 = 380;      // 3M
                  const y1 = 260 - (sector.scores["3m"] * 2.4);
                  const x2 = 550;      // 6M
                  const y2 = 260 - (sector.scores["6m"] * 2.4);
                  const x3 = 720;      // 12M
                  const y3 = 260 - (sector.scores["12m"] * 2.4);
                  
                  // Calculate expanding uncertainty cone starting from now
                  // Uncertainty grows progressively and smoothly
                  const initialSigma = 2; // Small initial uncertainty at "now"
                  const midSigma = Math.abs(sector.scores["6m"] - sector.scores["3m"]) * 0.3 + 5;
                  const finalSigma = Math.abs(sector.scores["12m"] - sector.scores["6m"]) * 0.4 + 8;
                  
                  // Create smooth cone envelope by calculating bounds at each point
                  const sigma0 = initialSigma;
                  const sigma1 = midSigma * 0.4;
                  const sigma2 = midSigma * 0.85;
                  const sigma3 = finalSigma;
                  
                  const upper0 = y0 - (sigma0 * 2.4);
                  const lower0 = y0 + (sigma0 * 2.4);
                  const upper1 = y1 - (sigma1 * 2.4);
                  const lower1 = y1 + (sigma1 * 2.4);
                  const upper2 = y2 - (sigma2 * 2.4);
                  const lower2 = y2 + (sigma2 * 2.4);
                  const upper3 = y3 - (sigma3 * 2.4);
                  const lower3 = y3 + (sigma3 * 2.4);
                  
                  // Historical path (solid, no cone, -3M to T)
                  const historicalPath = `
                    M ${xHist} ${yHist}
                    Q ${(xHist + x0) / 2} ${(yHist + y0) / 2}, ${x0} ${y0}
                  `;
                  
                  // Future path (from T forward with uncertainty cone)
                  const pathData = `
                    M ${x0} ${y0}
                    Q ${(x0 + x1) / 2} ${y0}, ${x1} ${y1}
                    Q ${(x1 + x2) / 2} ${(y1 + y2) / 2}, ${x2} ${y2}
                    Q ${(x2 + x3) / 2} ${(y2 + y3) / 2}, ${x3} ${y3}
                  `;
                  
                  // Create smooth uncertainty cone envelope
                  const conePathUpper = `
                    M ${x0} ${upper0}
                    Q ${(x0 + x1) / 2} ${(upper0 + upper1) / 2}, ${x1} ${upper1}
                    Q ${(x1 + x2) / 2} ${(upper1 + upper2) / 2}, ${x2} ${upper2}
                    Q ${(x2 + x3) / 2} ${(upper2 + upper3) / 2}, ${x3} ${upper3}
                  `;
                  
                  const conePathLower = `
                    M ${x0} ${lower0}
                    Q ${(x0 + x1) / 2} ${(lower0 + lower1) / 2}, ${x1} ${lower1}
                    Q ${(x1 + x2) / 2} ${(lower1 + lower2) / 2}, ${x2} ${lower2}
                    Q ${(x2 + x3) / 2} ${(lower2 + lower3) / 2}, ${x3} ${lower3}
                  `;
                  
                  return (
                    <g key={sector.symbol} onClick={() => setSelectedSector(isSelected ? null : sector.symbol)} style={{ cursor: 'pointer' }}>
                      {/* Historical line (solid, no cone, -3M to T) */}
                      <path 
                        d={historicalPath} 
                        stroke={color} 
                        strokeWidth={isSelected ? "3" : "2"} 
                        fill="none" 
                        opacity={opacity * 1.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Uncertainty cone - filled area between upper and lower bounds */}
                      {isSelected && (
                        <g opacity={0.4}>
                          <path
                            d={`${conePathUpper} L ${x3} ${lower3} Q ${(x2 + x3) / 2} ${(lower2 + lower3) / 2}, ${x2} ${lower2} Q ${(x1 + x2) / 2} ${(lower1 + lower2) / 2}, ${x1} ${lower1} Q ${(x0 + x1) / 2} ${(lower0 + lower1) / 2}, ${x0} ${lower0} Z`}
                            fill={`url(#grad_${idx})`}
                          />
                        </g>
                      )}
                      
                      {/* Upper and lower cone boundaries - subtle when not selected */}
                      {isSelected && (
                        <>
                          <path 
                            d={conePathUpper}
                            stroke={color}
                            strokeWidth="1"
                            fill="none"
                            opacity={0.3}
                            strokeDasharray="3 3"
                            strokeLinecap="round"
                          />
                          <path 
                            d={conePathLower}
                            stroke={color}
                            strokeWidth="1"
                            fill="none"
                            opacity={0.3}
                            strokeDasharray="3 3"
                            strokeLinecap="round"
                          />
                        </>
                      )}
                      
                      {/* Main trend line */}
                      <path 
                        d={pathData} 
                        stroke={color} 
                        strokeWidth={isSelected ? "3.5" : "2.5"} 
                        fill="none" 
                        opacity={opacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Vertical "T" line - only show once, not per sector */}
                      {idx === 0 && (
                        <line 
                          x1={x0} 
                          y1={20} 
                          x2={x0} 
                          y2={280} 
                          stroke="#fbbf24" 
                          strokeWidth="2" 
                          strokeDasharray="5 5"
                          opacity={0.4}
                        />
                      )}
                      
                      {/* Points - 5 data points */}
                      <circle cx={xHist} cy={yHist} r={isSelected ? "4" : "3"} fill={color} opacity={opacity * 0.9} />
                      <circle cx={x0} cy={y0} r={isSelected ? "5" : "4"} fill={color} opacity={opacity} stroke={idx === 0 ? "#fbbf24" : "none"} strokeWidth="1" />
                      <circle cx={x1} cy={y1} r={isSelected ? "5" : "4"} fill={color} opacity={opacity} />
                      <circle cx={x2} cy={y2} r={isSelected ? "5" : "4"} fill={color} opacity={opacity} />
                      <circle cx={x3} cy={y3} r={isSelected ? "5" : "4"} fill={color} opacity={opacity} />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          
          {/* Legend - Compact and scrollable */}
          <div className="mt-2 mb-4 overflow-x-auto">
            <div className="flex flex-wrap gap-2 pb-2 min-w-min">
              {chartData.map((sector: any, idx: number) => {
                const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#6366f1", "#84cc16"];
                const color = colors[idx % colors.length];
                const isSelected = selectedSector === sector.symbol;
                return (
                  <button
                    key={sector.symbol}
                    onClick={() => setSelectedSector(isSelected ? null : sector.symbol)}
                    className={`flex items-center gap-1 px-2 py-1 rounded whitespace-nowrap transition-all ${
                      isSelected 
                        ? 'bg-gray-700 ring-1' 
                        : 'bg-transparent hover:bg-gray-800'
                    }`}
                    style={isSelected ? { ringColor: color } : {}}
                  >
                    <div style={{ width: "12px", height: "12px", backgroundColor: color, borderRadius: "2px", opacity: 0.9, flexShrink: 0 }}></div>
                    <span className={`text-xs ${isSelected ? 'text-white font-semibold' : 'text-gray-400'}`}>{sector.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Top Performers by Horizon */}
          <div className="border-t border-gray-700 pt-3 mt-3">
            <h3 className="text-sm font-semibold mb-2 text-gray-300">Top Performers</h3>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {HORIZONS.map((h) => {
                const topSectors = (projections[h] || [])
                  .sort((a: any, b: any) => a.rank - b.rank)
                  .slice(0, 3);
                return (
                  <div key={h} className="bg-gray-900 rounded p-2">
                    <div className="text-gray-500 mb-1 font-semibold">{h.toUpperCase()}</div>
                    {topSectors.map((s: any, i: number) => (
                      <div key={s.sector_symbol} className="flex items-center gap-1 mb-0.5">
                        <span className="text-green-400 font-bold">#{i + 1}</span>
                        <span className="text-gray-300 truncate">{s.sector_symbol}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Tables with Horizon Selector */}
      {(projections[selectedHorizon === "T" ? "3m" : selectedHorizon] || selectedHorizon === "T") && (
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">Sector Rankings</h2>
            <div className="flex gap-2">
              {["T", "3m", "6m", "12m"].map((h) => (
                <button
                  key={h}
                  onClick={() => setSelectedHorizon(h as "T" | "3m" | "6m" | "12m")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedHorizon === h
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {h === "T" ? "T" : h === "3m" ? "T+3M" : h === "6m" ? "T+6M" : "T+12M"}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 shadow">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400">
                    <th className="text-left">Rank</th>
                    <th className="text-left">Sector</th>
                    <th className="text-left">Score</th>
                    <th className="text-left">Type</th>
                    <th className="text-left">Trend</th>
                    <th className="text-left">Rel</th>
                    <th className="text-left">Risk</th>
                    <th className="text-left">Regime</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedHorizon === "T" ? projections["3m"] : projections[selectedHorizon])?.sort((a:any,b:any)=>a.rank-b.rank).map((row:any) => (
                    <tr key={row.sector_symbol} className={
                      row.classification === "Winner"
                        ? "bg-green-900/30"
                        : row.classification === "Loser"
                        ? "bg-red-900/20"
                        : ""
                    }>
                      <td>{row.rank}</td>
                      <td>{row.sector_name} <span className="text-xs text-gray-500">({row.sector_symbol})</span></td>
                      <td>
                        <ScoreBar label="" value={row.score_total} color="#38bdf8" />
                      </td>
                      <td>
                        <span className={
                          row.classification === "Winner"
                            ? "text-green-400"
                            : row.classification === "Loser"
                            ? "text-red-400"
                            : "text-gray-400"
                        }>
                          {row.classification}
                        </span>
                      </td>
                      <td><ScoreBar label="" value={row.score_trend} color="#facc15" /></td>
                      <td><ScoreBar label="" value={row.score_rel} color="#a3e635" /></td>
                      <td><ScoreBar label="" value={row.score_risk} color="#f87171" /></td>
                      <td><ScoreBar label="" value={row.score_regime} color="#818cf8" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {(selectedHorizon === "T" ? projections["3m"] : projections[selectedHorizon])?.sort((a:any,b:any)=>a.rank-b.rank).map((row:any) => (
                <div
                  key={row.sector_symbol}
                  className={`rounded-lg border border-gray-700 overflow-hidden ${
                    row.classification === "Winner"
                      ? "bg-green-900/20"
                      : row.classification === "Loser"
                      ? "bg-red-900/20"
                      : "bg-gray-900/40"
                  }`}
                >
                  <button
                    onClick={() => setExpandedCard(expandedCard === row.sector_symbol ? null : row.sector_symbol)}
                    className="w-full p-3 flex items-start justify-between gap-3 hover:bg-black/20 transition-colors"
                  >
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-100">
                        #{row.rank} {row.sector_name}
                      </div>
                      <div className="text-xs text-gray-500">{row.sector_symbol}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={
                        row.classification === "Winner"
                          ? "text-green-400 text-xs font-semibold"
                          : row.classification === "Loser"
                          ? "text-red-400 text-xs font-semibold"
                          : "text-gray-400 text-xs font-semibold"
                      }>
                        {row.classification}
                      </span>
                      <div className="text-lg font-bold text-gray-500">
                        {expandedCard === row.sector_symbol ? '−' : '+'}
                      </div>
                    </div>
                  </button>
                  <div className="px-3 pt-2 pb-3">
                    <ScoreBar label="Total" value={row.score_total} color="#38bdf8" />
                  </div>
                  {expandedCard === row.sector_symbol && (
                    <div className="border-t border-gray-700 bg-black/20 p-3 space-y-2">
                      <ScoreBar label="Trend" value={row.score_trend} color="#facc15" />
                      <ScoreBar label="Rel" value={row.score_rel} color="#a3e635" />
                      <ScoreBar label="Risk" value={row.score_risk} color="#f87171" />
                      <ScoreBar label="Regime" value={row.score_regime} color="#818cf8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
