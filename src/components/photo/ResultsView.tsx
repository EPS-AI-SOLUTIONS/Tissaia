// src/components/photo/ResultsView.tsx
/**
 * Restoration Results View - Tauri Edition
 * =========================================
 * Display and download restored photos.
 * Supports both single-photo (legacy) and multi-photo (pipeline) results.
 */

import { CheckCircle, Clock, Download, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useViewTheme } from '../../hooks';
import type { CroppedPhoto, RestorationResult, VerificationResult } from '../../hooks/api/types';
import { usePhotoStore } from '../../store/usePhotoStore';
import { useViewStore } from '../../store/useViewStore';
import PhotoPreview from '../ui/PhotoPreview';
import VerificationBadge from '../ui/VerificationBadge';

// ============================================
// SINGLE RESULT CARD
// ============================================

interface ResultCardProps {
  index: number;
  total: number;
  restoration: RestorationResult;
  croppedPhoto?: CroppedPhoto;
  theme: ReturnType<typeof useViewTheme>;
  cropVerification?: VerificationResult | null;
  restorationVerification?: VerificationResult | null;
}

function ResultCard({
  index,
  total,
  restoration,
  theme,
  cropVerification,
  restorationVerification,
}: ResultCardProps) {
  const handleDownload = () => {
    if (!restoration.restored_image) {
      toast.error('Brak zdjęcia do pobrania');
      return;
    }

    const link = document.createElement('a');
    link.href = `data:image/png;base64,${restoration.restored_image}`;
    link.download = `restored_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Pobrano zdjęcie ${index + 1}`);
  };

  return (
    <div className={`${theme.card} p-4 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${theme.title}`}>
          {total > 1 ? `Zdjęcie ${index + 1}/${total}` : 'Wynik restauracji'}
        </h3>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-matrix-accent/10 text-matrix-accent rounded-lg hover:bg-matrix-accent/20 transition-colors"
        >
          <Download size={14} />
          Pobierz
        </button>
      </div>

      {/* Before/After */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className={`text-xs mb-1.5 ${theme.textMuted}`}>Oryginał</p>
          <PhotoPreview
            src={`data:image/png;base64,${restoration.original_image}`}
            alt={`Original ${index + 1}`}
            variant="compare"
            className="bg-black/20"
          />
        </div>
        <div>
          <p className={`text-xs mb-1.5 ${theme.textMuted}`}>Po restauracji</p>
          <PhotoPreview
            src={`data:image/png;base64,${restoration.restored_image}`}
            alt={`Restored ${index + 1}`}
            variant="compare"
            className="bg-black/20"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className={`p-2 rounded-lg ${theme.accentBg}`}>
          <div className={`text-lg font-bold ${theme.textAccent}`}>
            {restoration.improvements.length}
          </div>
          <div className={`text-[10px] ${theme.textMuted}`}>Ulepszeń</div>
        </div>
        <div className={`p-2 rounded-lg ${theme.accentBg}`}>
          <div className={`text-lg font-bold ${theme.textAccent}`}>
            {(restoration.processing_time_ms / 1000).toFixed(1)}s
          </div>
          <div className={`text-[10px] ${theme.textMuted}`}>Czas</div>
        </div>
      </div>

      {/* Improvements */}
      {restoration.improvements.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {restoration.improvements.map((imp) => (
            <span key={imp} className={`text-xs ${theme.badge}`}>
              {imp}
            </span>
          ))}
        </div>
      )}

      {/* Verification badges */}
      {(cropVerification || restorationVerification) && (
        <div className="space-y-2">
          {cropVerification && <VerificationBadge result={cropVerification} />}
          {restorationVerification && <VerificationBadge result={restorationVerification} />}
        </div>
      )}
    </div>
  );
}

// ============================================
// RESULTS VIEW
// ============================================

