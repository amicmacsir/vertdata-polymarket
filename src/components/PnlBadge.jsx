import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PnlBadge({ value, size = 'sm' }) {
  const isPositive = value >= 0;
  const formatted = Math.abs(value).toFixed(2);
  const prefix = isPositive ? '+' : '-';

  const sizeClass = size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-medium ${sizeClass} ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {prefix}${formatted}
    </span>
  );
}
