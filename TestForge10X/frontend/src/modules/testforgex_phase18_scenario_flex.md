# Phase 18: Scenario + Flexible Test Case Flow UI

## Objective
Enable generation of Test Scenarios from User Stories and flexible Test Case generation using both scenarios and direct inputs.

---

## Core Concept

Introduce two flows:

1. User Story → Test Scenarios → Test Cases  
2. User Story → Test Cases (Direct - Flexible Mode)

---

## UI Enhancements

### User Story Card (Updated Actions)

Each User Story card must include:

- Generate Test Plan
- Generate Test Scenarios
- Generate Test Cases (Standard)
- Generate Test Cases (Advanced)

---

## Button Definitions

### Generate Test Scenarios
- Calls: POST /api/testscenario/generate
- Input: user story
- Navigates to Scenario Page

---

### Generate Test Cases (Standard)
- Calls: POST /api/testcases/generate
- Uses: testcase/universal.md
- Input: user story
- Navigates to Test Case Dashboard

---

### Generate Test Cases (Advanced)
- Calls: POST /api/testcases/generate
- Uses: testcase/universal-flex.md
- Input: user story or scenarios
- Navigates to Test Case Dashboard

---

## Scenario Page UI

### Layout

- List of Scenario Cards
- Each card contains:
  - Title
  - Description
  - Type
  - Priority

---

## Scenario Card Actions

- Generate Test Cases (from scenario)
- Copy
- Save

---

## Data Flow

1. User clicks Generate Test Scenarios
2. System generates scenarios
3. User reviews scenarios
4. User clicks Generate Test Cases

---

## Flexible Mode Behavior

- Automatically adapts to:
  - User Story input
  - Scenario input
  - JSON input

---

## Loading & Feedback

- Show loading state for each action
- Disable buttons during API calls
- Show success/error messages

---

## Navigation Rules

- Scenario generation → Scenario Page
- Test Case generation → Test Case Dashboard

---

## State Management

- scenarios (array)
- testCases (array)
- loading states per action

---

## Important Rules

- No auto chaining
- All actions must be user-triggered
- Keep flows independent

---

## UX Goal

- Provide flexibility to user
- Support both structured and fast workflows
- Improve test coverage quality

---

## Final Flow Options

Option 1:
User Story → Test Scenarios → Test Cases  

Option 2:
User Story → Test Cases (Advanced)

---

## Notes

- This phase introduces advanced flexibility
- Must maintain clean UI and avoid clutter
- Ensure clear distinction between Standard and Advanced modes
