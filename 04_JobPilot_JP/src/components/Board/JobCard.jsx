import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useJobStore } from '../../hooks/useJobStore';
import { daysAgo, isStale, isOverdue } from '../../utils/formatters';
import { Pencil, Trash2, ExternalLink, AlertCircle, AlertTriangle, Copy, CheckCircle2 } from 'lucide-react';

export default function JobCard({ job }) {
  const { openModal, deleteJob, duplicateJob } = useJobStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: job.id,
    data: {
      type: 'Job',
      job,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusColors = {
    wishlist: 'border-slate-400',
    applied: 'border-blue-500',
    screening: 'border-yellow-400',
    interview: 'border-purple-500',
    offer: 'border-emerald-500',
    rejected: 'border-rose-500',
  };

  const stale = (job.status === 'applied' || job.status === 'screening') && isStale(job.appliedDate);
  const overdue = isOverdue(job.followUpDate);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${job.companyName}?`)) {
      deleteJob(job.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative bg-white dark:bg-[#1a1a26] p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md dark:shadow-none hover:-translate-y-1 transition-all duration-200 cursor-grab active:cursor-grabbing ${statusColors[job.status] || 'border-slate-200'}`}
    >
      {/* Top Row: Company & Badges */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-[120px]">
            {job.companyName}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
            {job.location}
          </span>
        </div>
        
        <div className="flex gap-1.5 items-center">
          {job.priority === 'urgent' && (
            <span className="bg-rose-500 w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" title="Urgent"></span>
          )}
          {job.interviewRound > 0 && (
            <span className="bg-purple-500/10 text-purple-500 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
              R{job.interviewRound}
            </span>
          )}
          {overdue && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Follow-up overdue!" />
          )}
           {stale && (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" title="No update in 14 days — time to follow up?" />
          )}
        </div>
      </div>

      {/* Role */}
      <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight mb-2">
        {job.role}
      </h3>

      {/* Checklist Progress */}
      {job.status === 'interview' && job.interviewChecklist?.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 italic">
          <CheckCircle2 className="w-3 h-3 text-jp-cyan" />
          <span>
            {job.interviewChecklist.filter(i => i.checked).length}/{job.interviewChecklist.length} prep done
          </span>
        </div>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.skills.slice(0, 3).map(skill => (
          <span key={skill} className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded text-[9px] font-medium border border-transparent dark:border-white/5">
            {skill}
          </span>
        ))}
        {job.skills.length > 3 && (
          <span className="text-slate-400 text-[9px] font-medium">+{job.skills.length - 3}</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 italic">
          <span>{daysAgo(job.appliedDate)}</span>
          {job.linkedinUrl && (
            <a 
              href={job.linkedinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-300 hover:text-jp-cyan transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        
        {job.salaryRange && (
          <span className="text-[10px] font-bold text-emerald-500 italic">
            {job.salaryRange}
          </span>
        )}
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-[#1a1a26]/80 backdrop-blur-sm rounded-lg p-1">
        <button 
          onClick={(e) => { e.stopPropagation(); duplicateJob(job); }}
          className="p-1 text-slate-400 hover:text-jp-purple transition-all active:scale-90"
          title="Duplicate Card"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); openModal(job); }}
          className="p-1 text-slate-400 hover:text-jp-cyan transition-all active:scale-90"
          title="Edit Job"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={handleDelete}
          className="p-1 text-slate-400 hover:text-rose-500 transition-all active:scale-90"
          title="Delete Job"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
