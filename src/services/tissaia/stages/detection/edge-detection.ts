/**
 * Tissaia Stage 2: Detection - Edge Detection
 * ============================================
 * Sobel and edge detection algorithms.
 */

import { KERNELS } from '../../config';
import { getPixel, toGrayscale } from './helpers';

/**
 * Apply convolution kernel to image
 */
export function applyKernel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  kernel: number[],
  kernelSize: number
): Float32Array {
  const result = new Float32Array(width * height);
  const half = Math.floor(kernelSize / 2);

  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      let sum = 0;

      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = x + kx - half;
          const py = y + ky - half;
          const [r, g, b] = getPixel(data, px, py, width);
          const gray = toGrayscale(r, g, b);
          sum += gray * kernel[ky * kernelSize + kx];
        }
      }

      result[y * width + x] = sum;
    }
  }

  return result;
}

/**
 * Sobel edge detection result
 */
export interface SobelResult {
  magnitude: Float32Array;
  direction: Float32Array;
}

/**
 * Sobel edge detection
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
 * Create edge mask from magnitude
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
