import React from 'react';
import { Maximize2, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
import type { GenerationResponse } from '../../services/api';

interface PreviewCanvasProps {
  isGenerating: boolean;
  result: GenerationResponse['data'] | null;
  onDownload: (url: string, id: string, e: React.MouseEvent) => void;
  onReusePrompt: (prompt: string) => void;
}

export default function PreviewCanvas({ isGenerating, result, onDownload, onReusePrompt }: PreviewCanvasProps) {
  
  if (!result) {
    return (
      <div className="result-item" style={{ width: '100%', height: '100%', minHeight: '400px', backgroundColor: 'transparent', border: '2px dashed var(--border-color)', flex: 1 }}>
        <div className="empty-state">
          {isGenerating ? (
            <>
              <RefreshCw size={64} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
              <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Crafting your vision...</p>
              <p style={{ fontSize: '0.9rem' }}>The AI models are processing the request without censorship filters.</p>
            </>
          ) : (
            <>
              <ImageIcon size={64} style={{ opacity: 0.2 }} />
              <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Describe what you want to see and hit Generate</p>
              <p style={{ fontSize: '0.9rem' }}>Supports uncensored local and remote models.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', minHeight: 0 }}>
      {/* Media Renderer */}
      <div style={{ flex: 1, backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0 }}>
        {result.type === 'image' ? (
          <img src={result.url} alt="Generated result" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        ) : (
          <video src={result.url} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '100%' }} />
        )}
        
        {/* Overlay controls */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button className="btn-primary" style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }} title="Maximize">
            <Maximize2 size={18} color="#fff" />
          </button>
          <button 
            onClick={(e) => onDownload(result.url, result.id, e)} 
            className="btn-primary" 
            style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'inline-flex', border: 'none', cursor: 'pointer' }} 
            title="Download"
          >
            <Download size={18} color="#fff" />
          </button>
        </div>
      </div>
      
      {/* Details Box */}
      <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', flexShrink: 0 }}>
        <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Prompt used:</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{result.prompt}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button 
            className="btn-primary" 
            onClick={() => onReusePrompt(result.prompt)} 
            style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            Reuse Prompt
          </button>
        </div>
      </div>
    </div>
  );
}
