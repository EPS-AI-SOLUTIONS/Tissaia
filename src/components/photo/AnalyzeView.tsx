// src/components/photo/AnalyzeView.tsx
/**
 * Photo Analysis View - Tauri Edition
 * ====================================
 * AI-powered photo analysis with damage detection.
 */

import { AlertTriangle, CheckCircle, Scan } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MOCK_ANALYSIS_DELAY, mockAnalysisResult } from '../../hooks/api/mocks';
import type { AnalysisResult, DamageType } from '../../hooks/api/types';
import { delay, fileToBase64, safeInvoke } from '../../hooks/api/utils';
import { usePhotoStore } from '../../store/usePhotoStore';
import { useViewStore } from '../../store/useViewStore';
import { isTauri } from '../../utils/tauri';
import AnalysisProgressBar from '../ui/AnalysisProgressBar';
import ModelSelector from '../ui/ModelSelector';
import PhotoPreview from '../ui/PhotoPreview';

// ============================================
// DAMAGE TYPE CARD
// ============================================

function DamageCard({ damage }: { damage: DamageType }) {
  const severityColors = {
    low: 'bg-green-500/10 border-green-500/30 text-green-400',
    medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    high: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    critical: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[damage.severity]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium capitalize">{damage.name}</span>
        <span className="text-xs opacity-75">{damage.area_percentage.toFixed(0)}%</span>
      </div>
      <p className="text-xs opacity-75">{damage.description}</p>
    </div>
  );
}

// ============================================
// ANALYSIS RESULT CARD
// ============================================

interface AnalysisCardProps {
  analysis: AnalysisResult;
  photoPreview: string;
  photoName: string;
}

