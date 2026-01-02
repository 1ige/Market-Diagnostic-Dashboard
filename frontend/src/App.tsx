import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Topbar from "./components/layout/Topbar";
import Footer from "./components/layout/Footer";
import Dashboard from "./pages/Dashboard";
import Indicators from "./pages/Indicators";
import MarketNews from "./pages/MarketNews";
import IndicatorDetail from "./pages/IndicatorDetail";
import SystemBreakdown from "./pages/SystemBreakdown";
import MarketMap from "./pages/MarketMap";
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
