// src/components/photo/ResultsView.tsx
/**
 * Restoration Results View — v4.0 Web Edition
 * =============================================
 * Display and download restored photos.
 * Supports both single-photo (legacy) and multi-photo (pipeline) results.
 * Browser-only download (no native dialogs).
 */

import { CheckCircle, Clock, Download, FolderOpen, RotateCcw, RotateCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useViewTheme } from '../../hooks';
import type { CroppedPhoto, RestorationResult, VerificationResult } from '../../hooks/api/types';
import { apiPost } from '../../hooks/api/utils';
import { usePhotoStore } from '../../store/usePhotoStore';
import { useViewStore } from '../../store/useViewStore';
import VerificationBadge from '../ui/VerificationBadge';

// ============================================
// SAVE IMAGE UTILITY (browser download)
// ============================================

async function saveImageWithDialog(base64: string, defaultName: string): Promise<string | null> {
  // Browser download via data URL
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64}`;
  link.download = defaultName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return defaultName;
}

// ============================================
// ROTATION UTILITY
// ============================================

/**
 * Rotate a base64 image by the given degrees.
 * Tries backend first, falls back to Canvas API for instant client-side rotation.
 */
async function rotateBase64Image(
  base64: string,
  degrees: number,
  mimeType: string = 'image/png',
): Promise<string> {
  // Try backend rotation first
  try {
    return await apiPost<string>('/api/rotate', {
      image_base64: base64,
      mime_type: mimeType,
      degrees,
    });
  } catch {
    // Fallback: Canvas rotation (client-side, instant)
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const normalized = ((degrees % 360) + 360) % 360;
      const swap = normalized === 90 || normalized === 270;
      const w = swap ? img.height : img.width;
      const h = swap ? img.width : img.height;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.translate(w / 2, h / 2);
      ctx.rotate((normalized * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const dataUrl = canvas.toDataURL(mimeType);
      resolve(dataUrl.split(',')[1] || dataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

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
  onImageRotated?: (index: number, newBase64: string) => void;
}

function ResultCard({
  index,
  total,
  restoration,
  theme,
  cropVerification,
  restorationVerification,
  onImageRotated,
}: ResultCardProps) {
  const [isRotating, setIsRotating] = useState(false);

  const handleDownload = async () => {
    if (!restoration.restored_image) {
      toast.error('Brak zdjęcia do pobrania');
      return;
    }

    try {
      const savedPath = await saveImageWithDialog(
        restoration.restored_image,
        `restored_${index + 1}.png`,
      );
      if (savedPath) {
        toast.success(
          <div className="flex items-center gap-2">
            <FolderOpen size={14} />
            <span>Zapisano: {savedPath}</span>
          </div>,
        );
      }
    } catch (err) {
      console.error('[ResultCard] Save error:', err);
      toast.error('Błąd zapisu zdjęcia');
    }
  };

  const handleRotate = useCallback(
    async (degrees: number) => {
      if (!restoration.restored_image || isRotating) return;
      setIsRotating(true);
      try {
        const rotated = await rotateBase64Image(restoration.restored_image, degrees);
        onImageRotated?.(index, rotated);
      } catch (err) {
        toast.error('Błąd obrotu zdjęcia');
        console.error('[ResultCard] Rotation error:', err);
      } finally {
        setIsRotating(false);
      }
    },
    [restoration.restored_image, isRotating, index, onImageRotated],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${theme.title}`}>
          {total > 1 ? `Zdjęcie ${index + 1}/${total}` : 'Wynik restauracji'}
        </h3>
        <div className="flex items-center gap-1">
          {/* Rotation buttons */}
          <button
            type="button"
            onClick={() => handleRotate(270)}
            disabled={isRotating}
            title="Obróć w lewo (90°)"
            className={`p-2 ${theme.iconMuted} hover:${theme.isLight ? 'text-emerald-600' : 'text-white'} rounded-lg ${theme.isLight ? 'hover:bg-emerald-500/10' : 'hover:bg-white/10'} transition-colors disabled:opacity-50`}
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleRotate(90)}
            disabled={isRotating}
            title="Obróć w prawo (90°)"
            className={`p-2 ${theme.iconMuted} hover:${theme.isLight ? 'text-emerald-600' : 'text-white'} rounded-lg ${theme.isLight ? 'hover:bg-emerald-500/10' : 'hover:bg-white/10'} transition-colors disabled:opacity-50`}
          >
            <RotateCw size={16} />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm ${theme.accentBg} ${theme.textAccent} rounded-lg ${theme.isLight ? 'hover:bg-emerald-500/20' : 'hover:bg-white/20'} transition-colors`}
          >
            <Download size={16} />
            Pobierz
          </button>
        </div>
      </div>

      {/* Before/After */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className={`text-sm mb-2 ${theme.textMuted}`}>Oryginał</p>
          <img
            src={`data:image/png;base64,${restoration.original_image}`}
            alt={`Original ${index + 1}`}
            className="w-full h-auto"
          />
        </div>
        <div>
          <p className={`text-sm mb-2 ${theme.textMuted}`}>Po restauracji</p>
          <img
            src={`data:image/png;base64,${restoration.restored_image}`}
            alt={`Restored ${index + 1}`}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className={`p-3 rounded-lg ${theme.accentBg}`}>
          <div className={`text-xl font-bold ${theme.textAccent}`}>
            {restoration.improvements.length}
          </div>
          <div className={`text-xs ${theme.textMuted}`}>Ulepszeń</div>
        </div>
        <div className={`p-3 rounded-lg ${theme.accentBg}`}>
          <div className={`text-xl font-bold ${theme.textAccent}`}>
            {(restoration.processing_time_ms / 1000).toFixed(1)}s
          </div>
          <div className={`text-xs ${theme.textMuted}`}>Czas</div>
        </div>
      </div>

      {/* Improvements */}
      {restoration.improvements.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {restoration.improvements.map((imp) => (
            <span key={imp} className={`text-sm ${theme.badge}`}>
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
// LEGACY ROTATE BUTTON
// ============================================

function LegacyRotateButton({
  degrees,
  image,
  onRotated,
  theme,
  children,
}: {
  degrees: number;
  image: string;
  onRotated: (idx: number, base64: string) => void;
  theme: ReturnType<typeof useViewTheme>;
  children: React.ReactNode;
}) {
  const [rotating, setRotating] = useState(false);
  return (
    <button
      type="button"
      disabled={rotating}
      title={degrees === 90 ? 'Obróć w prawo (90°)' : 'Obróć w lewo (90°)'}
      className={`${theme.btnSecondary} p-2 disabled:opacity-50`}
      onClick={async () => {
        setRotating(true);
        try {
          const rotated = await rotateBase64Image(image, degrees);
          onRotated(0, rotated);
        } catch {
          /* ignore */
        }
        setRotating(false);
      }}
    >
      {children}
    </button>
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
  const setPipelineResult = usePhotoStore((s) => s.setPipelineResult);
  const croppedPhotos = usePhotoStore((s) => s.croppedPhotos);
  const theme = useViewTheme();

  const verificationResults = usePhotoStore((s) => s.verificationResults);

  // Legacy single result
  const legacyResult = usePhotoStore((s) => s.restorationResult) ?? undefined;

  const pipelineEntries = Object.entries(pipelineResults);
  const hasPipelineResults = pipelineEntries.length > 0;
  const hasLegacyResult = !!legacyResult;

  // Handle manual rotation — update restored_image in store
  const handleImageRotated = useCallback(
    (idx: number, newBase64: string) => {
      const currentEntries = Object.entries(usePhotoStore.getState().pipelineResults);
      const entry = currentEntries[idx];
      if (!entry) return;
      const [photoId, data] = entry;
      const oldRestoration = data.restoration as RestorationResult;
      setPipelineResult(photoId, { ...oldRestoration, restored_image: newBase64 });
      toast.success(`Obrócono zdjęcie ${idx + 1}`);
    },
    [setPipelineResult],
  );

  // Handle legacy single-photo rotation
  const handleLegacyRotated = useCallback(
    (_idx: number, newBase64: string) => {
      if (!legacyResult) return;
      usePhotoStore.setState({
        restorationResult: { ...legacyResult, restored_image: newBase64 },
      });
      toast.success('Obrócono zdjęcie');
    },
    [legacyResult],
  );

  const handleDownloadAll = async () => {
    let savedCount = 0;
    let lastDir = '';

    for (const [, entry] of pipelineEntries) {
      const r = entry.restoration as RestorationResult;
      if (!r?.restored_image) continue;

      try {
        const savedPath = await saveImageWithDialog(
          r.restored_image,
          `restored_${savedCount + 1}.png`,
        );
        if (savedPath) {
          savedCount++;
          // Extract directory from saved path
          const sep = savedPath.includes('\\') ? '\\' : '/';
          lastDir = savedPath.substring(0, savedPath.lastIndexOf(sep));
        } else {
          // User cancelled — stop asking for more
          break;
        }
      } catch (err) {
        console.error('[ResultsView] Save error:', err);
        toast.error(`Błąd zapisu zdjęcia ${savedCount + 1}`);
      }
    }

    if (savedCount > 0) {
      toast.success(
        <div className="flex items-center gap-2">
          <FolderOpen size={14} />
          <span>
            Zapisano {savedCount} zdjęć w: {lastDir}
          </span>
        </div>,
      );
    }
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
      <div className={`p-6 text-center ${theme.textMuted}`}>
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
              <p className={`text-base ${theme.textMuted}`}>Restauracja zakończona pomyślnie</p>
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
            <LegacyRotateButton
              degrees={270}
              image={result.restored_image}
              onRotated={handleLegacyRotated}
              theme={theme}
            >
              <RotateCcw size={16} />
            </LegacyRotateButton>
            <LegacyRotateButton
              degrees={90}
              image={result.restored_image}
              onRotated={handleLegacyRotated}
              theme={theme}
            >
              <RotateCw size={16} />
            </LegacyRotateButton>
            <button
              type="button"
              onClick={async () => {
                try {
                  const savedPath = await saveImageWithDialog(
                    result.restored_image,
                    `restored_${currentPhoto?.name || 'photo'}.png`,
                  );
                  if (savedPath) {
                    toast.success(
                      <div className="flex items-center gap-2">
                        <FolderOpen size={14} />
                        <span>Zapisano: {savedPath}</span>
                      </div>,
                    );
                  }
                } catch (err) {
                  console.error('[ResultsView] Save error:', err);
                  toast.error('Błąd zapisu zdjęcia');
                }
              }}
              className="btn-glow px-4 py-2 flex items-center gap-2"
            >
              <Download size={16} />
              Pobierz
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${theme.title}`}>Oryginał</h3>
                {currentPhoto && (
                  <img src={currentPhoto.preview} alt="Original" className="w-full h-auto" />
                )}
              </div>
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${theme.title}`}>Po restauracji</h3>
                <img
                  src={`data:image/png;base64,${result.restored_image}`}
                  alt="Restored"
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${theme.accentBg}`}>
                <div className={`text-2xl font-bold ${theme.textAccent}`}>
                  {result.improvements.length}
                </div>
                <div className={`text-sm ${theme.textMuted}`}>Ulepszeń</div>
              </div>
              <div className={`p-4 rounded-lg ${theme.accentBg}`}>
                <div className={`text-2xl font-bold ${theme.textAccent}`}>
                  {(result.processing_time_ms / 1000).toFixed(1)}s
                </div>
                <div className={`text-sm ${theme.textMuted}`}>Czas</div>
              </div>
              <div className={`p-4 rounded-lg ${theme.accentBg}`}>
                <div className={`text-2xl font-bold ${theme.textAccent} capitalize`}>
                  {result.provider_used}
                </div>
                <div className={`text-sm ${theme.textMuted}`}>Provider</div>
              </div>
              <div className={`p-4 rounded-lg ${theme.accentBg}`}>
                <div className={`flex items-center gap-1 ${theme.textAccent}`}>
                  <Clock size={20} />
                  <span className="text-base">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={`text-sm ${theme.textMuted}`}>Zakończono</div>
              </div>
            </div>

            {result.improvements.length > 0 && (
              <div className="mt-6">
                <h4 className={`text-base font-semibold mb-3 ${theme.title}`}>
                  Zastosowane ulepszenia:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.improvements.map((imp) => (
                    <span key={imp} className={`text-sm ${theme.badge}`}>
                      {imp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verification badge (legacy single photo) */}
            {verificationResults.restoration_single && (
              <div className="mt-6">
                <VerificationBadge result={verificationResults.restoration_single} />
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
            <p className={`text-base ${theme.textMuted}`}>
              Przetworzono {pipelineEntries.length} zdjęć
            </p>
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

      {/* Pipeline Report summary */}
      {croppedPhotos.length > 0 && (
        <div className={`mb-4 p-3 rounded-xl ${theme.glassPanel} flex items-center gap-6`}>
          <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>
            Pipeline Report
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${theme.textAccent}`}>
                {croppedPhotos.length}
              </span>
              <span className={`text-xs ${theme.textMuted}`}>wykrytych</span>
            </div>
            <div className={`w-px h-4 ${theme.isLight ? 'bg-slate-300/50' : 'bg-white/10'}`} />
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${theme.textAccent}`}>
                {pipelineEntries.length}
              </span>
              <span className={`text-xs ${theme.textMuted}`}>przywróconych</span>
            </div>
            <div className={`w-px h-4 ${theme.isLight ? 'bg-slate-300/50' : 'bg-white/10'}`} />
            <div className="flex items-center gap-1.5">
              <CheckCircle
                size={14}
                className={
                  pipelineEntries.length === croppedPhotos.length
                    ? theme.iconAccent
                    : theme.iconMuted
                }
              />
              <span className={`text-xs ${theme.textMuted}`}>
                {pipelineEntries.length === croppedPhotos.length
                  ? 'Kompletne'
                  : `${croppedPhotos.length - pipelineEntries.length} w trakcie`}
              </span>
            </div>
          </div>
        </div>
      )}

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
                onImageRotated={handleImageRotated}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
