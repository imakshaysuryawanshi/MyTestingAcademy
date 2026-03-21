# ✈️ JobPilot — Feature Addendum v1.1
### 3 New Features to add on top of PRD v1.0

> **Status:** Addendum only — do NOT modify existing PRD v1.0  
> **Integrate into:** existing `jobpilot/` project  
> **Depends on:** PRD v1.0 fully implemented first  

---

## Feature 1 — Duplicate Card

### What
One-click clone of any existing job card. Creates an identical copy with
a new `id`, resets `status` to `wishlist`, resets `appliedDate` to today,
and clears `interviewRound` back to `0`. Everything else (role, skills,
resume, salary, notes) is copied as-is.

### Why
When applying to the same role title across multiple companies (e.g.,
"Senior SDET" at Infosys → TCS → Wipro), duplication saves re-filling
skills, resume name, salary range every time. Just clone → change company.

### Data Changes
No schema change needed. New card uses existing `JobCard` interface:
```js
const duplicate = {
  ...originalJob,
  id:             nanoid(),            // new unique ID
  companyName:    originalJob.companyName + ' (Copy)', // editable hint
  status:         'wishlist',          // always resets to wishlist
  appliedDate:    todayISO(),          // reset to today
  interviewRound: 0,                   // reset rounds
  createdAt:      new Date().toISOString(),
  updatedAt:      new Date().toISOString(),
};
```

### UI Placement
- Add a **Copy icon** (`lucide-react` → `Copy`) in the card's hover actions row
- Sits between the Edit (pencil) and Delete (trash) icons
- On click → immediately duplicates → new card appears at top of Wishlist column
- Show Toast: *"Card duplicated! ✈️ Edit company name to continue."*
- The duplicated card opens the **Edit modal automatically** so the user
  can change the company name right away (optional but recommended UX)

### Hook Change — `useIndexedDB.js`
Add one new method:
```js
async duplicateJob(originalJob) {
  const db = await getDB();
  const duplicate = {
    ...originalJob,
    id:             nanoid(),
    companyName:    originalJob.companyName + ' (Copy)',
    status:         'wishlist',
    appliedDate:    todayISO(),
    interviewRound: 0,
    createdAt:      new Date().toISOString(),
    updatedAt:      new Date().toISOString(),
  };
  await db.add('jobs', duplicate);
  return duplicate;
}
```

Expose `duplicateJob` through `useJobStore` context alongside existing
`addJob`, `updateJob`, `deleteJob`.

### Component Changes
**`JobCard.jsx`** — add Copy icon button in hover actions:
```jsx
{/* Hover actions row */}
<div className="jp-card-actions">
  <button onClick={() => onDuplicate(job)} aria-label="Duplicate job">
    <Copy size={14} />
  </button>
  <button onClick={() => onEdit(job)} aria-label="Edit job">
    <Pencil size={14} />
  </button>
  <DeleteButton onConfirm={() => onDelete(job.id)} />
</div>
```

**`KanbanColumn.jsx`** — pass `onDuplicate` down to `JobCard`.
**`TableView.jsx`** — add Duplicate icon in the Actions column per row.

---

## Feature 2 — Activity Log per Card

### What
Every time a card's `status` changes, a timestamped log entry is
automatically appended. The log is visible inside the Edit modal as a
read-only collapsible timeline at the bottom.

Example log for a card:
```
● Applied          →  March 10, 2025 at 9:30 AM
● Screening        →  March 14, 2025 at 2:15 PM
● Interview        →  March 18, 2025 at 11:00 AM
● Offer            →  March 25, 2025 at 4:45 PM
```

### Why
Gives a clear picture of how fast (or slow) a pipeline is moving.
Helps you remember when things happened without digging through notes.
Especially useful during multi-round interviews.

### Data Changes
Add one new field to the `JobCard` interface:
```ts
interface JobCard {
  // ... all existing fields ...
  activityLog: ActivityEntry[];   // NEW — append-only log
}

interface ActivityEntry {
  status:    KanbanStatus;        // the status moved TO
  timestamp: string;              // ISO string
  note?:     string;              // optional manual note (future use)
}
```

**Seed data update** — add realistic `activityLog` to each seed card:
```js
// Example for Wipro card (status: 'interview', interviewRound: 2)
activityLog: [
  { status: 'applied',   timestamp: daysBack(21) },
  { status: 'screening', timestamp: daysBack(14) },
  { status: 'interview', timestamp: daysBack(7)  },
]
```

**Migration note:** existing cards without `activityLog` should default
to `activityLog: []` — handle in `getAllJobs()` with:
```js
return jobs.map(j => ({ activityLog: [], ...j }));
```

### When Log Entries Are Created
1. **On card creation** — first entry auto-added:
   ```js
   activityLog: [{ status: initialStatus, timestamp: new Date().toISOString() }]
   ```
2. **On status change** (drag-and-drop OR modal save OR table inline select):
   ```js
   // Inside updateJob(), detect status change:
   if (updatedJob.status !== existingJob.status) {
     updatedJob.activityLog = [
       ...(existingJob.activityLog || []),
       { status: updatedJob.status, timestamp: new Date().toISOString() }
     ];
   }
   ```

### UI Placement — `JobModal.jsx`
Add a collapsible **"Activity Log"** section at the bottom of the slide-over,
below the Notes textarea, above the footer buttons:

```
─────────────────────────────
▼ Activity Log  (click to expand)
─────────────────────────────
  ● Wishlist     Mar 10, 9:30 AM
  ● Applied      Mar 14, 2:15 PM
  ● Interview    Mar 18, 11:00 AM
─────────────────────────────
```

