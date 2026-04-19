# Task Plan

## Project Blueprint: ASK Test Case GenBuddy

### Phase 1: Planning and Setup (Status: In Progress)
- [x] Gather requirements through Discovery Questions.
- [x] Update project documentation (`findings.md`, `context.md`, `task_plan.md`).
- [x] Receive blueprint approval from the user.
- [x] Initialize Node.js + TypeScript backend project.
- [x] Initialize React + TypeScript frontend project.

### Phase 2: Backend Development (Node.js/Express)
- [ ] Set up the Express.js server and connect routing.
- [ ] Implement API endpoints for LLM provider configuration (save configs, test API keys).
- [ ] Implement LLM integration service to handle multiple providers (Ollama, LM Studio, Groq, OpenAI, Claude, Gemini).
- [ ] Implement system prompts to strictly enforce Jira test case formats (Test Case ID, Test Scenario, Preconditions, Steps to Execute, Expected Result, Priority/Severity).

### Phase 3: Frontend Development (React)
- [x] Scaffold UI layout with a Sidebar and Main Content area.
- [x] **Chat View**: Implement the "History" sidebar to show past generations.
- [x] **Chat View**: Build the main chat interface for requirement input (accepting plain text or Jira formats).
- [x] **Chat View**: Add beautifully styled markdown rendering to display the formatted test cases output.
- [x] **Settings View**: Implement Settings interface with forms for Ollama, LM Studio, Groq, OpenAI, Claude, and Gemini configurations.
- [x] **Settings View**: Add "Save" and "Test Connection" buttons handling API requests to the backend.

### Phase 4: Integration and Polish
- [x] Connect Frontend React app to Backend Node.js API endpoints.
- [x] Add loading states, smooth animations, and robust error handling.
- [x] Perform manual testing to verify outputs for Functional and Non-functional test case generation.

### Phase 5: Verification & Delivery
- [x] User testing, bug fixing, and finalizing the delivery.
- [x] Update `progress.md` summarizing the completed project.
