import { useState } from 'react';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import TextToImage from './pages/TextToImage';
import TextToVideo from './pages/TextToVideo';
import Gallery from './pages/Gallery';
import Settings from './pages/Settings';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <MainLayout currentView={currentView} onNavigate={setCurrentView}>
      {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
      {currentView === 'text-to-image' && <TextToImage />}
      {currentView === 'text-to-video' && <TextToVideo />}
      {currentView === 'gallery' && <Gallery />}
      {currentView === 'settings' && <Settings />}
    </MainLayout>
  );
}
