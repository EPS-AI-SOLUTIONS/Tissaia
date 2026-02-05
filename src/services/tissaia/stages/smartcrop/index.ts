/**
 * Tissaia Stage 3: SmartCrop - Index
 * ===================================
 * Re-exports all SmartCrop modules.
 */

// Main function
export { smartCrop, type SmartCropOptions } from './smartcrop';
export { smartCrop as default } from './smartcrop';

// Helpers
export {
  generateId,
  getRectArea,
  rectanglesOverlap,
  expandRect,
  mergeRectangles,
  calculateOverlapArea,
  calculateOverlapRatio,
} from './helpers';

// Cropping strategies
export {
  contentAwareCrop,
  damageAwareCrop,
  gridCrop,
  adaptiveCrop,
  facePriorityCrop,
} from './strategies';

// Shard management
export {
  extractRegionImageData,
  createShardContext,
  calculateShardPriority,
  createShards,
  findShardNeighbors,
  mergeShards,
} from './shards';
