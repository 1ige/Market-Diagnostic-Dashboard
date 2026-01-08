import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface RegimeStatus {
  gold_bias: "MONETARY_HEDGE" | "NEUTRAL" | "FINANCIAL_ASSET";
  silver_bias: "INDUSTRIAL_MONETARY" | "INDUSTRIAL" | "MONETARY";
  pgm_bias: "GROWTH" | "NEUTRAL" | "RECESSION";
  paper_physical_risk: "LOW" | "MODERATE" | "HIGH";
  overall_regime: "MONETARY_STRESS" | "INFLATION_HEDGE" | "GROWTH_REFLATION" | "LIQUIDITY_CRISIS" | "INDUSTRIAL_COMMODITY";
}

interface MetalProjection {
  metal: string;
  metal_name: string;
  etf_symbol: string;
  current_price: number;
  score_total: number;
  score_trend: number;
  score_momentum: number;
  classification: string;
  relative_classification: "Winner" | "Neutral" | "Loser";
  rank: number;
  technicals: {
    sma_20: number | null;
    sma_50: number | null;
    sma_200: number | null;
    rsi: number | null;
    momentum_5d: number | null;
    momentum_20d: number | null;
    momentum_60d: number | null;
    volatility_30d: number | null;
  };
  levels: {
    support: number[];
    resistance: number[];
    take_profit: number;
    stop_loss: number;
  };
  as_of: string;
}

interface MetalIndicators {
  regime: RegimeStatus;
  cb_context: {
    global_cb_gold_pct_reserves: number;
    net_purchases_yoy: number;
    structural_monetary_bid: number;
    em_accumulation_momentum: number;
  };
  price_anchors: {
    au_dxy_ratio_zscore: number;
    ag_dxy_ratio_zscore: number;
    real_rate_signal: number;
    monetary_hedge_strength: number;
  };
  relative_value: {
    au_ag_ratio: number;
    au_ag_ratio_zscore: number;
    pt_au_ratio: number;
    pt_au_ratio_zscore: number;
    pd_au_ratio: number;
    pd_au_ratio_zscore: number;
  };
  physical_paper: {
    paper_credibility_index: number;
    oi_registered_ratio: number;
    comex_registered_inventory_change_yoy: number;
    backwardation_severity: number;
    etf_flow_divergence: number;
  };
}

interface CorrelationMatrix {
  timestamp: string;
  au_ag: number;
  au_pt: number;
  au_pd: number;
  ag_pt: number;
  ag_pd: number;
  pt_pd: number;
  au_spy: number;
  au_tlt: number;
  au_dxy: number;
  au_vix: number;
}

interface CBHolding {
  country: string;
  gold_tonnes: number;
  pct_of_reserves: number;
  net_purchase_qty: number;
  net_purchase_yoy_pct: number;
}

interface SupplyData {
  metal: string;
  production_tonnes_yoy_pct: number;
  aisc_per_oz: number;
  current_spot_price: number;
  margin_pct: number;
  recycling_pct_of_supply: number;
}

interface PriceHistory {
  date: string;
  price: number;
}

// Metal color scheme for consistent identification throughout the page
const METAL_COLORS = {
  AU: { primary: "#FFD700", name: "Gold" },      // Gold
  AG: { primary: "#C0C0C0", name: "Silver" },    // Silver
  PT: { primary: "#9D4EDD", name: "Platinum" },  // Platinum (purple)
  PD: { primary: "#FF6B6B", name: "Palladium" }  // Palladium (red)
};

const getMetalColor = (metal: string): string => {
  return METAL_COLORS[metal as keyof typeof METAL_COLORS]?.primary || "#888888";
};

const getMetalName = (metal: string): string => {
  return METAL_COLORS[metal as keyof typeof METAL_COLORS]?.name || metal;
};

const getRegimeBadgeClass = (regime: string): string => {
  switch (regime) {
    case "MONETARY_STRESS":
      return "bg-red-900/30 border-red-600 text-red-200";
    case "INFLATION_HEDGE":
      return "bg-yellow-900/30 border-yellow-600 text-yellow-200";
    case "GROWTH_REFLATION":
      return "bg-green-900/30 border-green-600 text-green-200";
    case "LIQUIDITY_CRISIS":
      return "bg-red-900/40 border-red-500 text-red-100";
    case "INDUSTRIAL_COMMODITY":
      return "bg-blue-900/30 border-blue-600 text-blue-200";
    default:
      return "bg-stealth-700 border-stealth-600 text-gray-300";
  }
};

