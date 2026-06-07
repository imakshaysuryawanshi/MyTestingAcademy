import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Search, Zap, History, Plus, Monitor, ChevronLeft, ChevronRight, Moon, Sun, X, CheckCircle, AlertTriangle, Trash2, Clock } from 'lucide-react';
import InputPanel from './components/InputPanel';
import ContextPanel from './components/ContextPanel';
import OutputPanel from './components/OutputPanel';
import SettingsModal from './components/SettingsModal';
import HistoryTab from './components/HistoryTab';

// eslint-disable-next-line no-unused-vars
const MenuItem = ({ id, icon: Icon, label, activeTab, setActiveTab, isSidebarOpen }) => {
  const isActive = activeTab === id;
  const baseClass = "w-full flex items-center gap-3 px-4 py-2.5 rounded-md font-medium text-[13px] transition-colors " + (isSidebarOpen ? "" : "justify-center");
  const activeClass = isActive
      ? "bg-white dark:bg-[#1e293b] shadow-sm border border-[#e9ebf0] dark:border-[#334155] text-[#1a56db] dark:text-[#60a5fa]"
      : "text-[#5e6c84] dark:text-[#94a3b8] hover:bg-[#ebecf0] dark:hover:bg-[#1e293b] opacity-70 hover:opacity-100";

  return (
    <button onClick={() => setActiveTab(id)} className={`${baseClass} ${activeClass}`}>
      <Icon size={16} /> {isSidebarOpen && label}
    </button>
  );
};

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Fix #1: Persist dark mode via localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('ticket2test-theme') === 'dark';
  });
  const [activeTab, setActiveTab] = useState('generator');

  const [jiraData, setJiraData] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState({ jira_configured: false, llm_configured: false });

  // Fix #2: Toast notification state (replaces ugly browser alert)
  const [toast, setToast] = useState(null); // { type: 'error'|'success', message }

  // Fix #5: History state from localStorage
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ticket2test-history') || '[]');
    } catch { return []; }
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchConfigStatus = async () => {
    try {
      const resp = await axios.get('http://localhost:8000/api/settings/status');
      setConfigStatus(resp.data);
    } catch {
      console.error("Config fetch error");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConfigStatus();
  }, []);

  // Fix #1: Sync dark class + localStorage whenever isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ticket2test-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ticket2test-theme', 'light');
    }
  }, [isDarkMode]);

  // Fix #5: Save to history whenever new test cases are generated
  const handleGenerated = (cases, jiraId) => {
    if (!cases || cases.length === 0) {
      showToast('error', 'Generation returned no test cases.');
      return;
    }
    
    setTestCases(cases);
    
    // Create history entry
    const entry = {
      id: Date.now(),
      jiraId: jiraId || 'Manual',
      count: cases.length,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      cases,
      // Store a snippet of the summary if jiraData exists
      summary: jiraData?.summary || ''
    };

    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 50);
      localStorage.setItem('ticket2test-history', JSON.stringify(updated));
      return updated;
    });
    
    showToast('success', `Generated ${cases.length} test cases for ${jiraId || 'Manual'}`);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ticket2test-history');
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] text-[#f1f5f9]' : 'bg-[#fafbfc] text-[#172b4d]'}`}>

      {/* Toast Notification — Fix #2 */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl border max-w-md transition-all ${
          toast.type === 'error'
            ? 'bg-red-50 dark:bg-[#3f0f0f] border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            : 'bg-green-50 dark:bg-[#0f2c1a] border-green-200 dark:border-green-900 text-green-700 dark:text-green-300'
        }`}>
          {toast.type === 'error' ? <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" /> : <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />}
          <p className="text-[13px] leading-relaxed flex-1">{toast.message}</p>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100"><X size={14}/></button>
        </div>
      )}

      {/* Sidebar - Collapsible */}
      <div className={`flex-shrink-0 transition-all duration-300 border-r flex flex-col justify-between relative ${
        isDarkMode ? 'bg-[#0b1120] border-[#334155]' : 'bg-[#f8f9fc] border-[#e9ebf0]'
      } ${isSidebarOpen ? 'w-[240px]' : 'w-[72px]'}`}>

        {/* Collapse Toggle */}
        <button
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           className={`absolute -right-3 top-8 rounded-full p-1 border shadow-sm transition-colors z-10 ${isDarkMode ? 'bg-[#1e293b] border-[#334155] text-[#94a3b8]' : 'bg-white border-[#e9ebf0] text-[#5e6c84] hover:text-[#102a5e]'}`}
        >
          {isSidebarOpen ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
        </button>

        <div>
          <div className={`pt-8 pb-10 flex items-center gap-3 ${isSidebarOpen ? 'px-6' : 'px-0 justify-center'}`}>
             <div className="w-8 h-8 rounded-md bg-[#0f3b9c] text-white flex items-center justify-center flex-shrink-0">
                <Monitor size={16} />
             </div>
             {isSidebarOpen && (
               <div className="overflow-hidden whitespace-nowrap">
                  <h1 className={`font-bold text-[14px] leading-tight ${isDarkMode ? 'text-[#f1f5f9]' : 'text-[#102a5e]'}`}>Ticket2Test AI</h1>
               </div>
             )}
          </div>

          {/* Fix #4: Removed Jira Sync & Templates; kept Generator + History only */}
          <nav className="space-y-1 px-3">
             <MenuItem id="generator" icon={Zap} label="Generator" activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} />
             <MenuItem id="history" icon={History} label="History" activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} />
          </nav>
        </div>

        <div className="p-3 space-y-2 mb-4">
           {isSidebarOpen ? (
             <button
               onClick={() => { setActiveTab('generator'); setJiraData(null); setTestCases([]); }}
               className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f3b9c] text-white rounded-md font-medium text-[13px] hover:bg-[#0c2f7a] transition-colors shadow-sm">
               <Plus size={16} /> New Test Case
             </button>
           ) : (
             <button
               onClick={() => { setActiveTab('generator'); setJiraData(null); setTestCases([]); }}
               className="w-full flex items-center justify-center py-2.5 bg-[#0f3b9c] text-white rounded-md hover:bg-[#0c2f7a] transition-colors shadow-sm">
               <Plus size={16} />
             </button>
           )}
        </div>
      </div>

      {/* Main Container */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
        <header className={`h-[60px] border-b flex justify-between items-center px-8 flex-shrink-0 ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e9ebf0]'}`}>
          <div className={`flex items-center gap-8 text-[14px] font-semibold ${isDarkMode ? 'text-[#60a5fa]' : 'text-[#0f3b9c]'}`}>
             <span className="tracking-wide">Ticket2Test AI</span>
          </div>

          <div className={`flex items-center gap-5 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>
             <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 opacity-50" />
                <input
                  placeholder="Search..."
                  className={`border text-[13px] rounded-md pl-9 pr-4 py-2 outline-none w-[220px] transition-colors ${isDarkMode ? 'bg-[#0f172a] border-[#334155] text-[#f1f5f9] placeholder-[#475569]' : 'bg-[#f4f5f7] border-transparent text-[#172b4d]'}`}
                />
             </div>
             <div className="flex items-center gap-3">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="hover:opacity-80 transition-opacity" title="Toggle theme">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="hover:opacity-80 transition-opacity" title="Settings">
                  <SettingsIcon size={18} />
                </button>
                <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-sm cursor-pointer ${isDarkMode ? 'bg-[#3b82f6]' : 'bg-[#102a5e]'}`}>
                   Q
                </div>
             </div>
          </div>
        </header>

        {/* Workspace Body */}
        <div className={`flex-1 overflow-y-auto px-8 py-8 flex gap-8 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#fafbfc]'}`}>
           {activeTab === 'generator' && (
             <>
               {/* Left Column */}
               <div className="w-[310px] flex-shrink-0 flex flex-col gap-5">
                  <div className={`p-5 rounded-lg border ${isDarkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-[#edf2ff] border-[#d3dcf0]'}`}>
                     <div className="flex justify-between items-center mb-3">
                       <h3 className={`text-[11px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-[#60a5fa]' : 'text-[#102a5e]'}`}>Jira Connection</h3>
                       {configStatus.jira_configured ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-[#d3e3fd] text-[#0f3b9c]'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-[#0f3b9c]'}`}></span> Connected
                          </span>
                       ) : (
                          <span className="px-2 py-0.5 bg-[#fce8e8] text-[#c9302c] rounded-full text-[10px] font-bold uppercase tracking-wider">Missing</span>
                       )}
                     </div>
                     <p className={`text-[12px] leading-relaxed ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>
                       API credentials are managed securely. Use the Settings icon to configure your connections.
                     </p>
                  </div>
                  <ContextPanel data={jiraData} loading={loading} isDarkMode={isDarkMode} />
               </div>

               {/* Right Column */}
               <div className="flex-1 min-w-0 flex flex-col gap-6">
                  <InputPanel
                    onFetch={(data) => setJiraData(data)}
                    onGenerate={handleGenerated}
                    onError={(msg) => showToast('error', msg)}
                    setLoading={setLoading}
                    loading={loading}
                    readyToFetch={configStatus.jira_configured}
                    isDarkMode={isDarkMode}
                  />
                  <OutputPanel testCases={testCases} loading={loading} isDarkMode={isDarkMode} />
               </div>
             </>
           )}

           {/* Fix #5: History Tab */}
           {activeTab === 'history' && (
             <HistoryTab 
                history={history} 
                isDarkMode={isDarkMode} 
                onSelectHistory={(entry) => { 
                   setTestCases(entry.cases); 
                   setJiraData({ summary: entry.summary }); 
                   setActiveTab('generator'); 
                }} 
                onClearHistory={clearHistory} 
             />
           )}
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={fetchConfigStatus}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;
