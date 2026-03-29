import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [testCases, setTestCases] = useState(() => {
    const saved = localStorage.getItem('tfx_testcases');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [testPlans, setTestPlans] = useState(() => {
    const saved = localStorage.getItem('tfx_testplans');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [stories, setStories] = useState(() => {
    const saved = localStorage.getItem('tfx_stories');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [savedScripts, setSavedScripts] = useState(() => {
    const saved = localStorage.getItem('tfx_saved_scripts');
    return saved ? JSON.parse(saved) : [];
  });

  const [scenarios, setScenarios] = useState(() => {
    const saved = localStorage.getItem('tfx_scenarios');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tfx_theme') || 'dark';
  });

  const defaultSettings = {
    model: { provider: "ollama", id: "llama3:8b-instruct-q4_0", temperature: 0.3, maxTokens: 700, apiKey: "" },
    prompts: { testPlan: "testplan/universal", testCase: "testcase/universal", coverage: "coverage/analysis", codeGen: "codegen/selenium-java" },
    execution: { enableRetry: true, maxRetries: 1, enableQueue: false },
    output: { defaultStatus: "Draft", autoSave: true, jsonValidation: true }
  };

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tfx_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
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

export const useAppStore = () => useContext(AppContext);
