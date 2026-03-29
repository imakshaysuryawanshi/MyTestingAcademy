import React, { useState, useRef } from "react";
import {
  Users, Loader2, Link2, ClipboardList, Send, Sparkles,
  FileText, ListChecks, FlaskConical, Copy, RotateCcw,
  CheckCircle2, ChevronDown, ChevronUp, Zap, Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAppStore } from "../store/AppContext";

// ─── Story Card action button ─────────────────────────────────────────────────
function ActionButton({ onClick, loading, icon: Icon, label, variant = "default" }) {
  const variants = {
    default: "border-accent/40 text-accent bg-accent/5 hover:bg-accent/15",
    purple:  "border-purple-400/40 text-purple-400 bg-purple-400/5 hover:bg-purple-400/15",
    blue:    "border-blue-400/40 text-blue-400 bg-blue-400/5 hover:bg-blue-400/15",
    green:   "border-green-400/40 text-green-400 bg-green-400/5 hover:bg-green-400/15",
    gray:    "border-border text-textMuted hover:text-white hover:border-white/30",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      {label}
    </button>
  );
}

// ─── Individual story card (Phase 16 + 17 + 18) ───────────────────────────────
function StoryCard({ story, onRegenerate }) {
  const { setTestCases, setTestPlans, showToast } = useAppStore();
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState(null); // 'plan'|'scenarios'|'cases'|'adv'|'regen'|'copy'
  const [expanded, setExpanded] = useState(true);

  const withLoading = async (key, fn) => {
    setLoadingAction(key);
    try { await fn(); }
    catch { showToast("Action failed. Please retry.", "error"); }
    finally { setLoadingAction(null); }
  };

  const handleTestPlan = () => withLoading("plan", async () => {
    const res = await api.generateTestPlan({ 
      title: `${story.title} — ${story.description}`, 
      criteria: (story.acceptance_criteria || []).join('\n') 
    });
    if (res.success) {
      setTestPlans(prev => [...prev, res.data]);
      showToast("✓ Test Plan generated!", "success");
      setTimeout(() => navigate("/testplans"), 800);
    }
  });

  const handleScenarios = () => withLoading("scenarios", async () => {
    const res = await api.generateScenarios(story);
    if (res.success) {
      localStorage.setItem("tfx_scenarios", JSON.stringify(res.data));
      showToast(`✓ ${res.data.length} Scenarios generated!`, "success");
      setTimeout(() => navigate("/scenarios"), 800);
    }
  });

  const handleGenerateCases = () => withLoading("cases", async () => {
    // Compact Context for higher speed
    const context = `STORY: ${story.title} | DESC: ${story.description} | AC: ${(story.acceptance_criteria || []).join('; ')}`;
    const res = await api.generateTestCases(context);
    if (res.success) {
      // Ensure we always get a flat array regardless of AI response shape
      let cases = res.data;
      if (!Array.isArray(cases)) {
        cases = cases?.test_cases || cases?.cases || cases?.result || (cases ? [cases] : []);
      }
      if (cases.length === 0) {
        showToast("AI returned 0 test cases. Try again.", "error");
        return;
      }
      setTestCases(prev => [...prev, ...cases]);
      showToast(`✓ ${cases.length} Test Cases generated!`, "success");
      setTimeout(() => navigate("/testcases"), 800);
    }
  });

  const handleCopy = () => {
    const text = `${story.title}\n\n${story.description}\n\nAcceptance Criteria:\n${(story.acceptance_criteria || []).map(c => `• ${c}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    showToast("Copied!", "info");
  };

  return (
    <div className="bg-[#121821] rounded-2xl border border-[#1F2A37]/60 relative overflow-hidden group hover:border-accent/40 transition-all duration-300 shadow-sm">
      {/* left accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent/80 to-accent/20 rounded-l-2xl" />

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 pt-5 pb-3 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <h3 className="text-lg font-semibold text-white tracking-wide flex-1 pr-4">{story.title}</h3>
        <span className="text-textMuted flex-shrink-0">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </div>

      {expanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Description */}
          <div className="bg-[#0B0F14] p-4 rounded-xl border border-border shadow-inner">
            <span className="font-mono text-xs text-accent uppercase font-bold tracking-wider mb-2 block">Story Frame</span>
            <p className="text-gray-300 text-sm leading-relaxed">{story.description}</p>
          </div>

          {/* Acceptance Criteria */}
          {story.acceptance_criteria?.length > 0 && (
            <div>
              <span className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2 block">Acceptance Criteria</span>
              <ul className="space-y-1.5">
                {story.acceptance_criteria.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-textMuted">
                    <CheckCircle2 size={14} className="text-accent mt-0.5 flex-shrink-0" />
                    {typeof c === "string" 
                      ? c 
                      : (c.criteria 
                          ? `${c.scenario ? c.scenario + ': ' : ''}${c.criteria}` 
                          : Object.entries(c).map(([k,v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join(" | "))
                    }
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Pipeline Action Buttons (Phase 17 + 18) ── */}
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-textMuted mb-2 font-medium uppercase tracking-wider">Generate From This Story</p>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={handleTestPlan}      loading={loadingAction === "plan"}      icon={FileText}      label="Test Plan"             variant="purple" />
              <ActionButton onClick={handleScenarios}     loading={loadingAction === "scenarios"} icon={FlaskConical}  label="Test Scenarios"        variant="blue"   />
              <ActionButton onClick={handleGenerateCases} loading={loadingAction === "cases"} icon={Zap} label="Test Cases" variant="green" />
              <ActionButton onClick={handleCopy}          loading={false}                         icon={Copy}          label="Copy"                  variant="gray"   />
              <ActionButton onClick={onRegenerate}        loading={loadingAction === "regen"}      icon={RotateCcw}    label="Regenerate"            variant="gray"   />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main UserStories Page ────────────────────────────────────────────────────
export default function UserStories() {
  const { stories, setStories, showToast } = useAppStore();
  const [sourceType, setSourceType] = useState("url");
  const [inputData, setInputData] = useState("");
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    if (!inputData.trim()) {
      showToast("Please provide source data.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.generateUserStories(sourceType, inputData);
      const newStories = res.data.user_stories || [];
      // persist to global context 
      setStories(prev => {
        const existing = new Set(prev.map(s => s.title));
        return [...newStories.filter(s => !existing.has(s.title)), ...prev];
      });
      showToast(`✓ ${newStories.length} User Stories generated!`, "success");
    } catch {
      showToast("Failed to generate User Stories", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (idx) => {
    const story = stories[idx];
    if (!story) return;
    try {
      const res = await api.generateUserStories(sourceType, story.title);
      const regen = res.data.user_stories || [];
      if (regen.length > 0) {
        setStories(prev => {
          const updated = [...prev];
          updated[idx] = regen[0];
          return updated;
        });
        showToast("Story regenerated", "info");
      }
    } catch {
      showToast("Regenerate failed", "error");
    }
  };

  const handleExportCSV = () => {
    if (stories.length === 0) return;
    const headers = ["Title", "Description", "Acceptance_Criteria"];
    const csvRows = [headers.join(",")];
    stories.forEach(s => {
      const cols = [
        `"${(s.title || "").replace(/"/g, '""')}"`,
        `"${(s.description || "").replace(/"/g, '""')}"`,
        `"${(s.acceptance_criteria || []).join(" | ").replace(/"/g, '""')}"`
      ];
      csvRows.push(cols.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user_stories_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast("✓ CSV Export successful", "success");
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent/10 rounded-xl">
          <Users className="text-accent" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">User Stories Generator</h1>
          <p className="text-sm text-textMuted mt-1 tracking-wide">AI-Powered Agile Requirement Creation</p>
        </div>
      </div>

      {/* ── Input Card ── */}
      <div className="bg-card p-8 rounded-2xl border border-border shadow-lg mb-8">
        {/* Source Tabs */}
        <div className="flex gap-3 mb-6 border-b border-border/50 pb-4">
          {[
            { key: "url",  label: "From URL Analysis",     icon: Link2          },
            { key: "plan", label: "From Test Plan Outline", icon: ClipboardList  },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setSourceType(tab.key); setInputData(""); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  sourceType === tab.key
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            {sourceType === "url" ? "Target Application URL" : "Test Plan Summary / Scope"}
          </label>
          <div className="flex flex-col md:flex-row gap-4">
            {sourceType === "url" ? (
              <input
                className="input flex-1 h-12"
                placeholder="https://app.example.com"
                value={inputData}
                onChange={e => setInputData(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
              />
            ) : (
              <textarea
                className="input flex-1 min-h-[80px] pt-3 resize-none"
                placeholder="Describe the test plan scope…"
                rows={3}
                value={inputData}
                onChange={e => setInputData(e.target.value)}
              />
            )}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`btn px-8 text-sm font-semibold shadow-lg shadow-accent/20 flex items-center justify-center gap-2 h-12 self-start ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {loading ? "Generating…" : "Generate Stories"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Results (Phase 16: inline, no redirect) ── */}
      {loading && (
        <div className="flex items-center gap-3 text-accent bg-accent/5 border border-accent/20 rounded-xl px-6 py-4 mb-6 animate-pulse">
          <Loader2 className="animate-spin" size={20} />
          <span className="font-medium">Generating User Stories…</span>
        </div>
      )}

      {stories.length > 0 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-xl font-bold text-white">
              Generated Stories
              <span className="ml-2 text-sm font-normal text-textMuted">({stories.length})</span>
            </h2>
            <div className="flex gap-3 items-center">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1 bg-textMuted/10 text-textMuted hover:text-white hover:bg-white/10 border border-border rounded-lg text-xs font-semibold transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>
              <button
                onClick={() => { setStories([]); showToast("Stories cleared", "info"); }}
                className="text-xs text-textMuted hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {stories.map((story, i) => (
            <StoryCard
              key={i}
              story={story}
              onRegenerate={() => handleRegenerate(i)}
            />
          ))}
        </div>
      )}

      {!loading && stories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-60">
          <Users size={48} className="text-textMuted" />
          <p className="text-textMuted">No user stories generated yet. Enter a URL or plan context and click Generate.</p>
        </div>
      )}
    </div>
  );
}
