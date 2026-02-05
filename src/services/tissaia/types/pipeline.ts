/**
 * Tissaia - Pipeline Types
 * ========================
 * Types for pipeline orchestration and events.
 */

import type { SupportedFormat, IngestionConfig, PreparedData } from './ingestion';
import type { DetectionConfig, DetectionResult } from './detection';
import type { SmartCropConfig, SmartCropResult } from './smartcrop';
import type { AlchemyConfig, RestoredImage } from './alchemy';

// ============================================
// PIPELINE STATUS TYPES
// ============================================

export type PipelineStatus = 'idle' | 'processing' | 'paused' | 'complete' | 'error' | 'cancelled';

export type StageNumber = 1 | 2 | 3 | 4;

export type StageName = 'ingestion' | 'detection' | 'smartcrop' | 'alchemy';

// ============================================
// STAGE RESULT
// ============================================

export interface StageResult {
  stage: StageNumber;
  name: StageName;
  success: boolean;
  duration: number;
  data: PreparedData | DetectionResult | SmartCropResult | RestoredImage | null;
  error?: Error;
}

// ============================================
// PROGRESS TYPES
// ============================================

export interface PipelineProgress {
  currentStage: StageNumber;
  totalStages: 4;
  stageProgress: number;
  overallProgress: number;
  status: PipelineStatus;
  currentStageName: StageName;
  startTime?: number;
  estimatedTimeRemaining?: number;
  message?: string;
}

// ============================================
// CONFIGURATION
// ============================================

export interface PipelineConfig {
  parallelProcessing: boolean;
  enableLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  progressInterval: number;
}

export interface TissaiaConfig {
  maxFileSize: number;
  maxWidth: number;
  maxHeight: number;
  supportedFormats: SupportedFormat[];
  ingestion: IngestionConfig;
  detection: DetectionConfig;
  smartCrop: SmartCropConfig;
  alchemy: AlchemyConfig;
  pipeline: PipelineConfig;
}

// ============================================
// EVENT TYPES
// ============================================

export interface StageStartEvent {
  stage: StageNumber;
  name: StageName;
  timestamp: number;
}

export interface StageProgressEvent {
  stage: StageNumber;
  progress: number;
  message: string;
  details?: {
    currentStep: string;
    totalSteps: number;
    currentStepIndex: number;
  };
}

export interface StageCompleteEvent {
  stage: StageNumber;
  result: StageResult;
  duration: number;
}

export interface StageErrorEvent {
  stage: StageNumber;
  error: Error;
  recoverable: boolean;
}

export interface PipelineCompleteEvent {
  result: RestoredImage;
  totalDuration: number;
  stageDurations: Record<StageNumber, number>;
}

export interface PipelineErrorEvent {
  error: Error;
  stage?: StageNumber;
  partial?: Partial<RestoredImage>;
}

export interface TissaiaEvents {
  'stage:start': StageStartEvent;
  'stage:progress': StageProgressEvent;
  'stage:complete': StageCompleteEvent;
  'stage:error': StageErrorEvent;
  'pipeline:complete': PipelineCompleteEvent;
  'pipeline:error': PipelineErrorEvent;
  'pipeline:cancel': Record<string, never>;
}
