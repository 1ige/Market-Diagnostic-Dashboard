import { useState } from "react";

export function MethodologyPanel() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const Section = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => {
    const isExpanded = expandedSections.has(id);
    return (
      <div className="border-b border-stealth-700 last:border-b-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex justify-between items-center py-3 px-4 hover:bg-stealth-700/50 transition-colors text-left"
        >
          <span className="font-semibold text-stealth-200">{title}</span>
          <span className="text-stealth-400 text-xl">{isExpanded ? '−' : '+'}</span>
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 text-sm text-stealth-300 space-y-3">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-stealth-800 to-stealth-850 border border-stealth-700 rounded-lg">
      <div className="p-4 md:p-6 border-b border-stealth-700">
        <h2 className="text-lg md:text-xl font-semibold text-stealth-100 mb-2">Methodology & Interpretation</h2>
        <p className="text-xs text-stealth-400">
          Detailed explanations of AAP construction, scoring, and regime classification
        </p>
      </div>

      <div className="divide-y divide-stealth-700">
        <Section id="overview" title="What AAP Measures">
          <div className="space-y-3">
            <p>
              The Alternative Asset Pressure (AAP) index is a composite indicator that tracks "flight to alternatives" 
              as a proxy for confidence in traditional financial assets and fiat currencies. It combines 18 components 
              across two major subsystems:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-stealth-900/50 border border-amber-900/30 rounded p-3">
                <h4 className="text-amber-400 font-semibold mb-2">Metals Subsystem (9 components)</h4>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span><strong>Monetary Hedge:</strong> Gold as flight-to-safety & fiat alternative</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span><strong>Hybrid Signals:</strong> Silver as industrial/monetary crossover</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span><strong>Physical Stress:</strong> COMEX inventory & paper-physical divergence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span><strong>CB Accumulation:</strong> Central bank gold buying patterns</span>
                  </li>
                </ul>
              </div>

              <div className="bg-stealth-900/50 border border-blue-900/30 rounded p-3">
                <h4 className="text-blue-400 font-semibold mb-2">Crypto Subsystem (9 components)</h4>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span><strong>Digital Gold:</strong> Bitcoin as decentralized store of value</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span><strong>Network Security:</strong> Hash rate & mining difficulty</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span><strong>Capital Flight:</strong> Stablecoin supply as fiat exit proxy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span><strong>DeFi Adoption:</strong> Total value locked in protocols</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-900/30 rounded">
              <p className="text-xs">
                <strong className="text-emerald-400">Key Insight:</strong> AAP measures <em>systemic monetary stress</em> by 
                tracking capital flows into assets that exist outside the traditional financial system. High pressure (low scores) 
                indicates confidence erosion; low pressure (high scores) suggests confidence in traditional assets.
              </p>
            </div>
          </div>
        </Section>

        <Section id="scoring" title="Scoring Framework">
          <div className="space-y-3">
            <p>
              AAP uses an inverted scoring system where <strong>lower scores = higher pressure</strong> and 
              <strong> higher scores = lower pressure</strong>. The index ranges from 0 to 100:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
              <div className="bg-green-950/20 border border-green-900/30 rounded p-3">
                <div className="text-green-400 font-bold text-lg mb-1">67-100</div>
                <div className="text-xs text-green-300 font-semibold mb-2">LOW PRESSURE</div>
                <p className="text-xs text-stealth-300">
                  Normal market conditions. Capital prefers traditional assets. Alternative assets underperforming 
                  or moving in line with risk-on sentiment.
                </p>
              </div>

              <div className="bg-yellow-950/20 border border-yellow-900/30 rounded p-3">
                <div className="text-yellow-400 font-bold text-lg mb-1">34-66</div>
                <div className="text-xs text-yellow-300 font-semibold mb-2">MODERATE PRESSURE</div>
                <p className="text-xs text-stealth-300">
                  Rising concerns. Selective flows into alternatives. Mixed signals between metals and crypto. 
                  Transitional regime.
                </p>
              </div>

              <div className="bg-red-950/20 border border-red-900/30 rounded p-3">
                <div className="text-red-400 font-bold text-lg mb-1">0-33</div>
                <div className="text-xs text-red-300 font-semibold mb-2">HIGH PRESSURE</div>
                <p className="text-xs text-stealth-300">
                  Severe stress. Significant capital flight to alternatives. Both subsystems showing elevated signals. 
                  Loss of confidence in fiat/traditional system.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-stealth-900/50 border border-stealth-700 rounded">
              <h4 className="text-stealth-200 font-semibold mb-2 text-sm">Calculation Method</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">1.</span>
                  <span>Each component is normalized to 0-100 scale where higher values indicate more pressure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">2.</span>
                  <span>Components are weighted based on historical predictive power and signal clarity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">3.</span>
                  <span>Weighted components are aggregated within each subsystem (metals, crypto)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">4.</span>
                  <span>Final score = 100 - (weighted average of all active components)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">5.</span>
                  <span><strong>Minimum Threshold:</strong> Requires 13/18 components (72%) operational for valid calculation</span>
                </li>
              </ul>
            </div>
          </div>
        </Section>

        <Section id="regimes" title="Regime Classification">
          <div className="space-y-3">
            <p>
              AAP identifies distinct market regimes based on the primary driver and pressure magnitude:
            </p>

            <div className="space-y-3 mt-4">
              <div className="bg-green-950/20 border-l-4 border-green-500 p-3">
                <div className="font-semibold text-green-400 mb-1">NORMAL CONFIDENCE (Score 75-100)</div>
                <p className="text-xs text-stealth-300">
                  Traditional assets preferred. Alternatives moving with risk-on/risk-off dynamics. 
                  No structural monetary concerns. Expect underperformance from gold and defensive crypto.
                </p>
              </div>

              <div className="bg-yellow-950/20 border-l-4 border-yellow-500 p-3">
                <div className="font-semibold text-yellow-400 mb-1">MILD CAUTION (Score 50-74)</div>
                <p className="text-xs text-stealth-300">
                  Selective flows beginning. One subsystem showing pressure, other stable. 
                  Watch for confirmation from both metals and crypto before major positioning.
                </p>
              </div>

              <div className="bg-orange-950/20 border-l-4 border-orange-500 p-3">
                <div className="font-semibold text-orange-400 mb-1">MONETARY STRESS (Score 25-49)</div>
                <p className="text-xs text-stealth-300">
                  Both subsystems elevated. CB gold buying accelerating, crypto network security rising, 
                  stablecoin supply expanding. Fiat concerns becoming structural.
                </p>
              </div>

              <div className="bg-red-950/20 border-l-4 border-red-500 p-3">
                <div className="font-semibold text-red-400 mb-1">LIQUIDITY CRISIS (Score 10-24)</div>
                <p className="text-xs text-stealth-300">
                  Severe pressure across all components. Physical gold premiums, COMEX stress, 
                  explosive crypto adoption. Major confidence breakdown in progress.
                </p>
              </div>

              <div className="bg-red-950/30 border-l-4 border-red-600 p-3">
                <div className="font-semibold text-red-300 mb-1">SYSTEMIC BREAKDOWN (Score 0-9)</div>
                <p className="text-xs text-stealth-300">
                  Extreme readings. Historical precedent rare. Both subsystems at maximum pressure. 
                  Potential currency crisis, payment system stress, or major monetary regime change.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="interpretation" title="How to Use AAP">
          <div className="space-y-3">
            <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded">
              <h4 className="text-blue-400 font-semibold mb-2">AAP is a Strategic Filter, Not a Timing Tool</h4>
              <p className="text-xs text-stealth-300">
                AAP changes slowly and identifies <em>regimes</em>, not tactical entry/exit points. 
                Use it to adjust portfolio allocation and risk positioning over weeks/months, not days.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h4 className="text-emerald-400 font-semibold mb-2 text-sm">When AAP is Low (High Pressure)</h4>
                <ul className="space-y-1.5 text-xs text-stealth-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Increase allocation to gold, silver, Bitcoin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Reduce exposure to duration risk (long bonds)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Consider physical precious metals over paper ETFs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Monitor for policy responses (rate cuts, QE)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Expect alternatives to outperform equities</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-red-400 font-semibold mb-2 text-sm">When AAP is High (Low Pressure)</h4>
                <ul className="space-y-1.5 text-xs text-stealth-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Reduce alternative asset allocation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Favor equities, especially growth/tech</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Traditional assets likely to outperform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Gold/crypto may act as risk-on assets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✗</span>
                    <span>Monitor for turning points (increasing pressure)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-950/20 border border-amber-900/30 rounded">
              <h4 className="text-amber-400 font-semibold mb-2 text-sm">Important Caveats</h4>
              <ul className="space-y-1.5 text-xs text-stealth-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">⚠</span>
                  <span><strong>Not Predictive of Crashes:</strong> Low AAP doesn't predict imminent stock market crashes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">⚠</span>
                  <span><strong>Slow-Moving:</strong> Can remain at extremes for months; not for day trading</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">⚠</span>
                  <span><strong>Data Dependent:</strong> Requires 72% component availability for valid readings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">⚠</span>
                  <span><strong>Regime Tool:</strong> Best combined with other indicators for tactical timing</span>
                </li>
              </ul>
            </div>
          </div>
        </Section>

        <Section id="components" title="Component Details">
          <div className="space-y-4">
            <div>
              <h4 className="text-amber-400 font-semibold mb-3">Metals Subsystem Components (9)</h4>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="text-amber-400 font-mono">1.</span>
                  <div>
                    <strong className="text-stealth-200">Gold vs DXY Ratio:</strong>
                    <span className="text-stealth-400"> Normalized gold price relative to dollar strength. High readings = monetary hedge bid.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-mono">2.</span>
                  <div>
                    <strong className="text-stealth-200">Gold vs Real Rates:</strong>
                    <span className="text-stealth-400"> Gold performance vs TIPS yields. Negative correlation = monetary stress.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-mono">3.</span>
                  <div>
                    <strong className="text-stealth-200">Silver Outperformance:</strong>
                    <span className="text-stealth-400"> Silver vs gold ratio. High readings = risk-on; low = monetary hedge dominance.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-mono">4.</span>
                  <div>
                    <strong className="text-stealth-200">PGM Weakness:</strong>
                    <span className="text-stealth-400"> Platinum/palladium underperformance vs gold = recession/industrial weakness.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-mono">5.</span>
                  <div>
                    <strong className="text-stealth-200">CB Gold Accumulation:</strong>
                    <span className="text-stealth-400"> Net central bank purchases. Sustained buying = structural monetary concerns.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-mono">6.</span>
                  <div>
                    <strong className="text-stealth-200">COMEX Registered Inventory:</strong>
                    <span className="text-stealth-400"> Deliverable gold at COMEX. Declining = physical delivery stress.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-mono">7.</span>
                  <div>
                    <strong className="text-stealth-200">Open Interest to Registered:</strong>
                    <span className="text-stealth-400"> Paper gold vs available physical. High ratios = potential squeeze risk.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-mono">8.</span>
                  <div>
                    <strong className="text-stealth-200">Gold ETF Flows:</strong>
                    <span className="text-stealth-400"> Net flows into gold ETFs. Positive = institutional flight to safety.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-mono">9.</span>
                  <div>
                    <strong className="text-stealth-200">Mining Stock Divergence:</strong>
                    <span className="text-stealth-400"> Gold miners vs gold. Underperformance = monetary stress (gold as asset, not business).</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stealth-700">
              <h4 className="text-blue-400 font-semibold mb-3">Crypto Subsystem Components (9)</h4>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="text-blue-400 font-mono">1.</span>
                  <div>
                    <strong className="text-stealth-200">Bitcoin Dominance:</strong>
                    <span className="text-stealth-400"> BTC market cap vs total crypto. Rising = flight to digital gold.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 font-mono">2.</span>
                  <div>
                    <strong className="text-stealth-200">BTC Hash Rate:</strong>
                    <span className="text-stealth-400"> Network security proxy. Rising = growing infrastructure commitment.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 font-mono">3.</span>
                  <div>
                    <strong className="text-stealth-200">BTC Difficulty:</strong>
                    <span className="text-stealth-400"> Mining competition. High = strong economic incentive to secure network.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 font-mono">4.</span>
                  <div>
                    <strong className="text-stealth-200">Stablecoin Supply:</strong>
                    <span className="text-stealth-400"> Total USDT + USDC market cap. Rising = fiat exiting to crypto ecosystem.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 font-mono">5.</span>
                  <div>
                    <strong className="text-stealth-200">Stablecoin vs BTC Ratio:</strong>
                    <span className="text-stealth-400"> Stable/BTC ratio. High = dry powder waiting; low = already deployed.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 font-mono">6.</span>
                  <div>
                    <strong className="text-stealth-200">DeFi TVL:</strong>
                    <span className="text-stealth-400"> Total value locked in DeFi protocols. Growth = adoption of permissionless finance.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 font-mono">7.</span>
                  <div>
                    <strong className="text-stealth-200">Exchange Outflows:</strong>
                    <span className="text-stealth-400"> BTC leaving exchanges. Net outflow = self-custody preference (distrust).</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 font-mono">8.</span>
                  <div>
                    <strong className="text-stealth-200">BTC vs Equity Correlation:</strong>
                    <span className="text-stealth-400"> BTC-SPY correlation. Negative = functioning as alternative; positive = risk-on.</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400 font-mono">9.</span>
                  <div>
                    <strong className="text-stealth-200">Altcoin Weakness:</strong>
                    <span className="text-stealth-400"> Altcoin underperformance vs BTC. Weak alts = risk-off crypto environment.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="limitations" title="Limitations & Considerations">
          <div className="space-y-3">
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded">
              <h4 className="text-red-400 font-semibold mb-2">Known Limitations</h4>
              <ul className="space-y-1.5 text-xs text-stealth-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong>Lagging Indicator:</strong> AAP confirms regime changes; it doesn't predict them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong>Data Availability:</strong> Some components (CB purchases, COMEX data) update infrequently</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong>Crypto Volatility:</strong> Crypto components can produce false signals during speculation cycles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong>No Timing:</strong> Can remain at extremes for extended periods (months)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong>Historical Bias:</strong> Limited data history for crypto components (back-tests unreliable)</span>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-stealth-900/50 border border-stealth-700 rounded">
              <h4 className="text-stealth-200 font-semibold mb-2">Best Practices</h4>
              <ul className="space-y-1.5 text-xs text-stealth-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Use AAP as a <em>regime filter</em> for portfolio allocation, not trade timing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Combine with technical analysis on individual assets for entry/exit timing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Monitor component-level breakdown to understand <em>which</em> subsystem is driving</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Look for divergences between metals and crypto (mixed signals = transition)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Rebalance quarterly or when AAP crosses major regime thresholds (25, 50, 75)</span>
                </li>
              </ul>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
