# Phase 22: Element Locator Intelligence (Advanced CodeGen)

## Objective
Enhance automation code generation by using real UI element locators from URL Analysis instead of guessing selectors.

---

## Core Concept

Upgrade CodeGen:

Before:
- Generic locators (id, xpath guessed)

After:
- Real locators from URL Analyzer
- Smarter, stable selectors

---

## Data Source

Use output from URL Analysis Phase:

{
  "elements": [
    {
      "name": "loginButton",
      "locator": "id=login-btn"
    },
    {
      "name": "usernameField",
      "locator": "name=username"
    }
  ]
}

---

## Backend Changes

### Step 1: Pass Elements into CodeGen

const payload = {
  URL: resolveURL(data),
  TITLE: data.title,
  STEPS: JSON.stringify(data.steps),
  ELEMENTS: JSON.stringify(data.elements || [])
};

---

### Step 2: Inject into Prompt

const prompt = loadPrompt("codegen/selenium-java.md", payload);

---

## Prompt Update (IMPORTANT)

Add this section in CodeGen prompt:

---

# Element Instructions

- If elements are provided, ALWAYS use given locators
- Do NOT guess locators if provided
- Map steps to elements intelligently

Example:

Input:
"Click login button"

Elements:
loginButton → id=login-btn

Output:
driver.findElement(By.id("login-btn")).click();

---

## Locator Parsing Logic

Backend helper:

function parseLocator(locator) {
  const [type, value] = locator.split("=");

  switch(type) {
    case "id":
      return `By.id("${value}")`;
    case "name":
      return `By.name("${value}")`;
    case "css":
      return `By.cssSelector("${value}")`;
    case "xpath":
      return `By.xpath("${value}")`;
    default:
      return `By.id("${value}")`;
  }
}

---

## Smart Mapping Logic

- Match step text with element name
- Example:
  Step: "Click login button"
  → match "loginButton"

---

## Frontend Changes

When calling CodeGen:

generate({
  title: testCase.title,
  steps: testCase.steps,
  url: testCase.url,
  elements: analyzedElements
});

---

## Data Flow

URL Analysis
   ↓
Extract Elements
   ↓
Pass to CodeGen
   ↓
LLM uses real locators
   ↓
Accurate Selenium Code

---

## Expected Output

driver.findElement(By.id("login-btn")).click();

---

## Benefits

- More stable automation scripts
- Less flaky tests
- Production-ready code

---

## Rules

- Always prefer provided locators
- Avoid random xpath generation
- Keep selectors clean

---

## Outcome

CodeGen becomes:

- Intelligent
- Context-aware
- Real-world usable