export default function ResultsView() {
  const { t } = useTranslation();
  const setCurrentView = useViewStore((s) => s.setCurrentView);
  const photos = usePhotoStore((s) => s.photos);
  const pipelineResults = usePhotoStore((s) => s.pipelineResults);
  const rawCroppedPhotos = usePhotoStore((s) => s.croppedPhotos);
  const croppedPhotos = rawCroppedPhotos as CroppedPhoto[];
  const theme = useViewTheme();

  const verificationResults = usePhotoStore((s) => s.verificationResults);

  // Legacy single result
  const legacyResult = usePhotoStore((s) => s.restorationResult as RestorationResult | undefined);

  const pipelineEntries = Object.entries(pipelineResults);
  const hasPipelineResults = pipelineEntries.length > 0;
  const hasLegacyResult = !!legacyResult;

  const handleDownloadAll = () => {
    pipelineEntries.forEach(([, entry], idx) => {
      const r = entry.restoration as RestorationResult;
      if (!r?.restored_image) return;

      const link = document.createElement('a');
      link.href = `data:image/png;base64,${r.restored_image}`;
      link.download = `restored_${idx + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    toast.success('Pobrano wszystkie zdjęcia!');
  };

  const handleNewPhoto = () => {
    usePhotoStore.setState({
      photos: [],
      restorationResult: null,
    });
    usePhotoStore.getState().clearPipelineResults();
    usePhotoStore.getState().clearVerificationResults();
    setCurrentView('upload');
  };

  // Empty state
  if (!hasPipelineResults && !hasLegacyResult) {
    return (
      <div className="p-6 text-center text-matrix-text-dim">
        <p>Brak wyników restauracji</p>
        <button type="button" onClick={() => setCurrentView('upload')} className="btn-glow mt-4">
          Wgraj zdjęcie
        </button>
      </div>
    );
  }

  // Legacy single-photo view
  if (hasLegacyResult && !hasPipelineResults) {
    const result = legacyResult;
    const currentPhoto = photos[0];

    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.accentBg}`}>
              <CheckCircle className={theme.iconAccent} size={24} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${theme.textAccent}`}>{t('results.title')}</h2>
              <p className={theme.textMuted}>Restauracja zakończona pomyślnie</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewPhoto}
              className={`${theme.btnSecondary} px-4 py-2 flex items-center gap-2`}
            >
              <RotateCcw size={16} />
              Nowe zdjęcie
            </button>
            <button
              type="button"
              onClick={() => {
                const link = document.createElement('a');
                link.href = `data:image/png;base64,${result.restored_image}`;
                link.download = `restored_${currentPhoto?.name || 'photo'}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Pobrano zdjęcie!');
              }}
              className="btn-glow px-4 py-2 flex items-center gap-2"
            >
              <Download size={16} />
              Pobierz
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className={`${theme.card} p-6`}>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className={`font-semibold mb-3 ${theme.title}`}>Oryginał</h3>
                {currentPhoto && (
                  <PhotoPreview
                    src={currentPhoto.preview}
                    alt="Original"
                    variant="compare"
                    rounded="rounded-xl"
                    loading="eager"
                    className="bg-black/20"
                  />
                )}
              </div>
              <div>
                <h3 className={`font-semibold mb-3 ${theme.title}`}>Po restauracji</h3>
                <PhotoPreview
                  src={`data:image/png;base64,${result.restored_image}`}
                  alt="Restored"
                  variant="compare"
                  rounded="rounded-xl"
                  loading="eager"
                  className="bg-black/20"
                />
              </div>
            </div>

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
                  <span className="text-sm">{new Date(result.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className={`text-xs ${theme.textMuted}`}>Zakończono</div>
              </div>
            </div>

            {result.improvements.length > 0 && (
              <div className="mt-6">
                <h4 className={`font-semibold mb-3 ${theme.title}`}>Zastosowane ulepszenia:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.improvements.map((imp) => (
                    <span key={imp} className={theme.badge}>
                      {imp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verification badge (legacy single photo) */}
            {verificationResults['restoration_single'] && (
              <div className="mt-6">
                <VerificationBadge result={verificationResults['restoration_single']} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Multi-photo pipeline results
  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.accentBg}`}>
            <CheckCircle className={theme.iconAccent} size={24} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${theme.textAccent}`}>{t('results.title')}</h2>
            <p className={theme.textMuted}>Przetworzono {pipelineEntries.length} zdjęć</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewPhoto}
            className={`${theme.btnSecondary} px-4 py-2 flex items-center gap-2`}
          >
            <RotateCcw size={16} />
            Nowe zdjęcie
          </button>
          {pipelineEntries.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              className="btn-glow px-4 py-2 flex items-center gap-2"
            >
              <Download size={16} />
              Pobierz wszystkie
            </button>
          )}
        </div>
      </div>

      {/* Grid of results */}
      <div className="flex-1 overflow-y-auto">
        <div
          className={`grid gap-6 ${pipelineEntries.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-2 xl:grid-cols-3'}`}
        >
          {pipelineEntries.map(([photoId, entry], idx) => {
            const cropped = croppedPhotos.find((p) => p.id === photoId);
            return (
              <ResultCard
                key={photoId}
                index={idx}
                total={pipelineEntries.length}
                restoration={entry.restoration as RestorationResult}
                croppedPhoto={cropped}
                theme={theme}
                cropVerification={verificationResults[`crop_${photoId}`] ?? null}
                restorationVerification={verificationResults[`restoration_${photoId}`] ?? null}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
