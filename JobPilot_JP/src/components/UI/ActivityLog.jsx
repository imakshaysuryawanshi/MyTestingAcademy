import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { formatLogTimestamp } from '../../utils/formatters';
import { COLUMNS } from '../../utils/constants';

export default function ActivityLog({ log = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!log || log.length === 0) return null;

  return (
    <div className="mt-6 border-t border-slate-100 dark:border-white/5 pt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-jp-purple" />
          <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
            Activity Log
          </h3>
          <span className="text-[10px] bg-jp-purple/10 text-jp-purple px-1.5 py-0.5 rounded-full font-bold">
            {log.length}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-jp-purple transition-colors" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-jp-purple transition-colors" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 ml-2 border-l-2 border-slate-100 dark:border-white/5 pl-4">
          {log.slice().reverse().map((entry, idx) => {
            const column = COLUMNS.find(c => c.id === entry.status);
            return (
              <div key={idx} className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-white dark:bg-[#0f0f1a] border-2 border-jp-purple" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Status changed to <span className="text-jp-purple">{column?.label || entry.status}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {formatLogTimestamp(entry.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
