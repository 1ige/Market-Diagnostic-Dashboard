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

// ...rest of IndicatorDetail.tsx code (as previously read) goes here, with the function renamed to AnalystConfidenceDetail...
