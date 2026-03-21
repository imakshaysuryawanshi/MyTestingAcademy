import React from 'react';
import { SHORTCUTS } from '../../utils/constants';
import { X } from 'lucide-react';

export default function ShortcutsHelp({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f0f17] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 italic flex items-center gap-2">
            Keyboard Shortcuts
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">{s.action}</span>
              <kbd className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-1 rounded font-mono text-xs text-slate-700 dark:text-slate-200 min-w-8 text-center shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="p-4 bg-slate-50/50 dark:bg-white/2 text-[10px] text-center text-slate-400 uppercase tracking-widest font-semibold">
          User Manual v1.0
        </div>
      </div>
    </div>
  );
}
