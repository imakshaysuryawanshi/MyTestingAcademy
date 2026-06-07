import React from 'react';
import { Trash2, Clock } from 'lucide-react';

const HistoryTab = ({ history, isDarkMode, onSelectHistory, onClearHistory }) => {
  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-[18px] font-bold ${isDarkMode ? 'text-[#f1f5f9]' : 'text-[#102a5e]'}`}>Generation History</h2>
          <p className={`text-[12px] mt-1 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>{history.length} entries saved locally</p>
        </div>
        {history.length > 0 && (
          <button onClick={onClearHistory} className="flex items-center gap-2 text-[12px] text-red-500 hover:text-red-600 transition-colors">
            <Trash2 size={14}/> Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className={`flex-1 flex flex-col items-center justify-center text-center gap-4 rounded-lg border py-20 ${isDarkMode ? 'border-[#334155] bg-[#1e293b]' : 'border-[#e9ebf0] bg-white'}`}>
          <Clock size={40} className={isDarkMode ? 'text-[#475569]' : 'text-[#a5adba]'} />
          <p className={`text-[14px] font-medium ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>No history yet.<br/>Generate test cases to see them here.</p>
        </div>
      ) : (
        <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'border-[#334155]' : 'border-[#e9ebf0]'}`}>
          {history.map((entry, idx) => (
            <div key={entry.id} className={`flex items-center justify-between px-6 py-4 border-b last:border-b-0 cursor-pointer transition-colors ${isDarkMode ? 'border-[#334155] hover:bg-[#1e293b]' : 'border-[#f4f5f7] hover:bg-[#fafbfc]'}`}
              onClick={() => onSelectHistory(entry)}>
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${isDarkMode ? 'bg-[#3b82f6]/20 text-[#60a5fa]' : 'bg-[#edf2ff] text-[#0f3b9c]'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-[13px] font-semibold ${isDarkMode ? 'text-[#f1f5f9]' : 'text-[#172b4d]'}`}>{entry.jiraId}</p>
                    <span className={`text-[10px] opacity-40 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>• {entry.timestamp}</span>
                  </div>
                  {entry.summary && (
                    <p className={`text-[11px] truncate opacity-70 ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#5e6c84]'}`}>{entry.summary}</p>
                  )}
                </div>
              </div>
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-[#1e3a5f] text-[#60a5fa]' : 'bg-[#edf2ff] text-[#1a56db]'}`}>
                {entry.count} Cases
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
