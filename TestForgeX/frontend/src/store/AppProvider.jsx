import React, { useState, useEffect } from 'react';
import { AppContext } from './AppContext';

export function AppProvider({ children }) {
  const [testCases, setTestCases] = useState(() => {
    try { const saved = localStorage.getItem('tfx_testcases'); const p = saved ? JSON.parse(saved) : []; return Array.isArray(p) ? p : []; } catch { return []; }
  });
  
  const [testPlans, setTestPlans] = useState(() => {
    try { const saved = localStorage.getItem('tfx_testplans'); const p = saved ? JSON.parse(saved) : []; return Array.isArray(p) ? p : []; } catch { return []; }
  });
  
  const [stories, setStories] = useState(() => {
    try { const saved = localStorage.getItem('tfx_stories'); const p = saved ? JSON.parse(saved) : []; return Array.isArray(p) ? p : []; } catch { return []; }
  });
  
  const [savedScripts, setSavedScripts] = useState(() => {
    try { const saved = localStorage.getItem('tfx_saved_scripts'); const p = saved ? JSON.parse(saved) : []; return Array.isArray(p) ? p : []; } catch { return []; }
  });

  const [scenarios, setScenarios] = useState(() => {
    try { const saved = localStorage.getItem('tfx_scenarios'); const p = saved ? JSON.parse(saved) : []; return Array.isArray(p) ? p : []; } catch { return []; }
  });

  const [apiScenarios, setApiScenarios] = useState(() => {
    try { const saved = localStorage.getItem('tfx_api_scenarios'); const p = saved ? JSON.parse(saved) : []; return Array.isArray(p) ? p : []; } catch { return []; }
  });

  const [apiTestCases, setApiTestCases] = useState(() => {
    try { const saved = localStorage.getItem('tfx_api_testcases'); const p = saved ? JSON.parse(saved) : []; return Array.isArray(p) ? p : []; } catch { return []; }
  });
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tfx_theme') || 'dark';
  });
  
  const [scrapedElements, setScrapedElements] = useState(() => {
    try { const saved = localStorage.getItem('tfx_scraped_elements'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const defaultSettings = {
    model: { provider: "groq", id: "llama-3.3-70b-versatile", temperature: 0.3, maxTokens: 2048, apiKey: "", ollamaUrl: "http://127.0.0.1:11434" },
    prompts: { testPlan: "testplan/universal", testCase: "testcase/universal", coverage: "coverage/analysis", codeGen: "codegen/selenium-java", apiScenario: "api/api-test-scenario", apiTestCase: "api/api-test-case" },
    execution: { enableRetry: true, maxRetries: 1, enableQueue: false },
    output: { defaultStatus: "Draft", autoSave: true, jsonValidation: true }
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('tfx_settings');
      if (!saved) return defaultSettings;
      
      const parsed = JSON.parse(saved);
      if (parsed.model && (parsed.model.id === "llama3:8b-instruct-q4_0" || parsed.model.id === "llama3-8b-8192")) {
        parsed.model.id = "llama3:latest";
      }
      if (parsed.model && parsed.model.id === "llama3-70b-8192") {
        parsed.model.id = "llama-3.3-70b-versatile";
      }
      if (parsed.model && parsed.model.ollamaUrl === "http://localhost:11434") {
        parsed.model.ollamaUrl = "http://127.0.0.1:11434";
      }
      return {
        ...defaultSettings,
        ...parsed,
        model: { ...defaultSettings.model, ...parsed.model },
        prompts: { ...defaultSettings.prompts, ...parsed.prompts },
        execution: { ...defaultSettings.execution, ...parsed.execution },
        output: { ...defaultSettings.output, ...parsed.output }
      };
    } catch (e) {
      console.error("Corrupted settings in localStorage:", e);
      return defaultSettings;
    }
  });
  
  // System Notifications (Toast)
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('tfx_testcases', JSON.stringify(testCases));
  }, [testCases]);

  useEffect(() => {
    localStorage.setItem('tfx_testplans', JSON.stringify(testPlans));
  }, [testPlans]);

  useEffect(() => {
    localStorage.setItem('tfx_stories', JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem('tfx_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('tfx_saved_scripts', JSON.stringify(savedScripts));
  }, [savedScripts]);

  useEffect(() => {
    localStorage.setItem('tfx_scenarios', JSON.stringify(scenarios));
  }, [scenarios]);

  useEffect(() => {
    localStorage.setItem('tfx_api_scenarios', JSON.stringify(apiScenarios));
  }, [apiScenarios]);

  useEffect(() => {
    localStorage.setItem('tfx_api_testcases', JSON.stringify(apiTestCases));
  }, [apiTestCases]);
  
  useEffect(() => {
    localStorage.setItem('tfx_scraped_elements', JSON.stringify(scrapedElements));
  }, [scrapedElements]);

  useEffect(() => {
    localStorage.setItem('tfx_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AppContext.Provider value={{
      testCases, setTestCases,
      testPlans, setTestPlans,
      stories, setStories,
      scenarios, setScenarios,
      apiScenarios, setApiScenarios,
      apiTestCases, setApiTestCases,
      scrapedElements, setScrapedElements,
      savedScripts, setSavedScripts,
      settings, setSettings,
      theme, setTheme,
      toast, showToast
    }}>
      {children}
      {/* Toast Notification renderer */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50 text-white font-medium ${
          toast.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : 
          toast.type === 'info' ? 'bg-blue-500/10 border-blue-500 text-blue-400' :
          'bg-accent/10 border-accent text-accent'
        }`}>
          {toast.message}
        </div>
      )}
    </AppContext.Provider>
  );
}
