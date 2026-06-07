import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function InterviewChecklist({ checklist = [], onChange }) {
  const [newItem, setNewItem] = useState('');

  const toggleItem = (id) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    onChange(updated);
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const updated = [...checklist, { id: nanoid(), label: newItem.trim(), checked: false }];
    onChange(updated);
    setNewItem('');
  };

  const removeItem = (id) => {
    const updated = checklist.filter(item => item.id !== id);
    onChange(updated);
  };

  const completedCount = checklist.filter(i => i.checked).length;
  const progress = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <div className="mt-6 border-t border-slate-100 dark:border-white/5 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-jp-cyan" />
          <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
            Interview Preparation
          </h3>
        </div>
        <span className="text-[10px] font-bold text-jp-cyan bg-jp-cyan/10 px-2 py-0.5 rounded-full">
          {progress}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-jp-cyan transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-2 mb-4">
        {checklist.map((item) => (
          <li 
            key={item.id} 
            className="flex items-center justify-between group py-1"
          >
            <button 
              type="button"
              onClick={() => toggleItem(item.id)}
              className="flex items-center gap-3 text-left transition-colors"
            >
              {item.checked ? (
                <CheckSquare className="w-4 h-4 text-jp-cyan" />
              ) : (
                <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              )}
              <span className={`text-xs font-medium ${item.checked ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                {item.label}
              </span>
            </button>
            <button 
              type="button"
              onClick={() => removeItem(item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={addItem} className="flex gap-2">
        <input 
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add custom prep item..."
          className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-jp-cyan outline-none text-slate-700 dark:text-slate-200"
        />
        <button 
          type="submit"
          className="p-1.5 bg-jp-cyan text-white rounded-lg hover:bg-jp-cyan/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
