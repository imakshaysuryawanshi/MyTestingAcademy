import React, { forwardRef } from 'react';
import { useJobStore } from '../../hooks/useJobStore';
import { Search, X } from 'lucide-react';

const SearchBar = forwardRef((props, ref) => {
  const { searchQuery, setSearchQuery } = useJobStore();

  return (
    <div className="relative flex-1 max-w-md group">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="w-4 h-4 text-slate-400 group-focus-within:text-jp-cyan transition-colors" />
      </div>
      <input
        ref={ref}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by company or role..."
        className="w-full bg-slate-100 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl py-2 pl-10 pr-10 text-sm focus:bg-white dark:focus:bg-[#1e1e2e] focus:border-slate-200 dark:focus:border-white/10 outline-none transition-all shadow-inner dark:shadow-none italic text-slate-600 dark:text-slate-300"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
export default SearchBar;
