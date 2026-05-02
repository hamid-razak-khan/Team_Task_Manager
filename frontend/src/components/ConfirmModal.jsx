import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Usage:
 * <ConfirmModal
 *   open={bool}
 *   title="Delete Task"
 *   message="This action cannot be undone."
 *   confirmLabel="Delete"
 *   onConfirm={fn}
 *   onCancel={fn}
 * />
 */
const ConfirmModal = ({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-[80] px-4">
      <div className="glass-card w-full max-w-sm border border-white/10 p-6 animate-slide-up rounded-2xl shadow-2xl">

        {/* Icon */}
        <div className="flex items-center justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium
                       hover:from-red-500 hover:to-red-400 transition-all duration-300
                       shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]
                       active:scale-95 flex items-center justify-center gap-2 border border-red-400/20"
          >
            <Trash2 className="w-4 h-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
