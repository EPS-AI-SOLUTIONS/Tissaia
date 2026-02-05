/**
 * Tissaia Forensic Restoration Engine - Stage 3: SmartCrop
 * ========================================================
 * Intelligently segment image based on detection results.
 *
 * This file re-exports from the modular stages/smartcrop/ directory
 * for backward compatibility.
 */

// Re-export main function
export { smartCrop, type SmartCropOptions } from './stages/smartcrop';
export { smartCrop as default } from './stages/smartcrop';

// Re-export helpers
export {
  generateId,
  getRectArea,
  rectanglesOverlap,
  expandRect,
  mergeRectangles,
  calculateOverlapArea,
  calculateOverlapRatio,
} from './stages/smartcrop';

// Re-export strategies
export {
  contentAwareCrop,
  damageAwareCrop,
  gridCrop,
  adaptiveCrop,
  facePriorityCrop,
} from './stages/smartcrop';

// Re-export shard management
export {
  extractRegionImageData,
  createShardContext,
  calculateShardPriority,
  createShards,
  findShardNeighbors,
  mergeShards,
} from './stages/smartcrop';
