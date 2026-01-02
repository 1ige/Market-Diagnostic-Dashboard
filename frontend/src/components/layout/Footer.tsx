export default function Footer() {
  return (
    <footer className="bg-stealth-900 border-t border-stealth-700 py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-stealth-400">
        <div className="text-center md:text-left">
          © 2026 Steven J Meyer LLC. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <a 
            href="https://www.steven-meyer.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-stealth-200 transition-colors"
          >
            Portfolio
          </a>
          <a 
            href="https://www.linkedin.com/in/steven-meyer/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-stealth-200 transition-colors flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>
          <a 
            href="https://www.paypal.com/donate/?hosted_button_id=UMTL4BWY2HAEA" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 01-.794.679H7.72a.483.483 0 01-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z"/>
              <path d="M2.379 0C1.84 0 1.385.426 1.311.957L.042 11.367a.711.711 0 00.702.814h4.155l1.044-6.616L6.5 1.728C6.578 1.195 7.033.77 7.573.77h8.34c1.053 0 1.99.178 2.77.548.102.048.201.1.297.155a5.427 5.427 0 011.913 1.998c.168.346.296.716.382 1.106l.033.16c-.49-2.654-2.703-3.966-5.975-3.966H7.573c-.54 0-.995.426-1.073.958L5.25 11.816H2.379z"/>
            </svg>
            Donate
          </a>
        </div>
      </div>
    </footer>
  );
}
