# JobPilot (JP) — AI Coding Agent Build Prompt
### Ready to paste into Cursor / Windsurf / Claude Code

---

## SYSTEM CONTEXT

You are an expert React 18 + Vite developer. Your task is to build **JobPilot**
(`JP`) — a local-first, single-page Job Application Tracker. The app must be
production-quality, fully functional, and visually polished from the first run.

**Golden rules:**
- Every feature must work end-to-end before moving to the next
- All data must persist to IndexedDB — never use localStorage for job data
- No API calls, no backend, no authentication
- Dark mode is the default; light mode is a toggle
- Never leave a component with placeholder/TODO code

---

## PHASE 0 — PROJECT BOOTSTRAP

Scaffold the project using this exact sequence:

```bash
npm create vite@latest jobpilot -- --template react
cd jobpilot
npm install
npm install tailwindcss @tailwindcss/forms postcss autoprefixer
npx tailwindcss init -p
npm install idb nanoid date-fns lucide-react
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### tailwind.config.js
```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      colors: {
        jp: {
          cyan: '#22d3ee',
          purple: '#818cf8',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

### index.html — add Google Fonts in <head>
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@600;700&display=swap" rel="stylesheet" />
<title>JobPilot — JP Your Career Cockpit</title>
```

### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --jp-accent:       #22d3ee;
  --jp-accent-hover: #06b6d4;
  --jp-radius-card:  12px;
  --jp-shadow-card:  0 1px 3px rgba(0,0,0,0.4);
  --jp-shadow-hover: 0 8px 24px rgba(0,0,0,0.5);
  --jp-transition:   all 200ms ease;
}

/* Dark mode background layers */
.dark body          { background-color: #0a0a0f; color: #f1f5f9; }
.dark .jp-sidebar   { background-color: #0f0f17; }
.dark .jp-column    { background-color: #12121a; }
.dark .jp-card      { background-color: #1a1a26; }
.dark .jp-card:hover{ background-color: #1e1e2e; }

/* JP Logo gradient animation */
@keyframes jp-gradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.jp-logo-gradient {
  background: linear-gradient(90deg, #22d3ee, #818cf8, #22d3ee);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: jp-gradient 3s ease infinite;
}

/* Scrollbar styling */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
```

---

## PHASE 1 — DATABASE LAYER

### src/utils/db.js
```js
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
```

### src/utils/constants.js
Define all static config here:

```js
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
```

### src/utils/formatters.js
```js
import { formatDistanceToNow, isPast, differenceInDays } from 'date-fns';

export const daysAgo = (isoDate) =>
  formatDistanceToNow(new Date(isoDate), { addSuffix: true });

export const isStale = (isoDate, days = 14) =>
  differenceInDays(new Date(), new Date(isoDate)) >= days;

export const isOverdue = (isoDate) =>
  isoDate && isPast(new Date(isoDate));

export const todayISO = () => new Date().toISOString().split('T')[0];
```

### src/utils/seedData.js
Seed data to populate on first launch:
```js
import { nanoid } from 'nanoid';
import { todayISO } from './formatters';

const daysBack = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

export const SEED_JOBS = [
  {
    id: nanoid(), companyName: 'Infosys', role: 'Senior QA Automation Engineer',
    location: 'Bangalore, IN', linkedinUrl: 'https://linkedin.com/jobs',
    resumeUsed: 'SDET_Resume_v3', skills: ['Selenium', 'Java', 'TestNG'],
    salaryRange: '₹28-35 LPA', appliedDate: daysBack(12), followUpDate: '',
    notes: 'Applied via referral from Rohan.', status: 'applied',
    interviewRound: 0, priority: 'normal',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: nanoid(), companyName: 'Wipro', role: 'QA Lead',
    location: 'Hyderabad, IN', linkedinUrl: 'https://linkedin.com/jobs',
    resumeUsed: 'QA_Lead_Resume_v2', skills: ['Playwright', 'CI/CD', 'Jenkins'],
    salaryRange: '₹32-40 LPA', appliedDate: daysBack(21), followUpDate: '',
    notes: 'Round 2 scheduled with Priya (Hiring Manager).', status: 'interview',
    interviewRound: 2, priority: 'urgent',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: nanoid(), companyName: 'TCS', role: 'SDET II',
    location: 'Remote', linkedinUrl: '',
    resumeUsed: 'SDET_Resume_v3', skills: ['API Testing', 'Postman', 'Rest Assured'],
    salaryRange: '₹25-30 LPA', appliedDate: daysBack(5), followUpDate: '',
    notes: 'HR screening call done. Waiting for technical round date.', status: 'screening',
    interviewRound: 0, priority: 'normal',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: nanoid(), companyName: 'Razorpay', role: 'Automation Engineer',
    location: 'Bangalore, IN', linkedinUrl: 'https://linkedin.com/jobs',
    resumeUsed: 'SDET_Resume_v3', skills: ['Java', 'BDD', 'Cucumber'],
    salaryRange: '₹30-38 LPA', appliedDate: todayISO(), followUpDate: '',
    notes: 'Dream company — apply before March 31.', status: 'wishlist',
    interviewRound: 0, priority: 'urgent',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: nanoid(), companyName: 'PhonePe', role: 'QA Engineer III',
    location: 'Bangalore, IN', linkedinUrl: 'https://linkedin.com/jobs',
    resumeUsed: 'QA_Lead_Resume_v2', skills: ['Selenium', 'TestNG', 'AWS'],
    salaryRange: '₹40-48 LPA', appliedDate: daysBack(34), followUpDate: '',
    notes: 'Offer letter received. Deadline to accept: April 5.', status: 'offer',
    interviewRound: 3, priority: 'urgent',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: nanoid(), companyName: 'Flipkart', role: 'Senior SDET',
    location: 'Bangalore, IN', linkedinUrl: '',
    resumeUsed: 'SDET_Resume_v3', skills: ['Appium', 'Mobile Testing', 'Python'],
    salaryRange: '₹35-42 LPA', appliedDate: daysBack(48), followUpDate: '',
    notes: 'Rejected after Round 3. Good experience overall.', status: 'rejected',
    interviewRound: 3, priority: 'low',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

export const SEED_RESUMES = [
  { name: 'SDET_Resume_v3' },
  { name: 'QA_Lead_Resume_v2' },
];
```

### src/utils/exportImport.js
```js
export function exportToJSON(jobs) {
  const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), jobs }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `jobpilot-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.jobs || !Array.isArray(parsed.jobs)) throw new Error('Invalid format');
        resolve(parsed.jobs);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}
