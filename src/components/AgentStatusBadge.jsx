import React from 'react';

export default function AgentStatusBadge({ active = true }) {
  return (
    <div className="flex items-center gap-2">
      {/* Pulse ring + dot */}
      <div className="relative flex items-center justify-center w-5 h-5">
        <span
          className={`absolute inline-flex rounded-full w-5 h-5 opacity-75 ${active ? 'bg-emerald-400' : 'bg-slate-500'} pulse-ring`}
        />
        <span
          className={`relative inline-flex rounded-full w-2.5 h-2.5 ${active ? 'bg-emerald-400' : 'bg-slate-500'}`}
        />
      </div>
      <span
        className={`text-xs font-mono font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md ${
          active
            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
            : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
        }`}
      >
        {active ? 'ACTIVE' : 'PAUSED'}
      </span>
    </div>
  );
}
