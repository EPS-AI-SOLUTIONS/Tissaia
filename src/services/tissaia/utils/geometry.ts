/**
 * Tissaia - Geometry Utilities
 * ============================
 * Rectangle and geometric operations.
 */

import type { Rectangle, Point, Size } from '../types/basic';

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(a: Rectangle, b: Rectangle): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Calculate rectangle area
 */
export function rectangleArea(rect: Rectangle): number {
  return rect.width * rect.height;
}

/**
 * Check if point is inside rectangle
 */
export function pointInRectangle(point: Point, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x < rect.x + rect.width &&
    point.y >= rect.y &&
    point.y < rect.y + rect.height
  );
}

/**
 * Get intersection of two rectangles
 */
export function rectangleIntersection(a: Rectangle, b: Rectangle): Rectangle | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
}

/**
 * Merge two rectangles into bounding box
 */
export function mergeRectangles(a: Rectangle, b: Rectangle): Rectangle {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const width = Math.max(a.x + a.width, b.x + b.width) - x;
  const height = Math.max(a.y + a.height, b.y + b.height) - y;

  return { x, y, width, height };
}

/**
 * Expand rectangle by padding
 */
export function expandRectangle(rect: Rectangle, padding: number): Rectangle {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

/**
 * Constrain rectangle to bounds
 */
export function constrainRectangle(rect: Rectangle, bounds: Size): Rectangle {
  const x = Math.max(0, Math.min(rect.x, bounds.width - rect.width));
  const y = Math.max(0, Math.min(rect.y, bounds.height - rect.height));
  const width = Math.min(rect.width, bounds.width - x);
  const height = Math.min(rect.height, bounds.height - y);

  return { x, y, width, height };
}

/**
 * Calculate rectangle center point
 */
export function rectangleCenter(rect: Rectangle): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Calculate distance between two points
 */
export function pointDistance(a: Point, b: Point): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Calculate aspect ratio
 */
export function aspectRatio(size: Size): number {
  return size.width / size.height;
}
