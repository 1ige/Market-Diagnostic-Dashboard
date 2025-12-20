/**
 * Styling Constants and Utilities
 * 
 * Centralized definitions for colors, styles, and formatting utilities.
 */

/**
 * State color configurations for indicators
 */
export const STATE_COLORS = {
  GREEN: {
    bg: "bg-green-900/20",
    border: "border-green-700",
    text: "text-green-400",
    full: "bg-green-900/20 border-green-700 text-green-400",
  },
  YELLOW: {
    bg: "bg-yellow-900/20",
    border: "border-yellow-700",
    text: "text-yellow-400",
    full: "bg-yellow-900/20 border-yellow-700 text-yellow-400",
  },
  RED: {
    bg: "bg-red-900/20",
    border: "border-red-700",
    text: "text-red-400",
    full: "bg-red-900/20 border-red-700 text-red-400",
  },
  UNKNOWN: {
    bg: "bg-gray-900/20",
    border: "border-gray-700",
    text: "text-gray-400",
    full: "bg-gray-900/20 border-gray-700 text-gray-400",
  },
} as const;

export type StateType = keyof typeof STATE_COLORS;

/**
 * Get state color classes for a given state
 */
export function getStateColors(state: StateType | string) {
  const normalizedState = (state || "UNKNOWN").toUpperCase() as StateType;
  return STATE_COLORS[normalizedState] || STATE_COLORS.UNKNOWN;
}

/**
 * Get the full className string for a state badge
 */
export function getStateBadgeClass(state: StateType | string): string {
  return `px-2 py-1 rounded text-xs font-semibold border ${getStateColors(state).full}`;
}

/**
 * Common button style configurations
 */
export const BUTTON_STYLES = {
  primary: "bg-stealth-700 text-stealth-200 hover:bg-stealth-600 hover:text-stealth-100",
  disabled: "bg-stealth-700 text-stealth-400 cursor-not-allowed",
  toggle: {
    active: "bg-stealth-600 text-stealth-100",
    inactive: "text-stealth-400 hover:text-stealth-200",
  },
} as const;

/**
 * Common card/container styles
 */
export const CARD_STYLES = {
  base: "bg-stealth-800 border border-stealth-700 rounded-lg",
  hover: "hover:bg-stealth-750 transition",
  info: "bg-stealth-850/50 border border-stealth-700/50 rounded-lg",
} as const;

/**
 * Format a number with appropriate decimal places
 */
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }
  return value.toFixed(decimals);
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "—";
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Format a date string for display with time
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "—";
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
