import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Topbar from "./components/layout/Topbar";
import Footer from "./components/layout/Footer";
import Dashboard from "./pages/Dashboard";
import Indicators from "./pages/Indicators";
import MarketNews from "./pages/MarketNews";
import IndicatorDetail from "./pages/IndicatorDetail";
import SystemBreakdown from "./pages/SystemBreakdown";
import MarketMap from "./pages/MarketMap";
import SectorProjections from "./pages/SectorProjections";
import StockProjections from "./pages/StockProjections";
import AlternativeAssetPressure from "./pages/AlternativeAssetPressure";
import AAPComponentBreakdown from "./pages/AAPComponentBreakdown";
import { trackPageView } from "./utils/analytics";

function AppWithAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    const pageName = location.pathname === '/' ? 'Dashboard' : 
                     location.pathname.includes('/indicators/') ? 'Indicator Detail' :
                     location.pathname.includes('/indicators') ? 'Indicators' :
                     location.pathname.includes('/news') ? 'Market News' :
                     location.pathname.includes('/system-breakdown') ? 'System Breakdown' :
                     location.pathname.includes('/market-map') ? 'Market Map' :
                     location.pathname.includes('/sector-projections') ? 'Sector Projections' :
                     location.pathname.includes('/stock-projections') ? 'Stock Projections' :
                     location.pathname.includes('/precious-metals') ? 'Precious Metals' :
                     location.pathname.includes('/alternative-assets') ? 'Alternative Assets' :
                     location.pathname.includes('/aap-breakdown') ? 'AAP Breakdown' :
                     'Unknown';
    
    trackPageView(location.pathname, pageName);
  }, [location]);

  return (
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
          <Route path="/sector-projections" element={<SectorProjections />} />
          <Route path="/stock-projections" element={<StockProjections />} />
          {/* Redirect old precious-metals route to alternative-assets */}
          <Route path="/precious-metals" element={<Navigate to="/alternative-assets?tab=metals" replace />} />
          <Route path="/alternative-assets" element={<AlternativeAssetPressure />} />
          <Route path="/aap-breakdown" element={<AAPComponentBreakdown />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWithAnalytics />
    </BrowserRouter>
  );
}
