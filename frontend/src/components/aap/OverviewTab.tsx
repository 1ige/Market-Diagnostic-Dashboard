import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MetalsSubsystemPanel } from './MetalsSubsystemPanel';
import { CryptoSubsystemPanel } from './CryptoSubsystemPanel';
import { MethodologyPanel } from './MethodologyPanel';

interface HistoricalData {
  date: string;
  score: number;
  regime: string;
}

interface OverviewTabProps {
  aapData: any;
  history: HistoricalData[];
  componentHistory?: any;
  timeframe: '30d' | '90d' | '180d' | '365d';
  setTimeframe: (tf: '30d' | '90d' | '180d' | '365d') => void;
}

function smoothSeries(
  series: { date: string; value: number | null }[],
  windowSize: number
): { date: string; value: number | null }[] {
  const smoothed: { date: string; value: number | null }[] = [];

  for (let i = 0; i < series.length; i += 1) {
    const start = Math.max(0, i - windowSize + 1);
    const window = series.slice(start, i + 1);
    const values = window
      .map((entry) => entry.value)
      .filter((value): value is number => value !== null && value !== undefined);

    if (values.length === 0) {
      smoothed.push({ date: series[i].date, value: null });
      continue;
    }

    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    smoothed.push({ date: series[i].date, value: avg });
  }

  return smoothed;
}

