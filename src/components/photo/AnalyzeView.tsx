// src/components/photo/AnalyzeView.tsx
/**
 * Photo Analysis View - Tauri Edition
 * ====================================
 * AI-powered photo analysis with damage detection.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Scan,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { useAnalyzeImage, type AnalysisResult, type DamageType } from '../../hooks/useApi';
import AnalysisProgressBar from '../ui/AnalysisProgressBar';
import ModelSelector from '../ui/ModelSelector';

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
        <div className="w-48 h-48 photo-preview flex-shrink-0 rounded-xl overflow-hidden">
          <img
            src={photoPreview}
            alt={photoName}
            className="w-full h-full object-cover"
          />
        </div>

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
            {analysis.damage_types.map((damage, idx) => (
              <DamageCard key={idx} damage={damage} />
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
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-matrix-text-dim">
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
  const { photos, setCurrentView, setIsLoading, setProgressMessage } = useAppStore();
  const analyzeMutation = useAnalyzeImage();

  const [analyses, setAnalyses] = useState<Map<string, AnalysisResult>>(new Map());
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Redirect if no photos
  useEffect(() => {
    if (photos.length === 0) {
      setCurrentView('upload');
    }
  }, [photos, setCurrentView]);

  const runAnalysis = useCallback(async (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;

    setIsLoading(true);
    setProgressMessage(t('progress.analyzing'));

    try {
      const result = await analyzeMutation.mutateAsync({ file: photo.file });
      setAnalyses((prev) => new Map(prev).set(photoId, result));
      toast.success(`Analiza zakończona: ${photo.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Błąd analizy';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  }, [photos, setIsLoading, setProgressMessage, t, analyzeMutation]);

  // Track if we've already auto-analyzed to prevent re-running
  const hasAutoAnalyzed = useRef(false);

  // Auto-analyze first photo (only once when photos are first loaded)
  useEffect(() => {
    if (photos.length > 0 && !hasAutoAnalyzed.current) {
      const firstPhoto = photos[0];
      if (!analyses.has(firstPhoto.id) && !analyzeMutation.isPending) {
        hasAutoAnalyzed.current = true;
        runAnalysis(firstPhoto.id);
      }
    }
  }, [photos, analyses, analyzeMutation.isPending, runAnalysis]);

  // Navigate to restoration
  const goToRestore = () => {
    const photo = photos[currentPhotoIndex];
    const analysis = analyses.get(photo?.id);

    if (photo && analysis) {
      // Store analysis for restoration view
      useAppStore.setState({
        currentAnalysis: analysis,
      });
      setCurrentView('restore');
    }
  };

  // Current photo
  const currentPhoto = photos[currentPhotoIndex];
  const currentAnalysis = currentPhoto ? analyses.get(currentPhoto.id) : null;

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
        {analyzeMutation.isPending ? (
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
              onClick={() => {
                setCurrentPhotoIndex(idx);
                if (!analyses.has(photo.id)) {
                  runAnalysis(photo.id);
                }
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentPhotoIndex
                  ? 'border-matrix-accent'
                  : 'border-matrix-border hover:border-matrix-accent/50'
              }`}
            >
              <img
                src={photo.preview}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {currentAnalysis && (
          <button onClick={goToRestore} className="btn-glow flex items-center gap-2">
            Przejdź do restauracji
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
