/**
 * 🔥 LLM Service — Main Engine
 * 
 * Central orchestrator for all AI inference across the TestForgeX platform.
 */

import { ollamaProvider } from '../providers/ollama.provider.js';
import { groqProvider }   from '../providers/groq.provider.js';
import { grokProvider }   from '../providers/grok.provider.js';
import { promptLoader }   from '../src/utils/promptLoader.js';
import { scraperService } from './scraper.service.js';
import { detectHallucination } from './validation.service.js';
import fs from 'fs';
import path from 'path';

const PROVIDERS = {
  ollama: ollamaProvider,
  groq:   groqProvider,
  grok:   grokProvider,
};

const FALLBACK_CHAIN = ['groq', 'grok', 'ollama'];

class LLMService {
  constructor() {
    this.preferredProvider = process.env.LLM_PROVIDER || 'ollama';
  }

  async _resolveProvider() {
    const preferred = PROVIDERS[this.preferredProvider];
    if (preferred && await preferred.isAvailable()) return preferred;

    for (const name of FALLBACK_CHAIN) {
      if (name === this.preferredProvider) continue;
      const provider = PROVIDERS[name];
      if (provider && await provider.isAvailable()) {
        console.warn(`[LLMService] Fallback to "${name}".`);
        return provider;
      }
    }
    throw new Error('[LLMService] No available provider.');
  }

