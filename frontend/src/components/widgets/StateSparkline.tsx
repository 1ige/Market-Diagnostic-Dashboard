import { IndicatorHistoryPoint } from "../../types";

interface Props {
  history: IndicatorHistoryPoint[];
  height?: number;
  width?: number;
}

export default function StateSparkline({ history, height = 24, width = 200 }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center gap-1" style={{ height, width }}>
        <div className="text-xs text-stealth-400">No data</div>
      </div>
    );
  }

  // Take appropriate number of data points based on data density
  const displayData = history.length > 90 ? history.slice(-60) : history;
  
  if (displayData.length === 0) {
    return (
      <div className="flex items-center gap-1" style={{ height, width }}>
        <div className="text-xs text-stealth-400">No data</div>
      </div>
    );
  }

  const getColor = (state: string) => {
    switch (state) {
      case 'GREEN': return '#10b981';
      case 'YELLOW': return '#eab308';
      case 'RED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Map states to numeric values for line chart
  const stateToValue = (state: string): number => {
    switch (state) {
      case 'GREEN': return 2;
      case 'YELLOW': return 1;
      case 'RED': return 0;
      default: return 1;
    }
  };

  // Calculate points for the line chart
  const padding = 4;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  const stepX = chartWidth / (displayData.length - 1 || 1);

  // Create line path
  const points = displayData.map((point, index) => {
    const x = padding + (index * stepX);
    const value = stateToValue(point.state);
    const y = padding + chartHeight - (value * (chartHeight / 2));
    return { x, y, point };
  });

  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');

  // Create colored segments
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
        {/* Draw colored line segments */}
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
        
        {/* Draw dots at each point */}
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
