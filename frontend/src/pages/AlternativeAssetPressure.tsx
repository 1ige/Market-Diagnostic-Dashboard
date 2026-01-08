import { useState, useMemo } from "react";
import * as React from "react";
import { useApi } from "../hooks/useApi";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";

interface AAPComponent {
  name: string;
  category: string;
  value: number;
  weight: number;
  contribution: number;
  status: 'active' | 'missing';
  description: string;
}

interface AAPData {
  date: string;
  stability_score: number;
  pressure_index: number;
  regime: string;
  primary_driver: string;
  metals_contribution: number;
  crypto_contribution: number;
  components: AAPComponent[];
  data_completeness: number;
}

interface HistoricalData {
  date: string;
  score: number;
  regime: string;
}

export default function AlternativeAssetPressure() {
  const { data: aapData, loading, error } = useApi<any>('/aap/components/breakdown');
  const { data: historyData } = useApi<any>('/aap/history?days=365');
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '180d' | '365d'>('90d');

  // Filter history based on timeframe
  const history = React.useMemo(() => {
    if (!historyData || !historyData.data || !Array.isArray(historyData.data)) return [];
    
    const days = parseInt(timeframe);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return historyData.data
      .filter((d: any) => new Date(d.date) >= cutoffDate)
      .map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: d.stability_score || 0,
        regime: d.regime || ''
      }));
  }, [historyData, timeframe]);

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

  const getScoreColor = (score: number): string => {
    if (score >= 67) return 'text-green-600';
    if (score >= 34) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 67) return 'bg-green-100';
    if (score >= 34) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading || !aapData) {
    return (
      <div className="min-h-screen bg-stealth-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-stealth-300 text-lg">Loading AAP diagnostic...</p>
        </div>
      </div>
    );
  }

  // Safe data extraction with fallbacks
  const components = aapData.components || [];
  const metalsComponents = components.filter((c: any) => c.category === 'metals');
  const cryptoComponents = components.filter((c: any) => c.category === 'crypto');
  const activeCount = components.filter((c: any) => c.status === 'active').length;
  const totalCount = components.length;
  const completenessPercent = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;

  const subsystemData = [
    { name: 'Metals', value: aapData.metals_contribution, fill: '#f59e0b' },
    { name: 'Crypto', value: aapData.crypto_contribution, fill: '#3b82f6' }
  ];

  return (
    <div className="min-h-screen bg-stealth-900 text-stealth-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-8 bg-gradient-to-b from-amber-400 to-blue-500 rounded"></div>
            <h1 className="text-2xl md:text-4xl font-bold text-stealth-100">
              Alternative Asset Pressure (AAP)
            </h1>
          </div>
          <p className="text-sm md:text-base text-stealth-400 max-w-4xl">
            Comprehensive 18-component indicator measuring systemic monetary stress through precious metals and cryptocurrency signals.
            Tracks "flight to alternatives" as a proxy for confidence in traditional financial assets and fiat currencies.
          </p>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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

          {/* Data Completeness */}
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
                <div className="text-2xl font-bold text-stealth-100">{aapData.metals_contribution.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-blue-400 text-sm font-medium">Crypto</div>
                <div className="text-2xl font-bold text-stealth-100">{aapData.crypto_contribution.toFixed(1)}%</div>
              </div>
            </div>
            <div className="text-xs text-stealth-500">Target: 50% / 50%</div>
          </div>
        </div>

        {/* Historical Chart */}
        <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
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

        {/* Component Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Metals Subsystem */}
          <div className="bg-gradient-to-br from-amber-950/20 to-stealth-850 border border-amber-900/30 rounded-lg p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-semibold text-amber-400">Metals Subsystem</h3>
              <span className="ml-auto text-stealth-400 text-sm">
                {metalsComponents.filter(c => c.status === 'active').length}/{metalsComponents.length} active
              </span>
            </div>

            <div className="space-y-3">
              {metalsComponents.map((component, idx) => (
                <div key={idx} className="bg-stealth-900/50 border border-stealth-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stealth-200">{component.name}</span>
                        {component.status === 'active' ? (
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Active</span>
                        ) : (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Missing</span>
                        )}
                      </div>
                      <div className="text-xs text-stealth-500 mt-1">{component.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stealth-400">Weight: {(component.weight * 100).toFixed(1)}%</span>
                    {component.status === 'active' && (
                      <span className="text-stealth-300">
                        Contribution: {component.contribution.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crypto Subsystem */}
          <div className="bg-gradient-to-br from-blue-950/20 to-stealth-850 border border-blue-900/30 rounded-lg p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-semibold text-blue-400">Crypto Subsystem</h3>
              <span className="ml-auto text-stealth-400 text-sm">
                {cryptoComponents.filter(c => c.status === 'active').length}/{cryptoComponents.length} active
              </span>
            </div>

            <div className="space-y-3">
              {cryptoComponents.map((component, idx) => (
                <div key={idx} className="bg-stealth-900/50 border border-stealth-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stealth-200">{component.name}</span>
                        {component.status === 'active' ? (
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Active</span>
                        ) : (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Missing</span>
                        )}
                      </div>
                      <div className="text-xs text-stealth-500 mt-1">{component.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stealth-400">Weight: {(component.weight * 100).toFixed(1)}%</span>
                    {component.status === 'active' && (
                      <span className="text-stealth-300">
                        Contribution: {component.contribution.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Methodology & Interpretation */}
        <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-stealth-100 mb-4">Methodology & Interpretation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-semibold text-emerald-400 mb-3">What AAP Measures</h3>
              <ul className="space-y-2 text-sm text-stealth-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span><strong>Monetary Stress:</strong> Flight from fiat into hard assets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span><strong>Confidence Erosion:</strong> Distrust in traditional financial system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span><strong>Liquidity Concerns:</strong> Capital seeking alternative stores of value</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span><strong>Regime Shifts:</strong> Structural changes in monetary/financial order</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-md font-semibold text-amber-400 mb-3">Scoring Framework</h3>
              <ul className="space-y-2 text-sm text-stealth-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span><strong>67-100 (LOW):</strong> Normal market conditions, confidence intact</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span><strong>34-66 (MODERATE):</strong> Rising concerns, selective alt-asset flows</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span><strong>0-33 (HIGH):</strong> Severe stress, significant capital flight</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span><strong>Threshold:</strong> Requires 13/18 components (70%) for calculation</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-stealth-900/50 border border-stealth-700 rounded">
            <p className="text-xs text-stealth-400 leading-relaxed">
              <strong className="text-stealth-300">Important:</strong> AAP is a slow-moving structural indicator designed for strategic positioning, 
              not tactical trading. Low scores don't predict crashes, but signal environments where alternative assets may outperform. 
              High confidence (high scores) suggests traditional assets are preferred. This is a regime filter, not a timing signal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
