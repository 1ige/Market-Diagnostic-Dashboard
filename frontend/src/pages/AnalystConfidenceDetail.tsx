
import React from "react";
import { useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { IndicatorHistoryPoint } from "../types";
import StateSparkline from "../components/widgets/StateSparkline";
import { ComponentChart } from "../components/widgets/ComponentChart";
import { ComponentCard } from "../components/widgets/ComponentCard";
import { processComponentData, calculateDateRange, extendStaleData, filterByDateRange } from "../utils/chartDataUtils";
import { prepareExtendedComponentData } from "../utils/indicatorDetailHelpers";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
	ReferenceLine,
} from "recharts";

interface IndicatorMetadata {
	name: string;
	description: string;
	relevance: string;
	scoring: string;
	typical_range: string;
	impact: string;
}

interface IndicatorDetailResponse {
	code: string;
	name: string;
	latest?: {
		timestamp: string;
		raw_value: number;
		normalized_value: number;
		score: number;
		state: "GREEN" | "YELLOW" | "RED";
	};
	metadata?: IndicatorMetadata;
	has_data?: boolean;
}

interface ComponentData {
	date: string;
	pce: { value: number; mom_pct: number };
	cpi: { value: number; mom_pct: number };
	pi: { value: number; mom_pct: number };
	spreads: {
		pce_vs_cpi: number;
		pi_vs_cpi: number;
		consumer_health: number;
	};
}

interface BondComponentData {
	date: string;
	credit_spread_stress: {
		hy_oas: number;
		ig_oas: number;
		stress_score: number;
		weight: number;
		contribution: number;
	};
	yield_curve_stress: {
		spread_10y2y: number;
		spread_10y3m: number;
		spread_30y5y: number;
		stress_score: number;
		weight: number;
		contribution: number;
	};
	rates_momentum_stress: {
		roc_2y: number;
		roc_10y: number;
		stress_score: number;
		weight: number;
		contribution: number;
	};
	treasury_volatility_stress: {
		calculated_volatility: number;
		stress_score: number;
		weight: number;
		contribution: number;
	};
	composite: {
		stress_score: number;
	};
}

interface LiquidityComponentData {
	date: string;
	m2_money_supply: {
		value: number;
		yoy_pct: number;
		z_score: number;
	};
	fed_balance_sheet: {
		value: number;
		delta: number;
		z_score: number;
	};
	reverse_repo: {
		value: number;
		z_score: number;
	};
	composite: {
		liquidity_proxy: number;
		stress_score: number;
	};
}

interface SentimentCompositeComponentData {
	date: string;
	michigan_sentiment: {
		value: number;
		confidence_score: number;
		weight: number;
		contribution: number;
	};
	nfib_optimism?: {
		value: number;
		confidence_score: number;
		weight: number;
		contribution: number;
	};
	ism_new_orders?: {
		value: number;
		confidence_score: number;
		weight: number;
		contribution: number;
	};
	capex_proxy?: {
		value: number;
		confidence_score: number;
		weight: number;
		contribution: number;
	};
	composite: {
		confidence_score: number;
	};
}

interface AnalystAnxietyComponentData {
	date: string;
	vix: {
		value: number;
		stress_score: number;
		stability_score: number;
		weight: number;
		contribution: number;
	};
	hy_oas: {
		value: number;
		stress_score: number;
		stability_score: number;
		weight: number;
		contribution: number;
	};
	move?: {
		value: number;
		stress_score: number;
		stability_score: number;
		weight: number;
		contribution: number;
	};
	erp_proxy?: {
		bbb_yield: number;
		treasury_10y: number;
		spread: number;
		stress_score: number;
		stability_score: number;
		weight: number;
		contribution: number;
	};
	composite: {
		stress_score: number;
		stability_score: number;
	};
}

export default function AnalystConfidenceDetail() {
	// --- The entire body of IndicatorDetail, but the function is now AnalystConfidenceDetail ---
	// (Paste the full implementation from IndicatorDetail.tsx here, replacing the function name)

	// ...PASTE ALL LINES FROM IndicatorDetail.tsx's FUNCTION BODY HERE, replacing IndicatorDetail with AnalystConfidenceDetail...

}
