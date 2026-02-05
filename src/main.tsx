// src/main.tsx
/**
 * Tissaia-AI Application Entry Point
 * ===================================
 * Photo restoration dashboard powered by Gemini Vision.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n';
import './index.css';

// React Query client with smart defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Check index.html.');
}

// Render application
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'bg-matrix-glass backdrop-blur-md border border-matrix-border text-matrix-text',
            duration: 4000,
            style: {
              background: 'rgba(10, 31, 10, 0.9)',
              color: '#c0ffc0',
              border: '1px solid #1a3a1a',
            },
            success: {
              iconTheme: {
                primary: '#00ff41',
                secondary: '#0a0f0d',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff4141',
                secondary: '#0a0f0d',
              },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
