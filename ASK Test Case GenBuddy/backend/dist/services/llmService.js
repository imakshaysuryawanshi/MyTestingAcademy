"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestCase = void 0;
const settingsService_1 = require("./settingsService");
const openai_1 = __importDefault(require("openai"));
const genai_1 = require("@google/genai");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const axios_1 = __importDefault(require("axios"));
const SYSTEM_PROMPT = `You are a strict QA Test Case Generator. The user will provide a requirement or user story.
You must output a structured test case in Jira format.
Include EXACTLY these sections with these headers:
- Test Case ID: (Generate a random unique identifier, e.g., TC-001)
- Test Scenario: (Short description)
- Preconditions: (List of prerequisites)
- Steps to Execute: (Numbered list of steps)
- Expected Result: (Clear expected outcome)
- Priority / Severity: (e.g., High/Critical)

Do not include any extra introductory or concluding conversational text. Only output the test case structure.`;
const generateTestCase = async (requirement) => {
    const settings = (0, settingsService_1.getSettings)();
    const provider = settings.activeProvider || "ollama";
    try {
        if (provider === 'openai') {
            const openai = new openai_1.default({ apiKey: settings.openAiApiKey });
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: requirement }],
            });
            return response.choices[0].message.content || "";
        }
        else if (provider === 'groq') {
            const groq = new groq_sdk_1.default({ apiKey: settings.groqApiKey });
            const response = await groq.chat.completions.create({
                model: 'llama3-8b-8192',
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: requirement }],
            });
            return response.choices[0].message.content || "";
        }
        else if (provider === 'claude') {
            const anthropic = new sdk_1.default({ apiKey: settings.claudeApiKey });
            const response = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 1000,
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: requirement }]
            });
            return response.content[0].text;
        }
        else if (provider === 'gemini') {
            const ai = new genai_1.GoogleGenAI({ apiKey: settings.geminiApiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: requirement }] }],
                config: {
                    systemInstruction: SYSTEM_PROMPT
                }
            });
            return response.text || "";
        }
        else if (provider === 'lmstudio') {
            const client = new openai_1.default({ baseURL: settings.lmStudioUrl, apiKey: "lm-studio" });
            const response = await client.chat.completions.create({
                model: 'local-model',
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: requirement }],
            });
            return response.choices[0].message.content || "";
        }
        else {
            const ollamaBaseUrl = settings.ollamaUrl || "http://localhost:11434";
            const response = await axios_1.default.post(`${ollamaBaseUrl}/api/generate`, {
                model: settings.ollamaModel || "llama3", // Assuming user has pulled llama3 locally
                system: SYSTEM_PROMPT,
                prompt: requirement,
                stream: false
            });
            return response.data.response;
        }
    }
    catch (error) {
        console.error("LLM Service Error:", error?.response?.data || error.message);
        throw new Error(`Failed to generate via provider ${provider}: ${error.message}`);
    }
};
exports.generateTestCase = generateTestCase;
