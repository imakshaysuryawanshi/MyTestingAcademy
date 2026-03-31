import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env'), override: true });

import { ollamaProvider } from '../providers/ollama.provider.js';
import { groqProvider }   from '../providers/groq.provider.js';
import { grokProvider }   from '../providers/grok.provider.js';
import { promptLoader }   from '../src/utils/promptLoader.js';
import { scraperService } from './scraper.service.js';
import { detectHallucination } from './validation.service.js';
import fs from 'fs';

const PROVIDERS = {
  ollama: ollamaProvider,
  groq:   groqProvider,
  grok:   grokProvider,
};

const FALLBACK_CHAIN = ['groq', 'grok', 'ollama'];

// Phase 25: Smart Routing — Auto-lock provider based on standard model IDs
const MODEL_PROVIDER_MAP = {
  'llama-3.3-70b-versatile': 'groq',
  'llama3-8b-8192':           'groq',
  'mixtral-8x7b-32768':       'groq',
  'gemma2-9b-it':            'groq',
  'grok-beta':               'grok',
  'grok-2':                  'grok',
  'grok-2-mini':             'grok',
};

class LLMService {
  constructor() {
    // Initial guess, will be refined in _resolveProvider
    this.preferredProvider = process.env.LLM_PROVIDER || 'ollama';
  }

