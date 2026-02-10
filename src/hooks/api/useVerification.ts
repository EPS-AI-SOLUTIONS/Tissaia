// src/hooks/api/useVerification.ts
/**
 * Verification Hooks
 * ==================
 * Fire-and-forget verification hooks using Gemini 3 Flash.
 * These never block the pipeline — silent onError.
 */
import { useMutation } from '@tanstack/react-query';
import { isTauri } from '../../utils/tauri';
import { createMockVerificationResult, MOCK_VERIFICATION_DELAY } from './mocks';
import type { BoundingBox, VerificationResult } from './types';
import { delay, safeInvoke } from './utils';

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
      if (!isTauri()) {
        await delay(MOCK_VERIFICATION_DELAY);
        return createMockVerificationResult('restoration');
      }

      return safeInvoke<VerificationResult>('verify_restoration', {
        originalBase64,
        restoredBase64,
        mimeType,
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
      if (!isTauri()) {
        await delay(MOCK_VERIFICATION_DELAY);
        return createMockVerificationResult('detection');
      }

      return safeInvoke<VerificationResult>('verify_detection', {
        imageBase64,
        mimeType,
        boundingBoxes,
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
      if (!isTauri()) {
        await delay(MOCK_VERIFICATION_DELAY);
        return createMockVerificationResult('crop');
      }

      return safeInvoke<VerificationResult>('verify_crop', {
        croppedBase64,
        mimeType,
        cropIndex,
      });
    },
    onError: (error) => {
      console.warn('[Verification] Crop verification failed (silent):', error);
    },
  });
}
