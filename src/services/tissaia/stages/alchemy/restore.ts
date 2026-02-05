/**
 * Tissaia Stage 4: Alchemy - Main Restore Function
 * =================================================
 * Orchestrates the restoration pipeline.
 */

import type {
  SmartCropResult,
  RestoredImage,
  RestorationReport,
  AlchemyConfig,
  CroppedShard,
} from '../../types';
import { DEFAULT_ALCHEMY_CONFIG } from '../../config';
import { logger } from '../../logger';
import { imageDataToBlob, imageDataToDataUrl } from '../../stages/ingestion';
import { calculateQualityScore } from './quality';
import { processShard } from './inpainting';
import { reassembleShards } from './reassembly';

/**
 * Alchemy options
 */
export interface AlchemyOptions {
  config?: Partial<AlchemyConfig>;
  onProgress?: (progress: number, message: string) => void;
  originalWidth: number;
  originalHeight: number;
  originalName?: string;
}

/**
 * Stage 4: Restore and enhance image shards
 */
export async function restore(
  cropResult: SmartCropResult,
  options: AlchemyOptions
): Promise<RestoredImage> {
  const config = { ...DEFAULT_ALCHEMY_CONFIG, ...options.config };
  const { onProgress, originalWidth, originalHeight, originalName } = options;

  logger.info('Starting Alchemy stage', 4);
  onProgress?.(0, 'Starting restoration...');

  const startTime = Date.now();
  const stageTimes: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  const { shards } = cropResult;

  // Step 1: Analyze initial quality
  logger.debug('Analyzing initial quality', 4);
  onProgress?.(5, 'Analyzing image quality...');

  // Combine all shards for initial quality
  const initialCanvas = document.createElement('canvas');
  initialCanvas.width = originalWidth;
  initialCanvas.height = originalHeight;
  const initialCtx = initialCanvas.getContext('2d')!;

  for (const shard of shards) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = shard.data.width;
    tempCanvas.height = shard.data.height;
    tempCanvas.getContext('2d')!.putImageData(shard.data, 0, 0);
    initialCtx.drawImage(tempCanvas, shard.bounds.x, shard.bounds.y);
  }

  const initialData = initialCtx.getImageData(0, 0, originalWidth, originalHeight);
  const qualityBefore = calculateQualityScore(initialData.data, originalWidth, originalHeight);

  onProgress?.(15, 'Quality analysis complete');

  // Step 2: Process each shard
  const allEnhancements: string[] = [];
  const allRepairs: RestorationReport['damageRepaired'] = [];
  const processedShards: Array<{ shard: CroppedShard; processed: ImageData }> = [];

  const progressPerShard = 60 / shards.length;

  for (let i = 0; i < shards.length; i++) {
    const shard = shards[i];
    const progress = 20 + (i * progressPerShard);

    logger.debug(`Processing shard ${i + 1}/${shards.length}`, 4);
    onProgress?.(progress, `Processing shard ${i + 1}/${shards.length}...`);

    const { processed, enhancements, repairs } = processShard(shard, config);

    processedShards.push({ shard, processed });
    allEnhancements.push(...enhancements);
    allRepairs.push(...repairs);
  }

  // Deduplicate enhancements
  const uniqueEnhancements = [...new Set(allEnhancements)];

  onProgress?.(80, 'All shards processed');

  // Step 3: Reassemble
  logger.debug('Reassembling image', 4);
  onProgress?.(85, 'Reassembling image...');

  const finalImageData = reassembleShards(processedShards, originalWidth, originalHeight);

  // Step 4: Calculate final quality
  onProgress?.(90, 'Calculating final quality...');

  const qualityAfter = calculateQualityScore(finalImageData.data, originalWidth, originalHeight);
  const improvement = Math.round((qualityAfter.overall - qualityBefore.overall) / qualityBefore.overall * 100);

  // Step 5: Create output
  logger.debug('Creating output', 4);
  onProgress?.(95, 'Creating output...');

  const blob = await imageDataToBlob(finalImageData, config.outputFormat, config.outputQuality / 100);
  const dataUrl = imageDataToDataUrl(finalImageData, config.outputFormat, config.outputQuality / 100);

  const endTime = Date.now();
  stageTimes[4] = endTime - startTime;

  const report: RestorationReport = {
    enhancementsApplied: uniqueEnhancements,
    damageRepaired: allRepairs,
    qualityScore: {
      before: qualityBefore,
      after: qualityAfter,
      improvement,
    },
    processingTime: {
      total: endTime - startTime,
      byStage: stageTimes,
    },
  };

  const result: RestoredImage = {
    data: finalImageData,
    format: config.outputFormat,
    blob,
    dataUrl,
    width: originalWidth,
    height: originalHeight,
    metadata: {
      width: originalWidth,
      height: originalHeight,
      processedAt: new Date().toISOString(),
      pipelineVersion: '2.0.0',
      originalName,
    },
    report,
  };

  logger.info('Alchemy complete', 4, {
    improvement: `${improvement}%`,
    enhancements: uniqueEnhancements.length,
    repaired: allRepairs.length,
  });

  onProgress?.(100, 'Restoration complete');

  return result;
}

export default restore;
