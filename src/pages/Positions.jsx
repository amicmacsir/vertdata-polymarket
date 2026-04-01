import React, { useState } from 'react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import PnlBadge from '../components/PnlBadge';
import ConfirmModal from '../components/ConfirmModal';

const positions = [
  { market: "Will ETH ETF see $1B inflows in April?", side: "YES", entry: 0.42, current: 0.58, size: 245.00, expires: "Apr 30, 2026" },
  { market: "Will Fed cut rates in May 2026?", side: "NO", entry: 0.71, current: 0.65, size: 180.00, expires: "May 1, 2026" },
  { market: "Will BTC dominance exceed 60% in April?", side: "YES", entry: 0.38, current: 0.44, size: 320.00, expires: "Apr 30, 2026" },
  { market: "Will Polymarket volume exceed $500M in April?", side: "YES", entry: 0.55, current: 0.61, size: 150.00, expires: "Apr 30, 2026" },
  { market: "Will Trump tweet about crypto this week?", side: "YES", entry: 0.82, current: 0.79, size: 95.00, expires: "Apr 7, 2026" },
];

export default function Positions() {
  const [rows, setRows] = useState(positions);
  const [cancelTarget, setCancelTarget] = useState(null);

  const calcPnl = (p) => ((p.current - p.entry) / p.entry) * p.size;

  const handleCancel = () => {
    setRows(r => r.filter((_, i) => i !== cancelTarget));
    setCancelTarget(null);
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
          <TrendingUp size={24} className="text-slate-600" />
        </div>
        <h3 className="text-slate-300 font-semibold mb-1">No open positions</h3>
        <p className="text-slate-600 text-sm">Your agent will open positions when it finds high-edge signals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-200 font-semibold">Open Positions</h2>
        <span className="text-xs font-mono text-slate-500">{rows.length} active</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-5 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Market</th>
                <th className="text-center px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Side</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Entry</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Current</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Size</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">P&L</th>
                <th className="text-center px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Expires</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((pos, i) => {
                const pnl = calcPnl(pos);
                const isUp = pos.current >= pos.entry;
                return (
                  <tr key={i} className="border-b border-border/30 hover:bg-elevated/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-slate-300 max-w-[260px]">
                      <span className="block truncate">{pos.market}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${pos.side === 'YES' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {pos.side}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-400">{pos.entry.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm">
                      <span className={`flex items-center justify-end gap-1 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {pos.current.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-300">${pos.size.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <PnlBadge value={pnl} />
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-slate-500 font-mono whitespace-nowrap">{pos.expires}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setCancelTarget(i)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all font-medium"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        <div className="px-5 py-3 bg-elevated/40 border-t border-border/30 flex items-center justify-between">
          <span className="text-xs text-slate-500">Total Exposure</span>
          <span className="font-mono text-sm text-slate-300">
            ${rows.reduce((s, p) => s + p.size, 0).toFixed(2)} USDC
          </span>
        </div>
      </div>

      <ConfirmModal
        isOpen={cancelTarget !== null}
        title="Cancel Order"
        message={cancelTarget !== null ? `Cancel position in "${rows[cancelTarget]?.market}"? This action cannot be undone.` : ''}
        confirmLabel="Cancel Order"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        danger={true}
      />
    </div>
  );
}
