// src/hooks/api/useVerification.ts
/**
 * Verification Hooks — v4.0 Web Edition
 * =======================================
 * Fire-and-forget verification hooks using Gemini 3 Flash.
 * These never block the pipeline — silent onError.
 * Always connects to the Axum backend via HTTP.
 */
import { useMutation } from '@tanstack/react-query';
import type { BoundingBox, VerificationResult } from './types';
import { apiPost } from './utils';

// ============================================
// VERIFY RESTORATION
// ============================================

export interface VerifyRestorationParams {
  originalBase64: string;
  restoredBase64: string;
  mimeType: string;
}

/**
 * Verify restoration quality (before/after comparison).
 * Fire-and-forget — silent on error.
 */
export function useVerifyRestoration() {
  return useMutation({
    mutationFn: async ({
      originalBase64,
      restoredBase64,
      mimeType,
    }: VerifyRestorationParams): Promise<VerificationResult> => {
      return apiPost<VerificationResult>('/api/verify/restoration', {
        original_base64: originalBase64,
        restored_base64: restoredBase64,
        mime_type: mimeType,
      });
    },
    onError: (error) => {
      console.warn('[Verification] Restoration verification failed (silent):', error);
    },
  });
}

// ============================================
// VERIFY DETECTION
// ============================================

export interface VerifyDetectionParams {
  imageBase64: string;
  mimeType: string;
  boundingBoxes: BoundingBox[];
}

/**
 * Verify photo detection results.
 * Fire-and-forget — silent on error.
 */
export function useVerifyDetection() {
  return useMutation({
    mutationFn: async ({
      imageBase64,
      mimeType,
      boundingBoxes,
    }: VerifyDetectionParams): Promise<VerificationResult> => {
      return apiPost<VerificationResult>('/api/verify/detection', {
        image_base64: imageBase64,
        mime_type: mimeType,
        bounding_boxes: boundingBoxes,
      });
    },
    onError: (error) => {
      console.warn('[Verification] Detection verification failed (silent):', error);
    },
  });
}

// ============================================
// VERIFY CROP
// ============================================

export interface VerifyCropParams {
  croppedBase64: string;
  mimeType: string;
  cropIndex: number;
}

/**
 * Verify individual crop quality.
 * Fire-and-forget — silent on error.
 */
export function useVerifyCrop() {
  return useMutation({
    mutationFn: async ({
      croppedBase64,
      mimeType,
      cropIndex,
    }: VerifyCropParams): Promise<VerificationResult> => {
      return apiPost<VerificationResult>('/api/verify/crop', {
        cropped_base64: croppedBase64,
        mime_type: mimeType,
        crop_index: cropIndex,
      });
    },
    onError: (error) => {
      console.warn('[Verification] Crop verification failed (silent):', error);
    },
  });
}
