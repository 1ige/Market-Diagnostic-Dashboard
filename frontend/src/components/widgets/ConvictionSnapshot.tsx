/**
 * AI Conviction Snapshot Component
 * 
 * Displays confidence level in the projection with visual indicators
 * Shows conviction factors and signal strength
 */

interface ConvictionSnapshotProps {
  conviction: number;
  score: number;
  volatility: number;
  horizon: string;
}

export function ConvictionSnapshot({
  conviction,
  score,
  volatility,
  horizon,
}: ConvictionSnapshotProps) {
  // Determine conviction level
  const getConvictionLevel = (c: number) => {
    if (c >= 75) return { label: "Very High", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/50" };
    if (c >= 60) return { label: "High", color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/50" };
    if (c >= 45) return { label: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/50" };
    if (c >= 30) return { label: "Low", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/50" };
    return { label: "Very Low", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/50" };
  };
  
  const convictionLevel = getConvictionLevel(conviction);
  
  // Determine signal type based on score
  const getSignalType = (s: number) => {
    if (s >= 65) return { label: "Strong Buy", icon: "↑↑", color: "text-green-400" };
    if (s >= 55) return { label: "Buy", icon: "↑", color: "text-lime-400" };
    if (s <= 35) return { label: "Strong Sell", icon: "↓↓", color: "text-red-400" };
    if (s <= 45) return { label: "Sell", icon: "↓", color: "text-orange-400" };
    return { label: "Neutral", icon: "→", color: "text-gray-400" };
  };
  
  const signal = getSignalType(score);
  
  // Volatility assessment
  const getVolatilityStatus = (v: number) => {
    if (v > 40) return { label: "Very High", color: "text-red-400" };
    if (v > 30) return { label: "High", color: "text-orange-400" };
    if (v > 20) return { label: "Moderate", color: "text-yellow-400" };
    if (v > 10) return { label: "Low", color: "text-green-400" };
    return { label: "Very Low", color: "text-green-400" };
  };
  
  const volStatus = getVolatilityStatus(volatility);
  
  return (
    <div className={`rounded-lg p-4 border ${convictionLevel.border} ${convictionLevel.bg}`}>
      {/* Header */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">AI Snapshot</p>
        <p className="text-xs text-gray-300">Confidence in {horizon} projection</p>
      </div>
      
      {/* Main Conviction Display */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Conviction Gauge */}
        <div className="col-span-2">
          <div className="flex items-end justify-between mb-2">
            <span className="text-xs text-gray-400">Conviction</span>
            <span className={`text-2xl font-bold ${convictionLevel.color}`}>
              {conviction.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                conviction >= 75
                  ? "bg-green-500"
                  : conviction >= 60
                  ? "bg-lime-500"
                  : conviction >= 45
                  ? "bg-yellow-500"
                  : conviction >= 30
                  ? "bg-orange-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${conviction}%` }}
            />
          </div>
          <p className={`text-xs ${convictionLevel.color} mt-1 font-semibold`}>
            {convictionLevel.label}
          </p>
        </div>
        
        {/* Signal Indicator */}
        <div className="flex flex-col items-center justify-center bg-gray-800/50 rounded p-2">
          <span className={`text-2xl font-bold ${signal.color} mb-1`}>{signal.icon}</span>
          <p className={`text-xs font-semibold ${signal.color} text-center`}>
            {signal.label}
          </p>
        </div>
      </div>
      
      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        {/* Score */}
        <div className="bg-gray-800/30 rounded p-2 border border-gray-700/50">
          <p className="text-gray-400 mb-1">Total Score</p>
          <p className="text-sm font-bold text-blue-300">{score.toFixed(0)}/100</p>
        </div>
        
        {/* Volatility */}
        <div className="bg-gray-800/30 rounded p-2 border border-gray-700/50">
          <p className="text-gray-400 mb-1">Volatility</p>
          <p className={`text-sm font-bold ${volStatus.color}`}>
            {volStatus.label}
            <br />
            <span className="text-xs text-gray-400">{volatility.toFixed(1)}%</span>
          </p>
        </div>
      </div>
      
      {/* Conviction Explanation */}
      <div className="bg-gray-800/20 rounded p-2 border border-gray-700/30 text-xs text-gray-300">
        <p className="mb-1">
          <span className="font-semibold">Why this conviction?</span>
        </p>
        <ul className="space-y-1 text-gray-400">
          {conviction >= 60 && (
            <li>✓ Strong signal alignment across indicators</li>
          )}
          {conviction < 60 && (
            <li>✗ Mixed signals from technical indicators</li>
          )}
          {volatility < 20 && (
            <li>✓ Stable price action supports confidence</li>
          )}
          {volatility >= 20 && (
            <li>✗ High volatility reduces confidence</li>
          )}
          {score >= 60 && (
            <li>✓ Positive technical setup</li>
          )}
          {score < 60 && (
            <li>✗ Neutral or negative setup</li>
          )}
        </ul>
      </div>
    </div>
  );
}
