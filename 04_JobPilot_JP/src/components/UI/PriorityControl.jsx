import React from 'react';

export default function PriorityControl({ value, onChange }) {
  const options = [
    { label: 'Low', value: 'low', color: 'slate' },
    { label: 'Normal', value: 'normal', color: 'blue' },
    { label: 'Urgent', value: 'urgent', color: 'rose' },
  ];

  const colors = {
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-white/5',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-white/5',
    activeSlate: 'bg-slate-500 text-white border-slate-500',
    activeBlue: 'bg-blue-500 text-white border-blue-500',
    activeRose: 'bg-rose-500 text-white border-rose-500',
  };

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
            value === opt.value
              ? colors[`active${opt.color.charAt(0).toUpperCase() + opt.color.slice(1)}`]
              : colors[opt.color]
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
