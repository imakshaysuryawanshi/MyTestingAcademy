import { useEffect } from 'react';

export function useKeyboardShortcuts({ onNew, onSearch, onToggleTheme, onHelp, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const key = e.key.toLowerCase();
      
      if (key === 'n') onNew?.();
      if (key === '/') { e.preventDefault(); onSearch?.(); }
      if (key === 'd') onToggleTheme?.();
      if (key === '?') onHelp?.();
      if (e.key === 'Escape') onClose?.();
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNew, onSearch, onToggleTheme, onHelp, onClose]);
}
