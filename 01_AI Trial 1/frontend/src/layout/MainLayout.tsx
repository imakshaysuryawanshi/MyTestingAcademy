import type { ReactNode } from 'react';
import { LayoutDashboard, Image as ImageIcon, Video, Images, Settings } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function MainLayout({ children, currentView, onNavigate }: MainLayoutProps) {
  
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'text-to-image', icon: ImageIcon, label: 'Text to Image' },
    { id: 'text-to-video', icon: Video, label: 'Text to Video' },
    { id: 'gallery', icon: Images, label: 'Gallery' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div style={{ padding: '0.5rem 1rem 2.5rem 1rem', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
          <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #4f46e5, #2563eb)', borderRadius: '6px' }}></div>
          AI Generator
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
            >
              <item.icon size={20} style={{ marginRight: '14px' }} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button 
            className={`sidebar-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
            style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
          >
            <Settings size={20} style={{ marginRight: '14px' }} />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Main Content Viewport */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
