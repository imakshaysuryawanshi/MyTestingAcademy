import React, { useState } from 'react';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import ViewToggle from './ViewToggle';
import { useJobStore } from '../../hooks/useJobStore';
import { Plus, Sun, Moon, MoreVertical, Download, Upload, Info } from 'lucide-react';
import { exportToJSON, importFromJSON } from '../../utils/exportImport';

export default function Navbar({ searchRef }) {
  const { dark, toggleTheme, jobs, addJob, openModal, showToast } = useJobStore();
  const [showMore, setShowMore] = useState(false);

  const handleExport = () => {
    exportToJSON(jobs);
    showToast('Backup generated!');
    setShowMore(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedJobs = await importFromJSON(file);
      // For MVP, simplistic "Replace All" or just merge via loop
      // Build prompt says "Merge or Replace", here we simplified for MVP loop
      for (const job of importedJobs) {
        // simplistic merge logic
        await addJob(job);
      }
      showToast('Jobs imported!');
    } catch (err) {
      showToast('Import failed!', 'error');
    }
    setShowMore(false);
  };

  return (
    <header className="h-[72px] flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-6 flex-1">
        <SearchBar ref={searchRef} />
        <div className="h-6 w-px bg-slate-200 dark:bg-white/5 hidden md:block"></div>
        <FilterBar />
      </div>

      <div className="flex items-center gap-4">
        <ViewToggle />
        
        <div className="h-6 w-px bg-slate-200 dark:bg-white/5 hidden sm:block"></div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Toggle Dark Mode"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMore && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMore(false)}></div>
                <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-[#0f0f17] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button 
                    onClick={handleExport}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 text-xs text-slate-600 dark:text-slate-300 italic font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Backup (.json)
                  </button>
                  <label className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 text-xs text-slate-600 dark:text-slate-300 italic font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Import Backup
                    <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => openModal(null)}
          className="bg-jp-cyan hover:bg-jp-cyan/90 text-slate-900 font-display font-bold px-4 py-2 rounded-xl text-sm italic shadow-lg shadow-jp-cyan/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </div>
    </header>
  );
}
