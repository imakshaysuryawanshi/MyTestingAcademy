import React from 'react';
import { useJobStore } from '../../hooks/useJobStore';

export default function StatsBlock() {
  const { stats } = useJobStore();

  const items = [
    { label: 'Applied', value: stats.applied, color: 'text-blue-500' },
    { label: 'Interviews', value: stats.interviews, color: 'text-purple-500' },
    { label: 'Offers', value: stats.offers, color: 'text-emerald-500' },
    { label: 'Rejection Rate', value: `${stats.rejectionRate}%`, color: 'text-rose-500' },
  ];

  return (
    <div className="space-y-4 px-4 py-2">
      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Overview</h4>
      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => (
          <div key={item.label} className="bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 p-3 rounded-xl flex items-center justify-between group hover:border-slate-200 dark:hover:border-white/10 transition-all">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
            <span className={`text-sm font-bold font-display ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
