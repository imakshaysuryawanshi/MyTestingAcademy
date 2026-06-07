import React, { useState, useMemo } from 'react';
import { useJobStore } from '../../hooks/useJobStore';
import { COLUMNS } from '../../utils/constants';
import { Pencil, Trash2, ExternalLink, ChevronUp, ChevronDown, Copy } from 'lucide-react';

export default function TableView() {
  const { filteredJobs, updateJob, deleteJob, openModal, duplicateJob } = useJobStore();
  const [sortKey, setSortKey] = useState('appliedDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const sortedJobs = useMemo(() => {
    const list = [...filteredJobs];
    list.sort((a, b) => {
      const valA = a[sortKey] || '';
      const valB = b[sortKey] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredJobs, sortKey, sortOrder]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleStatusChange = async (job, newStatus) => {
    await updateJob({ ...job, status: newStatus });
  };


  if (filteredJobs.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 italic bg-white dark:bg-[#12121a] rounded-3xl border border-dashed border-slate-200 dark:border-white/5 shadow-inner dark:shadow-none">
         No jobs match your current search or filters.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#12121a] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/2 border-b border-slate-200 dark:border-white/5">
              {['companyName', 'role', 'status', 'appliedDate', 'salaryRange', 'resumeUsed'].map((key) => (
                <th 
                  key={key} 
                  onClick={() => toggleSort(key)}
                  className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer hover:text-jp-cyan transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {key.replace(/([A-Z])/g, ' $1').replace('company Name', 'Company').replace('applied Date', 'Date')}
                    {sortKey === key ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    ) : null}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/2">
            {sortedJobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-white/1 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 italic">{job.companyName}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">{job.role}</td>
                <td className="px-6 py-4">
                  <select
                    value={job.status}
                    onChange={(e) => handleStatusChange(job, e.target.value)}
                    className="bg-transparent border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-jp-cyan outline-none"
                  >
                    {COLUMNS.map(col => (
                      <option key={col.id} value={col.id}>{col.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 italic">
                  {new Date(job.appliedDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-emerald-500 italic">{job.salaryRange || '—'}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded italic">
                    {job.resumeUsed || 'Default'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => duplicateJob(job)}
                      className="p-1.5 text-slate-400 hover:text-jp-purple"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openModal(job)}
                      className="p-1.5 text-slate-400 hover:text-jp-cyan"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => window.confirm(`Delete ${job.companyName}?`) && deleteJob(job.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
