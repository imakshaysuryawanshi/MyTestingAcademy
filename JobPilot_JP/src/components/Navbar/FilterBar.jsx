import React, { useState } from 'react';
import { useJobStore } from '../../hooks/useJobStore';
import { COLUMNS } from '../../utils/constants';
import { Filter, ChevronDown, Check, X } from 'lucide-react';

export default function FilterBar() {
  const { urgentOnly, setUrgentOnly, filterStatus, setFilterStatus } = useJobStore();
  const [isOpen, setIsOpen] = useState(false);

  const toggleStatus = (id) => {
    if (filterStatus.includes(id)) {
      setFilterStatus(filterStatus.filter(s => s !== id));
    } else {
      setFilterStatus([...filterStatus, id]);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Urgent Only Toggle */}
      <button
        onClick={() => setUrgentOnly(!urgentOnly)}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 italic tracking-tight ${
          urgentOnly 
            ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30' 
            : 'bg-white dark:bg-white/2 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400'
        }`}
      >
        <span className={urgentOnly ? 'animate-pulse' : ''}>🔴</span>
        Urgent
      </button>

      {/* Multi-Status Filter */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1.5 border border-slate-200 dark:border-white/5 bg-white dark:bg-white/2 rounded-full text-xs font-bold flex items-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-white/5 italic tracking-tight ${
            filterStatus.length > 0 ? 'text-jp-cyan' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Status
          {filterStatus.length > 0 && (
            <span className="bg-jp-cyan/10 text-jp-cyan px-1.5 py-0.5 rounded-full text-[10px]">
              {filterStatus.length}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {COLUMNS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => toggleStatus(col.id)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    filterStatus.includes(col.id) 
                      ? 'bg-jp-cyan border-jp-cyan' 
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {filterStatus.includes(col.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors italic">
                    {col.label}
                  </span>
                </button>
              ))}
              {filterStatus.length > 0 && (
                <div className="border-t border-slate-100 dark:border-white/5 mt-1 pt-1">
                  <button 
                    onClick={() => setFilterStatus([])}
                    className="w-full px-4 py-2 text-[10px] font-bold text-rose-500 hover:text-rose-600 text-left uppercase tracking-widest"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
