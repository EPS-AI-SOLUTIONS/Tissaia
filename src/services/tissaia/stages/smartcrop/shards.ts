/**
 * Tissaia Stage 3: SmartCrop - Shard Creation
 * ============================================
 * Functions for creating and managing image shards.
 */

import type {
  PreparedData,
  DetectionResult,
  CroppedShard,
  SmartCropConfig,
  Rectangle,
  ShardContext,
} from '../../types';
import { generateId, rectanglesOverlap } from './helpers';

/**
 * Extract ImageData for a region
 */
export function extractRegionImageData(
  sourceData: ImageData,
  bounds: Rectangle
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = bounds.width;
  canvas.height = bounds.height;

  const ctx = canvas.getContext('2d')!;

  // Create temp canvas with source
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sourceData.width;
  tempCanvas.height = sourceData.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(sourceData, 0, 0);

  // Draw cropped region
  ctx.drawImage(
    tempCanvas,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, bounds.width, bounds.height
  );

  return ctx.getImageData(0, 0, bounds.width, bounds.height);
}

/**
 * Create shard context from detection data
 */
export function createShardContext(
  bounds: Rectangle,
  detection: DetectionResult,
  allShardIds: string[],
  currentIndex: number
): ShardContext {
  const { objects, damages } = detection;

  // Find objects in this shard
  const containedObjects = objects.filter(o => rectanglesOverlap(bounds, o.bounds));
  const containedDamages = damages.filter(d => rectanglesOverlap(bounds, d.bounds));

  // Find neighbors (adjacent shards)
  const neighbors: string[] = [];
  // This would need actual neighbor calculation based on positions

  return {
    containsText: containedObjects.some(o => o.type === 'text'),
    containsDamage: containedDamages.length > 0,
    damageTypes: [...new Set(containedDamages.map(d => d.type))],
    objectTypes: [...new Set(containedObjects.map(o => o.type))],
    neighbors,
    originalPosition: bounds,
  };
}

/**
 * Calculate shard priority based on content
 */
export function calculateShardPriority(context: ShardContext): number {
  let priority = 5;

  if (context.containsText) priority = Math.max(priority, 8);
  if (context.containsDamage) priority = Math.max(priority, 7);

  if (context.damageTypes.includes('tear') || context.damageTypes.includes('stain')) {
    priority = Math.max(priority, 9);
  }

  if (context.objectTypes.includes('face')) {
    priority = Math.max(priority, 9);
  }

  return priority;
}

/**
 * Create shards from regions
 */
export function createShards(
  data: PreparedData,
  regions: Rectangle[],
  detection: DetectionResult,
  config: SmartCropConfig
): CroppedShard[] {
  const shards: CroppedShard[] = [];
  const shardIds = regions.map(() => generateId('shard'));

  for (let i = 0; i < regions.length; i++) {
    const bounds = regions[i];

    // Skip if too small
    if (bounds.width < config.minShardSize || bounds.height < config.minShardSize) {
      continue;
    }

    const shardData = extractRegionImageData(data.imageData, bounds);
    const context = createShardContext(bounds, detection, shardIds, i);
    const priority = calculateShardPriority(context);

    shards.push({
      id: shardIds[i],
      data: shardData,
      bounds,
      priority,
      context,
    });
  }

  // Sort by priority (highest first)
  shards.sort((a, b) => b.priority - a.priority);

  return shards;
}

/**
 * Find neighboring shards based on spatial proximity
 */
export function findShardNeighbors(
  shards: CroppedShard[],
  maxDistance: number = 10
): Map<string, string[]> {
  const neighbors = new Map<string, string[]>();

  for (const shard of shards) {
    const shardNeighbors: string[] = [];

    for (const other of shards) {
      if (shard.id === other.id) continue;

      // Check if adjacent
      const isAdjacent =
        // Horizontal adjacency
        (Math.abs(shard.bounds.x + shard.bounds.width - other.bounds.x) <= maxDistance ||
         Math.abs(other.bounds.x + other.bounds.width - shard.bounds.x) <= maxDistance) &&
        // Vertical overlap
        !(shard.bounds.y + shard.bounds.height < other.bounds.y ||
          other.bounds.y + other.bounds.height < shard.bounds.y)
        ||
        // Vertical adjacency
        (Math.abs(shard.bounds.y + shard.bounds.height - other.bounds.y) <= maxDistance ||
         Math.abs(other.bounds.y + other.bounds.height - shard.bounds.y) <= maxDistance) &&
        // Horizontal overlap
        !(shard.bounds.x + shard.bounds.width < other.bounds.x ||
          other.bounds.x + other.bounds.width < shard.bounds.x);

      if (isAdjacent) {
        shardNeighbors.push(other.id);
      }
    }

    neighbors.set(shard.id, shardNeighbors);
  }

  return neighbors;
}

/**
 * Merge shards back into single image
 */
export function mergeShards(
  shards: CroppedShard[],
  originalWidth: number,
  originalHeight: number
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = originalWidth;
  canvas.height = originalHeight;
  const ctx = canvas.getContext('2d')!;

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, originalWidth, originalHeight);

  // Place each shard at its original position
  for (const shard of shards) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = shard.data.width;
    tempCanvas.height = shard.data.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(shard.data, 0, 0);

    ctx.drawImage(tempCanvas, shard.bounds.x, shard.bounds.y);
  }

  return ctx.getImageData(0, 0, originalWidth, originalHeight);
}
