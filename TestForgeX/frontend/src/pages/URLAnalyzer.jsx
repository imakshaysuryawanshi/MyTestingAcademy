import React, { useState } from "react";
import { Link2, LayoutTemplate, Loader2, MousePointerClick, Type, Link as LinkIcon, Sparkles, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAppStore } from "../store/useAppStore";

export default function URLAnalyzer() {
    const { showToast, addStories, setScrapedElements } = useAppStore();
    const navigate = useNavigate();

    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);

    // ── Auto-Reset Logic ──
    React.useEffect(() => {
        if (!url && result) {
            setResult(null);
            setScrapedElements([]);
        }
    }, [url, result, setScrapedElements]);

    const handleAnalyze = async () => {
        let normalizedUrl = url.trim();
        if (!normalizedUrl) return;
        
        // Auto-prepend protocol if missing (Fix for redbus.in etc)
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = `https://${normalizedUrl}`;
            setUrl(normalizedUrl);
        }

        // Standard URL validation regex
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        
        if (!urlPattern.test(normalizedUrl)) {
            showToast("Please enter a valid application URL.", "error");
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const res = await api.analyzeURL(normalizedUrl);
            setResult(res.data);
            setScrapedElements(res.data.elements || []);
            showToast(`Analyzed — found ${res.data.elements.length} UI elements`, "success");
        } catch (error) {
            console.error("URL Analysis Error:", error);
            const msg = error.message || "Unknown error during analysis";
            if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
                showToast("Cannot connect to backend. Please verify the server is running on port 5000.", "error");
            } else {
                showToast(`Failed: ${msg}`, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateStories = async () => {
        if (!result) return;

        setGenerating(true);
        try {
            // Pass URL + extracted elements as context
            const context = `URL: ${result.url}\nExtracted Elements: ${result.elements.map(e => `${e.type} "${e.text || e.name || e.action || ''}" (id: ${e.id || 'n/a'})`).join(", ")}`;
            const res = await api.generateUserStories("url", context);

            if (res.success && res.data?.user_stories?.length > 0) {
                addStories(res.data.user_stories);
                showToast(`✓ ${res.data.user_stories.length} User Stories generated!`, "success");
                // Navigate to the User Stories page after a brief pause
                setTimeout(() => navigate("/stories"), 800);
            } else {
                showToast("No stories could be generated.", "error");
            }
        } catch (error) {
            showToast("Failed to generate stories", "error");
        } finally {
            setGenerating(false);
        }
    };

    const getElementIcon = (type) => {
        switch (type) {
            case "button": return <MousePointerClick size={16} className="text-blue-400" />;
            case "input":  return <Type size={16} className="text-green-400" />;
            case "link":   return <LinkIcon size={16} className="text-purple-400" />;
            default:       return <LayoutTemplate size={16} className="text-gray-400" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-accent/10 rounded-xl">
                    <Link2 className="text-accent" size={28} />
                </div>
                <h1 className="text-3xl font-bold text-white">URL Analyzer</h1>
                <span className="ml-2 text-xs font-semibold px-2 py-1 bg-gradient-to-r from-accent/20 to-blue-500/20 text-accent rounded whitespace-nowrap border border-accent/20 tracking-wider">
                    AI VISION EXTRACTOR
                </span>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-lg mb-8">
                <p className="text-textMuted mb-6">Enter a web application URL and our AI will parse the DOM and vision metadata to extract actionable UI elements for testing.</p>

                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAnalyze();
                    }}
                    className="flex flex-col md:flex-row gap-4"
                >
                    <label htmlFor="analyze-url" className="sr-only">Application URL to Analyze</label>
                    <input
                        id="analyze-url"
                        name="analyze-url"
                        className="input flex-1"
                        placeholder="Enter Full Web App URL (e.g. https://google.com)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn px-8 text-lg font-semibold shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                        {loading ? "Analyzing…" : "Analyze"}
                    </button>
                </form>
            </div>

            {result && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-100 fill-mode-both">
                    {/* Step 4: Intelligent AI Summary */}
                    {result.intelligence && (
                        <div className="bg-[#121A26] p-6 rounded-2xl border border-accent/20 mb-8 shadow-inner shadow-accent/5">
                            <div className="flex items-center gap-2 mb-6 text-white border-b border-border pb-3">
                                <Sparkles className="text-accent" size={20} />
                                <h3 className="text-xl font-bold tracking-wide">AI Application Intelligence</h3>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-xs uppercase font-bold tracking-widest text-textMuted">App Type:</span>
                                    <span className="text-xs text-accent px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">{result.intelligence.app_type || result.intelligence.processed_data?.app_type || "Generic Application"}</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                <section>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                       <LayoutTemplate size={14} className="text-accent" />
                                       Identified Features
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(result.intelligence.features || result.intelligence.processed_data?.features || []).map((f, idx) => (
                                            <span key={idx} className="bg-sidebar border border-border px-3 py-1.5 rounded-xl text-sm text-white font-medium shadow-sm">{f}</span>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                       <Sparkles size={14} className="text-blue-400" />
                                       Detected User Flows
                                    </h4>
                                    <div className="space-y-2">
                                        {(result.intelligence.flows || result.intelligence.processed_data?.flows || []).map((flow, idx) => (
                                            <div key={idx} className="p-3 bg-sidebar border border-border rounded-xl text-xs text-gray-300 flex items-center gap-3">
                                                <div className="w-5 h-5 bg-border rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">{idx+1}</div>
                                                {typeof flow === 'string' ? flow : (flow.name || "Process Flow")}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <p className="text-xs text-textMuted font-mono italic p-3 bg-black/30 rounded-lg border border-white/5 opacity-80 leading-relaxed shadow-lg">
                                {result.intelligence.raw_summary || "Our AI detected the core architectural pattern and mapped out user interaction flows for test scenario synthesis."}
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-wide">Extracted DOM Element Context</h2>
                        <span className="text-xs bg-sidebar text-textMuted px-3 py-1 rounded-full border border-border">
                            Target: {result.url}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.elements.map((el, i) => (
                            <div key={i} className="flex flex-col gap-2 p-4 bg-sidebar rounded-xl border border-border/50 shadow-sm group hover:border-accent/40 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-mono text-xs uppercase font-semibold text-gray-300">
                                        {getElementIcon(el.type)}
                                        {el.type}
                                    </div>
                                    {el.id && (
                                        <span className="text-[10px] text-accent font-mono">#{el.id}</span>
                                    )}
                                </div>

                                <div className="text-sm font-medium text-white tracking-wide truncate">
                                    {el.text || el.name || el.action || "Unnamed Node"}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-6 flex items-center justify-between mt-4 border-t border-border">
                        <p className="text-sm text-textMuted">
                            <span className="text-accent font-semibold">{result.elements.length} elements</span> extracted — ready for Story synthesis
                        </p>
                        <button
                            onClick={handleGenerateStories}
                            disabled={generating}
                            className="btn px-6 text-sm flex items-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {generating
                                ? <><Loader2 className="animate-spin" size={16} /> Synthesis in progress…</>
                                : <><Sparkles size={16} /> Generate User Stories</>
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
