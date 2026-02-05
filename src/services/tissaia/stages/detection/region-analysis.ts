/**
 * Tissaia Stage 2: Detection - Region Analysis
 * =============================================
 * Connected component analysis and region extraction.
 */

import type { Rectangle } from '../../types';

/**
 * Find connected components using flood fill (4-connectivity)
 */
export function findConnectedComponents(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  minArea: number
): Rectangle[] {
  const visited = new Uint8Array(width * height);
  const regions: Rectangle[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;

      if (mask[i] > 0 && !visited[i]) {
        // BFS to find connected region
        const queue: [number, number][] = [[x, y]];
        let minX = x, maxX = x, minY = y, maxY = y;
        let area = 0;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          const ci = cy * width + cx;

          if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
          if (visited[ci] || mask[ci] === 0) continue;

          visited[ci] = 1;
          area++;

          minX = Math.min(minX, cx);
          maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy);
          maxY = Math.max(maxY, cy);

          // Add 4-connected neighbors
          queue.push([cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]);
        }

        if (area >= minArea) {
          regions.push({
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
          });
        }
      }
    }
  }

  return regions;
}

/**
 * Find connected components with 8-connectivity
 */
export function findConnectedComponents8(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  minArea: number
): Rectangle[] {
  const visited = new Uint8Array(width * height);
  const regions: Rectangle[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;

      if (mask[i] > 0 && !visited[i]) {
        const queue: [number, number][] = [[x, y]];
        let minX = x, maxX = x, minY = y, maxY = y;
        let area = 0;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          const ci = cy * width + cx;

          if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
          if (visited[ci] || mask[ci] === 0) continue;

          visited[ci] = 1;
          area++;

          minX = Math.min(minX, cx);
          maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy);
          maxY = Math.max(maxY, cy);

          // Add 8-connected neighbors
          queue.push(
            [cx - 1, cy - 1], [cx, cy - 1], [cx + 1, cy - 1],
            [cx - 1, cy],                   [cx + 1, cy],
            [cx - 1, cy + 1], [cx, cy + 1], [cx + 1, cy + 1]
          );
        }

        if (area >= minArea) {
          regions.push({
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
          });
        }
      }
    }
  }

  return regions;
}

/**
 * Extract mask for a specific region
 */
export function extractRegionMask(
  fullMask: Uint8ClampedArray,
  width: number,
  bounds: Rectangle
): Uint8ClampedArray {
  const regionMask = new Uint8ClampedArray(bounds.width * bounds.height);

  for (let y = 0; y < bounds.height; y++) {
    for (let x = 0; x < bounds.width; x++) {
      const srcI = (bounds.y + y) * width + (bounds.x + x);
      const dstI = y * bounds.width + x;
      regionMask[dstI] = fullMask[srcI];
    }
  }

  return regionMask;
}

/**
 * Label connected components (returns label map)
 */
export function labelConnectedComponents(
  mask: Uint8ClampedArray,
  width: number,
  height: number
): { labels: Int32Array; count: number } {
  const labels = new Int32Array(width * height);
  let currentLabel = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;

      if (mask[i] > 0 && labels[i] === 0) {
        currentLabel++;
        const queue: [number, number][] = [[x, y]];

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          const ci = cy * width + cx;

          if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
          if (mask[ci] === 0 || labels[ci] !== 0) continue;

          labels[ci] = currentLabel;

          queue.push([cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]);
        }
      }
    }
  }

  return { labels, count: currentLabel };
}

/**
 * Dilate binary mask
 */
export function dilateMask(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number = 1
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            maxVal = Math.max(maxVal, mask[ny * width + nx]);
          }
        }
      }

      output[y * width + x] = maxVal;
    }
  }

  return output;
}

/**
 * Erode binary mask
 */
export function erodeMask(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number = 1
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = 255;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            minVal = Math.min(minVal, mask[ny * width + nx]);
          }
        }
      }

      output[y * width + x] = minVal;
    }
  }

  return output;
}
