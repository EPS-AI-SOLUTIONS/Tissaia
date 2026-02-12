import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';

const isProd = process.env.NODE_ENV === 'production';

// Vite config — v4.0 Web Edition
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Gzip compression for production
    isProd &&
      viteCompression({
        algorithm: 'gzip',
        threshold: 1024,
        deleteOriginFile: false,
      }),
    // Brotli compression for production
    isProd &&
      viteCompression({
        algorithm: 'brotliCompress',
        threshold: 1024,
        deleteOriginFile: false,
      }),
  ].filter(Boolean),

  server: {
    port: 5175,
    host: '0.0.0.0',
    strictPort: true,
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**'],
    },
  },

  clearScreen: false,

  envPrefix: ['VITE_'],

  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    minify: isProd ? 'esbuild' : false,
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
