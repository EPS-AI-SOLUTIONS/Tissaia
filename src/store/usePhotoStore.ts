// src/store/usePhotoStore.ts
/**
 * Photo & Pipeline Store
 * ======================
 * Photo management, temporary restoration results, and pipeline state.
 */
import { create } from 'zustand';
import type { VerificationResult } from '../hooks/api/types';
import type { PhotoFile } from '../types';

// ============================================
// STORE INTERFACE
// ============================================

interface PhotoState {
  photos: PhotoFile[];
  addPhoto: (photo: PhotoFile) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;

  restorationResult: unknown | null;

  detectionResult: unknown | null;
  setDetectionResult: (result: unknown | null) => void;
  croppedPhotos: unknown[];
  setCroppedPhotos: (photos: unknown[]) => void;
  pipelineResults: Record<string, { restoration: unknown }>;
  setPipelineResult: (photoId: string, restoration: unknown) => void;
  clearPipelineResults: () => void;

  // Verification results (fire-and-forget)
  verificationResults: Record<string, VerificationResult>;
  setVerificationResult: (key: string, result: VerificationResult) => void;
  clearVerificationResults: () => void;

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

  restorationResult: null,

  detectionResult: null,
  setDetectionResult: (result) => set({ detectionResult: result }),
  croppedPhotos: [],
  setCroppedPhotos: (photos) => set({ croppedPhotos: photos }),
  pipelineResults: {},
  setPipelineResult: (photoId, restoration) =>
    set((state) => ({
      pipelineResults: {
        ...state.pipelineResults,
        [photoId]: { restoration },
      },
    })),
  clearPipelineResults: () => set({ pipelineResults: {} }),

  // Verification results
  verificationResults: {},
  setVerificationResult: (key, result) =>
    set((state) => ({
      verificationResults: {
        ...state.verificationResults,
        [key]: result,
      },
    })),
  clearVerificationResults: () => set({ verificationResults: {} }),

  resetPhotos: () =>
    set({
      photos: [],
      restorationResult: null,
      detectionResult: null,
      croppedPhotos: [],
      pipelineResults: {},
      verificationResults: {},
    }),
}));

// ============================================
// SELECTORS
// ============================================

export const selectPhotos = (state: PhotoState) => state.photos;
