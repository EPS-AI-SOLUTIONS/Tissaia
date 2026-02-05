/**
 * Tissaia - Stage 3: SmartCrop Types
 * ===================================
 * Types for intelligent image cropping.
 */

import type { Rectangle, Size } from './basic';
import type { DamageType, ObjectType } from './detection';

// ============================================
// STRATEGY TYPES
// ============================================

export type CropStrategy = 'content-aware' | 'damage-aware' | 'grid' | 'adaptive';

// ============================================
// SHARD TYPES
// ============================================

export interface ShardContext {
  containsText: boolean;
  containsDamage: boolean;
  damageTypes: DamageType[];
  objectTypes: ObjectType[];
  neighbors: string[];
  originalPosition: Rectangle;
}

export interface CroppedShard {
  id: string;
  data: ImageData;
  bounds: Rectangle;
  priority: number;
  context: ShardContext;
}

// ============================================
// RESULT TYPES
// ============================================

export interface SmartCropResult {
  shards: CroppedShard[];
  totalShards: number;
  strategy: CropStrategy;
  gridSize: Size;
}

// ============================================
// CONFIGURATION
// ============================================

export interface SmartCropConfig {
  strategy: CropStrategy;
  padding: number;
  minShardSize: number;
  maxShards: number;
  preserveAspectRatio: boolean;
}
