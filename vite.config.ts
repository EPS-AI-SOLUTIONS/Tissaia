import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import viteCompression from 'vite-plugin-compression';

const isProd = process.env.NODE_ENV === 'production';

// https://v2.tauri.app/start/frontend/vite/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Gzip compression for production
    isProd && viteCompression({
      algorithm: 'gzip',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Brotli compression for production
    isProd && viteCompression({
      algorithm: 'brotliCompress',
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ].filter(Boolean),

  // Tauri expects a fixed port
  server: {
    port: 5175,
    host: '0.0.0.0',
    strictPort: true,
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**', '**/src-tauri/**'],
    },
  },

  // Prevent vite from obscuring rust errors
  clearScreen: false,

  // Env variables starting with TAURI_ are exposed to JS
  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    outDir: 'dist',
    sourcemap: true,
    // Tauri uses Chromium on Windows and WebKit on macOS/Linux
    target: process.env.TAURI_ENV_PLATFORM === 'windows'
      ? 'chrome105'
      : 'safari14',
    // Don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-state': ['zustand', '@tanstack/react-query'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'vendor-utils': ['date-fns', 'uuid', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', '@tanstack/react-query'],
  },
});

