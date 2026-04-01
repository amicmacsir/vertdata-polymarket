import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-elevated border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-black/50">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
            <AlertTriangle size={20} className={danger ? 'text-red-400' : 'text-amber-400'} />
          </div>
          <div>
            <h3 className="text-slate-100 font-semibold text-base mb-1">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              danger
                ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50'
                : 'bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/50'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
