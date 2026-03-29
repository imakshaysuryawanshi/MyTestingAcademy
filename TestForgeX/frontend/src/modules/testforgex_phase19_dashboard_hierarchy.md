# Phase 19: Intelligent Dashboard + QA Hierarchy

## Objective
Upgrade the dashboard to reflect the complete QA lifecycle and provide intelligent, actionable insights.

---

## Core Concept

Transform dashboard from static metrics to lifecycle-driven view:

User Stories → Test Plans → Test Cases → Coverage

---

## Section 1 — Top Metrics (PRIMARY)

Display 4 cards in this exact order:

1. User Stories
2. Test Plans
3. Test Cases
4. Coverage

---

## Card Details

### User Stories
- Label: USER STORIES
- Value: dynamic count
- Icon: document / stack icon

### Test Plans
- Label: TEST PLANS
- Value: dynamic count

### Test Cases
- Label: TEST CASES
- Value: dynamic count

### Coverage
- Label: COVERAGE
- Value: percentage

---

## Design Rules

- Equal width cards
- Subtle border (#1F2A37)
- Background: #121821
- Rounded corners
- Soft hover effect

---

## Section 2 — AI Insights (NEW)

Display dynamic insights:

Examples:
- "Coverage is low for Login module"
- "5 test cases missing for Checkout"
- "Edge cases not covered"

---

## UI Behavior

- Show insights in a card
- Highlight important warnings
- Use icons (⚠️, 💡)

---

## Section 3 — Coverage Breakdown

Display module-wise coverage:

Example:
- Login: 60%
- Checkout: 85%
- Profile: 90%

---

## UI

- Horizontal bars
- Color-coded progress

---

## Section 4 — Quick Actions (UPDATED)

Buttons:

- Import from Jira
- Analyze URL
- Generate User Stories

---

## Button Style

- Primary: cyan filled (#00E5FF)
- Secondary: outline

---

## Section 5 — Recent Activity (OPTIONAL)

Display:

- Generated test cases
- Created test plan
- Coverage analysis

---

## Navigation Flow

Dashboard → User Stories → Test Plan → Test Cases → Coverage

---

## UX Goals

- Show system status instantly
- Guide user to next action
- Reflect full QA lifecycle

---

## Important Rules

- Do NOT remove existing metrics
- Add User Stories as first metric
- Maintain clean layout
- Avoid clutter

---

## Final Outcome

Dashboard becomes:

- Intelligent
- Actionable
- Lifecycle-driven
