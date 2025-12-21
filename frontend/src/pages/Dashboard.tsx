import { useState, useEffect } from "react";
import { IndicatorStatus } from "../types";
import IndicatorCard from "../components/widgets/IndicatorCard";
import DowTheoryWidget from "../components/widgets/DowTheoryWidget";
import SystemOverviewWidget from "../components/widgets/SystemOverviewWidget";
import { getLegacyApiUrl } from "../utils/apiUtils";
import { BUTTON_STYLES } from "../utils/styleUtils";

interface Alert {
  id: number;
  timestamp: string;
  type: string;
  message: string;
  affected_indicators: string[];
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [indicators, setIndicators] = useState<IndicatorStatus[] | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<90 | 180 | 365>(90);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const apiUrl = getLegacyApiUrl();
    // Fetch indicators data from backend
    fetch(`${apiUrl}/indicators`)
      .then(res => res.json())
      .then(data => setIndicators(data))
      .catch(() => setIndicators(null));

    // Fetch active alerts from last 24 hours
    fetch(`${apiUrl}/alerts?hours=24`)
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(() => setAlerts([])  );
  }, [refreshKey]);

  const activeAlertCount = alerts.length;

  // Manual refresh function - triggers ETL ingestion for all indicators
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const apiUrl = getLegacyApiUrl();
      // Trigger backend ETL to fetch latest data from FRED and Yahoo Finance
      const response = await fetch(`${apiUrl}/admin/ingest/run`, {
        method: "POST",
      });
      
      if (response.ok) {
        // Wait for backend to process new data
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Force re-fetch of dashboard data by incrementing refresh key
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-3 md:p-6 text-gray-200">
      {/* Header with Alert Badge */}
      <div className="flex flex-col mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <h2 className="text-xl sm:text-2xl font-bold">Dashboard</h2>
            {activeAlertCount > 0 && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-2 sm:px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs sm:text-sm font-semibold text-red-400">
                  {activeAlertCount} Alert{activeAlertCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition ${
                isRefreshing
                  ? 'bg-stealth-700 text-stealth-400 cursor-not-allowed'
                  : 'bg-stealth-700 text-stealth-200 hover:bg-stealth-600 hover:text-stealth-100'
              }`}
              title="Refresh all indicator data"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden xs:inline">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
              <span className="xs:hidden">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Trend Period Toggle */}
            <div className="flex items-center gap-1 bg-stealth-800 border border-stealth-700 rounded-lg p-1">
              <button
                onClick={() => setTrendPeriod(90)}
                className={`flex-1 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  trendPeriod === 90
                    ? 'bg-stealth-600 text-stealth-100'
                    : 'text-stealth-400 hover:text-stealth-200'
                }`}
              >
                90d
              </button>
              <button
                onClick={() => setTrendPeriod(180)}
                className={`flex-1 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  trendPeriod === 180
                    ? 'bg-stealth-600 text-stealth-100'
                    : 'text-stealth-400 hover:text-stealth-200'
                }`}
              >
                6mo
              </button>
              <button
                onClick={() => setTrendPeriod(365)}
                className={`flex-1 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  trendPeriod === 365
                    ? 'bg-stealth-600 text-stealth-100'
                    : 'text-stealth-400 hover:text-stealth-200'
                }`}
              >
                1yr
              </button>
            </div>
          </div>
        </div>

        {/* System Description */}
        <div className="bg-stealth-850/50 border border-stealth-700/50 rounded-lg p-3 md:p-4">
          <p className="text-xs sm:text-sm text-stealth-300 leading-relaxed">
            Comprehensive market diagnostic system monitoring <strong className="text-stealth-100">10 critical indicators</strong> across 
            <strong className="text-stealth-100"> volatility</strong> (VIX), 
            <strong className="text-stealth-100"> equities</strong> (SPY), 
            <strong className="text-stealth-100"> interest rates</strong> (DFF, T10Y2Y), 
            <strong className="text-stealth-100"> employment</strong> (UNRATE), 
            <strong className="text-stealth-100"> consumer health</strong> (Consumer Health Index), 
            <strong className="text-stealth-100"> bond markets</strong> (Bond Market Stability), 
            <strong className="text-stealth-100"> liquidity</strong> (Liquidity Proxy), 
            <strong className="text-stealth-100"> institutional sentiment</strong> (Analyst Confidence), and 
            <strong className="text-stealth-100"> forward sentiment</strong> (Consumer & Corporate Sentiment). 
            Each indicator is statistically normalized and weighted to detect early signs of market stress, regime shifts, 
            and systemic risks before they cascade into broader crises.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 mb-3 md:mb-6">
        <SystemOverviewWidget trendPeriod={trendPeriod} />
        <DowTheoryWidget trendPeriod={trendPeriod} />
      </div>

      <h3 className="text-lg sm:text-xl font-semibold mb-3 md:mb-4">Indicators</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
        {indicators?.map((i) => (
          <IndicatorCard key={i.code} indicator={i} />
        ))}
      </div>
    </div>
  );
}
