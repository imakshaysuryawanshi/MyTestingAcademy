# JobPilot (JP) — Local-First Job Application Tracker
### Product Requirements Document (MVP v1.0)

> **App Name:** JobPilot  
> **Short Form:** JP  
> **Tagline:** *"Track every application. Land your next role."*  
> **Browser Tab:** `JobPilot — JP Your Career Cockpit`  
> **Version:** 1.0  
> **Type:** Single-Page React Application (Vite)  
> **Storage:** IndexedDB — local-only, no backend  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Data Model](#3-data-model)
4. [Kanban Columns](#4-kanban-columns)
5. [Layout Architecture](#5-layout-architecture)
6. [Job Card Design](#6-job-card-design)
7. [Add / Edit Modal](#7-add--edit-modal)
8. [Drag and Drop](#8-drag-and-drop)
9. [Smart & Unique Features](#9-smart--unique-features)
10. [Visual Design System](#10-visual-design-system)
11. [IndexedDB Schema](#11-indexeddb-schema)
12. [File Structure](#12-file-structure)
13. [Seed Data](#13-seed-data)
14. [Constraints & Quality Bar](#14-constraints--quality-bar)

---

## 1. Project Overview

**JobPilot** (`JP`) is a local-first Job Application Tracker built as a single-page
React 18+ app scaffolded with Vite. You are the pilot — every job application is
a flight plan, and JobPilot is your cockpit.

All data persists in the browser via IndexedDB using the `idb` library.

### Core Principles
- ✅ 100% offline-capable — no internet required after install
- ✅ No backend, no authentication, no API calls
- ✅ All CRUD operations persist instantly to IndexedDB
- ✅ Responsive layout (laptop + tablet)
- ✅ Dark-first design with light mode toggle

### Branding Reference
| Element | Value |
|---|---|
| App Name | `JobPilot` |
| Short Form | `JP` |
| Logo Style | `JobPilot` — cyan gradient animates on `"Pilot"` |
| DB Name | `jobpilot-db` |
| Backup File | `jobpilot-backup-YYYY-MM-DD.json` |
| Vite Project | `jobpilot/` |
| Browser Tab | `JobPilot — JP Your Career Cockpit` |
| Empty State | *"No applications yet. Add your first one!"* |
| Tagline | *"Track every application. Land your next role."* |

---

## 2. Tech Stack

| Package | Purpose |
|---|---|
| `react@18` + `vite` | App framework + build tooling |
| `tailwindcss@3` | Styling (dark mode via `class` strategy) |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop between columns |
| `idb` | IndexedDB async wrapper |
| `lucide-react` | Icon library |
| `date-fns` | Date formatting and diffing |
| `nanoid` | Unique ID generation |

> ⚠️ No external APIs. No auth. No backend. Zero network calls after load.

---

## 3. Data Model

Each job card is stored as a document in the `jobs` IndexedDB object store.

```typescript
interface JobCard {
  id: string;              // nanoid — primary key
  companyName: string;     // required
  role: string;            // required
  location: string;        // e.g. "Remote" | "Bangalore, IN" | "NYC"
  linkedinUrl?: string;    // optional URL, validated format
  resumeUsed?: string;     // picked from JP Resume Vault or typed new
  skills: string[];        // free-form tags e.g. ["Selenium", "Java", "TestNG"]
  salaryRange?: string;    // e.g. "₹28-35 LPA" or "$150-180K"
  appliedDate: string;     // ISO string — auto-set on creation, editable
  followUpDate?: string;   // ISO string — optional, triggers urgency flag
  notes?: string;          // textarea — recruiter name, referral, round notes
  status: KanbanStatus;    // one of 6 column statuses (see below)
  interviewRound: number;  // 0 = none; increments each round — shown as R1, R2
  priority: 'urgent' | 'normal' | 'low';  // default: 'normal'
  createdAt: string;       // ISO string
  updatedAt: string;       // ISO string
}

type KanbanStatus =
  | 'wishlist'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected';
```

**JP Resume Vault** — Resume names are stored separately as a small `string[]`
collection in their own IndexedDB object store. They are deduplicated and reused
across cards via a combobox in the Add/Edit modal.

---

## 4. Kanban Columns

Six fixed columns, in this order:

| # | Column Name | Status Key | Accent Color | Meaning |
|---|---|---|---|---|
| 1 | **Wishlist** | `wishlist` | `slate-400` | Saved — not yet applied |
| 2 | **Applied** | `applied` | `blue-500` | Application submitted |
| 3 | **Screening** | `screening` | `yellow-400` | HR / recruiter screen |
| 4 | **Interview** | `interview` | `purple-500` | Active interview rounds |
| 5 | **Offer** | `offer` | `emerald-500` | Offer received 🎉 |
| 6 | **Rejected** | `rejected` | `rose-500` | Closed / rejected |

**Each column header shows:**
- Colored status dot + column name
- Card count badge
- Sort icon → toggle Newest / Oldest / Urgent first *(persists to localStorage)*
- `+ Add card` → expands into inline quick-add mini-form

---

## 5. Layout Architecture

### 5.1 Left Sidebar (collapsible, 220px wide)

```
┌─────────────────────────┐
│  JobPilot           │  ← Logo — cyan gradient on "Pilot"
├─────────────────────────┤
│  OVERVIEW               │
│  13  Applied            │  ← Live counts from IndexedDB
│   2  Interviews         │
│   1  Offers             │
│  23% Rejection Rate     │
├─────────────────────────┤
│  COMPANIES              │
│  · Infosys          3   │  ← Click → filter board by company
│  · TCS              2   │
│  · Wipro            1   │
├─────────────────────────┤
│  JP RESUME VAULT        │
│  📄 QA_Lead_v2          │  ← Click → copies name to clipboard
│  📄 SDET_Resume_v3      │    + shows "Copied!" toast
├─────────────────────────┤
│  [◀ Collapse]           │
└─────────────────────────┘
```

Collapse/expand uses CSS `transition-all duration-300`.

---

### 5.2 Top Navbar

```
[JobPilot]  [______ Search by company or role... ______]  [🔴 Urgent] [Status ▾]  [⊞ Kanban][☰ Table]  [☀/🌙]  [+ Add Job]
```

- **Search bar** placeholder: *"Search by company or role..." filters in real-time by company or role
- **Urgent only** pill toggle — shows only `priority: 'urgent'` cards
- **Status filter** — multi-select dropdown
- **View toggle** — Kanban ↔ Table
- **Dark/Light mode** — sun/moon icon
- **+ Add Job** — primary CTA, opens full JP slide-over modal

---

### 5.3 Main Content Area

**Kanban View:**
- Horizontal scroll container, columns side-by-side
- Each column independently scrollable vertically
- `min-width: 280px`, `max-width: 320px` per column

**Table View:**
- Sortable columns: Company, Role, Status, Applied Date, Salary, Resume
- Inline status `<select>` per row — updates IndexedDB immediately
- Striped rows matching dark/light theme

---

## 6. Job Card Design

```
┌─────────────────────────────────┐  ← rounded-xl, 4px left border = column accent
│ Infosys · Bangalore, IN    🔴 R2│  ← company · location  |  badges top-right
│                                 │
│ Senior QA Automation Engineer   │  ← role (bold, prominent)
│                                 │
│ [Selenium] [Java] [TestNG] +1   │  ← skill tags — max 3 shown, +N on hover
│                                 │
│ 12d ago               ₹28-35 LPA│  ← days since applied  |  salary right-aligned
│ 🔗                              │  ← LinkedIn icon (only if URL provided)
└─────────────────────────────────┘
```

### Badge System (top-right corner)
| Badge | Trigger |
|---|---|
| 🔴 `Urgent` red pill | `priority === 'urgent'` |
| `R2` purple badge | `interviewRound > 0` → shows R1, R2, R3... |
| `⚠` amber icon | `followUpDate` is past today |
| `⚠` amber icon | Stuck in `applied`/`screening` for 14+ days |

### Card States
| State | Style |
|---|---|
| Default | subtle shadow, accent left border |
| Hover | `translateY(-2px)` + `shadow-md` — 200ms ease |
| Hover actions | ✏️ Edit + 🗑️ Delete icons appear top-right |
| Delete | Inline *"Delete?"* → `[Yes]` `[No]` — no separate dialog |
| Dragging | Ghost overlay, `grab` cursor, 70% opacity |

**Stale Alert:** Cards in `Applied` or `Screening` with no activity for **14+ days**
show amber ⚠. Tooltip: *"No update in 14 days — time to follow up?"*

---

## 7. Add / Edit Modal

Right **slide-over panel** — 480px wide, preserves board context behind it.

### Fields

| # | Field | Type | Notes |
|---|---|---|---|
| 1 | Company Name | `text` | **Required** — red inline error |
| 2 | Job Title / Role | `text` | **Required** |
| 3 | Location | `text` | Default: `"Remote"` |
| 4 | LinkedIn URL | `url` | Optional, format-validated |
| 5 | Resume Used | `combobox` | Type new OR pick from JP Resume Vault; new names auto-saved |
| 6 | Skills / Tags | `tag input` | Type + Enter to add; × to remove |
| 7 | Applied Date | `date` | Defaults to today |
| 8 | Follow-up Date | `date` | Optional — enables overdue alert |
| 9 | Salary Range | `text` | Placeholder: `₹25-30 LPA or $150-180K` |
| 10 | Priority | `segmented control` | Low \| **Normal** \| Urgent |
| 11 | Interview Round | `number stepper` | Only shown when `status === 'interview'` |
| 12 | Notes | `textarea` | 4 rows — recruiter name, referral, round details |
| 13 | Status | `dropdown` | Pre-selected if opened from a column's `+ Add card` |

**Footer:** `[Cancel]` · `[Save Job]`  
Save → optimistic UI update → IndexedDB write → `"Job added!"` toast.

---

## 8. Drag and Drop

Using `@dnd-kit/core` + `@dnd-kit/sortable`:

- Cards draggable **within** and **between** columns
- Drop into new column → auto-updates `status` in IndexedDB
- **While dragging:** `DragOverlayCard` renders semi-transparent ghost
- **Drop target:** column highlights with dashed cyan border
- Smooth CSS repositioning transitions
- Keyboard-accessible: `Space` to lift → `Arrow keys` → `Space/Enter` to drop

---

## 9. Smart & Unique Features

### 9.1 Stale Application Alert ⚠️
Cards stuck in `Applied` / `Screening` for **14+ days** with no `followUpDate` get
an amber warning icon. Tooltip: *"No update in 14 days — time to follow up?"*

### 9.2 Interview Round Tracker 🎯
When a card enters `Interview` status, a round stepper (`+` / `-`) appears in
the card actions. Badge shows `R1`, `R2`, `R3`... Tracks multi-round pipelines
without leaving the app.

### 9.3 JP Resume Vault 📄
All resume names used across cards are deduplicated in the sidebar. **One click
copies the name to clipboard** → `"Copied!"` toast. No more searching for
your resume name when filling application forms.

### 9.4 Column Sort Options 📅
Each column header has a sort toggle — cycle between:
- 📅 Newest first
- 📅 Oldest first
- 🔴 Urgent first

Preference per column persists to `localStorage`.

### 9.5 Quick-Add Inline Form ⚡
`+ Add card` at the bottom of each column expands a **2-field mini-form**
(Company + Role) right inside the column.
- `Enter` → saves with minimal fields, opens modal if more detail needed
- `Escape` → cancels and collapses

### 9.6 Export / Import 💾
From secondary menu (`⋯`) in the navbar:

- **Export:** Full IndexedDB → `jobpilot-backup-YYYY-MM-DD.json` download
- **Import:** Accepts `.json` → validates → prompts:
  - *"Merge with existing"* — adds new, skips duplicate IDs
  - *"Replace all"* — wipes and restores from file

### 9.7 Keyboard Shortcuts ⌨️

| Key | Action |
|---|---|
| `N` | Open "Add Job" modal |
| `/` | Focus search bar |
| `Esc` | Close any open modal or slide-over |
| `D` | Toggle dark / light mode |
| `?` | Open keyboard shortcuts help popover |

`?` icon always visible in bottom-right corner of the app.

---

## 10. Visual Design System

### Color Palette

**Dark Mode (default):**
```
Page bg:        #0a0a0f
Sidebar:        #0f0f17
Column bg:      #12121a
Card bg:        #1a1a26
Card hover:     #1e1e2e
Primary accent: #22d3ee   (cyan-400 — JP brand color)
Text primary:   #f1f5f9
Text muted:     #64748b
```

**Light Mode:**
```
Page bg:        #f8fafc
Sidebar:        #f1f5f9
Column bg:      #e2e8f0
Card bg:        #ffffff
Primary accent: #0891b2   (cyan-600)
Text primary:   #0f172a
Text muted:     #64748b
```

### Typography
- **Headings / Logo:** `Sora` — Google Fonts
- **Body / UI:** `DM Sans` — Google Fonts
- Logo animation: `"Job"` in white · `"Pilot"` with animated gradient `#22d3ee → #818cf8`

### CSS Variables
```css
:root {
  --jp-accent:          #22d3ee;
  --jp-accent-hover:    #06b6d4;
  --jp-radius-card:     12px;
  --jp-radius-badge:    6px;
  --jp-shadow-card:     0 1px 3px rgba(0,0,0,0.4);
  --jp-shadow-hover:    0 8px 24px rgba(0,0,0,0.5);
  --jp-transition:      all 200ms ease;
  --jp-border:          1px solid rgba(255,255,255,0.06);
}
```

### Column Accent Colors
| Column | Tailwind | Hex |
|---|---|---|
| Wishlist | `slate-400` | `#94a3b8` |
| Applied | `blue-500` | `#3b82f6` |
| Screening | `yellow-400` | `#facc15` |
| Interview | `purple-500` | `#a855f7` |
| Offer | `emerald-500` | `#10b981` |
| Rejected | `rose-500` | `#f43f5e` |

---

## 11. IndexedDB Schema

```javascript
// src/utils/db.js
import { openDB } from 'idb';

export const initDB = () => openDB('jobpilot-db', 1, {
  upgrade(db) {
    // Jobs object store
    const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
    jobStore.createIndex('by-status',  'status');
    jobStore.createIndex('by-company', 'companyName');
    jobStore.createIndex('by-date',    'appliedDate');

    // JP Resume Vault store
    db.createObjectStore('resumes', { keyPath: 'name' });
  },
});
```

**`useIndexedDB.js` custom hook exposes:**
```javascript
getAllJobs()         // → JobCard[]
addJob(job)         // → void
updateJob(job)      // → void
deleteJob(id)       // → void
getResumes()        // → string[]
addResume(name)     // → void
deleteResume(name)  // → void
```

All operations use **optimistic updates** — UI state first, IndexedDB write follows.

---

## 12. File Structure

```
jobpilot/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css                      ← Tailwind + JP CSS variables
    │
    ├── components/
    │   ├── Board/
    │   │   ├── KanbanBoard.jsx        ← DnD context + columns layout
    │   │   ├── KanbanColumn.jsx       ← Column + quick-add inline form
    │   │   ├── JobCard.jsx            ← Card UI + badges + hover actions
    │   │   └── DragOverlayCard.jsx    ← Ghost card while dragging
    │   │
    │   ├── Modal/
    │   │   ├── JobModal.jsx           ← Full add/edit right slide-over
    │   │   └── ConfirmDelete.jsx      ← Inline delete confirmation
    │   │
    │   ├── Sidebar/
    │   │   ├── Sidebar.jsx            ← Collapsible sidebar wrapper
    │   │   ├── StatsBlock.jsx         ← Live counts (applied/interviews/offers)
    │   │   ├── CompanyList.jsx        ← Company filter list
    │   │   └── ResumeVault.jsx        ← JP Resume Vault (click-to-copy)
    │   │
    │   ├── Navbar/
    │   │   ├── Navbar.jsx
    │   │   ├── SearchBar.jsx          ← Placeholder: "Search by company or role..."
    │   │   ├── FilterBar.jsx          ← Urgent toggle + status multi-select
    │   │   └── ViewToggle.jsx         ← Kanban ↔ Table switch
    │   │
    │   ├── Table/
    │   │   └── TableView.jsx          ← Sortable table + inline status edit
    │   │
    │   └── UI/
    │       ├── TagInput.jsx           ← Skills tag input (type + Enter)
    │       ├── PriorityControl.jsx    ← Segmented Low / Normal / Urgent
    │       ├── Toast.jsx              ← "Job saved" / "Copied!" toasts
    │       └── ShortcutsHelp.jsx      ← Keyboard shortcuts popover
    │
    ├── hooks/
    │   ├── useIndexedDB.js            ← All DB read/write operations
    │   ├── useJobStore.js             ← In-memory state synced with DB
    │   ├── useKeyboardShortcuts.js    ← Global keydown handler
    │   └── useTheme.js                ← Dark/light toggle + localStorage
    │
    └── utils/
        ├── db.js                      ← idb openDB + jobpilot-db schema
        ├── exportImport.js            ← JSON export/import + merge logic
        ├── formatters.js              ← daysAgo(), formatSalary(), formatDate()
        └── constants.js              ← COLUMNS config, STATUS_COLORS, SHORTCUTS
```

---

## 13. Seed Data

On **first launch with an empty DB**, seed **6 realistic cards** across all 6 columns
so the board is never empty. Use Indian QA/SDET roles and companies — relevant to the
JobPilot user persona.

| Company | Role | Status | Resume | Salary | Skills |
|---|---|---|---|---|---|
| Infosys | Senior QA Automation Engineer | `applied` | SDET_Resume_v3 | ₹28-35 LPA | Selenium, Java, TestNG |
| Wipro | QA Lead | `interview` | QA_Lead_Resume_v2 | ₹32-40 LPA | Playwright, CI/CD |
| TCS | SDET II | `screening` | SDET_Resume_v3 | ₹25-30 LPA | API Testing, Postman |
| Razorpay | Automation Engineer | `wishlist` | SDET_Resume_v3 | ₹30-38 LPA | Java, BDD, Cucumber |
| PhonePe | QA Engineer III | `offer` | QA_Lead_Resume_v2 | ₹40-48 LPA | Selenium, TestNG |
| Flipkart | Senior SDET | `rejected` | SDET_Resume_v3 | ₹35-42 LPA | Appium, Mobile Testing |

Set `interviewRound: 2` on the Wipro card so the `R2` badge is visible from launch.

---

## 14. Constraints & Quality Bar

### State Management
- Zero prop drilling — use React Context + `useJobStore` hook
- Optimistic updates — UI first, IndexedDB write after
- No `useEffect` chains — colocate data fetching in the custom hook

### Accessibility
- `focus-visible` ring on all interactive elements
- Cards keyboard-focusable via `Tab`
- DnD keyboard-accessible (Space → Arrows → Space/Enter)
- WCAG AA contrast in both themes

### Responsiveness
| Breakpoint | Behaviour |
|---|---|
| `≥ 1024px` | Sidebar open, full Kanban board |
| `768–1023px` | Sidebar collapsed by default, board horizontally scrollable |
| `< 768px` | Sidebar hidden (hamburger), Table view recommended |

### Performance
- `min-width: 280px`, `max-width: 320px` per Kanban column
- Only re-render affected column on card move (React.memo)
- All IndexedDB reads batched on app init — no per-card fetches

### Code Quality
- Consistent naming: `camelCase` vars/functions, `PascalCase` components
- No inline styles — Tailwind utility classes only
- All theme colors via CSS custom properties (`--jp-*`)
- Every component file under 200 lines — split if larger

---

*JobPilot — Your Career Cockpit.*  
*This document is the single source of truth for JP MVP v1.0.*  
*Cloud sync, team sharing, and AI features are intentionally out of scope for v1.*

---

**End of Document**
