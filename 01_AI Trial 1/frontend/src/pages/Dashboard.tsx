import { Image as ImageIcon, Video, Images, Plus } from 'lucide-react';

function DashboardCard({ title, description, icon: Icon, onClick }: any) {
  return (
    <div 
      className="dashboard-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onClick}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-blue)', opacity: 0 }} className="card-accent" />
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} style={{ color: 'var(--accent-blue)' }} />
      </div>
      <div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{description}</p>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', fontSize: '0.9rem', fontWeight: 500 }}>
        <span>Get Started</span>
        <Plus size={16} />
      </div>
    </div>
  );
}

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1 className="page-title">Welcome back, Creator</h1>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2a2d42', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', color: '#fff', cursor: 'pointer' }}>A</div>
      </div>
      
      <div className="card-grid" style={{ marginBottom: '3rem' }}>
        <DashboardCard 
          title="Text to Image" 
          description="Transform your textual descriptions into stunning, high-resolution images using state-of-the-art models."
          icon={ImageIcon}
          onClick={() => onNavigate('text-to-image')}
        />
        <DashboardCard 
          title="Text to Video" 
          description="Bring your ideas to life with cinematic video generation powered by advanced AI and physics."
          icon={Video}
          onClick={() => onNavigate('text-to-video')}
        />
        <DashboardCard 
          title="Image to Image" 
          description="Modify existing images, change styles, or upscale your favorite creations."
          icon={Images}
          onClick={() => onNavigate('text-to-image')} // Routes to image gen for now
        />
      </div>

      <div className="history-section">
        <div className="history-header">
          <h3 className="history-title">Generation History</h3>
          <div className="history-view-all" onClick={() => onNavigate('gallery')}>View All ❯</div>
        </div>
        <div className="history-grid">
          {[1, 2, 3, 4].map(item => (
            <div key={item} className="history-item">
              <div className="history-image-placeholder">
                <ImageIcon size={32} color="rgba(255,255,255,0.2)" />
              </div>
              <div className="history-meta">Today, 9:34 AM</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
