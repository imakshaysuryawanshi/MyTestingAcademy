import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/AppContext";
import {
  Users, FileText, ListChecks, ShieldCheck,
  AlertTriangle, Lightbulb, Kanban, Link2, Sparkles,
  ArrowRight, TrendingUp
} from "lucide-react";

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, color, to }) {
  return (
    <Link to={to} className="group bg-[#121821] rounded-2xl border border-[#1F2A37] p-6 flex flex-col gap-3 hover:border-accent/40 hover:bg-[#141c26] transition-all duration-200 cursor-pointer">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold tracking-widest uppercase ${color}`}>{label}</span>
        <div className={`p-2 rounded-xl bg-white/5`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      <div className="text-4xl font-bold text-white tracking-tight">{value}</div>
      <div className="flex items-center gap-1 text-xs text-textMuted group-hover:text-accent transition-colors">
        View details <ArrowRight size={12} />
      </div>
    </Link>
  );
}

// ── Coverage Bar ─────────────────────────────────────────────────────────────
function CoverageBar({ label, pct, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className={`font-bold ${color}`}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-sidebar rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct >= 80 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Insight Row ───────────────────────────────────────────────────────────────
function Insight({ type, text }) {
  const isWarning = type === "warning";
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${isWarning ? "bg-yellow-500/5 border-yellow-500/20" : "bg-blue-500/5 border-blue-500/20"}`}>
      {isWarning
        ? <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        : <Lightbulb size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />}
      <p className={`text-sm ${isWarning ? "text-yellow-200/80" : "text-blue-200/80"}`}>{text}</p>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { stories, testPlans, testCases } = useAppStore();

  // Coverage calculation based on real data
  const coveragePct = useMemo(() => {
    if (testCases.length === 0) return 0;
    const total = testCases.length;
    const covered = testCases.filter(tc => tc.status && tc.status !== "Untested").length;
    return Math.round((covered / total) * 100);
  }, [testCases]);

  // Dynamic AI insights
  const insights = useMemo(() => {
    const items = [];
    if (stories.length === 0)
      items.push({ type: "tip",     text: "No User Stories yet — import from Jira or analyze a URL to get started." });
    if (stories.length > 0 && testPlans.length === 0)
      items.push({ type: "warning", text: `${stories.length} User ${stories.length === 1 ? "Story" : "Stories"} without a Test Plan — generate one from the Stories page.` });
    if (testCases.length > 0 && coveragePct < 50)
      items.push({ type: "warning", text: `Coverage is critically low (${coveragePct}%) — run a Coverage Analysis to identify gaps.` });
    if (testCases.length > 0 && coveragePct >= 50 && coveragePct < 80)
      items.push({ type: "warning", text: `Coverage at ${coveragePct}% — edge cases and boundary values may be missing.` });
    if (testCases.length >= 5 && coveragePct >= 80)
      items.push({ type: "tip",     text: `Great coverage (${coveragePct}%)! Consider generating Selenium automation code from the CodeGen module.` });
    if (testPlans.length > 0 && testCases.length === 0)
      items.push({ type: "tip",     text: "Test plan exists — generate Test Cases from your User Stories to build your test suite." });
    if (items.length === 0)
      items.push({ type: "tip",     text: "Your QA pipeline looks healthy! Keep iterating on stories and test coverage." });
    return items;
  }, [stories, testPlans, testCases, coveragePct]);

  // Module coverage breakdown (simulated with real totals as seed)
  const coverageModules = useMemo(() => {
    if (testCases.length === 0) {
      return [
        { label: "User Auth",  pct: 0 },
        { label: "Checkout",   pct: 0 },
        { label: "Dashboard",  pct: 0 },
        { label: "API Layer",  pct: 0 },
      ];
    }
    return [
      { label: "User Auth",  pct: Math.min(100, testCases.length * 12 + 20) },
      { label: "Checkout",   pct: Math.min(100, testCases.length * 8  + 45) },
      { label: "Dashboard",  pct: Math.min(100, testCases.length * 6  + 60) },
      { label: "API Layer",  pct: Math.min(100, testCases.filter(t => t.Category === "Functional" || t.type === "Functional").length * 15 + 30) },
    ];
  }, [testCases]);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">QA Command Centre</h1>
          <p className="text-textMuted text-sm mt-1">
            Lifecycle view: Stories → Plans → Cases → Coverage
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-accent/10 border border-accent/20 text-accent px-3 py-1.5 rounded-full uppercase tracking-widest">
          <TrendingUp size={14} />
          Live Metrics
        </div>
      </div>

      {/* ── Section 1: Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="User Stories" value={stories.length}    icon={Users}      color="text-green-400"  to="/stories"   />
        <MetricCard label="Test Plans"   value={testPlans.length}  icon={FileText}   color="text-purple-400" to="/testplans"  />
        <MetricCard label="Test Cases"   value={testCases.length}  icon={ListChecks} color="text-blue-400"   to="/testcases"  />
        <MetricCard label="Coverage"     value={`${coveragePct}%`} icon={ShieldCheck} color={coveragePct >= 80 ? "text-green-400" : coveragePct >= 50 ? "text-yellow-400" : "text-red-400"} to="/coverage" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* ── Section 2: AI Insights ── */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-accent" />
            <h2 className="text-lg font-bold text-white">AI Insights</h2>
          </div>
          {insights.map((ins, i) => <Insight key={i} type={ins.type} text={ins.text} />)}
        </div>

        {/* ── Section 3: Coverage Breakdown ── */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold text-white mb-5">Coverage Breakdown</h2>
          <div className="space-y-4">
            {coverageModules.map(m => (
              <CoverageBar
                key={m.label}
                label={m.label}
                pct={m.pct}
                color={m.pct >= 80 ? "text-green-400" : m.pct >= 50 ? "text-yellow-400" : "text-red-400"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 4: Quick Actions ── */}
      <div className="bg-card p-6 rounded-2xl border border-border">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          <p className="text-textMuted text-sm mt-1">Jump-start your QA workflow.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/jira"    className="btn flex items-center gap-2 shadow-lg shadow-accent/20">
            <Kanban size={16} /> Import from Jira
          </Link>
          <Link to="/url"     className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-accent text-accent hover:bg-accent/10 transition-colors">
            <Link2 size={16} /> Analyze URL
          </Link>
          <Link to="/stories" className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-purple-400/50 text-purple-400 hover:bg-purple-400/10 transition-colors">
            <Users size={16} /> Generate User Stories
          </Link>
        </div>
      </div>

      {/* ── Section 5: Recent Activity ── */}
      {(testCases.length > 0 || testPlans.length > 0 || stories.length > 0) && (
        <div className="mt-6 bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {testCases.slice(-3).reverse().map((tc, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-border/50 last:border-0">
                <ListChecks size={14} className="text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 flex-1 truncate">Test Case: <span className="text-white">{tc.title || tc.id}</span></span>
                <span className="text-xs text-textMuted bg-sidebar px-2 py-0.5 rounded font-mono">{tc.status || "Untested"}</span>
              </div>
            ))}
            {testPlans.slice(-2).reverse().map((tp, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-border/50 last:border-0">
                <FileText size={14} className="text-purple-400 flex-shrink-0" />
                <span className="text-gray-300 flex-1 truncate">Test Plan: <span className="text-white">{(tp.objective || "").substring(0, 50)}…</span></span>
                <span className="text-xs text-textMuted bg-sidebar px-2 py-0.5 rounded">DRAFT</span>
              </div>
            ))}
            {stories.slice(-2).reverse().map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-border/50 last:border-0">
                <Users size={14} className="text-green-400 flex-shrink-0" />
                <span className="text-gray-300 flex-1 truncate">User Story: <span className="text-white">{s.title}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
