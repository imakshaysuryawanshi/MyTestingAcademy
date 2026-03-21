import { openDB } from 'idb';

let dbPromise;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB('jobpilot-db', 1, {
      upgrade(db) {
        const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
        jobStore.createIndex('by-status',  'status');
        jobStore.createIndex('by-company', 'companyName');
        jobStore.createIndex('by-date',    'appliedDate');
        db.createObjectStore('resumes', { keyPath: 'name' });
      },
    });
  }
  return dbPromise;
}
