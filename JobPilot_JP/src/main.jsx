import React from 'react';
import ReactDOM from 'react-dom/client';
import { JobStoreProvider } from './hooks/useJobStore';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <JobStoreProvider>
      <App />
    </JobStoreProvider>
  </React.StrictMode>
);
