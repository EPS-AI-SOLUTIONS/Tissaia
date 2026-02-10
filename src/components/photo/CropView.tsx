// src/components/photo/CropView.tsx
/**
 * Photo Separation View
 * =====================
 * AI-powered detection and separation of individual photos from scans.
 * After separation, automatically runs the full pipeline (analysis + restoration).
 */

import { ArrowRight, Loader2, Scan, Scissors, SkipForward, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createMockRestorationResult, MOCK_RESTORATION_DELAY } from '../../hooks/api/mocks';
import type { BoundingBox, RestorationResult } from '../../hooks/api/types';
import { useCropPhotos, useDetectPhotos } from '../../hooks/api/useCrop';
import {
  useVerifyCrop,
  useVerifyDetection,
  useVerifyRestoration,
} from '../../hooks/api/useVerification';
import { delay, fileToBase64, safeInvoke } from '../../hooks/api/utils';
import { usePhotoStore } from '../../store/usePhotoStore';
import { useViewStore } from '../../store/useViewStore';
import { isTauri } from '../../utils/tauri';
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
      className="absolute border-2 border-matrix-accent/80 bg-matrix-accent/10 group cursor-pointer hover:bg-matrix-accent/20 transition-all"
      style={{ left, top, width, height }}
    >
      <div className="absolute -top-6 left-0 bg-matrix-accent text-black text-xs font-bold px-2 py-0.5 rounded-t">
        #{index + 1}
        {box.confidence < 0.8 && ' ?'}
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
// PIPELINE PROGRESS
// ============================================

interface PipelineProgressProps {
  total: number;
  current: number;
  stage: string;
}

