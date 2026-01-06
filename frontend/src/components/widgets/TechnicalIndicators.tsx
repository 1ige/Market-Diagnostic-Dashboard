/**
 * Technical Indicators Component
 * 
 * Displays price history (252 days), RSI, and MACD charts with real data
 */

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalData {
  lookback_days: number;
  current_price: number;
  high_52w: number;
  low_52w: number;
  sma_50: number;
  sma_200: number | null;
  trend: string;
  rsi: {
    current: number;
    status: string;
  };
  macd: {
    current: number;
    signal: number;
    histogram: number;
    status: string;
  };
  candles: Candle[];
}

interface TechnicalIndicatorsProps {
  technicalData?: TechnicalData;
  volatility: number;
  maxDrawdown: number;
}

export function TechnicalIndicators({
  technicalData,
  volatility,
  maxDrawdown,
}: TechnicalIndicatorsProps) {
  if (!technicalData) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6">
        <p className="text-gray-400">Loading technical analysis...</p>
      </div>
    );
  }

  const { candles, rsi, macd, current_price, sma_50, sma_200, trend, high_52w, low_52w } = technicalData;

  // Calculate chart dimensions
  const chartWidth = 1000;
  const chartHeight = 300;
  const padding = { top: 20, right: 50, bottom: 40, left: 50 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Find price range
  const prices = candles.map((c) => [c.high, c.low]).flat();
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding_price = priceRange * 0.1;

  const scalePrice = (price: number) => {
    const normalized = (price - (minPrice - padding_price)) / (priceRange + padding_price * 2);
    return padding.top + (1 - normalized) * plotHeight;
  };

  const scaleX = (index: number) => {
    return padding.left + (index / (candles.length - 1)) * plotWidth;
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Price History Chart */}
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Price History & Technical Analysis (252-Day)</h3>
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-lime-500/50 rounded"></span>
              <span className="text-gray-400">Bullish</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-red-500/50 rounded"></span>
              <span className="text-gray-400">Bearish</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet" style={{ minWidth: '800px' }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
              const y = padding.top + percent * plotHeight;
              const price = minPrice - padding_price + percent * (priceRange + padding_price * 2);
              return (
                <g key={`grid-${percent}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#374151"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text x={padding.left - 10} y={y + 4} fill="#9ca3af" fontSize="10" textAnchor="end">
                    ${price.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Candlesticks */}
            {candles.map((candle, idx) => {
              const x = scaleX(idx);
              const o = scalePrice(candle.open);
              const h = scalePrice(candle.high);
              const l = scalePrice(candle.low);
              const c = scalePrice(candle.close);

              const isGreen = candle.close >= candle.open;
              const bodyTop = Math.min(o, c);
              const bodyBottom = Math.max(o, c);
              const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
              const color = isGreen ? "#22c55e" : "#ef4444";
              const wickWidth = plotWidth / candles.length / 3;

              return (
                <g key={idx}>
                  {/* Wick */}
                  <line x1={x} y1={h} x2={x} y2={l} stroke={color} strokeWidth="1" opacity="0.6" />
                  {/* Body */}
                  <rect x={x - wickWidth} y={bodyTop} width={wickWidth * 2} height={bodyHeight} fill={color} opacity="0.8" />
                </g>
              );
            })}

            {/* SMA 50 line */}
            {sma_50 && (
              <>
                <line
                  x1={padding.left}
                  y1={scalePrice(sma_50)}
                  x2={chartWidth - padding.right}
                  y2={scalePrice(sma_50)}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  opacity="0.6"
                />
                <text x={chartWidth - padding.right + 5} y={scalePrice(sma_50) + 4} fill="#f59e0b" fontSize="10">
                  SMA50
                </text>
              </>
            )}

            {/* SMA 200 line */}
            {sma_200 && (
              <>
                <line
                  x1={padding.left}
                  y1={scalePrice(sma_200)}
                  x2={chartWidth - padding.right}
                  y2={scalePrice(sma_200)}
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  opacity="0.6"
                />
                <text x={chartWidth - padding.right + 5} y={scalePrice(sma_200) - 4} fill="#8b5cf6" fontSize="10">
                  SMA200
                </text>
              </>
            )}

            {/* Axes */}
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#4b5563" strokeWidth="2" />
            <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#4b5563" strokeWidth="2" />
          </svg>
        </div>

        {/* Price Info Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 text-xs">
          <div className="bg-gray-900 rounded p-2 border border-gray-700">
            <p className="text-gray-400 mb-1">Current</p>
            <p className="text-sm font-bold text-blue-300">${current_price.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 rounded p-2 border border-gray-700">
            <p className="text-gray-400 mb-1">52W High</p>
            <p className="text-sm font-bold text-green-400">${high_52w.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 rounded p-2 border border-gray-700">
            <p className="text-gray-400 mb-1">52W Low</p>
            <p className="text-sm font-bold text-red-400">${low_52w.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 rounded p-2 border border-gray-700">
            <p className="text-gray-400 mb-1">SMA50</p>
            <p className="text-sm font-bold text-amber-400">${sma_50.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 rounded p-2 border border-gray-700">
            <p className="text-gray-400 mb-1">Trend</p>
            <p className={`text-sm font-bold capitalize ${trend === 'uptrend' ? 'text-green-400' : trend === 'downtrend' ? 'text-red-400' : 'text-gray-400'}`}>
              {trend}
            </p>
          </div>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* RSI */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 mb-3 font-semibold">RSI (14)</p>
          <div className="mb-4">
            <p className="text-3xl font-bold text-blue-400 mb-2">{rsi.current.toFixed(1)}</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  rsi.current > 70 ? "bg-red-500" : rsi.current < 30 ? "bg-green-500" : "bg-yellow-500"
                }`}
                style={{ width: `${rsi.current}%` }}
              />
            </div>
            <p className={`text-xs font-semibold capitalize ${
              rsi.status === 'overbought' ? 'text-red-400' : rsi.status === 'oversold' ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {rsi.status}
            </p>
          </div>
          <div className="space-y-1 text-xs text-gray-400">
            <p>70 = Overbought</p>
            <p>30 = Oversold</p>
          </div>
        </div>

        {/* MACD */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 mb-3 font-semibold">MACD</p>
          <div className="mb-4">
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">MACD:</span>
                <span className="text-blue-300 font-mono">{macd.current.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Signal:</span>
                <span className="text-green-300 font-mono">{macd.signal.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Histogram:</span>
                <span className={`font-mono ${macd.histogram > 0 ? "text-green-300" : "text-red-300"}`}>
                  {macd.histogram.toFixed(4)}
                </span>
              </div>
            </div>
            <p className={`text-xs font-semibold capitalize ${macd.status === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
              {macd.status}
            </p>
          </div>
        </div>

        {/* Volatility & Drawdown */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 mb-3 font-semibold">Risk Metrics</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Volatility</span>
                <span className="text-xs font-bold text-yellow-400">{volatility.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${Math.min(volatility, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Max Drawdown</span>
                <span className="text-xs font-bold text-red-400">{maxDrawdown.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${Math.min(maxDrawdown, 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-2 text-xs text-gray-400 border-t border-gray-700">
              <p>Data: {technicalData.lookback_days} days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
