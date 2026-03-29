import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon, Save, RotateCcw, Cpu,
  MessageSquareQuote, Zap, FolderOutput, Wifi, WifiOff,
  Loader2, Eye, EyeOff, CheckCircle2, Trash2
} from "lucide-react";
import { useAppStore } from "../store/AppContext";
import { api } from "../services/api";

// ── Provider model catalogue ──────────────────────────────────────────────────
const PROVIDER_MODELS = {
  ollama: [
    "llama3:8b-instruct-q4_0",
    "deepseek-coder:6.7b-instruct-q4_0",
    "mistral:7b-instruct",
    "gemma:7b",
    "phi3:mini",
  ],
  groq: [
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma-7b-it",
    "gemma2-9b-it",
  ],
  grok: [
    "grok-beta",
    "grok-2",
    "grok-2-mini",
  ],
};

const PROVIDER_META = {
  ollama: { label: "Ollama (Local)",  color: "text-green-400",  badge: "bg-green-400/10 border-green-400/20",  needsKey: false },
  groq:   { label: "Groq (Cloud)",    color: "text-yellow-400", badge: "bg-yellow-400/10 border-yellow-400/20", needsKey: true  },
  grok:   { label: "Grok / xAI",     color: "text-purple-400", badge: "bg-purple-400/10 border-purple-400/20", needsKey: true  },
};

