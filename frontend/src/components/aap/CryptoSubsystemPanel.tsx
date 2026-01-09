interface AAPComponent {
  name: string;
  category: string;
  value: number;
  weight: number;
  contribution: number;
  status: 'active' | 'missing';
  description: string;
}

interface CryptoSubsystemPanelProps {
  components: AAPComponent[];
  contribution: number;
}

export function CryptoSubsystemPanel({ components, contribution }: CryptoSubsystemPanelProps) {
  const activeCount = components.filter(c => c.status === 'active').length;
  const totalCount = components.length;

  return (
    <div className="bg-gradient-to-br from-blue-950/20 to-stealth-850 border border-blue-900/30 rounded-lg p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-blue-400">Crypto Subsystem</h3>
          <div className="text-xs text-stealth-400 mt-0.5">
            Digital assets as alternative stores of value & fiat alternatives
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">{contribution.toFixed(1)}%</div>
          <div className="text-xs text-stealth-400">{activeCount}/{totalCount} active</div>
        </div>
      </div>

      <div className="space-y-3">
        {components.map((component, idx) => (
          <div key={idx} className="bg-stealth-900/50 border border-stealth-700 rounded-lg p-4 hover:border-blue-900/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-stealth-100">{component.name}</span>
                  {component.status === 'active' ? (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-medium">Active</span>
                  ) : (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-medium">Missing</span>
                  )}
                </div>
                <div className="text-xs text-stealth-400 leading-relaxed">{component.description}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-stealth-700/50">
              <div>
                <div className="text-xs text-stealth-500">Weight</div>
                <div className="text-sm font-semibold text-stealth-200">{(component.weight * 100).toFixed(1)}%</div>
              </div>
              {component.status === 'active' && (
                <>
                  <div>
                    <div className="text-xs text-stealth-500">Value</div>
                    <div className="text-sm font-semibold text-stealth-200">{component.value.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-stealth-500">Contribution</div>
                    <div className="text-sm font-semibold text-blue-400">{component.contribution.toFixed(2)}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 p-3 bg-stealth-900/30 border border-blue-900/20 rounded">
        <div className="text-xs text-stealth-400 mb-2">Subsystem Health</div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-stealth-300">
            {activeCount} of {totalCount} components operational
          </span>
          <span className={`text-sm font-semibold ${
            activeCount / totalCount >= 0.7 ? 'text-emerald-400' : 'text-yellow-400'
          }`}>
            {((activeCount / totalCount) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
