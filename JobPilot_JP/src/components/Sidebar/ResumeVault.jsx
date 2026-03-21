import React from 'react';
import { useJobStore } from '../../hooks/useJobStore';
import { FileText, Plus, Copy, Check } from 'lucide-react';

export default function ResumeVault() {
  const { resumes, showToast } = useJobStore();
  const [copied, setCopied] = React.useState(null);

  const copyToClipboard = (name) => {
    navigator.clipboard.writeText(name);
    setCopied(name);
    showToast(`Copied ${name} to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4 px-4 py-2">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resume Vault</h4>
      </div>
      <div className="space-y-1">
        {resumes.map((name) => (
          <button
            key={name}
            onClick={() => copyToClipboard(name)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-white/5"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
              <span className="truncate max-w-[140px]">{name}</span>
            </div>
            {copied === name ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-all" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
