import React, { useState } from 'react';
import axios from 'axios';
import { ShieldAlert, Fingerprint } from 'lucide-react';

const ConnectionPanel = ({ credentials, setCredentials, status, setStatus }) => {
  const [testing, setTesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setStatus('disconnected');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setErrorMsg('');
    try {
      const res = await axios.post('http://localhost:8000/api/jira/test-connection', credentials);
      if (res.data.status === 'success') {
        setStatus('connected');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-on_surface_variant flex items-center gap-2 uppercase tracking-wider">
        <Fingerprint size={14} /> Jira Authorization
      </h3>
      
      <div className="flex flex-col gap-3">
        <input 
          autoComplete="off"
          name="jira_url"
          value={credentials.jira_url}
          onChange={handleChange}
          placeholder="Jira URL (https://domain.atlassian.net)"
          className="bg-surface-container-highest text-sm text-on_surface outline-none py-2 px-3 rounded-md ghost-border focus:bg-surface-container-lowest focus:border-primary focus:border-opacity-50 transition-all font-mono"
        />
        <input 
          autoComplete="off"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          placeholder="Email Address"
          className="bg-surface-container-highest text-sm text-on_surface outline-none py-2 px-3 rounded-md ghost-border focus:bg-surface-container-lowest focus:border-primary focus:border-opacity-50 transition-all font-mono"
        />
        <input 
          autoComplete="new-password"
          type="password"
          name="api_token"
          value={credentials.api_token}
          onChange={handleChange}
          placeholder="API Token ••••••••"
          className="bg-surface-container-highest text-sm text-on_surface outline-none py-2 px-3 rounded-md ghost-border focus:bg-surface-container-lowest focus:border-primary focus:border-opacity-50 transition-all font-mono"
        />
      </div>

      <button 
        onClick={handleTestConnection}
        disabled={!credentials.jira_url || !credentials.email || !credentials.api_token || testing}
        className="mt-2 w-full text-center py-2 rounded-md bg-transparent text-primary text-sm font-medium ghost-border hover:bg-surface-container-highest transition-all disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Test Connection'}
      </button>

      {/* Status Pill */}
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-on_surface_variant">Status</span>
        {status === 'connected' && (
          <span className="px-2 py-1 bg-secondary_container text-on_secondary_container text-xs rounded-full font-medium shadow-sm animate-pulse">
            Connected
          </span>
        )}
        {status === 'disconnected' && (
          <span className="px-2 py-1 bg-surface-container-highest text-on_surface_variant text-xs rounded-full font-medium">
            Disconnected
          </span>
        )}
        {status === 'error' && (
          <span className="px-2 py-1 bg-error_container text-error text-xs rounded-full font-medium flex items-center gap-1 border border-error border-opacity-20">
            <ShieldAlert size={12} /> Error
          </span>
        )}
      </div>
      {errorMsg && <div className="text-xs text-error mt-1">{errorMsg}</div>}
    </div>
  );
};

export default ConnectionPanel;
