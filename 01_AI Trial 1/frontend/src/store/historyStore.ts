// src/store/historyStore.ts

export interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  type: 'image' | 'video';
  timestamp: string;
  isFavorite?: boolean;
}

const STORAGE_KEY = 'ai_trial_history';

export const historyStore = {
  getHistory: (): HistoryItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addHistory: (item: HistoryItem) => {
    const history = historyStore.getHistory();
    const updated = [item, ...history];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  removeHistory: (id: string) => {
    const history = historyStore.getHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  clearHistory: () => {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  },
  
  toggleFavorite: (id: string) => {
    const history = historyStore.getHistory();
    const updated = history.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
};
