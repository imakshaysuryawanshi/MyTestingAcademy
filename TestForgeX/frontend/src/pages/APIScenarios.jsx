import React, { useState } from "react";
import {
  Wifi, Loader2, Sparkles, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, ArrowRight, FlaskConical, Tag, Download, Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";

const typeColors = {
  positive:    "text-green-400 bg-green-400/10 border-green-400/30",
  negative:    "text-red-400 bg-red-400/10 border-red-400/30",
  edge:        "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  security:    "text-purple-400 bg-purple-400/10 border-purple-400/30",
  performance: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

const priorityColors = {
  High:   "text-red-400 bg-red-400/10 border-red-400/30",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  Low:    "text-green-400 bg-green-400/10 border-green-400/30",
};

function ScenarioCard({ scenario, onDelete, onGenerateTestCases, isGenerating }) {
  const [expanded, setExpanded] = useState(false);
  const typeColor    = typeColors[scenario.type]    || typeColors.edge;
  const priorityColor = priorityColors[scenario.priority] || priorityColors.Medium;

  return (
    <div className="bg-[#121821] rounded-2xl border border-[#1F2A37]/60 hover:border-accent/30 transition-all duration-300 overflow-hidden group">
      {/* Left accent bar */}
      <div className="absolute left-0 h-full w-1 bg-gradient-to-b from-cyan-500/60 to-cyan-500/10 rounded-l-2xl" />

      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-[11px] font-bold font-mono text-cyan-400 shrink-0">{scenario.id || "ATS-?"}</span>
          <p className="text-white font-semibold text-sm truncate">{scenario.title}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${typeColor}`}>
            {scenario.type}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${priorityColor}`}>
            {scenario.priority}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-textMuted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition opacity-0 group-hover:opacity-100"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
          <span className="text-textMuted">{expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-5 space-y-4 border-t border-border/40 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenario.description && (
              <div className="md:col-span-2">
                <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-1">Description</p>
                <p className="text-sm text-gray-300 leading-relaxed">{scenario.description}</p>
              </div>
            )}
            {scenario.endpoint_hint && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-1">Endpoint Hint</p>
                <code className="text-xs text-cyan-400 font-mono bg-cyan-400/5 px-2 py-1 rounded border border-cyan-400/20">
                  {scenario.endpoint_hint}
                </code>
              </div>
            )}
            {scenario.tags?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-1">Tags</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {scenario.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] bg-white/5 border border-border px-2 py-0.5 rounded-full text-textMuted">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border/20 flex justify-end">
             <button
                onClick={() => onGenerateTestCases(scenario)}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-accent/80 hover:bg-accent text-white transition disabled:opacity-50"
             >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <FlaskConical size={12} />}
                {isGenerating ? "Generating..." : "Generate Test Cases"}
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function APIScenarios() {
  const navigate = useNavigate();
  const { stories, apiScenarios, addApiScenarios, addApiTestCases, showToast } = useAppStore();
  const [activeStory, setActiveStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [genId, setGenId]   = useState(null); // scenario being processed for test cases
  const [result, setResult]   = useState(null); // last generation result

  const handleGenerate = async (story) => {
    setActiveStory(story.title);
    setLoading(true);
    setResult(null);
    try {
      const res = await api.generateApiScenarios(story);
      const data = res.data;

      if (!data.api_testing_required) {
        showToast(`API testing not applicable: ${data.reason}`, "info");
        setResult({ notRequired: true, reason: data.reason });
        return;
      }

      // Resilient extraction — LLMs sometimes fluctuate keys (api_test_scenarios vs test_scenarios etc)
      const scenarios = data.api_test_scenarios || api.extractArtifactList(data, ["api_test_scenarios", "scenarios"]);
      if (scenarios.length === 0) {
        showToast("No API scenarios returned. Try a richer story.", "error");
        return;
      }

      // Tag each scenario with its source story and unique ID if missing
      const tagged = scenarios.map(s => ({ 
        ...s, 
        id: s.id || `ATS-${Math.floor(Math.random() * 9000) + 1000}`,
        _sourceStory: story.title, 
        _generatedAt: new Date().toISOString() 
      }));
      addApiScenarios(tagged);
      setResult({ scenarios: tagged, reason: data.reason });
      showToast(`✓ ${tagged.length} API scenarios generated!`, "success");
    } catch (err) {
      showToast(`Generation failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setActiveStory(null);
    }
  };

  const handleGenerateTestCases = async (scenario) => {
    setGenId(scenario.id);
    try {
      const res = await api.generateApiTestCases(scenario);
      
      // Resilient key checking (Models sometimes fluctuate keys like api_test_cases, test_cases, or direct arrays)
      let testCases = [];
      if (Array.isArray(res.data)) {
        testCases = res.data;
      } else if (res.data?.api_test_cases) {
        testCases = res.data.api_test_cases;
      } else if (res.data?.test_cases) {
         testCases = res.data.test_cases;
      } else {
        // Find the first array property in the object
        const firstArrKey = Object.keys(res.data || {}).find(k => Array.isArray(res.data[k]));
        if (firstArrKey) testCases = res.data[firstArrKey];
      }
      
      if (!testCases || testCases.length === 0) {
        showToast("No test cases generated. The AI might need more scenario details.", "error");
        return;
      }

      // Normalize fields — handle empty strings AND hallucination label artifacts
      const stripLabel = (v) => typeof v === 'string'
        ? v.replace(/Inference\s*\(low confidence\)\s*[-\u2013]?\s*/gi, '').trim()
        : v;

      const enriched = testCases.map((tc, idx) => {
        const title = stripLabel(tc.title || tc.title_test || tc.name || tc.case_title || '') || `API Test ${idx + 1}`;
        const type = (tc.type || tc.test_type || tc.category || 'positive').toLowerCase();
        const priority = tc.priority || tc.importance || 'Medium';
        const rawEndpoint = tc.request?.endpoint || tc.endpoint || scenario.endpoint_hint || '/api/unknown';
        const request = {
          ...(tc.request || {}),
          method: tc.request?.method || scenario.method || 'GET',
          endpoint: stripLabel(rawEndpoint),
          headers: tc.request?.headers || { 'Content-Type': 'application/json' },
          body: tc.request?.body || {}
        };

        return {
          ...tc,
          title,
          type,
          priority,
          request,
          _sourceScenario: scenario.title,
          _sourceEndpoint: scenario.endpoint_hint,
          _generatedAt: new Date().toISOString()
        };
      });

      addApiTestCases(enriched);
      showToast(`✓ ${enriched.length} API Test Cases created!`, "success");
      
      // Navigate to API Test Cases page
      setTimeout(() => navigate("/api-testcases"), 800);
    } catch (err) {
      showToast(`Test Case generation failed: ${err.message}`, "error");
    } finally {
      setGenId(null);
    }
  };

  const handleDelete = (idx) => {
    setApiScenarios(prev => prev.filter((_, i) => i !== idx));
    showToast("Scenario removed", "info");
  };

  const handleExportCSV = () => {
    if (apiScenarios.length === 0) return;
    const headers = ["ID", "Title", "Type", "Priority", "Description", "Endpoint Hint", "Tags", "Source Story"];
    const rows = apiScenarios.map(s => [
      s.id || "", s.title || "", s.type || "", s.priority || "",
      (s.description || "").replace(/,/g, ";"),
      s.endpoint_hint || "",
      (s.tags || []).join("|"),
      s._sourceStory || ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `api_scenarios_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast("✓ CSV exported", "success");
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-cyan-500/10 rounded-xl">
          <Wifi className="text-cyan-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">API Test Scenarios</h1>
          <p className="text-sm text-textMuted mt-1">AI-powered API scenario analysis — generated from your user stories</p>
        </div>
      </div>

      {/* Source: User Stories */}
      {stories.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <Wifi size={44} className="text-textMuted mx-auto mb-4 opacity-30" />
          <p className="text-white font-semibold text-lg">No user stories found</p>
          <p className="text-textMuted text-sm mt-1">Generate user stories first — then come back to create API scenarios from them.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-xl">
          <p className="text-sm font-semibold text-white mb-1">Select a User Story to Analyze</p>
          <p className="text-xs text-textMuted mb-5">The AI will determine whether API testing is needed and generate relevant scenarios.</p>
          <div className="space-y-3">
            {stories.map((story, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#0D1117] border border-border rounded-xl px-5 py-3.5 hover:border-cyan-400/30 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-sm truncate">{story.title}</p>
                  {story.description && (
                    <p className="text-xs text-textMuted truncate mt-0.5">{story.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleGenerate(story)}
                  disabled={loading}
                  className="ml-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {loading && activeStory === story.title
                    ? <><Loader2 size={12} className="animate-spin"/> Analyzing…</>
                    : <><Sparkles size={12}/> Analyze APIs</>
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last generation result banner */}
      {result && (
        <div className={`mb-6 px-5 py-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-300 ${
          result.notRequired
            ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-300"
            : "bg-cyan-500/5 border-cyan-500/20 text-cyan-300"
        }`}>
          {result.notRequired ? <AlertTriangle size={18} className="mt-0.5 shrink-0"/> : <CheckCircle2 size={18} className="mt-0.5 shrink-0"/>}
          <div>
            <p className="font-semibold text-sm">{result.notRequired ? "API Testing Not Applicable" : `${result.scenarios?.length} Scenarios Generated`}</p>
            {result.reason && <p className="text-xs opacity-80 mt-0.5">{result.reason}</p>}
          </div>
        </div>
      )}

      {/* Scenarios history */}
      {apiScenarios.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              Saved API Scenarios
              <span className="ml-2 text-sm font-normal text-textMuted">({apiScenarios.length})</span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 border border-border rounded-lg text-textMuted hover:text-white hover:bg-white/10 transition"
              >
                <Download size={13}/> CSV
              </button>
              <button
                onClick={() => { setApiScenarios([]); showToast("API scenarios cleared", "info"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition"
              >
                <Trash2 size={13}/> Clear All
              </button>
            </div>
          </div>
          <div className="relative space-y-3">
            {apiScenarios.map((scenario, idx) => (
              <ScenarioCard
                key={idx}
                scenario={scenario}
                onDelete={() => handleDelete(idx)}
                onGenerateTestCases={handleGenerateTestCases}
                isGenerating={genId === scenario.id}
              />
            ))}
          </div>
        </div>
      )}

      {apiScenarios.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 opacity-50">
          <Wifi size={44} className="text-textMuted" />
          <p className="text-textMuted text-sm">No API scenarios yet. Select a story above to start.</p>
        </div>
      ) }
    </div>
  );
}
