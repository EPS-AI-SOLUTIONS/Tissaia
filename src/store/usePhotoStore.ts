// src/store/usePhotoStore.ts
/**
 * Photo & Pipeline Store
 * ======================
 * Photo management, temporary restoration results, and pipeline state.
 *
 * NOTE (Memory pressure): Pipeline stores base64 image strings directly in state.
 * For a scan with N photos, memory usage ≈ N × (crop + restored + original) ≈ N × 15 MB.
 * Consider migrating to Blob/ObjectURL or disk-backed storage (via Tauri fs) for large batches.
 */
import { create } from 'zustand';
import type {
  CroppedPhoto,
  DetectionResult,
  RestorationResult,
  VerificationResult,
} from '../hooks/api/types';
import type { PhotoFile } from '../types';

// ============================================
// STORE INTERFACE
// ============================================

interface PhotoState {
  photos: PhotoFile[];
  addPhoto: (photo: PhotoFile) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;

  restorationResult: RestorationResult | null;

  detectionResult: DetectionResult | null;
  setDetectionResult: (result: DetectionResult | null) => void;
  croppedPhotos: CroppedPhoto[];
  setCroppedPhotos: (photos: CroppedPhoto[]) => void;
  pipelineResults: Record<string, { restoration: RestorationResult }>;
  setPipelineResult: (photoId: string, restoration: RestorationResult) => void;
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
