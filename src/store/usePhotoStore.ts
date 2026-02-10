// src/store/usePhotoStore.ts
/**
 * Photo & Pipeline Store
 * ======================
 * Photo management, temporary analysis/restoration results, and pipeline state.
 */
import { create } from 'zustand';
import type { PhotoFile } from '../types';

// ============================================
// STORE INTERFACE
// ============================================

interface PhotoState {
  photos: PhotoFile[];
  addPhoto: (photo: PhotoFile) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;

  currentAnalysis: unknown | null;
  restorationResult: unknown | null;

  detectionResult: unknown | null;
  setDetectionResult: (result: unknown | null) => void;
  croppedPhotos: unknown[];
  setCroppedPhotos: (photos: unknown[]) => void;
  pipelineResults: Record<string, { analysis: unknown; restoration: unknown }>;
  setPipelineResult: (photoId: string, analysis: unknown, restoration: unknown) => void;
  clearPipelineResults: () => void;

  resetPhotos: () => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const usePhotoStore = create<PhotoState>()((set) => ({
  photos: [],
  addPhoto: (photo) =>
    set((state) => ({
      photos: [...state.photos, photo],
    })),
  removePhoto: (id) =>
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
    })),
  clearPhotos: () => set({ photos: [] }),

  currentAnalysis: null,
  restorationResult: null,

  detectionResult: null,
  setDetectionResult: (result) => set({ detectionResult: result }),
  croppedPhotos: [],
  setCroppedPhotos: (photos) => set({ croppedPhotos: photos }),
  pipelineResults: {},
  setPipelineResult: (photoId, analysis, restoration) =>
    set((state) => ({
      pipelineResults: {
        ...state.pipelineResults,
        [photoId]: { analysis, restoration },
      },
    })),
  clearPipelineResults: () => set({ pipelineResults: {} }),

  resetPhotos: () =>
    set({
      photos: [],
      currentAnalysis: null,
      restorationResult: null,
      detectionResult: null,
      croppedPhotos: [],
      pipelineResults: {},
    }),
}));

// ============================================
// SELECTORS
// ============================================

export const selectPhotos = (state: PhotoState) => state.photos;
