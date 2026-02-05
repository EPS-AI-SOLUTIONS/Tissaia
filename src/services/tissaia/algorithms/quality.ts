/**
 * Tissaia - Quality Analysis Algorithms
 * ======================================
 * Image quality metrics calculation.
 */

import type { QualityScore } from '../types/alchemy';

/**
 * Calculate image sharpness using Laplacian variance
 */
export function calculateSharpness(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  // Apply Laplacian and calculate variance
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;

      // Get grayscale neighbors
      const getGray = (dx: number, dy: number) => {
        const ni = ((y + dy) * width + (x + dx)) * 4;
        return 0.299 * data[ni] + 0.587 * data[ni + 1] + 0.114 * data[ni + 2];
      };

      const center = getGray(0, 0);
      const laplacian = getGray(-1, 0) + getGray(1, 0) + getGray(0, -1) + getGray(0, 1) - 4 * center;

      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;

  // Normalize to 0-100 scale
  return Math.min(100, Math.max(0, Math.sqrt(variance) / 10));
}

/**
 * Calculate noise level using local variance
 */
export function calculateNoise(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  let noiseSum = 0;
  let count = 0;

  const blockSize = 4;

  for (let by = 0; by < height - blockSize; by += blockSize) {
    for (let bx = 0; bx < width - blockSize; bx += blockSize) {
      let sum = 0;
      let sumSq = 0;
      let blockCount = 0;

      for (let y = by; y < by + blockSize; y++) {
        for (let x = bx; x < bx + blockSize; x++) {
          const i = (y * width + x) * 4;
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sum += gray;
          sumSq += gray * gray;
          blockCount++;
        }
      }

      const mean = sum / blockCount;
      const variance = sumSq / blockCount - mean * mean;
      noiseSum += Math.sqrt(variance);
      count++;
    }
  }

  // Normalize (lower noise is better, so invert)
  const avgNoise = noiseSum / count;
  return Math.min(100, Math.max(0, 100 - avgNoise * 2));
}

/**
 * Calculate contrast using RMS contrast
 */
export function calculateContrast(data: Uint8ClampedArray): number {
  const histogram = new Array(256).fill(0);
  const total = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[gray]++;
  }

  // Calculate mean
  let mean = 0;
  for (let i = 0; i < 256; i++) {
    mean += i * histogram[i];
  }
  mean /= total;

  // Calculate variance
  let variance = 0;
  for (let i = 0; i < 256; i++) {
    variance += Math.pow(i - mean, 2) * histogram[i];
  }
  variance /= total;

  // Normalize to 0-100 scale
  return Math.min(100, Math.sqrt(variance) / 1.28);
}

/**
 * Calculate color accuracy (saturation-based)
 */
export function calculateColorAccuracy(data: Uint8ClampedArray): number {
  let saturationSum = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;

    saturationSum += saturation;
  }

  // Normalize to 0-100 scale
  return Math.min(100, (saturationSum / pixelCount) * 200);
}

/**
 * Calculate overall quality score
 */
export function calculateQualityScore(
  data: Uint8ClampedArray,
  width: number,
  height: number
): QualityScore {
  const sharpness = calculateSharpness(data, width, height);
  const noise = calculateNoise(data, width, height);
  const contrast = calculateContrast(data);
  const colorAccuracy = calculateColorAccuracy(data);

  // Weighted overall score
  const overall = sharpness * 0.3 + noise * 0.25 + contrast * 0.25 + colorAccuracy * 0.2;

  return {
    sharpness,
    noise,
    contrast,
    colorAccuracy,
    overall,
  };
}

/**
 * Calculate signal-to-noise ratio (SNR)
 */
export function calculateSNR(data: Uint8ClampedArray, width: number, height: number): number {
  let signalSum = 0;
  let noiseSum = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

      // Calculate local average
      let localSum = 0;
      let localCount = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ni = ((y + dy) * width + (x + dx)) * 4;
          localSum += 0.299 * data[ni] + 0.587 * data[ni + 1] + 0.114 * data[ni + 2];
          localCount++;
        }
      }

      const localAvg = localSum / localCount;
      signalSum += localAvg;
      noiseSum += Math.pow(gray - localAvg, 2);
      count++;
    }
  }

  const signalPower = Math.pow(signalSum / count, 2);
  const noisePower = noiseSum / count;

  if (noisePower === 0) return 100;

  // Convert to dB scale, normalized to 0-100
  const snrDb = 10 * Math.log10(signalPower / noisePower);
  return Math.min(100, Math.max(0, snrDb * 2));
}
