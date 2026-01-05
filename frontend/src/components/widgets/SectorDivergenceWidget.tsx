/**
 * Sector Divergence Widget
 * 
 * Dashboard widget displaying sector leadership patterns and regime alignment.
 * Helps identify macro market positioning by comparing defensive vs cyclical sector performance.
 * 
 * Key Metrics:
 * - Defensive Average: XLU (Utilities), XLP (Staples), XLV (Healthcare)
 * - Cyclical Average: XLE (Energy), XLF (Financials), XLK (Tech), XLY (Discretionary)
 * - Regime Alignment: How well sector leadership matches expected patterns for current market state
 * - Sector Breadth: Count of improving vs deteriorating sectors across horizons
 * 
 * Interpretations:
 * - RED market + defensive lead = Flight to safety (expected)
 * - RED market + cyclical lead = Risk appetite emerging (potential reversal signal)
 * - GREEN market + cyclical lead = Risk-on mode (healthy)
 * - GREEN market + defensive lead = Caution creeping in (early warning)
 * 
 * @component
 */

import { useEffect, useState } from "react";
import { getLegacyApiUrl } from "../../utils/apiUtils";
import { Link } from "react-router-dom";

interface SectorSummary {
  as_of_date: string;
  system_state: string;
  defensive_avg: number;
  cyclical_avg: number;
  defensive_vs_cyclical: number;
  regime_alignment_score: number;
  sector_breadth: {
    improving: number;
    deteriorating: number;
    stable: number;
  };
  top_defensive: Array<{ symbol: string; name: string; score: number }>;
  top_cyclical: Array<{ symbol: string; name: string; score: number }>;
}

interface SectorProjections {
  "3m": Array<{ sector_symbol: string; sector_name: string; score_total: number }>;
  "6m": Array<{ sector_symbol: string; sector_name: string; score_total: number }>;
  "12m": Array<{ sector_symbol: string; sector_name: string; score_total: number }>;
}

interface Props {
  trendPeriod?: 90 | 180 | 365;
}

