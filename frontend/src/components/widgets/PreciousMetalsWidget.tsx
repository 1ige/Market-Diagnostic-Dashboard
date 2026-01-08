import { useState, useEffect } from "react";
import { getLegacyApiUrl } from "../../utils/apiUtils";
import { Link } from "react-router-dom";

interface MetalProjection {
  metal: string;
  metal_name: string;
  current_price: number;
  score_total: number;
  classification: string;
  relative_classification: "Winner" | "Neutral" | "Loser";
  technicals: {
    momentum_20d: number | null;
  };
}

interface RegimeStatus {
  overall_regime: string;
  gold_bias: string;
  paper_physical_risk: string;
}

const METAL_COLORS: Record<string, string> = {
  AU: "#FFD700",
  AG: "#C0C0C0",
  PT: "#9D4EDD",
  PD: "#FF6B6B"
};

export default function PreciousMetalsWidget() {
  const [projections, setProjections] = useState<MetalProjection[]>([]);
  const [regime, setRegime] = useState<RegimeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = getLegacyApiUrl();
        
        const [projectionsRes, regimeRes] = await Promise.all([
          fetch(`${apiUrl}/precious-metals/projections/latest`),
          fetch(`${apiUrl}/precious-metals/regime`)
        ]);

        if (projectionsRes.ok) {
          const data = await projectionsRes.json();
          setProjections(data.projections || []);
        }

        if (regimeRes.ok) {
          const data = await regimeRes.json();
          setRegime(data.regime || null);
        }
      } catch (error) {
        console.error("Error fetching metals data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRegimeColor = (regime: string) => {
    if (regime.includes("MONETARY") || regime.includes("INFLATION")) return "text-yellow-400";
    if (regime.includes("GROWTH")) return "text-green-400";
    if (regime.includes("CRISIS")) return "text-red-400";
    return "text-blue-400";
  };

  const getClassColor = (classification: "Winner" | "Neutral" | "Loser") => {
    if (classification === "Winner") return "text-emerald-400";
    if (classification === "Loser") return "text-red-400";
    return "text-blue-400";
  };

  if (loading) {
    return (
      <div className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6">
        <h3 className="text-base sm:text-lg font-bold mb-3">Precious Metals</h3>
        <div className="text-sm text-stealth-400">Loading...</div>
      </div>
    );
  }

  return (
    <Link 
      to="/precious-metals"
      className="bg-stealth-800 rounded-lg border border-stealth-700 p-4 md:p-6 hover:border-stealth-600 transition-colors cursor-pointer block"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-base sm:text-lg font-bold">Precious Metals</h3>
        {regime && (
          <span className={`text-xs font-semibold ${getRegimeColor(regime.overall_regime)}`}>
            {regime.overall_regime.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Metal Rankings */}
      <div className="space-y-2 mb-4">
        {projections.slice(0, 4).map((proj) => (
          <div key={proj.metal} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 flex-1">
              <span 
                className="font-semibold"
                style={{ color: METAL_COLORS[proj.metal] }}
              >
                {proj.metal}
              </span>
              <span className="text-stealth-400 text-xs">${proj.current_price.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${
                (proj.technicals.momentum_20d || 0) >= 0 ? "text-green-400" : "text-red-400"
              }`}>
                {proj.technicals.momentum_20d !== null 
                  ? `${proj.technicals.momentum_20d > 0 ? "+" : ""}${proj.technicals.momentum_20d.toFixed(1)}%`
                  : "N/A"}
              </span>
              <span className={`text-xs ${getClassColor(proj.relative_classification)}`}>
                {proj.relative_classification}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Stats */}
      {regime && (
        <div className="pt-3 border-t border-stealth-700 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-stealth-400">Gold Bias:</span>
            <div className="font-semibold text-stealth-200 mt-0.5">
              {regime.gold_bias.replace(/_/g, " ")}
            </div>
          </div>
          <div>
            <span className="text-stealth-400">Paper Risk:</span>
            <div className={`font-semibold mt-0.5 ${
              regime.paper_physical_risk === "HIGH" ? "text-red-400" :
              regime.paper_physical_risk === "MODERATE" ? "text-yellow-400" : "text-green-400"
            }`}>
              {regime.paper_physical_risk}
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}
