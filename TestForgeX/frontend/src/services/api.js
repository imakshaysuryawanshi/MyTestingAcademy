/**
 * Global API Service (Phase 26: Deduplication & Robustness)
 * Centralizes all AI interactions with auto-retries, timeouts, and JSON structural repair.
 */

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://backend-three-hazel-12.vercel.app';

// Aggressively extract and parse JSON from noisy AI text
const safeParse = (data) => {
  if (typeof data !== 'string') return data;
  
  let text = data.trim();
  if (!text) return null;

  const repairJson = (str) => {
    let s = str.trim();
    const lastBrace = s.lastIndexOf('}');
    const lastBracket = s.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);
    if (end !== -1 && end < s.length - 1) s = s.substring(0, end + 1);

    let openBraces = 0, openBrackets = 0, inString = false;
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

  try { return JSON.parse(text); } catch {}

  let cleanText = text;
  if (text.includes('```')) {
      const startMatch = text.match(/```(?:json)?\s*/i);
      if (startMatch) {
          const startIndex = startMatch.index + startMatch[0].length;
          const endMatch = text.indexOf('```', startIndex);
          cleanText = endMatch !== -1 ? text.substring(startIndex, endMatch).trim() : text.substring(startIndex).trim();
      }
  }
  
  try { return JSON.parse(cleanText); } catch {}
  try { return JSON.parse(repairJson(cleanText)); } catch {}

  try {
    const firstObj = cleanText.indexOf('{');
    const firstArr = cleanText.indexOf('[');
    const start = (firstObj !== -1 && (firstArr === -1 || firstObj < firstArr)) ? firstObj : firstArr;
    if (start !== -1) {
      const lastObj = cleanText.lastIndexOf('}');
      const lastArr = cleanText.lastIndexOf(']');
      const end = Math.max(lastObj, lastArr);
      if (end === -1 || end < start) {
          try { return JSON.parse(repairJson(cleanText.substring(start))); } catch {}
      } else {
          const potentialJson = cleanText.substring(start, end + 1);
          try { return JSON.parse(potentialJson); } catch {}
          try { return JSON.parse(repairJson(potentialJson)); } catch {}
      }
    }
  } catch {}
  return data; 
};

/** Standard artifact extractor */
const extractArtifactList = (data, keys = []) => {
    if (!data) return [];
    let obj = typeof data === 'string' ? safeParse(data) : data;
    if (!obj) return [];

    if (typeof obj === 'string') {
        const match = obj.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (match) {
            try {
                const repaired = safeParse(match[0]);
                if (repaired && typeof repaired === 'object') return extractArtifactList(repaired, keys);
            } catch {}
        }
        return [{ title: "Generated Output (unformatted)", description: obj }];
    }

    if (Array.isArray(obj)) return obj;

    const commonKeys = [...keys, 'test_cases', 'test_scenarios', 'scenarios', 'test_plan', 'cases', 'data', 'result', 'Generated Output'];
    for (const k of commonKeys) {
        if (Array.isArray(obj[k])) return obj[k];
        if (obj[k] && typeof obj[k] === 'object') {
            const nested = extractArtifactList(obj[k], keys);
            if (nested && nested.length > 0) return nested;
        }
    }
    for (const k in obj) {
        if (Array.isArray(obj[k]) && obj[k].length > 0) return obj[k];
    }
    if (typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length > 0) return [obj];
    return [];
};

const getInferenceConfig = () => {
  try {
    const saved = localStorage.getItem('tfx_settings');
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed.model || { provider: "groq", id: "llama-3.3-70b-versatile", temperature: 0.3, maxTokens: 3000 };
  } catch { return { provider: "groq", id: "llama-3.3-70b-versatile", temperature: 0.3, maxTokens: 3000 }; }
};

const fetchWithRetry = async (fn, retries = 1, timeoutMs = 30000) => {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await fn(controller.signal);
      clearTimeout(id);
      return result;
    } catch (err) {
      clearTimeout(id);
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
};

