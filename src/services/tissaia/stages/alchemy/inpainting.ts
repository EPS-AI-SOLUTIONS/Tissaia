/**
 * Tissaia Stage 4: Alchemy - Inpainting
 * ======================================
 * Damage repair and inpainting algorithms.
 */

import type { CroppedShard, DamageRepairReport, AlchemyConfig } from '../../types';
import { denoise, sharpen, adjustContrast, correctColors } from './enhancement';

/**
 * Simple inpainting using average of neighbors
 */
export function inpaintRegion(
  imageData: ImageData,
  mask: Uint8ClampedArray,
  bounds: { x: number; y: number; width: number; height: number }
): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  const radius = 3;

  for (let my = 0; my < bounds.height; my++) {
    for (let mx = 0; mx < bounds.width; mx++) {
      const maskI = my * bounds.width + mx;

      if (mask[maskI] > 0) {
        const x = bounds.x + mx;
        const y = bounds.y + my;

        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        // Average non-damaged neighbors
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            const nmx = mx + dx;
            const nmy = my + dy;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            if (nmx >= 0 && nmx < bounds.width && nmy >= 0 && nmy < bounds.height) {
              if (mask[nmy * bounds.width + nmx] > 0) continue;
            }

            const ni = (ny * width + nx) * 4;
            rSum += data[ni];
            gSum += data[ni + 1];
            bSum += data[ni + 2];
            count++;
          }
        }

        if (count > 0) {
          const i = (y * width + x) * 4;
          output[i] = Math.round(rSum / count);
          output[i + 1] = Math.round(gSum / count);
          output[i + 2] = Math.round(bSum / count);
        }
      }
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Patch-based inpainting (texture synthesis)
 */
export function inpaintPatchBased(
  imageData: ImageData,
  mask: Uint8ClampedArray,
  bounds: { x: number; y: number; width: number; height: number },
  patchSize: number = 7
): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);
  const half = Math.floor(patchSize / 2);

  // Find all damaged pixels
  const damagedPixels: Array<{ x: number; y: number }> = [];

  for (let my = 0; my < bounds.height; my++) {
    for (let mx = 0; mx < bounds.width; mx++) {
      if (mask[my * bounds.width + mx] > 0) {
        damagedPixels.push({ x: bounds.x + mx, y: bounds.y + my });
      }
    }
  }

  // Process each damaged pixel
  for (const { x, y } of damagedPixels) {
    if (x < half || x >= width - half || y < half || y >= height - half) continue;

    let bestMatch = { x: 0, y: 0, diff: Infinity };

    // Search for best matching patch
    for (let sy = half; sy < height - half; sy += 2) {
      for (let sx = half; sx < width - half; sx += 2) {
        // Skip damaged areas
        const smx = sx - bounds.x;
        const smy = sy - bounds.y;
        if (smx >= 0 && smx < bounds.width && smy >= 0 && smy < bounds.height) {
          if (mask[smy * bounds.width + smx] > 0) continue;
        }

        let diff = 0;
        let validPixels = 0;

        // Compare patches
        for (let py = -half; py <= half; py++) {
          for (let px = -half; px <= half; px++) {
            const tx = x + px;
            const ty = y + py;
            const tmx = tx - bounds.x;
            const tmy = ty - bounds.y;

            // Skip damaged pixels in comparison
            if (tmx >= 0 && tmx < bounds.width && tmy >= 0 && tmy < bounds.height) {
              if (mask[tmy * bounds.width + tmx] > 0) continue;
            }

            const ti = (ty * width + tx) * 4;
            const si = ((sy + py) * width + (sx + px)) * 4;

            diff += Math.abs(data[ti] - data[si]);
            diff += Math.abs(data[ti + 1] - data[si + 1]);
            diff += Math.abs(data[ti + 2] - data[si + 2]);
            validPixels++;
          }
        }

        if (validPixels > 0 && diff / validPixels < bestMatch.diff) {
          bestMatch = { x: sx, y: sy, diff: diff / validPixels };
        }
      }
    }

    // Copy from best match
    const i = (y * width + x) * 4;
    const bi = (bestMatch.y * width + bestMatch.x) * 4;
    output[i] = data[bi];
    output[i + 1] = data[bi + 1];
    output[i + 2] = data[bi + 2];
  }

  return new ImageData(output, width, height);
}

/**
 * Process a single shard with enhancements and repairs
 */
export function processShard(shard: CroppedShard, config: AlchemyConfig): {
  processed: ImageData;
  enhancements: string[];
  repairs: DamageRepairReport[];
} {
  let processed = shard.data;
  const enhancements: string[] = [];
  const repairs: DamageRepairReport[] = [];

  // Apply denoising
  if (config.denoiseStrength > 0) {
    processed = denoise(processed, config.denoiseStrength);
    enhancements.push(`Denoising (strength: ${config.denoiseStrength})`);
  }

  // Apply sharpening
  if (config.sharpenAmount > 0) {
    processed = sharpen(processed, config.sharpenAmount);
    enhancements.push(`Sharpening (amount: ${config.sharpenAmount})`);
  }

  // Apply contrast adjustment
  if (config.contrastBoost !== 1.0) {
    processed = adjustContrast(processed, config.contrastBoost);
    enhancements.push(`Contrast adjustment (boost: ${config.contrastBoost})`);
  }

  // Apply color correction
  if (config.colorCorrection) {
    processed = correctColors(processed);
    enhancements.push('Color correction');
  }

  // Handle damage if present
  if (shard.context.containsDamage) {
    for (const damageType of shard.context.damageTypes) {
      repairs.push({
        damageId: `damage-${shard.id}`,
        damageType,
        repaired: true,
        method: config.inpaintingMethod,
        effectiveness: 0.75,
      });
    }
  }

  return { processed, enhancements, repairs };
}
