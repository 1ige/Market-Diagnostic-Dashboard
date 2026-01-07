/**
 * Price Analysis Chart Component
 * 
 * Displays stock price with take profit and stop loss targets
 * Visual representation of upside/downside potential and risk levels
 * Includes analyst consensus comparison
 */

interface AnalystConsensus {
  target_price: number;
  current_price: number;
  number_of_analysts: number;
  rating: string;
  upside_downside: number;
  as_of_date: string;
}

interface PriceAnalysisChartProps {
  currentPrice: number;
  takeProfit: number;
  stopLoss: number;
  projectedReturn: number;
  horizon: string;
  analystConsensus?: AnalystConsensus | null;
}

export function PriceAnalysisChart({
  currentPrice,
  takeProfit,
  stopLoss,
  projectedReturn,
  horizon,
  analystConsensus,
}: PriceAnalysisChartProps) {
  // Calculate percentages for visualization
  const tpUpside = ((takeProfit - currentPrice) / currentPrice) * 100;
  const slDownside = ((currentPrice - stopLoss) / currentPrice) * 100;
  const projectedPercent = projectedReturn;
  
  // Color coding
  const isPositive = projectedReturn > 0;
  const projectionColor = isPositive ? "text-green-400" : "text-red-400";
  const projectionBg = isPositive ? "bg-green-500/10" : "bg-red-500/10";
  const projectionBorder = isPositive ? "border-green-500/50" : "border-red-500/50";
  
  // Calculate chart heights (normalized)
  const maxRange = Math.max(slDownside, tpUpside) * 1.2;
  const slHeight = (slDownside / maxRange) * 100;
  const tpHeight = (tpUpside / maxRange) * 100;
  const projHeight = Math.abs(projectedPercent > 0 
    ? (projectedPercent / maxRange) * 100 
    : 0);
  
  return (
    <div className="bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-700">
      {/* Header */}
      <div className="mb-3">
        <p className="text-xs text-gray-400 mb-1">Price Analysis for {horizon}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400">Current Price</p>
            <p className="text-xl font-bold text-white">${currentPrice.toFixed(2)}</p>
          </div>
          <div className={`text-right px-2 py-1 rounded text-xs ${projectionBg} border ${projectionBorder}`}>
            <p className="text-xs text-gray-300 mb-0.5">Return</p>
            <p className={`text-base font-bold ${projectionColor}`}>
              {projectedReturn > 0 ? "+" : ""}{projectedPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="mb-3">
        <div className="flex items-flex-end justify-between h-32 gap-2 px-1">
          {/* Stop Loss Bar */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-full flex flex-col-reverse items-center justify-end h-32 mb-1">
              <div
                className="w-full bg-red-500/30 border border-red-500/50 rounded-sm transition-all"
                style={{ height: `${slHeight}%`, minHeight: '3px' }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-red-400 font-semibold">Stop Loss</p>
              <p className="text-xs text-red-300">${stopLoss.toFixed(2)}</p>
              <p className="text-xs text-red-200">-{slDownside.toFixed(1)}%</p>
            </div>
          </div>
          
          {/* Projected Return Bar */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-full flex flex-col-reverse items-center justify-end h-32 mb-1">
              <div
                className={`w-full rounded-sm transition-all ${
                  isPositive
                    ? "bg-green-500/30 border border-green-500/50"
                    : "bg-red-500/30 border border-red-500/50"
                }`}
                style={{ height: `${projHeight}%`, minHeight: '3px' }}
              />
            </div>
            <div className="text-center">
              <p className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                Target
              </p>
              <p className={`text-xs ${isPositive ? "text-green-300" : "text-red-300"}`}>
                ${(currentPrice * (1 + projectedPercent / 100)).toFixed(2)}
              </p>
              <p className={`text-xs ${isPositive ? "text-green-200" : "text-red-200"}`}>
                {isPositive ? "+" : ""}{projectedPercent.toFixed(1)}%
              </p>
            </div>
          </div>
          
          {/* Take Profit Bar */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-full flex flex-col-reverse items-center justify-end h-32 mb-1">
              <div
                className="w-full bg-green-500/30 border border-green-500/50 rounded-sm transition-all"
                style={{ height: `${tpHeight}%`, minHeight: '3px' }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-green-400 font-semibold">Take Profit</p>
              <p className="text-xs text-green-300">${takeProfit.toFixed(2)}</p>
              <p className="text-xs text-green-200">+{tpUpside.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className="bg-red-500/10 border border-red-500/30 rounded p-1.5">
          <p className="text-red-300 text-xs mb-0.5">Risk/Reward</p>
          <p className="text-red-200 font-semibold text-xs">
            1 : {(tpUpside / slDownside).toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-1.5">
          <p className="text-blue-300 text-xs mb-0.5">Risk</p>
          <p className="text-blue-200 font-semibold text-xs">
            {slDownside.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Analyst Consensus Comparison */}
      {analystConsensus && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400">Analyst Consensus</p>
            <p className="text-[10px] text-gray-500">{analystConsensus.number_of_analysts} analysts</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {/* Analyst Target */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
              <p className="text-purple-300 text-xs mb-1">Target Price</p>
              <p className="text-purple-200 font-semibold text-sm">${analystConsensus.target_price.toFixed(2)}</p>
              <p className={`text-xs font-semibold ${
                analystConsensus.upside_downside > 0 
                  ? "text-green-400" 
                  : analystConsensus.upside_downside < 0 
                    ? "text-red-400" 
                    : "text-gray-400"
              }`}>
                {analystConsensus.upside_downside > 0 ? "+" : ""}{analystConsensus.upside_downside.toFixed(1)}%
              </p>
            </div>

            {/* Analyst Rating */}
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-2">
              <p className="text-indigo-300 text-xs mb-1">Consensus Rating</p>
              <p className="text-indigo-200 font-semibold text-sm">{analystConsensus.rating}</p>
              <p className="text-xs text-indigo-400">
                {analystConsensus.upside_downside > 10 && "↑ Bullish"}
                {analystConsensus.upside_downside > 0 && analystConsensus.upside_downside <= 10 && "→ Neutral"}
                {analystConsensus.upside_downside <= 0 && "↓ Bearish"}
              </p>
            </div>
          </div>

          {/* Alignment Indicator */}
          <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs text-gray-400">
            <p className="mb-1 font-semibold">Your Score vs Analysts:</p>
            <p>
              {Math.abs(projectedReturn - analystConsensus.upside_downside) <= 5 
                ? "✓ Strong alignment" 
                : Math.abs(projectedReturn - analystConsensus.upside_downside) <= 15 
                  ? "~ Moderate alignment" 
                  : "✗ Diverging outlooks"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
