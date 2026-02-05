// src/components/photo/RestoreView.tsx
/**
 * Photo Restoration View - Tauri Edition
 * =======================================
 * Configure and run photo restoration.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { useRestoreImage, type AnalysisResult } from '../../hooks/useApi';
import ProgressBar from '../ui/ProgressBar';
import ModelSelector from '../ui/ModelSelector';

// ============================================
// RESTORE VIEW COMPONENT
// ============================================

export default function RestoreView() {
  const { t } = useTranslation();
  const {
    photos,
    setCurrentView,
    setIsLoading,
    setProgressMessage,
  } = useAppStore();

  // Get currentAnalysis from store (set by AnalyzeView)
  const currentAnalysis = useAppStore((state) => (state as { currentAnalysis?: AnalysisResult }).currentAnalysis);

  const restoreMutation = useRestoreImage();
  const [isRestoring, setIsRestoring] = useState(false);

  const currentPhoto = photos[0];

  const handleRestore = async () => {
    if (!currentPhoto || !currentAnalysis) {
      toast.error('Brak zdjęcia lub analizy');
      return;
    }

    setIsRestoring(true);
    setIsLoading(true);
    setProgressMessage(t('progress.restoring'));

    try {
      const result = await restoreMutation.mutateAsync({
        file: currentPhoto.file,
        analysis: currentAnalysis,
      });

      // Store result and navigate to results view
      useAppStore.setState({
        restorationResult: result,
      });

      toast.success('Restauracja zakończona!');
      setCurrentView('results');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Błąd restauracji';
      toast.error(errorMessage);
    } finally {
      setIsRestoring(false);
      setIsLoading(false);
      setProgressMessage('');
    }
  };

  if (!currentPhoto) {
    return (
      <div className="p-6 text-center text-matrix-text-dim">
        <p>Brak zdjęcia do restauracji</p>
        <button
          onClick={() => setCurrentView('upload')}
          className="btn-glow mt-4"
        >
          Wgraj zdjęcie
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Title */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-matrix-accent flex items-center gap-3">
            <Sparkles size={28} />
            {t('restore.title')}
          </h2>
          <p className="text-matrix-text-dim mt-1">
            Gotowy do restauracji: {currentPhoto.name}
          </p>
        </div>
        <ModelSelector />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isRestoring ? (
          <div className="space-y-6">
            <ProgressBar message={t('progress.restoring')} />
            <div className="glass-panel p-6 text-center">
              <Sparkles size={48} className="mx-auto mb-4 text-matrix-accent animate-pulse" />
              <p className="text-matrix-text-dim">AI pracuje nad Twoim zdjęciem...</p>
              <p className="text-sm text-matrix-text-dim mt-2">
                To może potrwać kilka sekund
              </p>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 space-y-6">
            {/* Preview */}
            <div className="flex gap-6">
              <div className="w-64 h-64 rounded-xl overflow-hidden">
                <img
                  src={currentPhoto.preview}
                  alt={currentPhoto.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-4">
                <h3 className="font-semibold text-lg">{currentPhoto.name}</h3>

                {currentAnalysis && (
                  <div className="space-y-2 text-sm text-matrix-text-dim">
                    <p>Poziom uszkodzeń: {Math.round(currentAnalysis.damage_score)}%</p>
                    <p>Wykryte problemy: {currentAnalysis.damage_types.length}</p>
                    <p>Provider: {currentAnalysis.provider_used}</p>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-matrix-accent/10 border border-matrix-accent/30">
                  <p className="text-sm">
                    AI automatycznie zastosuje najlepsze techniki restauracji
                    na podstawie przeprowadzonej analizy.
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {currentAnalysis && currentAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Zalecane działania:</h4>
                <ul className="space-y-2">
                  {currentAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-matrix-text-dim">
                      <span className="text-matrix-accent">✓</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isRestoring && (
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setCurrentView('analyze')}
            className="btn-secondary"
          >
            ← Wróć do analizy
          </button>

          <button
            onClick={handleRestore}
            disabled={!currentAnalysis}
            className="btn-glow flex items-center gap-2"
          >
            <Play size={18} />
            Rozpocznij restaurację
          </button>
        </div>
      )}
    </div>
  );
}
