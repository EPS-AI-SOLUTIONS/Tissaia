// src/components/photo/CropView.tsx
/**
 * Photo Separation View
 * =====================
 * AI-powered detection and separation of individual photos from scans.
 * After separation, automatically runs the full pipeline (analysis + restoration).
 *
 * Uses the TissaiaPipeline orchestrator via usePipeline hook for:
 * - 4-stage processing (Ingestion → Detection → SmartCrop → Alchemy)
 * - Pause/Resume/Cancel
 * - Real-time progress with ETA
 * - Per-photo retry with exponential backoff
 */

import { ArrowRight, Loader2, Pause, Play, Scan, Scissors, SkipForward, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { BoundingBox } from '../../hooks/api/types';
import { useDetectPhotos } from '../../hooks/api/useCrop';
import { useVerifyDetection } from '../../hooks/api/useVerification';
import { fileToBase64 } from '../../hooks/api/utils';
import { usePipeline } from '../../hooks/usePipeline';
import { useViewTheme } from '../../hooks/useViewTheme';
import { usePhotoStore } from '../../store/usePhotoStore';
import { useViewStore } from '../../store/useViewStore';
import VerificationBadge from '../ui/VerificationBadge';

// ============================================
// BOUNDING BOX OVERLAY
// ============================================

interface BoxOverlayProps {
  box: BoundingBox;
  index: number;
  onRemove: (index: number) => void;
}

function BoxOverlay({ box, index, onRemove }: BoxOverlayProps) {
  const left = `${box.x / 10}%`;
  const top = `${box.y / 10}%`;
  const width = `${box.width / 10}%`;
  const height = `${box.height / 10}%`;

  return (
    <div
      className="absolute border-2 border-white/70 bg-white/10 group cursor-pointer hover:bg-white/20 transition-all"
      style={{ left, top, width, height }}
    >
      <div className="absolute -top-6 left-0 bg-white text-black text-xs font-bold px-2 py-0.5 rounded-t whitespace-nowrap">
        #{index + 1}
        {box.confidence < 0.8 && ' ?'}
        <span className="ml-1 font-normal opacity-60">
          ({box.x},{box.y} {box.width}x{box.height})
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ============================================
// SCAN PREVIEW WITH ACCURATE BOUNDING BOXES
// ============================================
// Measures the actual rendered image size to position boxes correctly.
// Without this, object-contain causes the <img> HTML box to be larger
// than the visible image, making percentage-based overlays inaccurate.

interface ScanPreviewWithBoxesProps {
  src: string;
  alt: string;
  boxes: BoundingBox[];
  isDetecting: boolean;
  onRemoveBox: (index: number) => void;
  theme: ReturnType<typeof useViewTheme>;
}

function ScanPreviewWithBoxes({
  src,
  alt,
  boxes,
  isDetecting,
  onRemoveBox,
  theme,
}: ScanPreviewWithBoxesProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState<{
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const updateSize = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;

    const containerW = img.clientWidth;
    const containerH = img.clientHeight;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    // Calculate rendered size with object-contain
    const scale = Math.min(containerW / natW, containerH / natH);
    const renderedW = natW * scale;
    const renderedH = natH * scale;
    const offsetX = (containerW - renderedW) / 2;
    const offsetY = (containerH - renderedH) / 2;

    setImgSize({ width: renderedW, height: renderedH, offsetX, offsetY });
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    img.addEventListener('load', updateSize);
    const observer = new ResizeObserver(updateSize);
    observer.observe(img);

    // If already loaded (cached), measure now
    if (img.complete) updateSize();

    return () => {
      img.removeEventListener('load', updateSize);
      observer.disconnect();
    };
  }, [updateSize]);

  return (
    <div className="relative inline-block max-w-full max-h-full">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="block max-w-full max-h-[calc(100vh-320px)] object-contain rounded-lg"
      />
      {/* Overlay positioned exactly over the rendered image area */}
      {imgSize && !isDetecting && (
        <div
          className="absolute"
          style={{
            left: imgSize.offsetX,
            top: imgSize.offsetY,
            width: imgSize.width,
            height: imgSize.height,
          }}
        >
          {boxes.map((box, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: boxes are dynamically reordered by user
            <BoxOverlay key={idx} box={box} index={idx} onRemove={onRemoveBox} />
          ))}
        </div>
      )}
      {isDetecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-center">
            <Scan size={48} className={`mx-auto mb-3 ${theme.textAccent} animate-pulse`} />
            <p className={theme.textAccent}>Analizuję skan...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PIPELINE PROGRESS (enhanced with ETA)
// ============================================

interface PipelineProgressProps {
  total: number;
  current: number;
  stage: string;
  overallProgress: number;
  estimatedTimeRemaining: number | null;
}

function PipelineProgressBar({
  total,
  current,
  stage,
  overallProgress,
  estimatedTimeRemaining,
}: PipelineProgressProps) {
  const theme = useViewTheme();

  const formatEta = (ms: number | null): string => {
    if (ms == null || ms <= 0) return '';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${minutes}m ${secs}s`;
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Stage label with spinner */}
      <div className="flex items-center justify-center gap-3">
        <Loader2 size={18} className={`${theme.textAccent} animate-spin`} />
        <span className={`text-sm font-medium ${theme.textAccent}`}>{stage}</span>
      </div>

      {/* Progress bar */}
      <div
        className={`relative h-2.5 ${theme.isLight ? 'bg-slate-200' : 'bg-white/10'} rounded-full overflow-hidden`}
      >
        <div
          className={`h-full ${theme.isLight ? 'bg-emerald-500' : 'bg-white'} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${overallProgress}%` }}
        />
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]"
          style={{ backgroundSize: '200% 100%' }}
        />
      </div>

      {/* Counter + ETA */}
      <div className="flex items-center justify-between text-xs">
        <span className={theme.textMuted}>
          {total > 0 ? `Zdjęcie ${current} z ${total}` : stage}
        </span>
        <div className="flex items-center gap-3">
          {estimatedTimeRemaining != null && estimatedTimeRemaining > 0 && (
            <span className={theme.textMuted}>{formatEta(estimatedTimeRemaining)}</span>
          )}
          <span className={`font-mono ${theme.textAccent}`}>{Math.round(overallProgress)}%</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CROP VIEW COMPONENT
// ============================================

export default function CropView() {
  const setCurrentView = useViewStore((s) => s.setCurrentView);
  const setIsLoading = useViewStore((s) => s.setIsLoading);
  const setProgressMessage = useViewStore((s) => s.setProgressMessage);
  const photos = usePhotoStore((s) => s.photos);
  const setDetectionResult = usePhotoStore((s) => s.setDetectionResult);

  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const theme = useViewTheme();

  // Pipeline hook (replaces manual pipeline logic)
  const pipeline = usePipeline({
    enableUpscale: true,
    upscaleFactor: 2.0,
    enableVerification: true,
  });

  const detectMutation = useDetectPhotos();
  const detectMutateAsyncRef = useRef(detectMutation.mutateAsync);
  detectMutateAsyncRef.current = detectMutation.mutateAsync;

  const verifyDetectionMutation = useVerifyDetection();
  const setVerificationResult = usePhotoStore((s) => s.setVerificationResult);
  const verificationResults = usePhotoStore((s) => s.verificationResults);
  const hasDetected = useRef(false);

  const verifyDetectionRef = useRef(verifyDetectionMutation);
  verifyDetectionRef.current = verifyDetectionMutation;
  const setVerificationResultRef = useRef(setVerificationResult);
  setVerificationResultRef.current = setVerificationResult;

  // Current photo (latest added one)
  const currentPhoto = photos[photos.length - 1];

  // Redirect if no photos
  useEffect(() => {
    if (photos.length === 0) {
      setCurrentView('upload');
    }
  }, [photos, setCurrentView]);

  // Reset detection state when current photo changes
  useEffect(() => {
    if (currentPhoto) {
      hasDetected.current = false;
      setBoxes([]);
      setDetectionResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhoto?.id, currentPhoto, setDetectionResult]);

  const runDetection = useCallback(async () => {
    if (!currentPhoto) return;

    setIsDetecting(true);
    setIsLoading(true);
    setProgressMessage('Wykrywanie zdjęć na skanie...');

    try {
      const result = await detectMutateAsyncRef.current({ file: currentPhoto.file });
      console.log('[CropView] Detection result:', result);

      if (result.bounding_boxes.length > 0) {
        setBoxes(result.bounding_boxes);
        setDetectionResult(result);
        toast.success(`Wykryto ${result.bounding_boxes.length} zdjęć`);

        // Fire-and-forget: verify detection
        fileToBase64(currentPhoto.file).then(({ base64, mimeType }) => {
          verifyDetectionRef.current
            .mutateAsync({
              imageBase64: base64,
              mimeType,
              boundingBoxes: result.bounding_boxes,
            })
            .then((vr) => {
              setVerificationResultRef.current('detection', vr);
            })
            .catch(() => {});
        });
      } else {
        toast.info('Nie wykryto oddzielnych zdjęć — traktowane jako jedno');
        setBoxes([
          {
            x: 0,
            y: 0,
            width: 1000,
            height: 1000,
            confidence: 1.0,
            label: 'full scan',
            rotation_angle: 0,
            contour: [],
            needs_outpaint: false,
          },
        ]);
      }
    } catch (error) {
      console.error('[CropView] Detection error:', error);
      toast.error('Błąd wykrywania zdjęć');
      setBoxes([
        {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
          confidence: 1.0,
          label: 'full scan',
          rotation_angle: 0,
          contour: [],
          needs_outpaint: false,
        },
      ]);
    } finally {
      setIsDetecting(false);
      setIsLoading(false);
      setProgressMessage('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhoto, setIsLoading, setProgressMessage, setDetectionResult]);

  // Auto-detect on mount (ref-stable to avoid re-trigger loops)
  const runDetectionRef = useRef(runDetection);
  runDetectionRef.current = runDetection;

  useEffect(() => {
    if (currentPhoto && !hasDetected.current && !isDetecting) {
      hasDetected.current = true;
      runDetectionRef.current();
    }
  }, [currentPhoto, isDetecting]);

  const removeBox = useCallback((index: number) => {
    setBoxes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Run full pipeline via TissaiaPipeline orchestrator
  const runFullPipeline = useCallback(async () => {
    if (!currentPhoto || boxes.length === 0) return;

    setIsLoading(true);

    try {
      const report = await pipeline.start(currentPhoto.file, boxes);

      if (report) {
        toast.success('Pipeline zakończony!');
        setCurrentView('results');
      }
    } catch (error) {
      if (pipeline.error) {
        toast.error(pipeline.error);
      } else {
        console.error('[CropView] Pipeline error:', error);
        toast.error(error instanceof Error ? error.message : 'Błąd pipeline');
      }
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  }, [currentPhoto, boxes, pipeline, setCurrentView, setIsLoading, setProgressMessage]);

  // Skip crop — go directly to pipeline with full image
  const skipCrop = useCallback(() => {
    setBoxes([
      {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
        confidence: 1.0,
        label: 'full image',
        rotation_angle: 0,
        contour: [],
        needs_outpaint: false,
      },
    ]);
  }, []);

  // Sync pipeline progress message to global state
  useEffect(() => {
    if (pipeline.progress?.message) {
      setProgressMessage(pipeline.progress.message);
    }
  }, [pipeline.progress?.message, setProgressMessage]);

  // Navigation to results is handled in runFullPipeline callback.
  // No additional useEffect needed — the global pipeline store preserves
  // report across view changes, so a stale report would cause an
  // unwanted redirect if we navigated here based on it.

  if (!currentPhoto) return null;

  const isPipelining = pipeline.isRunning;
  const progressData = pipeline.progress;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Title + detection progress */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.accentBg} relative`}>
            {isDetecting ? (
              <Loader2 className={`${theme.iconAccent} animate-spin`} size={24} />
            ) : (
              <Scissors className={theme.iconAccent} size={24} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-2xl font-bold ${theme.textAccent}`}>Rozdziel zdjęcia</h2>
            <p className={`${theme.textMuted} mt-1`}>
              {isDetecting ? 'Wykrywanie zdjęć na skanie...' : `Wykryto ${boxes.length} zdjęć`}
            </p>
          </div>
        </div>

        {/* Detection progress bar */}
        {isDetecting && (
          <div className="space-y-1">
            <div
              className={`relative h-1.5 ${theme.isLight ? 'bg-slate-200' : 'bg-white/10'} rounded-full overflow-hidden`}
            >
              <div
                className={`absolute inset-y-0 left-0 ${theme.isLight ? 'bg-emerald-500' : 'bg-white'} rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]`}
                style={{ width: '40%' }}
              />
            </div>
            <p className={`text-xs ${theme.textMuted}`}>
              AI analizuje skan — to może potrwać kilka sekund
            </p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isPipelining ? (
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-full border-4 ${theme.isLight ? 'border-emerald-500/20' : 'border-white/10'}`}
              />
              <div
                className={`absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent ${theme.isLight ? 'border-t-emerald-500' : 'border-t-white'} animate-spin`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Scissors size={24} className={`${theme.textAccent}`} />
              </div>
            </div>
            <PipelineProgressBar
              total={progressData?.totalPhotos ?? 0}
              current={progressData?.currentPhotoIndex ?? 0}
              stage={progressData?.message ?? 'Inicjalizacja...'}
              overallProgress={progressData?.overallProgress ?? 0}
              estimatedTimeRemaining={progressData?.estimatedTimeRemaining ?? null}
            />
            {/* Pause/Resume + Cancel buttons */}
            <div className="flex gap-3">
              {pipeline.isPaused ? (
                <button
                  type="button"
                  onClick={pipeline.resume}
                  className={`flex items-center gap-2 px-4 py-2 text-sm border ${theme.border} rounded-lg ${theme.isLight ? 'hover:border-emerald-500/50' : 'hover:border-white/40'} transition-colors`}
                >
                  <Play size={14} />
                  Wznów
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pipeline.pause}
                  className={`flex items-center gap-2 px-4 py-2 text-sm border ${theme.border} rounded-lg ${theme.isLight ? 'hover:border-emerald-500/50' : 'hover:border-white/40'} transition-colors`}
                >
                  <Pause size={14} />
                  Pauza
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  pipeline.cancel();
                  setIsLoading(false);
                  setProgressMessage('');
                  toast.info('Pipeline anulowany');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:border-red-500/60 transition-colors"
              >
                <X size={14} />
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <div className={`${theme.glassPanel} p-4 h-full flex flex-col`}>
            {/* Scan preview with bounding boxes */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <ScanPreviewWithBoxes
                src={currentPhoto.preview}
                alt={currentPhoto.name}
                boxes={boxes}
                isDetecting={isDetecting}
                onRemoveBox={removeBox}
                theme={theme}
              />
            </div>

            {/* Box count + verification */}
            {!isDetecting && (
              <div className="mt-4 space-y-2">
                <div className={`text-sm ${theme.textMuted}`}>
                  Kliknij X na ramce, aby ją usunąć. Wykryte zdjęcia: {boxes.length}
                </div>
                {(verifyDetectionMutation.isPending || verificationResults.detection) && (
                  <VerificationBadge
                    result={verificationResults.detection ?? null}
                    isLoading={verifyDetectionMutation.isPending}
                  />
                )}
              </div>
            )}

            {/* Pipeline error display */}
            {pipeline.error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {pipeline.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isPipelining && !isDetecting && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={skipCrop}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${theme.textMuted} ${theme.isLight ? 'hover:text-black' : 'hover:text-white'} transition-colors`}
          >
            <SkipForward size={16} />
            Pomiń (jedno zdjęcie)
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                hasDetected.current = false;
                runDetection();
              }}
              disabled={isDetecting || isPipelining || detectMutation.isPending}
              className={`px-4 py-2 text-sm border ${theme.border} rounded-lg ${theme.isLight ? 'hover:border-emerald-500/50' : 'hover:border-white/40'} transition-colors disabled:opacity-50`}
            >
              Ponów detekcję
            </button>

            <button
              type="button"
              onClick={runFullPipeline}
              disabled={boxes.length === 0 || isPipelining}
              className="btn-glow flex items-center gap-2 disabled:opacity-50"
            >
              Rozdziel i restauruj ({boxes.length})
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
