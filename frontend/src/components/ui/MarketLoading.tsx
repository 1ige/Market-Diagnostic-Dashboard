import React from "react";

export type MarketLoadingVariant = "pulse" | "scan" | "drift";

interface MarketLoadingProps {
  size?: number;
  label?: string;
  variant?: MarketLoadingVariant;
}

export default function MarketLoading({
  size = 96,
  label = "Updating signals...",
  variant = "pulse",
}: MarketLoadingProps) {
  const isPulse = variant === "pulse";
  const iconClass =
    isPulse
      ? "market-loading-pulse-icon"
      : variant === "drift"
        ? "market-loading-drift"
        : "";

  return (
    <div
      className="flex flex-col items-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="relative flex items-center justify-center rounded-2xl border border-stealth-700/70 bg-stealth-900/60 p-4"
        style={{ width: size + 28, height: size + 28 }}
      >
        <svg
          viewBox="0 0 96 96"
          width={size}
          height={size}
          className={`block select-none ${iconClass}`}
          aria-hidden="true"
        >
          <rect x="16" y="56" width="10" height="20" rx="2" fill="#1f2937" />
          <rect x="32" y="48" width="10" height="28" rx="2" fill="#243045" />
          <rect x="48" y="52" width="10" height="24" rx="2" fill="#1f2937" />
          <rect x="64" y="40" width="10" height="36" rx="2" fill="#2a374d" />

          <path
            d="M18 52 L34 44 L50 48 L66 34 L82 28"
            stroke="#3b82f6"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
          />
          <path
            d="M18 52 L34 44 L50 48 L66 34 L82 28"
            stroke="#7dd3fc"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isPulse ? "market-loading-pulse-path" : ""}
            pathLength={100}
          />
          <circle cx="18" cy="52" r="3" fill="#60a5fa" opacity="0.6" />
          <circle cx="34" cy="44" r="3" fill="#60a5fa" opacity="0.6" />
          <circle cx="50" cy="48" r="3" fill="#60a5fa" opacity="0.6" />
          <circle cx="66" cy="34" r="3" fill="#60a5fa" opacity="0.6" />
          <circle
            cx="82"
            cy="28"
            r="3.4"
            fill="#93c5fd"
            className={isPulse ? "market-loading-pulse-dot" : ""}
          />
        </svg>

        {variant === "scan" && (
          <div
            className="pointer-events-none absolute left-4 right-4 top-2 h-6 market-loading-scan-line"
            style={{ mixBlendMode: "screen" }}
          />
        )}

        {variant === "pulse" && (
          <div
            className="pointer-events-none absolute left-4 right-4 bottom-3 rounded-full bg-stealth-800/70 overflow-hidden"
            style={{ height: Math.max(3, Math.round(size * 0.04)) }}
          >
            <div className="h-full w-1/2 market-loading-pulse-line" />
          </div>
        )}
      </div>

      {label ? (
        <div className="text-xs text-stealth-400 tracking-wide">{label}</div>
      ) : null}

      <style>{`
        @keyframes market-loading-pulse-icon {
          0% {
            opacity: 0.85;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.85;
          }
        }

        @keyframes market-loading-pulse-line {
          0% {
            stroke-dashoffset: 100;
            opacity: 0;
          }
          30% {
            opacity: 0.4;
          }
          70% {
            opacity: 0.7;
          }
          100% {
            stroke-dashoffset: -100;
            opacity: 0;
          }
        }

        @keyframes market-loading-pulse-dot {
          0% {
            opacity: 0.45;
          }
          40% {
            opacity: 0.8;
          }
          100% {
            opacity: 0.45;
          }
        }

        @keyframes market-loading-drift {
          0% {
            transform: translate(0, 0) rotate(-1deg);
          }
          50% {
            transform: translate(3px, -2px) rotate(1deg);
          }
          100% {
            transform: translate(-2px, 2px) rotate(-1deg);
          }
        }

        @keyframes market-loading-scan {
          0% {
            transform: translateY(-50%);
            opacity: 0;
          }
          20% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(260%);
            opacity: 0;
          }
        }

        .market-loading-pulse-icon {
          animation: market-loading-pulse-icon 1.6s ease-in-out infinite;
        }

        .market-loading-pulse-path {
          stroke-dasharray: 18 82;
          stroke-dashoffset: 100;
          filter: drop-shadow(0 0 6px rgba(96, 165, 250, 0.45));
          animation: market-loading-pulse-line 1.8s ease-in-out infinite;
        }

        .market-loading-pulse-dot {
          filter: drop-shadow(0 0 6px rgba(147, 197, 253, 0.6));
          animation: market-loading-pulse-dot 1.8s ease-in-out infinite;
        }

        .market-loading-drift {
          animation: market-loading-drift 3s ease-in-out infinite;
        }

        .market-loading-scan-line {
          background: linear-gradient(
            to bottom,
            rgba(59, 130, 246, 0) 0%,
            rgba(96, 165, 250, 0.35) 50%,
            rgba(59, 130, 246, 0) 100%
          );
          filter: blur(0.5px);
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.25);
          animation: market-loading-scan 2.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
