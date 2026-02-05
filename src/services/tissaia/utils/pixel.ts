/**
 * Tissaia - Pixel Utilities
 * =========================
 * Low-level pixel manipulation functions.
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
 * Get pixel RGBA values at coordinates
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
 * Set pixel RGBA values at coordinates
 */
export function setPixel(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  r: number,
  g: number,
  b: number,
  a: number = 255
): void {
  const i = getPixelIndex(x, y, width);
  data[i] = clamp(r, 0, 255);
  data[i + 1] = clamp(g, 0, 255);
  data[i + 2] = clamp(b, 0, 255);
  data[i + 3] = clamp(a, 0, 255);
}

/**
 * Convert RGB to grayscale using ITU-R BT.601
 */
export function toGrayscale(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * Calculate relative luminance (ITU-R BT.709)
 */
export function getLuminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return [h, s, l];
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const val = Math.round(l * 255);
    return [val, val, val];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}
