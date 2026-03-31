import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  ListChecks, Search, Filter, Code, Eye, Edit3, Loader2,
  Users, FlaskConical, ArrowRight, Download, X, FileSpreadsheet,
  ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";

// ── Helper: extract value by multiple key aliases ─────────────────────────────
const getVal = (obj, keys) => {
  if (!obj) return "";
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return "";
};

// ── Helper: detect placeholder data (Fix #6) ─────────────────────────────────
const isPlaceholder = (val) => {
  if (!val || val === "N/A" || val === "n/a" || val === "-" || val === "null") return true;
  const s = String(val).toLowerCase();
  return s.includes("username") || s.includes("password");
};

// ── Helper: normalize a test case to consistent shape ─────────────────────────
const normalizeTC = (tc, idx) => {
  const id          = getVal(tc, ["ID","TID","id","tid","case_id","testCaseId","Id","CaseID"]) || `TC-${String(idx + 1).padStart(3,"0")}`;
  // Aggressively search for Title in Description if Title is missing
  const title       = getVal(tc, ["Title","title","Name","name","Title_Case","titleCase","Tille","Summary","Summary_Title","Label","CaseTitle","Scenario"]) || 
                      (tc.Description && tc.Description.length < 50 ? tc.Description : "Unified Test Case");
  const cat         = getVal(tc, ["Category","category","Type","type","tag","Suite","Module"]) || "Functional";
  const desc        = getVal(tc, ["Description","description","summary","scenario","Detail","detail","Outcome","Summary"]) || "—";
  const pre         = getVal(tc, ["Preconditions","Pre_conditions","pre_conditions","preconditions","precondition","setup"]) || "—";
  const stepsRaw    = getVal(tc, ["Steps","steps","Actions","actions","test_steps","testSteps"]);
  const stepsArr    = Array.isArray(stepsRaw) ? stepsRaw : (stepsRaw ? String(stepsRaw).split(/\||→|;/).map(s=>s.trim()) : []);
  const expected    = getVal(tc, ["Expected","expected","Expected_Result","expected_result","outcome","result"]) || "—";
  // Fix #6 & User Request: Rename to Test_Data and filter "username" word
  const rawData     = getVal(tc, ["Test_Data","test_data","testData","Data","data","input"]);
  const data        = isPlaceholder(rawData) ? "" : rawData;
  const prio        = getVal(tc, ["Priority","priority","Severity","prio","severity"]) || "Medium";
  const status      = tc.status || tc.Status || "Draft";
  return { id, title, cat, desc, pre, stepsArr, expected, Test_Data: data, prio, status, _raw: tc };
};

const getPriorityColor = (priority) => {
  const p = (priority || "Medium").toLowerCase();
  if (p.includes("high") || p.includes("urgent")) return "text-red-400 bg-red-400/10 border-red-400/30";
  if (p.includes("med"))                           return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  if (p.includes("low") || p.includes("trivial"))  return "text-green-400 bg-green-400/10 border-green-400/30";
  return "text-gray-400 bg-gray-400/10 border-gray-400/30";
};

