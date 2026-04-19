import { getSettings } from './settingsService';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import axios from 'axios';

const SYSTEM_PROMPT = `You are a strict QA Test Case Generator. The user will provide a requirement or user story.
You must output a structured test case.
Include EXACTLY these sections or columns:
- Test Case ID: (e.g., TC-001)
- Scenario: (Short description)
- Preconditions: (List of prerequisites)
- Steps to Execute (or Test Steps): (Numbered list of steps)
- Expected Result: (Clear expected outcome)
- Priority: (e.g., High, Medium, Low)
- Type: (e.g., Functional, Non-Functional)

If the user explicitly asks for a Tabular format or Jira Tabular format, you MUST format the ENTIRE test case suite as a single, properly aligned Markdown table with the columns:
| TEST ID | SCENARIO | TEST STEPS | EXPECTED RESULT | PRIORITY | TYPE |

CRITICAL: Markdown tables DO NOT support newlines inside table cells! You MUST use the HTML tag <br> for any line breaks inside the "Test Steps", "Expected Result", or "Preconditions" columns. Do NOT use actual newlines (\\n) inside a table cell, or it will completely break the table formatting.

If the user sends a simple, generic greeting (e.g., "hi", "hello", "how are you", "good morning"), politely greet them back and ask how you can help them generate test cases today.

If the user asks questions about the generated test cases, their coverage, or your capabilities (e.g., "are these maximum test cases?", "did you cover positive scenarios?"), answer them naturally and helpfully without strictly following the test case structure for those explanations.

Do not include any extra introductory or concluding conversational text when generating test cases. Only output the test case structure unless responding to a greeting or a specific question about your work/capabilities.`;

export const generateTestCase = async (requirement: string, imageBase64?: string): Promise<string> => {
    const settings = getSettings();
    const provider = settings.activeProvider || "ollama";

    try {
        if (provider === 'openai') {
            const openai = new OpenAI({ apiKey: settings.openAiApiKey });
            const userContent: any[] = [{ type: 'text', text: requirement }];
            if (imageBase64) userContent.push({ type: 'image_url', image_url: { url: imageBase64 } });
            
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userContent }],
                max_tokens: 4000 // Increased limit
            });
            return response.choices[0].message.content || "";
        } 
        else if (provider === 'groq') {
            const groq = new Groq({ apiKey: settings.groqApiKey });
            const userContent: any[] = [{ type: 'text', text: requirement }];
            if (imageBase64) userContent.push({ type: 'image_url', image_url: { url: imageBase64 } });

            const response = await groq.chat.completions.create({
                model: imageBase64 ? 'llama-3.2-11b-vision-preview' : 'llama3-8b-8192',
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userContent }],
                max_tokens: 4000 // Increased limit
            });
            return response.choices[0].message.content || "";
        }
        else if (provider === 'claude') {
            const anthropic = new Anthropic({ apiKey: settings.claudeApiKey });
            const contentArray: any[] = [{ type: 'text', text: requirement }];
            if (imageBase64) {
                const mime_type = imageBase64.substring(imageBase64.indexOf(':') + 1, imageBase64.indexOf(';')) as any;
                const data = imageBase64.split(',')[1];
                contentArray.push({
                    type: 'image',
                    source: { type: 'base64', media_type: mime_type, data: data }
                });
            }
            const response = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 4000, // Increased from 1000
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: contentArray }]
            });
            return (response.content[0] as any).text;
        }
        else if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey });
            const parts: any[] = [{ text: requirement }];
            if (imageBase64) {
                const mimeType = imageBase64.substring(imageBase64.indexOf(':') + 1, imageBase64.indexOf(';'));
                const base64Data = imageBase64.split(',')[1];
                parts.push({
                    inlineData: {
                        mimeType,
                        data: base64Data
                    }
                });
            }
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{ role: 'user', parts }],
                config: {
                    systemInstruction: SYSTEM_PROMPT,
                    maxOutputTokens: 4000 // Increased limit
                }
            });
            return response.text || "";
        }
        else if (provider === 'lmstudio') {
            const client = new OpenAI({ baseURL: settings.lmStudioUrl, apiKey: "lm-studio" });
            const userContent: any[] = [{ type: 'text', text: requirement }];
            if (imageBase64) userContent.push({ type: 'image_url', image_url: { url: imageBase64 } });
            
            const response = await client.chat.completions.create({
                model: 'local-model',
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userContent }],
                max_tokens: 4000 // Added limit for local models
            });
            return response.choices[0].message.content || "";
        }
        else {
            const ollamaBaseUrl = settings.ollamaUrl || "http://localhost:11434";
            const reqBody: any = {
                model: settings.ollamaModel || "llama3",
                system: SYSTEM_PROMPT,
                prompt: requirement,
                stream: false
            };
            if (imageBase64) {
                reqBody.images = [imageBase64.split(',')[1]];
            }
            const response = await axios.post(`${ollamaBaseUrl}/api/generate`, reqBody);
            return response.data.response;
        }
    } catch (error: any) {
        const detail = error?.response?.data?.error || error?.response?.data || error.message;
        console.error("LLM Service Error Detail:", detail);
        throw new Error(`Failed to generate via provider ${provider}: ${detail}`);
    }
}
