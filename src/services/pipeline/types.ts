// src/services/pipeline/types.ts
/**
 * Tissaia Pipeline Types
 * ======================
 * Type definitions for the 4-stage forensic restoration pipeline.
 */

// Import existing types
import type {
  BoundingBox,
  CroppedPhoto,
  CropResult,
  DetectionResult,
  RestorationResult,
  VerificationResult,
} from '../../hooks/api/types';

// ============================================
// PIPELINE STAGE TYPES
// ============================================

export type PipelineStage = 'idle' | 'ingestion' | 'detection' | 'smartcrop' | 'alchemy';

export type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error' | 'cancelled';

// ============================================
// INGESTION (Stage 1) - File validation
// ============================================

export interface ImageMetadata {
  originalFormat: string;
  fileSize: number;
  width: number;
  height: number;
  colorSpace: string;
  hasAlpha: boolean;
  bitDepth: number;
  exif?: Record<string, unknown>;
}

export interface IngestionResult {
  file: File;
  base64: string;
  mimeType: string;
  metadata: ImageMetadata;
  validatedAt: string;
}

// ============================================
// SMARTCROP (Stage 3) - Priority-based cropping
// ============================================

export type CropStrategy = 'content-aware' | 'damage-aware' | 'grid' | 'adaptive';

export interface SmartCropOptions {
  strategy: CropStrategy;
  padding: number;
  minShardSize: number;
  maxShards: number;
  preserveAspectRatio: boolean;
}

export interface CropShard extends CroppedPhoto {
  priority: number; // 1-10, higher = more important
  context: ShardContext;
}

export interface ShardContext {
  containsText: boolean;
  containsDamage: boolean;
  damageTypes: string[];
  objectTypes: string[];
  neighbors: string[];
}

// ============================================
// ALCHEMY (Stage 4) - Restoration
// ============================================

export interface RestorationReport {
  photoId: string;
  enhancementsApplied: string[];
  qualityScore: {
    before: number;
    after: number;
    improvement: number;
  };
  processingTime: {
    total: number;
    restoration: number;
    upscale: number;
    localFilters: number;
  };
  verification?: VerificationResult;
  localFiltersApplied: string[];
}

export interface PipelineReport {
  id: string;
  startedAt: string;
  completedAt: string;
  totalDuration: number;
  stageDurations: Record<PipelineStage, number>;
  photoReports: RestorationReport[];
  overallQualityImprovement: number;
}

// ============================================
// PIPELINE PROGRESS
// ============================================

export interface PipelineProgress {
  currentStage: PipelineStage;
  totalStages: 4;
  stageProgress: number; // 0-100 for current stage
  overallProgress: number; // 0-100 for entire pipeline
  status: PipelineStatus;
  currentPhotoIndex: number;
  totalPhotos: number;
  message: string;
  startTime: number;
  estimatedTimeRemaining: number | null;
  stageTimings: Partial<Record<PipelineStage, number>>;
}

// ============================================
// PIPELINE EVENTS
// ============================================

export interface PipelineEvents {
  'stage:start': { stage: PipelineStage; name: string; timestamp: number };
  'stage:progress': { stage: PipelineStage; progress: number; message: string };
  'stage:complete': { stage: PipelineStage; duration: number };
  'stage:error': { stage: PipelineStage; error: Error; recoverable: boolean };
  'pipeline:progress': PipelineProgress;
  'pipeline:complete': { report: PipelineReport };
  'pipeline:error': { error: Error };
  'pipeline:cancel': Record<string, never>;
  'pipeline:pause': Record<string, never>;
  'pipeline:resume': Record<string, never>;
  'photo:complete': { photoIndex: number; photoId: string; report: RestorationReport };
  'photo:error': { photoIndex: number; error: Error; willRetry: boolean };
}

// ============================================
// PIPELINE OPTIONS (passed to pipeline.process())
// ============================================

export interface PipelineOptions {
  /** Enable local image filters before AI restoration */
  enableLocalFilters: boolean;
  /** Enable upscaling after restoration */
  enableUpscale: boolean;
  /** Upscale factor (default 2.0) */
  upscaleFactor: number;
  /** Max concurrent restorations (batch) */
  concurrency: number;
  /** Max retry attempts per photo */
  maxRetries: number;
  /** SmartCrop options */
  smartCrop: SmartCropOptions;
  /** Enable verification agent */
  enableVerification: boolean;
}

// Re-export for convenience
export type {
  BoundingBox,
  CroppedPhoto,
  CropResult,
  DetectionResult,
  RestorationResult,
  VerificationResult,
};
