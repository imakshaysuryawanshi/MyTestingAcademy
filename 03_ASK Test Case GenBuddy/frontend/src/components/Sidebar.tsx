import { Settings, History, PlusCircle, PanelLeftClose, Trash2 } from 'lucide-react';

interface SidebarProps {
  onOpenSettings: () => void;
  onNewChat: () => void;
  onSelectHistory: (id: string) => void;
  onDeleteHistory: (id: string) => void;
  onClearChat: () => void;
  history: { id: string, title: string }[];
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ onOpenSettings, onNewChat, onSelectHistory, onDeleteHistory, onClearChat, history, isOpen, onClose }: SidebarProps) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: 0 }}><History size={20} /> History</h2>
        <button className="icon-btn" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <PanelLeftClose size={20} />
        </button>
      </div>
      
      <button 
        onClick={onNewChat}
        className="sidebar-btn" 
        style={{ marginBottom: '1rem', background: 'var(--primary)', color: 'white', border: 'none' }}
      >
        <PlusCircle size={18} /> New Test Case
      </button>

      <button 
        onClick={onClearChat}
        className="sidebar-btn" 
        style={{ marginBottom: '1rem', border: '1px solid var(--danger)', color: 'var(--danger)', background: 'transparent' }}
      >
        <Trash2 size={18} /> ClearChat
      </button>

      <div className="history-list">
        {history.map(item => (
          <div key={item.id} className="history-item-container group">
            <div className="history-item" onClick={() => onSelectHistory(item.id)}>
              {item.title}
            </div>
            <button 
              className="history-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteHistory(item.id);
              }}
              title="Delete this history"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button className="settings-btn" onClick={onOpenSettings}>
        <Settings size={20} /> Settings
      </button>
    </div>
  );
};