```

---

## PHASE 2 — HOOKS

### src/hooks/useTheme.js
```js
import { useState, useEffect } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('jp-theme') !== 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('jp-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggleTheme: () => setDark((d) => !d) };
}
```

### src/hooks/useIndexedDB.js
Full async CRUD hook. Implements:
- `getAllJobs()` — returns all jobs sorted by createdAt desc
- `addJob(job)` — adds to IDB
- `updateJob(job)` — updates by id, sets updatedAt to now
- `deleteJob(id)` — removes by id
- `getResumes()` — returns all resume names
- `addResume(name)` — upserts a resume name
- `deleteResume(name)` — removes a resume name
- `seedIfEmpty()` — seeds SEED_JOBS and SEED_RESUMES if jobs store is empty

### src/hooks/useJobStore.js
Central in-memory store synced with IndexedDB. Use React Context.

Exposes via context:
```js
{
  jobs,              // JobCard[] — full list
  resumes,           // string[] — resume names
  addJob,
  updateJob,
  deleteJob,
  addResume,
  deleteResume,
  loading,           // boolean — true while initial IDB load
  searchQuery,       // string
  setSearchQuery,
  filterStatus,      // string[] — selected statuses (empty = all)
  setFilterStatus,
  urgentOnly,        // boolean
  setUrgentOnly,
  view,              // 'kanban' | 'table'
  setView,
  openModal,         // (job?: JobCard, defaultStatus?: string) => void
  closeModal,
  modalState,        // { open: boolean, job: JobCard | null, defaultStatus: string }
}
```

Derived selectors (computed inside the hook):
- `filteredJobs` — applies searchQuery + filterStatus + urgentOnly
- `jobsByStatus(status)` — returns filteredJobs for a given column
- `stats` — `{ total, applied, interviews, offers, rejectionRate }`
- `companies` — unique company names with count

### src/hooks/useKeyboardShortcuts.js
```js
import { useEffect } from 'react';

