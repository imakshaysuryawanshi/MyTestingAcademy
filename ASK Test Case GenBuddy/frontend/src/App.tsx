import { useState, useEffect, useRef } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { PanelLeftOpen, Sun, Moon } from 'lucide-react';
import type { Message, ProviderSettings } from './types';
import axios from 'axios';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ProviderSettings>({ activeProvider: 'ollama' });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // Theme state
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  // Local Storage hooks
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [history, setHistory] = useState<{id: string, title: string, messages: Message[]}[]>(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Save to local storage on change
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    localStorage.setItem('chatHistory', JSON.stringify(history));
  }, [messages, history]);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  const API_BASE_URL = `http://${window.location.hostname}:5005`;

  useEffect(() => {
    // Fetch initial settings
    axios.get(`${API_BASE_URL}/api/settings`)
      .then(res => setSettings(res.data))
      .catch(console.error);
  }, []);

  const handleSaveSettings = async (newSettings: ProviderSettings) => {
    try {
       const res = await axios.post(`${API_BASE_URL}/api/settings`, newSettings);
       setSettings(res.data.settings);
       setIsSettingsOpen(false);
    } catch(err) {
       console.error("Failed to save settings", err);
    }
  };

  const handleSendMessage = async (text: string, image?: string) => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text, image };
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await axios.post(`${API_BASE_URL}/api/generate`, 
        { requirement: text, image },
        { signal: abortControllerRef.current.signal }
      );
      const botMessage: Message = { id: (Date.now() + 1).toString(), role: 'bot', content: res.data.testCase };
      
      setMessages((prev) => {
        const newMessages = [...prev, botMessage];
        
        // Update history
        setHistory((currentHistory) => {
          if (activeChatId) {
            // Update existing entry
            return currentHistory.map(h => h.id === activeChatId ? { ...h, messages: newMessages } : h);
          } else {
            // Create new entry
            const newId = botMessage.id;
            setActiveChatId(newId);
            const titleText = text.length > 30 ? text.slice(0, 30) + '...' : text;
            return [{ id: newId, title: titleText, messages: newMessages }, ...currentHistory];
          }
        });

        return newMessages;
      });
    } catch(err: any) {
      if (axios.isCancel(err)) {
        console.log("Generation stopped by user");
        setIsGenerating(false);
        return;
      }
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'bot', content: `**Error:** ${err.response?.data?.error || err.message}` };
      setMessages((prev: Message[]) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to completely clear ALL history histories?')) {
      setHistory([]);
      localStorage.removeItem('chatHistory');
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSelectHistory = (id: string) => {
    const selected = history.find(h => h.id === id);
    if (selected) {
      setMessages(selected.messages);
      setActiveChatId(id);
    }
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onNewChat={handleNewChat}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        onClearChat={handleClearChat}
        history={history} 
      />
      <div className="flex-1 flex flex-col relative" style={{ overflow: 'hidden', height: '100vh' }}>
        <div className="main-header" style={{ justifyContent: 'space-between' }}>
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button className="toggle-sidebar-btn" onClick={() => setIsSidebarOpen(true)}>
                <PanelLeftOpen size={24} />
              </button>
            )}
            <h1>ASK GenBuddy</h1>
          </div>
          <button 
            className="toggle-sidebar-btn" 
            onClick={() => setIsLightMode(!isLightMode)}
            title="Toggle Theme"
          >
            {isLightMode ? <Moon size={22} /> : <Sun size={22} />}
          </button>
        </div>
        <ChatArea 
          messages={messages} 
          isGenerating={isGenerating} 
          onSendMessage={handleSendMessage} 
          onStop={handleStopGeneration}
        />
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default App;
