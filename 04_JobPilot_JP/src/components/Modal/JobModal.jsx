import React, { useState, useEffect } from 'react';
import { useJobStore } from '../../hooks/useJobStore';
import { COLUMNS, PRIORITY } from '../../utils/constants';
import { todayISO } from '../../utils/formatters';
import { nanoid } from 'nanoid';
import { X, Save, Calendar, Target, Globe, Linkedin, Wallet } from 'lucide-react';
import TagInput from '../UI/TagInput';
import PriorityControl from '../UI/PriorityControl';
import ActivityLog from '../UI/ActivityLog';
import InterviewChecklist from '../UI/InterviewChecklist';

export default function JobModal() {
  const { modalState, closeModal, addJob, updateJob, resumes, addResume } = useJobStore();
  const { open, job, defaultStatus } = modalState;

  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    location: 'Remote',
    linkedinUrl: '',
    resumeUsed: '',
    skills: [],
    appliedDate: todayISO(),
    followUpDate: '',
    salaryRange: '',
    priority: 'normal',
    interviewRound: 0,
    notes: '',
    status: 'wishlist',
    activityLog: [],
    interviewChecklist: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (job) {
      setFormData({ 
        activityLog: [], 
        interviewChecklist: [], 
        ...job 
      });
    } else {
      setFormData({
        companyName: '',
        role: '',
        location: 'Remote',
        linkedinUrl: '',
        resumeUsed: '',
        skills: [],
        appliedDate: todayISO(),
        followUpDate: '',
        salaryRange: '',
        priority: 'normal',
        interviewRound: 0,
        notes: '',
        status: defaultStatus || 'wishlist',
        activityLog: [],
        interviewChecklist: [],
      });
    }
  }, [job, defaultStatus, open]);

  if (!open) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.role.trim()) newErrors.role = 'Job title is required';
    if (formData.linkedinUrl && !formData.linkedinUrl.startsWith('http')) newErrors.linkedinUrl = 'Invalid URL format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalJob = {
      ...formData,
      id: job ? job.id : (formData.id || nanoid()),
    };

    if (job) {
      await updateJob(finalJob);
    } else {
      await addJob(finalJob);
    }

    if (formData.resumeUsed && !resumes.includes(formData.resumeUsed)) {
      await addResume(formData.resumeUsed);
    }

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={closeModal}
      ></div>

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f0f17] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-slate-200 dark:border-white/10">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100 italic tracking-tight">
                {job ? 'Edit Job' : 'Add New Card'}
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Job Management Portal</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
          <form id="job-form" onSubmit={handleSave} className="space-y-8">
            
            {/* Section: Core Info */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Company Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Globe className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      autoFocus
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      placeholder="e.g. Google, Infosys"
                      className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.companyName ? 'border-rose-500' : 'border-slate-200 dark:border-white/5'} rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-jp-cyan outline-none transition-all italic`}
                    />
                  </div>
                  {errors.companyName && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{errors.companyName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Job Role *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Target className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      placeholder="e.g. Senior SDET"
                      className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.role ? 'border-rose-500' : 'border-slate-200 dark:border-white/5'} rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-jp-cyan outline-none transition-all italic`}
                    />
                  </div>
                  {errors.role && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{errors.role}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Location</label>
                  <input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-4 text-sm text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-jp-cyan outline-none transition-all italic"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Salary Range</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Wallet className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      value={formData.salaryRange}
                      onChange={(e) => setFormData({...formData, salaryRange: e.target.value})}
                      placeholder="₹25-30 LPA"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-emerald-500 font-bold focus:ring-1 focus:ring-jp-cyan outline-none transition-all italic"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-white/5"></div>

            {/* Section: Links & Docs */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">LinkedIn Job URL</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Linkedin className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                      placeholder="https://linkedin.com/jobs/view/..."
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-600 dark:text-slate-400 focus:ring-1 focus:ring-jp-cyan outline-none transition-all"
                    />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Resume Used</label>
                <input
                  list="vaultResumes"
                  value={formData.resumeUsed}
                  onChange={(e) => setFormData({...formData, resumeUsed: e.target.value})}
                  placeholder="Type new or pick from vault"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-4 text-sm text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-jp-cyan outline-none transition-all"
                />
                <datalist id="vaultResumes">
                  {resumes.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-white/5"></div>

            {/* Section: Pipeline */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Skills / Tags</label>
                <TagInput 
                  tags={formData.skills} 
                  onChange={(tags) => setFormData({...formData, skills: tags})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Applied Date
                  </label>
                  <input
                    type="date"
                    value={formData.appliedDate}
                    onChange={(e) => setFormData({...formData, appliedDate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-4 text-sm text-slate-700 dark:text-slate-300 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-amber-500" /> Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-4 text-sm text-slate-700 dark:text-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Priority</label>
                <PriorityControl 
                  value={formData.priority}
                  onChange={(val) => setFormData({...formData, priority: val})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Board Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-4 text-sm text-slate-700 dark:text-slate-300 font-bold italic outline-none"
                  >
                    {COLUMNS.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                  </select>
                </div>
                {formData.status === 'interview' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Interview Round</label>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, interviewRound: Math.max(0, formData.interviewRound - 1)})}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-xl text-slate-400"
                      >-</button>
                      <span className="flex-1 text-center font-bold text-jp-purple">R{formData.interviewRound}</span>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, interviewRound: formData.interviewRound + 1})}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-xl text-slate-400"
                      >+</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 italic">Professional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Mention recruiter names, referral source, or tech stack details..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-4 text-sm text-slate-600 dark:text-slate-400 outline-none italic resize-none"
                ></textarea>
              </div>
            </div>
          </form>

          {/* Addendum v1.1 Sections */}
          {formData.status === 'interview' && (
            <InterviewChecklist 
              checklist={formData.interviewChecklist} 
              onChange={(newList) => setFormData({ ...formData, interviewChecklist: newList })}
            />
          )}

          {job && <ActivityLog log={formData.activityLog} />}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 tracking-widest uppercase transition-colors"
          >
            Cancel
          </button>
          <button
            form="job-form"
            type="submit"
            className="bg-jp-cyan hover:bg-jp-cyan/90 text-slate-900 font-display font-bold px-8 py-2.5 rounded-xl text-sm italic shadow-lg shadow-jp-cyan/20 transition-all active:scale-95 flex items-center gap-2"
          >
             <Save className="w-4 h-4" />
             Save Job
          </button>
        </div>

      </div>
    </div>
  );
}
