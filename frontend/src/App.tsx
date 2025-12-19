import { BrowserRouter, Routes, Route } from "react-router-dom";
import Topbar from "./components/layout/Topbar";
import Dashboard from "./pages/Dashboard";
import Indicators from "./pages/Indicators";
import Alerts from "./pages/Alerts";
import IndicatorDetail from "./pages/IndicatorDetail";
import SystemBreakdown from "./pages/SystemBreakdown";
import MarketMap from "./pages/MarketMap";

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-stealth-900 min-h-screen">
        <Topbar />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/indicators" element={<Indicators />} />
          <Route path="/indicators/:code" element={<IndicatorDetail />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/system-breakdown" element={<SystemBreakdown />} />
          <Route path="/market-map" element={<MarketMap />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}