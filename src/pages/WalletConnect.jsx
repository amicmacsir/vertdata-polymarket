import React from 'react';
import { Wallet, Shield } from 'lucide-react';

export default function WalletConnect({ onConnect }) {
  const handleConnect = () => {
    onConnect('0x742d...3a8F');
  };

  return (
    <div className="min-h-screen bg-base grid-bg-animated flex items-center justify-center p-4 relative overflow-hidden">
      {/* Radial glow behind card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <span className="font-mono text-3xl font-semibold tracking-tight text-slate-200">
              VERT<span className="text-accent font-bold">DATA</span>
            </span>
          </div>
          <div className="w-12 h-0.5 bg-accent/40 mx-auto mb-6" />
          <h1 className="text-xl font-semibold text-slate-100 mb-2">
            AI-Powered Prediction Market Intelligence
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            Automated signal generation and trade execution for Polymarket
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl shadow-black/40">
          {/* Stats preview */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Win Rate', value: '68.4%' },
              { label: 'Avg Return', value: '+12.4%' },
              { label: 'Signals/Day', value: '7.2' },
            ].map((stat) => (
              <div key={stat.label} className="bg-base/60 rounded-xl p-3 text-center border border-border/50">
                <div className="text-accent font-mono font-semibold text-base">{stat.value}</div>
                <div className="text-slate-600 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Connect button */}
          <button
            onClick={handleConnect}
            className="w-full py-4 bg-accent hover:bg-accent/90 text-slate-900 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.01] active:scale-[0.99] text-sm"
          >
            <Wallet size={18} />
            Connect Polygon Wallet
          </button>

          {/* Wallet icons */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
              {/* MetaMask fox icon (simplified SVG) */}
              <svg width="18" height="18" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
                <path d="M32.9 1L19.4 10.7l2.5-5.9L32.9 1z" fill="#E17726"/>
                <path d="M2.1 1l13.4 9.8-2.4-5.9L2.1 1z" fill="#E27625"/>
                <path d="M28.2 23.5l-3.6 5.5 7.7 2.1 2.2-7.5-6.3-.1z" fill="#E27625"/>
                <path d="M1.5 23.6l2.2 7.5 7.7-2.1-3.6-5.5-6.3.1z" fill="#E27625"/>
                <path d="M11 14.5l-2.1 3.2 7.5.3-.3-8-5.1 4.5z" fill="#E27625"/>
                <path d="M24 14.5l-5.2-4.6-.2 8.1 7.5-.3-2.1-3.2z" fill="#E27625"/>
                <path d="M11.4 29l4.5-2.2-3.9-3-.6 5.2z" fill="#E27625"/>
                <path d="M19.1 26.8l4.5 2.2-.6-5.2-3.9 3z" fill="#E27625"/>
              </svg>
              <span>MetaMask</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
              {/* WalletConnect icon */}
              <svg width="18" height="18" viewBox="0 0 300 185" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
                <path d="M61.4 36.3C112.4-11.7 196.5-11.7 247.6 36.3l6.3 6.1c2.6 2.5 2.6 6.6 0 9.1l-21.5 20.9c-1.3 1.3-3.4 1.3-4.7 0l-8.7-8.4c-35.5-34.4-93.1-34.4-128.6 0l-9.3 9c-1.3 1.3-3.4 1.3-4.7 0L54.9 51.7c-2.6-2.5-2.6-6.6 0-9.1l6.5-6.3zm231.8 43.2l19.1 18.5c2.6 2.5 2.6 6.6 0 9.1L226.6 183c-2.6 2.5-6.8 2.5-9.4 0l-60.5-58.6c-.6-.6-1.7-.6-2.3 0L94 183c-2.6 2.5-6.8 2.5-9.4 0L.8 107.1c-2.6-2.5-2.6-6.6 0-9.1l19.1-18.5c2.6-2.5 6.8-2.5 9.4 0l60.5 58.6c.6.6 1.7.6 2.3 0l60.5-58.6c2.6-2.5 6.8-2.5 9.4 0l60.5 58.6c.6.6 1.7.6 2.3 0l60.5-58.6c2.6-2.6 6.9-2.6 9.5-.1z" fill="#3b99fc"/>
              </svg>
              <span>WalletConnect</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 flex items-start gap-2 p-3 bg-base/50 rounded-lg border border-border/50">
            <Shield size={12} className="text-slate-600 mt-0.5 flex-shrink-0" />
            <p className="text-slate-600 text-xs leading-relaxed">
              Available to non-US residents only. By connecting you confirm you are not a US person.
            </p>
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">
          © 2026 VertData · Powered by Polymarket
        </p>
      </div>
    </div>
  );
}
