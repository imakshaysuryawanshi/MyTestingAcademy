import React, { useState } from "react";
import { Kanban, Loader2, CheckCircle2 } from "lucide-react";
import { useAppStore } from "../store/AppContext";
import { api } from "../services/api";

export default function Jira() {
    const { stories, setStories, setTestCases, showToast } = useAppStore();
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [creds, setCreds] = useState({
        url: '', email: '', token: ''
    });

    const handleFetch = async () => {
        if (!creds.url || !creds.email || !creds.token) {
            showToast("Please fill in all Jira credentials.", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await api.fetchJira(creds);
            setStories(response.data); // Update global state
            showToast(`Successfully synced ${response.data.length} stories!`, "success");
        } catch (error) {
            showToast(error.message || "Failed to sync with Jira", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCases = async (story) => {
        setLoading(true);
        try {
            showToast(`Generating AI test cases for ${story.id}...`, "info");
            const response = await api.generateTestCases(story);
            
            // Append new cases to existing state
            setTestCases(prev => [...prev, ...response.data]);
            showToast(`Generated ${response.data.length} test cases successfully!`, "success");
        } catch (error) {
            showToast("AI Generation Failed: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-accent/10 rounded-xl">
                    <Kanban className="text-accent" size={28} />
                </div>
                <h1 className="text-3xl font-bold text-white">Jira Integration</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Credentials Panel */}
                <div className="bg-card p-8 rounded-2xl border border-border shadow-lg h-fit">
                    <p className="text-textMuted mb-6">Connect to your Jira workspace to synchronize epics and user stories directly into TestForgeX.</p>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Workspace URL</label>
                            <input 
                                className="input" 
                                placeholder="https://your-domain.atlassian.net" 
                                value={creds.url}
                                onChange={e => setCreds({...creds, url: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                            <input 
                                className="input" 
                                placeholder="you@company.com" 
                                type="email" 
                                value={creds.email}
                                onChange={e => setCreds({...creds, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">API Token</label>
                            <input 
                                className="input" 
                                placeholder="Paste your Jira API token here" 
                                type="password" 
                                value={creds.token}
                                onChange={e => setCreds({...creds, token: e.target.value})}
                            />
                        </div>
                        
                        <button 
                            onClick={handleFetch}
                            disabled={loading}
                            className={`btn w-full mt-4 py-3 text-lg flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading && <Loader2 className="animate-spin" size={20} />}
                            <span>{loading ? 'Processing...' : 'Connect & Sync Stories'}</span>
                        </button>
                    </div>
                </div>

                {/* Extracted Stories Panel */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center justify-between">
                        Synced Stories
                        <span className="text-xs font-normal text-textMuted bg-card px-3 py-1 rounded-full border border-border">
                            {stories.length} Items
                        </span>
                    </h2>

                    {stories.length === 0 ? (
                        <div className="bg-card/50 border border-border border-dashed rounded-xl p-8 text-center text-textMuted">
                            No stories synced yet. Enter credentials to fetch.
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {stories.map(story => (
                                <div key={story.id} className="bg-card p-5 rounded-xl border border-border shadow-sm transition-colors relative group overflow-hidden">
                                    <div className="flex items-start justify-between mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">{story.id}</span>
                                            <h3 className="font-medium text-white line-clamp-1 truncate pr-8">{story.title}</h3>
                                        </div>
                                    </div>
                                    <div className="text-sm text-textMuted mt-3 pl-3 border-l-2 border-border/50 relative z-10">
                                        <strong className="text-gray-400">Acceptance Criteria:</strong>
                                        <p className="mt-1 line-clamp-3 leading-relaxed whitespace-pre-wrap">{story.acceptanceCriteria}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border flex justify-end gap-3 relative z-10">
                                        <button className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-white/5 text-gray-300 font-medium transition-colors">
                                            Generate Test Plan
                                        </button>
                                        <button 
                                            onClick={() => handleGenerateCases(story)}
                                            className="text-xs px-4 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-black transition-colors font-semibold shadow-lg shadow-accent/5 flex items-center gap-2"
                                        >
                                            Generate Cases
                                        </button>
                                    </div>
                                    
                                    {/* Hover gradient effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