export function useKeyboardShortcuts({ onNew, onSearch, onToggleTheme, onHelp, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') onNew?.();
      if (e.key === '/') { e.preventDefault(); onSearch?.(); }
      if (e.key === 'd' || e.key === 'D') onToggleTheme?.();
      if (e.key === '?') onHelp?.();
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNew, onSearch, onToggleTheme, onHelp, onClose]);
}
```

---

## PHASE 3 — COMPONENT BUILD ORDER

Build components in this exact order. Each must be complete before starting the next.

### Step 3.1 — UI Primitives

**`src/components/UI/Toast.jsx`**
- Fixed bottom-right toast notification
- Props: `message`, `type` ('success' | 'error' | 'info')
- Auto-dismisses after 2.5s
- Success messages use airplane emoji: *"Job saved!"* / *"Copied!"*

**`src/components/UI/TagInput.jsx`**
- Input field where typing and pressing Enter adds a tag pill
- Each pill shows `× ` remove button
- Props: `tags`, `onChange`, `placeholder`

**`src/components/UI/PriorityControl.jsx`**
- Segmented 3-button control: Low | Normal | Urgent
- Low = slate, Normal = blue, Urgent = rose
- Props: `value`, `onChange`

**`src/components/UI/ShortcutsHelp.jsx`**
- Fixed `?` button in bottom-right corner
- Click opens a popover/modal listing all keyboard shortcuts
- Always visible regardless of current view

---

### Step 3.2 — Sidebar

**`src/components/Sidebar/StatsBlock.jsx`**
- Reads `stats` from useJobStore context
- Shows: Total Applied, Active Interviews, Offers, Rejection Rate %
- Each stat in its own mini card with label + large number

**`src/components/Sidebar/CompanyList.jsx`**
- Lists unique companies from `companies` derived selector
- Each row: company name + count badge
- Click → sets `filterStatus` + company filter in store

**`src/components/Sidebar/ResumeVault.jsx`**
- Lists all resume names from `resumes`
- Click any → `navigator.clipboard.writeText(name)` → show Toast "Copied!"
- Show `+` icon to add a new resume name manually

**`src/components/Sidebar/Sidebar.jsx`**
- Collapsible container (CSS transition, 220px → 0px)
- Logo: `Job<span class="jp-logo-gradient">Pilot</span>`
- Collapse button: chevron-left icon, flips to chevron-right when collapsed
- Contains: StatsBlock, CompanyList, ResumeVault (in that order)

---

### Step 3.3 — Navbar

**`src/components/Navbar/SearchBar.jsx`**
- Controlled input, placeholder: *"Search by company or role..."*
- Calls `setSearchQuery` on change (no debounce needed — IndexedDB is fast)
- `ref` forwarded so keyboard shortcut `/` can focus it

**`src/components/Navbar/FilterBar.jsx`**
- "Urgent only" toggle pill button (rose color when active)
- Status multi-select: dropdown showing all 6 statuses with checkboxes
- Active filters shown as removable pills

**`src/components/Navbar/ViewToggle.jsx`**
- Two icon buttons: `LayoutDashboard` (Kanban) + `Table` (Table)
- Active view gets cyan accent background

**`src/components/Navbar/Navbar.jsx`**
- Full-width top bar, fixed height 56px
- Left: Sidebar toggle hamburger + `JobPilot` logo text
- Center: SearchBar
- Right: FilterBar · ViewToggle · dark/light toggle · `+ Add Job` button
- `+ Add Job` is cyan-filled, calls `openModal(null)`
- Secondary `⋯` menu: Export JSON · Import JSON

---

### Step 3.4 — Job Card & Drag Overlay

**`src/components/Board/JobCard.jsx`**
Props: `job`, `onEdit`, `onDelete`

Render structure:
```
<div style={{ borderLeftColor: columnAccent }}>
  <div>  {/* top row */}
    <span>{company} · {location}</span>
    <div>  {/* badges */}
      {priority === 'urgent' && <UrgentBadge />}
      {interviewRound > 0 && <RoundBadge round={interviewRound} />}
      {isOverdue(followUpDate) && <OverdueBadge />}
    </div>
  </div>

  <p>{role}</p>

  <SkillTags skills={skills} />  {/* max 3 visible, +N more tooltip */}

  <div>  {/* footer row */}
    <span>{daysAgo(appliedDate)}</span>
    {salaryRange && <span>{salaryRange}</span>}
    {linkedinUrl && <a href={linkedinUrl} target="_blank"><ExternalLink /></a>}
  </div>

  {/* hover actions */}
  <div className="jp-card-actions">
    <button onClick={onEdit}><Pencil /></button>
    <DeleteButton onConfirm={onDelete} />  {/* inline confirm */}
  </div>
