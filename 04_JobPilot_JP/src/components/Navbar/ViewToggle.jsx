import React from 'react';
import { useJobStore } from '../../hooks/useJobStore';
import { LayoutDashboard, Table as TableIcon } from 'lucide-react';

export default function ViewToggle() {
  const { view, setView } = useJobStore();

  return (
    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl shadow-inner dark:shadow-none">
      <button
        onClick={() => setView('kanban')}
        className={`p-1.5 rounded-lg transition-all flex items-center gap-2 ${
          view === 'kanban' 
            ? 'bg-white dark:bg-[#1e1e2e] text-jp-cyan shadow-sm border border-slate-200 dark:border-white/10' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
        }`}
        title="Kanban View"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest px-1">Kanban</span>
      </button>
      <button
        onClick={() => setView('table')}
        className={`p-1.5 rounded-lg transition-all flex items-center gap-2 ${
          view === 'table' 
            ? 'bg-white dark:bg-[#1e1e2e] text-jp-cyan shadow-sm border border-slate-200 dark:border-white/10' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
        }`}
        title="Table View"
      >
        <TableIcon className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest px-1">Table</span>
      </button>
    </div>
  );
}
