import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import { IndicatorStatus } from "../types";
import {
  LineChart,
  Line,
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

interface SystemHistoryPoint {
  timestamp: string;
  composite_score: number;
  state: string;
  red_count: number;
  yellow_count: number;
  green_count: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch indicator metadata from backend
        const metaResponse = await fetch("http://localhost:8000/indicators");
        const indicatorData = await metaResponse.json();
        
        // For now, we'll use hardcoded weights (should come from backend)
        const metaWithWeights: IndicatorMetadata[] = indicatorData.map((ind: IndicatorStatus) => ({
          code: ind.code,
          name: ind.name,
          weight: getIndicatorWeight(ind.code),
          direction: getIndicatorDirection(ind.code),
        }));
        
        setMetadata(metaWithWeights);
        
        // Generate historical composite data (would need backend endpoint)
        const mockHistory: SystemHistoryPoint[] = [];
        const now = new Date();
        for (let i = 365; i >= 0; i--) {
          const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const variation = Math.random() * 20 - 10;
          const baseScore = 65 + variation;
          const score = Math.max(0, Math.min(100, baseScore));
          
          const redCount = score < 40 ? Math.floor(Math.random() * 3) + 1 : 0;
          const yellowCount = score < 70 ? Math.floor(Math.random() * 2) + 1 : 0;
          const greenCount = 6 - redCount - yellowCount;
          
          mockHistory.push({
            timestamp: timestamp.toISOString(),
            composite_score: score,
            state: score < 40 ? "RED" : score < 70 ? "YELLOW" : "GREEN",
            red_count: redCount,
            yellow_count: yellowCount,
            green_count: greenCount,
          });
        }
        setHistory(mockHistory);
        
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
      VIX: 1.8,
      SPY: 1.5,
      DFF: 1.2,
      T10Y2Y: 1.5,
      UNRATE: 1.3,
      CONSUMER_HEALTH: 1.5,
    };
    return weights[code] || 1.0;
  };

  const getIndicatorDirection = (code: string): number => {
    const directions: Record<string, number> = {
      VIX: -1,
      SPY: 1,
      DFF: -1,
      T10Y2Y: 1,
      UNRATE: -1,
      CONSUMER_HEALTH: -1,
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
    <div className="p-6 text-gray-200">
      <h2 className="text-2xl font-bold mb-6">System Breakdown</h2>

      {/* Indicator Weights */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-stealth-100">Indicator Weights & Configuration</h3>
        <div className="space-y-3">
          {metadata.map((meta) => {
            const indicator = indicators?.find(i => i.code === meta.code);
            const weightPercentage = ((meta.weight / totalWeight) * 100).toFixed(1);
            
            return (
              <div key={meta.code} className="flex items-center justify-between bg-stealth-900 border border-stealth-600 rounded p-3">
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
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-stealth-600 text-sm text-stealth-400">
          Total Weight: <span className="text-stealth-200 font-mono">{totalWeight.toFixed(1)}</span>
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

      {/* Historical Composite Score */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-stealth-100">Historical Composite Score (1 Year)</h3>
        <div style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333338" />
              <XAxis
                dataKey="timestampNum"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickFormatter={(v: number) =>
                  new Date(v).toLocaleDateString(undefined, {
                    month: "short",
                    year: "2-digit",
                  })
                }
                tick={{ fill: "#a4a4b0", fontSize: 12 }}
                stroke="#555560"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#a4a4b0", fontSize: 12 }}
                stroke="#555560"
                label={{ value: "Composite Score", angle: -90, position: "insideLeft", fill: "#a4a4b0" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161619",
                  borderColor: "#555560",
                  borderRadius: "8px",
                  padding: "12px",
                }}
                labelStyle={{ color: "#a4a4b0" }}
                itemStyle={{ color: "#ffffff" }}
                labelFormatter={(label: number) => new Date(label).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="composite_score"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical State Distribution */}
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-stealth-100">Historical State Counts (1 Year)</h3>
        <div style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333338" />
              <XAxis
                dataKey="timestampNum"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickFormatter={(v: number) =>
                  new Date(v).toLocaleDateString(undefined, {
                    month: "short",
                    year: "2-digit",
                  })
                }
                tick={{ fill: "#a4a4b0", fontSize: 12 }}
                stroke="#555560"
              />
              <YAxis
                tick={{ fill: "#a4a4b0", fontSize: 12 }}
                stroke="#555560"
                label={{ value: "Indicator Count", angle: -90, position: "insideLeft", fill: "#a4a4b0" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161619",
                  borderColor: "#555560",
                  borderRadius: "8px",
                  padding: "12px",
                }}
                labelStyle={{ color: "#a4a4b0" }}
                labelFormatter={(label: number) => new Date(label).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="green_count"
                name="Green"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="yellow_count"
                name="Yellow"
                stroke="#eab308"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="red_count"
                name="Red"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
