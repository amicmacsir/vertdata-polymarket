import React, { useState } from 'react';
import { Lock, Shield, Bell, Sliders, AlertTriangle, Check } from 'lucide-react';
import ToggleSwitch from '../components/ToggleSwitch';
import ConfirmModal from '../components/ConfirmModal';

const riskLevels = [
  { id: 'conservative', label: 'Conservative', pct: '2%', desc: 'Low risk, steady gains' },
  { id: 'balanced', label: 'Balanced', pct: '5%', desc: 'Recommended' },
  { id: 'aggressive', label: 'Aggressive', pct: '10%', desc: 'Higher risk, higher reward' },
];

export default function Settings({ onDisconnect }) {
  const [riskLevel, setRiskLevel] = useState('balanced');
  const [maxPositions, setMaxPositions] = useState('3');
  const [maxTrade, setMaxTrade] = useState('500');
  const [agentActive, setAgentActive] = useState(true);
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState({
    executed: true,
    closed: true,
    error: true,
  });
  const [saved, setSaved] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleNotif = (key) => {
    setNotifications(n => ({ ...n, [key]: !n[key] }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-slate-200 font-semibold">Settings</h2>

      {/* Risk Management */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sliders size={15} className="text-accent" />
          <h3 className="text-sm font-semibold text-slate-200">Risk Management</h3>
        </div>

        {/* Risk Level Cards */}
        <div className="mb-5">
          <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-3">Risk Level</label>
          <div className="grid grid-cols-3 gap-3">
            {riskLevels.map(r => (
              <button
                key={r.id}
                onClick={() => setRiskLevel(r.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  riskLevel === r.id
                    ? 'border-accent bg-accent/5 shadow-sm shadow-accent/10'
                    : 'border-border hover:border-slate-600'
                }`}
              >
                <div className={`font-mono text-lg font-semibold mb-1 ${riskLevel === r.id ? 'text-accent' : 'text-slate-300'}`}>
                  {r.pct}
                </div>
                <div className="text-xs font-medium text-slate-300">{r.label}</div>
                <div className="text-xs text-slate-600 mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Max Concurrent Positions */}
        <div className="mb-4">
          <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-2">Max Concurrent Positions</label>
          <select
            value={maxPositions}
            onChange={e => setMaxPositions(e.target.value)}
            className="bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-accent/50 w-32"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
        </div>

        {/* Max Single Trade */}
        <div>
          <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-2">Max Single Trade Size</label>
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">$</span>
            <input
              type="number"
              value={maxTrade}
              onChange={e => setMaxTrade(e.target.value)}
              className="bg-elevated border border-border rounded-xl pl-7 pr-4 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-accent/50 w-full"
            />
          </div>
        </div>
      </div>

      {/* Agent Control */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={15} className="text-accent" />
          <h3 className="text-sm font-semibold text-slate-200">Agent Control</h3>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-slate-200 font-medium">Agent Active</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {agentActive ? 'Agent is running and trading' : 'Agent is paused — no trades will execute'}
            </div>
          </div>
          <ToggleSwitch enabled={agentActive} onChange={setAgentActive} />
        </div>

        <div className="flex items-center justify-between py-3 border-t border-border/30">
          <div>
            <div className="text-sm text-slate-400">Analysis Frequency</div>
            <div className="text-xs text-slate-500 mt-0.5">Every 30 minutes</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-elevated px-3 py-1.5 rounded-lg border border-border">
            <Lock size={10} />
            <span className="font-mono">Locked</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={15} className="text-accent" />
          <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
        </div>

        <div className="mb-4">
          <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent/50 w-full"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-3">Notify on</label>
          <div className="space-y-2.5">
            {[
              { key: 'executed', label: 'Trade Executed' },
              { key: 'closed', label: 'Trade Closed' },
              { key: 'error', label: 'Agent Error' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => toggleNotif(key)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    notifications[key]
                      ? 'bg-accent border-accent'
                      : 'border-border group-hover:border-slate-500'
                  }`}
                >
                  {notifications[key] && <Check size={10} className="text-slate-900" strokeWidth={3} />}
                </div>
                <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
          saved
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-accent hover:bg-accent/90 text-slate-900 shadow-lg shadow-accent/20 hover:shadow-accent/30'
        }`}
      >
        {saved ? '✓ Settings Saved' : 'Save Settings'}
      </button>

      {/* Danger Zone */}
      <div className="bg-card border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} className="text-red-400" />
          <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Disconnecting your wallet will stop all active agent monitoring and close your session.
        </p>
        <button
          onClick={() => setShowDisconnect(true)}
          className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all text-sm font-medium"
        >
          Disconnect Wallet
        </button>
      </div>

      <ConfirmModal
        isOpen={showDisconnect}
        title="Disconnect Wallet"
        message="Are you sure? This will stop all active agent monitoring and end your session."
        confirmLabel="Yes, Disconnect"
        onConfirm={onDisconnect}
        onCancel={() => setShowDisconnect(false)}
        danger={true}
      />
    </div>
  );
}
