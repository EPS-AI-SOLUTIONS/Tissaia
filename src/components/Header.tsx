// src/components/Header.tsx
/**
 * Application Header - Regis Style
 * =================================
 * Top bar with status and breadcrumbs.
 */

import { ChevronRight, Home, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useViewTheme } from '../hooks';
import { useViewStore } from '../store/useViewStore';

interface HeaderProps {
  status?: string;
}

// View labels
const viewLabels: Record<string, { pl: string; en: string }> = {
  upload: { pl: 'Wgraj', en: 'Upload' },
  crop: { pl: 'Kadrowanie', en: 'Crop' },
  analyze: { pl: 'Analiza', en: 'Analyze' },
  restore: { pl: 'Restauracja', en: 'Restore' },
  results: { pl: 'Wyniki', en: 'Results' },
  history: { pl: 'Historia', en: 'History' },
  settings: { pl: 'Ustawienia', en: 'Settings' },
  health: { pl: 'Status', en: 'Health' },
};

export default function Header({ status }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { resolvedTheme } = useTheme();
  const currentView = useViewStore((s) => s.currentView);
  const setCurrentView = useViewStore((s) => s.setCurrentView);
  const theme = useViewTheme();

  const currentLabel = viewLabels[currentView]?.[i18n.language as 'pl' | 'en'] || currentView;

  return (
    <header className={`px-6 py-3 border-b ${theme.border} ${theme.header}`}>
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setCurrentView('upload')}
            className={`flex items-center gap-1 ${theme.textMuted} ${theme.isLight ? 'hover:text-emerald-600' : 'hover:text-white'} transition-colors`}
          >
            <Home size={14} />
            <span className="font-medium">Tissaia</span>
          </button>
          <ChevronRight size={14} className={theme.textMuted} />
          <span className={`${theme.textAccent} font-medium`}>{currentLabel}</span>

          {/* Status indicator */}
          <div className="flex items-center gap-2 ml-4">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'healthy'
                  ? `${resolvedTheme === 'light' ? 'bg-emerald-500' : 'bg-white'} animate-pulse`
                  : 'bg-yellow-500'
              }`}
            />
            <span className={`text-xs ${theme.textMuted}`}>
              {status === 'healthy' ? t('health.healthy') : t('health.degraded')}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`p-2 rounded-lg ${theme.btnGhost}`}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
