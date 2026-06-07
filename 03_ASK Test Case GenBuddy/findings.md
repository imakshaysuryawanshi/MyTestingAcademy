# Findings

## Project Description
A tool designed to generate Functional and Non-Functional API and Web Application test cases based on user-provided Jira requirements.

## Target Audience
The user themselves. The interface should be streamlined for quick input (copy-pasting plain text or Jira requirements, or chat inputs).

## Core Features
1. **Requirement / Input Ingestion**: Accept plain text, user stories, feature descriptions, and Jira formatting.
2. **LLM-Based Test Case Generation**: AI-driven generation of robust and structured test cases.

## Output Format
Outputs must strictly follow a Jira-compatible structure for the test case which includes:
- Test Case ID
- Test Scenario
- Preconditions
- Steps to Execute
- Expected Result
- Priority / Severity
(Applicable for both functional and non-functional test cases)

## Tech Stack & Architecture
- **Backend Framework**: Node.js (TypeScript)
- **Frontend Framework**: React (TypeScript)
- **AI Integrations**: Support for multiple LLMs via a built-in settings panel:
  - Ollama API
  - LM Studio API
  - Groq API
  - OpenAI API
  - Claude API
  - Gemini API
- **UI Details** (derived from `Design/AI 2x image for project.png`):
  - **Chat View**: Contains a "History" sidebar, a main chat display area showing generated test cases, and a prompt input box.
  - **Settings View**: Contains forms for provider configurations (the image specifically shows "Ollama Setting", "Groq Setting", "Open AI API keys"), a "Save Button", and a "Test Connection" button.