// ── Reusable toggle ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-sidebar rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent peer-checked:after:bg-black" />
    </label>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function Settings() {
  const { settings, setSettings, setStories, setTestPlans, setTestCases, setScenarios,
          setApiScenarios, setApiTestCases, showToast } = useAppStore();
  const [localConfig, setLocalConfig] = useState(JSON.parse(JSON.stringify(settings)));
  const [availablePrompts, setAvailablePrompts] = useState([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connStatus, setConnStatus] = useState(null); // null | 'testing' | 'ok' | 'fail'

  useEffect(() => {
    api.fetchAvailablePrompts().then(res => {
      if (res.success) setAvailablePrompts(res.data);
    });
  }, []);

  // Ensure provider field exists (backward compat)
  useEffect(() => {
    if (!localConfig.model.provider) {
      setLocalConfig(prev => ({ ...prev, model: { provider: "ollama", apiKey: "", ...prev.model } }));
    }
  }, []);

  const isDirty = JSON.stringify(localConfig) !== JSON.stringify(settings);

  const handleSave = async () => {
    // Security: NEVER save API key to localStorage — keys must stay in backend .env only
    const safeConfig = JSON.parse(JSON.stringify(localConfig));
    if (safeConfig.model?.apiKey) safeConfig.model.apiKey = "";

    setSettings(safeConfig);
    showToast("Configuration Saved", "success");
  };

  const handleReset = () => {
    setLocalConfig(JSON.parse(JSON.stringify(settings)));
    showToast("Reset to previous configuration", "info");
  };

  const handleNestedChange = (section, field, value) => {
    setLocalConfig(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  // When provider changes, auto-select first model for that provider
  const handleProviderChange = (provider) => {
    const firstModel = PROVIDER_MODELS[provider]?.[0] || "";
    setLocalConfig(prev => ({
      ...prev,
      model: { ...prev.model, provider, id: firstModel, apiKey: "" }
    }));
    setConnStatus(null);
  };

  // Real connection test via backend /api/providers
  const handleTestConnection = async () => {
    setConnStatus("testing");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/providers`);
      const json = await res.json();
      const provider = localConfig.model.provider;
      const match = json.providers?.find(p => p.name === provider);
      if (match?.available) {
        setConnStatus("ok");
        showToast(`✓ Connected to ${PROVIDER_META[provider]?.label}`, "success");
      } else {
        setConnStatus("fail");
        showToast(`${PROVIDER_META[provider]?.label} is not available. Check your .env key.`, "error");
      }
    } catch {
      setConnStatus("fail");
      showToast("Cannot reach backend. Is it running?", "error");
    }
  };

  const currentProvider = localConfig.model?.provider || "ollama";
  const providerMeta = PROVIDER_META[currentProvider];
  const modelsList = PROVIDER_MODELS[currentProvider] || [];

  return (
    <div className="max-w-5xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-xl">
            <SettingsIcon className="text-accent" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">System Settings</h1>
            <p className="text-sm text-textMuted mt-1">Configure AI provider, prompts, and platform behavior.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset} disabled={!isDirty}
            className={`btn bg-[#1A2330] border border-border/60 px-5 py-2.5 rounded-xl flex items-center gap-2 text-gray-400 hover:text-white hover:bg-[#252D3D] hover:border-accent/40 transition-all ${!isDirty ? "opacity-30 cursor-not-allowed" : ""}`}>
            <RotateCcw size={16} /> Discard
          </button>
          <button onClick={handleSave} disabled={!isDirty}
            className={`btn px-6 py-2 flex items-center gap-2 transition-all ${!isDirty ? "opacity-50 cursor-not-allowed" : "shadow-lg shadow-accent/20"}`}>
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Section 1: Multi-LLM Provider + Model Engine ── */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-accent/40 transition lg:col-span-2">
          <div className="flex items-center gap-2 text-white mb-6 border-b border-border/50 pb-3">
            <Cpu className="text-accent" size={20} />
            <h2 className="text-xl font-bold tracking-wide">Model Engine Provider</h2>
            <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full border ${providerMeta.badge} ${providerMeta.color}`}>
              {providerMeta.label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider Selector */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">LLM Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(PROVIDER_META).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => handleProviderChange(key)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                        currentProvider === key
                          ? `${meta.badge} ${meta.color} border-current`
                          : "border-border text-textMuted hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                <select
                  className="input"
                  value={localConfig.model.id}
                  onChange={e => handleNestedChange("model", "id", e.target.value)}
                >
                  {modelsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {providerMeta.needsKey && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-300">
                  <strong>🔒 Security Note:</strong> API Keys must be set in your backend <code className="font-mono bg-black/30 px-1 rounded">.env</code> file only.
                  They are never stored in the browser for security reasons.
                  <br/><span className="text-textMuted mt-1 block">Add: <code className="font-mono">GROQ_API_KEY=your_key</code> to backend/.env</span>
                </div>
              )}

              {/* Test Connection Button */}
              <button
                onClick={handleTestConnection}
                disabled={connStatus === "testing"}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-textMuted hover:text-white hover:border-accent/50 transition-all w-full justify-center"
              >
                {connStatus === "testing"  && <Loader2 size={14} className="animate-spin text-accent" />}
                {connStatus === "ok"       && <CheckCircle2 size={14} className="text-green-400" />}
                {connStatus === "fail"     && <WifiOff size={14} className="text-red-400" />}
                {connStatus === null       && <Wifi size={14} />}
                {connStatus === "testing" ? "Testing connection…" : connStatus === "ok" ? "Connection successful!" : connStatus === "fail" ? "Connection failed" : "Test Connection"}
              </button>
            </div>

            {/* Temperature + Tokens */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex justify-between">
                  Temperature <span className={`font-bold ${localConfig.model.temperature <= 0.3 ? "text-blue-400" : localConfig.model.temperature >= 0.8 ? "text-red-400" : "text-yellow-400"}`}>{localConfig.model.temperature}</span>
                </label>
                <input
                  type="range" min="0.1" max="1.0" step="0.1"
                  className="w-full h-2 bg-sidebar rounded-lg appearance-none cursor-pointer accent-accent"
                  value={localConfig.model.temperature}
                  onChange={e => handleNestedChange("model", "temperature", parseFloat(e.target.value))}
                />
                <div className="flex justify-between text-xs text-textMuted mt-1">
                  <span>Precise</span><span>Balanced</span><span>Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Token</label>
                <input
                  type="number" className="input text-white font-mono bg-[#0D1117] border-border/40 focus:border-accent text-center"
                  placeholder="e.g. 1000"
                  value={localConfig.model.maxTokens || ""}
                  onChange={e => handleNestedChange("model", "maxTokens", e.target.value === "" ? "" : parseInt(e.target.value))}
                />
              </div>

              {/* Ollama hint */}
              {currentProvider === "ollama" && (
                <div className="flex items-start gap-2 text-xs text-green-300 bg-green-500/5 border border-green-500/10 rounded-lg p-3 mt-2">
                  <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
                  No API key needed — Ollama runs locally. Make sure it's running on port 11434.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 2: Prompts ── */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-accent/40 transition">
          <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2 text-white">
              <MessageSquareQuote className="text-accent" size={20} />
              <h2 className="text-xl font-bold tracking-wide">Prompt Blueprints</h2>
            </div>
            <button 
              onClick={() => {
                const defaults = {
                  testPlan: "testplan/universal",
                  testCase: "testcase/universal",
                  coverage: "coverage/analysis",
                  codeGen: "codegen/selenium-java",
                  apiScenario: "api/api-test-scenario",
                  apiTestCase: "api/api-test-case"
                };
                setLocalConfig(prev => ({ ...prev, prompts: { ...prev.prompts, ...defaults } }));
                showToast("Recommended prompts restored to selection", "success");
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white/5 border border-border rounded-lg text-textMuted hover:text-white transition"
            >
              Restore Recommended
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["testPlan", "testCase", "coverage", "codeGen", "apiScenario", "apiTestCase"].map(key => {
              const label = key === "apiScenario" ? "API Scenario" 
                          : key === "apiTestCase" ? "API Test Case" 
                          : key.replace(/([A-Z])/g, " $1").trim().replace("Test", "Test ");
              
              return (
                <div key={key}>
                  <label className="block text-[11px] uppercase tracking-widest text-textMuted font-bold mb-2">
                    {label} Prompt
                  </label>
                  <select
                    className="input font-mono text-xs w-full"
                    value={localConfig.prompts[key] || ""}
                    onChange={e => handleNestedChange("prompts", key, e.target.value)}
                  >
                    {!availablePrompts.includes(localConfig.prompts[key]) && localConfig.prompts[key] && (
                       <option value={localConfig.prompts[key]}>{localConfig.prompts[key]}.md (Current)</option>
                    )}
                    {availablePrompts.length > 0 ? (
                      availablePrompts.map(p => (
                        <option key={p} value={p}>{p}.md</option>
                      ))
                    ) : (
                      <option value="">No prompts available...</option>
                    )}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 3: Execution ── */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-accent/40 transition">
          <div className="flex items-center gap-2 text-white mb-6 border-b border-border/50 pb-3">
            <Zap className="text-accent" size={20} />
            <h2 className="text-xl font-bold tracking-wide">Execution Logic</h2>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-200 font-medium">Automatic Retry</h3>
                <p className="text-xs text-textMuted">Retry failed LLM inference calls</p>
              </div>
              <Toggle checked={localConfig.execution.enableRetry} onChange={e => handleNestedChange("execution", "enableRetry", e.target.checked)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Max Retry Attempts</label>
              <input type="number" className="input" value={localConfig.execution.maxRetries}
                disabled={!localConfig.execution.enableRetry}
                onChange={e => handleNestedChange("execution", "maxRetries", parseInt(e.target.value) || 1)} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <h3 className="text-gray-200 font-medium">Job Queueing</h3>
                <p className="text-xs text-textMuted">Queue requests sequentially</p>
              </div>
              <Toggle checked={localConfig.execution.enableQueue} onChange={e => handleNestedChange("execution", "enableQueue", e.target.checked)} />
            </div>
          </div>
        </div>

        {/* ── Section 4: Output ── */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-accent/40 transition lg:col-span-2">
          <div className="flex items-center gap-2 text-white mb-6 border-b border-border/50 pb-3">
            <FolderOutput className="text-accent" size={20} />
            <h2 className="text-xl font-bold tracking-wide">Output Behavior</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-200 font-medium">Auto Save</h3>
                <p className="text-xs text-textMuted">Persist generated artifacts</p>
              </div>
              <Toggle checked={localConfig.output.autoSave} onChange={e => handleNestedChange("output", "autoSave", e.target.checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-200 font-medium">JSON Validation</h3>
                <p className="text-xs text-textMuted">Reject unparseable content</p>
              </div>
              <Toggle checked={localConfig.output.jsonValidation} onChange={e => handleNestedChange("output", "jsonValidation", e.target.checked)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Default Case Status</label>
              <select className="input" value={localConfig.output.defaultStatus}
                onChange={e => handleNestedChange("output", "defaultStatus", e.target.value)}>
                <option value="Draft">Draft</option>
                <option value="Review">Ready for Review</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 5: Storage & Performance ── */}
        <div className="bg-card p-6 rounded-2xl border border-border hover:border-red-500/20 shadow-sm transition lg:col-span-2">
          <div className="flex items-center gap-2 text-white mb-6 border-b border-border/50 pb-3">
            <RotateCcw className="text-red-400" size={20} />
            <h2 className="text-xl font-bold tracking-wide">Storage & Performance</h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
                <h3 className="text-gray-200 font-medium">Clear All Artifact History</h3>
                <p className="text-xs text-textMuted mt-1">Permanently delete all locally saved User Stories, Test Plans, and Test Cases. This cannot be undone.</p>
            </div>
            <button 
                onClick={() => {
                    if (window.confirm("Are you sure you want to delete ALL generated artifact history? This cannot be undone.")) {
                        setStories([]);
                        setTestPlans([]);
                        setTestCases([]);
                        setScenarios([]);
                        setApiScenarios([]);
                        setApiTestCases([]);
                        showToast("✓ All history cleared successfully", "success");
                    }
                }}
                className="btn-danger flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
            >
                <Trash2 size={16} />
                Clear Everything
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
