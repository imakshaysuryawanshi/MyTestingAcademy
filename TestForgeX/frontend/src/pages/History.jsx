import React, { useState } from "react";
import { History as HistoryIcon, Trash2, Trash, FileText, ListChecks, Users, AlertTriangle, Clock, FlaskConical, Wifi, Code2 } from "lucide-react";
import { useAppStore } from "../store/AppContext";

const TABS = [
  { key: "all",          label: "All",              icon: HistoryIcon },
  { key: "testCases",    label: "Test Cases",       icon: ListChecks },
  { key: "testPlans",    label: "Test Plans",       icon: FileText },
  { key: "scenarios",    label: "Test Scenarios",   icon: FlaskConical },
  { key: "stories",      label: "User Stories",     icon: Users },
  { key: "apiScenarios", label: "API Scenarios",    icon: Wifi },
  { key: "apiTestCases", label: "API Test Cases",   icon: Code2 },
];

const typeConfig = {
  testCases:    { label: "Test Case",      color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20"  },
  testPlans:    { label: "Test Plan",      color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  scenarios:    { label: "Test Scenario",  color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/20"  },
  stories:      { label: "User Story",     color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20"  },
  apiScenarios: { label: "API Scenario",   color: "text-cyan-400",   bg: "bg-cyan-400/10",   border: "border-cyan-400/20"   },
  apiTestCases: { label: "API Test Case",  color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
};

export default function HistoryPage() {
  const { testCases, setTestCases, testPlans, setTestPlans, stories, setStories, scenarios, setScenarios,
          apiScenarios, setApiScenarios, apiTestCases, setApiTestCases, showToast } = useAppStore();
  const [activeTab, setActiveTab] = useState("all");
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Normalize all items into a unified list with a type tag
  const allItems = [
    ...testCases.map(c    => ({ ...c,  _type: "testCases",    _label: c.title || c.id || "Untitled Case" })),
    ...testPlans.map((p, i) => ({
      ...p,
      _type: "testPlans",
      _label: (p.objective && !p.objective.startsWith('%') && p.objective.length < 120)
        ? p.objective.substring(0, 80) + (p.objective.length > 80 ? "…" : "")
        : `Test Plan #${i + 1}`,
      _sub: p.scope || null,
    })),
    ...scenarios.map(sc   => ({ ...sc, _type: "scenarios",    _label: sc.title || "Untitled Scenario" })),
    ...stories.map(s      => ({ ...s,  _type: "stories",      _label: s.title  || "Untitled Story" })),
    ...apiScenarios.map(a => ({ ...a,  _type: "apiScenarios", _label: a.title  || "Untitled API Scenario", _sub: a.endpoint_hint || null })),
    ...apiTestCases.map(a => ({ ...a,  _type: "apiTestCases", _label: a.title  || "Untitled API Test Case", _sub: a.request ? `${a.request.method} ${a.request.endpoint}` : null })),
  ];

  const visibleItems = activeTab === "all" ? allItems : allItems.filter(i => i._type === activeTab);

  const deleteItem = (item) => {
    if (item._type === "testCases")    setTestCases(prev    => prev.filter(c  => c.id     !== item.id));
    if (item._type === "testPlans")    setTestPlans(prev    => prev.filter((_, i) => i    !== prev.indexOf(item)));
    if (item._type === "scenarios")    setScenarios(prev    => prev.filter(sc => sc.title !== item.title));
    if (item._type === "stories")      setStories(prev      => prev.filter(s  => s.title  !== item.title));
    if (item._type === "apiScenarios") setApiScenarios(prev => prev.filter(a  => a.id     !== item.id && a.title !== item.title));
    if (item._type === "apiTestCases") setApiTestCases(prev => prev.filter(a  => a.id     !== item.id && a.title !== item.title));
    showToast("Item removed from history", "info");
  };

  const clearAll = () => {
    setTestCases([]);
    setTestPlans([]);
    setStories([]);
    setScenarios([]);
    setApiScenarios([]);
    setApiTestCases([]);
    setShowConfirmClear(false);
    showToast("History cleared", "success");
  };

  const counts = {
    testCases:    testCases.length,
    testPlans:    testPlans.length,
    scenarios:    scenarios.length,
    stories:      stories.length,
    apiScenarios: apiScenarios.length,
    apiTestCases: apiTestCases.length,
    total:        allItems.length,
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-xl">
            <HistoryIcon className="text-accent" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Activity History</h1>
            <p className="text-sm text-textMuted mt-1">
              {counts.total} recorded artifacts — Test Cases, Scenarios, Stories, Plans
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfirmClear(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
        >
          <Trash size={16} /> Clear All History
        </button>
      </div>

      {/* Confirm Clear Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-red-500/10 rounded-full">
                <AlertTriangle className="text-red-400" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white">Clear All History?</h2>
              <p className="text-textMuted text-sm">
                This will permanently delete all {counts.total} items — test cases, test scenarios, user stories, and test plans — from your local storage. This cannot be undone.
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-border text-textMuted hover:bg-card hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAll}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Test Cases",    count: counts.testCases,    color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20"  },
          { label: "Test Plans",    count: counts.testPlans,    color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
          { label: "Test Scenarios",count: counts.scenarios,    color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/20"  },
          { label: "User Stories",  count: counts.stories,      color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20"  },
          { label: "API Scenarios", count: counts.apiScenarios, color: "text-cyan-400",   bg: "bg-cyan-400/10",   border: "border-cyan-400/20"   },
          { label: "API Test Cases",count: counts.apiTestCases, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20" },
        ].map(stat => (
          <div key={stat.label} className={`bg-card rounded-xl border ${stat.border} p-4 flex flex-col items-center justify-center text-center`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
            <div className={`text-[10px] font-medium ${stat.color} opacity-80 mt-0.5`}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-card border border-border rounded-xl p-1.5 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const count = tab.key === "all" ? counts.total : counts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-accent text-black shadow-sm shadow-accent/30"
                  : "text-textMuted hover:text-white"
              }`}
            >
              <Icon size={15} />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-black/20" : "bg-sidebar"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Items List */}
      {visibleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="p-6 bg-card rounded-2xl border border-border">
            <Clock className="text-textMuted mx-auto" size={48} />
          </div>
          <h3 className="text-xl font-bold text-white">No history yet</h3>
          <p className="text-textMuted text-sm max-w-sm">
            Artifacts you generate — test cases, scenarios, stories, or plans — will appear here for review and management.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item, idx) => {
            const cfg = typeConfig[item._type];
            return (
              <div
                key={`${item._type}-${idx}`}
                className="group bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between hover:border-accent/30 transition-all duration-200"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} whitespace-nowrap flex-shrink-0`}>
                    {cfg.label}
                  </span>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{item._label}</p>
                      {item._type === "testCases" && item.id && (
                        <p className="text-xs text-textMuted mt-0.5 font-mono">{item.id}</p>
                      )}
                      {item._type === "testCases" && item.priority && (
                        <span className="text-xs text-textMuted">Priority: {item.priority} · Type: {item.type}</span>
                      )}
                  {item._type === "apiScenarios" && item.endpoint_hint && (
                    <p className="text-xs text-textMuted mt-0.5 truncate max-w-xl font-mono">{item.endpoint_hint}</p>
                  )}
                  {item._type === "apiTestCases" && item._sub && (
                    <p className="text-xs text-textMuted mt-0.5 font-mono">{item._sub}</p>
                  )}
                    </div>
                </div>

                <button
                  onClick={() => deleteItem(item)}
                  className="ml-4 flex-shrink-0 p-2 rounded-lg text-textMuted opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                  title="Delete this item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
