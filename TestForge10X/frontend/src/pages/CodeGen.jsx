import React, { useState, useEffect } from "react";
import {
  Code, Copy, RefreshCw, Loader2, Play,
  Link2, Tag, AlertCircle, CheckCircle2, Zap,
  Database, Eye, Sparkles, ChevronRight, TerminalSquare, Save, History, Download
} from "lucide-react";
import { api } from "../services/api";
import { useAppStore } from "../store/AppContext";

// ── Element Extraction: Parse stored elements from localStorage (URL Analyzer output) ──
function useAnalyzedElements() {
  const [elements, setElements] = useState([]);
  
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tfx_analyzed_elements");
      setElements(raw ? JSON.parse(raw) : []);
    } catch {
      setElements([]);
    }
    
    const handleStorage = (e) => {
      if (e.key === "tfx_analyzed_elements") {
        try { setElements(e.newValue ? JSON.parse(e.newValue) : []); } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return elements;
}

// ── Resilient key reader (handles both old lowercase & new standardized keys) ──
const tcGet = (tc, ...keys) => {
  if (!tc) return "";
  for (const k of keys) {
    if (tc[k] !== undefined && tc[k] !== null && tc[k] !== "") return tc[k];
  }
  return "";
};

export default function CodeGen() {
  const { testCases = [], showToast, savedScripts, setSavedScripts } = useAppStore();
  const analyzedElements = useAnalyzedElements();

  const [selectedTcId, setSelectedTcId]   = useState("");
  const [manualUrl, setManualUrl]          = useState("");
  const [manualTitle, setManualTitle]      = useState("");
  const [manualSteps, setManualSteps]      = useState("");
  const [useManual, setUseManual]          = useState(false);
  const [useElements, setUseElements]      = useState(true);
  const [loading, setLoading]              = useState(false);
  const [codeOutput, setCodeOutput]        = useState("");

  // Normalize each test case to a consistent shape for display
  const normalizedTCs = testCases.map((tc, idx) => ({
    _raw: tc,
    id:    tcGet(tc, "ID", "TID", "id", "tid", "case_id") || `TC-${String(idx+1).padStart(3,"0")}`,
    title: tcGet(tc, "Description", "description", "Title", "title", "summary") || "Untitled Test",
    steps: (() => { const s = tcGet(tc, "Steps", "steps", "Actions", "actions"); return Array.isArray(s) ? s : (s ? String(s).split(/\||→/).map(x=>x.trim()).filter(Boolean) : []); })(),
    url:   tcGet(tc, "url", "URL", "target_url"),
  }));

  // Selected test case
  const selectedTc = normalizedTCs.find(tc => tc.id === selectedTcId);

  // Derive effective values
  const effectiveUrl   = useManual ? manualUrl   : (selectedTc?.url   || manualUrl);
  const effectiveTitle = useManual ? manualTitle : (selectedTc?.title || "");
  const effectiveSteps = useManual
    ? (manualSteps ? manualSteps.split("\n").filter(Boolean) : [])
    : (selectedTc?.steps || []);

  const payloadToInject = {
    title:    effectiveTitle || "Untitled Test",
    url:      effectiveUrl   || "https://example.com",
    steps:    effectiveSteps,
    elements: useElements ? analyzedElements : []
  };

  const handleGenerate = async () => {
    if (!useManual && !selectedTc) {
      showToast("Please select a test case or switch to manual input.", "error"); 
      return; 
    }
    if (!effectiveUrl) {
      showToast("A Target URL is required for code generation.", "error");
      return;
    }
    if (effectiveSteps.length === 0) {
      showToast("At least one test step is required.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.generateCode(payloadToInject);
      setCodeOutput(res.data || res.content || res.generated_code || "No code generated.");
      showToast(`✓ Automation synthesized. ${payloadToInject.elements.length} mapped locators injected.`, "success");
    } catch (err) {
      showToast("Code Generation failed. Check backend logs.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeOutput);
    showToast("Source code copied to clipboard", "info");
  };

  const handleSave = () => {
    if (!codeOutput) return;
    const newScript = {
      id: Date.now().toString(),
      title: effectiveTitle || "Untitled Script",
      code: codeOutput,
      timestamp: new Date().toISOString()
    };
    setSavedScripts(prev => [newScript, ...prev]);
    showToast("✓ Script saved to local storage!", "success");
  };

  const handleDownload = () => {
    if (!codeOutput) return;
    const blob = new Blob([codeOutput], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(effectiveTitle || "SeleniumTest").replace(/[^a-zA-Z0-9]/g, "_")}.java`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast("✓ Code downloaded", "success");
  };

  return (
    <div className="max-w-7xl mx-auto mt-4 px-4 pb-12 animate-in fade-in zoom-in-95 duration-500">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-border/50 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center relative group overflow-hidden shadow-[0_0_20px_rgba(0,229,255,0.1)]">
            <div className="absolute inset-0 bg-accent/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <TerminalSquare className="text-accent relative z-10" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Code Generator Studio
            </h1>
            <p className="text-sm text-textMuted mt-1 font-medium flex items-center gap-2">
              <Sparkles size={14} className="text-accent"/> Automation Engine · Selenium Java
            </p>
          </div>
        </div>
        
        {analyzedElements.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)] transition-all hover:bg-green-500/20">
            <CheckCircle2 size={16} /> URL Analyzer Cache: {analyzedElements.length} Locators
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── Left Column: Configuration Engine ── */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Mode Segmented Control */}
          <div className="bg-sidebar p-1.5 rounded-2xl border border-border flex shadow-inner">
            <button
              onClick={() => setUseManual(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${!useManual ? "bg-accent text-black shadow-md" : "text-textMuted hover:text-white hover:bg-white/5"}`}
            >
              <Database size={16} /> From Test Case
            </button>
            <button
              onClick={() => setUseManual(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${useManual ? "bg-accent text-black shadow-md" : "text-textMuted hover:text-white hover:bg-white/5"}`}
            >
              <Code size={16} /> Manual Input
            </button>
          </div>

          {/* Configuration Card */}
          <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden backdrop-blur-sm relative transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0 opacity-50"></div>
            
            <div className="p-6 space-y-5">
              {!useManual ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5"><ChevronRight size={14}/> Select Source</label>
                    <select
                      className="input w-full bg-[#0E131A] border-border/80 focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-300 h-11 text-sm font-medium"
                      value={selectedTcId}
                      onChange={e => setSelectedTcId(e.target.value)}
                    >
                      <option value="" className="text-gray-500">-- Choose an existing Test Case --</option>
                      {normalizedTCs.map(tc => (
                        <option key={tc.id} value={tc.id}>[{tc.id}] {tc.title?.substring(0, 50)}{tc.title?.length > 50 ? "…" : ""}</option>
                      ))}
                    </select>
                    {testCases.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-3 flex items-center gap-1.5 bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
                        <AlertCircle size={14} /> No test cases exist. Switch to Manual Mode.
                      </p>
                    )}
                  </div>

                  {selectedTc && (
                    <div className="bg-[#0B0F14] rounded-xl p-4 border border-border/50 relative overflow-hidden group transition-all duration-300 hover:border-accent/30">
                      <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all duration-500"></div>
                      <h3 className="text-sm font-bold text-white mb-3">Payload Context</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-[11px] text-textMuted font-bold uppercase tracking-wider mb-1">Title</p>
                          <p className="text-sm text-gray-200 font-medium">{selectedTc?.title}</p>
                        </div>
                        
                        <div>
                          <p className="text-[11px] text-textMuted font-bold uppercase tracking-wider mb-1">Target URL <span className="text-accent">*</span></p>
                          {selectedTc?.url ? (
                            <div className="flex items-center gap-2 text-sm text-accent bg-accent/5 py-1.5 px-3 rounded-md border border-accent/20 inline-block truncate max-w-full">
                              <Link2 size={12} className="inline mr-1" /> {selectedTc.url}
                            </div>
                          ) : (
                            <div className="flex gap-2 isolate relative group/url">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within/url:text-accent font-medium">
                                <Link2 size={14} className="text-gray-500 transition-colors duration-300" />
                              </div>
                              <input
                                className="input h-10 text-sm pl-9 w-full bg-black/40 border-dashed border-gray-600 focus:border-solid focus:border-accent transition-all duration-300 shadow-inner"
                                placeholder="Override or provide missing URL"
                                value={manualUrl}
                                onChange={e => setManualUrl(e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-[11px] text-textMuted font-bold uppercase tracking-wider mb-1">Injected Steps ({selectedTc?.steps?.length || 0})</p>
                          <div className="max-h-32 overflow-y-auto custom-scrollbar text-xs text-gray-300 space-y-2 bg-black/30 p-3 rounded-lg border border-white/5 shadow-inner">
                            {selectedTc?.steps?.map((s, i) => (
                              <div key={i} className="flex gap-2.5 items-start">
                                <span className="text-accent/60 font-mono text-[10px] mt-0.5 bg-accent/10 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">{i+1}</span>
                                <span className="leading-relaxed">{s}</span>
                              </div>
                            ))}
                            {(!selectedTc?.steps || selectedTc.steps.length === 0) && (
                              <span className="text-yellow-500/80 italic flex items-center gap-1.5"><AlertCircle size={14}/> No steps found in test case.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag size={14}/> Test Identifier
                    </label>
                    <input 
                      className="input w-full bg-[#0E131A] focus:border-accent transition-all duration-300 h-11 text-sm shadow-inner" 
                      placeholder="e.g. Verify User Login Authentication" 
                      value={manualTitle} 
                      onChange={e => setManualTitle(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 size={14}/> Base URL
                    </label>
                    <input 
                      className="input w-full bg-[#0E131A] focus:border-accent transition-all duration-300 h-11 font-mono text-sm text-accent shadow-inner" 
                      placeholder="https://app.example.com" 
                      value={manualUrl} 
                      onChange={e => setManualUrl(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                      Execution Steps
                    </label>
                    <textarea
                      className="input w-full bg-[#0E131A] focus:border-accent transition-all duration-300 min-h-[140px] resize-none font-mono text-sm leading-relaxed shadow-inner"
                      placeholder="Navigate to login page&#10;Enter valid email&#10;Enter password 'pass123'&#10;Click the Dashboard login button&#10;Assert dashboard title is visible"
                      value={manualSteps}
                      onChange={e => setManualSteps(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Phase 22: Locator Intelligence Switch */}
              <div className="mt-6 pt-5 border-t border-border/60">
                <div className="flex items-center justify-between bg-gradient-to-r from-accent/5 to-transparent p-4 rounded-xl border border-accent/10 hover:border-accent/30 transition-all duration-300 group/loc">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap size={16} className={`text-accent ${useElements ? 'fill-accent' : ''} transition-all duration-300`} /> 
                      Locator Intelligence
                    </p>
                    <p className="text-[11px] text-textMuted mt-1 w-64 leading-tight">
                      Bind natural language steps directly to parsed webpage locators.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer scale-110">
                    <input type="checkbox" className="sr-only peer" checked={useElements} onChange={e => setUseElements(e.target.checked)} />
                    <div className="w-11 h-6 bg-sidebar rounded-full peer peer-focus:ring-2 peer-focus:ring-accent/30 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent peer-checked:after:bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
                  </label>
                </div>

                {/* Locator Intelligence Preview */}
                {useElements && (
                  <div className="mt-4 animate-in fade-in zoom-in-95 duration-300">
                    {analyzedElements.length > 0 ? (
                      <div className="bg-[#0B0F14] border border-green-500/20 rounded-xl overflow-hidden shadow-lg">
                        <div className="bg-green-500/10 px-4 py-2.5 flex items-center justify-between border-b border-green-500/20">
                          <div className="flex items-center gap-2">
                            <Eye size={14} className="text-green-400" /> 
                            <span className="text-[11px] font-bold text-green-400 uppercase tracking-widest">Available Mappings</span>
                          </div>
                          <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">{analyzedElements.length}</span>
                        </div>
                        <div className="max-h-44 overflow-y-auto custom-scrollbar p-2 space-y-1 relative">
                          {/* Subtle tech background inside the list */}
                          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#00E5FF 1px, transparent 1px), linear-gradient(90deg, #00E5FF 1px, transparent 1px)", backgroundSize: "10px 10px" }} />
                          {analyzedElements.map((el, i) => (
                            <div key={i} className="flex justify-between items-center text-xs p-2 hover:bg-white/5 rounded-lg transition-colors group/row border border-transparent hover:border-white/5 relative z-10">
                              <span className="text-gray-300 truncate w-[50%] flex items-center gap-2 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent/40 group-hover/row:bg-accent group-hover/row:shadow-[0_0_8px_rgba(0,229,255,0.8)] transition-all"/>
                                {el.text || el.name || "element"}
                              </span>
                              <div className="flex gap-2 items-center">
                                <span className="text-[9px] uppercase text-gray-500 font-bold bg-white/5 px-1.5 py-0.5 rounded tracking-wide border border-white/5">{el.type}</span>
                                <code className="text-accent font-mono bg-[#0F141B] px-2 py-1 rounded shadow-inner border border-[#1A2330] whitespace-nowrap">
                                  {el.id ? `#${el.id}` : el.name ? `[name=${el.name}]` : "dynamic"}
                                </code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-500/80 flex gap-3 shadow-inner">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-yellow-500" />
                        <p className="leading-relaxed font-medium">No analyzed elements in memory. To harness locator intelligence mapping, please run the <strong className="text-yellow-400 font-bold">URL Analyzer</strong> tool first to seed locators into memory.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="pt-3">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`btn w-full h-14 text-sm uppercase tracking-widest font-extrabold flex justify-center items-center gap-3 transition-all duration-300 relative overflow-hidden group ${loading ? "opacity-80 cursor-wait bg-accent/80" : "hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:-translate-y-0.5 active:translate-y-0"}`}
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  {loading ? <Loader2 className="animate-spin text-black" size={20} /> : <Zap size={20} className="fill-black text-black" />}
                  <span className="text-black relative z-10">{loading ? "Synthesizing Architecture..." : "Generate Automation Code"}</span>
                </button>
              </div>

            </div>
          </div>

          {/* Saved Scripts Panel */}
          {savedScripts.length > 0 && (
            <div className="bg-card p-4 flex flex-col rounded-2xl border border-border mt-6 shadow-inner animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-1.5"><History size={14}/> Saved Scripts</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {savedScripts.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-sidebar rounded-lg border border-border group hover:border-accent/30 transition-all cursor-pointer" onClick={() => setCodeOutput(s.code)}>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium text-white truncate">{s.title.replace(/[^a-zA-Z0-9]/g, "_")}.java</span>
                      <span className="text-[10px] text-textMuted">{new Date(s.timestamp).toLocaleString()}</span>
                    </div>
                    <button className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" title="Load Script">
                       <Eye size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Right Column: Code Output ── */}
        <div className="lg:col-span-7 h-full min-h-[600px] lg:min-h-[750px] flex flex-col pt-1.5 pb-1 lg:pb-0">
          <div className="flex-1 bg-[#05070A] border border-[#1A2330] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative group/editor-container transition-all duration-500">
            
            {/* Ambient Background Glow when code is present */}
            {codeOutput && !loading && (
              <div className="absolute -inset-0 bg-gradient-to-br from-accent/5 via-transparent to-green-500/5 pointer-events-none opacity-50 block mix-blend-screen transition-opacity duration-1000" />
            )}

            {/* Code Header Component */}
            <div className="flex items-center justify-between px-4 h-[52px] border-b border-[#1A2330] bg-gradient-to-b from-[#0A0D11] to-[#05070A] z-10">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-inner" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-inner" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-inner" />
                </div>
                <div className="px-3 py-1.5 bg-[#0F141B] rounded-md border border-[#1F2A37] flex items-center gap-2 shadow-inner">
                  <span className="text-blue-400 font-mono text-[9px] font-bold border border-blue-400/30 px-1.5 py-0.5 rounded bg-blue-400/10 uppercase tracking-wider">JAVA</span>
                  <span className="font-mono text-[13px] text-gray-300 truncate max-w-[200px] lg:max-w-[300px] font-medium">
                    {(effectiveTitle || "SeleniumTest").replace(/[^a-zA-Z0-9]/g, "_")}.java
                  </span>
                </div>
              </div>

              {codeOutput && !loading && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <button onClick={handleDownload} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-1.5 transition-all border border-white/5 hover:border-white/10 shadow-sm active:scale-95">
                    <Download size={14} /> Download
                  </button>
                  <button onClick={handleSave} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-1.5 transition-all border border-white/5 hover:border-white/10 shadow-sm active:scale-95">
                    <Save size={14} /> Save
                  </button>
                  <button onClick={handleGenerate} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-1.5 transition-all border border-white/5 hover:border-white/10 shadow-sm active:scale-95">
                    <RefreshCw size={14} /> Re-roll
                  </button>
                  <button onClick={handleCopy} className="px-3 py-1.5 text-xs font-bold text-black bg-accent hover:bg-accent-hover active:scale-95 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                    <Copy size={14} /> Copy Source
                  </button>
                </div>
              )}
            </div>

            {/* Code Display Area */}
            <div className="flex-1 overflow-auto custom-scrollbar relative z-10 bg-[#06080C] shadow-inner">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05070A]/80 backdrop-blur-[2px] z-20 transition-all duration-300">
                  <div className="relative">
                    <div className="absolute inset-0 border-t-2 border-l-2 border-accent rounded-full animate-spin w-20 h-20 opacity-30 shadow-[0_0_15px_rgba(0,229,255,0.2)]" />
                    <div className="absolute inset-2 border-b-2 border-r-2 border-green-400 rounded-full animate-spin w-16 h-16 opacity-50 flex items-center justify-center [animation-duration:1.5s]" />
                    <Code size={28} className="text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" />
                  </div>
                  <div className="mt-10 flex flex-col items-center gap-2">
                    <span className="font-mono text-sm uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-green-400 font-bold animate-pulse">
                      Synthesizing AST & Injection...
                    </span>
                    <span className="text-xs text-textMuted font-mono bg-black/50 px-3 py-1 rounded-full border border-white/5">
                      Mapping {payloadToInject.elements.length} Locators • Applying Java Syntax
                    </span>
                  </div>
                </div>
              ) : codeOutput ? (
                <div className="p-4 md:p-6 w-full group/editor min-h-full">
                  <pre className="font-mono text-[13px] md:text-[14px] text-[#E5E7EB] whitespace-pre font-medium leading-[1.7]">
                    {codeOutput.split('\n').map((line, i) => {
                      // Ultra-rudimentary Java syntax highlighting for visual flair
                      const isComment  = line.trim().startsWith('//');
                      const isImport   = line.trim().startsWith('import');
                      const isPackage  = line.trim().startsWith('package');
                      const isAnnotation = line.trim().startsWith('@');
                      
                      let styledLine = <>{line}</>;
                      
                      if (isComment) styledLine = <span className="text-green-600/80 italic">{line}</span>;
                      else if (isImport || isPackage) styledLine = <span className="text-blue-400/90">{line}</span>;
                      else if (isAnnotation) styledLine = <span className="text-[#F92672]">{line}</span>;
                      else {
                        const tokens = line.split(/([ \t]+|\[|\]|\(|\)|\.|;|"|'|=|\{|\})/g);
                        styledLine = tokens.filter(Boolean).map((t, idx) => {
                          if (['public', 'private', 'protected', 'class', 'void', 'new', 'return', 'if', 'else', 'true', 'false', 'throws', 'static', 'final', 'import', 'package'].includes(t)) {
                            return <span key={idx} className="text-[#F92672]">{t}</span>;
                          } else if (['String', 'WebDriver', 'WebElement', 'By', 'ChromeDriver', 'Duration', 'ExpectedConditions', 'WebDriverWait', 'Assert'].includes(t)) {
                            return <span key={idx} className="text-[#66D9EF] italic">{t}</span>;
                          } else if (t.startsWith('"') && t.endsWith('"') && t.length > 1) {
                            return <span key={idx} className="text-[#A6E22E]">{t}</span>;
                          } else if (/^[0-9]+$/.test(t)) {
                            return <span key={idx} className="text-[#AE81FF]">{t}</span>;
                          } else if (['{', '}', '(', ')', '[', ']', ';', '.', '='].includes(t)) {
                             return <span key={idx} className="text-gray-400">{t}</span>;
                          }
                          return t;
                        });
                      }

                      return (
                        <div key={i} className="flex hover:bg-white/[0.03] transition-colors group/line rounded-sm">
                          <span className="w-10 flex-shrink-0 text-right pr-4 text-gray-700 select-none font-mono text-[11px] group-hover/line:text-gray-400 py-[1px] leading-[1.7] border-r border-transparent group-hover/line:border-accent/30 mr-4 transition-colors">{i + 1}</span>
                          <span className="py-[1px]">{styledLine}</span>
                        </div>
                      );
                    })}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-textMuted font-mono text-sm p-6 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-40 pointer-events-none" />
                  
                  {/* Digital grid background */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                  
                  <div className="relative z-10 flex flex-col items-center max-w-md animate-in fade-in zoom-in-95 duration-500 delay-150">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#0F141B] to-[#0B0F14] rounded-2xl flex items-center justify-center mb-8 border border-white/5 shadow-2xl relative group/icon">
                      <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500"/>
                      <Code size={48} className="text-gray-600 group-hover/icon:text-accent/80 transition-colors duration-500" />
                      <div className="absolute -bottom-3 -right-3 bg-[#0B0F14] p-2.5 rounded-full border border-border shadow-lg">
                        <Sparkles size={18} className="text-accent animate-[pulse_2s_ease-in-out_infinite]" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Awaiting Instructions</h3>
                    <p className="text-gray-400 leading-relaxed text-[13px] mb-8 font-sans">
                      Configure your execution payload on the left utilizing <strong className="text-white">data injection</strong> and <strong className="text-white">locator intelligence</strong> to dynamically synthesize enterprise-grade Selenium automation scripts.
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-4 w-full">
                      <div className="bg-[#0F141B] px-4 py-3 rounded-xl border border-white/5 flex flex-col items-center gap-2 flex-1 shadow-inner">
                        <Database size={16} className="text-accent/70" />
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Dynamic Payload</span>
                      </div>
                      <div className="bg-[#0F141B] px-4 py-3 rounded-xl border border-white/5 flex flex-col items-center gap-2 flex-1 shadow-inner">
                        <Zap size={16} className="text-accent/70" />
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Smart Locators</span>
                      </div>
                      <div className="bg-[#0F141B] px-4 py-3 rounded-xl border border-white/5 flex flex-col items-center gap-2 flex-1 shadow-inner">
                        <Code size={16} className="text-accent/70" />
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Robust Output</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Syntax language footer indicator */}
            <div className="h-7 bg-[#05070A] border-t border-[#1A2330] flex items-center justify-between px-4 z-10 shadow-[0_-5px_10px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-gray-600 tracking-widest select-none">
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-accent/50"/> REAL-TIME SYNC</span>
              </div>
              <div className="text-[10px] font-mono font-bold text-gray-500 tracking-wider select-none flex gap-4">
                <span>UTF-8</span>
                <span>2 SPACES</span>
                <span className="text-gray-400">JAVA SELENIUM</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
