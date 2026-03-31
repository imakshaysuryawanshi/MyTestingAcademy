import React, { useState, useRef, useCallback } from "react";
import { FileText, Loader2, Play, UploadCloud, X, AlertCircle, ChevronDown, ChevronUp, Clock, Trash2, Download, FlaskConical, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAppStore } from "../store/useAppStore";

// ── helper: detect if string looks like binary / PDF ─────────────────────────
const isBinaryContent = (text) => {
  if (!text) return false;
  // PDF signature or high proportion of non-printable chars
  if (text.startsWith('%PDF')) return true;
  const nonPrintable = (text.match(/[\x00-\x08\x0E-\x1F\x7F-\xFF]/g) || []).length;
  return nonPrintable / text.length > 0.05;
};

// ── Plan History Card ─────────────────────────────────────────────────────────
function PlanHistoryCard({ plan, idx, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-sidebar rounded-xl border border-border overflow-hidden hover:border-accent/30 transition-all">
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
          <span className="text-xs font-semibold text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">Plan #{idx + 1}</span>
          <p className="text-sm text-white break-words">{plan.objective || "Test Plan"}</p>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onDelete(idx); }}
            className="p-1.5 rounded-lg text-textMuted hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          {open ? <ChevronUp size={16} className="text-textMuted" /> : <ChevronDown size={16} className="text-textMuted" />}
        </div>
      </div>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-border/50 space-y-3 text-sm">
          <div><span className="text-accent font-semibold text-xs uppercase">Objective</span><p className="text-textMuted mt-1">{plan.objective}</p></div>
          <div><span className="text-accent font-semibold text-xs uppercase">Scope</span><p className="text-textMuted mt-1">{plan.scope}</p></div>
          <div>
            <span className="text-accent font-semibold text-xs uppercase">Scenarios</span>
            <ul className="list-disc list-inside mt-1 text-textMuted space-y-0.5">
              {(plan.test_scenarios || plan.scenarios || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-red-400 font-semibold text-xs uppercase">Risks</span>
              <ul className="list-disc list-inside mt-1 text-red-200/70 text-xs space-y-0.5">
                {(plan.risks || []).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div>
              <span className="text-green-400 font-semibold text-xs uppercase">Criteria</span>
              <ul className="list-disc list-inside mt-1 text-green-200/70 text-xs space-y-0.5">
                {(plan.criteria?.entry || []).map((c, i) => <li key={i}>Entry: {c}</li>)}
                {(plan.criteria?.exit || []).map((c, i) => <li key={i}>Exit: {c}</li>)}
                {(!plan.criteria?.entry && Array.isArray(plan.criteria)) && plan.criteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TestPlan() {
  const { showToast, testPlans, addTestPlans, addScenarios, addApiScenarios } = useAppStore();
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const fileRef = useRef();
  const navigate = useNavigate();

  // ── File handling ─────────────────────────────────────────────────────────
  const readFile = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "pdf") {
      showToast("PDF files are not supported — please export as .txt or .md", "error");
      return;
    }
    const okExt = ["md", "txt", "json", "csv"];
    if (!okExt.includes(ext)) {
      showToast("Only .txt, .md, .json, .csv files are supported", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (isBinaryContent(text)) {
        showToast("File contains binary/unsupported content — use plain text", "error");
        return;
      }
      setContext(text);
      setUploadedFile(file.name);
      showToast(`"${file.name}" loaded`, "success");
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    readFile(e.dataTransfer.files?.[0]);
  }, []);

  const clearFile = () => { setContext(""); setUploadedFile(null); if (fileRef.current) fileRef.current.value = ""; };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!context.trim()) { showToast("Please enter feature requirements or upload a .txt / .md file.", "error"); return; }
    if (isBinaryContent(context)) { showToast("Content appears to be binary. Please paste plain text.", "error"); return; }

    setLoading(true);
    try {
      const res = await api.generateTestPlan(context);
      const plan = res.data;
      setResult(plan);
      addTestPlans([plan]);
      showToast("✓ Test Plan generated and saved!", "success");
      // Reset inputs for next run
      clearFile();
      setContext("");
    } catch {
      showToast("Failed to generate Test Plan", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = (idx) => {
    setTestPlans(prev => prev.filter((_, i) => i !== idx));
    if (result && testPlans[idx] === result) setResult(null);
    showToast("Plan removed", "info");
  };

  const handleExportPlan = () => {
    if (!result) return;
    const content = `# Master Test Plan\n\n## 1. Objective\n${result.objective}\n\n## 2. Scope\n${result.scope}\n\n## 3. Scenarios\n${(result.test_scenarios || result.scenarios || []).map(s => `- ${s}`).join("\n")}\n\n## 4. Technical Risks\n${(result.risks || []).map(r => `- ${r}`).join("\n")}\n\n## 5. Go/No-Go Criteria\n${(result.criteria?.entry || []).map(c => `- Entry: ${c}`).join("\n")}\n${(result.criteria?.exit || []).map(c => `- Exit: ${c}`).join("\n")}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TestPlan_Export_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast("✓ Exported Test Plan (.md)", "success");
  };

  const handleGenerateScenarios = async () => {
    if (!result) return;
    setLoadingScenarios(true);
    try {
      const pseudoStory = { title: result.objective, description: result.scope };
      const res = await api.generateScenarios(pseudoStory);
      if (res.success) {
        setScenarios(prev => [...res.data, ...prev]);
        showToast(`✓ ${res.data.length} Scenarios generated from Plan!`, "success");
        setTimeout(() => navigate("/scenarios"), 800);
      }
    } catch {
      showToast("Failed to generate Scenarios", "error");
    } finally {
      setLoadingScenarios(false);
    }
  };

  const handleGenerateApiScenarios = async () => {
    if (!result) return;
    setLoadingScenarios(true);
    try {
      const pseudoStory = { title: result.objective, description: result.scope };
      const res = await api.generateApiScenarios(pseudoStory);
      if (res.success) {
        setApiScenarios(prev => [...res.data, ...prev]);
        showToast(`✓ ${res.data.length} API Scenarios generated!`, "success");
        setTimeout(() => navigate("/api-scenarios"), 800);
      }
    } catch {
      showToast("Failed to generate API Scenarios", "error");
    } finally {
      setLoadingScenarios(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent/10 rounded-xl"><FileText className="text-accent" size={28} /></div>
        <div>
          <h1 className="text-3xl font-bold text-white">Test Plan Generator</h1>
          <p className="text-sm text-textMuted mt-1">Generate comprehensive QA strategies from feature descriptions or PRD files.</p>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-card p-8 rounded-2xl border border-border shadow-lg mb-8 space-y-5">
        <label className="block text-sm font-medium text-gray-300">Feature Context or PRD Extract</label>

        {/* Drag & Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploadedFile && fileRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-7 px-6 cursor-pointer transition-all duration-200 ${
            dragOver ? "border-accent bg-accent/10 scale-[1.01]"
            : uploadedFile ? "border-green-500/40 bg-green-500/5 cursor-default"
            : "border-border hover:border-accent/50 hover:bg-white/[0.02]"
          }`}
        >
          <input ref={fileRef} type="file" accept=".txt,.md,.json,.csv" className="hidden" onChange={e => readFile(e.target.files?.[0])} />
          {uploadedFile ? (
            <>
              <div className="flex items-center gap-3 text-green-400"><FileText size={22} /><span className="font-medium text-sm">{uploadedFile}</span></div>
              <button onClick={e => { e.stopPropagation(); clearFile(); }}
                className="flex items-center gap-1.5 text-xs text-textMuted hover:text-red-400 transition-colors mt-1 border border-border rounded-lg px-3 py-1">
                <X size={12} /> Remove file
              </button>
            </>
          ) : (
            <>
              <UploadCloud size={32} className={`${dragOver ? "text-accent" : "text-textMuted"} transition-colors`} />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-300">{dragOver ? "Drop your file here" : "Drag & drop a file, or click to browse"}</p>
                <p className="text-xs text-textMuted mt-1">Supports .txt · .md · .json · .csv &nbsp;(no PDF)</p>
              </div>
            </>
          )}
        </div>

        {/* OR divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-textMuted font-medium uppercase tracking-wider">or type manually</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Textarea + button */}
        <div className="flex flex-col gap-4">
          <textarea
            className={`input min-h-[120px] resize-none ${uploadedFile ? "opacity-40 pointer-events-none" : ""}`}
            placeholder="Paste your product requirements here to generate Objective, Scope, Scenarios, Risks, and Entry/Exit Criteria..."
            value={context}
            onChange={e => setContext(e.target.value)}
            rows={5}
          />
          {uploadedFile && (
            <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/5 border border-yellow-400/20 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> File loaded — remove it above to type manually
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={handleGenerate} disabled={loading}
              className={`btn px-8 text-lg font-semibold shadow-lg shadow-accent/20 flex items-center justify-center gap-2 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
              {loading ? "Generating…" : "Generate Test Plan"}
            </button>
          </div>
        </div>
      </div>

      {/* Latest Result */}
      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-500 bg-[#0F141B] p-8 rounded-2xl border border-accent/20 mb-8">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Master Test Plan</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleGenerateScenarios} 
                disabled={loadingScenarios}
                className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-black rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              >
                {loadingScenarios ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
                Generate Scenarios
              </button>
              <button 
                onClick={handleGenerateApiScenarios} 
                disabled={loadingScenarios}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              >
                {loadingScenarios ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                Generate API Scenarios
              </button>
              <button onClick={handleExportPlan} className="flex items-center gap-1.5 px-3 py-1 bg-textMuted/10 text-white hover:bg-white/10 border border-border rounded-lg text-xs font-semibold transition-colors">
                <Download size={14} /> Export .MD
              </button>
              <span className="text-xs bg-sidebar border border-border text-textMuted px-3 py-1 rounded">DRAFT V1.0</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-accent mb-2">1. Objective</h3>
              <p className="text-textMuted leading-relaxed bg-[#1A2330] p-4 rounded-xl border border-border">{result.objective}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-accent mb-2">2. Scope</h3>
              <p className="text-textMuted leading-relaxed bg-[#1A2330] p-4 rounded-xl border border-border">{result.scope}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            <div className="bg-[#121821] p-5 rounded-xl border border-border/50">
              <h3 className="text-md font-bold text-white tracking-wider mb-4 border-b border-border pb-2">Scenarios</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
                {(result.test_scenarios || result.scenarios || []).map((sc, i) => <li key={i}>{sc}</li>)}
              </ul>
            </div>
            <div className="bg-red-500/5 p-5 rounded-xl border border-red-500/10">
              <h3 className="text-md font-bold text-red-400 tracking-wider mb-4 border-b border-red-500/20 pb-2">Technical Risks</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-red-200/70">
                {(result.risks || []).map((rx, i) => <li key={i}>{rx}</li>)}
              </ul>
            </div>
            <div className="bg-green-500/5 p-5 rounded-xl border border-green-500/10">
              <h3 className="text-md font-bold text-green-400 tracking-wider mb-4 border-b border-green-500/20 pb-2">Go/No-Go Criteria</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-green-200/70">
                {(result.criteria?.entry || []).map((cr, i) => <li key={i}>Entry: {cr}</li>)}
                {(result.criteria?.exit || []).map((cr, i) => <li key={i}>Exit: {cr}</li>)}
                {(!result.criteria?.entry && Array.isArray(result.criteria)) && result.criteria.map((cr, i) => <li key={i}>{cr}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {testPlans.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 text-textMuted hover:text-white transition-colors text-sm font-medium"
          >
            <Clock size={16} className="text-accent" />
            Plan History ({testPlans.length})
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showHistory && (
            <div className="space-y-2 animate-in fade-in duration-300">
              {[...testPlans].reverse().map((plan, i) => (
                <PlanHistoryCard
                  key={i}
                  plan={plan}
                  idx={testPlans.length - 1 - i}
                  onDelete={handleDeletePlan}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
