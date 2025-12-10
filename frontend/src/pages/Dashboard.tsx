import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { IndicatorStatus } from "../types";
import IndicatorCard from "../components/widgets/IndicatorCard";
import DowTheoryWidget from "../components/widgets/DowTheoryWidget";
import SystemOverviewWidget from "../components/widgets/SystemOverviewWidget";

interface Alert {
  id: number;
  timestamp: string;
  type: string;
  message: string;
  affected_indicators: string[];
}

export default function Dashboard() {
  const { data: indicators } = useApi<IndicatorStatus[]>("/indicators");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<90 | 180 | 365>(90);

  useEffect(() => {
    // Fetch active alerts
    fetch("http://localhost:8000/alerts?hours=24")
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(() => setAlerts([]));
  }, []);

  const activeAlertCount = alerts.length;

  return (
    <div className="p-6 text-gray-200">
      {/* Header with Alert Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          {activeAlertCount > 0 && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-sm font-semibold text-red-400">
                {activeAlertCount} Active Alert{activeAlertCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Trend Period Toggle */}
        <div className="flex items-center gap-2 bg-stealth-800 border border-stealth-700 rounded-lg p-1">
          <button
            onClick={() => setTrendPeriod(90)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              trendPeriod === 90
                ? 'bg-stealth-600 text-stealth-100'
                : 'text-stealth-400 hover:text-stealth-200'
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => setTrendPeriod(180)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              trendPeriod === 180
                ? 'bg-stealth-600 text-stealth-100'
                : 'text-stealth-400 hover:text-stealth-200'
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => setTrendPeriod(365)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              trendPeriod === 365
                ? 'bg-stealth-600 text-stealth-100'
                : 'text-stealth-400 hover:text-stealth-200'
            }`}
          >
            1 Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SystemOverviewWidget trendPeriod={trendPeriod} />
        <DowTheoryWidget />
      </div>

      <h3 className="text-xl font-semibold mb-4">Indicators</h3>
      <div className="grid grid-cols-3 gap-4">
        {indicators?.map((i) => (
          <IndicatorCard key={i.code} indicator={i} />
        ))}
      </div>
    </div>
  );
}