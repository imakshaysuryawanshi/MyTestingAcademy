import React, { useRef, useState } from 'react';
import { useJobStore } from './hooks/useJobStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import KanbanBoard from './components/Board/KanbanBoard';
import TableView from './components/Table/TableView';
import JobModal from './components/Modal/JobModal';
import ShortcutsHelp from './components/UI/ShortcutsHelp';
import Toast from './components/UI/Toast';
import { HelpCircle } from 'lucide-react';

export default function App() {
  const { 
    view, 
    dark, 
    toggleTheme, 
    modalState, 
    closeModal, 
    openModal,
    loading 
  } = useJobStore();
  
  const searchRef = useRef(null);
  const [showHelp, setShowHelp] = useState(false);

  useKeyboardShortcuts({
    onNew: () => openModal(null),
    onSearch: () => searchRef.current?.focus(),
    onToggleTheme: toggleTheme,
    onHelp: () => setShowHelp(true),
    onClose: closeModal,
  });

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f] text-jp-cyan">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-jp-cyan border-t-transparent rounded-full animate-spin"></div>
          <p className="font-display font-bold italic animate-pulse">Pre-check complete. Preparing for takeoff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-[#0a0a0f] transition-colors duration-500">
        <Sidebar />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar searchRef={searchRef} />
          
          <main className="flex-1 overflow-auto p-8 relative">
            <div className="max-w-[1600px] mx-auto h-full">
               {view === 'kanban' ? <KanbanBoard /> : <TableView />}
            </div>

            {/* Help Button - Bottom Right */}
            <button 
              onClick={() => setShowHelp(true)}
              className="fixed bottom-6 right-6 p-3 bg-white dark:bg-[#1e1e2e] border border-slate-200 dark:border-white/10 rounded-full shadow-2xl text-slate-400 hover:text-jp-cyan transition-all hover:scale-110 active:scale-95 group z-30"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-6 h-6" />
              <span className="absolute bottom-full right-0 mb-2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Shortcuts (?)
              </span>
            </button>
          </main>
        </div>
      </div>

      <JobModal />
      <ShortcutsHelp open={showHelp} onClose={() => setShowHelp(false)} />
      <Toast />
    </div>
  );
}
