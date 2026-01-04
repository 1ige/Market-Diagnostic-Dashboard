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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Sector Divergence Analysis</h3>
        <Link 
          to="/sector-projections" 
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Details →
        </Link>
      </div>

      {/* Trend Chart with Legend */}
      <div className="bg-stealth-900 rounded p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-400">Score Trends Across Horizons</div>
          <div className="flex gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-gray-500">Leaders</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-gray-500">Laggards</span>
            </div>
          </div>
        </div>
        <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <g key={y}>
              <line x1="30" y1={155 - (y * 1.5)} x2="380" y2={155 - (y * 1.5)} stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="20" y={158 - (y * 1.5)} fill="#9ca3af" fontSize="8" textAnchor="end">{y}</text>
            </g>
          ))}
          
          {/* X-axis labels */}
          <text x="70" y="173" fill="#9ca3af" fontSize="9" textAnchor="middle">Now</text>
          <text x="160" y="173" fill="#9ca3af" fontSize="9" textAnchor="middle">3M</text>
          <text x="250" y="173" fill="#9ca3af" fontSize="9" textAnchor="middle">6M</text>
          <text x="340" y="173" fill="#9ca3af" fontSize="9" textAnchor="middle">12M</text>
          
          {/* Draw all lines with reduced opacity first */}
          {chartData.map((sector, idx) => {
            const isTop = topPerformers.some(p => p.symbol === sector.symbol);
            const isBottom = bottomPerformers.some(p => p.symbol === sector.symbol);
            const opacity = isTop || isBottom ? 0.8 : 0.15;
            const strokeWidth = isTop || isBottom ? 2 : 1;
            
            let color = "#6b7280"; // gray for middle pack
            if (isTop) color = "#10b981"; // green for leaders
            if (isBottom) color = "#ef4444"; // red for laggards
            
            const x0 = 70;
            const y0 = 155 - (sector.scores["3m"] * 1.5);
            const x1 = 160;
            const y1 = 155 - (sector.scores["3m"] * 1.5);
            const x2 = 250;
            const y2 = 155 - (sector.scores["6m"] * 1.5);
            const x3 = 340;
            const y3 = 155 - (sector.scores["12m"] * 1.5);
            
            const pathData = `
              M ${x0} ${y0}
              Q ${(x0 + x1) / 2} ${y0}, ${x1} ${y1}
              Q ${(x1 + x2) / 2} ${(y1 + y2) / 2}, ${x2} ${y2}
              Q ${(x2 + x3) / 2} ${(y2 + y3) / 2}, ${x3} ${y3}
            `;
            
            return (
              <g key={sector.symbol}>
                <path 
                  d={pathData} 
                  stroke={color} 
                  strokeWidth={strokeWidth} 
                  fill="none" 
                  opacity={opacity}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Add label for top/bottom performers at the end */}
                {(isTop || isBottom) && (
                  <text 
                    x="345" 
                    y={y3 + 3} 
                    fill={color} 
                    fontSize="8" 
                    opacity={opacity}
                  >
                    {sector.symbol}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Market Interpretation */}
      <div className="bg-stealth-900 rounded p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className={`text-sm font-bold ${interpretation.color} mb-1`}>
              {interpretation.text}
            </div>
            <div className="text-xs text-gray-400">
              {interpretation.desc}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Def vs Cyc</div>
            <div className={`text-lg font-bold ${data.defensive_vs_cyclical > 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              {data.defensive_vs_cyclical > 0 ? '+' : ''}{data.defensive_vs_cyclical}
            </div>
          </div>
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-stealth-900 rounded p-3">
          <div className="text-xs text-gray-400 mb-2">Leading Sectors</div>
          {topPerformers.map((sector, idx) => (
            <div key={sector.symbol} className="flex items-center justify-between text-xs mb-1">
              <span className="text-green-400">{sector.symbol}</span>
              <span className="text-gray-400 text-[10px]">
                {sector.trend > 0 ? '↗' : sector.trend < -5 ? '↘' : '→'} {sector.scores["12m"].toFixed(0)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="bg-stealth-900 rounded p-3">
          <div className="text-xs text-gray-400 mb-2">Lagging Sectors</div>
          {bottomPerformers.map((sector, idx) => (
            <div key={sector.symbol} className="flex items-center justify-between text-xs mb-1">
              <span className="text-red-400">{sector.symbol}</span>
              <span className="text-gray-400 text-[10px]">
                {sector.trend > 0 ? '↗' : sector.trend < -5 ? '↘' : '→'} {sector.scores["12m"].toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divergence Indicator */}
      <div className="bg-stealth-900 rounded p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Def vs Cyc Spread</span>
          <span className={`text-sm font-semibold ${data.defensive_vs_cyclical > 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {data.defensive_vs_cyclical > 0 ? '+' : ''}{data.defensive_vs_cyclical}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${data.defensive_vs_cyclical > 0 ? 'bg-blue-400' : 'bg-orange-400'}`}
            style={{ width: `${Math.min(100, Math.abs(data.defensive_vs_cyclical) * 2)}%` }}
          />
        </div>
      </div>

      {/* Regime Alignment */}
      <div className="bg-stealth-900 rounded p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Regime Alignment 
            <span className={`ml-1 font-semibold ${getStateColor(data.system_state)}`}>
              ({data.system_state})
            </span>
          </span>
          <span className={`text-sm font-semibold ${getAlignmentColor(data.regime_alignment_score)}`}>
            {data.regime_alignment_score}/100
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {data.regime_alignment_score >= 65 && "Sectors aligned with market regime"}
          {data.regime_alignment_score >= 45 && data.regime_alignment_score < 65 && "Mixed sector positioning"}
          {data.regime_alignment_score < 45 && "Divergence from expected regime"}
        </div>
      </div>

      {/* Sector Breadth */}
      <div className="bg-stealth-900 rounded p-3">
        <div className="text-xs text-gray-400 mb-2">Sector Breadth (3M→12M trend)</div>
        <div className="flex gap-2 text-xs">
          <div className="flex-1 text-center">
            <div className="text-green-400 font-bold text-lg">{data.sector_breadth.improving}</div>
            <div className="text-gray-500">Improving</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-400 font-bold text-lg">{data.sector_breadth.stable}</div>
            <div className="text-gray-500">Stable</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-red-400 font-bold text-lg">{data.sector_breadth.deteriorating}</div>
            <div className="text-gray-500">Deteriorating</div>
          </div>
        </div>
      </div>
    </div>
  );
}
