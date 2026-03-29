import React, { useState } from "react";
import { FlaskConical, Loader2, Copy, Save, ChevronDown, ChevronUp, Zap, Download } from "lucide-react";
import { useAppStore } from "../store/AppContext";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Scenarios() {
  const { showToast, setTestCases, scenarios, setScenarios } = useAppStore();
  const navigate = useNavigate();

  const [loadingIdx, setLoadingIdx] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  // Sync incoming scenarios from localStorage on first load (written by UserStories page)
  React.useEffect(() => {
    const saved = localStorage.getItem("tfx_scenarios");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && scenarios.length === 0) {
        setScenarios(parsed);
      }
    }
  }, []);

  const handleGenerateCasesFromScenario = async (scenario, idx) => {
    setLoadingIdx(idx);
    try {
      const context = `SCENARIO: ${scenario.title} | DESC: ${scenario.description} | TYPE: ${scenario.type || "Functional"}`;
      const res = await api.generateTestCases(context);
      if (res.success) {
        // Ensure we always get a flat array regardless of AI response shape
        let cases = res.data;
        if (!Array.isArray(cases)) {
          cases = cases?.test_cases || cases?.cases || cases?.result || (cases ? [cases] : []);
        }
        if (cases.length > 0) {
          setTestCases(prev => [...prev, ...cases]);
          showToast(`✓ ${cases.length} Test Cases generated!`, "success");
          setTimeout(() => navigate("/testcases"), 800);
        } else {
          showToast("AI returned 0 test cases. Try again.", "error");
        }
      }
    } catch {
      showToast("Failed to generate test cases", "error");
    } finally {
      setLoadingIdx(null);
    }
  };

  const handleCopy = (scenario) => {
    navigator.clipboard.writeText(`${scenario.title}\n${scenario.description}`);
    showToast("Copied to clipboard", "info");
  };

  const handleExportCSV = () => {
    if (scenarios.length === 0) return;
    const headers = ["Title", "Description", "Type", "Priority"];
    const csvRows = [headers.join(",")];
    scenarios.forEach(s => {
      const cols = [
        `"${(s.title || "").replace(/"/g, '""')}"`,
        `"${(s.description || "").replace(/"/g, '""')}"`,
        s.type || "",
        s.priority || ""
      ];
      csvRows.push(cols.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenarios_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast("✓ CSV Export successful", "success");
  };

  if (scenarios.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-16 flex flex-col items-center justify-center text-center gap-6 pb-12">
        <div className="p-6 bg-card rounded-2xl border border-border">
          <FlaskConical className="text-textMuted mx-auto" size={48} />
        </div>
        <h2 className="text-2xl font-bold text-white">No Test Scenarios Yet</h2>
        <p className="text-textMuted max-w-sm">Generate Test Scenarios from a User Story card to see them here.</p>
        <button onClick={() => navigate("/stories")} className="btn px-6">
          Go to User Stories
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent/10 rounded-xl">
          <FlaskConical className="text-accent" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Test Scenarios</h1>
          <p className="text-sm text-textMuted mt-1">{scenarios.length} scenario{scenarios.length > 1 ? "s" : ""} generated • Click any card to expand</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-textMuted/10 text-textMuted hover:text-white hover:bg-white/10 border border-border rounded-lg text-sm font-semibold transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/40 transition-all duration-200 group"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 cursor-pointer"
              onClick={() => setCollapsed(prev => ({ ...prev, [idx]: !prev[idx] }))}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  scenario.priority === "High" ? "text-red-400 bg-red-400/10 border-red-400/20" :
                  scenario.priority === "Medium" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" :
                  "text-green-400 bg-green-400/10 border-green-400/20"
                }`}>
                  {scenario.priority || "Medium"}
                </span>
                <span className="text-xs font-mono text-textMuted bg-sidebar px-2 py-0.5 rounded border border-border">
                  {scenario.type || "Functional"}
                </span>
                <h3 className="text-white font-semibold">{scenario.title}</h3>
              </div>
              {collapsed[idx] ? <ChevronDown size={18} className="text-textMuted" /> : <ChevronUp size={18} className="text-textMuted" />}
            </div>

            {/* Body */}
            {!collapsed[idx] && (
              <div className="px-6 pb-6 border-t border-border/50 pt-4 space-y-4">
                <p className="text-textMuted text-sm leading-relaxed">{scenario.description}</p>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => handleGenerateCasesFromScenario(scenario, idx)}
                    disabled={loadingIdx === idx}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium border border-green-400/40 text-green-400 bg-green-400/5 hover:bg-green-400/15 transition-all disabled:opacity-50"
                  >
                    {loadingIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    Generate Test Cases
                  </button>
                  <button
                    onClick={() => handleCopy(scenario)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium border border-border text-textMuted hover:text-white hover:border-white/30 transition-all"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
