// src/hooks/api/useCrop.ts
/**
 * Crop Hooks — v4.0 Web Edition
 * ===============================
 * Hooks for photo detection and cropping operations.
 * Always connects to the Axum backend via HTTP.
 * Backend handles all image processing (crop, rotation, outpaint).
 */
import { useMutation } from '@tanstack/react-query';
import type { CropResult, DetectionResult, Point2D } from './types';
import { apiPost, fileToBase64 } from './utils';

// ============================================
// DETECT PHOTOS
// ============================================

export interface DetectPhotosParams {
  file: File;
}

/**
 * Enhanced photo detection with auto-retry and verification merge.
 * Uses `detect_photos_with_retry` which:
 * 1. Runs initial detection
 * 2. Verifies with Gemini Flash
 * 3. If photos are missing, merges verifier suggestions
 */
export function useDetectPhotos() {
  return useMutation({
    retry: 1,
    retryDelay: 2000,
    mutationFn: async ({ file }: DetectPhotosParams): Promise<DetectionResult> => {
      const { base64, mimeType } = await fileToBase64(file);
      return apiPost<DetectionResult>('/api/detect/retry', {
        image_base64: base64,
        mime_type: mimeType,
      });
    },
  });
}

// ============================================
// CROP PHOTOS
// ============================================

export interface CropPhotosParams {
  file: File;
  boundingBoxes: import('./types').BoundingBox[];
  originalFilename: string;
}

export function useCropPhotos() {
  return useMutation({
    retry: 1,
    retryDelay: 2000,
    mutationFn: async ({
      file,
      boundingBoxes,
      originalFilename,
    }: CropPhotosParams): Promise<CropResult> => {
      const { base64, mimeType } = await fileToBase64(file);
      return apiPost<CropResult>('/api/crop', {
        image_base64: base64,
        mime_type: mimeType,
        bounding_boxes: boundingBoxes,
        original_filename: originalFilename,
      });
    },
  });
}

// ============================================
// OUTPAINT PHOTO TO RECTANGLE
// ============================================

export interface OutpaintPhotoParams {
  croppedBase64: string;
  mimeType: string;
  contour: Point2D[];
  bboxWidth: number;
  bboxHeight: number;
}

/**
 * Apply generative outpainting to fill non-rectangular photo edges.
 * Only needed when BoundingBox.needs_outpaint is true.
 */
export function useOutpaintPhoto() {
  return useMutation({
    retry: 0,
    mutationFn: async ({
      croppedBase64,
      mimeType,
      contour,
      bboxWidth,
      bboxHeight,
    }: OutpaintPhotoParams): Promise<string> => {
      return apiPost<string>('/api/outpaint', {
        cropped_base64: croppedBase64,
        mime_type: mimeType,
        contour,
        bbox_width: bboxWidth,
        bbox_height: bboxHeight,
      });
    },
    onError: (error) => {
      console.warn('[Outpaint] Outpainting failed, using original crop:', error);
    },
  });
}
