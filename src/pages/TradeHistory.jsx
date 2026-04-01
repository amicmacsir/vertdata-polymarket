import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Filter } from 'lucide-react';
import PnlBadge from '../components/PnlBadge';

const allHistory = [
  { date: "Apr 1, 2026",  market: "Will ETH hold $3k through March?",          side: "YES", entry: 0.61, exit: 0.89, size: 200, pnl: +91.80,  result: "WIN" },
  { date: "Mar 28, 2026", market: "Will DOGE reach $0.25 by April?",            side: "NO",  entry: 0.72, exit: 0.44, size: 150, pnl: +58.33,  result: "WIN" },
  { date: "Mar 25, 2026", market: "Will Fed pause rate hikes in March?",        side: "YES", entry: 0.55, exit: 0.40, size: 100, pnl: -27.27,  result: "LOSS" },
  { date: "Mar 22, 2026", market: "Will BTC hit $95k by end of March?",         side: "YES", entry: 0.48, exit: 0.71, size: 175, pnl: +83.85,  result: "WIN" },
  { date: "Mar 20, 2026", market: "Will Ethereum reach $4k in Q1 2026?",        side: "YES", entry: 0.35, exit: 0.22, size: 120, pnl: -44.57,  result: "LOSS" },
  { date: "Mar 18, 2026", market: "Will Trump mention Bitcoin this week?",       side: "YES", entry: 0.77, exit: 0.91, size: 200, pnl: +36.36,  result: "WIN" },
  { date: "Mar 15, 2026", market: "Will SEC approve spot ETH ETF options?",     side: "NO",  entry: 0.62, exit: 0.38, size: 140, pnl: +54.19,  result: "WIN" },
  { date: "Mar 12, 2026", market: "Will Polymarket launch on Base?",            side: "YES", entry: 0.44, exit: 0.31, size: 80,  pnl: -23.64,  result: "LOSS" },
  { date: "Mar 8, 2026",  market: "Will BTC dominance exceed 55% in March?",   side: "YES", entry: 0.66, exit: 0.84, size: 250, pnl: +68.18,  result: "WIN" },
  { date: "Mar 5, 2026",  market: "Will inflation drop below 3% in Feb data?",  side: "NO",  entry: 0.58, exit: 0.82, size: 110, pnl: +45.52,  result: "WIN" },
];

const filters = ['All', 'Wins', 'Losses', 'Last 7d', 'Last 30d'];

// Date helper — simplified for mock data
function isWithinDays(dateStr, days) {
  // For mock data, use index-based approximation
  const monthDayMap = { "Apr 1": 0, "Mar 28": 4, "Mar 25": 7, "Mar 22": 10 };
  const firstWord = dateStr.split(',')[0];
  const dayDiff = monthDayMap[firstWord] ?? 30;
  return dayDiff <= days;
}

export default function TradeHistory() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = allHistory.filter(h => {
    if (activeFilter === 'Wins') return h.result === 'WIN';
    if (activeFilter === 'Losses') return h.result === 'LOSS';
    if (activeFilter === 'Last 7d') return isWithinDays(h.date, 7);
    if (activeFilter === 'Last 30d') return isWithinDays(h.date, 30);
    return true;
  });

  const wins = allHistory.filter(h => h.result === 'WIN').length;
  const winRate = ((wins / allHistory.length) * 100).toFixed(1);
  const totalPnl = allHistory.reduce((s, h) => s + h.pnl, 0);
  const avgReturn = (allHistory.reduce((s, h) => s + ((h.pnl / h.size) * 100), 0) / allHistory.length).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-slate-200 font-semibold">Trade History</h2>
        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === f
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-5 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Market</th>
                <th className="text-center px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Side</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Entry</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Exit</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Size</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">P&L</th>
                <th className="text-center px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Result</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-600 text-sm">No trades match this filter.</td>
                </tr>
              ) : filtered.map((h, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-elevated/50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-mono text-slate-500 whitespace-nowrap">{h.date}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-300 max-w-[220px]">
                    <span className="block truncate">{h.market}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${h.side === 'YES' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                      {h.side}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-400">{h.entry.toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-400">{h.exit.toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-300">${h.size}</td>
                  <td className="px-4 py-3.5 text-right">
                    <PnlBadge value={h.pnl} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                      h.result === 'WIN'
                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                        : 'bg-red-400/10 text-red-400 border border-red-400/20'
                    }`}>
                      {h.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stats bar */}
        <div className="px-5 py-3 bg-elevated/40 border-t border-border/30">
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
            <span><span className="text-slate-300">{allHistory.length}</span> trades</span>
            <span className="w-px h-3 bg-border" />
            <span><span className="text-emerald-400">{winRate}%</span> win rate</span>
            <span className="w-px h-3 bg-border" />
            <span><span className={totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}</span> total P&L</span>
            <span className="w-px h-3 bg-border" />
            <span><span className="text-accent">+{avgReturn}%</span> avg return</span>
          </div>
        </div>
      </div>
    </div>
  );
}
