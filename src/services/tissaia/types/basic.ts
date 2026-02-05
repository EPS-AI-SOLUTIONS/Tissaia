/**
 * Tissaia - Basic Type Definitions
 * ================================
 * Fundamental geometric and utility types.
 */

// ============================================
// GEOMETRIC TYPES
// ============================================

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export type PixelProcessor = (
  r: number,
  g: number,
  b: number,
  a: number,
  x: number,
  y: number
) => [number, number, number, number];

export interface Kernel {
  data: number[];
  size: number;
  divisor: number;
  offset: number;
}
