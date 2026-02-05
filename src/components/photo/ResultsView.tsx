// src/components/photo/ResultsView.tsx
/**
 * Restoration Results View - Tauri Edition
 * =========================================
 * Display and download restored photos.
 */
import { useTranslation } from 'react-i18next';
import { Download, RotateCcw, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { type RestorationResult } from '../../hooks/useApi';
import { useViewTheme } from '../../hooks';

export default function ResultsView() {
  const { t } = useTranslation();
  const { photos, setCurrentView } = useAppStore();
  const theme = useViewTheme();

  // Get restoration result from store
  const result = useAppStore((state) => (state as { restorationResult?: RestorationResult }).restorationResult);
  const currentPhoto = photos[0];

  const handleDownload = () => {
    if (!result?.restored_image) {
      toast.error('Brak zdjęcia do pobrania');
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${result.restored_image}`;
    link.download = `restored_${currentPhoto?.name || 'photo'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Pobrano zdjęcie!');
  };

  const handleNewPhoto = () => {
    // Clear state and go to upload
    useAppStore.setState({
      photos: [],
      currentAnalysis: undefined,
      restorationResult: undefined,
    });
    setCurrentView('upload');
  };

  if (!result) {
    return (
      <div className="p-6 text-center text-matrix-text-dim">
        <p>Brak wyników restauracji</p>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.accentBg}`}>
            <CheckCircle className={theme.iconAccent} size={24} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${theme.textAccent}`}>
              {t('results.title')}
            </h2>
            <p className={theme.textMuted}>
              Restauracja zakończona pomyślnie
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewPhoto}
            className={theme.btnSecondary + ' px-4 py-2 flex items-center gap-2'}
          >
            <RotateCcw size={16} />
            Nowe zdjęcie
          </button>
          <button
            onClick={handleDownload}
            className="btn-glow px-4 py-2 flex items-center gap-2"
          >
            <Download size={16} />
            Pobierz
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={`${theme.card} p-6`}>
          {/* Before/After Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Original */}
            <div>
              <h3 className={`font-semibold mb-3 ${theme.title}`}>Oryginał</h3>
              <div className="aspect-square rounded-xl overflow-hidden bg-black/20">
                {currentPhoto && (
                  <img
                    src={currentPhoto.preview}
                    alt="Original"
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                )}
              </div>
            </div>

            {/* Restored */}
            <div>
              <h3 className={`font-semibold mb-3 ${theme.title}`}>Po restauracji</h3>
              <div className="aspect-square rounded-xl overflow-hidden bg-black/20">
                <img
                  src={`data:image/png;base64,${result.restored_image}`}
                  alt="Restored"
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${theme.accentBg}`}>
              <div className={`text-2xl font-bold ${theme.textAccent}`}>
                {result.improvements.length}
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Ulepszeń</div>
            </div>

            <div className={`p-4 rounded-lg ${theme.accentBg}`}>
              <div className={`text-2xl font-bold ${theme.textAccent}`}>
                {(result.processing_time_ms / 1000).toFixed(1)}s
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Czas</div>
            </div>

            <div className={`p-4 rounded-lg ${theme.accentBg}`}>
              <div className={`text-2xl font-bold ${theme.textAccent} capitalize`}>
                {result.provider_used}
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Provider</div>
            </div>

            <div className={`p-4 rounded-lg ${theme.accentBg}`}>
              <div className={`flex items-center gap-1 ${theme.textAccent}`}>
                <Clock size={20} />
                <span className="text-sm">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Zakończono</div>
            </div>
          </div>

          {/* Improvements List */}
          {result.improvements.length > 0 && (
            <div className="mt-6">
              <h4 className={`font-semibold mb-3 ${theme.title}`}>
                Zastosowane ulepszenia:
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.improvements.map((imp, idx) => (
                  <span key={idx} className={theme.badge}>
                    {imp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