Styling:
- Each entry: small colored dot matching column accent color + status label + timestamp
- Newest entry at the **bottom** (chronological order)
- Read-only — no editing of log entries
- Collapsed by default — click header to expand
- If `activityLog.length === 0` → show *"No activity yet"*

### New Utility — `formatters.js` addition
```js
export const formatLogTimestamp = (isoString) =>
  format(new Date(isoString), 'MMM d, h:mm a');  // "Mar 18, 11:00 AM"
```

### New Component — `src/components/UI/ActivityLog.jsx`
```jsx
// Props: entries (ActivityEntry[]), columns (COLUMNS config for color lookup)
// Renders collapsible timeline
// Uses useState for open/closed toggle
// Maps entries → colored dot + status name + formatted timestamp
```

---

## Feature 3 — Interview Checklist per Card

### What
A simple, persistent checkbox list inside the job card modal — specifically
shown when `status === 'interview'`. Pre-populated with a default checklist
that the user can check off. Checked state persists to IndexedDB.

Default checklist items:
```
□ Research company culture and recent news
□ Review the job description thoroughly
□ Prepare 3 STAR format answers (Situation, Task, Action, Result)
□ Prepare questions to ask the interviewer
□ Test audio/video setup (for remote interviews)
□ Send thank-you email after interview
□ Follow up if no response in 5 days
```

### Why
QA/SDET interviews are structured and predictable. Having a per-card
checklist means you never forget to prep. Checked state per card means
you can track what you've done for each company separately.

### Data Changes
Add one new field to the `JobCard` interface:
```ts
interface JobCard {
  // ... all existing fields ...
  interviewChecklist: ChecklistItem[];   // NEW
}

interface ChecklistItem {
  id:      string;    // nanoid — stable key for React rendering
  label:   string;    // the checklist item text
  checked: boolean;   // checked state
}
```

**Default checklist generator** — add to `constants.js`:
```js
export const DEFAULT_CHECKLIST = [
  'Research company culture and recent news',
  'Review the job description thoroughly',
  'Prepare 3 STAR format answers',
  'Prepare questions to ask the interviewer',
  'Test audio/video setup (for remote interviews)',
  'Send thank-you email after interview',
  'Follow up if no response in 5 days',
].map(label => ({ id: nanoid(), label, checked: false }));
```

**When checklist is initialized:**
- When a card's status changes TO `'interview'` for the first time
  AND `interviewChecklist.length === 0` → auto-populate with `DEFAULT_CHECKLIST`
- User can manually check/uncheck items — each toggle calls `updateJob()`
- User can add custom items (optional text input at bottom of list)

**Migration:** existing cards default to `interviewChecklist: []`

### UI Placement — `JobModal.jsx`
Show the **"Interview Checklist"** section only when `status === 'interview'`.
Position it between the Interview Round stepper and the Notes textarea:

```
─────────────────────────────
Interview Checklist
─────────────────────────────
  ☑ Research company culture
  ☑ Review job description
  □ Prepare STAR answers
  □ Prepare questions to ask
  □ Test audio/video setup
  □ Send thank-you email
  □ Follow up if no response
  [+ Add custom item]
─────────────────────────────
  Progress: 2 / 7 completed  ████░░░░░░  28%
─────────────────────────────
```

Styling:
- Each item: checkbox (cyan accent when checked) + label text
- Checked items: label gets `line-through` + muted text color
- Progress bar at bottom: cyan fill, shows `X / Y completed`
- `+ Add custom item` → inline text input, Enter to add
- Entire section hidden if `status !== 'interview'`

### Card Badge Update — `JobCard.jsx`
When `interviewChecklist.length > 0`, show a small progress indicator
on the card face (below the skill tags):

```jsx
{job.status === 'interview' && job.interviewChecklist.length > 0 && (
  <div className="text-xs text-slate-400">
    ✅ {checkedCount}/{total} prep done
  </div>
)}
```

### New Component — `src/components/UI/InterviewChecklist.jsx`
```jsx
// Props: items (ChecklistItem[]), onChange (fn)
// Renders checkbox list + progress bar + add custom item input
// Each checkbox toggle calls onChange with updated items array
// Progress bar: (checked.length / total.length) * 100
```

---

## Summary — What Files to Touch

| File | Feature 1 (Duplicate) | Feature 2 (Activity Log) | Feature 3 (Checklist) |
|---|---|---|---|
| `utils/constants.js` | — | — | ✏️ Add `DEFAULT_CHECKLIST` |
| `utils/formatters.js` | — | ✏️ Add `formatLogTimestamp` | — |
| `utils/db.js` | — | — | — |
| `utils/seedData.js` | — | ✏️ Add `activityLog` to seeds | ✏️ Add `interviewChecklist: []` |
| `hooks/useIndexedDB.js` | ✏️ Add `duplicateJob()` | ✏️ Auto-append log on status change | ✏️ Init checklist on → interview |
| `hooks/useJobStore.js` | ✏️ Expose `duplicateJob` | — | — |
| `components/Board/JobCard.jsx` | ✏️ Add Copy icon | — | ✏️ Add prep progress line |
| `components/Board/KanbanColumn.jsx` | ✏️ Pass `onDuplicate` | — | — |
| `components/Table/TableView.jsx` | ✏️ Add Duplicate in actions | — | — |
| `components/Modal/JobModal.jsx` | — | ✏️ Add Activity Log section | ✏️ Add Checklist section |
| `components/UI/ActivityLog.jsx` | — | 🆕 New component | — |
| `components/UI/InterviewChecklist.jsx` | — | — | 🆕 New component |

---

*✈️ JobPilot Addendum v1.1 — integrate after PRD v1.0 is complete.*