  async _resolveProvider() {
    this.preferredProvider = process.env.LLM_PROVIDER || 'ollama';
    const preferred = PROVIDERS[this.preferredProvider];
    // Check if preferred is available AND hasn't been globally disabled by exhaustion tracking
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
    let model = overrideOptions.id || process.env.DEFAULT_MODEL || 'llama3-8b-8192';

    // Phase 25.1: Automatic Provider Discovery (Smart Routing)
    // If the model is uniquely identified by a provider, use it even if not explicitly passed
    let forcedProvider = overrideOptions.provider;
    if (!forcedProvider && MODEL_PROVIDER_MAP[model]) {
        forcedProvider = MODEL_PROVIDER_MAP[model];
        console.log(`[LLMService] Auto-routing "${model}" to "${forcedProvider}" provider.`);
    }
    
    // Phase 24: Runtime Provider Override
    if (forcedProvider && PROVIDERS[forcedProvider]) {
        provider = PROVIDERS[forcedProvider];
        if (!(await provider.isAvailable(overrideOptions.ollamaUrl))) {
            if (forcedProvider === 'groq') throw new Error("Groq API key is missing. Please add GROQ_API_KEY to your backend .env file.");
            if (forcedProvider === 'grok') throw new Error("Grok / xAI API key is missing. Please add XAI_API_KEY to your backend .env file.");
            throw new Error(`Requested AI provider '${forcedProvider}' is unreachable. Please verify it is running.`);
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

    const temperature = overrideOptions.temperature ?? parseFloat(process.env.DEFAULT_TEMPERATURE || '0.3');
    const maxTokens   = overrideOptions.maxTokens   ?? parseInt(process.env.DEFAULT_MAX_TOKENS    || '700');
    // For Ollama custom local host
    const url         = overrideOptions.ollamaUrl   || undefined;

    console.log(`[LLMService] Generating via ${provider.name} | Model: ${model} | URL: ${url} | Prompt: ${promptAlias}`);
    
    let raw;
    try {
      raw = await provider.generate(compiledPrompt, model, { temperature, maxTokens, url });
    } catch (apiErr) {
      // Phase: Resilience — Daisy-Chain Fallback (70b -> 8b -> Mixtral -> Alt Provider)
      const isRateLimit = apiErr.message.includes('429') || apiErr.message.includes('Rate limit') || apiErr.message.includes('TPD') || apiErr.message.includes('TPM');
      
      if (provider.name === 'groq' && isRateLimit) {
         if (model.includes('3.3-70b') || model.includes('70b')) {
            model = 'llama-3.1-8b-instant';
            console.warn(`[LLMService] Groq Tier 1 Exhausted. Retrying with ${model}...`);
            try {
               raw = await provider.generate(compiledPrompt, model, { temperature, maxTokens: 1000, url });
            } catch {
               model = 'mixtral-8x7b-32768';
               console.warn(`[LLMService] Groq Tier 2 Exhausted. Retrying with ${model}...`);
               raw = await provider.generate(compiledPrompt, model, { temperature, maxTokens: 1500, url });
            }
         } else {
            // If already on a small model and still failing, try Alt Provider
            console.warn(`[LLMService] Groq Completely Exhausted. Trying Grök fallback...`);
            const alt = PROVIDERS.grok;
            if (alt && await alt.isAvailable()) {
                raw = await alt.generate(compiledPrompt, 'grok-beta', { temperature, maxTokens });
            } else {
                throw apiErr;
            }
         }
      } else {
         throw apiErr;
      }
    }

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

    const repair = (str) => {
        let s = str.trim();
        // Remove trailing junk
        const lastBrace = s.lastIndexOf('}');
        const lastBracket = s.lastIndexOf(']');
        const end = Math.max(lastBrace, lastBracket);
        if (end !== -1 && end < s.length - 1) s = s.substring(0, end + 1);

        let openBraces = 0;
        let openBrackets = 0;
        let inString = false;
        for (let i = 0; i < s.length; i++) {
            const char = s[i];
            if (char === '"' && (i === 0 || s[i-1] !== '\\')) inString = !inString;
            if (!inString) {
                if (char === '{') openBraces++;
                if (char === '}') openBraces--;
                if (char === '[') openBrackets++;
                if (char === ']') openBrackets--;
            }
        }
        if (inString) s += '"';
        while (openBrackets > 0) { s += ']'; openBrackets--; }
        while (openBraces > 0) { s += '}'; openBraces--; }
        return s;
    };

    // 1. Direct parse
    try { return JSON.parse(text); } catch {}
    try { return JSON.parse(repair(text)); } catch {}

    // 2. Extract from ```json ... ``` fences (even unclosed)
    let cleanText = text;
    if (text.includes('```')) {
        const startMatch = text.match(/```(?:json)?\s*/i);
        if (startMatch) {
            const startIndex = startMatch.index + startMatch[0].length;
            const endMatch   = text.indexOf('```', startIndex);
            cleanText = endMatch !== -1 ? text.substring(startIndex, endMatch).trim() : text.substring(startIndex).trim();
        }
    }
    try { return JSON.parse(cleanText); } catch {}
    try { return JSON.parse(repair(cleanText)); } catch {}

    // 3. Last resort: find the outermost JSON object or array
    try {
      const firstObj = cleanText.indexOf('{');
      const firstArr = cleanText.indexOf('[');
      const start = (firstObj !== -1 && (firstArr === -1 || firstObj < firstArr)) ? firstObj : firstArr;
      
      if (start !== -1) {
        const lastObj = cleanText.lastIndexOf('}');
        const lastArr = cleanText.lastIndexOf(']');
        const end = Math.max(lastObj, lastArr);
        
        if (end === -1 || end < start) {
            try { return JSON.parse(repair(cleanText.substring(start))); } catch {}
        } else {
            const potentialJson = cleanText.substring(start, end + 1);
            try { return JSON.parse(potentialJson); } catch {}
            try { return JSON.parse(repair(potentialJson)); } catch {}
        }
      }
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
  async generateTestPlan(title, criteria = "", options = {}) { 
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
    // Serialize story object into rich text the prompt can use effectively
    let inputData;
    if (typeof story === 'string') {
      inputData = story;
    } else {
      const acLines = (Array.isArray(story.acceptance_criteria) ? story.acceptance_criteria : [])
        .map((c, i) => `  ${i + 1}. ${typeof c === 'string' ? c : JSON.stringify(c)}`)
        .join('\n');
      inputData = `Title: ${story.title || 'Untitled Story'}
Description: ${story.description || 'No description provided.'}
Acceptance Criteria:
${acLines || '  - None specified'}`;
    }
    return this.run('testcase/testcase-generator', { INPUT_DATA: inputData }, options); 
  }

  async generateJiraArtifacts(issueData, options = {}) {
    const input = `
ID: ${issueData.id}
Title: ${issueData.title}
Description: ${issueData.description}
Acceptance Criteria: ${issueData.acceptanceCriteria}

${issueData.additionalContext ? `ADDITIONAL CONTEXT / REQUIREMENTS:\n${issueData.additionalContext}` : ''}
`;
    return this.run('jira/qa-artifacts', { JIRA_INPUT: input }, options);
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

    return this.run('userstory/userstory-engine', { INPUT_DATA: context }, options); 
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
        const isBlocked = scrapedData.status === 403 || 
                          scrapedData.status === 401 || 
                          (scrapedData.elements.length < 3 && scrapedData.status === 200 && (scrapedData.visible_text.toLowerCase().includes('challenge') || scrapedData.visible_text.toLowerCase().includes('captcha') || scrapedData.visible_text.toLowerCase().includes('blocked'))) ||
                          (scrapedData.elements.length === 0);

        const contextInfo = isBlocked
            ? `The scraper was blocked (Status: ${scrapedData.status}). Use only the page title "${scrapedData.title}" and the domain name to infer common e-commerce/SaaS features for this site. This site is likely a major platform like Amazon/VWO/Razorpay.`
            : (scrapedData.elements.length > 0)
                ? JSON.stringify(scrapedData.elements, null, 2)
                : `No specific UI elements were found but scraping was successful. Page Title: "${scrapedData.title}". Infer features based on this title.`;

        // Step 2: Apply Deep Intelligence (AI Logic)
        let intelligence = null;
        try {
            intelligence = await this.run('DOM Intelligence Layer/phase-web-scraping-dom', { 
                URL: url,
                UI_DATA: contextInfo 
            }, options);
        } catch (intelErr) {
            console.warn('[analyzeURL] Deep Intelligence Layer failed, falling back to basic analysis:', intelErr.message);
            intelligence = {
                app_type: isBlocked ? "Auto-Inferred" : "Legacy Application",
                features: ["Primary functionality mapping"],
                flows: ["User journey exploration"],
                raw_summary: `Deep analysis timed out. Page Title: ${scrapedData.title || url}`
            };
        }
        
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
        console.error('[analyzeURL] Global analysis failure:', err.message);
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
