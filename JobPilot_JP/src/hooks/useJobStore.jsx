import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useIndexedDB } from './useIndexedDB';
import { useTheme } from './useTheme';

const JobStoreContext = createContext();

export function JobStoreProvider({ children }) {
  const db = useIndexedDB();
  const theme = useTheme();

  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState([]);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [view, setView] = useState('kanban');

  const [modalState, setModalState] = useState({
    open: false,
    job: null,
    defaultStatus: 'wishlist'
  });

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const refreshData = useCallback(async () => {
    const allJobs = await db.getAllJobs();
    const allResumes = await db.getResumes();
    setJobs(allJobs);
    setResumes(allResumes.map(r => r.name));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    const init = async () => {
      await db.seedIfEmpty();
      await refreshData();
    };
    init();
  }, [db, refreshData]);

  const addJob = async (job) => {
    await db.addJob(job);
    await refreshData();
    showToast('Job added!');
  };

  const updateJob = async (job) => {
    await db.updateJob(job);
    await refreshData();
    showToast('Job updated!');
  };

  const duplicateJob = async (job) => {
    const newJob = await db.duplicateJob(job);
    await refreshData();
    showToast('Card duplicated! Edit details to continue.');
    openModal(newJob);
  };

  const deleteJob = async (id) => {
    await db.deleteJob(id);
    await refreshData();
    showToast('Job deleted!');
  };

  const addResume = async (name) => {
    if (!resumes.includes(name)) {
      await db.addResume(name);
      await refreshData();
    }
  };

  const openModal = (job = null, defaultStatus = 'wishlist') => {
    setModalState({ open: true, job, defaultStatus });
  };

  const closeModal = () => {
    setModalState({ ...modalState, open: false });
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = 
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(job.status);
      const matchesUrgent = !urgentOnly || job.priority === 'urgent';
      
      return matchesSearch && matchesStatus && matchesUrgent;
    });
  }, [jobs, searchQuery, filterStatus, urgentOnly]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const applied = jobs.filter(j => j.status !== 'wishlist' && j.status !== 'rejected').length;
    const interviews = jobs.filter(j => j.status === 'interview').length;
    const offers = jobs.filter(j => j.status === 'offer').length;
    const rejected = jobs.filter(j => j.status === 'rejected').length;
    const rejectionRate = total > 0 ? Math.round((rejected / (applied + rejected)) * 100) : 0;
    
    return { total, applied, interviews, offers, rejectionRate };
  }, [jobs]);

  const companies = useMemo(() => {
    const counts = {};
    jobs.forEach(j => {
      counts[j.companyName] = (counts[j.companyName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [jobs]);

  const value = {
    jobs,
    filteredJobs,
    resumes,
    loading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    urgentOnly,
    setUrgentOnly,
    view,
    setView,
    openModal,
    closeModal,
    modalState,
    addJob,
    updateJob,
    duplicateJob,
    deleteJob,
    addResume,
    stats,
    companies,
    toast,
    showToast,
    ...theme,
  };

  return <JobStoreContext.Provider value={value}>{children}</JobStoreContext.Provider>;
}

export const useJobStore = () => useContext(JobStoreContext);