export const api = {
  extractArtifactList,
  
  // Jira fetch
  fetchJira: async (issueId, creds) => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/jira/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, creds }),
        signal
      });
      const json = await response.json();
      if (json.success) return { success: true, data: json.data };
      throw new Error(json.error || 'Failed to fetch Jira story');
    });
  },

  // Jira Generate Suite
  generateJiraArtifacts: async (issueData) => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/jira/generate-artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueData, settings: getInferenceConfig() }),
        signal
      });
      const json = await response.json();
      if (json.success) {
          const raw = json.data;
          let parsed = typeof raw === 'string' ? safeParse(raw) : raw;
          if (typeof parsed === 'string') {
              const testCasesMatch = parsed.match(/"test_cases"\s*:\s*(\[[\s\S]*?\])/) || parsed.match(/"test_cases"\s*:\s*(\[[\s\S]*)/);
              const testPlanMatch = parsed.match(/"test_plan"\s*:\s*(\{[\s\S]*?\})/) || parsed.match(/"test_plan"\s*:\s*(\{[\s\S]*)/);
              const scenariosMatch = parsed.match(/"test_scenarios"\s*:\s*(\[[\s\S]*?\])/) || parsed.match(/"test_scenarios"\s*:\s*(\[[\s\S]*)/);
              const obj = {};
              if (testCasesMatch) { const cleaned = safeParse(testCasesMatch[1]); if (cleaned && typeof cleaned === 'object') obj.test_cases = cleaned; }
              if (testPlanMatch) { const cleaned = safeParse(testPlanMatch[1]); if (cleaned && typeof cleaned === 'object') obj.test_plan = cleaned; }
              if (scenariosMatch) { const cleaned = safeParse(scenariosMatch[1]); if (cleaned && typeof cleaned === 'object') obj.test_scenarios = cleaned; }
              if (Object.keys(obj).length > 0) parsed = obj;
          }
          return { success: true, data: parsed };
      }
      throw new Error(json.error || 'Failed to generate artifacts');
    }, 1, 60000);
  },

  // User Stories
  generateUserStories: async (sourceType, input) => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/userstory/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, sourceType, settings: getInferenceConfig() }),
        signal
      });
      const json = await response.json();
      if (json.success) return json;
      throw new Error(json.error || 'Failed to generate stories');
    }, 1, 60000);
  },

  // Test Plan
  generateTestPlan: async (title, criteria = "") => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/testplan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, criteria, settings: getInferenceConfig() }),
        signal
      });
      const json = await response.json();
      if (json.success) return json;
      throw new Error(json.error || 'Failed to generate test plan');
    });
  },

  // Test Scenarios
  generateScenarios: async (story) => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/scenarios/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, settings: getInferenceConfig() }),
        signal
      });
      const json = await response.json();
      if (json.success) return { success: true, data: extractArtifactList(json.data, ['test_scenarios', 'scenarios']) };
      throw new Error(json.error || 'Failed to generate scenarios');
    });
  },

  // Test Cases
  generateTestCases: async (story) => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/testcases/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, settings: getInferenceConfig() }),
        signal
      });
      const json = await response.json();
      if (json.success) return { success: true, data: extractArtifactList(json.data, ['test_cases', 'cases']) };
      throw new Error(json.error || 'Failed to generate test cases');
    });
  },

  // API Scenarios
  generateApiScenarios: async (story) => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/api-scenarios/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, settings: getInferenceConfig() }),
        signal
      });
      const json = await response.json();
      // We return the raw data object to preserve api_testing_required and reason fields
      if (json.success) return { success: true, data: json.data };
      throw new Error(json.error || 'Failed to generate API scenarios');
    });
  },

  // API Test Cases
  generateApiTestCases: async (apiData) => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/api-testcases/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiData, settings: getInferenceConfig() }),
        signal
      });
      const json = await response.json();
      if (json.success) return { success: true, data: extractArtifactList(json.data) };
      throw new Error(json.error || 'Failed to generate API test cases');
    });
  },

  // Code Gen
  generateCode: async (testCaseTitle) => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/codegen/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCaseTitle, settings: getInferenceConfig() }),
        signal
      });
      const json = await response.json();
      if (json.success) return json;
      throw new Error(json.error || 'Failed to generate code');
    }, 1, 60000);
  },

  // Coverage Analysis
  analyzeCoverage: async (testCases, story) => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/coverage/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases, story, settings: getInferenceConfig() }),
        signal
      });
      const json = await response.json();
      if (json.success) return json;
      throw new Error(json.error || 'Failed to analyze coverage');
    });
  },

  // URL Analyze
  analyzeURL: async (url) => {
    return fetchWithRetry(async (signal) => {
      const response = await fetch(`${API_BASE_URL}/api/url/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, settings: getInferenceConfig() }),
        signal
      });
      const json = await response.json();
      if (json.success) return json;
      throw new Error(json.error || 'Failed to analyze URL');
    }, 1, 60000);
  }
};
