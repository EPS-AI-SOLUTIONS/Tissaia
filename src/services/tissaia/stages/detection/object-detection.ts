/**
 * Tissaia Stage 2: Detection - Object Detection
 * ==============================================
 * Detect and classify objects in images.
 */

import type { Rectangle, DetectedObject, ObjectType, DetectionConfig } from '../../types';
import { generateId, getPixel, getLuminance } from './helpers';
import { findConnectedComponents } from './region-analysis';

/**
 * Classify detected region as object type
 */
export function classifyObject(
  data: Uint8ClampedArray,
  width: number,
  bounds: Rectangle
): { type: ObjectType; confidence: number } {
  // Analyze region characteristics
  let totalLuminance = 0;
  let pixelCount = 0;
  let darkPixels = 0;

  for (let y = bounds.y; y < bounds.y + bounds.height && y < data.length / (width * 4); y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width && x < width; x++) {
      const [r, g, b] = getPixel(data, x, y, width);
      const lum = getLuminance(r, g, b);
      totalLuminance += lum;
      pixelCount++;

      if (lum < 0.3) darkPixels++;
    }
  }

  const avgLuminance = totalLuminance / pixelCount;
  const darkRatio = darkPixels / pixelCount;
  const aspectRatio = bounds.width / bounds.height;

  // Simple classification heuristics
  if (darkRatio > 0.6 && aspectRatio > 2 && aspectRatio < 20) {
    return { type: 'text', confidence: 0.7 + darkRatio * 0.2 };
  }

  if (aspectRatio > 0.5 && aspectRatio < 2 && bounds.width > 50 && bounds.height > 50) {
    if (avgLuminance > 0.4) {
      return { type: 'image', confidence: 0.6 };
    }
  }

  if (bounds.width < 200 && bounds.height < 100 && darkRatio > 0.3) {
    return { type: 'signature', confidence: 0.5 };
  }

  return { type: 'unknown', confidence: 0.3 };
}

/**
 * Calculate object priority based on type
 */
export function getObjectPriority(type: ObjectType): number {
  const priorities: Record<ObjectType, number> = {
    text: 8,
    face: 9,
    signature: 7,
    stamp: 6,
    barcode: 5,
    image: 6,
    unknown: 4,
  };
  return priorities[type];
}

/**
 * Detect objects in image
 */
export function detectObjects(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  edgeMask: Uint8ClampedArray,
  config: DetectionConfig
): DetectedObject[] {
  const regions = findConnectedComponents(edgeMask, width, height, config.minObjectArea);
  const objects: DetectedObject[] = [];

  for (const bounds of regions) {
    const { type, confidence } = classifyObject(data, width, bounds);

    if (confidence >= 0.3) {
      objects.push({
        id: generateId('obj'),
        type,
        bounds,
        confidence,
        priority: getObjectPriority(type),
      });
    }
  }

  return objects;
}

/**
 * Filter objects by confidence threshold
 */
export function filterObjectsByConfidence(
  objects: DetectedObject[],
  threshold: number
): DetectedObject[] {
  return objects.filter(obj => obj.confidence >= threshold);
}

/**
 * Sort objects by priority
 */
export function sortObjectsByPriority(objects: DetectedObject[]): DetectedObject[] {
  return [...objects].sort((a, b) => b.priority - a.priority);
}
