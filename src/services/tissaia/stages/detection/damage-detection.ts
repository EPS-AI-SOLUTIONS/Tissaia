/**
 * Tissaia Stage 2: Detection - Damage Detection
 * ==============================================
 * Detect various types of image damage.
 */

import type { Rectangle, DamageRegion, DamageType, DamageSeverity } from '../../types';
import { generateId, getPixel, toGrayscale } from './helpers';
import { findConnectedComponents, extractRegionMask } from './region-analysis';

/**
 * Detect stains (unusual color regions)
 */
export function detectStains(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): DamageRegion[] {
  const damages: DamageRegion[] = [];
  const mask = new Uint8ClampedArray(width * height);

  // Calculate average color
  let avgR = 0, avgG = 0, avgB = 0;
  const pixelCount = width * height;

  for (let i = 0; i < data.length; i += 4) {
    avgR += data[i];
    avgG += data[i + 1];
    avgB += data[i + 2];
  }

  avgR /= pixelCount;
  avgG /= pixelCount;
  avgB /= pixelCount;

  // Find pixels that deviate significantly from average
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(data, x, y, width);

      // Check for brownish/yellowish stains
      const isBrownish = r > g && g > b && (r - b) > 30;
      const isYellowish = r > 150 && g > 150 && b < 100;

      // Check deviation from average
      const deviation = Math.sqrt(
        Math.pow(r - avgR, 2) +
        Math.pow(g - avgG, 2) +
        Math.pow(b - avgB, 2)
      );

      if ((isBrownish || isYellowish) && deviation > threshold) {
        mask[y * width + x] = 255;
      }
    }
  }

  // Find connected stain regions
  const regions = findConnectedComponents(mask, width, height, 50);

  for (const bounds of regions) {
    const area = bounds.width * bounds.height;
    const severity: DamageSeverity =
      area > 10000 ? 'high' :
      area > 2000 ? 'medium' : 'low';

    damages.push({
      id: generateId('stain'),
      type: 'stain',
      bounds,
      severity,
      mask: extractRegionMask(mask, width, bounds),
      area,
      confidence: 0.7,
    });
  }

  return damages;
}

/**
 * Detect scratches and tears (linear damage)
 */
export function detectScratches(
  edgeMagnitude: Float32Array,
  edgeDirection: Float32Array,
  width: number,
  height: number,
  threshold: number
): DamageRegion[] {
  const damages: DamageRegion[] = [];
  const mask = new Uint8ClampedArray(width * height);

  // Look for high edge magnitude with consistent direction
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;

      if (edgeMagnitude[i] > threshold * 1.5) {
        // Check if neighbors have similar direction
        const dir = edgeDirection[i];
        let consistentNeighbors = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ni = (y + dy) * width + (x + dx);
            const dirDiff = Math.abs(edgeDirection[ni] - dir);
            if (dirDiff < 0.3 || Math.abs(dirDiff - Math.PI) < 0.3) {
              consistentNeighbors++;
            }
          }
        }

        if (consistentNeighbors >= 4) {
          mask[i] = 255;
        }
      }
    }
  }

  const regions = findConnectedComponents(mask, width, height, 20);

  for (const bounds of regions) {
    const aspectRatio = Math.max(bounds.width, bounds.height) /
                        Math.min(bounds.width, bounds.height);

    // Scratches are typically elongated
    if (aspectRatio > 3) {
      const area = bounds.width * bounds.height;
      const severity: DamageSeverity =
        area > 500 ? 'high' :
        area > 100 ? 'medium' : 'low';

      damages.push({
        id: generateId('scratch'),
        type: 'scratch',
        bounds,
        severity,
        mask: extractRegionMask(mask, width, bounds),
        area,
        confidence: 0.6,
      });
    }
  }

  return damages;
}

/**
 * Detect fading (low contrast regions)
 */
export function detectFading(
  data: Uint8ClampedArray,
  width: number,
  height: number
): DamageRegion[] {
  const damages: DamageRegion[] = [];
  const blockSize = 32;
  const mask = new Uint8ClampedArray(width * height);

  // Analyze blocks for low contrast
  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      let min = 255, max = 0;

      for (let y = by; y < Math.min(by + blockSize, height); y++) {
        for (let x = bx; x < Math.min(bx + blockSize, width); x++) {
          const [r, g, b] = getPixel(data, x, y, width);
          const gray = toGrayscale(r, g, b);
          min = Math.min(min, gray);
          max = Math.max(max, gray);
        }
      }

      const contrast = max - min;

      // Low contrast indicates fading
      if (contrast < 30 && max > 200) {
        for (let y = by; y < Math.min(by + blockSize, height); y++) {
          for (let x = bx; x < Math.min(bx + blockSize, width); x++) {
            mask[y * width + x] = 255;
          }
        }
      }
    }
  }

  const regions = findConnectedComponents(mask, width, height, blockSize * blockSize);

  for (const bounds of regions) {
    const area = bounds.width * bounds.height;
    const areaRatio = area / (width * height);
    const severity: DamageSeverity =
      areaRatio > 0.3 ? 'high' :
      areaRatio > 0.1 ? 'medium' : 'low';

    damages.push({
      id: generateId('fade'),
      type: 'fade',
      bounds,
      severity,
      mask: extractRegionMask(mask, width, bounds),
      area,
      confidence: 0.5,
    });
  }

  return damages;
}

/**
 * Detect noise (high frequency variations)
 */
export function detectNoise(
  data: Uint8ClampedArray,
  width: number,
  height: number
): DamageRegion[] {
  const damages: DamageRegion[] = [];
  const mask = new Uint8ClampedArray(width * height);
  const blockSize = 8;

  for (let by = 0; by < height - blockSize; by += blockSize) {
    for (let bx = 0; bx < width - blockSize; bx += blockSize) {
      let sum = 0, sumSq = 0, count = 0;

      for (let y = by; y < by + blockSize; y++) {
        for (let x = bx; x < bx + blockSize; x++) {
          const [r, g, b] = getPixel(data, x, y, width);
          const gray = toGrayscale(r, g, b);
          sum += gray;
          sumSq += gray * gray;
          count++;
        }
      }

      const mean = sum / count;
      const variance = sumSq / count - mean * mean;

      // High variance but not edges indicates noise
      if (variance > 500 && variance < 2000) {
        for (let y = by; y < by + blockSize; y++) {
          for (let x = bx; x < bx + blockSize; x++) {
            mask[y * width + x] = 255;
          }
        }
      }
    }
  }

  const regions = findConnectedComponents(mask, width, height, blockSize * blockSize);

  for (const bounds of regions) {
    const area = bounds.width * bounds.height;
    damages.push({
      id: generateId('noise'),
      type: 'noise',
      bounds,
      severity: 'low',
      mask: extractRegionMask(mask, width, bounds),
      area,
      confidence: 0.6,
    });
  }

  return damages;
}

/**
 * Combine all damage detection results
 */
export function detectAllDamage(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  edgeMagnitude: Float32Array,
  edgeDirection: Float32Array,
  threshold: number
): DamageRegion[] {
  const stains = detectStains(data, width, height, 50);
  const scratches = detectScratches(edgeMagnitude, edgeDirection, width, height, threshold);
  const fading = detectFading(data, width, height);
  const noise = detectNoise(data, width, height);

  return [...stains, ...scratches, ...fading, ...noise];
}
