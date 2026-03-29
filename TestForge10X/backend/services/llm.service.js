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
    const provider = await this._resolveProvider();
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

    try {
      const antiHalucRules = fs.readFileSync(path.resolve(process.cwd(), 'prompts/anti_hallucination_rules.md'), 'utf-8');
      compiledPrompt += `\n\n${antiHalucRules}`;
    } catch (e) {}

    const model = overrideOptions.model || process.env.DEFAULT_MODEL || 'llama3-8b-8192';
    const temperature = overrideOptions.temperature ?? parseFloat(process.env.DEFAULT_TEMPERATURE || '0.3');
    const maxTokens   = overrideOptions.maxTokens   ?? parseInt(process.env.DEFAULT_MAX_TOKENS    || '700');

    console.log(`[LLMService] Generating: ${promptAlias}`);
    const raw = await provider.generate(compiledPrompt, model, { temperature, maxTokens });
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
    try {
      return JSON.parse(text);
    } catch {
      try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i) || 
                          text.match(/```\s*([\s\S]*?)```/i) ||
                          text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) {
          const content = jsonMatch[1] || jsonMatch[0];
          return JSON.parse(content.trim());
        }
      } catch (e) {}
    }
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

    return this.run('testplan/test-plan-generator', { TITLE: contextTitle, ACCEPTANCE_CRITERIA: contextCriteria }); 
  }
  
  async generateTestCases(story) { 
    return this.run('testcase/testcase-generator', { INPUT_DATA: story }); 
  }
  
  async generateUserStories(input) { 
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

  async generateScenarios(story) { 
    // Align with testscenarios/test-scenario.md (STORY, AC)
    const storyTitle = typeof story === 'string' ? story : (story.title || '');
    const storyAC    = typeof story === 'string' ? '' : (Array.isArray(story.acceptance_criteria) ? story.acceptance_criteria.join("\n") : (story.acceptance_criteria || ''));
    
    return this.run('testscenarios/test-scenario', { STORY: storyTitle, AC: storyAC }); 
  }

  async analyzeCoverage(cases, story = "") { 
    return this.run('coverage/analysis', { TEST_CASES: cases, USER_STORY: story }); 
  }

  async generateCode(testCaseData) { 
    const title = typeof testCaseData === 'string' ? testCaseData : (testCaseData.title || testCaseData.Description || 'Test');
    const steps = testCaseData.steps || testCaseData.Steps || [];
    const elements = testCaseData.elements || [];
    const url = testCaseData.url || "";

    return this.run('codegen/selenium-java', { 
      TITLE: title, 
      STEPS: JSON.stringify(steps), 
      ELEMENTS: JSON.stringify(elements),
      URL: url
    }); 
  }

  async analyzeURL(url) { 
    try {
        const scrapedData = await scraperService.scrape(url);
        
        // If scraping returned 0 elements (blocked/timeout), pass URL directly to AI
        const hasElements = scrapedData.elements && scrapedData.elements.length > 0;
        const uiData = hasElements 
            ? JSON.stringify(scrapedData.elements, null, 2)
            : `Could not scrape DOM. Analyze the URL "${url}" and infer UI elements based on the domain name, page title: "${scrapedData.title}" and common UX patterns for this type of site.`;

        const intelligence = await this.run('DOM Intelligence Layer/phase-web-scraping-dom', { 
            URL: url,
            UI_DATA: uiData 
        });
        return {
            url: url,
            title: scrapedData.title || url,
            elements: hasElements ? scrapedData.elements : [],
            intelligence: intelligence
        };
    } catch (err) {
        console.error('[analyzeURL] Fatal error:', err.message);
        return { url, elements: [], error: "Scraping failed." };
    }
  }
}

export const llmService = new LLMService();
