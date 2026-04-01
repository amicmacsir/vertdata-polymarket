import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, subtitle, trend, trendValue, icon: Icon, children }) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 transition-colors duration-200">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon size={14} className="text-accent" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-semibold text-slate-100 font-mono">{value}</div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-sm font-mono ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-slate-400'}`}>
            {isPositive && <TrendingUp size={12} />}
            {isNegative && <TrendingDown size={12} />}
            <span>{trendValue}</span>
          </div>
        )}
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}
