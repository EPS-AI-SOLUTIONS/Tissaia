// src/hooks/usePipeline.ts
/**
 * Pipeline Hook
 * =============
 * React hook wrapping TissaiaPipeline for use in components.
 * Bridges pipeline events to Zustand stores and React state.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { TissaiaPipeline } from '../services/pipeline';
import type { PipelineOptions, PipelineProgress, PipelineReport } from '../services/pipeline/types';
import { usePhotoStore } from '../store/usePhotoStore';
import type { BoundingBox } from './api/types';

export interface UsePipelineReturn {
  /** Start the pipeline */
  start: (file: File, existingBoxes?: BoundingBox[]) => Promise<PipelineReport | null>;
  /** Pause the pipeline */
  pause: () => void;
  /** Resume the pipeline */
  resume: () => void;
  /** Cancel the pipeline */
  cancel: () => void;
  /** Current progress */
  progress: PipelineProgress | null;
  /** Final report (after completion) */
  report: PipelineReport | null;
  /** Current error */
  error: string | null;
  /** Is pipeline running */
  isRunning: boolean;
  /** Is pipeline paused */
  isPaused: boolean;
  /** Update pipeline options */
  updateOptions: (opts: Partial<PipelineOptions>) => void;
}

const DEFAULT_PROGRESS: PipelineProgress = {
  currentStage: 'idle',
  totalStages: 4,
  stageProgress: 0,
  overallProgress: 0,
  status: 'idle',
  currentPhotoIndex: 0,
  totalPhotos: 0,
  message: '',
  startTime: 0,
  estimatedTimeRemaining: null,
  stageTimings: {},
};

export function usePipeline(options?: Partial<PipelineOptions>): UsePipelineReturn {
  const pipelineRef = useRef<TissaiaPipeline | null>(null);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [report, setReport] = useState<PipelineReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Store actions
  const setDetectionResult = usePhotoStore((s) => s.setDetectionResult);
  const setCroppedPhotos = usePhotoStore((s) => s.setCroppedPhotos);
  const setPipelineResult = usePhotoStore((s) => s.setPipelineResult);
  const clearPipelineResults = usePhotoStore((s) => s.clearPipelineResults);

  // Create pipeline instance
  useEffect(() => {
    const pipeline = new TissaiaPipeline(options);
    pipelineRef.current = pipeline;

    // Subscribe to events
    const unsubs: Array<() => void> = [];

    unsubs.push(
      pipeline.on('pipeline:progress', (p) => {
        setProgress(p);
      }),
    );

    unsubs.push(
      pipeline.on('pipeline:complete', ({ report: r }) => {
        setReport(r);
        setIsRunning(false);
        setIsPaused(false);

        // Sync results to store
        const results = pipeline.getResults();
        if (results.detection) {
          setDetectionResult(results.detection);
        }
        if (results.crop) {
          setCroppedPhotos(results.crop.photos);
        }
        for (const [photoId, restoration] of results.restorations) {
          setPipelineResult(photoId, restoration);
        }
      }),
    );

    unsubs.push(
      pipeline.on('pipeline:error', ({ error: e }) => {
        setError(e.message);
        setIsRunning(false);
        setIsPaused(false);
      }),
    );

    unsubs.push(
      pipeline.on('pipeline:cancel', () => {
        setIsRunning(false);
        setIsPaused(false);
      }),
    );

    unsubs.push(
      pipeline.on('pipeline:pause', () => {
        setIsPaused(true);
      }),
    );

    unsubs.push(
      pipeline.on('pipeline:resume', () => {
        setIsPaused(false);
      }),
    );

    // Sync individual photo completions to store in real-time
    unsubs.push(
      pipeline.on('photo:complete', ({ photoId }) => {
        const results = pipeline.getResults();
        const restoration = results.restorations.get(photoId);
        if (restoration) {
          setPipelineResult(photoId, restoration);
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
      pipeline.destroy();
      pipelineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, setCroppedPhotos, setDetectionResult, setPipelineResult]);

  const start = useCallback(
    async (file: File, existingBoxes?: BoundingBox[]): Promise<PipelineReport | null> => {
      const pipeline = pipelineRef.current;
      if (!pipeline) return null;

      setError(null);
      setReport(null);
      setProgress({ ...DEFAULT_PROGRESS, status: 'running', startTime: Date.now() });
      setIsRunning(true);
      setIsPaused(false);
      clearPipelineResults();

      try {
        const result = await pipeline.process(file, existingBoxes);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Pipeline error';
        if (msg !== 'Pipeline cancelled') {
          setError(msg);
        }
        return null;
      }
    },
    [clearPipelineResults],
  );

  const pause = useCallback(() => {
    pipelineRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    pipelineRef.current?.resume();
  }, []);

  const cancel = useCallback(() => {
    pipelineRef.current?.cancel();
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const updateOptions = useCallback((opts: Partial<PipelineOptions>) => {
    pipelineRef.current?.updateOptions(opts);
  }, []);

  return {
    start,
    pause,
    resume,
    cancel,
    progress,
    report,
    error,
    isRunning,
    isPaused,
    updateOptions,
  };
}
