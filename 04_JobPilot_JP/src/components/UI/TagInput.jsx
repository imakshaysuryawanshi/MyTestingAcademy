import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function TagInput({ tags, onChange, placeholder = 'Add skills (Enter)...' }) {
  const [input, setInput] = useState('');

  const addTag = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span 
            key={tag} 
            className="flex items-center gap-1.5 bg-jp-cyan/10 text-jp-cyan dark:text-cyan-400 border border-jp-cyan/20 px-2 py-1 rounded-md text-xs font-medium"
          >
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(tag)}
              className="hover:text-rose-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={addTag}
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-jp-cyan outline-none transition-all"
      />
    </div>
  );
}
