import React, { useState } from "react";
import { Kanban, Loader2, Zap, FileText, Bug, Terminal, Database, Search, Trash2, ChevronDown, ChevronUp, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Jira() {
    const {
        stories, setStories, addStories,
        testPlans, addTestPlans,
        scenarios, addScenarios,
        testCases, addTestCases,
        apiScenarios, addApiScenarios,
        showToast
    } = useAppStore();

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null); // 'all' | 'plan' | 'cases' | 'api' | 'code'
    const [task, setTask] = useState("");
    const [issueId, setIssueId] = useState("");
    const [contexts, setContexts] = useState({});       // { [storyId]: string }
    const [expanded, setExpanded] = useState({});        // { [storyId]: bool } for description toggle

    // ── Helpers ─────────────────────────────────────────────────────────────
    const getCreds = () => {
        try {
            const saved = localStorage.getItem('tfx_jira_creds');
            if (saved) return JSON.parse(saved);
        } catch {}
        return { url: '', email: '', token: '' };
    };

    const getArtifactCounts = (storyId) => ({
        plans: (testPlans || []).filter(p => p.source === storyId).length,
        scenarios: (scenarios || []).filter(s => s.storyId === storyId).length,
        cases: (testCases || []).filter(c => c.storyId === storyId).length,
    });

    const toggleExpanded = (storyId) => {
        setExpanded(prev => ({ ...prev, [storyId]: !prev[storyId] }));
    };

    // ── Fetch Issue by ID (On-Demand) ───────────────────────────────────────
    const handleFetchIssue = async () => {
        if (!issueId.trim()) {
            showToast("Please enter a Jira Issue ID (e.g. TFX-101)", "error");
            return;
        }
        setLoading(true);
        setTask("Syncing with Atlassian...");
        try {
            const response = await api.fetchJira(issueId.trim(), getCreds());
            const story = { ...response.data, source: 'jira', _syncedAt: new Date().toISOString() };
            setStories(prev => {
                const filtered = prev.filter(s => s.id !== story.id);
                return [story, ...filtered];
            });
            showToast(`Story ${story.id} synchronized successfully!`, "success");
            setIssueId("");
        } catch (error) {
            showToast(error.message || "Failed to fetch from Jira", "error");
        } finally {
            setLoading(false);
            setTask("");
        }
    };

    // ── Generate All Artifacts ──────────────────────────────────────────────
    const handleGenerateAll = async (story) => {
        setLoading(true);
        setLoadingAction('all');
        setTask(`Generating QA Suite...`);
        try {
            const additionalContext = contexts[story.id] || "";
            const response = await api.generateJiraArtifacts({ ...story, additionalContext });
            const data = response.data;
            if (!data) throw new Error("AI returned unparseable content. Try refining your context or checking backend connectivity.");

            let counts = { plan: 0, scenarios: 0, cases: 0 };

            // 1. Process Plan
            if (data.test_plan) {
                const plan = {
                    ...(typeof data.test_plan === 'object' ? data.test_plan : { Content: data.test_plan }),
                    id: `PLAN-${Date.now()}`,
                    title: `Test Plan: ${story.id} — ${story.title}`,
                    source: story.id,
                    _createdAt: new Date().toISOString()
                };
                addTestPlans([plan]);
                counts.plan = 1;
            }

            // 2. Process Scenarios
            const scens = api.extractArtifactList(data, ['test_scenarios', 'scenarios']).map(s => ({
                ...s,
                id: s.id || `SCEN-${Math.random().toString(36).substr(2, 5)}`,
                storyId: story.id,
                _createdAt: new Date().toISOString()
            }));
            if (scens.length > 0 && scens[0].title !== "Generated Output (unformatted)") {
                addScenarios(scens);
                counts.scenarios = scens.length;
            }

            // 3. Process Test Cases
            const cases = api.extractArtifactList(data, ['test_cases', 'cases']).map(c => ({
                ...c,
                id: c.id || `TC-${Math.random().toString(36).substr(2, 5)}`,
                storyId: story.id,
                Title: c.title || c.Title || "Generated Test Case",
                Steps: c.steps || c.Steps || [],
                ExpectedResult: c.expected_result || c.ExpectedResult || "Refer to description",
                _createdAt: new Date().toISOString()
            }));
            if (cases.length > 0 && cases[0].title !== "Generated Output (unformatted)") {
                addTestCases(cases);
                counts.cases = cases.length;
            }

            if (counts.plan === 0 && counts.scenarios === 0 && counts.cases === 0) {
                throw new Error("AI output parsed but no artifacts found. Ensure the model supports multi-artifact generation.");
            }

            setContexts(prev => ({ ...prev, [story.id]: "" }));
            showToast(`✓ Generated Suite: ${counts.plan} Plan · ${counts.scenarios} Scenarios · ${counts.cases} Cases`, "success");
        } catch (error) {
            showToast("AI Generation Error: " + error.message, "error");
        } finally {
            setLoading(false);
            setLoadingAction(null);
            setTask("");
        }
    };

    // ── Specific Generators ─────────────────────────────────────────────────
    const handleGeneratePlan = async (story) => {
        setLoading(true);
        setLoadingAction(`plan-${story.id}`);
        try {
            setTask("Designing Strategy...");
            const res = await api.generateTestPlan(story.title);
            if (res.data) {
                addTestPlans([res.data]);
                showToast("✓ Strategy Added", "success");
            }
        } catch (error) {
            showToast("Strategy Error: " + error.message, "error");
        } finally {
            setLoading(false);
            setLoadingAction(null);
            setTask("");
        }
    };

    const handleGenerateScenarios = async (story) => {
        setLoading(true);
        setLoadingAction(`scen-${story.id}`);
        try {
            setTask("Drafting Scenarios...");
            const res = await api.generateScenarios(story);
            if (res.success && Array.isArray(res.data)) {
                addScenarios(res.data);
                showToast(`✓ ${res.data.length} Scenarios Added`, "success");
            }
        } catch (error) {
            showToast("Scenarios Error: " + error.message, "error");
        } finally {
            setLoading(false);
            setLoadingAction(null);
            setTask("");
        }
    };

    const handleGenerateCases = async (story) => {
        setLoading(true);
        setLoadingAction(`case-${story.id}`);
        try {
            setTask("Writing Steps...");
            const res = await api.generateTestCases(story);
            if (res.success && Array.isArray(res.data)) {
                addTestCases(res.data);
                showToast(`✓ ${res.data.length} Test Cases Added`, "success");
            }
        } catch (error) {
            showToast("Test Case Error: " + error.message, "error");
        } finally {
            setLoading(false);
            setLoadingAction(null);
            setTask("");
        }
    };

    const handleGenerateApi = async (story) => {
        setLoading(true);
        setLoadingAction(`api-${story.id}`);
        try {
            setTask("Generating API Scenarios...");
            const res = await api.generateApiScenarios(story);
            if (res.success && Array.isArray(res.data)) {
                addApiScenarios(res.data);
                showToast(`✓ ${res.data.length} API Scenarios Added`, "success");
            }
        } catch (error) {
            showToast("API Error: " + error.message, "error");
        } finally {
            setLoading(false);
            setLoadingAction(null);
            setTask("");
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
                        <Kanban className="text-accent" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">JIRA SYNC</h1>
                        <p className="text-textMuted text-xs font-medium">On-demand synchronization for QA Artifact generation.</p>
                    </div>
                </div>
                {stories.length > 0 && (
                    <button
                        onClick={() => { setStories([]); showToast("All stories cleared", "info"); }}
                        className="p-2.5 rounded-xl border border-border text-textMuted hover:text-red-400 hover:bg-red-400/5 transition-all"
                        title="Clear Synced Stories"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative group mb-10">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    {loading
                        ? <Loader2 className="animate-spin text-accent" size={24} />
                        : <Search className="text-textMuted group-focus-within:text-accent transition-colors" size={24} />
                    }
                </div>
                <input
                    className="w-full h-14 pl-16 pr-40 bg-sidebar/50 border border-border/50 rounded-2xl text-lg font-bold text-white placeholder:text-textMuted/30 focus:border-accent focus:ring-0 transition-all outline-none shadow-xl backdrop-blur-xl"
                    placeholder="ENTER JIRA ISSUE ID (E.G. TFX-101)..."
                    value={issueId}
                    onChange={e => setIssueId(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleFetchIssue()}
                    disabled={loading}
                />
                <button
                    onClick={handleFetchIssue}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 px-8 py-3 bg-accent text-black font-black rounded-2xl hover:scale-[1.03] active:scale-[0.97] transition-all shadow-xl shadow-accent/20 disabled:opacity-50"
                >
                    {loading ? task : 'SYNC STORY'}
                </button>
            </div>

            {/* Stories Grid */}
            <div className="space-y-6">
                {stories.filter(s => s.source === 'jira').length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center opacity-30 select-none">
                        <Kanban size={64} className="mb-4" />
                        <p className="text-xl font-bold uppercase tracking-[0.2em]">Ready for Sync</p>
                        <p className="text-sm mt-2 max-w-xs mx-auto">Enter any Jira issue ID above to pull story data from Atlassian.</p>
                    </div>
                ) : (
                    stories.filter(s => s.source === 'jira').map(story => {
                        const counts = getArtifactCounts(story.id);
                        const hasArtifacts = counts.plans > 0 || counts.scenarios > 0 || counts.cases > 0;
                        const isExpanded = expanded[story.id];

                        return (
                            <div key={story.id} className="bg-card rounded-3xl border border-border/60 hover:border-accent/40 transition-all shadow-xl relative overflow-hidden flex flex-col group">

                                {/* Header with ID & Title */}
                                <div className="p-8 pb-4 relative z-10 flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg text-accent font-mono font-black text-sm tracking-tighter">
                                                {story.id}
                                            </span>
                                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-textMuted text-[10px] font-bold uppercase tracking-widest">
                                                {story.status || 'SYNCED'}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-black text-white group-hover:text-accent transition-colors leading-tight">
                                            {story.title}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setStories(prev => prev.filter(s => s.id !== story.id))}
                                        className="p-3 bg-white/5 rounded-2xl border border-white/10 text-textMuted hover:text-red-400 hover:bg-red-400/5 transition-all flex-shrink-0"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                {/* AI Scoping Context Input */}
                                <div className="px-8 py-4 relative z-10">
                                    <div className="p-4 bg-black/30 rounded-2xl border border-white/5 shadow-inner">
                                        <p className="text-[10px] font-black text-textMuted uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Zap size={12} className="text-accent" /> AI Scoping Context (Optional)
                                        </p>
                                        <textarea
                                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-300 resize-none min-h-[60px] outline-none"
                                            placeholder="Add technical constraints or scope refinement for the AI..."
                                            value={contexts[story.id] || ""}
                                            onChange={e => setContexts(prev => ({ ...prev, [story.id]: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* Collapsible Detailed Description (Read-Only) */}
                                {story.description && (
                                    <div className="px-8 pb-2 relative z-10">
                                        <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                                            <button
                                                onClick={() => toggleExpanded(story.id)}
                                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-all"
                                            >
                                                <span className="text-[11px] font-black text-textMuted uppercase tracking-widest flex items-center gap-2">
                                                    <BookOpen size={13} className="text-accent" />
                                                    Detailed Jira Description
                                                </span>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                            {isExpanded && (
                                                <div className="px-4 pb-5 pt-3 text-sm text-gray-400 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar border-t border-white/5 whitespace-pre-wrap">
                                                    {story.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Generated Artifact History for this Story */}
                                {hasArtifacts && (
                                    <div className="px-8 py-4 relative z-10 border-t border-white/5 mt-2 flex items-center gap-3">
                                        <span className="text-[10px] font-black text-textMuted uppercase tracking-widest flex items-center gap-1.5">
                                            <Clock size={11} className="text-accent" /> Artifact History:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {counts.plans > 0 && (
                                                <span onClick={() => navigate('/testplans')} className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-[10px] font-bold flex items-center gap-1.5 hover:bg-purple-500/20 cursor-pointer">
                                                    <CheckCircle2 size={10} /> {counts.plans} Plan
                                                </span>
                                            )}
                                            {counts.scenarios > 0 && (
                                                <span onClick={() => navigate('/scenarios')} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-bold flex items-center gap-1.5 hover:bg-amber-500/20 cursor-pointer">
                                                    <CheckCircle2 size={10} /> {counts.scenarios} Scen.
                                                </span>
                                            )}
                                            {counts.cases > 0 && (
                                                <span onClick={() => navigate('/testcases')} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold flex items-center gap-1.5 hover:bg-blue-500/20 cursor-pointer">
                                                    <CheckCircle2 size={10} /> {counts.cases} Cases
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Card Actions */}
                                <div className="px-8 py-6 bg-accent/5 mt-auto border-t border-accent/10 flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={() => handleGenerateAll(story)}
                                        disabled={loading}
                                        className="flex-1 min-w-[200px] h-12 bg-accent text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading && loadingAction === 'all' ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} fill="black" />}
                                        GENERATE FULL QA SUITE
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleGeneratePlan(story)} disabled={loading} className="px-4 h-12 bg-card border border-border text-textMuted hover:text-white hover:bg-white/5 rounded-2xl flex items-center gap-2 transition-all font-bold text-xs uppercase disabled:opacity-50">
                                            {loading && loadingAction === `plan-${story.id}` ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} PLAN
                                        </button>
                                        <button onClick={() => handleGenerateCases(story)} disabled={loading} className="px-4 h-12 bg-card border border-border text-textMuted hover:text-white hover:bg-white/5 rounded-2xl flex items-center gap-2 transition-all font-bold text-xs uppercase disabled:opacity-50">
                                            {loading && loadingAction === `cases-${story.id}` ? <Loader2 size={16} className="animate-spin" /> : <Bug size={16} />} CASES
                                        </button>
                                        <button onClick={() => handleGenerateApi(story)} disabled={loading} className="px-4 h-12 bg-card border border-border text-textMuted hover:text-white hover:bg-white/5 rounded-2xl flex items-center gap-2 transition-all font-bold text-xs uppercase disabled:opacity-50">
                                            {loading && loadingAction === `api-${story.id}` ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />} API
                                        </button>
                                        <button onClick={() => navigate('/codegen')} className="px-4 h-12 bg-card border border-border text-textMuted hover:text-white hover:bg-white/5 rounded-2xl flex items-center gap-2 transition-all font-bold text-xs uppercase">
                                            <Terminal size={16} /> CODE
                                        </button>
                                    </div>
                                </div>

                                {/* Ambient Glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
