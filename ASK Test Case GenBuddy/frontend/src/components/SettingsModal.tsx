import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ProviderSettings } from '../types';
import axios from 'axios';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProviderSettings;
  onSave: (settings: ProviderSettings) => void;
}

export const SettingsModal = ({ isOpen, onClose, settings, onSave }: SettingsModalProps) => {
  const [formData, setFormData] = useState<ProviderSettings>(settings);
  const [testStatus, setTestStatus] = useState<{message: string, success: boolean} | null>(null);

  useEffect(() => {
    if (isOpen) setFormData(settings);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTestConnection = async () => {
    setTestStatus(null);
    try {
      const res = await axios.post('http://localhost:5000/api/test-connection', {
        provider: formData.activeProvider,
        url: formData.activeProvider === 'ollama' ? formData.ollamaUrl : formData.lmStudioUrl
      });
      setTestStatus({ message: res.data.message, success: res.data.success });
    } catch (err: any) {
      setTestStatus({ message: err.message || "Connection failed", success: false });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Provider Configuration</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="form-group">
          <label>Active LLM Provider</label>
          <select name="activeProvider" value={formData.activeProvider || 'ollama'} onChange={handleChange}>
            <option value="ollama">Ollama (Local)</option>
            <option value="lmstudio">LM Studio (Local)</option>
            <option value="openai">OpenAI</option>
            <option value="claude">Claude (Anthropic)</option>
            <option value="gemini">Gemini (Google)</option>
            <option value="groq">Groq</option>
          </select>
        </div>

        {formData.activeProvider === 'ollama' && (
          <>
            <div className="form-group">
              <label>Ollama Base URL</label>
              <input type="text" name="ollamaUrl" value={formData.ollamaUrl || ''} onChange={handleChange} placeholder="http://localhost:11434" />
            </div>
            <div className="form-group">
              <label>Ollama Model Name</label>
              <input type="text" name="ollamaModel" value={formData.ollamaModel || ''} onChange={handleChange} placeholder="llama3" />
            </div>
          </>
        )}

        {formData.activeProvider === 'lmstudio' && (
          <div className="form-group">
            <label>LM Studio API URL (v1)</label>
            <input type="text" name="lmStudioUrl" value={formData.lmStudioUrl || ''} onChange={handleChange} placeholder="http://localhost:1234/v1" />
          </div>
        )}

        {formData.activeProvider === 'openai' && (
          <div className="form-group">
            <label>OpenAI API Key</label>
            <input type="password" name="openAiApiKey" value={formData.openAiApiKey || ''} onChange={handleChange} placeholder="sk-..." />
          </div>
        )}

        {formData.activeProvider === 'claude' && (
          <div className="form-group">
            <label>Claude API Key</label>
            <input type="password" name="claudeApiKey" value={formData.claudeApiKey || ''} onChange={handleChange} placeholder="sk-ant-..." />
          </div>
        )}

        {formData.activeProvider === 'gemini' && (
          <div className="form-group">
            <label>Gemini API Key</label>
            <input type="password" name="geminiApiKey" value={formData.geminiApiKey || ''} onChange={handleChange} placeholder="AIzaSy..." />
          </div>
        )}

        {formData.activeProvider === 'groq' && (
          <div className="form-group">
            <label>Groq API Key</label>
            <input type="password" name="groqApiKey" value={formData.groqApiKey || ''} onChange={handleChange} placeholder="gsk_..." />
          </div>
        )}

        {testStatus && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: testStatus.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: testStatus.success ? '#10b981' : '#ef4444' }}>
            {testStatus.message}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-test" onClick={handleTestConnection}>Test Connection</button>
          <button className="btn btn-primary" onClick={() => onSave(formData)}>Save Settings</button>
        </div>
      </div>
    </div>
  );
};
