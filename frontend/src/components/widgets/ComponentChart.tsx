import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ChartLine {
  dataKey: string;
  name: string;
  stroke: string;
  strokeWidth?: number;
  conditional?: (data: any[]) => boolean; // Check if this line should render
}

interface ReferenceLineConfig {
  y: number;
  stroke: string;
  label: string;
  labelFill: string;
  labelPosition?: 'left' | 'right' | 'insideTopRight' | 'insideBottomRight';
  fontSize?: number;
}

interface ComponentChartProps {
  data: any[];
  lines: ChartLine[];
  referenceLines?: ReferenceLineConfig[];
  yAxisLabel?: string;
  yAxisDomain?: [number, number] | ['auto', 'auto'];
  height?: string;
  dateRange: { startTime: number; endTime: number };
}

export function ComponentChart({
  data,
  lines,
  referenceLines = [],
  yAxisLabel,
  yAxisDomain,
  height = '100%',
  dateRange
}: ComponentChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333338" />
        <XAxis
          dataKey="dateNum"
          type="number"
          domain={[dateRange.startTime, dateRange.endTime]}
          scale="time"
          tickFormatter={(v: number) =>
            new Date(v).toLocaleDateString(undefined, {
              month: "short",
              year: "2-digit",
            })
          }
          tick={{ fill: "#a4a4b0", fontSize: 12 }}
          stroke="#555560"
        />
        <YAxis
          domain={yAxisDomain || ['auto', 'auto']}
          tick={{ fill: "#a4a4b0", fontSize: 12 }}
          stroke="#555560"
          label={yAxisLabel ? { 
            value: yAxisLabel, 
            angle: -90, 
            position: 'insideLeft', 
            fill: '#a4a4b0' 
          } : undefined}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#161619",
            borderColor: "#555560",
            borderRadius: "8px",
            padding: "12px",
          }}
          labelStyle={{ color: "#a4a4b0", marginBottom: "8px" }}
          formatter={(value: number) => value.toFixed(2)}
          labelFormatter={(label: number) => new Date(label).toLocaleDateString()}
        />
        {lines.map((line, idx) => {
          // Check if this line should be rendered (for conditional lines)
          if (line.conditional && !line.conditional(data)) {
            return null;
          }
          
          return (
            <Line
              key={idx}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth || 2}
              dot={false}
            />
          );
        })}
        {referenceLines.map((refLine, idx) => (
          <ReferenceLine
            key={idx}
            y={refLine.y}
            stroke={refLine.stroke}
            strokeDasharray="3 3"
            label={{
              value: refLine.label,
              position: refLine.labelPosition || 'right',
              fill: refLine.labelFill,
              fontSize: refLine.fontSize || 12
            }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
