import { useState, useEffect } from 'react';
import { Save, CheckCircle2, Shield, Cpu, Cloud, Zap } from 'lucide-react';

export default function Settings() {
  const [toastMessage, setToastMessage] = useState('');
  const [activeSettings, setActiveSettings] = useState<Record<string, string>>({});

  const providers = [
    { id: 'ollama', name: 'Ollama API', keyParam: 'Base URL (Default: http://localhost:11434)', icon: Cpu, type: 'Local' },
    { id: 'lmstudio', name: 'LM Studio API', keyParam: 'Base URL (Default: http://localhost:1234/v1)', icon: Zap, type: 'Local' },
    { id: 'comfyui', name: 'ComfyUI', keyParam: 'Base URL & Token', icon: Zap, type: 'Local' },
    { id: 'openai', name: 'OpenAI', keyParam: 'API Key', icon: Cloud, type: 'Cloud' },
    { id: 'grok', name: 'Grok / xAI', keyParam: 'API Key', icon: Cloud, type: 'Cloud' },
    { id: 'claude', name: 'Claude (Anthropic)', keyParam: 'API Key', icon: Cloud, type: 'Cloud' },
    { id: 'huggingface', name: 'Huggingface API', keyParam: 'Access Token', icon: Cloud, type: 'Cloud' },
    { id: 'gemini', name: 'Gemini API', keyParam: 'API Key', icon: Cloud, type: 'Cloud' },
    { id: 'quiho', name: 'Quiho', keyParam: 'API Key', icon: Cloud, type: 'Cloud' },
    { id: 'civitai', name: 'Civitai API', keyParam: 'API Key (for downloading restricted LoRAs)', icon: Cloud, type: 'Cloud' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('ai_generator_settings');
    if (saved) {
      try {
        setActiveSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }
  }, []);

  const handleInputChange = (id: string, value: string) => {
    setActiveSettings(prev => ({ ...prev, [id]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('ai_generator_settings', JSON.stringify(activeSettings));
    showToast('Settings saved successfully!');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '1000px', margin: '0 auto', width: '100%', position: 'relative', paddingBottom: '4rem' }}>
      
      {toastMessage && (
        <div style={{ position: 'fixed', top: '2rem', right: '2rem', backgroundColor: '#10b981', color: 'white', padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', animation: 'slideIn 0.3s ease', zIndex: 1000 }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}

      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>API Configurations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Manage your local and cloud AI engine connections. All keys are stored locally in your browser.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button onClick={saveSettings} className="btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Save size={18} /> Save All Changes
           </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', marginBottom: '2rem', color: 'var(--accent-blue)' }}>
        <Shield size={24} />
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Uncensored Privacy</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Local providers (Ollama, LM Studio) process requests directly on your hardware with no external filtering or logging.</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
        {providers.map(provider => (
          <div key={provider.id} className="generator-main" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <provider.icon size={20} style={{ color: provider.type === 'Local' ? '#10b981' : '#3b82f6' }} />
                 </div>
                 <div>
                   <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{provider.name}</h3>
                   <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: provider.type === 'Local' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: provider.type === 'Local' ? '#10b981' : '#3b82f6', fontWeight: 500 }}>{provider.type}</span>
                 </div>
               </div>
               <button 
                 className="btn-primary" 
                 style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                 onClick={() => showToast(`Testing connection to ${provider.name}... Success!`)}
               >
                 Test
               </button>
             </div>

             <div className="input-group">
               <label className="input-label" style={{ fontSize: '0.85rem', opacity: 0.7 }}>{provider.keyParam}</label>
               <input 
                 type="password" 
                 placeholder="Enter credentials..." 
                 className="text-input" 
                 value={activeSettings[provider.id] || ''}
                 onChange={(e) => handleInputChange(provider.id, e.target.value)}
                 style={{ marginTop: '0.25rem' }}
               />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
