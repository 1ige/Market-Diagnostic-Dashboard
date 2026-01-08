import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Topbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/indicators", label: "Indicators" },
    { path: "/market-map", label: "Market Map" },
    { path: "/sector-projections", label: "Sector Projections" },
    { path: "/stock-projections", label: "Stock Projections" },
    { path: "/precious-metals", label: "Precious Metals" },
    { path: "/alternative-assets", label: "Alternative Assets" },
    { path: "/news", label: "News" },
    { path: "/system-breakdown", label: "System Breakdown" },
  ];

  return (
    <div className="sticky top-0 z-50 w-full bg-stealth-800 border-b border-stealth-700 shadow-lg">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <span className="text-base md:text-lg font-bold text-stealth-100 truncate mr-2">Market Stability Diagnostic</span>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-1">
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-stealth-300 hover:text-stealth-100 hover:bg-stealth-700 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <nav className="lg:hidden bg-stealth-850 border-t border-stealth-700">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 text-sm font-medium transition-colors border-b border-stealth-700 last:border-b-0 ${
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
      )}
    </div>
  );
}
