/**
 * Tissaia Stage 3: SmartCrop - Helpers
 * =====================================
 * Helper functions for smart cropping.
 */

import type { Rectangle } from '../../types';

/**
 * Generate unique ID
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate rectangle area
 */
export function getRectArea(rect: Rectangle): number {
  return rect.width * rect.height;
}

/**
 * Check if rectangles overlap
 */
export function rectanglesOverlap(a: Rectangle, b: Rectangle): boolean {
  return !(a.x + a.width < b.x ||
           b.x + b.width < a.x ||
           a.y + a.height < b.y ||
           b.y + b.height < a.y);
}

/**
 * Expand rectangle by padding
 */
export function expandRect(
  rect: Rectangle,
  padding: number,
  maxWidth: number,
  maxHeight: number
): Rectangle {
  return {
    x: Math.max(0, rect.x - padding),
    y: Math.max(0, rect.y - padding),
    width: Math.min(maxWidth - Math.max(0, rect.x - padding), rect.width + padding * 2),
    height: Math.min(maxHeight - Math.max(0, rect.y - padding), rect.height + padding * 2),
  };
}

/**
 * Merge overlapping rectangles
 */
export function mergeRectangles(rects: Rectangle[]): Rectangle[] {
  if (rects.length === 0) return [];

  const merged: Rectangle[] = [];
  const used = new Set<number>();

  for (let i = 0; i < rects.length; i++) {
    if (used.has(i)) continue;

    let current = { ...rects[i] };
    let changed = true;

    while (changed) {
      changed = false;

      for (let j = 0; j < rects.length; j++) {
        if (i === j || used.has(j)) continue;

        if (rectanglesOverlap(current, rects[j])) {
          // Merge rectangles
          const minX = Math.min(current.x, rects[j].x);
          const minY = Math.min(current.y, rects[j].y);
          const maxX = Math.max(current.x + current.width, rects[j].x + rects[j].width);
          const maxY = Math.max(current.y + current.height, rects[j].y + rects[j].height);

          current = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          };

          used.add(j);
          changed = true;
        }
      }
    }

    merged.push(current);
    used.add(i);
  }

  return merged;
}

/**
 * Calculate overlap area between two rectangles
 */
export function calculateOverlapArea(a: Rectangle, b: Rectangle): number {
  if (!rectanglesOverlap(a, b)) return 0;

  const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

  return overlapX * overlapY;
}

/**
 * Calculate overlap ratio
 */
export function calculateOverlapRatio(a: Rectangle, b: Rectangle): number {
  const overlapArea = calculateOverlapArea(a, b);
  const smallerArea = Math.min(getRectArea(a), getRectArea(b));

  return smallerArea > 0 ? overlapArea / smallerArea : 0;
}
