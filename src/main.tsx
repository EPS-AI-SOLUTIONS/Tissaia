// src/main.tsx
/**
 * Tissaia-AI Application Entry Point
 * ===================================
 * Photo restoration dashboard powered by Gemini Vision.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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
            className: 'backdrop-blur-md',
            duration: 4000,
          }}
          theme="system"
        />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
