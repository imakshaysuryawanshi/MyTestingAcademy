import { nanoid } from 'nanoid';
import { todayISO } from './formatters';
import { DEFAULT_CHECKLIST } from './constants';

const daysBack = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const createChecklist = (checkedCount = 0) => {
  return DEFAULT_CHECKLIST.map((label, index) => ({
    id: nanoid(),
    label,
    checked: index < checkedCount
  }));
};

export const SEED_JOBS = [
  {
    id: nanoid(), companyName: 'Infosys', role: 'Senior QA Automation Engineer',
    location: 'Bangalore, IN', linkedinUrl: 'https://linkedin.com/jobs',
    resumeUsed: 'SDET_Resume_v3', skills: ['Selenium', 'Java', 'TestNG'],
    salaryRange: '₹28-35 LPA', appliedDate: daysBack(12).split('T')[0], followUpDate: '',
    notes: 'Applied via referral from Rohan.', status: 'applied',
    interviewRound: 0, priority: 'normal',
    createdAt: daysBack(12), updatedAt: daysBack(12),
    activityLog: [{ status: 'applied', timestamp: daysBack(12) }],
    interviewChecklist: []
  },
  {
    id: nanoid(), companyName: 'Wipro', role: 'QA Lead',
    location: 'Hyderabad, IN', linkedinUrl: 'https://linkedin.com/jobs',
    resumeUsed: 'QA_Lead_Resume_v2', skills: ['Playwright', 'CI/CD', 'Jenkins'],
    salaryRange: '₹32-40 LPA', appliedDate: daysBack(21).split('T')[0], followUpDate: '',
    notes: 'Round 2 scheduled with Priya (Hiring Manager).', status: 'interview',
    interviewRound: 2, priority: 'urgent',
    createdAt: daysBack(21), updatedAt: daysBack(7),
    activityLog: [
      { status: 'applied', timestamp: daysBack(21) },
      { status: 'screening', timestamp: daysBack(14) },
      { status: 'interview', timestamp: daysBack(7) }
    ],
    interviewChecklist: createChecklist(3)
  },
  {
    id: nanoid(), companyName: 'TCS', role: 'SDET II',
    location: 'Remote', linkedinUrl: '',
    resumeUsed: 'SDET_Resume_v3', skills: ['API Testing', 'Postman', 'Rest Assured'],
    salaryRange: '₹25-30 LPA', appliedDate: daysBack(5).split('T')[0], followUpDate: '',
    notes: 'HR screening call done. Waiting for technical round date.', status: 'screening',
    interviewRound: 0, priority: 'normal',
    createdAt: daysBack(5), updatedAt: daysBack(5),
    activityLog: [
      { status: 'applied', timestamp: daysBack(10) },
      { status: 'screening', timestamp: daysBack(5) }
    ],
    interviewChecklist: []
  },
  {
    id: nanoid(), companyName: 'Razorpay', role: 'Automation Engineer',
    location: 'Bangalore, IN', linkedinUrl: 'https://linkedin.com/jobs',
    resumeUsed: 'SDET_Resume_v3', skills: ['Java', 'BDD', 'Cucumber'],
    salaryRange: '₹30-38 LPA', appliedDate: todayISO(), followUpDate: '',
    notes: 'Dream company — apply before March 31.', status: 'wishlist',
    interviewRound: 0, priority: 'urgent',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    activityLog: [{ status: 'wishlist', timestamp: new Date().toISOString() }],
    interviewChecklist: []
  },
  {
    id: nanoid(), companyName: 'PhonePe', role: 'QA Engineer III',
    location: 'Bangalore, IN', linkedinUrl: 'https://linkedin.com/jobs',
    resumeUsed: 'QA_Lead_Resume_v2', skills: ['Selenium', 'TestNG', 'AWS'],
    salaryRange: '₹40-48 LPA', appliedDate: daysBack(34).split('T')[0], followUpDate: '',
    notes: 'Offer letter received. Deadline to accept: April 5.', status: 'offer',
    interviewRound: 3, priority: 'urgent',
    createdAt: daysBack(34), updatedAt: daysBack(5),
    activityLog: [
      { status: 'applied', timestamp: daysBack(34) },
      { status: 'screening', timestamp: daysBack(25) },
      { status: 'interview', timestamp: daysBack(15) },
      { status: 'offer', timestamp: daysBack(5) }
    ],
    interviewChecklist: createChecklist(7)
  },
  {
    id: nanoid(), companyName: 'Flipkart', role: 'Senior SDET',
    location: 'Bangalore, IN', linkedinUrl: '',
    resumeUsed: 'SDET_Resume_v3', skills: ['Appium', 'Mobile Testing', 'Python'],
    salaryRange: '₹35-42 LPA', appliedDate: daysBack(48).split('T')[0], followUpDate: '',
    notes: 'Rejected after Round 3. Good experience overall.', status: 'rejected',
    interviewRound: 3, priority: 'low',
    createdAt: daysBack(48), updatedAt: daysBack(20),
    activityLog: [
      { status: 'applied', timestamp: daysBack(48) },
      { status: 'screening', timestamp: daysBack(40) },
      { status: 'interview', timestamp: daysBack(30) },
      { status: 'rejected', timestamp: daysBack(20) }
    ],
    interviewChecklist: createChecklist(7)
  },
];

export const SEED_RESUMES = [
  { name: 'SDET_Resume_v3' },
  { name: 'QA_Lead_Resume_v2' },
];
