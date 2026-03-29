# Phase 10: Settings (Full UI + Functionality)

## Objective
Provide configuration options for AI models, prompts, and system behavior.

---

## Section 1: Model Configuration

### Fields
- Default Model (Dropdown)
  - llama3:8b-instruct-q4_0
  - deepseek-coder:6.7b-instruct-q4_0

- Temperature (Slider)
  - Range: 0.1 – 1.0
  - Default: 0.3

- Max Tokens (Input)
  - Default: 700

---

## Section 2: Prompt Configuration

### Fields
- Test Plan Prompt (Dropdown)
- Test Case Prompt (Dropdown)
- Coverage Prompt (Dropdown)
- CodeGen Prompt (Dropdown)

Values loaded from backend prompt folder

---

## Section 3: Execution Settings

### Fields
- Enable Retry (Toggle)
- Max Retry Attempts (Input: default 1)

- Enable Queue System (Toggle)

---

## Section 4: Output Settings

### Fields
- Default Status → Draft
- Enable Auto Save (Toggle)
- Enable JSON Validation (Toggle)

---

## Actions

- Save Settings Button
- Reset to Default Button

---

## UI Behavior

- Form-based layout
- Group settings into cards
- Show success message on save
- Disable save if no changes

---

## Storage

- Save settings in local JSON or backend API
- Load settings on app start

---

## Notes

- This page must be fully functional
- Do NOT show placeholder text
