# Phase 16: User Story Experience Upgrade (Results + UX Flow)

## Objective
Improve User Story generation experience by displaying results instantly on the same page and enabling seamless flow into Test Plan and Test Case generation.

---

## Core Problem Fix

Current Behavior:
- Generated User Stories are only visible in History

Updated Behavior:
- Display generated User Stories immediately below input section
- History remains secondary (below results)

---

## Layout Update

### Section 1 — Input (Top)
- Tabs:
  - From URL Analysis (default)
  - From Test Plan Outline
- Input Field:
  - URL input OR Test Plan selector
- Generate Button

---

### Section 2 — Loading State

When user clicks Generate:
- Disable button
- Show loading text:
  "Generating User Stories..."

---

### Section 3 — Results (PRIMARY)

- Display user stories instantly
- Each story in a card:
  - Title
  - Description
  - Acceptance Criteria

---

## Card Actions

- Generate Test Plan
- Generate Test Cases
- Copy
- Save
- Regenerate

---

## Section 4 — Empty State

"No user stories generated yet"

---

## Section 5 — History (SECONDARY)

- Below results
- Optional collapse

---

## State

- userStories
- loading
- error

---

## API

POST /api/userstory/generate

---

## Rules

- No redirect
- Show results instantly

---

## Flow

User Stories → Test Plan → Test Cases → Coverage → Code
