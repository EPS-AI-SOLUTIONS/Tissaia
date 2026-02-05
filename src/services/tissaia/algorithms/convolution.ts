/**
 * Tissaia - Convolution Algorithms
 * =================================
 * Image convolution and kernel operations.
 */

import type { Kernel } from '../types/basic';
import { getPixel, toGrayscale, clamp } from '../utils/pixel';

/**
 * Apply convolution kernel to grayscale image
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
 * Apply convolution kernel to RGB image
 */
export function applyKernelRGB(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  kernel: Kernel
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data);
  const { data: kernelData, size, divisor, offset } = kernel;
  const half = Math.floor(size / 2);

  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      let rSum = 0, gSum = 0, bSum = 0;

      for (let ky = 0; ky < size; ky++) {
        for (let kx = 0; kx < size; kx++) {
          const px = x + kx - half;
          const py = y + ky - half;
          const [r, g, b] = getPixel(data, px, py, width);
          const weight = kernelData[ky * size + kx];

          rSum += r * weight;
          gSum += g * weight;
          bSum += b * weight;
        }
      }

      const i = (y * width + x) * 4;
      output[i] = clamp(Math.round(rSum / divisor + offset), 0, 255);
      output[i + 1] = clamp(Math.round(gSum / divisor + offset), 0, 255);
      output[i + 2] = clamp(Math.round(bSum / divisor + offset), 0, 255);
      output[i + 3] = data[i + 3];
    }
  }

  return output;
}

/**
 * Apply separable convolution (faster for separable kernels)
 */
export function applySeparableKernel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  horizontalKernel: number[],
  verticalKernel: number[],
  divisor: number
): Uint8ClampedArray {
  const size = horizontalKernel.length;
  const half = Math.floor(size / 2);
  const temp = new Float32Array(width * height * 3);
  const output = new Uint8ClampedArray(data);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = half; x < width - half; x++) {
      let rSum = 0, gSum = 0, bSum = 0;

      for (let k = 0; k < size; k++) {
        const px = x + k - half;
        const [r, g, b] = getPixel(data, px, y, width);
        const weight = horizontalKernel[k];

        rSum += r * weight;
        gSum += g * weight;
        bSum += b * weight;
      }

      const i = (y * width + x) * 3;
      temp[i] = rSum;
      temp[i + 1] = gSum;
      temp[i + 2] = bSum;
    }
  }

  // Vertical pass
  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      let rSum = 0, gSum = 0, bSum = 0;

      for (let k = 0; k < size; k++) {
        const py = y + k - half;
        const i = (py * width + x) * 3;
        const weight = verticalKernel[k];

        rSum += temp[i] * weight;
        gSum += temp[i + 1] * weight;
        bSum += temp[i + 2] * weight;
      }

      const oi = (y * width + x) * 4;
      output[oi] = clamp(Math.round(rSum / divisor), 0, 255);
      output[oi + 1] = clamp(Math.round(gSum / divisor), 0, 255);
      output[oi + 2] = clamp(Math.round(bSum / divisor), 0, 255);
      output[oi + 3] = data[oi + 3];
    }
  }

  return output;
}