function AnalysisCard({ analysis, photoPreview, photoName }: AnalysisCardProps) {
  const { t } = useTranslation();

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Photo Preview */}
      <div className="flex gap-6">
        <PhotoPreview
          src={photoPreview}
          alt={photoName}
          variant="large"
          className="photo-preview flex-shrink-0"
        />

        <div className="flex-1 space-y-4">
          <h3 className="font-semibold text-lg truncate">{photoName}</h3>

          {/* Overall Score */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-matrix-bg-secondary">
            <AlertTriangle
              className={analysis.damage_score > 50 ? 'text-red-400' : 'text-yellow-400'}
              size={32}
            />
            <div>
              <div className="text-3xl font-bold">{Math.round(analysis.damage_score)}%</div>
              <div className="text-xs text-matrix-text-dim">{t('analyze.damage')}</div>
            </div>
          </div>

          {/* Provider */}
          <div className="text-sm text-matrix-text-dim">
            Provider: <span className="badge-matrix">{analysis.provider_used}</span>
          </div>
        </div>
      </div>

      {/* Damage Types */}
      {analysis.damage_types.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" />
            Wykryte uszkodzenia
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.damage_types.map((damage) => (
              <DamageCard key={damage.name} damage={damage} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            {t('analyze.recommendations')}
          </h4>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec) => (
              <li key={rec} className="flex items-start gap-2 text-sm text-matrix-text-dim">
                <span className="text-matrix-accent">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================
// ANALYZE VIEW COMPONENT
// ============================================

export default function AnalyzeView() {
  const { t } = useTranslation();
  const setCurrentView = useViewStore((s) => s.setCurrentView);
  const setIsLoading = useViewStore((s) => s.setIsLoading);
  const setProgressMessage = useViewStore((s) => s.setProgressMessage);
  const photos = usePhotoStore((s) => s.photos);

  // Store analyses by photo ID — persists across re-renders
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Redirect if no photos
  useEffect(() => {
    if (photos.length === 0) {
      setCurrentView('upload');
    }
  }, [photos, setCurrentView]);

  // Prevent duplicate analysis calls
  const analyzingRef = useRef(false);
  const autoNavTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup auto-navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (autoNavTimeoutRef.current) {
        clearTimeout(autoNavTimeoutRef.current);
      }
    };
  }, []);

  const runAnalysis = useCallback(
    async (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo || analyzingRef.current) return;

      analyzingRef.current = true;
      setIsAnalyzing(true);
      setIsLoading(true);
      setProgressMessage(t('progress.analyzing'));

      try {
        let result: AnalysisResult;

        if (!isTauri()) {
          // Browser mode: use mock data
          console.log('[AnalyzeView] Browser mode - using mock analysis');
          await delay(MOCK_ANALYSIS_DELAY);
          result = {
            ...mockAnalysisResult,
            id: `mock-${Date.now()}`,
            timestamp: new Date().toISOString(),
          };
        } else {
          const { base64, mimeType } = await fileToBase64(photo.file);
          console.log('[AnalyzeView] Calling analyze_image...');
          result = await safeInvoke<AnalysisResult>('analyze_image', {
            imageBase64: base64,
            mimeType,
          });
        }

        console.log('[AnalyzeView] Result:', result);

        if (result && result.damage_score !== undefined) {
          setAnalyses((prev) => ({ ...prev, [photoId]: result }));
          toast.success(`Analiza zakończona: ${photo.name}`);

          // Auto-navigate to restore after successful analysis
          usePhotoStore.setState({ currentAnalysis: result });
          autoNavTimeoutRef.current = setTimeout(() => setCurrentView('restore'), 1000);
        } else {
          console.error('[AnalyzeView] Invalid result:', result);
          toast.error('Analiza zwróciła nieprawidłowy wynik');
        }
      } catch (error) {
        console.error('[AnalyzeView] Analysis error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Błąd analizy';
        toast.error(errorMessage);
      } finally {
        analyzingRef.current = false;
        setIsAnalyzing(false);
        setIsLoading(false);
        setProgressMessage('');
      }
    },
    [photos, setIsLoading, setProgressMessage, t, setCurrentView],
  );

  // Track if we've already auto-analyzed to prevent re-running
  const hasAutoAnalyzed = useRef(false);

  // Auto-analyze first photo (only once)
  useEffect(() => {
    if (photos.length > 0 && !hasAutoAnalyzed.current && !analyzingRef.current) {
      const firstPhoto = photos[0];
      if (!analyses[firstPhoto.id]) {
        hasAutoAnalyzed.current = true;
        runAnalysis(firstPhoto.id);
      }
    }
  }, [photos, analyses, runAnalysis]);

  // Current photo
  const currentPhoto = photos[currentPhotoIndex];
  const currentAnalysis = currentPhoto ? (analyses[currentPhoto.id] ?? null) : null;

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Title */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-matrix-accent">{t('analyze.title')}</h2>
          <p className="text-matrix-text-dim mt-1">
            Zdjęcie {currentPhotoIndex + 1} z {photos.length}
          </p>
        </div>
        <ModelSelector />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isAnalyzing ? (
          <AnalysisProgressBar isAnalyzing={true} />
        ) : currentAnalysis ? (
          <AnalysisCard
            analysis={currentAnalysis}
            photoPreview={currentPhoto.preview}
            photoName={currentPhoto.name}
          />
        ) : (
          <div className="text-center py-12 text-matrix-text-dim">
            <Scan size={48} className="mx-auto mb-4 opacity-50" />
            <p>Brak wyników analizy</p>
            <button
              type="button"
              onClick={() => runAnalysis(currentPhoto.id)}
              className="btn-glow mt-4"
            >
              Rozpocznij analizę
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => {
                setCurrentPhotoIndex(idx);
                if (!analyses[photo.id] && !analyzingRef.current) {
                  runAnalysis(photo.id);
                }
              }}
              className="transition-all"
            >
              <PhotoPreview
                src={photo.preview}
                alt={photo.name}
                variant="thumbnail"
                active={idx === currentPhotoIndex}
              />
            </button>
          ))}
        </div>

        {currentAnalysis && (
          <span className="text-sm text-matrix-text-dim animate-pulse">
            Automatyczne przejście do restauracji...
          </span>
        )}
      </div>
    </div>
  );
}
