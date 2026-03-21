import React from 'react';
import { useJobStore } from '../../hooks/useJobStore';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useJobStore();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-jp-cyan" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white dark:bg-[#1e1e2e] border border-slate-200 dark:border-white/10 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
      {icons[toast.type]}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-100 italic">
        {toast.message}
      </span>
    </div>
  );
}
