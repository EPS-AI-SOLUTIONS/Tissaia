// src/App.tsx
/**
 * Tissaia-AI Main Application Component
 * ======================================
 * Photo restoration dashboard with Matrix Glass UI - Regis Style.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
// Components
import Sidebar from './components/Sidebar';
import BrowserModeWarning from './components/ui/BrowserModeWarning';
import ProgressBar from './components/ui/ProgressBar';
import Skeleton from './components/ui/Skeleton';
import { useTheme } from './contexts/ThemeContext';
import { useGlassPanel } from './hooks';
import { useStatus } from './hooks/useApi';
import { useSettingsStore } from './store/useSettingsStore';
import { useViewStore } from './store/useViewStore';

// Lazy-loaded views
const UploadView = lazy(() => import('./components/photo/UploadView'));
const CropView = lazy(() => import('./components/photo/CropView'));
const AnalyzeView = lazy(() => import('./components/photo/AnalyzeView'));
const RestoreView = lazy(() => import('./components/photo/RestoreView'));
const ResultsView = lazy(() => import('./components/photo/ResultsView'));
const HistoryView = lazy(() => import('./components/HistoryView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const HealthView = lazy(() => import('./components/HealthView'));

// ============================================
// LOADING FALLBACK
// ============================================

function ViewSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================

export default function App() {
  const { i18n } = useTranslation();
  const currentView = useViewStore((s) => s.currentView);
  const isLoading = useViewStore((s) => s.isLoading);
  const progressMessage = useViewStore((s) => s.progressMessage);
  const settings = useSettingsStore((s) => s.settings);
  const { data: status } = useStatus();
  const { resolvedTheme } = useTheme();
  const glassPanel = useGlassPanel();

  // Apply language from settings
  useEffect(() => {
    if (settings.language && i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);

  // ============================================
  // VIEW RENDERER
  // ============================================

  const renderView = () => {
    switch (currentView) {
      case 'upload':
        return <UploadView />;
      case 'crop':
        return <CropView />;
      case 'analyze':
        return <AnalyzeView />;
      case 'restore':
        return <RestoreView />;
      case 'results':
        return <ResultsView />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
      case 'health':
        return <HealthView />;
      default:
        return <UploadView />;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="relative flex h-screen w-full text-slate-100 overflow-hidden font-mono selection:bg-matrix-accent selection:text-black">
      {/* Background Layer */}
      <div
        className={`absolute inset-0 z-[1] bg-cover bg-center opacity-10 mix-blend-overlay transition-opacity duration-1000 pointer-events-none ${resolvedTheme === 'light' ? "bg-[url('/backgroundlight.webp')]" : "bg-[url('/background.webp')]"}`}
      />
      <div
        className={`absolute inset-0 z-[1] bg-gradient-to-b ${resolvedTheme === 'light' ? 'from-white/30 via-transparent to-slate-100/50' : 'from-matrix-bg-primary/30 via-transparent to-matrix-bg-secondary/50'} transition-opacity duration-1000 pointer-events-none opacity-60`}
      />
      <div
        className={`absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${resolvedTheme === 'light' ? 'from-emerald-500/5' : 'from-matrix-accent/5'} via-transparent to-transparent`}
      />

      {/* Browser Mode Warning - fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <BrowserModeWarning />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex h-full w-full backdrop-blur-[1px] gap-4 p-4">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col overflow-hidden relative rounded-2xl ${glassPanel}`}>
          {/* Header */}
          <Header status={status?.status} />

          {/* Progress Bar (when loading) */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`px-6 py-2 border-b ${resolvedTheme === 'light' ? 'border-slate-200/30 bg-white/30' : 'border-white/10 bg-black/30'}`}
              >
                <ProgressBar message={progressMessage} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* View Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-matrix-accent/20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Suspense fallback={<ViewSkeleton />}>{renderView()}</Suspense>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Status Bar */}
          <footer
            className={`px-6 py-2 border-t ${resolvedTheme === 'light' ? 'border-slate-200/30 bg-white/20 text-slate-600' : 'border-white/10 bg-black/20 text-slate-400'} text-xs flex items-center justify-between`}
          >
            <div className="flex items-center gap-4">
              <span
                className={resolvedTheme === 'light' ? 'text-emerald-600' : 'text-matrix-accent'}
              >
                Tissaia-AI v3.0.0
              </span>
              <span className={resolvedTheme === 'light' ? 'text-slate-300' : 'text-white/20'}>
                |
              </span>
              <span>
                {status?.status === 'healthy' ? (
                  <span
                    className={
                      resolvedTheme === 'light' ? 'text-emerald-600' : 'text-matrix-accent'
                    }
                  >
                    ● Online
                  </span>
                ) : (
                  <span className="text-yellow-500">● Degraded</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Gemini Vision</span>
              <span className={resolvedTheme === 'light' ? 'text-slate-300' : 'text-white/20'}>
                |
              </span>
              <span>
                {new Date().toLocaleDateString(settings.language === 'pl' ? 'pl-PL' : 'en-US')}
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