const getRiskBadgeClass = (risk: string): string => {
  if (risk === "HIGH") return "bg-red-900/30 border-red-600 text-red-200";
  if (risk === "MODERATE") return "bg-yellow-900/30 border-yellow-600 text-yellow-200";
  return "bg-green-900/30 border-green-600 text-green-200";
};

const getBiasText = (bias: string): string => {
  if (bias.includes("MONETARY")) return "Monetary Hedge";
  if (bias.includes("INDUSTRIAL")) return "Industrial + Monetary";
  if (bias.includes("FINANCIAL")) return "Financial Asset";
  if (bias === "GROWTH") return "Growth Premium";
  if (bias === "RECESSION") return "Recession Hedge";
  return "Neutral";
};

export default function PreciousMetalsDiagnostic() {
  const { data: indicators, loading, error } = useApi<MetalIndicators>("/precious-metals/regime");
  const { data: correlations } = useApi<CorrelationMatrix>("/precious-metals/correlations");
  const { data: cb_holdings } = useApi<CBHolding[]>("/precious-metals/cb-holdings");
  const { data: supply_data } = useApi<SupplyData[]>("/precious-metals/supply");
  const { data: projectionsData } = useApi<{ projections: MetalProjection[] }>("/precious-metals/projections/latest");

  const [selectedTab, setSelectedTab] = useState<"overview" | "deep-dive">("overview");

  if (loading) {
    return (
      <div className="p-6 text-gray-200">
        <h1 className="text-3xl font-bold mb-6">Precious Metals Diagnostic</h1>
        <div className="text-stealth-400">Loading precious metals analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-gray-200">
        <h1 className="text-3xl font-bold mb-6">Precious Metals Diagnostic</h1>
        <div className="bg-red-900/20 border border-red-700 text-red-200 p-4 rounded">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="p-6 text-gray-200">
        <h1 className="text-3xl font-bold mb-6">Precious Metals Diagnostic</h1>
        <div className="text-stealth-400">No data available.</div>
      </div>
    );
  }

  const projections = projectionsData?.projections || [];

  return (
    <div className="p-3 md:p-6 text-gray-200">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Precious Metals Diagnostic</h1>
      <p className="text-stealth-400 mb-6 text-sm md:text-base">
        Macro-structural analysis of precious metals as monetary hedges, industrial commodities, and risk-off assets.
      </p>

      {/* SECTION 1: REGIME CLASSIFICATION PANEL (PINNED TOP) */}
      <div className="mb-6 bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4 text-white">Regime Classification</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {/* Gold Bias Card */}
          <div className={`border rounded-lg p-3 md:p-4 ${getRegimeBadgeClass(indicators.regime.gold_bias)}`}>
            <div className="text-xs md:text-sm font-semibold text-stealth-300 mb-1">GOLD BIAS</div>
            <div className="text-sm md:text-base font-bold">{getBiasText(indicators.regime.gold_bias)}</div>
          </div>

          {/* Silver Bias Card */}
          <div className={`border rounded-lg p-3 md:p-4 ${getRegimeBadgeClass(indicators.regime.silver_bias)}`}>
            <div className="text-xs md:text-sm font-semibold text-stealth-300 mb-1">SILVER BIAS</div>
            <div className="text-sm md:text-base font-bold">{getBiasText(indicators.regime.silver_bias)}</div>
          </div>

          {/* PGM Bias Card */}
          <div className={`border rounded-lg p-3 md:p-4 ${getRegimeBadgeClass(indicators.regime.pgm_bias)}`}>
            <div className="text-xs md:text-sm font-semibold text-stealth-300 mb-1">PGM BIAS</div>
            <div className="text-sm md:text-base font-bold">{getBiasText(indicators.regime.pgm_bias)}</div>
          </div>

          {/* Paper/Physical Risk Card */}
          <div className={`border rounded-lg p-3 md:p-4 ${getRiskBadgeClass(indicators.regime.paper_physical_risk)}`}>
            <div className="text-xs md:text-sm font-semibold text-stealth-300 mb-1">P/P RISK</div>
            <div className="text-sm md:text-base font-bold">{indicators.regime.paper_physical_risk}</div>
          </div>

          {/* Overall Regime Card */}
          <div className={`border rounded-lg p-3 md:p-4 ${getRegimeBadgeClass(indicators.regime.overall_regime)}`}>
            <div className="text-xs md:text-sm font-semibold text-stealth-300 mb-1">REGIME</div>
            <div className="text-sm md:text-base font-bold">
              {indicators.regime.overall_regime.replace(/_/g, " ")}
            </div>
          </div>
        </div>

        <div className="text-xs md:text-sm text-stealth-400 mt-4">
          Last Updated: {new Date().toISOString().split('T')[0]} · Data freshness: Real-time spot | CB data (quarterly lag)
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="mb-6 border-b border-stealth-700 flex gap-4">
        <button
          onClick={() => setSelectedTab("overview")}
          className={`pb-3 px-2 font-semibold border-b-2 transition ${
            selectedTab === "overview"
              ? "border-blue-500 text-blue-300"
              : "border-transparent text-stealth-400 hover:text-gray-300"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedTab("deep-dive")}
          className={`pb-3 px-2 font-semibold border-b-2 transition ${
            selectedTab === "deep-dive"
              ? "border-blue-500 text-blue-300"
              : "border-transparent text-stealth-400 hover:text-gray-300"
          }`}
        >
          Deep Dive
        </button>
      </div>

      {selectedTab === "overview" && (
        <>
          {/* PRICE HISTORY CHART */}
          <div className="mb-6">
            <PriceHistoryChart />
          </div>

          {/* PROJECTIONS & TECHNICAL ANALYSIS */}
          {projections.length > 0 && (
            <div className="mb-6">
              <ProjectionsPanel projections={projections} />
            </div>
          )}
        </>
      )}

      {selectedTab === "deep-dive" && (
        <>
          {/* SECTION 2 & 3: CB CONTEXT & PRICE ANCHORS (2-COLUMN) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Section 2: Monetary & CB Context */}
            <CBContextPanel cb_holdings={cb_holdings} indicators={indicators} />

            {/* Section 3: Price vs Monetary Anchors */}
            <PriceAnchorsPanel indicators={indicators} />
          </div>

          {/* SECTION 4 & 5: RELATIVE VALUE & PHYSICAL/PAPER (2-COLUMN) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Section 4: Relative Value */}
            <RelativeValuePanel indicators={indicators} />

            {/* Section 5: Physical vs Paper */}
            <PhysicalPaperPanel indicators={indicators} />
          </div>

          {/* SECTION 6 & 7: SUPPLY-DEMAND (2-COLUMN) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Section 6: Supply */}
            <SupplyPanel supply_data={supply_data} />

            {/* Section 7: Demand (Placeholder for future data) */}
            <DemandPanel />
          </div>

          {/* SECTION 8 & 9: MARKET CAP & CORRELATIONS */}
          <div className="grid grid-cols-1 gap-6">
            <MarketCapPanel />
            <CorrelationPanel correlations={correlations} />
          </div>
        </>
      )}
    </div>
  );
}

// ==================== SECTION COMPONENTS ====================

function CBContextPanel({ cb_holdings, indicators }: any) {
  return (
    <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
      <h3 className="text-lg font-bold mb-4 text-white">Monetary & Central Bank Context</h3>

      <div className="space-y-6">
        {/* CB Gold % of Reserves */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">Global CB Gold as % of Reserves</span>
            <span className="text-lg font-bold text-blue-300">{indicators.cb_context.global_cb_gold_pct_reserves.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-stealth-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${Math.min((indicators.cb_context.global_cb_gold_pct_reserves / 15) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-stealth-400 mt-1">Historical avg: ~11%, Current: Above average</p>
        </div>

        {/* Net CB Purchases YoY */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">Net CB Purchases (YoY %)</span>
            <span className={`text-lg font-bold ${indicators.cb_context.net_purchases_yoy > 200 ? "text-green-400" : "text-yellow-400"}`}>
              {indicators.cb_context.net_purchases_yoy > 0 ? "+" : ""}{indicators.cb_context.net_purchases_yoy.toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-stealth-400">
            {indicators.cb_context.net_purchases_yoy > 200
              ? "Strong accumulation momentum"
              : "Moderate accumulation"}
          </p>
        </div>

        {/* Structural Monetary Bid */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">Structural Monetary Bid Score</span>
            <span className={`text-lg font-bold ${indicators.cb_context.structural_monetary_bid > 0 ? "text-green-400" : "text-red-400"}`}>
              {indicators.cb_context.structural_monetary_bid > 0 ? "+" : ""}{indicators.cb_context.structural_monetary_bid.toFixed(0)}
            </span>
          </div>
          <div className="w-full bg-stealth-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${indicators.cb_context.structural_monetary_bid > 0 ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(Math.abs((indicators.cb_context.structural_monetary_bid / 100) * 100), 100)}%` }}
            />
          </div>
          <p className="text-xs text-stealth-400 mt-1">Range: -100 to +100. Positive = structural demand</p>
        </div>

        {/* EM Accumulation */}
        {cb_holdings && cb_holdings.length > 0 && (
          <div>
            <span className="text-sm font-semibold text-stealth-300 block mb-2">Top Accumulators (Recent Quarter)</span>
            <div className="space-y-1">
              {cb_holdings.slice(0, 3).map((holding: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs text-stealth-300">
                  <span>{holding.country}</span>
                  <span>{holding.net_purchase_yoy_pct > 0 ? "+" : ""}{holding.net_purchase_yoy_pct.toFixed(0)}% YoY</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceAnchorsPanel({ indicators }: any) {
  return (
    <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
      <h3 className="text-lg font-bold mb-4 text-white">Price vs Monetary Anchors</h3>

      <div className="space-y-4">
        {/* MHS Score */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">Monetary Hedge Strength</span>
            <span className={`text-lg font-bold ${indicators.price_anchors.monetary_hedge_strength > 0 ? "text-green-400" : "text-red-400"}`}>
              {indicators.price_anchors.monetary_hedge_strength.toFixed(0)}
            </span>
          </div>
          <div className="w-full bg-stealth-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${indicators.price_anchors.monetary_hedge_strength > 0 ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(Math.abs((indicators.price_anchors.monetary_hedge_strength / 100) * 100), 100)}%` }}
            />
          </div>
          <p className="text-xs text-stealth-400 mt-1">-100 to +100: Is gold priced as currency or commodity?</p>
        </div>

        {/* Au/DXY Z-Score */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">Au/DXY Ratio (Z-Score)</span>
            <span className={`text-lg font-bold ${Math.abs(indicators.price_anchors.au_dxy_ratio_zscore) > 1.5 ? "text-red-400" : "text-yellow-400"}`}>
              {indicators.price_anchors.au_dxy_ratio_zscore > 0 ? "+" : ""}{indicators.price_anchors.au_dxy_ratio_zscore.toFixed(2)} σ
            </span>
          </div>
          <p className="text-xs text-stealth-400">
            {Math.abs(indicators.price_anchors.au_dxy_ratio_zscore) > 2 && "⚠ Extreme deviation from 2Y norm"}
            {Math.abs(indicators.price_anchors.au_dxy_ratio_zscore) > 1.5 && Math.abs(indicators.price_anchors.au_dxy_ratio_zscore) <= 2 && "High valuation"}
            {Math.abs(indicators.price_anchors.au_dxy_ratio_zscore) <= 1.5 && "Normal range"}
          </p>
        </div>

        {/* Real Rate Signal */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">Real Rate Signal</span>
            <span className={`text-lg font-bold ${indicators.price_anchors.real_rate_signal < 0 ? "text-green-400" : "text-red-400"}`}>
              {indicators.price_anchors.real_rate_signal.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-stealth-400">Negative = lower real rates favor gold</p>
        </div>

        {/* Correlation Summary */}
        <div className="border-t border-stealth-600 pt-3 mt-3">
          <span className="text-xs font-semibold text-stealth-300 block mb-2">Key Correlations (60-day)</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-stealth-400">Au ↔ SPY:</span>
              <span className="text-stealth-300">-0.15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stealth-400">Au ↔ TLT:</span>
              <span className="text-stealth-300">+0.42</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stealth-400">Au ↔ DXY:</span>
              <span className="text-stealth-300">-0.68</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stealth-400">Au ↔ VIX:</span>
              <span className="text-stealth-300">+0.55</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelativeValuePanel({ indicators }: any) {
  return (
    <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
      <h3 className="text-lg font-bold mb-4 text-white">Relative Value: Metals Complex</h3>

      <div className="space-y-4">
        {/* Au/Ag Ratio */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">
              <span style={{ color: getMetalColor('AU') }}>Au</span>/
              <span style={{ color: getMetalColor('AG') }}>Ag</span> Ratio
            </span>
            <span className="text-lg font-bold text-blue-300">{indicators.relative_value.au_ag_ratio.toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-xs text-stealth-400 mb-2">
            <span>Z-Score: {indicators.relative_value.au_ag_ratio_zscore.toFixed(2)} σ</span>
            <span className={indicators.relative_value.au_ag_ratio > 70 ? "text-red-400" : indicators.relative_value.au_ag_ratio < 50 ? "text-green-400" : "text-yellow-400"}>
              {indicators.relative_value.au_ag_ratio > 70 ? "Monetary stress bias" : indicators.relative_value.au_ag_ratio < 50 ? "Industrial demand" : "Balanced"}
            </span>
          </div>
          <div className="bg-stealth-700 rounded p-2">
            <div className="flex justify-between text-xs text-stealth-400">
              <span>50 (Industrial)</span>
              <span>65 (Balanced)</span>
              <span>75 (Stress)</span>
            </div>
          </div>
        </div>

        {/* Pt/Au Ratio */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">
              <span style={{ color: getMetalColor('PT') }}>Pt</span>/
              <span style={{ color: getMetalColor('AU') }}>Au</span> Ratio
            </span>
            <span className="text-lg font-bold text-blue-300">{indicators.relative_value.pt_au_ratio.toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-xs text-stealth-400">
            <span>Z-Score: {indicators.relative_value.pt_au_ratio_zscore.toFixed(2)} σ</span>
            <span className={indicators.relative_value.pt_au_ratio_zscore < -1 ? "text-red-400" : "text-green-400"}>
              {indicators.relative_value.pt_au_ratio_zscore < -1 ? "Recession signal" : "Growth neutral"}
            </span>
          </div>
        </div>

        {/* Pd/Au Ratio */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">
              <span style={{ color: getMetalColor('PD') }}>Pd</span>/
              <span style={{ color: getMetalColor('AU') }}>Au</span> Ratio
            </span>
            <span className="text-lg font-bold text-blue-300">{indicators.relative_value.pd_au_ratio.toFixed(3)}</span>
          </div>
          <p className="text-xs text-stealth-400">
            Z-Score: {indicators.relative_value.pd_au_ratio_zscore.toFixed(2)} σ · Indicator of auto cycle demand
          </p>
        </div>
      </div>
    </div>
  );
}

function PhysicalPaperPanel({ indicators }: any) {
  return (
    <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
      <h3 className="text-lg font-bold mb-4 text-white">Physical vs Paper Market Stress</h3>

      <div className="space-y-4">
        {/* PCI Score */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">Paper Credibility Index (PCI)</span>
            <span className={`text-lg font-bold ${
              indicators.physical_paper.paper_credibility_index > 75
                ? "text-green-400"
                : indicators.physical_paper.paper_credibility_index > 50
                ? "text-yellow-400"
                : "text-red-400"
            }`}>
              {indicators.physical_paper.paper_credibility_index.toFixed(0)}
            </span>
          </div>
          <div className="w-full bg-stealth-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                indicators.physical_paper.paper_credibility_index > 75
                  ? "bg-green-500"
                  : indicators.physical_paper.paper_credibility_index > 50
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${indicators.physical_paper.paper_credibility_index}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-stealth-400 mt-1">
            <span>0 (Stress)</span>
            <span>50 (Caution)</span>
            <span>75+ (Healthy)</span>
          </div>
        </div>

        {/* OI / Registered Ratio */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">Futures OI / Registered Inventory</span>
            <span className="text-lg font-bold text-blue-300">{indicators.physical_paper.oi_registered_ratio.toFixed(2)}x</span>
          </div>
          <p className="text-xs text-stealth-400">Normal: 0.9–1.0x. {indicators.physical_paper.oi_registered_ratio > 1.3 ? "⚠ Elevated stress" : "✓ Healthy"}</p>
        </div>

        {/* Inventory Change */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">Registered Inventory (YoY %)</span>
            <span className={`text-lg font-bold ${indicators.physical_paper.comex_registered_inventory_change_yoy < -5 ? "text-red-400" : "text-yellow-400"}`}>
              {indicators.physical_paper.comex_registered_inventory_change_yoy.toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-stealth-400">
            {indicators.physical_paper.comex_registered_inventory_change_yoy < -10
              ? "⚠ Significant decline—monitor tightness"
              : "Normal range"}
          </p>
        </div>

        {/* Backwardation */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-stealth-300">Backwardation Severity (bps)</span>
            <span className="text-lg font-bold text-blue-300">{indicators.physical_paper.backwardation_severity.toFixed(0)}</span>
          </div>
          <p className="text-xs text-stealth-400">
            {indicators.physical_paper.backwardation_severity > 500 ? "⚠ Deep backwardation = stress" : "Normal contango structure"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SupplyPanel({ supply_data }: any) {
  return (
    <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
      <h3 className="text-lg font-bold mb-4 text-white">Supply-Side Constraints</h3>

      {supply_data && supply_data.length > 0 ? (
        <div className="space-y-4">
          {supply_data.map((metal: any, idx: number) => (
            <div key={idx} className="border-b border-stealth-600 pb-3 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <span 
                  className="text-sm font-semibold" 
                  style={{ color: getMetalColor(metal.metal) }}
                >
                  {getMetalName(metal.metal)} ({metal.metal})
                </span>
                <span className={`text-xs font-bold ${metal.production_tonnes_yoy_pct < 0 ? "text-red-400" : "text-green-400"}`}>
                  {metal.production_tonnes_yoy_pct > 0 ? "+" : ""}{metal.production_tonnes_yoy_pct.toFixed(0)}% YoY
                </span>
              </div>
              <div className="text-xs text-stealth-400 space-y-1">
                <div className="flex justify-between">
                  <span>AISC: ${metal.aisc_per_oz.toFixed(0)}/oz</span>
                  <span>Spot: ${metal.current_spot_price.toFixed(0)}/oz</span>
                </div>
                <div className="flex justify-between">
                  <span>Margin:</span>
                  <span className={metal.margin_pct > 50 ? "text-green-400" : "text-yellow-400"}>
                    {metal.margin_pct.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Recycling:</span>
                  <span>{metal.recycling_pct_of_supply.toFixed(0)}% of supply</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stealth-400">Supply data loading...</p>
      )}
    </div>
  );
}

function DemandPanel() {
  return (
    <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
      <h3 className="text-lg font-bold mb-4 text-white">Demand Decomposition</h3>
      <p className="text-sm text-stealth-400">Quarterly demand data by category: Investment, Industrial, Jewelry</p>
      <div className="mt-4 p-4 bg-stealth-700 rounded text-xs text-stealth-400">
        Demand data updates quarterly. Check back for latest WGC and Silver Institute reports.
      </div>
    </div>
  );
}

function MarketCapPanel() {
  return (
    <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
      <h3 className="text-lg font-bold mb-4 text-white">Market Capitalization & Monetary Weight</h3>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stealth-700 rounded p-3">
            <div className="text-stealth-400 text-xs mb-1">Gold Stock</div>
            <div className="text-lg font-bold text-blue-300">~$15.0T</div>
            <div className="text-xs text-stealth-500">200k tonnes</div>
          </div>
          <div className="bg-stealth-700 rounded p-3">
            <div className="text-stealth-400 text-xs mb-1">Total Metals</div>
            <div className="text-lg font-bold text-blue-300">~$17.0T</div>
            <div className="text-xs text-stealth-500">All metals combined</div>
          </div>
        </div>
        <div className="bg-stealth-700 rounded p-3">
          <div className="text-stealth-400 text-xs mb-2">Ratio to Global M2</div>
          <div className="flex justify-between items-center">
            <span>Metals / M2:</span>
            <span className="text-lg font-bold text-blue-300">8.5%</span>
          </div>
          <div className="text-xs text-stealth-400 mt-1">Historical: Pre-1971 (20%), Post-1980 (2–5%)</div>
        </div>
        <p className="text-xs text-stealth-400 border-t border-stealth-600 pt-3">
          Non-predictive scenarios: If Au → $3,000/oz, metals stock → +20% ($20.5T). If Au → $5,000/oz, → +40% ($24T).
        </p>
      </div>
    </div>
  );
}

function CorrelationPanel({ correlations }: any) {
  if (!correlations) {
    return (
      <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
        <h3 className="text-lg font-bold mb-4 text-white">Volatility & Correlation</h3>
        <p className="text-sm text-stealth-400">Correlation data loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
      <h3 className="text-lg font-bold mb-4 text-white">Volatility & Correlation (60-day Rolling)</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-stealth-400 border-b border-stealth-600">
            <tr>
              <th className="text-left py-2">Pair</th>
              <th className="text-right py-2">Correlation</th>
              <th className="text-right py-2">Interpretation</th>
            </tr>
          </thead>
          <tbody className="text-xs text-stealth-300">
            <tr className="border-b border-stealth-700">
              <td className="py-2">
                <span style={{ color: getMetalColor('AU') }}>Au</span> ↔ <span style={{ color: getMetalColor('AG') }}>Ag</span>
              </td>
              <td className="text-right font-semibold">{correlations.au_ag.toFixed(2)}</td>
              <td className="text-right">High correlation (both monetary)</td>
            </tr>
            <tr className="border-b border-stealth-700">
              <td className="py-2">
                <span style={{ color: getMetalColor('AU') }}>Au</span> ↔ SPY
              </td>
              <td className="text-right font-semibold">{correlations.au_spy.toFixed(2)}</td>
              <td className="text-right">Diversification benefit</td>
            </tr>
            <tr className="border-b border-stealth-700">
              <td className="py-2">
                <span style={{ color: getMetalColor('AU') }}>Au</span> ↔ TLT
              </td>
              <td className="text-right font-semibold">{correlations.au_tlt.toFixed(2)}</td>
              <td className="text-right">Bond substitute signal</td>
            </tr>
            <tr className="border-b border-stealth-700">
              <td className="py-2">
                <span style={{ color: getMetalColor('AU') }}>Au</span> ↔ DXY
              </td>
              <td className="text-right font-semibold">{correlations.au_dxy.toFixed(2)}</td>
              <td className="text-right">Currency hedge effect</td>
            </tr>
            <tr>
              <td className="py-2">
                <span style={{ color: getMetalColor('AU') }}>Au</span> ↔ VIX
              </td>
              <td className="text-right font-semibold">{correlations.au_vix.toFixed(2)}</td>
              <td className="text-right">Stress indicator</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-stealth-700 rounded text-xs text-stealth-400 border-l-2 border-blue-500">
        <strong>Note:</strong> Correlations change with market regime. Breakdowns {'>'} ±2σ signal regime shifts. Use as
        regime confirmation, not reversion signal.
      </div>
    </div>
  );
}

// ==================== PROJECTIONS PANEL ====================
function ProjectionsPanel({ projections }: { projections: MetalProjection[] }) {
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "Strong": return "text-emerald-400";
      case "Bullish": return "text-green-400";
      case "Neutral": return "text-yellow-400";
      case "Bearish": return "text-orange-400";
      case "Weak": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getRelativeClassColor = (relClass: "Winner" | "Neutral" | "Loser") => {
    switch (relClass) {
      case "Winner": return "bg-emerald-500/20 text-emerald-400 border-emerald-500";
      case "Loser": return "bg-red-500/20 text-red-400 border-red-500";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500";
    }
  };

  return (
    <div className="bg-stealth-800 p-4 md:p-6 rounded-lg border border-stealth-600">
      <h2 className="text-xl font-bold mb-4">
        Metal Projections & Technical Analysis
      </h2>

      {/* Winners and Losers Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {projections.map((proj) => (
          <div
            key={proj.metal}
            className={`p-3 rounded border ${getRelativeClassColor(proj.relative_classification)}`}
          >
            <div className="text-xs font-semibold mb-1">
              #{proj.rank} <span style={{ color: getMetalColor(proj.metal) }}>{proj.metal_name}</span>
            </div>
            <div className="text-lg font-bold">${proj.current_price.toFixed(2)}</div>
            <div className="text-xs mt-1">Score: {proj.score_total}/100</div>
            <div className={`text-xs mt-1 font-semibold ${getClassificationColor(proj.classification)}`}>
              {proj.classification}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projections.map((proj) => (
          <div key={proj.metal} className="bg-stealth-700 p-4 rounded border border-stealth-600">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">
                  <span style={{ color: getMetalColor(proj.metal) }}>{proj.metal_name}</span> ({proj.etf_symbol})
                </h3>
                <div className="text-sm text-stealth-400" style={{ color: getMetalColor(proj.metal) }}>
                  {proj.metal}
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-semibold ${getRelativeClassColor(proj.relative_classification)}`}>
                {proj.relative_classification}
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div>
                <span className="text-stealth-400">Current:</span>
                <span className="ml-2 font-semibold">${proj.current_price.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-stealth-400">RSI:</span>
                <span className="ml-2 font-semibold">{proj.technicals.rsi?.toFixed(1) || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stealth-400">SMA 20:</span>
                <span className="ml-2 font-semibold">${proj.technicals.sma_20?.toFixed(2) || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stealth-400">SMA 50:</span>
                <span className="ml-2 font-semibold">${proj.technicals.sma_50?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>

            {/* Momentum */}
            <div className="mb-3">
              <div className="text-xs text-stealth-400 mb-1">Momentum</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-stealth-400">5d:</span>
                  <span className={`ml-1 font-semibold ${(proj.technicals.momentum_5d || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {proj.technicals.momentum_5d?.toFixed(1) || 'N/A'}%
                  </span>
                </div>
                <div>
                  <span className="text-stealth-400">20d:</span>
                  <span className={`ml-1 font-semibold ${(proj.technicals.momentum_20d || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {proj.technicals.momentum_20d?.toFixed(1) || 'N/A'}%
                  </span>
                </div>
                <div>
                  <span className="text-stealth-400">60d:</span>
                  <span className={`ml-1 font-semibold ${(proj.technicals.momentum_60d || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {proj.technicals.momentum_60d?.toFixed(1) || 'N/A'}%
                  </span>
                </div>
              </div>
            </div>

            {/* Support and Resistance */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <div className="text-stealth-400 mb-1">Support Levels</div>
                {proj.levels.support.length > 0 ? (
                  proj.levels.support.map((level, idx) => (
                    <div key={idx} className="text-green-400 font-semibold">
                      ${level.toFixed(2)}
                    </div>
                  ))
                ) : (
                  <div className="text-stealth-500">None detected</div>
                )}
              </div>
              <div>
                <div className="text-stealth-400 mb-1">Resistance Levels</div>
                {proj.levels.resistance.length > 0 ? (
                  proj.levels.resistance.map((level, idx) => (
                    <div key={idx} className="text-red-400 font-semibold">
                      ${level.toFixed(2)}
                    </div>
                  ))
                ) : (
                  <div className="text-stealth-500">None detected</div>
                )}
              </div>
            </div>

            {/* Price Targets */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-stealth-600">
              <div>
                <span className="text-stealth-400">Target:</span>
                <span className="ml-2 text-green-400 font-semibold">${proj.levels.take_profit.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-stealth-400">Stop:</span>
                <span className="ml-2 text-red-400 font-semibold">${proj.levels.stop_loss.toFixed(2)}</span>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="mt-3 pt-3 border-t border-stealth-600">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stealth-400">Trend Score:</span>
                <span className="font-semibold">{proj.score_trend}/100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stealth-400">Momentum Score:</span>
                <span className="font-semibold">{proj.score_momentum}/100</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-stealth-700 rounded text-xs text-stealth-400 border-l-2 border-blue-500">
        <strong>Technical Analysis:</strong> Projections based on SMA crossovers (20/50/200), RSI, momentum, and recent support/resistance.
        Winner/Loser classification is relative across all four metals. Strong = {'>'} 75 total score.
      </div>
    </div>
  );
}

function PriceHistoryChart() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const metals = ['AU', 'AG', 'PT', 'PD'];
        const responses = await Promise.all(
          metals.map(metal => 
            fetch(`/api/precious-metals/history/${metal}?days=365`)
              .then(res => res.json())
          )
        );

        // Combine all metal histories into a single dataset
        const auData = responses[0] || [];
        const agData = responses[1] || [];
        const ptData = responses[2] || [];
        const pdData = responses[3] || [];

        // Create a map of dates to prices
        const dateMap = new Map();

        auData.forEach((item: PriceHistory) => {
          const date = item.date.split('T')[0];
          if (!dateMap.has(date)) {
            dateMap.set(date, { date });
          }
          dateMap.get(date).AU = item.price;
        });

        agData.forEach((item: PriceHistory) => {
          const date = item.date.split('T')[0];
          if (!dateMap.has(date)) {
            dateMap.set(date, { date });
          }
          dateMap.get(date).AG = item.price;
        });

        ptData.forEach((item: PriceHistory) => {
          const date = item.date.split('T')[0];
          if (!dateMap.has(date)) {
            dateMap.set(date, { date });
          }
          dateMap.get(date).PT = item.price;
        });

        pdData.forEach((item: PriceHistory) => {
          const date = item.date.split('T')[0];
          if (!dateMap.has(date)) {
            dateMap.set(date, { date });
          }
          dateMap.get(date).PD = item.price;
        });

        const combined = Array.from(dateMap.values()).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setHistoryData(combined);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching price history:', error);
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
        <h3 className="text-lg font-bold mb-4 text-white">Price History (1 Year)</h3>
        <div className="text-stealth-400">Loading price history...</div>
      </div>
    );
  }

  return (
    <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
      <h3 className="text-lg font-bold mb-4 text-white">Price History (1 Year)</h3>
      
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={historyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(date) => {
              const d = new Date(date);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: 'Gold/Platinum/Palladium ($/oz)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: 'Silver ($/oz)', angle: 90, position: 'insideRight', fill: '#9CA3AF' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#E5E7EB'
            }}
            formatter={(value: any) => [`$${value.toFixed(2)}`, '']}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Legend 
            wrapperStyle={{ color: '#9CA3AF' }}
            iconType="line"
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="AU" 
            stroke="#FFD700" 
            strokeWidth={2}
            dot={false}
            name="Gold"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="AG" 
            stroke="#C0C0C0" 
            strokeWidth={2}
            dot={false}
            name="Silver"
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="PT" 
            stroke="#9D4EDD" 
            strokeWidth={2}
            dot={false}
            name="Platinum"
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="PD" 
            stroke="#FF6B6B" 
            strokeWidth={2}
            dot={false}
            name="Palladium"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-stealth-400">
        <p>All metals priced in USD per troy ounce. Gold, Platinum, and Palladium on left axis; Silver on right axis due to different price scale.</p>
      </div>
    </div>
  );
}
