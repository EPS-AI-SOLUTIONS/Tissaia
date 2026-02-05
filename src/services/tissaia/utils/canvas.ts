/**
 * Tissaia - Canvas Utilities
 * ==========================
 * Canvas and ImageData manipulation utilities.
 */

import type { Rectangle } from '../types/basic';

/**
 * Create canvas with dimensions
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Get 2D context from canvas
 */
export function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  return ctx;
}

/**
 * Create ImageData from dimensions
 */
export function createImageData(width: number, height: number): ImageData {
  return new ImageData(width, height);
}

/**
 * Clone ImageData
 */
export function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

/**
 * Extract region from ImageData
 */
export function extractRegion(
  imageData: ImageData,
  bounds: Rectangle
): ImageData {
  const { data, width } = imageData;
  const regionData = new Uint8ClampedArray(bounds.width * bounds.height * 4);

  for (let y = 0; y < bounds.height; y++) {
    for (let x = 0; x < bounds.width; x++) {
      const srcX = bounds.x + x;
      const srcY = bounds.y + y;

      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < imageData.height) {
        const srcI = (srcY * width + srcX) * 4;
        const dstI = (y * bounds.width + x) * 4;

        regionData[dstI] = data[srcI];
        regionData[dstI + 1] = data[srcI + 1];
        regionData[dstI + 2] = data[srcI + 2];
        regionData[dstI + 3] = data[srcI + 3];
      }
    }
  }

  return new ImageData(regionData, bounds.width, bounds.height);
}

/**
 * Put region into ImageData at position
 */
export function putRegion(
  target: ImageData,
  source: ImageData,
  x: number,
  y: number
): void {
  const { data: targetData, width: targetWidth } = target;
  const { data: sourceData, width: sourceWidth, height: sourceHeight } = source;

  for (let sy = 0; sy < sourceHeight; sy++) {
    for (let sx = 0; sx < sourceWidth; sx++) {
      const tx = x + sx;
      const ty = y + sy;

      if (tx >= 0 && tx < targetWidth && ty >= 0 && ty < target.height) {
        const srcI = (sy * sourceWidth + sx) * 4;
        const dstI = (ty * targetWidth + tx) * 4;

        targetData[dstI] = sourceData[srcI];
        targetData[dstI + 1] = sourceData[srcI + 1];
        targetData[dstI + 2] = sourceData[srcI + 2];
        targetData[dstI + 3] = sourceData[srcI + 3];
      }
    }
  }
}

/**
 * Convert ImageData to Blob
 */
export async function imageDataToBlob(
  imageData: ImageData,
  format: string = 'image/png',
  quality: number = 1.0
): Promise<Blob> {
  const canvas = createCanvas(imageData.width, imageData.height);
  const ctx = getContext(canvas);
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Convert ImageData to data URL
 */
export function imageDataToDataUrl(
  imageData: ImageData,
  format: string = 'image/png',
  quality: number = 1.0
): string {
  const canvas = createCanvas(imageData.width, imageData.height);
  const ctx = getContext(canvas);
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL(format, quality);
}

/**
 * Load image from URL to ImageData
 */
export async function loadImageData(url: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = createCanvas(img.width, img.height);
      const ctx = getContext(canvas);
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Resize ImageData
 */
export function resizeImageData(
  imageData: ImageData,
  newWidth: number,
  newHeight: number
): ImageData {
  const srcCanvas = createCanvas(imageData.width, imageData.height);
  const srcCtx = getContext(srcCanvas);
  srcCtx.putImageData(imageData, 0, 0);

  const dstCanvas = createCanvas(newWidth, newHeight);
  const dstCtx = getContext(dstCanvas);

  dstCtx.imageSmoothingEnabled = true;
  dstCtx.imageSmoothingQuality = 'high';
  dstCtx.drawImage(srcCanvas, 0, 0, newWidth, newHeight);

  return dstCtx.getImageData(0, 0, newWidth, newHeight);
}
