# Phase 20: Model Engine Provider (Multi-LLM Support)

## Objective
Enable support for multiple LLM providers (Ollama, Groq, Grok, etc.) allowing users to select provider and model dynamically instead of a fixed default model.

---

## Core Concept

Replace:
- Default Model Selection

With:
- Provider Selection
- Model Name Selection

---

## Supported Providers

- Ollama (Local)
- Groq (Cloud)
- Grok (xAI)

---

## UI Section (Settings Page)

### Provider (Dropdown)
- Ollama
- Groq
- Grok

### Model Name (Dynamic)
Changes based on provider

### API Key
Required for Groq / Grok

---

## Backend Config

{
  "provider": "ollama",
  "model": "llama3",
  "apiKey": ""
}

---

## Routing Logic

function generateResponse(prompt, provider, model) {
  switch(provider) {
    case "ollama":
      return callOllama(model, prompt);
    case "groq":
      return callGroq(model, prompt);
    case "grok":
      return callGrok(model, prompt);
  }
}

---

## UX

- Dynamic model list
- Save globally
- Test connection button

---

## Rules

- No hardcoding
- Always read from settings

---

## Outcome

Multi-LLM flexible system
