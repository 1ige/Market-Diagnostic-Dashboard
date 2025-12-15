import { IndicatorStatus, IndicatorHistoryPoint } from "../../types";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Props {
  indicator: IndicatorStatus;
}

// Metadata about data update frequencies and expected publishing delays
// This helps users understand why some indicators may appear "old"
// expectedLag: number of days delay expected from data source publishing schedules
const DATA_FREQUENCY: Record<string, { frequency: string; description: string; expectedLag: number }> = {
  VIX: { frequency: "Real-time", description: "Updates continuously during trading hours and weekends (futures)", expectedLag: 0 },
  SPY: { frequency: "Daily", description: "Updates on market trading days (Mon-Fri)", expectedLag: 0 },
  DFF: { frequency: "Daily", description: "Federal Reserve publishes with 1-2 day lag", expectedLag: 2 },
  T10Y2Y: { frequency: "Daily", description: "Updates on trading days, may have weekend gaps", expectedLag: 0 },
  UNRATE: { frequency: "Monthly", description: "Bureau of Labor Statistics publishes monthly (typically first Friday)", expectedLag: 30 },
  CONSUMER_HEALTH: { frequency: "Monthly", description: "Calculated from monthly PCE, PI, and CPI data", expectedLag: 30 },
  BOND_MARKET_STABILITY: { frequency: "Daily", description: "Composite of multiple FRED series, updates on business days", expectedLag: 1 },
  LIQUIDITY_PROXY: { frequency: "Weekly", description: "Composite of M2, Fed Balance Sheet, and Reverse Repo data", expectedLag: 7 },
};

const colorMap = {
  GREEN: "text-accent-green",
  YELLOW: "text-accent-yellow",
  RED: "text-accent-red",
};

const stateColorMap = {
  GREEN: "#10b981",
  YELLOW: "#eab308",
  RED: "#ef4444",
};

export default function IndicatorCard({ indicator }: Props) {
  const [history, setHistory] = useState<IndicatorHistoryPoint[]>([]);

  useEffect(() => {
    // Fetch last 30 days of history for sparkline
    fetch(`http://localhost:8000/indicators/${indicator.code}/history?days=30`)
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(() => setHistory([]));
  }, [indicator.code]);

  const chartData = history.map(point => ({
    value: point.score,
    timestamp: new Date(point.timestamp).getTime()
  }));

  const lastUpdated = new Date(indicator.timestamp);
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
  
  const timeDisplay = daysAgo === 0 
    ? "Today" 
    : daysAgo === 1 
      ? "Yesterday" 
      : lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const metadata = DATA_FREQUENCY[indicator.code] || { frequency: "Daily", description: "Updates on business days", expectedLag: 1 };
  
  // Calculate data freshness with intelligent staleness detection
  // Accounts for publishing delays, weekends, and data source schedules
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const isStale = daysAgo > (metadata.expectedLag + (isWeekend ? 3 : 0) + 1); // Allow extra buffer for weekends
  
  // Visual indicators for data freshness status
  const freshnessIcon = isStale ? (
    // Yellow warning: Data is unexpectedly old, may need investigation
    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" title="Data may be stale">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ) : daysAgo > metadata.expectedLag ? (
    // Gray clock: Data is old but this is expected (e.g., monthly indicators, publishing delays)
    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20" title="Waiting for source data">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  ) : (
    // Green check: Data is current and up-to-date
    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" title="Data is current">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  return (
    <Link to={`/indicators/${indicator.code}`}>
      <div className="bg-stealth-800 rounded p-4 shadow hover:bg-stealth-700 transition">
        <div className="text-gray-300 text-sm">{indicator.name}</div>
        <div className="text-2xl font-semibold mt-2">
          {typeof indicator.raw_value === 'number' 
            ? indicator.raw_value.toFixed(2) 
            : indicator.raw_value}
        </div>
        
        {/* Mini Sparkline Chart */}
        {chartData.length > 0 && (
          <div className="mt-2" style={{ height: '30px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={stateColorMap[indicator.state]}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-400">Score: {indicator.score}</span>
          <span className={`font-semibold ${colorMap[indicator.state]}`}>
            {indicator.state}
          </span>
        </div>
        
        {/* Timestamp with tooltip */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-1.5 group relative">
            {freshnessIcon}
            <span className="text-gray-500">Last updated: {timeDisplay}</span>
            
            {/* Tooltip */}
            <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-64 p-2 bg-stealth-900 border border-stealth-700 rounded shadow-lg text-xs z-10">
              <div className="font-semibold text-stealth-100 mb-1">{metadata.frequency} Updates</div>
              <div className="text-stealth-300">{metadata.description}</div>
              {isStale && (
                <div className="text-yellow-400 mt-1 font-medium">⚠ Data appears stale</div>
              )}
              {!isStale && daysAgo > metadata.expectedLag && (
                <div className="text-gray-400 mt-1">Waiting for new source data</div>
              )}
            </div>
          </div>
          
          {/* Frequency badge */}
          <span className="text-xs text-gray-600 bg-stealth-900 px-2 py-0.5 rounded">
            {metadata.frequency}
          </span>
        </div>
      </div>
    </Link>
  );
}