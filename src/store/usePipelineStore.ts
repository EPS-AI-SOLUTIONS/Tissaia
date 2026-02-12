// src/store/usePipelineStore.ts
/**
 * Pipeline Store
 * ==============
 * Global Zustand store for TissaiaPipeline lifecycle.
 * Keeps the pipeline instance alive across view changes,
 * so that switching views doesn't interrupt processing.
 */
import { create } from 'zustand';
import type { BoundingBox } from '../hooks/api/types';
import { TissaiaPipeline } from '../services/pipeline';
import type { PipelineOptions, PipelineProgress, PipelineReport } from '../services/pipeline/types';
import { usePhotoStore } from './usePhotoStore';

// ============================================
// TYPES
// ============================================

interface PipelineState {
  /** The singleton pipeline instance (null before first use) */
  instance: TissaiaPipeline | null;
  /** Reactive progress from pipeline events */
  progress: PipelineProgress | null;
  /** Final report after pipeline completes */
  report: PipelineReport | null;
  /** Error message if pipeline fails */
  error: string | null;
  /** Whether pipeline is currently running */
  isRunning: boolean;
  /** Whether pipeline is paused */
  isPaused: boolean;

  // Actions
  /** Ensure a pipeline instance exists, creating one if needed */
  ensureInstance: (options?: Partial<PipelineOptions>) => TissaiaPipeline;
  /** Start the pipeline */
  start: (
    file: File,
    existingBoxes?: BoundingBox[],
    options?: Partial<PipelineOptions>,
  ) => Promise<PipelineReport | null>;
  /** Pause the pipeline */
  pause: () => void;
  /** Resume the pipeline */
  resume: () => void;
  /** Cancel the pipeline */
  cancel: () => void;
  /** Update options on the current instance */
  updateOptions: (opts: Partial<PipelineOptions>) => void;
  /** Fully destroy the pipeline (e.g. on app close or explicit reset) */
  destroy: () => void;
}

// ============================================
// DEFAULT PROGRESS
// ============================================

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

// ============================================
// STORE
// ============================================

/** Unsubscribe functions for the current pipeline instance */
let currentUnsubs: Array<() => void> = [];

function cleanupSubscriptions() {
  for (const unsub of currentUnsubs) unsub();
  currentUnsubs = [];
}

function subscribeToPipeline(
  pipeline: TissaiaPipeline,
  set: (partial: Partial<PipelineState>) => void,
) {
  cleanupSubscriptions();

  currentUnsubs.push(
    pipeline.on('pipeline:progress', (p) => {
      set({ progress: p });
    }),
  );

  currentUnsubs.push(
    pipeline.on('pipeline:complete', ({ report: r }) => {
      set({ report: r, isRunning: false, isPaused: false });

      // Sync results to photo store
      const results = pipeline.getResults();
      if (results.detection) {
        usePhotoStore.getState().setDetectionResult(results.detection);
      }
      if (results.crop) {
        usePhotoStore.getState().setCroppedPhotos(results.crop.photos);
      }
      for (const [photoId, restoration] of results.restorations) {
        usePhotoStore.getState().setPipelineResult(photoId, restoration);
      }
    }),
  );

  currentUnsubs.push(
    pipeline.on('pipeline:error', ({ error: e }) => {
      set({ error: e.message, isRunning: false, isPaused: false });
    }),
  );

  currentUnsubs.push(
    pipeline.on('pipeline:cancel', () => {
      set({ isRunning: false, isPaused: false });
    }),
  );

  currentUnsubs.push(
    pipeline.on('pipeline:pause', () => {
      set({ isPaused: true });
    }),
  );

  currentUnsubs.push(
    pipeline.on('pipeline:resume', () => {
      set({ isPaused: false });
    }),
  );

  // Sync individual photo completions in real-time
  currentUnsubs.push(
    pipeline.on('photo:complete', ({ photoId }) => {
      const results = pipeline.getResults();
      const restoration = results.restorations.get(photoId);
      if (restoration) {
        usePhotoStore.getState().setPipelineResult(photoId, restoration);
      }
    }),
  );
}

export const usePipelineStore = create<PipelineState>()((set, get) => ({
  instance: null,
  progress: null,
  report: null,
  error: null,
  isRunning: false,
  isPaused: false,

  ensureInstance: (options?: Partial<PipelineOptions>) => {
    const existing = get().instance;
    if (existing) {
      if (options) existing.updateOptions(options);
      return existing;
    }
    const pipeline = new TissaiaPipeline(options);
    subscribeToPipeline(pipeline, set);
    set({ instance: pipeline });
    return pipeline;
  },

  start: async (file, existingBoxes, options) => {
    // If pipeline was previously cancelled/completed, create a fresh instance
    const existingPipeline = get().instance;
    if (existingPipeline && !existingPipeline.isProcessing()) {
      cleanupSubscriptions();
      existingPipeline.destroy();
      set({ instance: null });
    }

    const pipeline = get().ensureInstance(options);

    // Reset state for new run
    set({
      error: null,
      report: null,
      progress: { ...DEFAULT_PROGRESS, status: 'running', startTime: Date.now() },
      isRunning: true,
      isPaused: false,
    });
    usePhotoStore.getState().clearPipelineResults();

    try {
      const result = await pipeline.process(file, existingBoxes);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pipeline error';
      if (msg !== 'Pipeline cancelled') {
        set({ error: msg });
      }
      return null;
    }
  },

  pause: () => {
    get().instance?.pause();
  },

  resume: () => {
    get().instance?.resume();
  },

  cancel: () => {
    get().instance?.cancel();
    set({ isRunning: false, isPaused: false });
  },

  updateOptions: (opts) => {
    get().instance?.updateOptions(opts);
  },

  destroy: () => {
    const pipeline = get().instance;
    if (pipeline) {
      cleanupSubscriptions();
      pipeline.destroy();
      set({
        instance: null,
        progress: null,
        report: null,
        error: null,
        isRunning: false,
        isPaused: false,
      });
    }
  },
}));

// Selectors
export const selectPipelineIsRunning = (s: PipelineState) => s.isRunning;
export const selectPipelineProgress = (s: PipelineState) => s.progress;
export const selectPipelineReport = (s: PipelineState) => s.report;
export const selectPipelineError = (s: PipelineState) => s.error;
