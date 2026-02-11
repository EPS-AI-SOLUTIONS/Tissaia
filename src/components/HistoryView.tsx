// src/components/HistoryView.tsx
/**
 * Restoration History View - Tauri Edition
 * =========================================
 * Browse past restorations from Rust backend.
 */

import { format } from 'date-fns';
import { enUS, pl } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Clock, History, Trash2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useViewTheme } from '../hooks';
import { type HistoryEntry, useClearHistory, useHistory } from '../hooks/useApi';
import { useSettingsStore } from '../store/useSettingsStore';
import Skeleton from './ui/Skeleton';

export default function HistoryView() {
  const { t } = useTranslation();
  const { data: history, isLoading } = useHistory();
  const clearHistoryMutation = useClearHistory();
  const settings = useSettingsStore((s) => s.settings);
  const theme = useViewTheme();

  const locale = settings.language === 'pl' ? pl : enUS;

  const handleClearHistory = async () => {
    if (confirm('Czy na pewno chcesz wyczyścić historię?')) {
      try {
        await clearHistoryMutation.mutateAsync();
        toast.success('Historia wyczyszczona');
      } catch (_error) {
        toast.error('Nie udało się wyczyścić historii');
      }
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.accentBg}`}>
            <History className={theme.iconAccent} size={24} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${theme.textAccent}`}>{t('nav.history')}</h2>
            <p className={theme.textMuted}>{history?.length ?? 0} operacji</p>
          </div>
        </div>

        {history && history.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={clearHistoryMutation.isPending}
            className={`${theme.btnDanger} px-4 py-2 flex items-center gap-2`}
          >
            <Trash2 size={16} />
            <span>Wyczyść</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <div className={`text-center py-12 ${theme.empty}`}>
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${theme.accentBg} flex items-center justify-center`}
            >
              <Clock size={32} className={theme.iconMuted} />
            </div>
            <p className={theme.textMuted}>Brak historii operacji</p>
            <p className={`text-sm mt-2 ${theme.textMuted}`}>Rozpocznij od wgrania zdjęcia</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {history.map((entry: HistoryEntry, index: number) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${theme.card} p-4`}
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div
                      className={`p-2 rounded-lg ${entry.success ? 'bg-white/10' : 'bg-red-500/10'}`}
                    >
                      {entry.success ? (
                        <CheckCircle size={24} className="text-white" />
                      ) : (
                        <XCircle size={24} className="text-red-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold capitalize ${theme.title}`}>
                        {entry.operation === 'photoseparation'
                          ? 'Separacja'
                          : entry.operation === 'analysis'
                            ? 'Analiza'
                            : 'Restauracja'}
                      </h3>

                      <div className={`flex items-center gap-4 mt-1 text-sm ${theme.textMuted}`}>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {format(new Date(entry.timestamp), 'PPp', { locale })}
                        </span>

                        <span className={theme.badge}>{entry.provider}</span>
                      </div>

                      {entry.error_message && (
                        <p className="text-xs text-red-500 mt-2">{entry.error_message}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
