import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import './i18n';

// Suppress THREE.Clock deprecation warning from @react-three/fiber
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) {
    return;
  }
  originalWarn(...args);
};


// Auto-log uncaught errors
if (typeof window !== 'undefined') {
  const submitError = async (errorMsg, stack) => {
    try {
      const { db } = await import('./firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'error_logs'), {
        message: errorMsg,
        stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      });
    } catch(e) {}
  };
  
  window.addEventListener('error', (e) => {
    submitError(e.message, e.error?.stack);
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    submitError(e.reason?.message || 'Unhandled Rejection', e.reason?.stack);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);
