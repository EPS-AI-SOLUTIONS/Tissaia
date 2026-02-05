/**
 * Tissaia Stage 1: Ingestion - Utilities
 * ======================================
 * Utility functions for file and image handling.
 */

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Create a blob from ImageData
 */
export async function imageDataToBlob(
  imageData: ImageData,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 1.0
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

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
      `image/${format}`,
      quality
    );
  });
}

/**
 * Create data URL from ImageData
 */
export function imageDataToDataUrl(
  imageData: ImageData,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 1.0
): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL(`image/${format}`, quality);
}

/**
 * Download ImageData as file
 */
export function downloadImageData(
  imageData: ImageData,
  filename: string,
  format: 'png' | 'jpeg' | 'webp' = 'png'
): void {
  const dataUrl = imageDataToDataUrl(imageData, format);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

/**
 * Calculate approximate memory usage for image
 */
export function calculateMemoryUsage(width: number, height: number): number {
  // RGBA = 4 bytes per pixel
  return width * height * 4;
}

/**
 * Check if image fits in memory budget
 */
export function fitsInMemoryBudget(
  width: number,
  height: number,
  budgetMB: number = 512
): boolean {
  const usage = calculateMemoryUsage(width, height);
  return usage <= budgetMB * 1024 * 1024;
}
