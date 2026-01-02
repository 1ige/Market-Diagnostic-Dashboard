import { IndicatorHistoryPoint } from "../../types";

interface Props {
  history: IndicatorHistoryPoint[];
  height?: number;
  width?: number;
}

/**
 * StateSparkline - Compact trend visualization component
 * 
 * Displays indicator state history (RED/YELLOW/GREEN) as a color-coded line chart.
 * Features:
 * - Automatic data sampling for dense datasets (shows last 60 points if >90 available)
 * - Bit smoothing to reduce visual noise while preserving trend direction
 * - Color-coded line segments reflecting state transitions
 * - Hover tooltips showing date and state for each point
 * 
 * @param history - Array of historical indicator data points
 * @param height - Chart height in pixels (default: 24)
 * @param width - Chart width in pixels (default: 200)
 */
export default function StateSparkline({ history, height = 24, width = 200 }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center gap-1" style={{ height, width }}>
        <div className="text-xs text-stealth-400">No data</div>
      </div>
    );
  }

  // Sample data for display: show last 60 points for dense data (daily indicators),
  // or all points for sparse data (monthly indicators)
  const displayData = history.length > 90 ? history.slice(-60) : history;
  
  if (displayData.length === 0) {
    return (
      <div className="flex items-center gap-1" style={{ height, width }}>
        <div className="text-xs text-stealth-400">No data</div>
      </div>
    );
  }

  /**
   * Map state strings to color values
   * GREEN: #10b981 (emerald), YELLOW: #eab308 (amber), RED: #ef4444 (rose)
   */
  const getColor = (state: string) => {
    switch (state) {
      case 'GREEN': return '#10b981';
      case 'YELLOW': return '#eab308';
      case 'RED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  /**
   * Convert state to numeric value for Y-axis positioning
   * GREEN=2 (top), YELLOW=1 (middle), RED=0 (bottom)
   */
  const stateToValue = (state: string): number => {
    switch (state) {
      case 'GREEN': return 2;
      case 'YELLOW': return 1;
      case 'RED': return 0;
      default: return 1;
    }
  };

  /**
   * Apply bit smoothing to reduce visual noise
   * Uses 3-point moving average (weight: 0.25, 0.5, 0.25)
   * Preserves endpoints to maintain recent state accuracy
   */
  const smoothData = (data: IndicatorHistoryPoint[]): IndicatorHistoryPoint[] => {
    if (data.length < 3) return data;
    
    return data.map((point, i) => {
      if (i === 0 || i === data.length - 1) {
        // Keep first and last points unchanged
        return point;
      }
      
      // Calculate weighted average of surrounding states
      const prev = stateToValue(data[i - 1].state);
      const curr = stateToValue(point.state);
      const next = stateToValue(data[i + 1].state);
      const smoothed = (prev * 0.25 + curr * 0.5 + next * 0.25);
      
      // Map smoothed value back to discrete state
      let newState: 'RED' | 'YELLOW' | 'GREEN';
      if (smoothed < 0.67) newState = 'RED';
      else if (smoothed < 1.67) newState = 'YELLOW';
      else newState = 'GREEN';
      
      return { ...point, state: newState };
    });
  };

  const smoothedData = smoothData(displayData);

  // Calculate chart dimensions and spacing
  const padding = 4;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  const stepX = chartWidth / (smoothedData.length - 1 || 1);

  // Generate coordinate points for line chart
  const points = smoothedData.map((point, index) => {
    const x = padding + (index * stepX);
    const value = stateToValue(point.state);
    const y = padding + chartHeight - (value * (chartHeight / 2));
    return { x, y, point };
  });

  // Generate SVG path data for continuous line (not currently used, but kept for reference)
  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');

  /**
   * Create colored line segments between consecutive points
   * Each segment is colored based on the starting point's state
   * This creates a smooth color transition that follows state changes
   */
  const segments: Array<{ path: string; color: string }> = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentPath = `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`;
    const color = getColor(p1.point.state);
    segments.push({ path: segmentPath, color });
  }

  return (
    <div className="flex items-center gap-1" style={{ height, width }}>
      <svg width={width} height={height}>
        {/* Render line segments with state-based coloring */}
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            stroke={segment.color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        ))}
        
        {/* Render data point markers with hover tooltips */}
        {points.map((p, index) => (
          <circle
            key={index}
            cx={p.x}
            cy={p.y}
            r={2}
            fill={getColor(p.point.state)}
            opacity={0.8}
          >
            <title>{`${new Date(p.point.timestamp).toLocaleDateString()}: ${p.point.state}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