export default function SectorDivergenceWidget({ trendPeriod = 90 }: Props) {
  const [data, setData] = useState<SectorSummary | null>(null);
  const [projections, setProjections] = useState<SectorProjections | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = getLegacyApiUrl();
        const [summaryRes, projectionsRes] = await Promise.all([
          fetch(`${apiUrl}/sectors/summary`),
          fetch(`${apiUrl}/sectors/projections/latest`)
        ]);
        const summaryData = await summaryRes.json();
        const projectionsData = await projectionsRes.json();
        setData(summaryData);
        setProjections(projectionsData.projections);
      } catch (error) {
        console.error("Failed to fetch sector data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-stealth-800 rounded-lg p-6 shadow-lg border border-stealth-700">
        <h3 className="text-lg font-semibold mb-4">Sector Divergence</h3>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!data || !projections) {
    return null;
  }

  const getStateColor = (state: string) => {
    if (state === "RED") return "text-red-400";
    if (state === "GREEN") return "text-green-400";
    return "text-yellow-400";
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 65) return "text-green-400";
    if (score >= 45) return "text-yellow-400";
    return "text-red-400";
  };

  // Prepare chart data with trend analysis
  const chartData = projections["3m"].map(sector => {
    const score3m = sector.score_total;
    const score6m = projections["6m"].find(s => s.sector_symbol === sector.sector_symbol)?.score_total || 50;
    const score12m = projections["12m"].find(s => s.sector_symbol === sector.sector_symbol)?.score_total || 50;
    return {
      name: sector.sector_name,
      symbol: sector.sector_symbol,
      scores: { "3m": score3m, "6m": score6m, "12m": score12m },
      trend: score12m - score3m, // positive = improving over time
      volatility: Math.abs(score6m - score3m) + Math.abs(score12m - score6m)
    };
  });

  // Sort by 12m score to identify leaders/laggards
  const sortedByScore = [...chartData].sort((a, b) => b.scores["12m"] - a.scores["12m"]);
  const topPerformers = sortedByScore.slice(0, 3);
  const bottomPerformers = sortedByScore.slice(-3);

  // Interpret the defensive vs cyclical spread
  const getMarketInterpretation = () => {
    const spread = data.defensive_vs_cyclical;
    const isRed = data.system_state === "RED";
    const isGreen = data.system_state === "GREEN";
    
    if (isRed && spread > 5) {
      return { text: "Flight to Safety", color: "text-blue-400", desc: "Investors seeking defensive positioning amid stress" };
    } else if (isRed && spread < -5) {
      return { text: "Risk Appetite Emerging", color: "text-green-400", desc: "Cyclicals gaining despite red regime - potential reversal signal" };
    } else if (isGreen && spread < -5) {
      return { text: "Risk-On Mode", color: "text-orange-400", desc: "Growth sectors leading as expected in healthy market" };
    } else if (isGreen && spread > 5) {
      return { text: "Caution Creeping In", color: "text-yellow-400", desc: "Defensives outperforming in green market - early warning sign" };
    } else {
      return { text: "Balanced Rotation", color: "text-gray-400", desc: "No clear defensive or cyclical bias" };
    }
  };

  const interpretation = getMarketInterpretation();

  return (
    <div className="bg-stealth-800 rounded-lg p-6 shadow-lg border border-stealth-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Sector Divergence Analysis</h3>
        <Link 
          to="/sector-projections" 
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Details →
        </Link>
      </div>

      {/* Market Interpretation - Prominent Card */}
      <div className="bg-gradient-to-br from-stealth-900 to-stealth-850 rounded-lg p-4 mb-6 border border-stealth-600">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className={`text-lg font-bold ${interpretation.color} mb-2`}>
              {interpretation.text}
            </div>
            <div className="text-sm text-gray-400">
              {interpretation.desc}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-gray-500 mb-1">Def vs Cyc</div>
            <div className={`text-2xl font-bold ${data.defensive_vs_cyclical > 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              {data.defensive_vs_cyclical > 0 ? '+' : ''}{data.defensive_vs_cyclical}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-stealth-900 rounded-lg p-4 border border-stealth-700">
          <div className="text-xs text-gray-400 mb-2">Regime Alignment</div>
          <div className="flex items-end justify-between">
            <div className={`text-3xl font-bold ${getAlignmentColor(data.regime_alignment_score)}`}>
              {data.regime_alignment_score}
            </div>
            <div className="text-xs text-gray-500">/100</div>
          </div>
          <div className="text-xs text-gray-500 mt-2 leading-tight">
            {data.regime_alignment_score >= 65 && "Sectors aligned"}
            {data.regime_alignment_score >= 45 && data.regime_alignment_score < 65 && "Mixed positioning"}
            {data.regime_alignment_score < 45 && "Diverged regime"}
          </div>
        </div>

        <div className="bg-stealth-900 rounded-lg p-4 border border-stealth-700">
          <div className="text-xs text-gray-400 mb-2">Sector Breadth</div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-green-400 font-bold text-2xl">{data.sector_breadth.improving}</div>
              <div className="text-xs text-gray-500">Improving</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-bold text-lg">{data.sector_breadth.stable}</div>
              <div className="text-xs text-gray-500">Stable</div>
            </div>
            <div>
              <div className="text-red-400 font-bold text-2xl">{data.sector_breadth.deteriorating}</div>
              <div className="text-xs text-gray-500">Falling</div>
            </div>
          </div>
        </div>

        <div className="bg-stealth-900 rounded-lg p-4 border border-stealth-700">
          <div className="text-xs text-gray-400 mb-2">System State</div>
          <div className={`text-3xl font-bold ${getStateColor(data.system_state)} mb-2`}>
            {data.system_state}
          </div>
          <div className="text-xs text-gray-500">
            Market regime: {data.system_state === "GREEN" ? "Healthy" : data.system_state === "YELLOW" ? "Cautious" : "Stressed"}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-stealth-900 rounded-lg p-4 mb-6 border border-stealth-700">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-stealth-200">Score Trends (3M → 12M)</div>
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              <span className="text-gray-500">Leaders</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <span className="text-gray-500">Laggards</span>
            </div>
          </div>
        </div>
        <svg width="100%" height="150" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid meet" className="w-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <g key={y}>
              <line x1="30" y1={125 - (y * 1.25)} x2="380" y2={125 - (y * 1.25)} stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="20" y={128 - (y * 1.25)} fill="#9ca3af" fontSize="8" textAnchor="end">{y}</text>
            </g>
          ))}
          
          {/* X-axis labels */}
          <text x="50" y="143" fill="#9ca3af" fontSize="9" textAnchor="middle">Today</text>
          <text x="120" y="143" fill="#9ca3af" fontSize="9" textAnchor="middle">3M</text>
          <text x="210" y="143" fill="#9ca3af" fontSize="9" textAnchor="middle">6M</text>
          <text x="360" y="143" fill="#9ca3af" fontSize="9" textAnchor="middle">12M</text>
          
          {/* Draw all lines */}
          {chartData.map((sector, idx) => {
            const isTop = topPerformers.some(p => p.symbol === sector.symbol);
            const isBottom = bottomPerformers.some(p => p.symbol === sector.symbol);
            const opacity = isTop || isBottom ? 0.8 : 0.15;
            const strokeWidth = isTop || isBottom ? 2.5 : 1;
            
            let color = "#6b7280";
            if (isTop) color = "#10b981";
            if (isBottom) color = "#ef4444";
            
            const x1 = 50;  // Today
            const y1 = 125 - (sector.scores["3m"] * 1.25);  // Use 3m as starting point
            const x2 = 120;  // 3M
            const y2 = 125 - (sector.scores["3m"] * 1.25);
            const x3 = 210;  // 6M
            const y3 = 125 - (sector.scores["6m"] * 1.25);
            const x4 = 360;  // 12M
            const y4 = 125 - (sector.scores["12m"] * 1.25);
            
            const pathData = `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2}, ${x2} ${y2} Q ${(x2 + x3) / 2} ${(y2 + y3) / 2}, ${x3} ${y3} Q ${(x3 + x4) / 2} ${(y3 + y4) / 2}, ${x4} ${y4}`;
            
            return (
              <g key={sector.symbol}>
                <path d={pathData} stroke={color} strokeWidth={strokeWidth} fill="none" opacity={opacity} strokeLinecap="round" strokeLinejoin="round" />
                {(isTop || isBottom) && (
                  <text x="368" y={y4 + 3} fill={color} fontSize="9" fontWeight="600" opacity={opacity}>
                    {sector.symbol}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Expandable Sector Details */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-stealth-200 mb-3">All Sectors (12M Outlook)</div>
        {sortedByScore.map((sector) => (
          <div 
            key={sector.symbol}
            className="bg-stealth-900 rounded-lg border border-stealth-700 overflow-hidden hover:border-stealth-600 transition-colors"
          >
            <button
              onClick={() => setExpandedSector(expandedSector === sector.symbol ? null : sector.symbol)}
              className="w-full p-4 flex items-center justify-between hover:bg-stealth-850 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="font-semibold text-stealth-100 w-12">{sector.symbol}</div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">{sector.name}</div>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    // Get projection data for this sector
                    const etfMap: {[key: string]: string} = {
                      "XLE": "Energy", "XLF": "Financials", "XLK": "Technology", "XLY": "Consumer Discretionary",
                      "XLP": "Consumer Staples", "XLV": "Health Care", "XLI": "Industrials", "XLU": "Utilities",
                      "XLB": "Materials", "XLRE": "Real Estate", "XLC": "Communication Services"
                    };
                    const sectorName = etfMap[sector.symbol];
                    const proj3m = projections?.["3m"]?.find((p: any) => p.sector_name === sectorName);
                    const proj6m = projections?.["6m"]?.find((p: any) => p.sector_name === sectorName);
                    const proj12m = projections?.["12m"]?.find((p: any) => p.sector_name === sectorName);
                    
                    if (!proj3m) return null;
                    
                    const score3m = proj3m.score_total;
                    const score6m = proj6m?.score_total || score3m;
                    const score12m = proj12m?.score_total || score3m;
                    
                    const scores = [score3m, score6m, score12m];
                    const sparkPoints = scores.map((score) => {
                      const normalized = Math.max(0, Math.min(100, score));
                      return 20 - (normalized / 100) * 20;
                    });
                    
                    const trendUp = score12m > score3m;
                    const trendDown = score12m < score3m;
                    
                    return (
                      <div className="flex flex-col items-end">
                        <svg width="45" height="20" viewBox="0 0 45 20" className="flex-shrink-0">
                          <path
                            d={`M 0,${sparkPoints[0]} Q 7,${(sparkPoints[0] + sparkPoints[1]) / 2} 15,${sparkPoints[1]} Q 22,${(sparkPoints[1] + sparkPoints[2]) / 2} 45,${sparkPoints[2]}`}
                            fill="none"
                            stroke={trendUp ? '#10b981' : trendDown ? '#ef4444' : '#6b7280'}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="45" cy={sparkPoints[2]} r="1.5" fill={trendUp ? '#10b981' : trendDown ? '#ef4444' : '#6b7280'} />
                        </svg>
                        <div className="text-[9px] text-gray-500">T + 12M</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-500 transition-transform">
                {expandedSector === sector.symbol ? '−' : '+'}
              </div>
            </button>

            {expandedSector === sector.symbol && (
              <div className="bg-stealth-950 border-t border-stealth-700 p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">3-Month</div>
                    <div className="text-lg font-bold text-stealth-100">{sector.scores["3m"].toFixed(0)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">6-Month</div>
                    <div className="text-lg font-bold text-stealth-100">{sector.scores["6m"].toFixed(0)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">12-Month</div>
                    <div className="text-lg font-bold text-stealth-100">{sector.scores["12m"].toFixed(0)}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-stealth-700">
                  <div className="text-xs text-gray-400 mb-2">Trend Analysis</div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Overall Change:</span>
                    <span className={sector.trend > 0 ? 'text-green-400' : sector.trend < 0 ? 'text-red-400' : 'text-gray-400'}>
                      {sector.trend > 0 ? '+' : ''}{sector.trend.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span>Volatility:</span>
                    <span className="text-gray-400">{sector.volatility.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
