import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, TrendingUp, Zap, BarChart2, Clock, Target, Search } from 'lucide-react';
import StatCard from '../components/StatCard';
import AgentStatusBadge from '../components/AgentStatusBadge';
import ToggleSwitch from '../components/ToggleSwitch';

const sparklineData = [
  { v: 9200 },
  { v: 9800 },
  { v: 9400 },
  { v: 10200 },
  { v: 11100 },
  { v: 10800 },
  { v: 12847 },
];

const signals = [
  { market: "Will BTC exceed $100k by April 30?", edge: 72, side: "YES", price: 0.34, status: "EXECUTED" },
  { market: "Will Trump sign executive order on crypto?", edge: 65, side: "YES", price: 0.58, status: "EXECUTED" },
  { market: "Will ETH ETF see $1B inflows in April?", edge: 58, side: "YES", price: 0.42, status: "PENDING" },
  { market: "Will Fed cut rates before June 2026?", edge: 44, side: "NO", price: 0.71, status: "SKIPPED" },
  { market: "Will Polymarket volume hit $1B this month?", edge: 51, side: "YES", price: 0.29, status: "PENDING" },
];

const statusConfig = {
  EXECUTED: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/20' },
  SKIPPED: { bg: 'bg-slate-700/50', text: 'text-slate-400', border: 'border-slate-600/30' },
  PENDING: { bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/20' },
};

function Countdown() {
  const [secs, setSecs] = useState(23 * 60 + 41);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s > 0 ? s - 1 : 1799), 1000);
    return () => clearInterval(t);
  }, []);
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return <span className="font-mono text-2xl font-semibold text-accent">00:{m}:{s}</span>;
}

export default function Overview() {
  const [agentActive, setAgentActive] = useState(true);

  return (
    <div className="space-y-6">
      {/* Row 1 — Large cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Portfolio Value */}
        <div className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Portfolio Value</span>
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <BarChart2 size={14} className="text-accent" />
            </div>
          </div>
          <div className="font-mono text-2xl font-semibold text-slate-100">$12,847.50</div>
          <div className="flex items-center gap-1 text-sm font-mono text-emerald-400 mt-1">
            <TrendingUp size={12} />
            +$234.20 (1.86%) today
          </div>
          <div className="text-xs text-slate-500 mt-0.5">USDC Balance</div>
        </div>

        {/* Agent Status */}
        <div className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Agent Status</span>
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Activity size={14} className="text-accent" />
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <AgentStatusBadge active={agentActive} />
            <ToggleSwitch enabled={agentActive} onChange={setAgentActive} />
          </div>
          <div className="text-xs text-slate-500">
            {agentActive ? 'Running since 6h 23m' : 'Agent is paused'}
          </div>
        </div>

        {/* All-Time P&L */}
        <div className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">All-Time P&L</span>
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-accent" />
            </div>
          </div>
          <div className="font-mono text-2xl font-semibold text-emerald-400">+$3,241.80</div>
          <div className="text-xs text-emerald-400/70 mt-0.5 font-mono">+33.7% total return</div>
          {/* Sparkline */}
          <div className="h-12 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} fill="url(#sparkGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 — Smaller cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 hover:border-accent/40 transition-colors">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Last Analysis</div>
          <div className="font-mono text-lg font-semibold text-slate-100">2 min ago</div>
          <div className="text-xs text-accent mt-0.5">7 signals found</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 hover:border-accent/40 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Markets Scanned</span>
            <Search size={12} className="text-slate-600 mt-0.5" />
          </div>
          <div className="font-mono text-2xl font-semibold text-slate-100">142</div>
          <div className="text-xs text-slate-500 mt-0.5">Today</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 hover:border-accent/40 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Win Rate (30d)</span>
            <Target size={12} className="text-slate-600 mt-0.5" />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-2xl font-semibold text-slate-100">68.4%</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <div className="text-xs text-slate-500 mt-0.5">↑ from 64.1% last month</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 hover:border-accent/40 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Next Run</span>
            <Clock size={12} className="text-slate-600 mt-0.5" />
          </div>
          <Countdown />
          <div className="text-xs text-slate-500 mt-0.5">Automatic analysis</div>
        </div>
      </div>

      {/* Row 3 — Recent Signals */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-accent" />
            <span className="text-sm font-semibold text-slate-200">Recent Signals</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Last analysis: 2 min ago</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-5 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Market</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Edge</th>
                <th className="text-center px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Side</th>
                <th className="text-right px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Price</th>
                <th className="text-center px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((sig, i) => {
                const s = statusConfig[sig.status];
                return (
                  <tr key={i} className="border-b border-border/30 hover:bg-elevated/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-slate-300 max-w-xs truncate">{sig.market}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-mono text-sm font-medium ${sig.edge >= 60 ? 'text-accent' : sig.edge >= 50 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {sig.edge}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${sig.side === 'YES' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {sig.side}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-300">{sig.price.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                        {sig.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
