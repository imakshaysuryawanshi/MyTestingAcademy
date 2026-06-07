import { useState, useEffect } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('jp-theme') !== 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('jp-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggleTheme: () => setDark((d) => !d) };
}
