/**
 * Technical Indicators Component
 * 
 * Displays price history, RSI, and MACD charts
 */

interface TechnicalIndicatorsProps {
  ticker: string;
  currentPrice: number;
  volatility: number;
  maxDrawdown: number;
}

export function TechnicalIndicators({
  volatility,
  maxDrawdown,
}: TechnicalIndicatorsProps) {
  // Simulated RSI (14-period)
  const rsi = Math.random() * 100;
  const getRSIStatus = (value: number) => {
    if (value > 70) return { label: "Overbought", color: "text-red-400" };
    if (value < 30) return { label: "Oversold", color: "text-green-400" };
    return { label: "Neutral", color: "text-gray-400" };
  };
  const rsiStatus = getRSIStatus(rsi);

  return (
    <div className="space-y-4 mb-6">
      {/* Price History Chart Placeholder */}
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Price History & Technical Analysis</h3>
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <div className="w-full" style={{ aspectRatio: '16 / 9', maxHeight: '240px' }}>
            <svg width="100%" height="100%" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
              {/* Grid */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="50"
                  y1={360 - (y * 3.2)}
                  x2="970"
                  y2={360 - (y * 3.2)}
                  stroke="#374151"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
              
              {/* Mock candlestick pattern - uptrend */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
                const x = 100 + i * 85;
                const baseHeight = 150 + i * 15 + Math.sin(i) * 30;
                const high = baseHeight + 20;
                const low = baseHeight - 15;
                const close = baseHeight + 10;
                const open = baseHeight;
                
                const bodyTop = Math.max(open, close);
                const bodyBottom = Math.min(open, close);
                const bodyColor = close > open ? "#22c55e" : "#ef4444";
                
                return (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={360 - high}
                      x2={x}
                      y2={360 - low}
                      stroke={bodyColor}
                      strokeWidth="1"
                      opacity="0.5"
                    />
                    {/* Body */}
                    <rect
                      x={x - 15}
                      y={360 - bodyTop}
                      width="30"
                      height={Math.max(bodyTop - bodyBottom, 2)}
                      fill={bodyColor}
                      opacity="0.7"
                    />
                  </g>
                );
              })}
              
              {/* Axes */}
              <line x1="50" y1="360" x2="970" y2="360" stroke="#4b5563" strokeWidth="2" />
              <line x1="50" y1="20" x2="50" y2="360" stroke="#4b5563" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* RSI */}
          <div className="bg-gray-900 rounded p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-2">RSI (14)</p>
            <p className="text-2xl font-bold text-blue-400 mb-2">{rsi.toFixed(1)}</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  rsi > 70
                    ? "bg-red-500"
                    : rsi < 30
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
                style={{ width: `${rsi}%` }}
              />
            </div>
            <p className={`text-xs ${rsiStatus.color} font-semibold`}>{rsiStatus.label}</p>
          </div>

          {/* MACD */}
          <div className="bg-gray-900 rounded p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-2">MACD</p>
            <div className="flex items-end gap-2 h-16 mb-2">
              <div className="flex-1 bg-green-500/40 rounded h-8 border border-green-500/60"></div>
              <div className="flex-1 bg-green-500/60 rounded h-10 border border-green-500/80"></div>
              <div className="flex-1 bg-green-500/50 rounded h-9 border border-green-500/70"></div>
            </div>
            <p className="text-xs text-green-400 font-semibold">Bullish</p>
          </div>

          {/* Volatility & Drawdown */}
          <div className="bg-gray-900 rounded p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Volatility / Drawdown</p>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Vol:</span>
                <span className="text-sm font-bold text-yellow-400">{volatility.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">DD:</span>
                <span className="text-sm font-bold text-red-400">{maxDrawdown.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
