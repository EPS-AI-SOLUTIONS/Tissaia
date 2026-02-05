/**
 * Tissaia - Image Enhancement Algorithms
 * =======================================
 * Denoising, sharpening, contrast, and color correction.
 */

import { KERNELS } from '../config';
import { clamp } from '../utils/pixel';

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

  // Apply unsharp mask: original + amount * (original - blurred)
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const original = data[i + c];
      const blurredVal = blurred.data[i + c];
      const sharpened = original + amount * (original - blurredVal);
      output[i + c] = clamp(Math.round(sharpened), 0, 255);
    }
    output[i + 3] = data[i + 3];
  }

  return new ImageData(output, width, height);
}

/**
 * Calculate histogram
 */
export function calculateHistogram(data: Uint8ClampedArray): {
  red: number[];
  green: number[];
  blue: number[];
  luminance: number[];
} {
  const red = new Array(256).fill(0);
  const green = new Array(256).fill(0);
  const blue = new Array(256).fill(0);
  const luminance = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    red[data[i]]++;
    green[data[i + 1]]++;
    blue[data[i + 2]]++;

    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    luminance[lum]++;
  }

  return { red, green, blue, luminance };
}

/**
 * Adjust contrast using histogram equalization
 */
export function adjustContrast(imageData: ImageData, boost: number): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  // Calculate luminance histogram
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
      output[i + c] = clamp(Math.round(original + factor * (equalized - original)), 0, 255);
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
  const rFactor = avgR > 0 ? gray / avgR : 1;
  const gFactor = avgG > 0 ? gray / avgG : 1;
  const bFactor = avgB > 0 ? gray / avgB : 1;

  // Apply correction
  for (let i = 0; i < data.length; i += 4) {
    output[i] = clamp(Math.round(data[i] * rFactor), 0, 255);
    output[i + 1] = clamp(Math.round(data[i + 1] * gFactor), 0, 255);
    output[i + 2] = clamp(Math.round(data[i + 2] * bFactor), 0, 255);
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

  const adjustment = Math.round(amount * 255);

  for (let i = 0; i < data.length; i += 4) {
    output[i] = clamp(data[i] + adjustment, 0, 255);
    output[i + 1] = clamp(data[i + 1] + adjustment, 0, 255);
    output[i + 2] = clamp(data[i + 2] + adjustment, 0, 255);
    output[i + 3] = data[i + 3];
  }

  return new ImageData(output, width, height);
}

/**
 * Adjust saturation
 */
export function adjustSaturation(imageData: ImageData, amount: number): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    output[i] = clamp(Math.round(gray + amount * (r - gray)), 0, 255);
    output[i + 1] = clamp(Math.round(gray + amount * (g - gray)), 0, 255);
    output[i + 2] = clamp(Math.round(gray + amount * (b - gray)), 0, 255);
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

  // Pre-compute lookup table
  const lut = new Uint8Array(256);
  const invGamma = 1 / gamma;

  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(Math.pow(i / 255, invGamma) * 255);
  }

  for (let i = 0; i < data.length; i += 4) {
    output[i] = lut[data[i]];
    output[i + 1] = lut[data[i + 1]];
    output[i + 2] = lut[data[i + 2]];
    output[i + 3] = data[i + 3];
  }

  return new ImageData(output, width, height);
}
