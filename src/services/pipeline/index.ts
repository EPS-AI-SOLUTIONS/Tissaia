// src/services/pipeline/index.ts
/**
 * Tissaia Pipeline Module
 * =======================
 * Exports for the forensic restoration pipeline.
 */

export {
  BATCH_CONFIG,
  DEFAULT_PIPELINE_OPTIONS,
  DEFAULT_SMART_CROP,
  FILE_CONSTRAINTS,
  RETRY_CONFIG,
} from './config';
export { PipelineEventEmitter } from './events';
export { TissaiaPipeline } from './pipeline';
export type {
  CropShard,
  CropStrategy,
  ImageMetadata,
  IngestionResult,
  PipelineEvents,
  PipelineOptions,
  PipelineProgress,
  PipelineReport,
  PipelineStage,
  PipelineStatus,
  RestorationReport,
  ShardContext,
  SmartCropOptions,
} from './types';
