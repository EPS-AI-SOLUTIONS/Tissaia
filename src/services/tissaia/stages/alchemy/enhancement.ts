/**
 * Tissaia Stage 4: Alchemy - Enhancement Algorithms
 * ==================================================
 * Image enhancement and restoration algorithms.
 */

import { KERNELS } from '../../config';

/**
 * Apply Gaussian denoising
 */
export function denoise(imageData: ImageData, strength: number): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  const kernel = strength > 2 ? KERNELS.gaussianBlur5 : KERNELS.gaussianBlur3;
  const size = kernel.size;
  const half = Math.floor(size / 2);

  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      let rSum = 0, gSum = 0, bSum = 0;

      for (let ky = 0; ky < size; ky++) {
        for (let kx = 0; kx < size; kx++) {
          const px = x + kx - half;
          const py = y + ky - half;
          const pi = (py * width + px) * 4;
          const weight = kernel.data[ky * size + kx];

          rSum += data[pi] * weight;
          gSum += data[pi + 1] * weight;
          bSum += data[pi + 2] * weight;
        }
      }

      const i = (y * width + x) * 4;
      const blend = Math.min(1, strength / 3);

      output[i] = Math.round(data[i] * (1 - blend) + (rSum / kernel.divisor) * blend);
      output[i + 1] = Math.round(data[i + 1] * (1 - blend) + (gSum / kernel.divisor) * blend);
      output[i + 2] = Math.round(data[i + 2] * (1 - blend) + (bSum / kernel.divisor) * blend);
      output[i + 3] = data[i + 3];
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Apply unsharp mask sharpening
 */
export function sharpen(imageData: ImageData, amount: number): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  // First blur the image
  const blurred = denoise(imageData, 1.0);

  // Apply unsharp mask
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const original = data[i + c];
      const blurredVal = blurred.data[i + c];
      const sharpened = original + amount * (original - blurredVal);
      output[i + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
    }
    output[i + 3] = data[i + 3];
  }

  return new ImageData(output, width, height);
}

/**
 * Adjust contrast using CLAHE-like approach
 */
export function adjustContrast(imageData: ImageData, boost: number): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  // Calculate histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[gray]++;
  }

  // Calculate CDF
  const cdf = new Array(256);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }

  // Normalize CDF
  const cdfMin = cdf.find(v => v > 0) || 0;
  const cdfMax = cdf[255];
  const lut = new Array(256);

  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(((cdf[i] - cdfMin) / (cdfMax - cdfMin)) * 255);
  }

  // Apply with boost factor
  const factor = boost - 1;

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const original = data[i + c];
      const equalized = lut[original];
      output[i + c] = Math.max(0, Math.min(255, Math.round(original + factor * (equalized - original))));
    }
    output[i + 3] = data[i + 3];
  }

  return new ImageData(output, width, height);
}

/**
 * Apply color correction (auto white balance)
 */
export function correctColors(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  // Calculate average color
  let avgR = 0, avgG = 0, avgB = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    avgR += data[i];
    avgG += data[i + 1];
    avgB += data[i + 2];
  }

  avgR /= pixelCount;
  avgG /= pixelCount;
  avgB /= pixelCount;

  // Calculate gray average
  const gray = (avgR + avgG + avgB) / 3;

  // Calculate correction factors
  const rFactor = gray / avgR;
  const gFactor = gray / avgG;
  const bFactor = gray / avgB;

  // Apply correction
  for (let i = 0; i < data.length; i += 4) {
    output[i] = Math.max(0, Math.min(255, Math.round(data[i] * rFactor)));
    output[i + 1] = Math.max(0, Math.min(255, Math.round(data[i + 1] * gFactor)));
    output[i + 2] = Math.max(0, Math.min(255, Math.round(data[i + 2] * bFactor)));
    output[i + 3] = data[i + 3];
  }

  return new ImageData(output, width, height);
}

/**
 * Adjust brightness
 */
export function adjustBrightness(imageData: ImageData, amount: number): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let i = 0; i < data.length; i += 4) {
    output[i] = Math.max(0, Math.min(255, data[i] + amount));
    output[i + 1] = Math.max(0, Math.min(255, data[i + 1] + amount));
    output[i + 2] = Math.max(0, Math.min(255, data[i + 2] + amount));
    output[i + 3] = data[i + 3];
  }

  return new ImageData(output, width, height);
}

/**
 * Adjust saturation
 */
export function adjustSaturation(imageData: ImageData, factor: number): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    output[i] = Math.max(0, Math.min(255, Math.round(gray + (r - gray) * factor)));
    output[i + 1] = Math.max(0, Math.min(255, Math.round(gray + (g - gray) * factor)));
    output[i + 2] = Math.max(0, Math.min(255, Math.round(gray + (b - gray) * factor)));
    output[i + 3] = data[i + 3];
  }

  return new ImageData(output, width, height);
}

/**
 * Apply gamma correction
 */
export function gammaCorrection(imageData: ImageData, gamma: number): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  const gammaLut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    gammaLut[i] = Math.round(Math.pow(i / 255, 1 / gamma) * 255);
  }

  for (let i = 0; i < data.length; i += 4) {
    output[i] = gammaLut[data[i]];
    output[i + 1] = gammaLut[data[i + 1]];
    output[i + 2] = gammaLut[data[i + 2]];
    output[i + 3] = data[i + 3];
  }

  return new ImageData(output, width, height);
}

/**
 * Calculate histogram
 */
export function calculateHistogram(data: Uint8ClampedArray): {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
} {
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const lum = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    r[data[i]]++;
    g[data[i + 1]]++;
    b[data[i + 2]]++;
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    lum[gray]++;
  }

  return { r, g, b, lum };
}
