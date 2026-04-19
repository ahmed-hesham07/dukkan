import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/config';
import './index.css';
import { initLanguage } from './store/useLanguageStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { log } from './lib/logger';
import App from './App';

initLanguage();

log.info('Dukkan frontend starting', {
  env: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