function PipelineProgress({ total, current, stage }: PipelineProgressProps) {
  const progress = total > 0 ? ((current - 1) / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-matrix-text-dim">
          Przetwarzanie {current}/{total}
        </span>
        <span className="text-matrix-accent">{stage}</span>
      </div>
      <div className="h-2 bg-matrix-bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-matrix-accent transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
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
  const setCroppedPhotos = usePhotoStore((s) => s.setCroppedPhotos);
  const setPipelineResult = usePhotoStore((s) => s.setPipelineResult);
  const clearPipelineResults = usePhotoStore((s) => s.clearPipelineResults);

  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isPipelining, setIsPipelining] = useState(false);
  const [pipelineCurrent, setPipelineCurrent] = useState(0);
  const [pipelineStage, setPipelineStage] = useState('');
  const [pipelineTotal, setPipelineTotal] = useState(0);

  const detectMutation = useDetectPhotos();
  const cropMutation = useCropPhotos();
  const verifyDetectionMutation = useVerifyDetection();
  const verifyCropMutation = useVerifyCrop();
  const verifyRestorationMutation = useVerifyRestoration();
  const setVerificationResult = usePhotoStore((s) => s.setVerificationResult);
  const verificationResults = usePhotoStore((s) => s.verificationResults);
  const hasDetected = useRef(false);
  const pipelineCancelledRef = useRef(false);

  // Current photo (first one)
  const currentPhoto = photos[0];

  // Redirect if no photos
  useEffect(() => {
    if (photos.length === 0) {
      setCurrentView('upload');
    }
  }, [photos, setCurrentView]);

  const runDetection = useCallback(async () => {
    if (!currentPhoto) return;

    setIsDetecting(true);
    setIsLoading(true);
    setProgressMessage('Wykrywanie zdjęć na skanie...');

    try {
      const result = await detectMutation.mutateAsync({ file: currentPhoto.file });
      console.log('[CropView] Detection result:', result);

      if (result.bounding_boxes.length > 0) {
        setBoxes(result.bounding_boxes);
        setDetectionResult(result);
        toast.success(`Wykryto ${result.bounding_boxes.length} zdjęć`);

        // Fire-and-forget: verify detection
        fileToBase64(currentPhoto.file).then(({ base64, mimeType }) => {
          verifyDetectionMutation
            .mutateAsync({
              imageBase64: base64,
              mimeType,
              boundingBoxes: result.bounding_boxes,
            })
            .then((vr) => setVerificationResult('detection', vr))
            .catch(() => {});
        });
      } else {
        toast.info('Nie wykryto oddzielnych zdjęć — traktowane jako jedno');
        setBoxes([{ x: 0, y: 0, width: 1000, height: 1000, confidence: 1.0, label: 'full scan' }]);
      }
    } catch (error) {
      console.error('[CropView] Detection error:', error);
      toast.error('Błąd wykrywania zdjęć');
      // Fallback: treat as single photo
      setBoxes([{ x: 0, y: 0, width: 1000, height: 1000, confidence: 1.0, label: 'full scan' }]);
    } finally {
      setIsDetecting(false);
      setIsLoading(false);
      setProgressMessage('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhoto, detectMutation, setIsLoading, setProgressMessage, setDetectionResult]);

  // Auto-detect on mount
  useEffect(() => {
    if (currentPhoto && !hasDetected.current && !isDetecting) {
      hasDetected.current = true;
      runDetection();
    }
  }, [currentPhoto, isDetecting, runDetection]);

  const removeBox = useCallback((index: number) => {
    setBoxes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Cancel pipeline on unmount
  useEffect(() => {
    return () => {
      pipelineCancelledRef.current = true;
    };
  }, []);

  // Run full pipeline: crop → restore per photo
  const runFullPipeline = useCallback(async () => {
    if (!currentPhoto || boxes.length === 0) return;

    pipelineCancelledRef.current = false;
    setIsPipelining(true);
    setIsLoading(true);
    clearPipelineResults();

    try {
      // Step 1: Crop
      if (pipelineCancelledRef.current) return;
      setPipelineStage('Wycinanie zdjęć...');
      setPipelineTotal(boxes.length);
      setPipelineCurrent(0);

      const cropResult = await cropMutation.mutateAsync({
        file: currentPhoto.file,
        boundingBoxes: boxes,
        originalFilename: currentPhoto.name,
      });

      if (pipelineCancelledRef.current) return;

      setCroppedPhotos(cropResult.photos);
      console.log('[CropView] Cropped:', cropResult.photos.length, 'photos');

      // Step 2: For each cropped photo, run restoration
      for (let i = 0; i < cropResult.photos.length; i++) {
        if (pipelineCancelledRef.current) return;

        const croppedPhoto = cropResult.photos[i];
        setPipelineCurrent(i + 1);

        // Restore
        if (pipelineCancelledRef.current) return;
        setPipelineStage(`Restauracja zdjęcia ${i + 1}/${cropResult.photos.length}...`);
        setProgressMessage(`Restauracja zdjęcia ${i + 1}/${cropResult.photos.length}`);

        let restorationResult: RestorationResult;
        if (!isTauri()) {
          await delay(MOCK_RESTORATION_DELAY);
          restorationResult = createMockRestorationResult(croppedPhoto.image_base64);
        } else {
          restorationResult = await safeInvoke<RestorationResult>('restore_image', {
            imageBase64: croppedPhoto.image_base64,
            mimeType: croppedPhoto.mime_type,
          });
        }

        if (pipelineCancelledRef.current) return;
        setPipelineResult(croppedPhoto.id, restorationResult);

        // Fire-and-forget: verify crop quality
        verifyCropMutation
          .mutateAsync({
            croppedBase64: croppedPhoto.image_base64,
            mimeType: croppedPhoto.mime_type,
            cropIndex: i,
          })
          .then((vr) => setVerificationResult(`crop_${croppedPhoto.id}`, vr))
          .catch(() => {});

        // Fire-and-forget: verify restoration quality
        verifyRestorationMutation
          .mutateAsync({
            originalBase64: croppedPhoto.image_base64,
            restoredBase64: restorationResult.restored_image,
            mimeType: croppedPhoto.mime_type,
          })
          .then((vr) => setVerificationResult(`restoration_${croppedPhoto.id}`, vr))
          .catch(() => {});

        toast.success(`Zdjęcie ${i + 1} przetworzone`);
      }

      if (pipelineCancelledRef.current) return;
      toast.success('Pipeline zakończony!');
      setCurrentView('results');
    } catch (error) {
      if (pipelineCancelledRef.current) return;
      console.error('[CropView] Pipeline error:', error);
      toast.error(error instanceof Error ? error.message : 'Błąd pipeline');
    } finally {
      if (!pipelineCancelledRef.current) {
        setIsPipelining(false);
        setIsLoading(false);
        setProgressMessage('');
      }
    }
  }, [
    currentPhoto,
    boxes,
    cropMutation,
    clearPipelineResults,
    setCroppedPhotos,
    setPipelineResult,
    setCurrentView,
    setIsLoading,
    setProgressMessage,
  ]);

  // Skip crop — go directly to pipeline with full image
  const skipCrop = useCallback(() => {
    setBoxes([{ x: 0, y: 0, width: 1000, height: 1000, confidence: 1.0, label: 'full image' }]);
    // Will trigger pipeline on next render with "Rozdziel" button
  }, []);

  if (!currentPhoto) return null;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-matrix-accent/10">
            <Scissors className="text-matrix-accent" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-matrix-accent">Rozdziel zdjęcia</h2>
            <p className="text-matrix-text-dim mt-1">
              {isDetecting ? 'Wykrywanie zdjęć na skanie...' : `Wykryto ${boxes.length} zdjęć`}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {isPipelining ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <Loader2 size={48} className="text-matrix-accent animate-spin" />
            <PipelineProgress
              total={pipelineTotal}
              current={pipelineCurrent}
              stage={pipelineStage}
            />
          </div>
        ) : (
          <div className="glass-panel p-4">
            {/* Scan preview with bounding boxes */}
            <div className="relative inline-block w-full">
              <img
                src={currentPhoto.preview}
                alt={currentPhoto.name}
                className="w-full h-auto rounded-lg"
              />
              {!isDetecting &&
                boxes.map((box, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: boxes are dynamically reordered by user
                  <BoxOverlay key={idx} box={box} index={idx} onRemove={removeBox} />
                ))}
              {isDetecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-center">
                    <Scan size={48} className="mx-auto mb-3 text-matrix-accent animate-pulse" />
                    <p className="text-matrix-accent">Analizuję skan...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Box count + verification */}
            {!isDetecting && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-matrix-text-dim">
                  Kliknij X na ramce, aby ją usunąć. Wykryte zdjęcia: {boxes.length}
                </div>
                {(verifyDetectionMutation.isPending || verificationResults['detection']) && (
                  <VerificationBadge
                    result={verificationResults['detection'] ?? null}
                    isLoading={verifyDetectionMutation.isPending}
                  />
                )}
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
            className="flex items-center gap-2 px-4 py-2 text-sm text-matrix-text-dim hover:text-white transition-colors"
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
              className="px-4 py-2 text-sm border border-matrix-border rounded-lg hover:border-matrix-accent/50 transition-colors"
            >
              Ponów detekcję
            </button>

            <button
              type="button"
              onClick={runFullPipeline}
              disabled={boxes.length === 0}
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
