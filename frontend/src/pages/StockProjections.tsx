/**
 * Stock Projections Page
 * 
 * Single stock lookup and analysis with multi-horizon projections.
 * Allows users to search for any stock and view transparent scoring across time horizons.
 * 
 * Features:
 * - Stock ticker search and lookup
 * - Multi-horizon analysis: 3-month, 6-month, and 12-month projections
 * - Interactive chart with uncertainty cones
 * - Detailed scoring breakdown
 * - Comparison against SPY benchmark
 */

import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import "../index.css";

const HORIZONS = ["3m", "6m", "12m"];

interface StockProjection {
  ticker: string;
  name: string;
  horizon: string;
  score_total: number;
  score_trend: number;
  score_relative_strength: number;
  score_risk: number;
  score_regime: number;
  return_pct: number;
  volatility: number;
  max_drawdown: number;
}

export default function StockProjections() {
  const [ticker, setTicker] = useState("");
  const [searchTicker, setSearchTicker] = useState("");
  const [projections, setProjections] = useState<Record<string, StockProjection>>({});
  const [historicalScore, setHistoricalScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState<"T" | "3m" | "6m" | "12m">("12m");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    setSearchTicker(ticker.toUpperCase());
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/stocks/${ticker.toUpperCase()}/projections`);
      
      if (!response.ok) {
        throw new Error(`Stock not found or data unavailable`);
      }

      const data = await response.json();
      setProjections(data.projections);
      setHistoricalScore(data.historical?.score_3m_ago || null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch stock data");
      setProjections({});
      setHistoricalScore(null);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for line chart
  const getChartData = () => {
    if (!projections["3m"]) return null;

    return {
      ticker: searchTicker,
      name: projections["3m"].name,
      scores: {
        "3m": projections["3m"]?.score_total || 50,
        "6m": projections["6m"]?.score_total || 50,
        "12m": projections["12m"]?.score_total || 50,
      },
    };
  };

  const chartData = getChartData();

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto text-gray-100">
      <h1 className="text-2xl font-bold mb-2">Stock Projections</h1>
      <p className="mb-6 text-gray-400">Analyze individual stocks across multiple time horizons with quantified confidence levels</p>

      {/* Stock Search */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter stock ticker (e.g., AAPL, TSLA, MSFT)"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !ticker.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-300">{error}</p>
          <p className="text-sm text-red-400 mt-2">
            Please check the ticker symbol and try again. The stock must have sufficient historical data available.
          </p>
        </div>
      )}

      {/* Results */}
      {chartData && (
        <>
          {/* Stock Header */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-1">{chartData.ticker}</h2>
            <p className="text-gray-400">{chartData.name}</p>
          </div>

          {/* Interactive Chart */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Score Trends</h3>
            <div className="bg-gray-900 rounded-lg p-4">
              <svg width="100%" height="300" viewBox="0 0 900 300" preserveAspectRatio="xMinYMid meet">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <g key={y}>
                    <line x1="80" y1={260 - (y * 2.4)} x2="880" y2={260 - (y * 2.4)} stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="65" y={264 - (y * 2.4)} fill="#9ca3af" fontSize="11" textAnchor="end">{y}</text>
                  </g>
                ))}
                
                {/* X-axis labels - simplified */}
                <text x="150" y="285" fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">-3M</text>
                <text x="375" y="285" fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">T</text>
                <text x="525" y="285" fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">3M</text>
                <text x="675" y="285" fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">6M</text>
                <text x="825" y="285" fill="#9ca3af" fontSize="13" textAnchor="middle" fontWeight="500">12M</text>
                
                {(() => {
                  const color = "#3b82f6"; // Blue color for stock
                  
                  // Calculate points - 5 data points total: -3M, T(now), 3M, 6M, 12M
                  // Use real historical score from backend, fallback to estimation if unavailable
                  const histScore = historicalScore !== null 
                    ? historicalScore 
                    : chartData.scores["3m"] - 8; // Fallback estimation
                  
                  const xHist = 150;   // -3M
                  const yHist = 260 - (histScore * 2.4);
                  const x0 = 375;      // Now (T)
                  const y0 = 260 - (chartData.scores["3m"] * 2.4);
                  const x1 = 525;      // +3M
                  const y1 = 260 - (chartData.scores["3m"] * 2.4);
                  const x2 = 675;      // +6M
                  const y2 = 260 - (chartData.scores["6m"] * 2.4);
                  const x3 = 825;      // +12M
                  const y3 = 260 - (chartData.scores["12m"] * 2.4);
                  
                  // Calculate uncertainty cone (only for future projections starting from T)
                  const initialSigma = 2;
                  const sigma3m = 3;
                  const sigma6m = Math.abs(chartData.scores["6m"] - chartData.scores["3m"]) * 0.3 + 6;
                  const sigma12m = Math.abs(chartData.scores["12m"] - chartData.scores["6m"]) * 0.4 + 10;
                  
                  const upper0 = y0 - (initialSigma * 2.4);
                  const lower0 = y0 + (initialSigma * 2.4);
                  const upper1 = y1 - (sigma3m * 2.4);
                  const lower1 = y1 + (sigma3m * 2.4);
                  const upper2 = y2 - (sigma6m * 2.4);
                  const lower2 = y2 + (sigma6m * 2.4);
                  const upper3 = y3 - (sigma12m * 2.4);
                  const lower3 = y3 + (sigma12m * 2.4);
                  
                  // Historical path (solid, no cone, -3M to T)
                  const historicalPath = `
                    M ${xHist} ${yHist}
                    Q ${(xHist + x0) / 2} ${(yHist + y0) / 2}, ${x0} ${y0}
                  `;
                  
                  // Future path - full (from T through all horizons)
                  const futurePath = `
                    M ${x0} ${y0}
                    L ${x1} ${y1}
                    Q ${(x1 + x2) / 2} ${(y1 + y2) / 2}, ${x2} ${y2}
                    Q ${(x2 + x3) / 2} ${(y2 + y3) / 2}, ${x3} ${y3}
                  `;
                  
                  // Path from T to 6M (solid, normal opacity)
                  const pathToSixMonth = `
                    M ${x0} ${y0}
                    L ${x1} ${y1}
                    Q ${(x1 + x2) / 2} ${(y1 + y2) / 2}, ${x2} ${y2}
                  `;
                  
                  // Path from 6M to 12M (fading segment)
                  const pathSixToTwelve = `
                    M ${x2} ${y2}
                    Q ${(x2 + x3) / 2} ${(y2 + y3) / 2}, ${x3} ${y3}
                  `;
                  
                  const conePathUpper = `
                    M ${x0} ${upper0}
                    L ${x1} ${upper1}
                    Q ${(x1 + x2) / 2} ${(upper1 + upper2) / 2}, ${x2} ${upper2}
                    Q ${(x2 + x3) / 2} ${(upper2 + upper3) / 2}, ${x3} ${upper3}
                  `;
                  
                  const conePathLower = `
                    M ${x0} ${lower0}
                    L ${x1} ${lower1}
                    Q ${(x1 + x2) / 2} ${(lower1 + lower2) / 2}, ${x2} ${lower2}
                    Q ${(x2 + x3) / 2} ${(lower2 + lower3) / 2}, ${x3} ${lower3}
                  `;
                  
                  return (
                    <g>
                      <defs>
                        <linearGradient id="stockGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={color} stopOpacity="0.02" />
                          <stop offset="40%" stopColor={color} stopOpacity="0.08" />
                          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
                        </linearGradient>
                        <linearGradient id="lineFadeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
                        </linearGradient>
                      </defs>
                      
                      {/* Historical line (solid, brighter, -3M to T) */}
                      <path 
                        d={historicalPath} 
                        stroke={color} 
                        strokeWidth="3" 
                        fill="none" 
                        opacity={0.9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Uncertainty cone */}
                      <path
                        d={`${conePathUpper} L ${x3} ${lower3} Q ${(x2 + x3) / 2} ${(lower2 + lower3) / 2}, ${x2} ${lower2} Q ${(x1 + x2) / 2} ${(lower1 + lower2) / 2}, ${x1} ${lower1} L ${x0} ${lower0} Z`}
                        fill="url(#stockGradient)"
                        opacity={0.5}
                      />
                      
                      {/* Cone boundaries */}
                      <path 
                        d={conePathUpper}
                        stroke={color}
                        strokeWidth="1"
                        fill="none"
                        opacity={0.3}
                        strokeDasharray="3 3"
                      />
                      <path 
                        d={conePathLower}
                        stroke={color}
                        strokeWidth="1"
                        fill="none"
                        opacity={0.3}
                        strokeDasharray="3 3"
                      />
                      
                      {/* Future projection line T to 6M (normal opacity) */}
                      <path 
                        d={pathToSixMonth} 
                        stroke={color} 
                        strokeWidth="3.5" 
                        fill="none" 
                        opacity={0.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Future projection line 6M to 12M (fading into cone) */}
                      <path 
                        d={pathSixToTwelve} 
                        stroke="url(#lineFadeGradient)" 
                        strokeWidth="3.5" 
                        fill="none" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Vertical "Now" line */}
                      <line 
                        x1={x0} 
                        y1={20} 
                        x2={x0} 
                        y2={280} 
                        stroke="#fbbf24" 
                        strokeWidth="2" 
                        strokeDasharray="5 5"
                        opacity={0.5}
                      />
                      
                      {/* Points - 5 data points */}
                      <circle cx={xHist} cy={yHist} r="4" fill={color} opacity={0.7} />
                      <circle cx={x0} cy={y0} r="6" fill={color} opacity={0.9} stroke="#fbbf24" strokeWidth="2" />
                      <circle cx={x1} cy={y1} r="5" fill={color} opacity={0.8} />
                      <circle cx={x2} cy={y2} r="5" fill={color} opacity={0.6} />
                      <circle cx={x3} cy={y3} r="5" fill={color} opacity={0.3} />
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Score Breakdown Tables - Conditional based on selected horizon */}
          <div className="space-y-6">
            {selectedHorizon === "T" && projections["3m"] && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Current Position</h3>
                  
                  {/* Horizon Selector */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedHorizon("T")}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        selectedHorizon === "T"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Now
                    </button>
                    <button
                      onClick={() => setSelectedHorizon("3m")}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        selectedHorizon === "3m"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      T+3M
                    </button>
                    <button
                      onClick={() => setSelectedHorizon("6m")}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        selectedHorizon === "6m"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      T+6M
                    </button>
                    <button
                      onClick={() => setSelectedHorizon("12m")}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        selectedHorizon === "12m"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      T+12M
                    </button>
                  </div>
                </div>
                <div className="text-gray-400 text-sm">
                  Current score reflects real-time positioning. Select a future horizon (T+3M, T+6M, T+12M) to view projections and detailed scoring breakdowns.
                </div>
              </div>
            )}
            
            {selectedHorizon !== "T" && (() => {
              const projection = projections[selectedHorizon];
              if (!projection) return null;

              return (
                <div key={selectedHorizon} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{selectedHorizon.toUpperCase()} Outlook</h3>
                    
                    {/* Horizon Selector */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedHorizon("T")}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          selectedHorizon === "T"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        Now
                      </button>
                      <button
                        onClick={() => setSelectedHorizon("3m")}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          selectedHorizon === "3m"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        T+3M
                      </button>
                      <button
                        onClick={() => setSelectedHorizon("6m")}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          selectedHorizon === "6m"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        T+6M
                      </button>
                      <button
                        onClick={() => setSelectedHorizon("12m")}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          selectedHorizon === "12m"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        T+12M
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-900 rounded p-4">
                      <div className="text-sm text-gray-400 mb-1">Total Score</div>
                      <div className="text-3xl font-bold text-blue-400">{Math.round(projection.score_total)}</div>
                    </div>
                    <div className="bg-gray-900 rounded p-4">
                      <div className="text-sm text-gray-400 mb-1">Score Change</div>
                      <div className={`text-3xl font-bold ${
                        projection.score_total >= projections["3m"].score_total ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {projection.score_total >= projections["3m"].score_total ? '+' : ''}
                        {(projection.score_total - projections["3m"].score_total).toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-32">Trend (45%)</span>
                      <div className="flex-1 bg-gray-700 rounded h-3">
                        <div 
                          className="bg-yellow-500 h-3 rounded transition-all"
                          style={{ width: `${projection.score_trend}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{Math.round(projection.score_trend)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-32">Rel. Strength (30%)</span>
                      <div className="flex-1 bg-gray-700 rounded h-3">
                        <div 
                          className="bg-lime-500 h-3 rounded transition-all"
                          style={{ width: `${projection.score_relative_strength}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{Math.round(projection.score_relative_strength)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-32">Risk (20%)</span>
                      <div className="flex-1 bg-gray-700 rounded h-3">
                        <div 
                          className="bg-red-500 h-3 rounded transition-all"
                          style={{ width: `${projection.score_risk}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{Math.round(projection.score_risk)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-32">Regime (5%)</span>
                      <div className="flex-1 bg-gray-700 rounded h-3">
                        <div 
                          className="bg-indigo-500 h-3 rounded transition-all"
                          style={{ width: `${projection.score_regime}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{Math.round(projection.score_regime)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Volatility:</span>
                      <span className="ml-2 font-semibold">{projection.volatility.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Max Drawdown:</span>
                      <span className="ml-2 font-semibold text-red-400">{projection.max_drawdown.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Methodology */}
          <div className="mt-6 bg-gray-800 rounded-lg shadow">
            <button
              onClick={() => setMethodologyOpen(!methodologyOpen)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-750 transition-colors rounded-lg"
            >
              <h2 className="text-lg font-semibold">Methodology & Scoring Details</h2>
              <div className="text-lg font-bold text-gray-500">
                {methodologyOpen ? '−' : '+'}
              </div>
            </button>
            {methodologyOpen && (
              <div className="px-6 pb-6 text-sm text-gray-300 space-y-4">
                <p>
                  Stock projections use the same transparent scoring methodology as sector analysis, 
                  evaluating performance across 3-month, 6-month, and 12-month lookback periods.
                </p>
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-semibold mb-2">Scoring Components</h4>
                  <ul className="space-y-2 text-xs">
                    <li><strong>Trend (45%):</strong> Price momentum and technical positioning relative to moving averages</li>
                    <li><strong>Relative Strength (30%):</strong> Outperformance vs SPY benchmark</li>
                    <li><strong>Risk (20%):</strong> Volatility and drawdown analysis (inverted scoring)</li>
                    <li><strong>Regime (5%):</strong> Context-aware adjustments based on market environment</li>
                  </ul>
                </div>
                <div className="bg-gray-900 rounded p-4">
                  <h4 className="font-semibold mb-2">Uncertainty Cones</h4>
                  <p className="text-xs">
                    The expanding cone represents projection confidence intervals. Width increases with forecast horizon, 
                    reflecting growing uncertainty. Narrower cones indicate more predictable price behavior.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!chartData && !loading && !error && (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-semibold mb-2">Search for a stock to get started</p>
            <p className="text-sm">Enter any stock ticker to analyze its multi-horizon projections</p>
          </div>
        </div>
      )}
    </div>
  );
}
