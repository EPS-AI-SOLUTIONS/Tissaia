/**
 * Tissaia Stage 2: Detection - Helpers
 * =====================================
 * Helper functions for detection stage.
 */

/**
 * Generate unique ID with prefix
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get pixel index in RGBA buffer
 */
export function getPixelIndex(x: number, y: number, width: number): number {
  return (y * width + x) * 4;
}

/**
 * Get pixel values at coordinates
 */
export function getPixel(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number
): [number, number, number, number] {
  const i = getPixelIndex(x, y, width);
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

/**
 * Convert RGB to grayscale
 */
export function toGrayscale(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * Calculate luminance
 */
export function getLuminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
