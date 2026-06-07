import React from 'react';
import { ExternalLink, AlertTriangle, AlertCircle } from 'lucide-react';
import { daysAgo, isStale, isOverdue } from '../../utils/formatters';

export default function DragOverlayCard({ job }) {
  if (!job) return null;

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

  return (
    <div
      className={`relative bg-white dark:bg-[#1a1a26] p-4 rounded-xl border-l-4 shadow-2xl opacity-80 cursor-grabbing rotate-2 scale-105 transition-transform ${statusColors[job.status] || 'border-slate-200'}`}
    >
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
            <span className="bg-rose-500 w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
          )}
          {job.interviewRound > 0 && (
            <span className="bg-purple-500/10 text-purple-500 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
              R{job.interviewRound}
            </span>
          )}
          {overdue && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          {stale && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
        </div>
      </div>

      <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight mb-3">
        {job.role}
      </h3>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.skills.slice(0, 3).map(skill => (
          <span key={skill} className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded text-[9px] font-medium border border-transparent dark:border-white/5">
            {skill}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 italic">
          <span>{daysAgo(job.appliedDate)}</span>
          {job.linkedinUrl && <ExternalLink className="w-3 h-3" />}
        </div>
        
        {job.salaryRange && (
          <span className="text-[10px] font-bold text-emerald-500 italic">
            {job.salaryRange}
          </span>
        )}
      </div>
    </div>
  );
}
