import React, { useState } from "react";
import {
  Code2, Loader2, Sparkles, Download, Trash2, ChevronDown, ChevronUp,
  Tag, AlertCircle, CheckCircle2, Plus, X
} from "lucide-react";
import { useAppStore } from "../store/AppContext";
import { api } from "../services/api";

const typeColors = {
  positive:    "text-green-400 bg-green-400/10 border-green-400/30",
  negative:    "text-red-400 bg-red-400/10 border-red-400/30",
  edge:        "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  security:    "text-purple-400 bg-purple-400/10 border-purple-400/30",
  performance: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

const methodColors = {
  GET:    "text-green-400 bg-green-400/10 border-green-400/30",
  POST:   "text-blue-400 bg-blue-400/10 border-blue-400/30",
  PUT:    "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  PATCH:  "text-orange-400 bg-orange-400/10 border-orange-400/30",
  DELETE: "text-red-400 bg-red-400/10 border-red-400/30",
};

function APITestCaseCard({ tc, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const typeColor   = typeColors[tc.type]   || typeColors.edge;
  const methodColor = methodColors[tc.request?.method] || "text-gray-400 bg-white/5 border-border";

  return (
    <div className="relative bg-[#121821] rounded-2xl border border-[#1F2A37]/60 hover:border-purple-500/30 transition-all duration-300 overflow-hidden group">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-500/60 to-purple-500/10 rounded-l-2xl" />

      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-[11px] font-bold font-mono text-purple-400 shrink-0">{tc.id || "ATC-?"}</span>
          {tc.request?.method && (
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border shrink-0 ${methodColor}`}>
              {tc.request.method}
            </span>
          )}
          <p className="text-white font-semibold text-sm truncate">{tc.title}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${typeColor}`}>
            {tc.type}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
            tc.priority === 'High' ? 'text-red-400 bg-red-400/10 border-red-400/30'
            : tc.priority === 'Low' ? 'text-green-400 bg-green-400/10 border-green-400/30'
            : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
          }`}>{tc.priority}</span>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-textMuted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
          <span className="text-textMuted">{expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-5 border-t border-border/40 pt-4 space-y-4">
          {tc.preconditions && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-1">Preconditions</p>
              <p className="text-sm text-gray-300">{tc.preconditions}</p>
            </div>
          )}

          {/* Request */}
          {tc.request && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-2">Request</p>
              <div className="bg-[#0D1117] rounded-xl border border-border p-4 font-mono text-xs space-y-2">
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${methodColor}`}>{tc.request.method}</span>
                  <span className="text-cyan-400">{tc.request.endpoint}</span>
                </div>
                {tc.request.headers && Object.keys(tc.request.headers).length > 0 && (
                  <div>
                    <p className="text-textMuted text-[10px] mb-1">Headers:</p>
                    {Object.entries(tc.request.headers).map(([k, v]) => (
                      <p key={k} className="text-gray-400"><span className="text-purple-300">{k}:</span> {String(v)}</p>
                    ))}
                  </div>
                )}
                {tc.request.body && Object.keys(tc.request.body).length > 0 && (
                  <div>
                    <p className="text-textMuted text-[10px] mb-1">Body:</p>
                    <pre className="text-gray-300 whitespace-pre-wrap text-[11px]">{JSON.stringify(tc.request.body, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expected Response */}
          {tc.expected_response && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-2">Expected Response</p>
              <div className="bg-[#0D1117] rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-textMuted">Status:</span>
                  <span className={`font-bold font-mono text-sm ${
                    String(tc.expected_response.status_code).startsWith('2') ? 'text-green-400'
                    : String(tc.expected_response.status_code).startsWith('4') ? 'text-yellow-400'
                    : 'text-red-400'
                  }`}>{tc.expected_response.status_code}</span>
                </div>
                {tc.expected_response.body_contains && (
                  <p className="text-xs text-gray-400">{tc.expected_response.body_contains}</p>
                )}
                {tc.expected_response.validation_notes && (
                  <p className="text-xs text-cyan-300/80 italic">{tc.expected_response.validation_notes}</p>
                )}
              </div>
            </div>
          )}

          {tc.tags?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={12} className="text-textMuted" />
              {tc.tags.map((tag, i) => (
                <span key={i} className="text-[10px] bg-white/5 border border-border px-2 py-0.5 rounded-full text-textMuted">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function APITestCases() {
  const { apiTestCases, setApiTestCases, showToast } = useAppStore();
  const [loading, setLoading]   = useState(false);
  const [apiInput, setApiInput] = useState("");
  const [method,   setMethod]   = useState("GET");
  const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  const buildApiData = () => {
    if (!apiInput.trim()) return null;
    // Try to detect if it's raw JSON, else build a minimal spec from input
    try {
      return JSON.parse(apiInput);
    } catch {
      return { endpoint: apiInput, method };
    }
  };

  const handleGenerate = async () => {
    const apiData = buildApiData();
    if (!apiData) {
      showToast("Please provide an endpoint or API spec.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.generateApiTestCases(apiData);
      const cases = res.data?.api_test_cases || [];
      if (cases.length === 0) {
        showToast("No test cases returned. Try a more detailed spec.", "error");
        return;
      }
      const tagged = cases.map(c => ({ ...c, _generatedAt: new Date().toISOString() }));
      setApiTestCases(prev => [...tagged, ...prev]);
      showToast(`✓ ${tagged.length} API test cases generated!`, "success");
      setApiInput("");
    } catch (err) {
      showToast(`Generation failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (idx) => {
    setApiTestCases(prev => prev.filter((_, i) => i !== idx));
    showToast("Test case removed", "info");
  };

  const handleExportCSV = () => {
    if (apiTestCases.length === 0) return;
    const headers = ["ID", "Title", "Type", "Priority", "Status", "Method", "Endpoint", "Status Code", "Preconditions", "Tags"];
    const rows = apiTestCases.map(c => [
      c.id||"", c.title||"", c.type||"", c.priority||"", c.status||"Draft",
      c.request?.method||"", c.request?.endpoint||"",
      c.expected_response?.status_code||"",
      (c.preconditions||"").replace(/,/g,";"),
      (c.tags||[]).join("|")
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `api_test_cases_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast("✓ CSV exported", "success");
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-500/10 rounded-xl">
          <Code2 className="text-purple-400" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">API Test Cases</h1>
          <p className="text-sm text-textMuted mt-1">Generate detailed API test cases from any endpoint or specification</p>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-xl">
        <p className="text-sm font-semibold text-white mb-1">API Endpoint / Specification</p>
        <p className="text-xs text-textMuted mb-5">
          Enter a plain endpoint (e.g. <code className="font-mono text-purple-300">/api/users</code>) or paste a full JSON spec.
          Choose the HTTP method below.
        </p>

        {/* Method selector */}
        <div className="flex gap-2 mb-4">
          {METHODS.map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                method === m
                  ? (methodColors[m] || "text-white bg-accent/20 border-accent/40")
                  : "border-border text-textMuted hover:text-white hover:border-white/20"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <textarea
          className="input w-full min-h-[100px] font-mono text-sm resize-none"
          placeholder={`/api/orders\n\n— or paste full JSON spec —\n{ \"endpoint\": \"/api/orders\", \"method\": \"POST\", \"body\": { \"item\": \"string\", \"qty\": \"number\" } }`}
          value={apiInput}
          onChange={e => setApiInput(e.target.value)}
        />

        <div className="flex justify-end mt-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !apiInput.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
            {loading ? "Generating…" : "Generate API Test Cases"}
          </button>
        </div>
      </div>

      {/* Results */}
      {apiTestCases.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              Saved API Test Cases
              <span className="ml-2 text-sm font-normal text-textMuted">({apiTestCases.length})</span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 border border-border rounded-lg text-textMuted hover:text-white hover:bg-white/10 transition"
              >
                <Download size={13}/> CSV
              </button>
              <button
                onClick={() => { setApiTestCases([]); showToast("API test cases cleared", "info"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition"
              >
                <Trash2 size={13}/> Clear All
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {apiTestCases.map((tc, idx) => (
              <APITestCaseCard key={idx} tc={tc} onDelete={() => handleDelete(idx)} />
            ))}
          </div>
        </div>
      )}

      {apiTestCases.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 opacity-50">
          <Code2 size={44} className="text-textMuted" />
          <p className="text-textMuted text-sm">No API test cases yet. Enter an endpoint above to start.</p>
        </div>
      )}
    </div>
  );
}
