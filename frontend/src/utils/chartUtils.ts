/**
 * Chart Configuration Utilities
 * 
 * Common chart configurations and formatters for recharts.
 */

/**
 * Common chart colors
 */
export const CHART_COLORS = {
  primary: "#eab308",      // accent-yellow
  secondary: "#10b981",    // green
  tertiary: "#3b82f6",     // blue
  danger: "#ef4444",       // red
  grid: "#374151",         // stealth-700
  text: "#9ca3af",         // gray-400
  green: "#10b981",
  yellow: "#eab308",
  red: "#ef4444",
} as const;

/**
 * Get color based on state
 */
export function getChartColorForState(state: string): string {
  const stateUpper = state.toUpperCase();
  if (stateUpper === 'GREEN') return CHART_COLORS.green;
  if (stateUpper === 'YELLOW') return CHART_COLORS.yellow;
  if (stateUpper === 'RED') return CHART_COLORS.red;
  return CHART_COLORS.text;
}

/**
 * Common X-axis configuration
 */
export const commonXAxisProps = {
  stroke: CHART_COLORS.text,
  tick: { fill: CHART_COLORS.text, fontSize: 12 },
  tickFormatter: (value: string) => {
    try {
      const date = new Date(value);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return value;
    }
  },
};

/**
 * Common Y-axis configuration
 */
export const commonYAxisProps = {
  stroke: CHART_COLORS.text,
  tick: { fill: CHART_COLORS.text, fontSize: 12 },
};

/**
 * Common CartesianGrid configuration
 */
export const commonGridProps = {
  strokeDasharray: "3 3",
  stroke: CHART_COLORS.grid,
  opacity: 0.3,
};

/**
 * Common tooltip style
 */
export const commonTooltipStyle = {
  backgroundColor: "#1f2937",
  border: "1px solid #374151",
  borderRadius: "0.375rem",
  color: "#e5e7eb",
};

/**
 * Format value for tooltip display
 */
export function formatTooltipValue(value: any, decimals: number = 2): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === 'number') {
    return value.toFixed(decimals);
  }
  return String(value);
}

/**
 * Format percentage for charts
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format timestamp for tooltip
 */
export function formatTooltipTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return timestamp;
  }
}
