# Findings

## Research
- **Core Concept**: Text to Image and Text to Video generator using various AI Models.
- **Input Mechanism**: User inputs text prompts into a chat-like interface.
- **Local/Remote Infrastructure**: Application needs to support configurations for Ollama, LM Studio, Grok/Groq, OpenAI, Claude, Quiho, ComfyUI, Huggingface, and Gemini.
- **Tech Stack**: React for the frontend, Node.js + TypeScript for the backend generator.

## Discoveries
- **Design Review**: The `AI 2x image for project.png` design shows a two-pane layout:
  - **Generation View**: A history sidebar on the left, a main display window for generated outputs, and a prompt input field at the bottom.
  - **Settings View**: A configuration form containing fields for various settings (like Ollama, Groq, and OpenAI keys), a Save button, and a Test Connection button. (Note: The user referred to Grok, but the design image spells it Groq. We will support all requested models).

## Constraints
- **AI Agent Constraint**: I (the AI assistant) will be responsible for providing the prompt generations via the requested text during the implementation and testing phases as per the project constraints.
- **Uncensored Content Support**: The user emphasized generating uncensored content. All mock AI providers and API connectors must avoid applying artificial restrictions on the prompts or the generated assets beyond the system safety bounds.

## Feature Set (User Defined)
- **MVP Set**: Prompt Input, Negative Prompt, Generate Button, Preview Area, History Management (with delete), Download, Delete, Gallery, and Basic Parameters (Resolution, Steps, CFG Scale, Seed).
- **History & File Management**: Generation/Prompt history, Delete/Clear Chat, Favorite, Search, Filter by Date. Download, Rename, Share.
- **Prompt Tools**: Suggestions, Templates, Enhancer, Save, Random.
- **Extra Video/Advanced**: Inpainting/Outpainting, Video Duration, FPS, Motion, Loop.
- **Special/Standout Features**: Prompt to Prompt Editing, Character Lock, Style Transfer, Prompt Library, Live Preview.
