export const COLUMNS = [
  { id: 'wishlist',   label: 'Wishlist',   color: '#94a3b8', tw: 'slate-400' },
  { id: 'applied',    label: 'Applied',    color: '#3b82f6', tw: 'blue-500'  },
  { id: 'screening',  label: 'Screening',  color: '#facc15', tw: 'yellow-400'},
  { id: 'interview',  label: 'Interview',  color: '#a855f7', tw: 'purple-500'},
  { id: 'offer',      label: 'Offer',      color: '#10b981', tw: 'emerald-500'},
  { id: 'rejected',   label: 'Rejected',   color: '#f43f5e', tw: 'rose-500'  },
];

export const PRIORITY = ['low', 'normal', 'urgent'];

export const SHORTCUTS = [
  { key: 'N',   action: 'Add new job' },
  { key: '/',   action: 'Focus search' },
  { key: 'Esc', action: 'Close modal' },
  { key: 'D',   action: 'Toggle dark mode' },
  { key: '?',   action: 'Show shortcuts' },
];

export const STALE_DAYS = 14; // days before stale alert triggers

export const DEFAULT_CHECKLIST = [
  'Research company culture and recent news',
  'Review the job description thoroughly',
  'Prepare 3 STAR format answers',
  'Prepare questions to ask the interviewer',
  'Test audio/video setup (for remote interviews)',
  'Send thank-you email after interview',
  'Follow up if no response in 5 days',
];
