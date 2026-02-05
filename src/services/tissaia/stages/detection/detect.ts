/**
 * Tissaia Stage 2: Detection - Main Detection Function
 * =====================================================
 * Orchestrates the detection pipeline.
 */

import type {
  PreparedData,
  DetectionResult,
  DetectionConfig,
  DamageType,
} from '../../types';
import { DEFAULT_DETECTION_CONFIG } from '../../config';
import { logger } from '../../logger';
import { sobelEdgeDetection, createEdgeMask } from './edge-detection';
import { detectObjects } from './object-detection';
import { detectStains, detectScratches, detectFading, detectNoise } from './damage-detection';
import { generateCutMap } from './cutmap';

/**
 * Detection options
 */
export interface DetectionOptions {
  config?: Partial<DetectionConfig>;
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Stage 2: Detect objects and damage in image
 */
export async function detect(
  data: PreparedData,
  options: DetectionOptions = {}
): Promise<DetectionResult> {
  const config = { ...DEFAULT_DETECTION_CONFIG, ...options.config };
  const { onProgress } = options;

  logger.info('Starting detection stage', 2);
  onProgress?.(0, 'Starting detection...');

  const { buffer, width, height } = data;

  // Step 1: Edge detection
  logger.debug('Running edge detection', 2);
  onProgress?.(10, 'Detecting edges...');

  const { magnitude, direction } = sobelEdgeDetection(buffer, width, height);
  const edgeMask = createEdgeMask(magnitude, width, height, config.edgeThreshold);

  onProgress?.(25, 'Edge detection complete');

  // Step 2: Object detection
  logger.debug('Detecting objects', 2);
  onProgress?.(30, 'Detecting objects...');

  const objects = detectObjects(buffer, width, height, edgeMask, config);
  logger.info(`Detected ${objects.length} objects`, 2);

  onProgress?.(45, `Detected ${objects.length} objects`);

  // Step 3: Damage detection
  logger.debug('Detecting damage', 2);
  onProgress?.(50, 'Detecting damage...');

  const stains = detectStains(data.buffer, width, height, 50);
  onProgress?.(60, `Found ${stains.length} stains`);

  const scratches = detectScratches(magnitude, direction, width, height, config.edgeThreshold);
  onProgress?.(70, `Found ${scratches.length} scratches`);

  const fading = detectFading(data.buffer, width, height);
  onProgress?.(80, `Found ${fading.length} fading regions`);

  const noise = detectNoise(data.buffer, width, height);

  const damages = [...stains, ...scratches, ...fading, ...noise];
  logger.info(`Detected ${damages.length} damage regions`, 2);

  onProgress?.(85, `Detected ${damages.length} damage regions`);

  // Step 4: Generate cut map
  logger.debug('Generating cut map', 2);
  onProgress?.(90, 'Generating cut map...');

  const cutMap = generateCutMap(objects, damages, width, height, config);

  // Calculate stats
  const totalDamageArea = damages.reduce((sum, d) => sum + d.area, 0);
  const damagePercentage = (totalDamageArea / (width * height)) * 100;

  const damageCounts = damages.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {} as Record<DamageType, number>);

  const dominantDamageType = Object.entries(damageCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] as DamageType | undefined || null;

  const result: DetectionResult = {
    objects,
    damages,
    cutMap,
    visualization: cutMap.visualization,
    stats: {
      totalObjects: objects.length,
      totalDamageRegions: damages.length,
      damagePercentage: Math.round(damagePercentage * 100) / 100,
      dominantDamageType,
    },
  };

  logger.info('Detection complete', 2, result.stats);
  onProgress?.(100, 'Detection complete');

  return result;
}

export default detect;
