// src/services/pipeline/browser-crop.ts
/**
 * Browser Canvas Crop
 * ===================
 * Canvas-based image cropping for browser mode (when Tauri is unavailable).
 * Extracted from hooks/api/useCrop.ts for use by the pipeline.
 */
import { v4 as uuidv4 } from 'uuid';
import type { BoundingBox, CroppedPhoto, CropResult } from '../../hooks/api/types';

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

function cropRegion(
  img: HTMLImageElement,
  box: BoundingBox,
  paddingFactor = 0.02,
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
  if (!cropCtx) throw new Error('Failed to get canvas 2d context');
  cropCtx.drawImage(img, px, py, pw, ph, 0, 0, pw, ph);

  // Apply rotation correction
  const rotation = box.rotation_angle ?? 0;
  const normalizedRotation = (((Math.round(rotation / 90) * 90) % 360) + 360) % 360;

  if (normalizedRotation === 0) {
    return { dataUrl: cropCanvas.toDataURL('image/png'), width: pw, height: ph };
  }

  const correctionAngle = (360 - normalizedRotation) % 360;
  const swap = correctionAngle === 90 || correctionAngle === 270;
  const outW = swap ? ph : pw;
  const outH = swap ? pw : ph;

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = outW;
  rotCanvas.height = outH;
  const rotCtx = rotCanvas.getContext('2d');
  if (!rotCtx) throw new Error('Failed to get canvas 2d context');

  rotCtx.translate(outW / 2, outH / 2);
  rotCtx.rotate((correctionAngle * Math.PI) / 180);
  rotCtx.drawImage(cropCanvas, -pw / 2, -ph / 2);

  return { dataUrl: rotCanvas.toDataURL('image/png'), width: outW, height: outH };
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] || dataUrl;
}

/**
 * Crop multiple regions from an image using Canvas API.
 * Browser-mode equivalent of the Rust `crop_photos` command.
 */
export async function cropRegionBrowser(
  file: File,
  boundingBoxes: BoundingBox[],
  originalFilename: string,
  paddingFactor = 0.02,
): Promise<CropResult> {
  const start = performance.now();
  const img = await loadImage(file);

  const photos: CroppedPhoto[] = boundingBoxes.map((box, idx) => {
    const cropped = cropRegion(img, box, paddingFactor);
    return {
      id: uuidv4(),
      index: idx,
      image_base64: dataUrlToBase64(cropped.dataUrl),
      mime_type: 'image/png',
      width: cropped.width,
      height: cropped.height,
      source_box: box,
    };
  });

  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    original_filename: originalFilename,
    photos,
    processing_time_ms: Math.round(performance.now() - start),
  };
}
