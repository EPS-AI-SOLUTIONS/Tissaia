// src/hooks/api/useCrop.ts
/**
 * Crop Hooks
 * ==========
 * Hooks for photo detection and cropping operations.
 * Browser mode uses Canvas API for real image cropping.
 */
import { useMutation } from '@tanstack/react-query';
import { isTauri } from '../../utils/tauri';
import { MOCK_DETECTION_DELAY, mockDetectionResult } from './mocks';
import type { BoundingBox, CroppedPhoto, CropResult, DetectionResult } from './types';
import { delay, fileToBase64, safeInvoke } from './utils';

// ============================================
// CANVAS CROP UTILITY
// ============================================

/**
 * Load an image from a File/Blob into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Crop a region from an image using Canvas API.
 * Bounding box uses normalized 0-1000 coordinates.
 */
function cropRegion(
  img: HTMLImageElement,
  box: BoundingBox,
  paddingFactor: number = 0.02,
): { dataUrl: string; width: number; height: number } {
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  // Convert 0-1000 normalized coords to pixels
  let px = (box.x / 1000) * imgW;
  let py = (box.y / 1000) * imgH;
  let pw = (box.width / 1000) * imgW;
  let ph = (box.height / 1000) * imgH;

  // Add padding
  const padX = pw * paddingFactor;
  const padY = ph * paddingFactor;
  px = Math.max(0, px - padX);
  py = Math.max(0, py - padY);
  pw = Math.min(imgW - px, pw + 2 * padX);
  ph = Math.min(imgH - py, ph + 2 * padY);

  // Ensure minimum size
  pw = Math.max(1, Math.round(pw));
  ph = Math.max(1, Math.round(ph));
  px = Math.round(px);
  py = Math.round(py);

  // First crop the region
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = pw;
  cropCanvas.height = ph;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) {
    throw new Error('Failed to get canvas 2d context');
  }
  cropCtx.drawImage(img, px, py, pw, ph, 0, 0, pw, ph);

  // Apply rotation CORRECTION.
  // rotation_angle = current CW rotation from upright, so correction = (360 - angle).
  // 90° detected (heads right) → correct with 270° CW (= 90° CCW)
  // 180° detected (upside down) → correct with 180°
  // 270° detected (heads left) → correct with 90° CW
  const rotation = box.rotation_angle ?? 0;
  const normalizedRotation = (((Math.round(rotation / 90) * 90) % 360) + 360) % 360;

  if (normalizedRotation === 0) {
    return { dataUrl: cropCanvas.toDataURL('image/png'), width: pw, height: ph };
  }

  // Invert: correction = (360 - detected) to undo the rotation
  const correctionAngle = (360 - normalizedRotation) % 360;

  const swap = correctionAngle === 90 || correctionAngle === 270;
  const outW = swap ? ph : pw;
  const outH = swap ? pw : ph;

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = outW;
  rotCanvas.height = outH;
  const rotCtx = rotCanvas.getContext('2d');
  if (!rotCtx) {
    throw new Error('Failed to get canvas 2d context');
  }

  rotCtx.translate(outW / 2, outH / 2);
  rotCtx.rotate((correctionAngle * Math.PI) / 180);
  rotCtx.drawImage(cropCanvas, -pw / 2, -ph / 2);

  return { dataUrl: rotCanvas.toDataURL('image/png'), width: outW, height: outH };
}

/**
 * Extract base64 data from a data URL (strip "data:image/png;base64," prefix)
 */
function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] || dataUrl;
}

// ============================================
// DETECT PHOTOS
// ============================================

export interface DetectPhotosParams {
  file: File;
}

export function useDetectPhotos() {
  return useMutation({
    retry: 1,
    retryDelay: 2000,
    mutationFn: async ({ file }: DetectPhotosParams): Promise<DetectionResult> => {
      if (!isTauri()) {
        await delay(MOCK_DETECTION_DELAY);
        return {
          ...mockDetectionResult,
          id: `mock-det-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
      }

      const { base64, mimeType } = await fileToBase64(file);
      return safeInvoke<DetectionResult>('detect_photos', {
        imageBase64: base64,
        mimeType,
      });
    },
  });
}

// ============================================
// CROP PHOTOS
// ============================================

export interface CropPhotosParams {
  file: File;
  boundingBoxes: BoundingBox[];
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
      if (!isTauri()) {
        // Browser mode: use Canvas API for real cropping
        const img = await loadImage(file);

        const photos: CroppedPhoto[] = boundingBoxes.map((box, idx) => {
          const cropped = cropRegion(img, box);
          return {
            id: `mock-photo-${idx}-${Date.now()}`,
            index: idx,
            image_base64: dataUrlToBase64(cropped.dataUrl),
            mime_type: 'image/png',
            width: cropped.width,
            height: cropped.height,
            source_box: box,
          };
        });

        return {
          id: `mock-crop-${Date.now()}`,
          timestamp: new Date().toISOString(),
          original_filename: originalFilename,
          photos,
          processing_time_ms: 100,
        };
      }

      const { base64, mimeType } = await fileToBase64(file);
      return safeInvoke<CropResult>('crop_photos', {
        imageBase64: base64,
        mimeType,
        boundingBoxes,
        originalFilename,
      });
    },
  });
}
