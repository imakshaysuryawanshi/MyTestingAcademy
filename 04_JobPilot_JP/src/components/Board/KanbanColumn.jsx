import React, { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import JobCard from './JobCard';
import { useJobStore } from '../../hooks/useJobStore';
import { Plus, SortAsc, SortDesc, Zap, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { todayISO } from '../../utils/formatters';

export default function KanbanColumn({ column }) {
  const { jobsByStatus, addJob, openModal } = useJobStore();
  const [isAdding, setIsAdding] = useState(false);
  const [quickForm, setQuickForm] = useState({ company: '', role: '' });
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem(`jp-sort-${column.id}`) || 'newest');

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      status: column.id,
    }
  });

  const columnJobs = useMemo(() => {
    // Note: In useJobStore we should expose a way to get jobs by status or filter them here
    // Let's assume useJobStore provides 'filteredJobs' and we filter here for status
    return []; // This will be handled in KanbanBoard to pass only relevant jobs
  }, []);

  // For this implementation, the KanbanBoard will pass jobs as props
  // But let's follow the PRD which mentions useJobStore access
  const { filteredJobs } = useJobStore();
  
  const jobsInThisColumn = useMemo(() => {
    let list = filteredJobs.filter(j => j.status === column.id);
    
    if (sortOrder === 'newest') list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortOrder === 'oldest') list.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortOrder === 'urgent') list.sort((a,b) => (b.priority === 'urgent') - (a.priority === 'urgent'));
    
    return list;
  }, [filteredJobs, column.id, sortOrder]);

  const handleQuickAdd = async (e) => {
    if (e.key === 'Enter' && quickForm.company && quickForm.role) {
      const newJob = {
        id: nanoid(),
        companyName: quickForm.company,
        role: quickForm.role,
        status: column.id,
        location: 'Remote',
        skills: [],
        appliedDate: todayISO(),
        priority: 'normal',
        interviewRound: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addJob(newJob);
      setQuickForm({ company: '', role: '' });
      setIsAdding(false);
    }
    if (e.key === 'Escape') setIsAdding(false);
  };

  const toggleSort = () => {
    const orders = ['newest', 'oldest', 'urgent'];
    const nextOrder = orders[(orders.indexOf(sortOrder) + 1) % orders.length];
    setSortOrder(nextOrder);
    localStorage.setItem(`jp-sort-${column.id}`, nextOrder);
  };

  return (
    <div 
      className={`flex-shrink-0 w-80 flex flex-col h-full rounded-2xl transition-all duration-300 ${
        isOver ? 'bg-slate-100/50 dark:bg-white/5 ring-2 ring-dashed ring-jp-cyan/40 scale-[1.01]' : 'bg-transparent'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-${column.tw}`} />
          <h2 className="font-display font-bold text-sm text-slate-700 dark:text-slate-200 italic">
            {column.label}
          </h2>
          <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400">
            {jobsInThisColumn.length}
          </span>
        </div>
        <button 
          onClick={toggleSort}
          className="p-1.5 text-slate-400 hover:text-jp-cyan transition-colors"
          title={`Sort: ${sortOrder}`}
        >
          {sortOrder === 'newest' && <SortDesc className="w-3.5 h-3.5" />}
          {sortOrder === 'oldest' && <SortAsc className="w-3.5 h-3.5" />}
          {sortOrder === 'urgent' && <Zap className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Cards Area */}
      <div 
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-2 space-y-3 pb-20 no-scrollbar"
      >
        <SortableContext items={jobsInThisColumn.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobsInThisColumn.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </SortableContext>
        
        {jobsInThisColumn.length === 0 && !isAdding && (
          <div className="h-32 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-4">
            <p className="text-[10px] text-slate-400 italic">
              {column.id === 'wishlist' 
                ? "No applications yet. Add your first one!" 
                : "Zero cards in this column."}
            </p>
          </div>
        )}

        {/* Quick Add Form */}
        {isAdding ? (
          <div className="bg-white dark:bg-[#1a1a26] p-3 rounded-xl border border-jp-cyan/30 shadow-xl animate-in zoom-in-95 duration-200">
            <input
              autoFocus
              value={quickForm.company}
              onChange={(e) => setQuickForm({...quickForm, company: e.target.value})}
              onKeyDown={handleQuickAdd}
              placeholder="Company..."
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none px-2 py-1.5 text-xs rounded mb-2 outline-none italic font-bold"
            />
            <input
              value={quickForm.role}
              onChange={(e) => setQuickForm({...quickForm, role: e.target.value})}
              onKeyDown={handleQuickAdd}
              placeholder="Role..."
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none px-2 py-1.5 text-xs rounded outline-none italic"
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-[9px] text-slate-400 italic">Enter to Save • Esc to Cancel</span>
              <button onClick={() => setIsAdding(false)}><X className="w-3 h-3 text-slate-400 hover:text-rose-500" /></button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-100 dark:border-white/2 hover:border-jp-cyan/30 hover:bg-jp-cyan/5 rounded-xl text-slate-400 hover:text-jp-cyan transition-all group"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest italic">Add Card</span>
          </button>
        )}
      </div>
    </div>
  );
}
