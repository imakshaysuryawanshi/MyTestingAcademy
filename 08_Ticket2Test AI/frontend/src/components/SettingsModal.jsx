import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Server, Database, Save, CheckCircle, AlertTriangle } from 'lucide-react';

const PROVIDER_MODELS = {
  groq: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  ollama: ['llama3', 'mistral', 'codellama', 'phi3'],
};

const SettingsModal = ({ isOpen, onClose, onSaved, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('llm');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'

  const [llmConfig, setLlmConfig] = useState({
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    api_key: '',
    base_url: '',
  });
  const [jiraConfig, setJiraConfig] = useState({ jira_url: '', email: '', api_token: '' });

  // Load current (non-sensitive) config from backend on open
  useEffect(() => {
    if (isOpen) {
      axios.get('http://localhost:8000/api/settings/config').then(res => {
        setSaveStatus(null);
        if (res.data) {
          setLlmConfig(prev => ({
            ...prev,
            provider: res.data.provider || 'groq',
            model: res.data.model || 'llama-3.3-70b-versatile',
            base_url: res.data.base_url || '',
            api_key: '', // Never pre-fill the key — security
          }));
          setJiraConfig(prev => ({
            ...prev,
            jira_url: res.data.jira_url || '',
            email: res.data.email || '',
            api_token: '',
          }));
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      if (activeTab === 'llm') {
        await axios.post('http://localhost:8000/api/settings/llm', llmConfig);
      } else {
        await axios.post('http://localhost:8000/api/settings/jira', jiraConfig);
      }
      setSaveStatus('success');
      if (onSaved) onSaved(); // Refresh connection status badge
      // ✅ FIX: DO NOT call onClose() — stay open so user can verify
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const models = PROVIDER_MODELS[llmConfig.provider] || [];

  // Theme helpers
  const bg = isDarkMode ? 'bg-[#1e293b]' : 'bg-white';
  const headerBg = isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8f9fc]';
  const border = isDarkMode ? 'border-[#334155]' : 'border-[#e9ebf0]';
  const text = isDarkMode ? 'text-[#f1f5f9]' : 'text-[#172b4d]';
  const subtext = isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]';
  const inputBg = isDarkMode ? 'bg-[#0f172a] border-[#334155] text-[#f1f5f9] placeholder-[#475569]' : 'bg-[#f4f5f7] border-[#e2e5ec] text-[#172b4d]';
  const labelClass = `block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${subtext}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className={`w-[580px] rounded-xl shadow-2xl border flex flex-col overflow-hidden ${bg} ${border}`}>

        {/* Header */}
        <div className={`px-6 py-4 flex justify-between items-center border-b ${headerBg} ${border}`}>
          <h2 className={`text-[15px] font-bold flex items-center gap-2 ${text}`}>
            <Server size={16} className="text-[#3b82f6]" /> Global Configurations
          </h2>
          <button onClick={onClose} className={`hover:text-red-500 transition-colors ${subtext}`}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex px-6 pt-3 gap-6 border-b ${border}`}>
          <button
            onClick={() => { setActiveTab('llm'); setSaveStatus(null); }}
            className={`pb-3 text-[13px] font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'llm'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : `border-transparent ${subtext} hover:${text}`
            }`}
          >
            <Server size={13} /> LLM Provider
          </button>
          <button
            onClick={() => { setActiveTab('jira'); setSaveStatus(null); }}
            className={`pb-3 text-[13px] font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'jira'
                ? 'border-[#3b82f6] text-[#3b82f6]'
                : `border-transparent ${subtext} hover:${text}`
            }`}
          >
            <Database size={13} /> Jira Connection
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 space-y-5">
          {activeTab === 'llm' && (
            <>
              {/* Provider */}
              <div>
                <label className={labelClass}>Provider</label>
                <select
                  className={`w-full border rounded-md text-[13px] px-3 py-2.5 outline-none appearance-none cursor-pointer ${inputBg}`}
                  value={llmConfig.provider}
                  onChange={(e) => setLlmConfig({ ...llmConfig, provider: e.target.value, model: PROVIDER_MODELS[e.target.value]?.[0] || '' })}
                >
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="ollama">Local (Ollama)</option>
                </select>
              </div>

              {/* Model — dropdown if known, text input if custom */}
              <div>
                <label className={labelClass}>Model</label>
                {models.length > 0 ? (
                  <select
                    className={`w-full border rounded-md text-[13px] px-3 py-2.5 outline-none appearance-none cursor-pointer ${inputBg}`}
                    value={llmConfig.model}
                    onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                  >
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input
                    className={`w-full border rounded-md text-[13px] px-3 py-2.5 outline-none font-mono ${inputBg}`}
                    value={llmConfig.model}
                    onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                    placeholder="e.g. gpt-4o"
                  />
                )}
              </div>

              {/* API Key with show/hide toggle */}
              {llmConfig.provider !== 'ollama' && (
                <div>
                  <label className={labelClass}>
                    {llmConfig.provider === 'groq' ? 'GROQ' : llmConfig.provider.toUpperCase()} API Key
                    <span className="ml-2 normal-case text-[#3b82f6] font-normal">(stored securely on server)</span>
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={`w-full border rounded-md text-[13px] px-3 py-2.5 outline-none font-mono ${inputBg}`}
                    value={llmConfig.api_key}
                    onChange={(e) => setLlmConfig({ ...llmConfig, api_key: e.target.value })}
                    placeholder={`Enter ${llmConfig.provider === 'groq' ? 'gsk_...' : 'sk-...'} key`}
                  />
                  <p className={`text-[11px] mt-1 ${subtext}`}>Leave blank to keep existing saved key.</p>
                </div>
              )}

              {/* Ollama Base URL */}
              {llmConfig.provider === 'ollama' && (
                <div>
                  <label className={labelClass}>Ollama Base URL</label>
                  <input
                    className={`w-full border rounded-md text-[13px] px-3 py-2.5 outline-none font-mono ${inputBg}`}
                    value={llmConfig.base_url}
                    onChange={(e) => setLlmConfig({ ...llmConfig, base_url: e.target.value })}
                    placeholder="http://localhost:11434"
                  />
                </div>
              )}
            </>
          )}

          {activeTab === 'jira' && (
            <>
              <div>
                <label className={labelClass}>Jira Base URL</label>
                <input
                  className={`w-full border rounded-md text-[13px] px-3 py-2.5 outline-none font-mono ${inputBg}`}
                  value={jiraConfig.jira_url}
                  onChange={(e) => setJiraConfig({ ...jiraConfig, jira_url: e.target.value })}
                  placeholder="https://yourcompany.atlassian.net"
                />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  className={`w-full border rounded-md text-[13px] px-3 py-2.5 outline-none font-mono ${inputBg}`}
                  value={jiraConfig.email}
                  onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className={labelClass}>
                  API Token
                  <span className="ml-2 normal-case text-[#3b82f6] font-normal">(stored securely on server)</span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={`w-full border rounded-md text-[13px] px-3 py-2.5 outline-none font-mono ${inputBg}`}
                  value={jiraConfig.api_token}
                  onChange={(e) => setJiraConfig({ ...jiraConfig, api_token: e.target.value })}
                  placeholder="Enter Jira API token to update..."
                />
                <p className={`text-[11px] mt-1 ${subtext}`}>Leave blank to keep existing saved token.</p>
              </div>
            </>
          )}
        </div>

        {/* Footer — always stays open after save */}
        <div className={`px-6 py-4 border-t flex justify-between items-center ${headerBg} ${border}`}>
          <div className="min-h-[20px]">
            {saveStatus === 'success' && (
              <span className="text-green-500 flex items-center gap-1.5 text-[13px] font-medium">
                <CheckCircle size={14} /> Configuration saved successfully
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-500 flex items-center gap-1.5 text-[13px]">
                <AlertTriangle size={14} /> Failed to save — check backend connection
              </span>
            )}
          </div>
          <button
            disabled={saving}
            onClick={handleSave}
            className="bg-[#0f3b9c] hover:bg-[#0c2f7a] text-white px-6 py-2 rounded-md text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving...' : `Save ${activeTab === 'llm' ? 'LLM Config' : 'Jira Config'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
