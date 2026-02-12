// src/hooks/usePipeline.ts
/**
 * Pipeline Hook
 * =============
 * React hook wrapping TissaiaPipeline for use in components.
 * Bridges pipeline events to Zustand stores and React state.
 */
import { useCallback, useEffect } from 'react';
import type { PipelineOptions, PipelineProgress, PipelineReport } from '../services/pipeline/types';
import { usePipelineStore } from '../store/usePipelineStore';
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

export function usePipeline(options?: Partial<PipelineOptions>): UsePipelineReturn {
  const store = usePipelineStore();

  // Ensure pipeline instance exists with the given options (idempotent)
  useEffect(() => {
    store.ensureInstance(options);
  }, [options]);

  const start = useCallback(
    async (file: File, existingBoxes?: BoundingBox[]): Promise<PipelineReport | null> => {
      return store.start(file, existingBoxes, options);
    },
    [store.start, options],
  );

  return {
    start,
    pause: store.pause,
    resume: store.resume,
    cancel: store.cancel,
    progress: store.progress,
    report: store.report,
    error: store.error,
    isRunning: store.isRunning,
    isPaused: store.isPaused,
    updateOptions: store.updateOptions,
  };
}
