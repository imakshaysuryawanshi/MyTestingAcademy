# Phase 17: Button-Based Pipeline Flow (User-Controlled Generation)

## Objective
Enable user-controlled generation flow using action buttons instead of automatic pipelines.

---

## Core Concept

Replace auto-generation with explicit button-driven actions:

User Story → (Button) → Test Plan  
User Story → (Button) → Test Scenarios  
User Story → (Button) → Test Cases  

---

## UI Implementation

### User Story Card Actions

Each User Story card must include:

- Generate Test Plan
- Generate Test Scenarios
- Generate Test Cases

---

## Button Design

- Equal size buttons
- Soft cyan border (#00E5FF)
- Transparent dark background
- Hover: soft glow

---

## Action Behavior

### Generate Test Plan
- Call API: POST /api/testplan/generate
- Input: user story data
- Navigate to Test Plan page
- Display result

---

### Generate Test Scenarios
- Call API: POST /api/testscenario/generate
- Input: user story data
- Navigate to Scenario section/page
- Display result

---

### Generate Test Cases
- Call API: POST /api/testcases/generate
- Input: user story data
- Navigate to Test Case dashboard
- Display result

---

## Data Passing

Payload format:

{
  "title": "",
  "description": "",
  "acceptance_criteria": []
}

---

## UX Flow

1. User generates User Stories
2. User clicks action button
3. Show loading state:
   "Generating..."
4. Call backend API
5. Navigate to target page
6. Display generated output

---

## Loading & Feedback

- Disable button during processing
- Show spinner or text
- Show success toast after completion

---

## Navigation Rules

- Do NOT stay on same page after action
- Always redirect to relevant module

---

## Error Handling

- Show error message if API fails
- Allow retry

---

## Important Rules

- No automatic chaining
- Each action must be user-triggered
- Keep flow simple and controlled

---

## UX Goal

- Clear control for user
- Predictable behavior
- Clean modular flow

---

## Final Flow

User Story  
   ↓  
(Buttons)  
   ↓  
Test Plan / Scenarios / Test Cases  

---

## Notes

- This phase ensures modular architecture
- Keeps system debuggable
- Improves user experience significantly