export function OverviewTab({ aapData, history, componentHistory, timeframe, setTimeframe }: OverviewTabProps) {
  const [showComponentHealth, setShowComponentHealth] = useState(false);
  
  const getScoreColor = (score: number): string => {
    if (score >= 67) return 'text-green-600';
    if (score >= 34) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRegimeColor = (regime: string): string => {
    const colors: Record<string, string> = {
      'LOW': '#10b981',
      'MODERATE': '#f59e0b',
      'HIGH': '#ef4444',
      'normal_confidence': '#10b981',
      'mild_caution': '#f59e0b',
      'monetary_stress': '#f59e0b',
      'liquidity_crisis': '#ef4444',
      'systemic_breakdown': '#dc2626'
    };
    return colors[regime] || '#6b7280';
  };

  const getRegimeLabel = (regime: string): string => {
    const labels: Record<string, string> = {
      'LOW': 'Low Pressure',
      'MODERATE': 'Moderate Pressure',
      'HIGH': 'High Pressure',
      'normal_confidence': 'Normal Confidence',
      'mild_caution': 'Mild Caution',
      'monetary_stress': 'Monetary Stress',
      'liquidity_crisis': 'Liquidity Crisis',
      'systemic_breakdown': 'Systemic Breakdown'
    };
    return labels[regime] || regime.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const components = aapData.components || [];
  const activeCount = components.filter((c: any) => c.status === 'active').length;
  const totalCount = components.length;
  const completenessPercent = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;

  const metalsComponents = components.filter((c: any) => c.category === 'metals');
  const cryptoComponents = components.filter((c: any) => c.category === 'crypto');

  const smoothedComponentHistory = useMemo(() => {
    const rawHistory = componentHistory?.data ?? {};
    const windowSize = 7;
    const output: Record<string, { date: string; value: number | null }[]> = {};

    Object.entries(rawHistory).forEach(([key, series]) => {
      if (!Array.isArray(series)) {
        output[key] = [];
        return;
      }
      output[key] = smoothSeries(series as { date: string; value: number | null }[], windowSize);
    });

    return output;
  }, [componentHistory]);

  // Calculate relative contributions as percentages
  const totalContribution = aapData.metals_contribution + aapData.crypto_contribution;
  const metalsPercent = totalContribution > 0 ? (aapData.metals_contribution / totalContribution) * 100 : 50;
  const cryptoPercent = totalContribution > 0 ? (aapData.crypto_contribution / totalContribution) * 100 : 50;

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Stability Score */}
        <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stealth-400 text-xs md:text-sm font-medium">Stability Score</span>
            <svg className="w-5 h-5 text-stealth-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className={`text-3xl md:text-5xl font-bold mb-2 ${getScoreColor(aapData.stability_score)}`}>
            {aapData.stability_score.toFixed(1)}
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-stealth-500">
            <span>0 = Max Pressure</span>
            <span>•</span>
            <span>100 = Normal</span>
          </div>
          <div className="mt-3 w-full bg-stealth-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                aapData.stability_score >= 67 ? 'bg-green-500' :
                aapData.stability_score >= 34 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${aapData.stability_score}%` }}
            ></div>
          </div>
        </div>

        {/* Regime */}
        <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stealth-400 text-xs md:text-sm font-medium">Current Regime</span>
            <svg className="w-5 h-5 text-stealth-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div 
            className="text-xl md:text-2xl font-bold mb-2"
            style={{ color: getRegimeColor(aapData.regime) }}
          >
            {getRegimeLabel(aapData.regime)}
          </div>
          <div className="text-xs md:text-sm text-stealth-500">
            Primary: <span className="text-stealth-300 capitalize">{aapData.primary_driver}</span>
          </div>
        </div>

        {/* Component Status */}
        <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stealth-400 text-xs md:text-sm font-medium">Component Status</span>
            <svg className="w-5 h-5 text-stealth-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
            </svg>
          </div>
          <div className="text-3xl md:text-5xl font-bold text-stealth-100 mb-2">
            {activeCount}<span className="text-2xl md:text-3xl text-stealth-400">/{totalCount}</span>
          </div>
          <div className="text-xs md:text-sm text-stealth-500">
            {completenessPercent.toFixed(1)}% operational 
            {completenessPercent >= 70 ? 
              <span className="text-emerald-400 ml-2">✓ Above threshold</span> : 
              <span className="text-red-400 ml-2">⚠ Below threshold</span>
            }
          </div>
        </div>

        {/* Subsystem Balance */}
        <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stealth-400 text-xs md:text-sm font-medium">Subsystem Balance</span>
            <svg className="w-5 h-5 text-stealth-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className="text-amber-400 text-sm font-medium">Metals</div>
              <div className="text-2xl font-bold text-stealth-100">{metalsPercent.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-blue-400 text-sm font-medium">Crypto</div>
              <div className="text-2xl font-bold text-stealth-100">{cryptoPercent.toFixed(1)}%</div>
            </div>
          </div>
          <div className="text-xs text-stealth-500">Relative contribution to instability</div>
        </div>
      </div>

      {/* Historical Chart */}
      <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-lg md:text-xl font-semibold text-stealth-100">Stability Score History</h2>
          <div className="flex gap-2">
            {(['30d', '90d', '180d', '365d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-sm ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-white'
                    : 'bg-stealth-700 text-stealth-300 hover:bg-stealth-600'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                stroke="#9ca3af" 
                domain={[0, 100]}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#f3f4f6'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                name="Stability Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-stealth-400">Low Pressure</div>
            <div className="text-green-400 font-semibold">67-100</div>
          </div>
          <div>
            <div className="text-stealth-400">Moderate</div>
            <div className="text-yellow-400 font-semibold">34-66</div>
          </div>
          <div>
            <div className="text-stealth-400">High Pressure</div>
            <div className="text-red-400 font-semibold">0-33</div>
          </div>
        </div>
      </div>

      {/* Quick Interpretation */}
      <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg p-4 md:p-6">
        <h3 className="text-lg font-semibold text-stealth-100 mb-3">Quick Interpretation</h3>
        <div className="space-y-3 text-sm text-stealth-300">
          <p>
            <strong className="text-stealth-100">Current State:</strong> The AAP Stability Score of {aapData.stability_score.toFixed(1)} 
            indicates <strong className={aapData.stability_score >= 67 ? 'text-green-400' : aapData.stability_score >= 34 ? 'text-yellow-400' : 'text-red-400'}>
              {aapData.stability_score >= 67 ? 'low pressure' : aapData.stability_score >= 34 ? 'moderate pressure' : 'high pressure'}
            </strong> in alternative asset markets.
          </p>
          <p>
            <strong className="text-stealth-100">Primary Driver:</strong> The dominant signal is coming from <strong className="text-emerald-400 capitalize">{aapData.primary_driver}</strong> markets, 
            contributing {aapData.primary_driver === 'metals' ? metalsPercent.toFixed(1) : cryptoPercent.toFixed(1)}% of the instability signal.
          </p>
          <p>
            <strong className="text-stealth-100">System Health:</strong> {activeCount} of {totalCount} components are operational 
            ({completenessPercent.toFixed(1)}%), {completenessPercent >= 70 ? 
              'meeting the 70% threshold for reliable calculation' : 
              'below the 70% threshold - results may be less reliable'
            }.
          </p>
        </div>
      </div>

      {/* Expandable Component Health Section */}
      <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg">
        <button
          onClick={() => setShowComponentHealth(!showComponentHealth)}
          className="w-full flex justify-between items-center p-4 md:p-6 hover:bg-stealth-700/30 transition-colors text-left"
        >
          <div>
            <h3 className="text-lg font-semibold text-stealth-100 mb-1">Component Health & Methodology</h3>
            <p className="text-xs text-stealth-400">
              Detailed breakdown of all 18 components, subsystem analysis, and indicator methodology
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm text-stealth-400">
              {activeCount}/{totalCount} Active
            </span>
            <svg 
              className={`w-6 h-6 text-stealth-400 transition-transform ${showComponentHealth ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {showComponentHealth && (
          <div className="border-t border-stealth-700 p-4 md:p-6 space-y-6">
            {/* Subsystem Breakdown */}
            <div>
              <h4 className="text-md font-semibold text-stealth-100 mb-4">Subsystem Breakdown</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetalsSubsystemPanel
                  components={metalsComponents}
                  contribution={aapData.metals_contribution}
                  componentHistory={smoothedComponentHistory}
                />
                <CryptoSubsystemPanel
                  components={cryptoComponents}
                  contribution={aapData.crypto_contribution}
                  componentHistory={smoothedComponentHistory}
                />
              </div>
            </div>

            {/* Methodology */}
            <div>
              <MethodologyPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
