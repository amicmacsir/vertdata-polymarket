import React from 'react';
import { BarChart2, Circle, LogOut } from 'lucide-react';
import Overview from './Overview';
import Positions from './Positions';
import TradeHistory from './TradeHistory';
import Settings from './Settings';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'positions', label: 'Positions' },
  { id: 'history', label: 'Trade History' },
  { id: 'settings', label: 'Settings' },
];

export default function Dashboard({ walletAddress, activeTab, setActiveTab, onDisconnect }) {
  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <span className="font-mono text-lg font-semibold tracking-tight text-slate-200">
            VERT<span className="text-accent font-bold">DATA</span>
          </span>

          {/* Wallet + Disconnect */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              <span className="font-mono text-sm text-slate-400">{walletAddress}</span>
            </div>
            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-400/5 border border-transparent hover:border-red-400/20"
            >
              <LogOut size={12} />
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-accent'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'positions' && <Positions />}
        {activeTab === 'history' && <TradeHistory />}
        {activeTab === 'settings' && <Settings onDisconnect={onDisconnect} />}
      </main>
    </div>
  );
}
