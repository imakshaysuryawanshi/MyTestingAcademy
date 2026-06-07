import React from 'react';
import { History, Trash2, Clock } from 'lucide-react';
import type { HistoryItem } from '../../store/historyStore';

interface HistoryPanelProps {
  history: HistoryItem[];
  activeId: string | null;
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export default function HistoryPanel({ history, activeId, onSelect, onDelete, onClearAll }: HistoryPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
          <History size={18} /> History
        </h3>
        {history.length > 0 && (
          <button 
            onClick={onClearAll} 
            style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer', padding: '0.2rem' }}
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
        {history.length === 0 ? (
           <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>No generations yet.</p>
        ) : (
          history.map(item => (
            <div 
              key={item.id} 
              style={{ 
                position: 'relative', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                cursor: 'pointer',
                border: activeId === item.id ? '2px solid var(--accent-blue)' : '2px solid transparent'
              }}
              onClick={() => onSelect(item)}
            >
              <div style={{ aspectRatio: '1', backgroundColor: '#000', width: '100%' }}>
                 {item.type === 'image' ? (
                   <img src={item.url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                 ) : (
                   <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} muted />
                 )}
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.5rem', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#ccc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} /> {item.timestamp}
                </span>
                <button 
                  onClick={(e) => onDelete(item.id, e)}
                  style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', borderRadius: '4px', padding: '0.25rem', color: '#fca5a5', cursor: 'pointer', display: 'flex' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
