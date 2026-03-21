import React from 'react';
import { useJobStore } from '../../hooks/useJobStore';
import { Building2 } from 'lucide-react';

export default function CompanyList() {
  const { companies, setSearchQuery } = useJobStore();

  if (companies.length === 0) return null;

  return (
    <div className="space-y-4 px-4 py-6">
      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Companies</h4>
      <div className="space-y-1">
        {companies.map((co) => (
          <button
            key={co.name}
            onClick={() => setSearchQuery(co.name)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-jp-cyan transition-colors" />
              <span className="truncate max-w-[120px]">{co.name}</span>
            </div>
            <span className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md text-[10px] font-bold">{co.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
