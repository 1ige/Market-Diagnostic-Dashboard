import { Link, useLocation } from "react-router-dom";

export default function Topbar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/indicators", label: "Indicators" },
    { path: "/market-map", label: "Market Map" },
    { path: "/alerts", label: "Alerts" },
    { path: "/system-breakdown", label: "System Breakdown" },
  ];

  return (
    <div className="sticky top-0 z-50 w-full bg-stealth-800 border-b border-stealth-700 shadow-lg">
      <div className="flex items-center h-16 px-6">
        <span className="text-lg font-bold text-stealth-100 mr-8">Market Stability Diagnostic</span>
        
        <nav className="flex gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-stealth-700 text-pulse-400"
                    : "text-stealth-300 hover:bg-stealth-700 hover:text-stealth-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}