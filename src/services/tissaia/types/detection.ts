/**
 * Tissaia - Stage 2: Detection Types
 * ===================================
 * Types for object and damage detection.
 */

import type { Rectangle } from './basic';

// ============================================
// CLASSIFICATION TYPES
// ============================================

export type ObjectType = 'text' | 'image' | 'signature' | 'stamp' | 'barcode' | 'face' | 'unknown';

export type DamageType = 'stain' | 'tear' | 'fold' | 'fade' | 'noise' | 'artifact' | 'scratch';

export type DamageSeverity = 'low' | 'medium' | 'high';

// ============================================
// DETECTED ELEMENTS
// ============================================

export interface DetectedObject {
  id: string;
  type: ObjectType;
  bounds: Rectangle;
  confidence: number;
  priority: number;
  features?: Record<string, unknown>;
}

export interface DamageRegion {
  id: string;
  type: DamageType;
  bounds: Rectangle;
  severity: DamageSeverity;
  mask: Uint8ClampedArray;
  area: number;
  confidence: number;
}

// ============================================
// CUT MAP
// ============================================

export interface CutRegion {
  id: string;
  bounds: Rectangle;
  priority: number;
  containsObjects: string[];
  containsDamage: string[];
}

export interface CutMap {
  regions: CutRegion[];
  grid: number[][];
  visualization: ImageData;
}

// ============================================
// DETECTION RESULT
// ============================================

export interface DetectionResult {
  objects: DetectedObject[];
  damages: DamageRegion[];
  cutMap: CutMap;
  visualization: ImageData;
  stats: {
    totalObjects: number;
    totalDamageRegions: number;
    damagePercentage: number;
    dominantDamageType: DamageType | null;
  };
}

// ============================================
// CONFIGURATION
// ============================================

export interface DetectionConfig {
  edgeThreshold: number;
  minObjectArea: number;
  damageConfidenceThreshold: number;
  enableVisualization: boolean;
}
