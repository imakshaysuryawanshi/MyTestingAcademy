import React, { useState } from "react";
import { ShieldCheck, Activity, Target, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "../services/api";
import { useAppStore } from "../store/AppContext";

export default function Coverage() {
    const { testCases, showToast } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

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
        } catch (error) {
            showToast("Failed to analyze coverage", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-accent/10 rounded-xl">
                    <ShieldCheck className="text-accent" size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Coverage Optimizer</h1>
                    <p className="text-sm text-textMuted mt-1">Identify gaps in your testing strategy instantly.</p>
                </div>
            </div>

            <div className="bg-[#121821] p-8 rounded-2xl border border-border shadow flex flex-col md:flex-row items-center justify-between mb-10 overflow-hidden relative">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4 text-accent">
                    <ShieldCheck size={250} />
                </div>
                <div className="z-10 w-full md:w-1/2">
                    <h2 className="text-2xl font-bold text-white mb-2">Analyze Current Portfolio</h2>
                    <p className="text-gray-400 mb-6">You currently have <strong className="text-accent">{testCases.length}</strong> active test cases. Run our AI analysis to check for missing edge cases and viewport validation.</p>
                    <button 
                        onClick={handleAnalyze} 
                        disabled={loading || testCases.length === 0}
                        className={`btn px-8 py-3 text-lg flex items-center gap-3 ${
                            loading || testCases.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} />}
                        Execute deep scan
                    </button>
                </div>
            </div>

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in zoom-in-95 duration-700">
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
        </div>
    );
}
