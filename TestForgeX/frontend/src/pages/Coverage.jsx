import React, { useState } from "react";
import { ShieldCheck, Activity, Target, AlertTriangle, Loader2, Wifi, Code2, CheckCircle2, XCircle } from "lucide-react";
import { api } from "../services/api";
import { useAppStore } from "../store/useAppStore";

function ApiCoverageCard({ items, type }) {
  const isScenarios = type === "scenarios";
  const color  = isScenarios ? "cyan" : "violet";
  const Icon   = isScenarios ? Wifi : Code2;
  const label  = isScenarios ? "API Scenarios" : "API Test Cases";

  const typeCounts = items.reduce((acc, item) => {
    const t = item.type || "unknown";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const priorityCounts = items.reduce((acc, item) => {
    const p = item.priority || "Medium";
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`bg-${color}-500/5 border border-${color}-500/20 rounded-2xl p-6`}>
      <div className={`flex items-center gap-2 text-${color}-400 mb-5 border-b border-${color}-500/10 pb-3`}>
        <Icon size={18} />
        <h3 className="font-bold text-white tracking-wide">{label}</h3>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-${color}-500/10 border border-${color}-500/20 text-${color}-400`}>
          {items.length} total
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-textMuted text-sm">No {label.toLowerCase()} generated yet.</p>
      ) : (
        <div className="space-y-4">
          {/* Type breakdown */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-2">Coverage by Type</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeCounts).map(([t, count]) => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-border bg-white/5 text-gray-300">
                  <span className="font-bold">{count}</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Priority breakdown */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-2">Priority Distribution</p>
            <div className="flex gap-3">
              {["High", "Medium", "Low"].map(p => (
                <div key={p} className="text-center">
                  <div className={`text-xl font-bold ${p === "High" ? "text-red-400" : p === "Medium" ? "text-yellow-400" : "text-green-400"}`}>
                    {priorityCounts[p] || 0}
                  </div>
                  <div className="text-[10px] text-textMuted">{p}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest items preview */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-textMuted font-semibold mb-2">Recent Items</p>
            <div className="space-y-1.5">
              {items.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                  <CheckCircle2 size={11} className={`text-${color}-400 shrink-0`} />
                  <span className="truncate">{item.title || item.id || "Untitled"}</span>
                  {item.type && (
                    <span className="text-textMuted ml-auto shrink-0">{item.type}</span>
                  )}
                </div>
              ))}
              {items.length > 4 && (
                <p className="text-xs text-textMuted">+{items.length - 4} more</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Coverage() {
  const { testCases, apiScenarios, apiTestCases, showToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const handleAnalyze = async () => {
    if (testCases.length === 0) {
      showToast("No test cases available to analyze coverage against.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.analyzeCoverage(testCases);
      setResult(res.data);
      showToast("Coverage Analysis Complete", "success");
    } catch {
      showToast("Failed to analyze coverage", "error");
    } finally {
      setLoading(false);
    }
  };

  const totalApiCoverage = apiScenarios.length + apiTestCases.length;

  return (
    <div className="max-w-5xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent/10 rounded-xl">
          <ShieldCheck className="text-accent" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Coverage Optimizer</h1>
          <p className="text-sm text-textMuted mt-1">Identify gaps in your testing strategy instantly.</p>
        </div>
      </div>

      {/* UI Test Coverage scan */}
      <div className="bg-[#121821] p-8 rounded-2xl border border-border shadow flex flex-col md:flex-row items-center justify-between mb-8 overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4 text-accent">
          <ShieldCheck size={250} />
        </div>
        <div className="z-10 w-full md:w-1/2">
          <h2 className="text-2xl font-bold text-white mb-2">Analyze UI Test Portfolio</h2>
          <p className="text-gray-400 mb-6">
            You have <strong className="text-accent">{testCases.length}</strong> active test cases.
            Run AI analysis to detect missing edge cases and coverage gaps.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={loading || testCases.length === 0}
            className={`btn px-8 py-3 text-lg flex items-center gap-3 ${loading || testCases.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} />}
            Run Deep Scan
          </button>
        </div>
      </div>

      {/* UI Test Coverage Result */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in zoom-in-95 duration-700 mb-10">
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-center justify-center text-center shadow-lg transform hover:-translate-y-1 transition-transform">
            <div className="relative mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-border" />
                <circle
                  cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray={377} strokeDashoffset={377 - (377 * result.coverage_score) / 100}
                  className="text-accent stroke-current" strokeLinecap="round"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-white">
                {result.coverage_score}%
              </div>
            </div>
            <h3 className="font-semibold text-gray-300 tracking-wider">COVERAGE SCORE</h3>
          </div>

          <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/20 shadow-lg col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-red-400 mb-4 border-b border-red-500/10 pb-3">
              <AlertTriangle size={20} />
              <h3 className="font-bold tracking-widest uppercase">Missing Coverage Areas</h3>
            </div>
            <ul className="space-y-3 pl-2">
              {result.missing_areas.map((area, i) => (
                <li key={i} className="text-red-200/80 text-sm flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span> {area}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-accent/5 p-6 rounded-2xl border border-accent/20 shadow-lg col-span-1 md:col-span-3 mt-4">
            <div className="flex items-center gap-2 text-accent mb-4 border-b border-accent/10 pb-3">
              <Target size={20} />
              <h3 className="font-bold tracking-widest uppercase text-white">Suggested Test Scenarios</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {result.suggested_tests.map((test, i) => (
                <div key={i} className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-start gap-3">
                  <div className="bg-accent/10 p-2 rounded-lg text-accent text-xs font-bold font-mono">+{i+1}</div>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">{test}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── API Coverage Tracking ── */}
      <div className="border-t border-border/50 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wifi size={20} className="text-cyan-400" />
              API Coverage Tracker
            </h2>
            <p className="text-sm text-textMuted mt-1">
              Track your API scenario and test case coverage alongside UI tests.
              Total API artifacts: <strong className="text-cyan-400">{totalApiCoverage}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ApiCoverageCard items={apiScenarios} type="scenarios" />
          <ApiCoverageCard items={apiTestCases}  type="testcases" />
        </div>

        {totalApiCoverage === 0 && (
          <div className="mt-6 bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-5 flex items-center gap-4">
            <Wifi size={32} className="text-cyan-400/40 shrink-0" />
            <div>
              <p className="text-white font-semibold">No API Artifacts Yet</p>
              <p className="text-textMuted text-sm mt-0.5">
                Visit <strong className="text-cyan-400">API Scenarios</strong> or <strong className="text-violet-400">API Test Cases</strong> in the sidebar to start generating API coverage.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
