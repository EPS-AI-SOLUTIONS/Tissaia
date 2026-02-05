/**
 * Tissaia Stage 3: SmartCrop - Cropping Strategies
 * =================================================
 * Different strategies for intelligent image cropping.
 */

import type {
  PreparedData,
  DetectionResult,
  SmartCropConfig,
  Rectangle,
} from '../../types';
import {
  expandRect,
  mergeRectangles,
  rectanglesOverlap,
  getRectArea,
} from './helpers';

/**
 * Content-aware cropping - preserves text and important content
 */
export function contentAwareCrop(
  data: PreparedData,
  detection: DetectionResult,
  config: SmartCropConfig
): Rectangle[] {
  const { objects } = detection;
  const { padding } = config;

  // Get all object bounds with priority >= 5
  const importantObjects = objects.filter(o => o.priority >= 5);

  const regions = importantObjects.map(o =>
    expandRect(o.bounds, padding, data.width, data.height)
  );

  return mergeRectangles(regions);
}

/**
 * Damage-aware cropping - isolates damage for targeted repair
 */
export function damageAwareCrop(
  data: PreparedData,
  detection: DetectionResult,
  config: SmartCropConfig
): Rectangle[] {
  const { damages } = detection;
  const { padding } = config;

  // Group damages by severity
  const highSeverity = damages.filter(d => d.severity === 'high');
  const mediumSeverity = damages.filter(d => d.severity === 'medium');

  const regions: Rectangle[] = [];

  // High severity damages get their own regions
  for (const damage of highSeverity) {
    regions.push(expandRect(damage.bounds, padding * 2, data.width, data.height));
  }

  // Medium severity damages can be grouped
  const mediumBounds = mediumSeverity.map(d =>
    expandRect(d.bounds, padding, data.width, data.height)
  );
  regions.push(...mergeRectangles(mediumBounds));

  return mergeRectangles(regions);
}

/**
 * Grid-based cropping - uniform grid division
 */
export function gridCrop(
  data: PreparedData,
  config: SmartCropConfig
): Rectangle[] {
  const { maxShards, minShardSize } = config;

  // Calculate optimal grid size
  const aspectRatio = data.width / data.height;
  let cols = Math.ceil(Math.sqrt(maxShards * aspectRatio));
  let rows = Math.ceil(maxShards / cols);

  // Ensure minimum shard size
  const shardWidth = Math.max(minShardSize, Math.floor(data.width / cols));
  const shardHeight = Math.max(minShardSize, Math.floor(data.height / rows));

  cols = Math.ceil(data.width / shardWidth);
  rows = Math.ceil(data.height / shardHeight);

  const regions: Rectangle[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * shardWidth;
      const y = row * shardHeight;
      const width = Math.min(shardWidth, data.width - x);
      const height = Math.min(shardHeight, data.height - y);

      if (width > 0 && height > 0) {
        regions.push({ x, y, width, height });
      }
    }
  }

  return regions;
}

/**
 * Adaptive cropping - combines strategies based on analysis
 */
export function adaptiveCrop(
  data: PreparedData,
  detection: DetectionResult,
  config: SmartCropConfig
): Rectangle[] {
  const { stats } = detection;
  const { maxShards } = config;

  const regions: Rectangle[] = [];

  // If heavy damage, prioritize damage-aware regions
  if (stats.damagePercentage > 20) {
    const damageRegions = damageAwareCrop(data, detection, config);
    regions.push(...damageRegions);
  }

  // Add content-aware regions for important objects
  const contentRegions = contentAwareCrop(data, detection, config);
  regions.push(...contentRegions);

  // If few regions, add grid coverage
  if (regions.length < maxShards / 2) {
    // Calculate areas not covered
    const gridRegions = gridCrop(data, {
      ...config,
      maxShards: Math.max(4, maxShards - regions.length),
    });

    // Add grid regions that don't overlap significantly with existing
    for (const grid of gridRegions) {
      const hasSignificantOverlap = regions.some(r => {
        if (!rectanglesOverlap(r, grid)) return false;
        const overlapX = Math.max(0, Math.min(r.x + r.width, grid.x + grid.width) - Math.max(r.x, grid.x));
        const overlapY = Math.max(0, Math.min(r.y + r.height, grid.y + grid.height) - Math.max(r.y, grid.y));
        const overlapArea = overlapX * overlapY;
        return overlapArea > getRectArea(grid) * 0.5;
      });

      if (!hasSignificantOverlap) {
        regions.push(grid);
      }
    }
  }

  // Merge overlapping regions
  const merged = mergeRectangles(regions);

  // Limit to maxShards
  return merged.slice(0, maxShards);
}

/**
 * Face-priority cropping - prioritizes faces and portraits
 */
export function facePriorityCrop(
  data: PreparedData,
  detection: DetectionResult,
  config: SmartCropConfig
): Rectangle[] {
  const { objects } = detection;
  const { padding } = config;

  // Prioritize faces
  const faces = objects.filter(o => o.type === 'face');
  const otherImportant = objects.filter(o => o.type !== 'face' && o.priority >= 6);

  const regions: Rectangle[] = [];

  // Faces get extra padding for context
  for (const face of faces) {
    regions.push(expandRect(face.bounds, padding * 3, data.width, data.height));
  }

  // Other important objects
  for (const obj of otherImportant) {
    regions.push(expandRect(obj.bounds, padding, data.width, data.height));
  }

  return mergeRectangles(regions);
}
