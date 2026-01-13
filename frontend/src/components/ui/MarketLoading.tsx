import React from "react";

export type MarketLoadingVariant = "pulse" | "scan" | "drift";

interface MarketLoadingProps {
  size?: number;
  label?: string;
  variant?: MarketLoadingVariant;
}

const ICON_SRC = "/assets/marketdiag_icon_loading.png";

export default function MarketLoading({
  size = 96,
  label = "Updating signals...",
  variant = "pulse",
}: MarketLoadingProps) {
  const iconClass =
    variant === "pulse"
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
        <img
          src={ICON_SRC}
          alt="Market diagnostic loading"
          className={`block select-none ${iconClass}`}
          style={{ width: size, height: size }}
          draggable={false}
        />

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
            transform: translateX(-70%);
            opacity: 0;
          }
          30% {
            opacity: 0.35;
          }
          70% {
            opacity: 0.65;
          }
          100% {
            transform: translateX(140%);
            opacity: 0;
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

        .market-loading-pulse-line {
          background: linear-gradient(
            90deg,
            rgba(59, 130, 246, 0),
            rgba(96, 165, 250, 0.65),
            rgba(125, 211, 252, 0.2),
            rgba(59, 130, 246, 0)
          );
          box-shadow: 0 0 8px rgba(96, 165, 250, 0.35);
          animation: market-loading-pulse-line 1.8s ease-in-out infinite;
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
