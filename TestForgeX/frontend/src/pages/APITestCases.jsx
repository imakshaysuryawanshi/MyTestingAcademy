import React, { useState } from "react";
import {
  Code2, Loader2, Sparkles, Download, Trash2, ChevronDown, ChevronUp,
  Eye, X, Search, Filter, FileSpreadsheet
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";

// ── Helpers ──────────────────────────────────────────────────────────────────
const getCategoryColor = (cat) => {
  const m = {
    functional:  "text-green-400  bg-green-400/10  border-green-400/30",
    security:    "text-purple-400 bg-purple-400/10 border-purple-400/30",
    negative:    "text-red-400    bg-red-400/10    border-red-400/30",
    edge:        "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    performance: "text-blue-400   bg-blue-400/10   border-blue-400/30",
  };
  return m[(cat || "").toLowerCase()] || "text-gray-400 bg-white/5 border-border";
};

const getMethodColor = (m) => {
  const c = {
    GET:    "text-green-400  bg-green-400/10  border-green-400/30",
    POST:   "text-blue-400   bg-blue-400/10   border-blue-400/30",
    PUT:    "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    PATCH:  "text-orange-400 bg-orange-400/10 border-orange-400/30",
    DELETE: "text-red-400    bg-red-400/10    border-red-400/30",
  };
  return c[(m || "").toUpperCase()] || "text-gray-400";
};

const getPrioColor = (p) => {
  const lp = (p || "").toLowerCase();
  if (lp.includes("high"))   return "text-red-400    bg-red-400/10    border-red-400/30";
  if (lp.includes("low"))    return "text-green-400  bg-green-400/10  border-green-400/30";
  return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
};

// ── Detail Modal (Mirroring standard) ──────────────────────────────────────────
function TCDetailModal({ tc, onClose }) {
  if (!tc) return null;
  
  // Try to parse Test_Data if it's JSON
  let apiSpec = null;
  try {
    if (typeof tc.Test_Data === 'string' && tc.Test_Data.includes('{')) {
      apiSpec = JSON.parse(tc.Test_Data);
    } else if (typeof tc.Test_Data === 'object') {
      apiSpec = tc.Test_Data;
    }
  } catch (e) { console.warn("Failed to parse Test_Data as JSON", e); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#131B26] border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#18212C]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-purple-400 font-mono">{tc.id || "ATC-???"}</span>
            <h3 className="text-lg font-bold text-white tracking-tight">{tc.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-textMuted hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Info badges */}
        <div className="px-6 py-4 border-b border-border/50 flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase text-textMuted font-bold">Category</p>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(tc.cat)}`}>{tc.cat || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase text-textMuted font-bold">Priority</p>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getPrioColor(tc.prio)}`}>{tc.prio || "Medium"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase text-textMuted font-bold">Status</p>
            <span className="text-[11px] font-bold px-3 py-1 bg-white/5 border border-border text-textMuted rounded-full">{tc.status || "Draft"}</span>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-textMuted font-bold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Description
              </p>
              <p className="text-sm text-gray-300 leading-relaxed font-medium bg-white/5 p-3 rounded-xl border border-border/50">
                {tc.desc || "No description provided."}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-textMuted font-bold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Pre-conditions
              </p>
              <p className="text-sm text-gray-300 leading-relaxed font-medium bg-white/5 p-3 rounded-xl border border-border/50">
                {tc.pre || "None specified."}
              </p>
            </div>
          </div>

          <div>
             <p className="text-[10px] uppercase tracking-widest text-textMuted font-bold mb-3 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Execution Steps
             </p>
             <div className="bg-[#0D1117]/80 rounded-xl border border-border/50 p-4 space-y-3">
               {(tc.stepsArr || []).map((step, idx) => (
                 <div key={idx} className="flex gap-3 items-start group">
                   <span className="min-w-[24px] h-[24px] rounded-lg bg-white/5 border border-border/50 text-purple-400 text-[10px] font-bold flex items-center justify-center mt-0.5 group-hover:bg-purple-500/10 transition-colors">
                     {idx + 1}
                   </span>
                   <p className="text-sm text-gray-300 flex-1 py-0.5">{typeof step === 'string' ? step : JSON.stringify(step)}</p>
                 </div>
               ))}
             </div>
          </div>

          <div>
             <p className="text-[10px] uppercase tracking-widest text-textMuted font-bold mb-3 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Expected Result
             </p>
             <div className="bg-[#0D1117]/80 rounded-xl border border-border/50 p-4">
                <p className="text-sm text-gray-300 leading-relaxed font-medium">{tc.expected || "N/A"}</p>
             </div>
          </div>

          <div>
             <p className="text-[10px] uppercase tracking-widest text-textMuted font-bold mb-3 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> API Specification (Test Data)
             </p>
             <div className="bg-[#0D1117] rounded-xl border border-border p-4 font-mono text-xs overflow-x-auto relative group">
                {apiSpec ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center mb-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${getMethodColor(apiSpec.method)}`}>{apiSpec.method}</span>
                      <span className="text-cyan-400">{apiSpec.endpoint}</span>
                    </div>
                    {apiSpec.headers && Object.keys(apiSpec.headers).length > 0 && (
                      <p className="text-gray-400"><span className="text-purple-300">Headers: </span>{JSON.stringify(apiSpec.headers)}</p>
                    )}
                    {apiSpec.body && Object.keys(apiSpec.body).length > 0 && (
                      <div className="mt-2 text-gray-300">
                        <p className="text-textMuted mb-1">Request Body:</p>
                        <pre className="p-2 bg-black/30 rounded">{JSON.stringify(apiSpec.body, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="text-gray-400">{String(tc.Test_Data || "N/A")}</pre>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function APITestCases() {
  const { apiTestCases, setApiTestCases, showToast } = useAppStore();

  const [loading,    setLoading]    = useState(false);
  const [apiInput,   setApiInput]   = useState("");
  const [method,     setMethod]     = useState("GET");
  const [viewTC,     setViewTC]     = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCat,   setFilterCat]  = useState("All");
  const [filterPrio,  setFilterPrio] = useState("All");
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Manual Generation ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const trimmed = apiInput.trim();
    if (!trimmed) { showToast("Enter an endpoint or spec.", "error"); return; }
    
    // Auto-detect JSON or plain endpoint
    let apiSpec;
    try { apiSpec = JSON.parse(trimmed); }
    catch { apiSpec = { endpoint: trimmed, method }; }

    setLoading(true);
    try {
      const res = await api.generateApiTestCases(apiSpec);
      // Backend returns api_test_cases or cases or data array
      const list = res.data?.api_test_cases || res.data?.test_cases || (Array.isArray(res.data) ? res.data : []);
      
      if (!list.length) { showToast("No cases generated. Verify your input.", "error"); return; }

      // Normalize fields to the industry standard
      const normalized = list.map((c, i) => {
        const stripLabel = v => typeof v === "string" ? v.replace(/Inference\s*\(low confidence\)\s*[-–]?\s*/gi, "").trim() : v;
        return {
          ...c,
          id:        c.id || `ATC-${String(apiTestCases.length + i + 1).padStart(3, "0")}`,
          title:     stripLabel(c.title || `API Verification ${apiTestCases.length + i + 1}`),
          cat:       c.cat || c.type || "Functional",
          desc:      stripLabel(c.desc || c.description || ""),
          pre:       stripLabel(c.pre || c.preconditions || c.pre_conditions || "N/A"),
          stepsArr:  c.stepsArr || c.steps || c.test_steps || c.verification_steps || [],
          expected:  stripLabel(c.expected || c.expected_result || c.expectedResult || ""),
          Test_Data: c.Test_Data || c.test_data || c.api_spec || JSON.stringify(apiSpec),
          prio:      c.prio || c.priority || "Medium",
          status:    c.status || "Draft",
          _isNew:    true,
          _generatedAt: new Date().toISOString()
        };
      });

      setApiTestCases(prev => [...normalized, ...prev]);
      showToast(`✓ Generated ${normalized.length} manual API test cases!`, "success");
      setApiInput("");
    } catch (err) {
      showToast(`Generation failed: ${err.message}`, "error");
    } finally { setLoading(false); }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    setApiTestCases(prev => prev.filter(c => c.id !== id));
    showToast("Test case removed", "info");
  };

  const clearAll = () => {
    if (confirm("Clear all API test cases?")) {
      setApiTestCases([]);
      showToast("Storage cleared", "info");
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = apiTestCases.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.desc?.toLowerCase().includes(q);
    const matchC = filterCat === "All" || (c.cat || "").toLowerCase() === filterCat.toLowerCase();
    const matchP = filterPrio === "All" || (c.prio || "").toLowerCase() === filterPrio.toLowerCase();
    return matchQ && matchC && matchP;
  });

  // ── Export ─────────────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!apiTestCases.length) return;
    const rows = apiTestCases.map(c => ({
      TID: c.id, 
      Title: c.title, 
      Category: c.cat, 
      Description: c.desc,
      "Pre-conditions": c.pre,
      Steps: Array.isArray(c.stepsArr) ? c.stepsArr.join('\n') : c.stepsArr,
      "Expected Result": c.expected,
      Test_Data: typeof c.Test_Data === 'string' ? c.Test_Data : JSON.stringify(c.Test_Data),
      Priority: c.prio, 
      Status: c.status || "Draft"
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "API_Test_Cases");
    XLSX.writeFile(wb, `API_TestCases_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast("✓ Excel exported", "success");
  };

  return (
    <div className="max-w-7xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Detail Modal */}
      {viewTC && <TCDetailModal tc={viewTC} onClose={() => setViewTC(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-lg">
            <Code2 className="text-purple-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">API Test Cases</h1>
            <p className="text-sm text-textMuted mt-1">Industry-standard manual test case dashboard — generate, track, export</p>
          </div>
        </div>

        <div className="flex gap-2">
           <button onClick={exportExcel} disabled={!apiTestCases.length}
             className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 rounded-xl text-sm font-semibold transition-all disabled:opacity-30">
             <FileSpreadsheet size={16} /> Export Excel
           </button>
           <button onClick={clearAll} disabled={!apiTestCases.length}
             className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-semibold transition-all disabled:opacity-30">
             <Trash2 size={16} /> Clear All
           </button>
        </div>
      </div>

      {/* Input / Generation Card */}
      <div className="bg-[#18212C] border border-border rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" /> API Specification / Endpoint
              </p>
              <textarea
                className="input w-full min-h-[110px] font-mono text-xs resize-none bg-[#0D1117]/50"
                placeholder={`/api/v1/search?q=test\n\n- or -\n\n{ "endpoint": "/api/users", "method": "POST", "body": { "email": "string" } }`}
                value={apiInput}
                onChange={e => setApiInput(e.target.value)}
              />
            </div>
            {/* Method selection for raw endpoint input */}
            <div className="flex gap-1.5 flex-wrap">
              {["GET", "POST", "PUT", "DELETE"].map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    method === m ? getMethodColor(m) + " border-current" : "text-textMuted border-border/50 hover:bg-white/5"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="md:w-64 flex flex-col justify-end">
             <button onClick={handleGenerate} disabled={loading || !apiInput.trim()}
               className="btn btn-primary w-full h-[50px] flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-purple-500/20">
               {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
               {loading ? "Generating..." : "Generate API Test Case"}
             </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#18212C] border border-border rounded-2xl overflow-hidden shadow-2xl">
        {/* Table Toolbar */}
        <div className="px-6 py-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1C2633]">
           <div className="relative flex-1 w-full md:w-auto">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
             <input
               className="input pl-10 h-10 w-full"
               placeholder="Search by TID, Title, Objective..."
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="flex items-center gap-2">
               <span className="text-[10px] uppercase text-textMuted font-bold">Category:</span>
               <select className="input h-9 py-0 text-xs w-32" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  <option value="All">All Categories</option>
                  <option value="Functional">Functional</option>
                  <option value="Security">Security</option>
                  <option value="Negative">Negative</option>
                  <option value="Edge">Edge</option>
                  <option value="Performance">Performance</option>
               </select>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-[10px] uppercase text-textMuted font-bold">Priority:</span>
               <select className="input h-9 py-0 text-xs w-28" value={filterPrio} onChange={e => setFilterPrio(e.target.value)}>
                  <option value="All">All Priority</option>
                  <option value="High">High Only</option>
                  <option value="Medium">MediumOnly</option>
                  <option value="Low">Low Only</option>
               </select>
             </div>
           </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#0F151C] text-textMuted text-[10px] tracking-widest uppercase font-bold border-b border-border">
                <th className="px-6 py-4 w-24">TID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 w-32">Category</th>
                <th className="px-6 py-4 max-w-sm">Description</th>
                <th className="px-6 py-4">Pre-conditions</th>
                <th className="px-6 py-4 w-28">Expected</th>
                <th className="px-6 py-4 w-28">Priority</th>
                <th className="px-6 py-4 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-textMuted">
                      <Code2 size={48} className="opacity-10" />
                      <p className="font-semibold text-white/50">No API test cases found.</p>
                      <p className="text-xs">Paste an endpoint or scenario to generate them above.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(tc => {
                  const isExpanded = !!expandedRows[tc.id];
                  return (
                    <React.Fragment key={tc.id}>
                      <tr className="hover:bg-white/[0.03] group transition-colors">
                        {/* TID */}
                        <td className="px-6 py-4 font-mono text-[11px] font-bold text-purple-400">
                          <div className="flex items-center gap-2">
                             <button onClick={() => toggleRow(tc.id)} className="p-1 hover:bg-white/10 rounded">
                               {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                             </button>
                            {tc.id}
                          </div>
                          {tc._isNew && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse"></span>}
                        </td>
                        {/* Title */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-white leading-tight group-hover:text-purple-300 transition-colors cursor-pointer" onClick={() => setViewTC(tc)}>
                            {tc.title}
                          </p>
                        </td>
                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${getCategoryColor(tc.cat)}`}>
                            {tc.cat}
                          </span>
                        </td>
                        {/* Description */}
                        <td className="px-6 py-4 max-w-[200px]">
                          <p className="text-[12px] text-gray-400 truncate" title={tc.desc}>{tc.desc || "—"}</p>
                        </td>
                        {/* Pre-conditions */}
                        <td className="px-6 py-4 max-w-[150px]">
                           <p className="text-[12px] text-gray-400 truncate" title={tc.pre}>{tc.pre || "N/A"}</p>
                        </td>
                        {/* Expected Result (Snippet) */}
                        <td className="px-6 py-4">
                           <p className="text-[12px] text-gray-400 truncate w-32" title={tc.expected}>{tc.expected || "N/A"}</p>
                        </td>
                        {/* Priority */}
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPrioColor(tc.prio)}`}>
                            {tc.prio}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setViewTC(tc)} className="p-2 text-textMuted hover:text-white hover:bg-white/10 rounded-lg transition" title="View Detail Sheet">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => handleDelete(tc.id)} className="p-2 text-textMuted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition" title="Delete Case">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-[#0D1117]/50 border-t border-border/10 animate-in fade-in slide-in-from-top-1 duration-200">
                          <td colSpan="8" className="px-12 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                 <p className="text-[10px] uppercase tracking-widest text-textMuted font-bold mb-3 flex items-center gap-2 text-purple-400">
                                   Steps
                                 </p>
                                 <div className="space-y-2">
                                   {(tc.stepsArr || []).map((step, idx) => (
                                     <div key={idx} className="flex gap-3 text-sm text-gray-300">
                                       <span className="text-purple-400 font-bold w-4 text-right shrink-0">{idx+1}.</span>
                                       <span>{step}</span>
                                     </div>
                                   ))}
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <div>
                                   <p className="text-[10px] uppercase tracking-widest text-textMuted font-bold mb-1 text-green-400">Expected Result</p>
                                   <p className="text-sm text-gray-300 leading-relaxed font-medium bg-white/5 p-3 rounded-lg border border-border/50">
                                     {tc.expected}
                                   </p>
                                 </div>
                                 {(tc.Test_Data || tc.test_data) && (
                                   <div>
                                     <p className="text-[10px] uppercase tracking-widest text-textMuted font-bold mb-1 text-blue-400">API Spec / Data</p>
                                     <code className="text-[11px] text-blue-300 block bg-blue-500/5 border border-blue-500/10 p-2 rounded truncate max-w-lg font-mono" title={typeof tc.Test_Data === "string" ? tc.Test_Data : JSON.stringify(tc.Test_Data)}>
                                       {typeof tc.Test_Data === "string" ? tc.Test_Data : JSON.stringify(tc.Test_Data)}
                                     </code>
                                   </div>
                                 )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-[#0F151C] flex justify-between items-center">
           <p className="text-[11px] text-textMuted font-medium">Showing {filtered.length} Industry-Standard API Test Cases</p>
           <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-border rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span className="text-[10px] text-textMuted uppercase font-bold tracking-tight">AI Generated Repository</span>
           </div>
        </div>
      </div>
    </div>
  );
}