</div>
```

- `isStale` check: if `status` is `applied` or `screening` AND `isStale(appliedDate, 14)` → show amber ⚠ with tooltip
- Wrap entire card with `useSortable` from `@dnd-kit/sortable`

**`src/components/Board/DragOverlayCard.jsx`**
- Identical visual to JobCard but without hover actions and drag sensors
- Rendered inside `<DragOverlay>` in KanbanBoard — shown while dragging

---

### Step 3.5 — Kanban Column

**`src/components/Board/KanbanColumn.jsx`**
Props: `column`, `jobs`

Features:
- Column header: status dot + name + count badge + sort icon
- Sort cycles: newest → oldest → urgent → newest (persist to localStorage key `jp-sort-{columnId}`)
- `+ Add card` at bottom → expands inline mini-form:
  - 2 fields: Company Name + Role (both required)
  - `Enter` to save (calls `addJob` with defaults + this column's status)
  - `Escape` to cancel
- Cards list uses `<SortableContext>` with `verticalListSortingStrategy`
- Drop zone: when a card is dragged over, column border turns cyan dashed

---

### Step 3.6 — Kanban Board (DnD Root)

**`src/components/Board/KanbanBoard.jsx`**

```jsx
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, KeyboardSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// On DragEnd:
// 1. Identify source column (active.data.current.status)
// 2. Identify target column (over.id or over.data.current.status)
// 3. If columns differ → call updateJob({ ...job, status: targetColumn })
// 4. If same column → reorder (optional for MVP)
// 5. Clear active state
```

- Horizontal scrolling outer container
- Maps COLUMNS → `<KanbanColumn>` for each
- Renders `<DragOverlay>` with `<DragOverlayCard>` when dragging

---

### Step 3.7 — Table View

**`src/components/Table/TableView.jsx`**
- Shows `filteredJobs` as a sortable HTML table
- Columns: Company | Role | Status | Applied Date | Salary | Resume | Actions
- Click column header to sort (toggle asc/desc)
- Status cell: inline `<select>` → updates `status` in IndexedDB immediately
- Actions: Edit (pencil) + Delete (trash) icons per row
- Striped rows: alternating bg in dark/light

---

### Step 3.8 — Add / Edit Modal

**`src/components/Modal/JobModal.jsx`**

Right slide-over, 480px wide, full viewport height, with overlay behind.
Open/close with CSS transform: `translateX(0)` ↔ `translateX(100%)`.

Form fields (in order):
1. Company Name* — text
2. Job Title / Role* — text
3. Location — text (default: "Remote")
4. LinkedIn URL — url input
5. Resume Used — `<datalist>` combobox pulling from `resumes`
6. Skills — `<TagInput>` component
7. Applied Date — date input (default: today)
8. Follow-up Date — date input (optional)
9. Salary Range — text input
10. Priority — `<PriorityControl>` component
11. Interview Round — number stepper (only rendered when status = 'interview')
12. Notes — textarea (4 rows)
13. Status — `<select>` with all 6 statuses

Validation on submit:
- Company + Role are required → show red border + inline error message
- LinkedIn URL must be valid URL if provided

On save:
- `addJob` (new) or `updateJob` (edit) via context
- If `resumeUsed` is a new name not in vault → call `addResume(name)`
- Show Toast: *"Job saved!"*
- Close slide-over

Footer: `[Cancel]` (ghost button) · `[Save Job]` (cyan filled)

---

## PHASE 4 — APP ASSEMBLY

### src/App.jsx

```jsx
function App() {
  const { view, dark, toggleTheme, modalState, closeModal, openModal } = useJobStore();
  const searchRef = useRef(null);
  const [showHelp, setShowHelp] = useState(false);

  useKeyboardShortcuts({
    onNew:         () => openModal(null),
    onSearch:      () => searchRef.current?.focus(),
    onToggleTheme: toggleTheme,
    onHelp:        () => setShowHelp(true),
    onClose:       closeModal,
  });

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden bg-[#0a0a0f] dark:bg-[#0a0a0f]">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar searchRef={searchRef} />
          <main className="flex-1 overflow-auto p-4">
            {view === 'kanban' ? <KanbanBoard /> : <TableView />}
          </main>
        </div>
      </div>
      {modalState.open && <JobModal />}
      <ShortcutsHelp open={showHelp} onClose={() => setShowHelp(false)} />
      <Toast />  {/* Global toast, controlled via context or zustand-like signal */}
    </div>
  );
}
```

### src/main.jsx
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { JobStoreProvider } from './hooks/useJobStore';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <JobStoreProvider>
      <App />
    </JobStoreProvider>
  </React.StrictMode>
);
```

