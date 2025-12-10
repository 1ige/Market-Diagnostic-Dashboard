import { IndicatorStatus, IndicatorHistoryPoint } from "../../types";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Props {
  indicator: IndicatorStatus;
}

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
        
        {/* Timestamp */}
        <div className="text-xs text-gray-500 mt-2">
          Last updated: {timeDisplay}
        </div>
      </div>
    </Link>
  );
}