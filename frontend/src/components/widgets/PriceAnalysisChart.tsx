/**
 * Price Analysis Chart Component
 * 
 * Displays stock price with take profit and stop loss targets
 * Visual representation of upside/downside potential and risk levels
 */

interface PriceAnalysisChartProps {
  currentPrice: number;
  takeProfit: number;
  stopLoss: number;
  projectedReturn: number;
  horizon: string;
}

export function PriceAnalysisChart({
  currentPrice,
  takeProfit,
  stopLoss,
  projectedReturn,
  horizon,
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
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
      {/* Header */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">Price Analysis for {horizon}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-gray-300">Current Price</p>
            <p className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</p>
          </div>
          <div className={`text-right px-3 py-2 rounded ${projectionBg} border ${projectionBorder}`}>
            <p className="text-xs text-gray-300 mb-1">Projected Return</p>
            <p className={`text-lg font-bold ${projectionColor}`}>
              {projectedReturn > 0 ? "+" : ""}{projectedPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="mb-4">
        <div className="flex items-flex-end justify-between h-48 gap-4 px-2">
          {/* Stop Loss Bar */}
          <div className="flex flex-col items-center flex-1">
            <div className="w-full flex flex-col-reverse items-center justify-end h-48 mb-2">
              <div
                className="w-full bg-red-500/30 border border-red-500/50 rounded-sm transition-all"
                style={{ height: `${slHeight}%`, minHeight: '4px' }}
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
            <div className="w-full flex flex-col-reverse items-center justify-end h-48 mb-2">
              <div
                className={`w-full rounded-sm transition-all ${
                  isPositive
                    ? "bg-green-500/30 border border-green-500/50"
                    : "bg-red-500/30 border border-red-500/50"
                }`}
                style={{ height: `${projHeight}%`, minHeight: '4px' }}
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
            <div className="w-full flex flex-col-reverse items-center justify-end h-48 mb-2">
              <div
                className="w-full bg-green-500/30 border border-green-500/50 rounded-sm transition-all"
                style={{ height: `${tpHeight}%`, minHeight: '4px' }}
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
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
          <p className="text-red-300 mb-1">Risk/Reward Ratio</p>
          <p className="text-red-200 font-semibold">
            1 : {(tpUpside / slDownside).toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
          <p className="text-blue-300 mb-1">Risk per Trade</p>
          <p className="text-blue-200 font-semibold">
            {slDownside.toFixed(1)}% downside
          </p>
        </div>
      </div>
    </div>
  );
}
