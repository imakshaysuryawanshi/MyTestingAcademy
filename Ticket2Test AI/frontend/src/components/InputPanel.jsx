import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Sparkles, RefreshCw, Layers, Terminal, ChevronRight, Wand2 } from 'lucide-react';

const LOADING_STEPS = [
  { id: 1, label: "Validating Jira Credentials...", percent: 15 },
  { id: 2, label: "Fetching Ticket Context...", percent: 35 },
  { id: 3, label: "Analyzing Requirements...", percent: 55 },
  { id: 4, label: "Generating Test Cases (RalphLoop)...", percent: 85 },
  { id: 5, label: "Finalizing Dashboard...", percent: 98 },
];

const TEMPLATE_OPTIONS = [
  { value: "functional", label: "Functional Testing" },
  { value: "regression", label: "Regression Suite" },
  { value: "smoke", label: "Smoke Testing" },
  { value: "edge", label: "Edge Cases" },
  { value: "security", label: "Security / Penetration" },
  { value: "custom", label: "Custom Prompt" },
];

const InputPanel = ({ onFetch, onGenerate, onError, setLoading, loading, readyToFetch, isDarkMode }) => {
  const [jiraId, setJiraId] = useState('');
  const [template, setTemplate] = useState('functional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const customInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setCurrentStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAction = async () => {
    if (!readyToFetch) {
       onError && onError("⚠️ Please configure Jira credentials in Settings first.");
       return;
    }
    if (!jiraId) return;

    setCurrentStep(0);
    setLoading(true);
    try {
      const resContext = await axios.post('http://localhost:8000/api/jira/fetch-issue', { jira_id: jiraId });
      const data = resContext.data;
      onFetch(data);

      const genPayload = {
        jira_id: data.jira_id,
        template_type: template,
        summary: data.summary,
        description: data.description,
        acceptance_criteria: data.acceptance_criteria,
        issue_type: data.issue_type,
        priority: data.priority,
        components: (data.components || []).join(', ') || 'None',
        custom_prompt: template === 'custom' ? customPrompt : ""
      };
      
      const resGen = await axios.post('http://localhost:8000/api/testcases/generate', genPayload);
      onGenerate(resGen.data.test_cases, jiraId);

    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      onError && onError(`Error: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const activeStep = LOADING_STEPS[currentStep];

  return (
    <div className={`rounded-xl border shadow-sm flex flex-col transition-all duration-500 overflow-hidden ${isDarkMode ? 'bg-[#1e293b]/40 border-[#334155]' : 'bg-white border-[#e9ebf0]'}`}>
       
       <div className="p-8">
          <div className="flex items-end gap-6 w-full max-w-5xl mx-auto">
            {/* Jira Ticket Input */}
            <div className="flex flex-col gap-2 w-[180px]">
               <label className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>Jira Ticket ID</label>
               <div className="relative">
                  <Terminal size={14} className="absolute left-3.5 top-3.5 opacity-40" />
                  <input 
                    value={jiraId}
                    onChange={(e) => setJiraId(e.target.value.toUpperCase())}
                    className={`w-full border rounded-lg text-[15px] font-semibold pl-10 pr-4 py-3 outline-none transition-all ${isDarkMode ? 'bg-[#0f172a] border-[#334155] text-white focus:border-[#3b82f6]' : 'bg-[#f4f5f7] border-transparent text-[#172b4d] focus:border-[#0f3b9c]'}`}
                    placeholder="QA-123"
                  />
               </div>
            </div>

            {/* Template Selector */}
            <div className="flex flex-col gap-2 flex-1">
               <label className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>Template Selector</label>
               <div className="relative">
                 <select 
                   value={template}
                   onChange={(e) => setTemplate(e.target.value)}
                   className={`w-full border rounded-lg text-[14px] font-medium px-4 py-3 outline-none appearance-none cursor-pointer transition-all ${isDarkMode ? 'bg-[#0f172a] border-[#334155] text-white focus:border-[#3b82f6]' : 'bg-[#f4f5f7] border-transparent text-[#172b4d] focus:border-[#0f3b9c]'}`}
                 >
                   {TEMPLATE_OPTIONS.map(opt => (
                     <option key={opt.value} value={opt.value}>{opt.label}</option>
                   ))}
                 </select>
                 <div className="absolute right-3 top-3.5 pointer-events-none opacity-40">
                   <Layers size={14} />
                 </div>
               </div>
            </div>

            {/* Action Button */}
            <button 
              onClick={handleAction}
              disabled={loading || !jiraId}
              className={`h-[48px] px-8 rounded-lg font-bold text-[14px] flex items-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-30 ${isDarkMode ? 'bg-[#3b82f6] text-white' : 'bg-[#0f3b9c] text-white hover:bg-[#0c2f7a]'}`}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {loading ? 'Processing...' : 'Generate Cases'}
            </button>
          </div>

          {/* Collapsible Custom Prompt Input */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${template === 'custom' ? 'max-h-[200px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
             <div className="w-full max-w-5xl mx-auto flex flex-col gap-2">
                <div className="flex items-center gap-2">
                   <ChevronRight size={14} className="text-[#3b82f6]" />
                   <label className={`text-[10px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>Custom Instructions</label>
                </div>
                <textarea
                  ref={customInputRef}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Generate cases in Gherkin-style, focus on accessibility for keyboard users..."
                  className={`w-full h-24 p-4 border rounded-lg text-[13px] outline-none transition-all resize-none ${isDarkMode ? 'bg-[#0f172a] border-[#334155] text-white focus:border-[#3b82f6] placeholder-[#475569]' : 'bg-[#f4f5f7] border-transparent text-[#172b4d] focus:border-[#0f3b9c]'}`}
                />
             </div>
          </div>

          {loading && (
            <div className="w-full max-w-5xl mx-auto mt-10">
              <div className="flex justify-between items-center mb-3">
                <div className={`flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-[#60a5fa]' : 'text-[#102a5e]'}`}>
                   <RefreshCw size={12} className="animate-spin" /> {activeStep.label}
                </div>
                <span className={`text-[11px] font-bold ${isDarkMode ? 'text-[#60a5fa]' : 'text-[#102a5e]'}`}>{activeStep.percent}%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#edf2ff]'}`}>
                <div 
                  style={{ width: `${activeStep.percent}%` }}
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(59,130,246,0.5)] ${isDarkMode ? 'bg-[#3b82f6]' : 'bg-[#0f3b9c]'}`}
                ></div>
              </div>
            </div>
          )}
       </div>
    </div>
  );
};

export default InputPanel;
