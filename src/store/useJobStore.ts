// src/store/useJobStore.ts
/**
 * Restoration Job Store
 * =====================
 * Current job tracking with cross-store history integration.
 */
import { create } from 'zustand';
import type { HistoryEntry, PhotoAnalysis, RestorationJob, RestorationResult } from '../types';
import { useSettingsStore } from './useSettingsStore';

// ============================================
// STORE INTERFACE
// ============================================

interface JobState {
  currentJob: RestorationJob | null;
  setCurrentJob: (job: RestorationJob | null) => void;
  updateJobProgress: (progress: number) => void;
  updateJobStatus: (status: RestorationJob['status']) => void;
  setJobAnalysis: (analysis: PhotoAnalysis) => void;
  setJobResult: (result: RestorationResult) => void;
  setJobError: (error: string) => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useJobStore = create<JobState>()((set, get) => ({
  currentJob: null,
  setCurrentJob: (job) => set({ currentJob: job }),
  updateJobProgress: (progress) =>
    set((state) => ({
      currentJob: state.currentJob
        ? { ...state.currentJob, progress, updatedAt: new Date().toISOString() }
        : null,
    })),
  updateJobStatus: (status) =>
    set((state) => ({
      currentJob: state.currentJob
        ? { ...state.currentJob, status, updatedAt: new Date().toISOString() }
        : null,
    })),
  setJobAnalysis: (analysis) =>
    set((state) => ({
      currentJob: state.currentJob
        ? { ...state.currentJob, analysis, updatedAt: new Date().toISOString() }
        : null,
    })),
  setJobResult: (result) => {
    const currentJob = get().currentJob;
    if (!currentJob) return;

    const updatedJob: RestorationJob = {
      ...currentJob,
      result,
      status: 'completed',
      progress: 100,
      updatedAt: new Date().toISOString(),
    };

    set({ currentJob: updatedJob });

    // Cross-store: auto-add to history
    const historyEntry: HistoryEntry = {
      id: `history-${Date.now()}`,
      job: updatedJob,
      createdAt: new Date().toISOString(),
    };
    useSettingsStore.getState().addToHistory(historyEntry);
  },
  setJobError: (error) =>
    set((state) => ({
      currentJob: state.currentJob
        ? { ...state.currentJob, error, status: 'failed', updatedAt: new Date().toISOString() }
        : null,
    })),
}));

// ============================================
// SELECTORS
// ============================================

export const selectCurrentJob = (state: JobState) => state.currentJob;
