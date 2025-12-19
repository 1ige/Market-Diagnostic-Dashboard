import { useApi } from "../hooks/useApi";
import { IndicatorStatus, IndicatorHistoryPoint } from "../types";
import { Link } from "react-router-dom";
import StateSparkline from "../components/widgets/StateSparkline";

export default function Indicators() {
  const { data, loading } = useApi<IndicatorStatus[]>("/indicators");

  return (
    <div className="p-3 md:p-6 text-gray-200">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4">All Indicators</h2>

      {loading && (
        <div className="text-stealth-400">Loading indicators...</div>
      )}

      {!loading && data && (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full bg-stealth-800 rounded">
              <thead className="text-left text-gray-400">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Trend</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {data.map((i) => (
                  <IndicatorRow key={i.code} indicator={i} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-3">
            {data.map((i) => (
              <IndicatorCard key={i.code} indicator={i} />
            ))}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-stealth-400">No indicators available.</div>
      )}
    </div>
  );
}

function IndicatorRow({ indicator }: { indicator: IndicatorStatus }) {
  const { data: history } = useApi<IndicatorHistoryPoint[]>(
    `/indicators/${indicator.code}/history?days=60`
  );

  return (
    <tr className="border-t border-stealth-700">
      <td className="px-4 py-3">
        <Link
          to={`/indicators/${indicator.code}`}
          className="text-accent-yellow hover:underline"
        >
          {indicator.code}
        </Link>
      </td>
      <td className="px-4 py-3">{indicator.name}</td>
      <td className="px-4 py-3">{indicator.score}</td>
      <td className="px-4 py-3">{indicator.state}</td>
      <td className="px-4 py-3">
        <StateSparkline history={history || []} width={200} height={24} />
      </td>
    </tr>
  );
}

function IndicatorCard({ indicator }: { indicator: IndicatorStatus }) {
  const { data: history } = useApi<IndicatorHistoryPoint[]>(
    `/indicators/${indicator.code}/history?days=60`
  );

  const stateColors = {
    GREEN: "bg-green-900/20 border-green-700 text-green-400",
    YELLOW: "bg-yellow-900/20 border-yellow-700 text-yellow-400",
    RED: "bg-red-900/20 border-red-700 text-red-400",
  };

  return (
    <Link to={`/indicators/${indicator.code}`}>
      <div className="bg-stealth-800 border border-stealth-700 rounded-lg p-3 hover:bg-stealth-750 transition">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-accent-yellow font-semibold text-sm">{indicator.code}</div>
            <div className="text-stealth-300 text-xs mt-0.5">{indicator.name}</div>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-semibold border ${stateColors[indicator.state]}`}>
            {indicator.state}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-lg font-bold text-stealth-100">Score: {indicator.score}</div>
        </div>
        {history && history.length > 0 && (
          <div className="mt-2">
            <StateSparkline history={history} width={280} height={24} />
          </div>
        )}
      </div>
    </Link>
  );
}