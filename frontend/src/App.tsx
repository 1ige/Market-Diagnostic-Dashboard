import { BrowserRouter, Routes, Route } from "react-router-dom";
import Topbar from "./components/layout/Topbar";
import Footer from "./components/layout/Footer";
import Dashboard from "./pages/Dashboard";
import Indicators from "./pages/Indicators";
import MarketNews from "./pages/MarketNews";
import IndicatorDetail from "./pages/IndicatorDetail";
import SystemBreakdown from "./pages/SystemBreakdown";
import MarketMap from "./pages/MarketMap";

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-stealth-900 min-h-screen flex flex-col">
        <Topbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/indicators" element={<Indicators />} />
            <Route path="/indicators/:code" element={<IndicatorDetail />} />
            {/* News replaces the old alerts page */}
            <Route path="/news" element={<MarketNews />} />
            <Route path="/system-breakdown" element={<SystemBreakdown />} />
            <Route path="/market-map" element={<MarketMap />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