---

## PHASE 5 — POLISH CHECKLIST

Before declaring the build complete, verify every item:

### Functionality
- [ ] Jobs persist after browser refresh (IndexedDB)
- [ ] Drag card between columns → status updates in IDB
- [ ] Add Job modal validates Company + Role as required
- [ ] Edit modal pre-fills all existing fields
- [ ] Delete shows inline confirmation before removing
- [ ] Quick-add form in column works (Enter saves, Esc cancels)
- [ ] Search filters cards in real-time by company and role
- [ ] Urgent toggle hides non-urgent cards
- [ ] Export downloads a valid JSON file
- [ ] Import (merge + replace) works correctly
- [ ] Resume Vault copies name to clipboard with toast
- [ ] Company click in sidebar filters the board
- [ ] Column sort (newest/oldest/urgent) persists to localStorage
- [ ] Stale alert (⚠) appears on cards 14+ days old in Applied/Screening
- [ ] Interview round badge `R1`, `R2`... appears on Interview cards
- [ ] Follow-up overdue badge appears when followUpDate is past

### Keyboard Shortcuts
- [ ] `N` → opens Add Job modal
- [ ] `/` → focuses search bar
- [ ] `Esc` → closes modal
- [ ] `D` → toggles dark/light mode
- [ ] `?` → shows shortcuts popover

### Visual & UX
- [ ] Dark mode is default; light mode toggle works
- [ ] Logo gradient animation runs on `"Pilot"` text
- [ ] Each column has correct accent color on left border of cards
- [ ] Card hover lift animation (`translateY -2px`) is smooth
- [ ] Slide-over modal opens from the right with smooth transform
- [ ] Sidebar collapses with smooth width transition
- [ ] Toast appears bottom-right and auto-dismisses in 2.5s
- [ ] Empty Wishlist column shows *"No applications yet. Add your first one!"*
- [ ] Seed data loads on first visit (6 cards across all columns)

### Responsive
- [ ] At `< 1024px`, sidebar collapses by default
- [ ] Kanban board scrolls horizontally at tablet width
- [ ] Table view is functional at tablet width
- [ ] No horizontal overflow on mobile

---

## FINAL NOTES FOR THE AI AGENT

1. **Build phase by phase** — do not skip ahead. A working Phase 2 is more
   valuable than a broken Phase 5.

2. **IndexedDB is the source of truth** — always read from IDB on mount,
   write to IDB on every mutation. The in-memory store in `useJobStore` is
   a cache, not the authority.

3. **Optimistic updates** — update the React state immediately on user action,
   then write to IndexedDB. This makes the UI feel instant.

4. **Seed data** — call `seedIfEmpty()` in the `JobStoreProvider` useEffect on
   mount. If the jobs store has 0 records, seed all 6 SEED_JOBS and 2 SEED_RESUMES.

5. **No prop drilling** — all shared state lives in `JobStoreProvider` context.
   Leaf components only receive their own data as props.

6. **CSS class naming** — prefix JobPilot-specific utility classes with `jp-`
   in index.css. Tailwind utilities are used directly in JSX.

7. **Icons** — use `lucide-react` exclusively. No other icon library.

8. **Accessibility** — every button must have an `aria-label`. Every form field
   must have an associated `<label>`. Focus rings must be visible.

9. **Error handling** — wrap all IDB operations in try/catch. Show Toast with
   type 'error' if an IDB operation fails.

10. **The airplane theme is removed** — the UI is now exclusively clean and professional.

---

*JobPilot — JP Your Career Cockpit.*
*Build it once. Use it every job search.*
