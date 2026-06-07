import React, { useState } from 'react';
import { Download, Trash2, Search, Filter, Grid2X2, ImageIcon } from 'lucide-react';

interface GalleryItem {
  id: string;
  url: string;
  prompt: string;
  type: 'image' | 'video';
  date: string;
}

// Mock initial data
const initialData: GalleryItem[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `mock_${i}`,
  url: i % 3 === 0 ? 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' : `https://picsum.photos/seed/${i + 10}/800/800`,
  prompt: `A beautiful detailed artwork of a futuristic scene, cyberpunk style, neon lights... (${i})`,
  type: i % 3 === 0 ? 'video' : 'image',
  date: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString()
}));

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => item.prompt.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleDownload = async (url: string, id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Generated_${id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed, falling back', err);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '2rem', marginTop: '-1rem' }}>
        <h1 className="page-title">Personal Gallery</h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search prompts..." 
              className="text-input" 
              style={{ paddingLeft: '2.5rem', width: '300px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Filter size={18} /> Filter
          </button>
          <button className="btn-primary" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Grid2X2 size={18} /> View
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
        {filteredItems.length === 0 ? (
           <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-secondary)' }}>
             <ImageIcon size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
             <p>No generated content found matching your search.</p>
           </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="gallery-card" style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ aspectRatio: '1', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.prompt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                
                {item.type === 'video' && (
                  <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>VIDEO</div>
                )}
                
                <div className="gallery-actions" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem', opacity: 0, transition: 'opacity 0.2s ease' }}>
                  <button onClick={(e) => handleDownload(item.url, item.id, e)} className="btn-primary" style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer' }}>
                    <Download size={16} />
                  </button>
                  <button className="btn-primary" onClick={() => handleDelete(item.id)} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.8)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }} title={item.prompt}>
                  {item.prompt}
                </p>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.date}</span>
                  <span>{item.type === 'image' ? '1024x1024' : '4s Video'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .gallery-card:hover .gallery-actions {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