// ── Detail Modal ───────────────────────────────────────────────────────────────
function DetailModal({ tc, onClose }) {
  if (!tc) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
         onClick={onClose}>
      <div className="bg-[#131B26] border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-accent font-mono">{tc.id}</span>
            <span className="text-sm text-white font-semibold truncate max-w-[200px]">{tc.title}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getPriorityColor(tc.prio)}`}>
              {tc.prio}
            </span>
            <span className="text-xs text-textMuted bg-sidebar px-2 py-0.5 rounded border border-border">{tc.cat}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded text-textMuted hover:text-white transition">
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <Section label="Description" value={tc.desc} />
          <Section label="Pre-conditions" value={tc.pre} />
          {/* Steps numbered */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-2">Steps</p>
            {tc.stepsArr.length > 0 ? (
              <ol className="space-y-1.5">
                {tc.stepsArr.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white">
                    <span className="text-accent font-bold shrink-0">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-textMuted">—</p>}
          </div>
          <Section label="Expected Result" value={tc.expected} />
          {tc.Test_Data && <Section label="Test_Data" value={tc.Test_Data} mono />}
          <div className="flex gap-4 text-xs text-textMuted pt-2 border-t border-border/50">
            <span>Status: <span className="text-white font-medium">{tc.status}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, value, mono }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-1">{label}</p>
      <p className={`text-sm text-white leading-relaxed ${mono ? "font-mono text-blue-400 bg-blue-400/5 px-3 py-2 rounded-lg border border-blue-400/10" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TestCases() {
  const { testCases, setTestCases, showToast, scrapedElements } = useAppStore();
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [actionLoading, setActionLoading] = useState(null);
  const [viewTC, setViewTC]               = useState(null);   // for Eye modal
  const [editIdx, setEditIdx]             = useState(null);   // for Edit inline
  const [editData, setEditData]           = useState({});
  const [expandedRows, setExpandedRows]   = useState({});

  // ── Filtered list ────────────────────────────────────────────────────────
  const filteredCases = testCases
    .map((tc, idx) => ({ ...normalizeTC(tc, idx), _origIdx: idx }))
    .filter(tc => {
      // Fix #10: Search now checks ID, description, category
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        tc.id.toLowerCase().includes(q) ||
        tc.title.toLowerCase().includes(q) ||
        tc.desc.toLowerCase().includes(q) ||
        tc.cat.toLowerCase().includes(q)
      );
    })
    .filter(tc => filterPriority === "All" || tc.prio === filterPriority);

  // ── Code generation ──────────────────────────────────────────────────────
  const handleGenerateCode = async (tc) => {
    setActionLoading(tc.id);
    try {
      // Phase 22: Inject scraped elements from store so the AI can find real locators
      const payload = { 
        ...tc._raw, 
        elements: scrapedElements || [],
        Steps: tc.stepsArr // Ensure steps are passed in standard format
      };
      const response = await api.generateCode(payload);
      showToast(`✓ Selenium code generated for ${tc.id}`, "success");
      console.log("Generated Code:\n", response?.data);
    } catch (err) {
      showToast(`Code generation failed: ${err?.message || "Unknown error"}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Inline edit save (Fix: Edit not working) ────────────────────────────
  const handleSaveEdit = () => {
    setTestCases(prev => {
      const updated = [...prev];
      const merged = { ...updated[editIdx], ...editData };
      // Map back newline string to array if Steps were edited
      if (typeof editData.Steps === "string") {
        merged.Steps = editData.Steps.split("\n").map(s => s.trim()).filter(Boolean);
      }
      updated[editIdx] = merged;
      return updated;
    });
    setEditIdx(null);
    setEditData({});
    showToast("✓ Test case updated", "success");
  };

  // ── CSV Export ───────────────────────────────────────────────────────────
  // Fix #7: TC-001 preserved (string wrapped)  Fix #8: Preconditions included
  const buildRows = () =>
    filteredCases.map(tc => ({
      TID: tc.id,                    // stays as TC-001 (string)
      Title: tc.title,
      Category: tc.cat,
      Description: tc.desc,
      "Pre-conditions": tc.pre,
      Steps: tc.stepsArr.map((s, i) => `${i + 1}. ${s}`).join("\n"),
      "Expected Result": tc.expected,
      Test_Data: tc.Test_Data,
      Priority: tc.prio,
      Status: tc.status,
    }));

  const handleExportCSV = () => {
    if (filteredCases.length === 0) return;
    const rows = buildRows();
    const headers = Object.keys(rows[0]);
    const escape  = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv     = [headers.map(escape).join(","),
                     ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `test_cases_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("✓ CSV exported successfully", "success");
  };

  // ── XLSX Export (Fix #9) ─────────────────────────────────────────────────
  const handleExportXLSX = () => {
    if (filteredCases.length === 0) return;
    const rows = buildRows();
    const ws   = XLSX.utils.json_to_sheet(rows);
    // Force TID column to text so TC-001 stays TC-001
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
      if (cell) { cell.t = "s"; }
    }
    // Column widths: TID(10), Title(25), Category(14), Desc(40), Pre(30), Steps(50), Expected(35), Data(20), Priority(10), Status(10)
    ws["!cols"] = [{ wch: 10 }, { wch: 25 }, { wch: 14 }, { wch: 40 }, { wch: 30 }, { wch: 50 },
                   { wch: 35 }, { wch: 20 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Test Cases");
    XLSX.writeFile(wb, `test_cases_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast("✓ Excel (XLSX) exported successfully", "success");
  };

  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-accent/10 rounded-xl"><ListChecks className="text-accent" size={28} /></div>
        <div>
          <h1 className="text-3xl font-bold text-white">Test Case Dashboard</h1>
          <p className="text-sm text-textMuted mt-1">{testCases.length} cases saved · Search, filter, export</p>
        </div>
      </div>

      {/* Quick-nav cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link to="/stories" className="group flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:border-accent/40 hover:bg-[#141c26] transition-all">
          <div className="p-3 bg-accent/10 rounded-xl shrink-0"><Users size={22} className="text-accent" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold">Generate from User Stories</p>
            <p className="text-xs text-textMuted mt-0.5">Create test cases from any story card</p>
          </div>
          <ArrowRight size={18} className="text-textMuted group-hover:text-accent transition-colors shrink-0" />
        </Link>
        <Link to="/scenarios" className="group flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:border-blue-400/40 hover:bg-[#141c26] transition-all">
          <div className="p-3 bg-blue-400/10 rounded-xl shrink-0"><FlaskConical size={22} className="text-blue-400" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold">Generate from Scenarios</p>
            <p className="text-xs text-textMuted mt-0.5">Generate test cases from scenario cards</p>
          </div>
          <ArrowRight size={18} className="text-textMuted group-hover:text-blue-400 transition-colors shrink-0" />
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#18212C]">
          {/* Fix #10: Search now works on ID + Title */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
            <input
              className="input pl-10 h-10 w-full"
              placeholder="Search by ID or Title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Filter className="text-textMuted" size={16} />
            <select className="input h-10 py-0 text-sm" value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}>
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {/* CSV Export — Fix #7 #8 */}
            <button onClick={handleExportCSV} disabled={filteredCases.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-textMuted hover:text-white hover:bg-white/10 border border-border rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed">
              <Download size={15} /> CSV
            </button>
            {/* XLSX Export — Fix #9 */}
            <button onClick={handleExportXLSX} disabled={filteredCases.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed">
              <FileSpreadsheet size={15} /> Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#0F151C] text-textMuted text-[11px] tracking-wider uppercase border-b border-border">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 w-20">TID</th>
                <th className="px-4 py-3 w-32">Title</th>
                <th className="px-4 py-3 w-24">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Pre-conditions</th>
                <th className="px-4 py-3">Steps</th>
                <th className="px-4 py-3">Expected Result</th>
                <th className="px-4 py-3 w-24">Test_Data</th>
                <th className="px-4 py-3 w-24">Priority</th>
                <th className="px-4 py-3 w-24">Status</th>
                <th className="px-4 py-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-textMuted">
                      <ListChecks size={40} className="opacity-20" />
                      <p className="font-medium text-white">No test cases found</p>
                      <p className="text-sm">
                        {searchQuery
                          ? `No results for "${searchQuery}"`
                          : "Generate from User Stories or Scenarios above"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredCases.map((tc) => {
                const isExpanded = expandedRows[tc.id];
                const isEditing  = editIdx === tc._origIdx;

                return (
                  <React.Fragment key={tc.id}>
                    <tr className={`hover:bg-white/[0.03] transition-colors group ${isExpanded ? "bg-white/[0.02]" : ""}`}>
                      {/* Expand toggle */}
                      <td className="px-3 py-3">
                        <button onClick={() => toggleRow(tc.id)}
                                className="p-1 text-textMuted hover:text-accent transition rounded">
                          {isExpanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                        </button>
                      </td>
                      {/* TID */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold text-accent font-mono">{tc.id}</span>
                      </td>
                      {/* Title */}
                      <td className="px-4 py-3 max-w-[150px]">
                        <p className="text-[13px] text-white font-semibold truncate" title={tc.title}>{tc.title}</p>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-300 font-medium whitespace-nowrap">{tc.cat}</span>
                      </td>
                      {/* Description — Fix #2: tooltip + truncate */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-[13px] text-white font-medium truncate" title={tc.desc}>{tc.desc}</p>
                      </td>
                      {/* Pre-conditions */}
                      <td className="px-4 py-3 max-w-[150px]">
                        <p className="text-xs text-gray-400 truncate" title={tc.pre}>{tc.pre}</p>
                      </td>
                      {/* Steps — Fix #5: numbered */}
                      <td className="px-4 py-3 max-w-[160px]">
                        <div className="space-y-0.5">
                          {tc.stepsArr.slice(0, isExpanded ? 999 : 2).map((s, i) => (
                            <p key={i} className="text-xs text-gray-400 truncate" title={s}>
                              <span className="text-accent/70 font-bold mr-1">{i+1}.</span>{s.replace(/^[\d\.\)]+\s*/, '')}
                            </p>
                          ))}
                          {!isExpanded && tc.stepsArr.length > 2 && (
                            <p className="text-[10px] text-accent cursor-pointer" onClick={() => toggleRow(tc.id)}>
                              +{tc.stepsArr.length - 2} more…
                            </p>
                          )}
                        </div>
                      </td>
                      {/* Expected Result */}
                      <td className="px-4 py-3 max-w-[150px]">
                        <p className="text-xs text-gray-400 truncate" title={tc.expected}>{tc.expected}</p>
                      </td>
                      {/* Test_Data — Fix #6: empty if N/A or username */}
                      <td className="px-4 py-3">
                        {tc.Test_Data
                          ? <code className="text-[11px] text-blue-400 bg-blue-400/5 px-1.5 py-0.5 rounded font-mono truncate block max-w-[80px]" title={tc.Test_Data}>{tc.Test_Data}</code>
                          : <span className="text-xs text-textMuted/40">—</span>
                        }
                      </td>
                      {/* Priority */}
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full border whitespace-nowrap ${getPriorityColor(tc.prio)}`}>
                          {tc.prio}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-textMuted font-medium bg-white/5 border border-border px-2 py-0.5 rounded-full whitespace-nowrap">{tc.status}</span>
                      </td>
                      {/* Actions — Fix #3: Eye opens modal, Edit enables inline edit */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          {/* Eye — open detail modal */}
                          <button onClick={() => setViewTC(tc)}
                                  className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition"
                                  title="View full details">
                            <Eye size={14} />
                          </button>
                          {/* Edit — logic fix: auto-expand + full init */}
                          <button onClick={() => { 
                            setEditIdx(tc._origIdx); 
                            setEditData({ 
                              Title: tc.title,
                              Description: tc.desc, 
                              Preconditions: tc.pre, 
                              Expected: tc.expected,
                              Test_Data: tc.Test_Data,
                              Category: tc.cat,
                              Priority: tc.prio,
                              Status: tc.status,
                              Steps: tc.stepsArr.join("\n")
                            }); 
                            if (!isExpanded) toggleRow(tc.id);
                          }}
                                  className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition"
                                  title="Edit this test case">
                            <Edit3 size={14} />
                          </button>
                          {/* Code gen — Fix #3 */}
                          <button onClick={() => handleGenerateCode(tc)}
                                  disabled={actionLoading === tc.id}
                                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-accent/10 border border-accent/20 text-accent rounded hover:bg-accent hover:text-black transition disabled:opacity-50"
                                  title="Generate Selenium code">
                            {actionLoading === tc.id ? <Loader2 size={11} className="animate-spin"/> : <Code size={11}/>}
                            Code
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row — full readable details */}
                    {isExpanded && (
                      <tr className="bg-[#0d1520]">
                        <td colSpan="12" className="px-8 py-5">
                          {isEditing ? (
                            /* ── Inline Edit Form ─────────────────────── */
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-accent uppercase tracking-widest mb-3">Editing {tc.id}</p>
                              {[
                                { label: "Title", key: "Title" },
                                { label: "Description", key: "Description" },
                                { label: "Pre-conditions", key: "Preconditions" },
                                { label: "Test_Data", key: "Test_Data" },
                                { label: "Expected Result", key: "Expected" },
                                { label: "Status", key: "Status" },
                                { label: "Steps (per line)", key: "Steps" },
                              ].map(({ label, key }) => (
                                <div key={key}>
                                  <label className="text-[10px] text-textMuted uppercase tracking-wider">{label}</label>
                                  <textarea
                                    className="input w-full mt-1 h-16 resize-none text-sm"
                                    value={editData[key] || ""}
                                    onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                                  />
                                </div>
                              ))}
                              <div className="flex gap-2 pt-1">
                                <button onClick={handleSaveEdit}
                                        className="px-4 py-1.5 bg-accent text-black font-bold text-sm rounded-lg hover:bg-accent/80 transition">
                                  Save
                                </button>
                                <button onClick={() => setEditIdx(null)}
                                        className="px-4 py-1.5 bg-white/5 text-textMuted font-medium text-sm rounded-lg hover:bg-white/10 transition">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ── Expanded Read View ───────────────────── */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <ExpandSection label="Description" value={tc.desc} />
                                <ExpandSection label="Pre-conditions" value={tc.pre} />
                                <ExpandSection label="Expected Result" value={tc.expected} />
                                {tc.Test_Data && <ExpandSection label="Test_Data" value={tc.Test_Data} mono />}
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-2">Steps</p>
                                <ol className="space-y-2">
                                  {tc.stepsArr.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-white/80">
                                      <span className="text-accent font-bold shrink-0 w-5">{i+1}.</span>
                                      <span>{s.replace(/^[\d\.\)]+\s*/, '')}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {filteredCases.length > 0 && (
          <div className="px-4 py-3 border-t border-border text-xs text-textMuted bg-[#18212C] flex justify-between">
            <span>Showing <span className="text-white font-medium">{filteredCases.length}</span> of <span className="text-white font-medium">{testCases.length}</span> test cases</span>
            <span className="text-textMuted/60">Click ▾ on any row to expand full details</span>
          </div>
        )}
      </div>

      {/* Detail Modal (Eye icon) */}
      {viewTC && <DetailModal tc={viewTC} onClose={() => setViewTC(null)} />}
    </div>
  );
}

function ExpandSection({ label, value, mono }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-1">{label}</p>
      <p className={`text-sm text-white/80 leading-relaxed ${mono ? "font-mono text-blue-400 text-xs" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}
