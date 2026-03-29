# Phase 21: CodeGen Dynamic Data Injection Fix

## Objective
Fix Code Generation to use real data (URL, steps, context) instead of static prompt examples.

---

## Problem

Current behavior:
- Returns example.com
- Ignores actual test case data
- Repeats prompt sample output

---

## Solution Overview

Ensure dynamic injection of:
- URL
- Steps
- Title

---

## Backend Changes

### Step 1: URL Resolver

function resolveURL(data) {
  return (
    data.url ||
    data.test_plan?.url ||
    data.user_story?.url ||
    "https://example.com"
  );
}

---

### Step 2: Build Payload

const payload = {
  URL: resolveURL(data),
  TITLE: data.title,
  STEPS: JSON.stringify(data.steps)
};

---

### Step 3: Load Prompt

const prompt = loadPrompt("codegen/selenium-java.md", payload);

---

## Frontend Changes

### Pass Full Context

generate({
  title: testCase.title,
  steps: testCase.steps,
  url: testCase.url || selectedPlan?.url
});

---

## Data Flow

Test Case / User Story
      ↓
Resolve URL
      ↓
Inject into Prompt
      ↓
LLM
      ↓
Dynamic Code Output

---

## Validation Rules

- URL must NOT be hardcoded
- Steps must be used
- Output must reflect input data

---

## Expected Output

driver.get("https://real-app-url.com");

---

## Notes

- This fix is critical for real automation generation
- Works with all providers (Ollama, Groq, etc.)