  async run(promptAlias, variables = {}, overrideOptions = {}) {
    let provider = null;
    
    // Phase 24: Runtime Provider Override
    if (overrideOptions.provider && PROVIDERS[overrideOptions.provider]) {
        provider = PROVIDERS[overrideOptions.provider];
        if (!(await provider.isAvailable(overrideOptions.ollamaUrl))) {
            if (overrideOptions.provider === 'groq') throw new Error("Groq API key is missing. Please add GROQ_API_KEY to your backend .env file.");
            if (overrideOptions.provider === 'grok') throw new Error("Grok / xAI API key is missing. Please add XAI_API_KEY to your backend .env file.");
            throw new Error(`Requested AI provider '${overrideOptions.provider}' is unreachable on ${overrideOptions.ollamaUrl || 'default port'}. Please verify it is running.`);
        }
    } else {
        provider = await this._resolveProvider();
    }

    const preparedVars = this._prepareVars(variables);

    let compiledPrompt;
    try {
      compiledPrompt = promptLoader.getPrompt(promptAlias, preparedVars);
    } catch {
      try {
        const fileContent = fs.readFileSync(path.resolve(process.cwd(), 'prompts', promptAlias + '.md'), 'utf-8');
        let temp = fileContent;
        for (const [key, value] of Object.entries(preparedVars)) {
          temp = temp.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        compiledPrompt = temp;
      } catch {
        compiledPrompt = promptAlias;
      }
    }

    if (!promptAlias.includes('DOM Intelligence Layer')) {
      try {
        const antiHalucRules = fs.readFileSync(path.resolve(process.cwd(), 'prompts/anti_hallucination_rules.md'), 'utf-8');
        compiledPrompt += `\n\n${antiHalucRules}`;
      } catch (e) {}
    }

    const model = overrideOptions.id || process.env.DEFAULT_MODEL || 'llama3-8b-8192';
    const temperature = overrideOptions.temperature ?? parseFloat(process.env.DEFAULT_TEMPERATURE || '0.3');
    const maxTokens   = overrideOptions.maxTokens   ?? parseInt(process.env.DEFAULT_MAX_TOKENS    || '700');
    // For Ollama custom local host
    const url         = overrideOptions.ollamaUrl   || undefined;

    console.log(`[LLMService] Generating via ${provider.name} | Model: ${model} | URL: ${url} | Prompt: ${promptAlias}`);
    const raw = await provider.generate(compiledPrompt, model, { temperature, maxTokens, url });
    const parsed = this._tryParseJSON(raw);

    // AI Anti-Hallucination Guardrail (Phase: Implementation)
    const validation = detectHallucination(typeof parsed === 'object' ? JSON.stringify(parsed) : parsed, preparedVars);
    if (validation.isHallucinated) {
      console.warn(`[LLMService] Potential Hallucination in "${promptAlias}": ${validation.reason}`);
      // Attach as metadata if object
      if (typeof parsed === 'object' && parsed !== null) {
        parsed._validation = validation;
      }
    }

    return parsed;
  }

  _tryParseJSON(text) {
    if (!text || typeof text !== 'string') return text;

    // 1. Direct parse
    try { return JSON.parse(text); } catch {}

    // 2. Extract from ```json ... ``` fences
    try {
      const fenced = text.match(/```json\s*([\s\S]*?)```/i) ||
                     text.match(/```\s*([\s\S]*?)```/i);
      if (fenced) return JSON.parse((fenced[1] || fenced[0]).trim());
    } catch {}

    // 3. Extract from anti-hallucination wrapper sections
    // LLM wraps JSON in: ## Generated Output:\n\n{...}\n\n## Self-Validation
    try {
      const sectionMatch = text.match(/##\s*Generated Output[:\s]*([\s\S]*?)(?:##|$)/i);
      if (sectionMatch) {
        const inner = sectionMatch[1].trim();
        const jsonBlock = inner.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonBlock) return JSON.parse(jsonBlock[0]);
      }
    } catch {}

    // 4. Last resort: find the outermost JSON object or array
    try {
      const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}

    return text;
  }

  _prepareVars(variables) {
    const prepared = {};
    for (const [k, v] of Object.entries(variables || {})) {
      prepared[k] = (typeof v === 'object' && v !== null) ? JSON.stringify(v, null, 2) : v;
    }
    return prepared;
  }

  // ── Convenience Wrappers ──────────────────────────────────────────────────
  async generateTestPlan(title, criteria = "") { 
    let contextTitle = title;
    let contextCriteria = criteria;

    // Phase: URL Intelligence Integration
    if (typeof title === 'string' && (title.startsWith('http://') || title.startsWith('https://'))) {
      try {
        console.log(`[LLMService] Auto-scraping URL for Test Plan: ${title}`);
        const scraped = await scraperService.scrape(title);
        const hasElements = scraped.elements && scraped.elements.length > 0;
        
        contextTitle = `App URL: ${title} — ${scraped.title || 'Unknown Page'}`;
        
        const uiContext = hasElements 
            ? `AUTO-SCRAPED ELEMENTS:\n${JSON.stringify(scraped.elements, null, 2)}` 
            : `Could not scrape DOM due to bot protection. Please infer common features and testing requirements based on standard industry UX patterns for the domain "${title}".`;
            
        contextCriteria = `${uiContext}\n\nUser Input Criteria: ${criteria}`;
      } catch (err) {
        console.warn(`[LLMService] Scrape failed for ${title}, proceeding with raw Title.`);
      }
    }

    return this.run('testplan/test-plan-generator', { TITLE: contextTitle, ACCEPTANCE_CRITERIA: contextCriteria }, options); 
  }
  
  async generateTestCases(story, options = {}) { 
    return this.run('testcase/testcase-generator', { INPUT_DATA: story }, options); 
  }
  
  async generateUserStories(input, options = {}) { 
    let context = input;

    // Phase: URL Intelligence Integration
    // If input looks like a URL, scrape it first to provide real context to the AI
    if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
      try {
        console.log(`[LLMService] Auto-scraping URL for User Stories: ${input}`);
        const scraped = await scraperService.scrape(input);
        const hasElements = scraped.elements && scraped.elements.length > 0;
        
        const uiContext = hasElements 
            ? `UI ELEMENTS DETECTED:\n${JSON.stringify(scraped.elements, null, 2)}` 
            : `Could not scrape DOM due to bot protection. Please infer common features, user stories, and acceptance criteria based on standard industry UX patterns for the domain "${input}" and page title "${scraped.title}".`;
            
        context = `URL: ${input}\nPAGE TITLE: ${scraped.title || 'Unknown Page'}\n\n${uiContext}`;
      } catch (err) {
        console.warn(`[LLMService] Scrape failed for ${input}, proceeding with raw URL.`);
      }
    }

    return this.run('userstory/userstory-engine', { INPUT_DATA: context }); 
  }

  async generateScenarios(story, options = {}) { 
    // Align with testscenarios/test-scenario.md (STORY, AC)
    const storyTitle = typeof story === 'string' ? story : (story.title || '');
    const storyAC    = typeof story === 'string' ? '' : (Array.isArray(story.acceptance_criteria) ? story.acceptance_criteria.join("\n") : (story.acceptance_criteria || ''));
    
    return this.run('testscenarios/test-scenario', { STORY: storyTitle, AC: storyAC }, options); 
  }

