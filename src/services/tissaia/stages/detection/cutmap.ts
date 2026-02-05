/**
 * Tissaia Stage 2: Detection - Cut Map Generation
 * ================================================
 * Generate cut maps for smart cropping.
 */

import type { Rectangle, DetectedObject, DamageRegion, CutMap, CutRegion, DetectionConfig } from '../../types';
import { DETECTION_COLORS } from '../../config';
import { generateId } from './helpers';

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(a: Rectangle, b: Rectangle): boolean {
  return !(a.x + a.width < b.x ||
           b.x + b.width < a.x ||
           a.y + a.height < b.y ||
           b.y + b.height < a.y);
}

/**
 * Create visualization overlay
 */
export function createVisualization(
  objects: DetectedObject[],
  damages: DamageRegion[],
  width: number,
  height: number,
  config: DetectionConfig
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Clear with transparent background
  ctx.clearRect(0, 0, width, height);

  if (!config.enableVisualization) {
    return ctx.getImageData(0, 0, width, height);
  }

  // Draw damage regions
  for (const damage of damages) {
    const color = DETECTION_COLORS.damage[damage.type] || DETECTION_COLORS.damage.artifact;
    ctx.fillStyle = color + '40'; // 25% opacity
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.fillRect(damage.bounds.x, damage.bounds.y, damage.bounds.width, damage.bounds.height);
    ctx.strokeRect(damage.bounds.x, damage.bounds.y, damage.bounds.width, damage.bounds.height);

    // Label
    ctx.fillStyle = color;
    ctx.font = '12px sans-serif';
    ctx.fillText(
      `${damage.type} (${damage.severity})`,
      damage.bounds.x + 4,
      damage.bounds.y + 14
    );
  }

  // Draw object regions
  for (const obj of objects) {
    const color = DETECTION_COLORS.object[obj.type] || DETECTION_COLORS.object.unknown;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.strokeRect(obj.bounds.x, obj.bounds.y, obj.bounds.width, obj.bounds.height);

    // Label
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.font = '12px sans-serif';
    ctx.fillText(
      `${obj.type} (${(obj.confidence * 100).toFixed(0)}%)`,
      obj.bounds.x + 4,
      obj.bounds.y - 4
    );
  }

  return ctx.getImageData(0, 0, width, height);
}

/**
 * Generate cut map for smart cropping
 */
export function generateCutMap(
  objects: DetectedObject[],
  damages: DamageRegion[],
  width: number,
  height: number,
  config: DetectionConfig
): CutMap {
  const gridSize = 32;
  const gridW = Math.ceil(width / gridSize);
  const gridH = Math.ceil(height / gridSize);
  const grid: number[][] = Array(gridH).fill(null).map(() => Array(gridW).fill(0));

  // Mark grid cells with objects
  for (const obj of objects) {
    const startX = Math.floor(obj.bounds.x / gridSize);
    const startY = Math.floor(obj.bounds.y / gridSize);
    const endX = Math.ceil((obj.bounds.x + obj.bounds.width) / gridSize);
    const endY = Math.ceil((obj.bounds.y + obj.bounds.height) / gridSize);

    for (let gy = startY; gy < endY && gy < gridH; gy++) {
      for (let gx = startX; gx < endX && gx < gridW; gx++) {
        grid[gy][gx] = Math.max(grid[gy][gx], obj.priority);
      }
    }
  }

  // Mark grid cells with damage
  for (const damage of damages) {
    const startX = Math.floor(damage.bounds.x / gridSize);
    const startY = Math.floor(damage.bounds.y / gridSize);
    const endX = Math.ceil((damage.bounds.x + damage.bounds.width) / gridSize);
    const endY = Math.ceil((damage.bounds.y + damage.bounds.height) / gridSize);

    const damagePriority = damage.severity === 'high' ? 3 : damage.severity === 'medium' ? 2 : 1;

    for (let gy = startY; gy < endY && gy < gridH; gy++) {
      for (let gx = startX; gx < endX && gx < gridW; gx++) {
        grid[gy][gx] = Math.max(grid[gy][gx], damagePriority);
      }
    }
  }

  // Create cut regions
  const regions: CutRegion[] = [];

  // Add regions for high-priority areas
  for (const obj of objects.filter(o => o.priority >= 6)) {
    regions.push({
      id: generateId('cut'),
      bounds: obj.bounds,
      priority: obj.priority,
      containsObjects: [obj.id],
      containsDamage: damages
        .filter(d => rectanglesOverlap(obj.bounds, d.bounds))
        .map(d => d.id),
    });
  }

  // Create visualization
  const visualization = createVisualization(objects, damages, width, height, config);

  return { regions, grid, visualization };
}

/**
 * Merge overlapping cut regions
 */
export function mergeCutRegions(regions: CutRegion[]): CutRegion[] {
  if (regions.length <= 1) return regions;

  const merged: CutRegion[] = [];
  const used = new Set<number>();

  for (let i = 0; i < regions.length; i++) {
    if (used.has(i)) continue;

    let current = { ...regions[i] };
    used.add(i);

    // Find all overlapping regions
    let foundOverlap = true;
    while (foundOverlap) {
      foundOverlap = false;

      for (let j = 0; j < regions.length; j++) {
        if (used.has(j)) continue;

        if (rectanglesOverlap(current.bounds, regions[j].bounds)) {
          // Merge regions
          const minX = Math.min(current.bounds.x, regions[j].bounds.x);
          const minY = Math.min(current.bounds.y, regions[j].bounds.y);
          const maxX = Math.max(
            current.bounds.x + current.bounds.width,
            regions[j].bounds.x + regions[j].bounds.width
          );
          const maxY = Math.max(
            current.bounds.y + current.bounds.height,
            regions[j].bounds.y + regions[j].bounds.height
          );

          current = {
            id: current.id,
            bounds: {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            },
            priority: Math.max(current.priority, regions[j].priority),
            containsObjects: [...current.containsObjects, ...regions[j].containsObjects],
            containsDamage: [...current.containsDamage, ...regions[j].containsDamage],
          };

          used.add(j);
          foundOverlap = true;
        }
      }
    }

    merged.push(current);
  }

  return merged;
}
