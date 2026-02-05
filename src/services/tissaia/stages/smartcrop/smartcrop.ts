/**
 * Tissaia Stage 3: SmartCrop - Main Function
 * ==========================================
 * Orchestrates the smart cropping pipeline.
 */

import type {
  PreparedData,
  DetectionResult,
  SmartCropResult,
  SmartCropConfig,
  Rectangle,
  Size,
} from '../../types';
import { DEFAULT_SMARTCROP_CONFIG } from '../../config';
import { logger } from '../../logger';
import {
  contentAwareCrop,
  damageAwareCrop,
  gridCrop,
  adaptiveCrop,
} from './strategies';
import { createShards } from './shards';

/**
 * SmartCrop options
 */
export interface SmartCropOptions {
  config?: Partial<SmartCropConfig>;
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Stage 3: Smart crop image into shards
 */
export async function smartCrop(
  data: PreparedData,
  detection: DetectionResult,
  options: SmartCropOptions = {}
): Promise<SmartCropResult> {
  const config = { ...DEFAULT_SMARTCROP_CONFIG, ...options.config };
  const { onProgress } = options;

  logger.info('Starting SmartCrop stage', 3);
  onProgress?.(0, 'Starting smart cropping...');

  // Step 1: Choose strategy and generate regions
  logger.debug(`Using ${config.strategy} strategy`, 3);
  onProgress?.(10, `Applying ${config.strategy} strategy...`);

  let regions: Rectangle[];

  switch (config.strategy) {
    case 'content-aware':
      regions = contentAwareCrop(data, detection, config);
      break;
    case 'damage-aware':
      regions = damageAwareCrop(data, detection, config);
      break;
    case 'grid':
      regions = gridCrop(data, config);
      break;
    case 'adaptive':
    default:
      regions = adaptiveCrop(data, detection, config);
      break;
  }

  logger.debug(`Generated ${regions.length} regions`, 3);
  onProgress?.(40, `Generated ${regions.length} regions`);

  // Step 2: If no regions, create single full-image shard
  if (regions.length === 0) {
    logger.warn('No regions detected, using full image', 3);
    regions = [{
      x: 0,
      y: 0,
      width: data.width,
      height: data.height,
    }];
  }

  // Step 3: Create shards
  logger.debug('Creating shards', 3);
  onProgress?.(60, 'Creating shards...');

  const shards = createShards(data, regions, detection, config);

  logger.info(`Created ${shards.length} shards`, 3);
  onProgress?.(90, `Created ${shards.length} shards`);

  // Calculate grid size
  const gridSize: Size = {
    width: Math.ceil(Math.sqrt(shards.length * (data.width / data.height))),
    height: Math.ceil(shards.length / Math.ceil(Math.sqrt(shards.length * (data.width / data.height)))),
  };

  const result: SmartCropResult = {
    shards,
    totalShards: shards.length,
    strategy: config.strategy,
    gridSize,
  };

  logger.info('SmartCrop complete', 3, { totalShards: result.totalShards, strategy: result.strategy });
  onProgress?.(100, 'SmartCrop complete');

  return result;
}

export default smartCrop;