  async generateApiScenarios(story, options = {}) {
    // Build a rich string representation of the user story for the prompt
    let userStoryText;
    if (typeof story === 'string') {
      userStoryText = story;
    } else {
      const title = story.title || 'Untitled Story';
      const desc  = story.description || '';
      const ac    = Array.isArray(story.acceptance_criteria)
        ? story.acceptance_criteria.join('\n')
        : (story.acceptance_criteria || '');
      userStoryText = `Title: ${title}\nDescription: ${desc}\nAcceptance Criteria:\n${ac}`;
    }
    return this.run('api/api-test-scenario', { USER_STORY: userStoryText }, options);
  }

  async generateApiTestCases(apiData, options = {}) {
    // Sanitize input — remove anti-hallucination artifacts before sending to LLM
    let cleanData = typeof apiData === 'string' ? apiData : { ...apiData };
    if (typeof cleanData === 'object') {
      const stripLabel = (v) => (typeof v === 'string'
        ? v.replace(/Inference\s*\(low confidence\)\s*[-–]?\s*/gi, '').trim()
        : v);
      cleanData.endpoint_hint = stripLabel(cleanData.endpoint_hint);
      cleanData.endpoint      = stripLabel(cleanData.endpoint);
      cleanData.title         = stripLabel(cleanData.title);
      cleanData.description   = stripLabel(cleanData.description);
    }
    const apiDataText = typeof cleanData === 'string' ? cleanData : JSON.stringify(cleanData, null, 2);
    return this.run('api/api-test-case', { INPUT_DATA: apiDataText }, options);
  }

  async analyzeCoverage(cases, story = "", options = {}) { 
    return this.run('coverage/analysis', { TEST_CASES: cases, USER_STORY: story }, options); 
  }

  async generateCode(testCaseData, options = {}) { 
    const title = typeof testCaseData === 'string' ? testCaseData : (testCaseData.title || testCaseData.Description || 'Test');
    const steps = testCaseData.steps || testCaseData.Steps || [];
    const elements = testCaseData.elements || [];
    const url = testCaseData.url || "";

    return this.run('codegen/selenium-java', { 
      TITLE: title, 
      STEPS: JSON.stringify(steps), 
      ELEMENTS: JSON.stringify(elements),
      URL: url
    }, options); 
  }

  async analyzeURL(url, options = {}) { 
    try {
        const scrapedData = await scraperService.scrape(url);
        
        // If scraping returned 0 elements (blocked/timeout), pass URL directly to AI
        const hasElements = scrapedData.elements && scrapedData.elements.length > 0;
        const isBlocked = scrapedData.status >= 400 || (scrapedData.title === 'Blocked / Unavailable');

        const contextInfo = isBlocked
            ? `The scraper was blocked (Status: ${scrapedData.status}). Use only the page title "${scrapedData.title}" and the domain name to infer common e-commerce/SaaS features for this site.`
            : hasElements 
                ? JSON.stringify(scrapedData.elements, null, 2)
                : `No specific UI elements were found but scraping was successful. Infer common features for "${scrapedData.title}".`;

        const intelligence = await this.run('DOM Intelligence Layer/phase-web-scraping-dom', { 
            URL: url,
            UI_DATA: contextInfo 
        }, options);
        
        let finalIntel = intelligence;
        if (typeof intelligence === 'string') {
            const cleanSummary = intelligence.length > 300 
                ? `An application detected at ${url}. It likely follows standard industry patterns for ${scrapedData.title}.`
                : intelligence;

            finalIntel = {
               app_type: isBlocked ? "Auto-Inferred System" : "Web Portal",
               complexity: "Inferred",
               features: ["Standard portal features"],
               flows: ["Primary user exploration"],
               raw_summary: cleanSummary
            };
        }

        return {
            url: url,
            title: scrapedData.title || url,
            status: scrapedData.status,
            elements: scrapedData.elements || [],
            intelligence: finalIntel || {}
        };
    } catch (err) {
        console.error('[analyzeURL] Inference error:', err.message);
        return { 
          url, 
          elements: [], 
          status: 500, 
          error: err.message,
          intelligence: {
            app_type: "Error during analysis",
            features: ["Check network / API keys"],
            flows: ["No flows detected"],
            raw_summary: `Deep intelligence failed: ${err.message}`
          }
        };
    }
  }
}

export const llmService = new LLMService();
