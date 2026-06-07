import { getDB } from '../utils/db';
import { SEED_JOBS, SEED_RESUMES } from '../utils/seedData';
import { DEFAULT_CHECKLIST } from '../utils/constants';
import { nanoid } from 'nanoid';
import { todayISO } from '../utils/formatters';

export function useIndexedDB() {
  const getAllJobs = async () => {
    const db = await getDB();
    const jobs = await db.getAllFromIndex('jobs', 'by-date');
    // Migration: ensure new fields exist
    return jobs.reverse().map(j => ({
      activityLog: [],
      interviewChecklist: [],
      ...j
    }));
  };

  const addJob = async (job) => {
    const db = await getDB();
    const newJob = {
      ...job,
      activityLog: job.activityLog || [{ status: job.status, timestamp: new Date().toISOString() }],
      interviewChecklist: job.interviewChecklist || [],
      createdAt: job.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.add('jobs', newJob);
    return newJob;
  };

  const updateJob = async (job) => {
    const db = await getDB();
    const existing = await db.get('jobs', job.id);
    
    let updatedJob = { ...job, updatedAt: new Date().toISOString() };

    // Feature 2: Detect status change for activity log
    if (existing && updatedJob.status !== existing.status) {
      updatedJob.activityLog = [
        ...(existing.activityLog || []),
        { status: updatedJob.status, timestamp: new Date().toISOString() }
      ];
    }

    // Feature 3: Initialize checklist if moving to interview for the first time
    if (updatedJob.status === 'interview' && (!updatedJob.interviewChecklist || updatedJob.interviewChecklist.length === 0)) {
      const defaultList = [
        'Research company culture and recent news',
        'Review the job description thoroughly',
        'Prepare 3 STAR format answers',
        'Prepare questions to ask the interviewer',
        'Test audio/video setup (for remote interviews)',
        'Send thank-you email after interview',
        'Follow up if no response in 5 days',
      ].map(label => ({ id: nanoid(), label, checked: false }));
      
      updatedJob.interviewChecklist = defaultList;
    }

    await db.put('jobs', updatedJob);
    return updatedJob;
  };

  const duplicateJob = async (originalJob) => {
    const db = await getDB();
    const duplicate = {
      ...originalJob,
      id: nanoid(),
      companyName: `${originalJob.companyName} (Copy)`,
      status: 'wishlist',
      appliedDate: todayISO(),
      interviewRound: 0,
      activityLog: [{ status: 'wishlist', timestamp: new Date().toISOString() }],
      interviewChecklist: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.add('jobs', duplicate);
    return duplicate;
  };

  const deleteJob = async (id) => {
    const db = await getDB();
    await db.delete('jobs', id);
  };

  const getResumes = async () => {
    const db = await getDB();
    return db.getAll('resumes');
  };

  const addResume = async (name) => {
    const db = await getDB();
    await db.put('resumes', { name });
  };

  const deleteResume = async (name) => {
    const db = await getDB();
    await db.delete('resumes', name);
  };

  const seedIfEmpty = async () => {
    const db = await getDB();
    const count = await db.count('jobs');
    if (count === 0) {
      const tx = db.transaction(['jobs', 'resumes'], 'readwrite');
      for (const job of SEED_JOBS) {
        tx.objectStore('jobs').add(job);
      }
      for (const resume of SEED_RESUMES) {
        tx.objectStore('resumes').add(resume);
      }
      await tx.done;
    }
  };

  return {
    getAllJobs,
    addJob,
    updateJob,
    duplicateJob,
    deleteJob,
    getResumes,
    addResume,
    deleteResume,
    seedIfEmpty,
  };
}
