import React, { useState } from 'react';
import StatsBlock from './StatsBlock';
import CompanyList from './CompanyList';
import ResumeVault from './ResumeVault';
import { ChevronLeft, ChevronRight, Plane } from 'lucide-react';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white dark:bg-[#0f0f17]">
      {/* Actual Sidebar Content */}
      <aside 
        className={`flex flex-col border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f0f17] transition-all duration-300 ease-in-out ${
          collapsed ? 'w-0 overflow-hidden border-none' : 'w-[240px]'
        }`}
      >
        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-2">
          {/* Logo Section */}
          <div className="px-6 mb-8">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight italic">
                Job<span className="jp-logo-gradient">Pilot</span>
              </h1>
            </div>
          </div>

          <StatsBlock />
          <CompanyList />
          <ResumeVault />
        </div>

        {/* Persistence Tag */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage</span>
            <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              IndexedDB Local
            </span>
          </div>
        </div>
      </aside>

      {/* Persistent Toggle Bar (part of flow) */}
      <div className="w-2 flex items-center justify-center relative z-30 bg-slate-50/30 dark:bg-white/1 border-r border-slate-200 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
           onClick={() => setCollapsed(!collapsed)}>
        <button 
          className="absolute -left-3 w-6 h-6 bg-white dark:bg-[#1e1e2e] border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all"
        >
          <ChevronLeft className={`w-3.5 h-3.5 text-slate-400 group-hover:text-jp-cyan transition-all ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}
