/**
 * Tissaia - Edge Detection Algorithms
 * ====================================
 * Sobel, Canny, and other edge detection methods.
 */

import { KERNELS } from '../config';
import { applyKernel } from './convolution';

/**
 * Sobel edge detection result
 */
export interface SobelResult {
  magnitude: Float32Array;
  direction: Float32Array;
}

/**
 * Apply Sobel edge detection
 */
export function sobelEdgeDetection(
  data: Uint8ClampedArray,
  width: number,
  height: number
): SobelResult {
  const gx = applyKernel(data, width, height, KERNELS.sobelX.data, KERNELS.sobelX.size);
  const gy = applyKernel(data, width, height, KERNELS.sobelY.data, KERNELS.sobelY.size);

  const magnitude = new Float32Array(width * height);
  const direction = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    magnitude[i] = Math.sqrt(gx[i] * gx[i] + gy[i] * gy[i]);
    direction[i] = Math.atan2(gy[i], gx[i]);
  }

  return { magnitude, direction };
}

/**
 * Create binary edge mask from magnitude
 */
export function createEdgeMask(
  magnitude: Float32Array,
  width: number,
  height: number,
  threshold: number
): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(width * height);

  for (let i = 0; i < width * height; i++) {
    mask[i] = magnitude[i] > threshold ? 255 : 0;
  }

  return mask;
}

/**
 * Apply non-maximum suppression for thin edges
 */
export function nonMaxSuppression(
  magnitude: Float32Array,
  direction: Float32Array,
  width: number,
  height: number
): Float32Array {
  const output = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const angle = direction[i] * (180 / Math.PI);
      const normalizedAngle = angle < 0 ? angle + 180 : angle;

      let neighbor1 = 0, neighbor2 = 0;

      // Determine gradient direction
      if ((normalizedAngle >= 0 && normalizedAngle < 22.5) ||
          (normalizedAngle >= 157.5 && normalizedAngle <= 180)) {
        neighbor1 = magnitude[y * width + (x - 1)];
        neighbor2 = magnitude[y * width + (x + 1)];
      } else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
        neighbor1 = magnitude[(y - 1) * width + (x + 1)];
        neighbor2 = magnitude[(y + 1) * width + (x - 1)];
      } else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
        neighbor1 = magnitude[(y - 1) * width + x];
        neighbor2 = magnitude[(y + 1) * width + x];
      } else {
        neighbor1 = magnitude[(y - 1) * width + (x - 1)];
        neighbor2 = magnitude[(y + 1) * width + (x + 1)];
      }

      // Suppress if not local maximum
      if (magnitude[i] >= neighbor1 && magnitude[i] >= neighbor2) {
        output[i] = magnitude[i];
      } else {
        output[i] = 0;
      }
    }
  }

  return output;
}

/**
 * Apply double threshold for Canny edge detection
 */
export function doubleThreshold(
  magnitude: Float32Array,
  width: number,
  height: number,
  lowThreshold: number,
  highThreshold: number
): { strong: Uint8ClampedArray; weak: Uint8ClampedArray } {
  const strong = new Uint8ClampedArray(width * height);
  const weak = new Uint8ClampedArray(width * height);

  for (let i = 0; i < width * height; i++) {
    if (magnitude[i] >= highThreshold) {
      strong[i] = 255;
    } else if (magnitude[i] >= lowThreshold) {
      weak[i] = 255;
    }
  }

  return { strong, weak };
}

/**
 * Apply edge tracking by hysteresis
 */
export function hysteresis(
  strong: Uint8ClampedArray,
  weak: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(strong);

  // Connect weak edges that are adjacent to strong edges
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;

      if (weak[i] > 0) {
        // Check 8-connected neighbors for strong edges
        const hasStrongNeighbor =
          strong[(y - 1) * width + (x - 1)] > 0 ||
          strong[(y - 1) * width + x] > 0 ||
          strong[(y - 1) * width + (x + 1)] > 0 ||
          strong[y * width + (x - 1)] > 0 ||
          strong[y * width + (x + 1)] > 0 ||
          strong[(y + 1) * width + (x - 1)] > 0 ||
          strong[(y + 1) * width + x] > 0 ||
          strong[(y + 1) * width + (x + 1)] > 0;

        if (hasStrongNeighbor) {
          output[i] = 255;
        }
      }
    }
  }

  return output;
}

/**
 * Full Canny edge detection
 */
export function cannyEdgeDetection(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  lowThreshold: number,
  highThreshold: number
): Uint8ClampedArray {
  // Step 1: Sobel edge detection
  const { magnitude, direction } = sobelEdgeDetection(data, width, height);

  // Step 2: Non-maximum suppression
  const suppressed = nonMaxSuppression(magnitude, direction, width, height);

  // Step 3: Double threshold
  const { strong, weak } = doubleThreshold(
    suppressed,
    width,
    height,
    lowThreshold,
    highThreshold
  );

  // Step 4: Hysteresis
  return hysteresis(strong, weak, width, height);
}

/**
 * Calculate Laplacian for edge detection
 */
export function laplacianEdgeDetection(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Float32Array {
  return applyKernel(data, width, height, KERNELS.laplacian.data, KERNELS.laplacian.size);
}
