/**
 * Tissaia Forensic Restoration Engine - Pipeline Orchestrator
 * ==========================================================
 * Main class that orchestrates the 4-stage processing pipeline.
 */

import type {
  TissaiaConfig,
  TissaiaEvents,
  PipelineProgress,
  PipelineStatus,
  StageNumber,
  StageName,
  StageResult,
  PreparedData,
  DetectionResult,
  SmartCropResult,
  RestoredImage,
} from './types';
import { TISSAIA_CONFIG, mergeConfig, validateConfig, STAGE_INFO } from './config';
import { logger } from './logger';
import { ingest } from './stage1-ingestion';
import { detect } from './stage2-detection';
import { smartCrop } from './stage3-smartcrop';
import { restore } from './stage4-alchemy';

// ============================================
// EVENT EMITTER
// ============================================

type EventCallback<T> = (data: T) => void;

class EventEmitter<Events extends Record<string, unknown>> {
  private listeners: Map<keyof Events, Set<EventCallback<unknown>>> = new Map();

  on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);
  }

  off<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
    this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
      }
    });
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// ============================================
// PIPELINE CLASS
// ============================================

export class TissaiaPipeline extends EventEmitter<TissaiaEvents> {
  private config: TissaiaConfig;
  private status: PipelineStatus = 'idle';
  private currentStage: StageNumber = 1;
  private stageProgress: number = 0;
  private startTime: number = 0;
  private isPausedFlag: boolean = false;
  private isCancelledFlag: boolean = false;

  private stageResults: Map<StageNumber, StageResult> = new Map();
  private stageDurations: Map<StageNumber, number> = new Map();

  constructor(config?: Partial<TissaiaConfig>) {
    super();
    this.config = config ? mergeConfig(config) : { ...TISSAIA_CONFIG };

    // Validate config
    const validation = validateConfig(this.config);
    if (!validation.valid) {
      logger.warn('Config validation warnings', undefined, validation.errors);
    }

    // Configure logger
    logger.setLevel(this.config.pipeline.logLevel);
    logger.setEnabled(this.config.pipeline.enableLogging);
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Process an image through the complete pipeline
   */
  async process(input: File | Blob | ArrayBuffer): Promise<RestoredImage> {
    if (this.status === 'processing') {
      throw new Error('Pipeline is already processing');
    }

    this.reset();
    this.status = 'processing';
    this.startTime = Date.now();

    logger.info('Starting Tissaia Pipeline');

    const filename = input instanceof File ? input.name : undefined;

    try {
      // Stage 1: Ingestion
      const stage1Result = await this.runStage(1, 'ingestion', async () => {
        return ingest(input, {
          config: this.config.ingestion,
          onProgress: (progress, message) => this.emitStageProgress(1, progress, message),
          filename,
        });
      });

      if (this.isCancelledFlag) throw new Error('Pipeline cancelled');
      await this.waitIfPaused();

      const preparedData = stage1Result as PreparedData;

      // Stage 2: Detection
      const stage2Result = await this.runStage(2, 'detection', async () => {
        return detect(preparedData, {
          config: this.config.detection,
          onProgress: (progress, message) => this.emitStageProgress(2, progress, message),
        });
      });

      if (this.isCancelledFlag) throw new Error('Pipeline cancelled');
      await this.waitIfPaused();

      const detectionResult = stage2Result as DetectionResult;

      // Stage 3: SmartCrop
      const stage3Result = await this.runStage(3, 'smartcrop', async () => {
        return smartCrop(preparedData, detectionResult, {
          config: this.config.smartCrop,
          onProgress: (progress, message) => this.emitStageProgress(3, progress, message),
        });
      });

      if (this.isCancelledFlag) throw new Error('Pipeline cancelled');
      await this.waitIfPaused();

      const cropResult = stage3Result as SmartCropResult;

      // Stage 4: Alchemy
      const stage4Result = await this.runStage(4, 'alchemy', async () => {
        return restore(cropResult, {
          config: this.config.alchemy,
          onProgress: (progress, message) => this.emitStageProgress(4, progress, message),
          originalWidth: preparedData.width,
          originalHeight: preparedData.height,
          originalName: preparedData.metadata.originalName,
        });
      });

      const restoredImage = stage4Result as RestoredImage;

      // Complete
      this.status = 'complete';
      const totalDuration = Date.now() - this.startTime;

      // Update stage durations in report
      restoredImage.report.processingTime.total = totalDuration;
      restoredImage.report.processingTime.byStage = Object.fromEntries(this.stageDurations);

      logger.info(`Pipeline complete in ${totalDuration}ms`);

      this.emit('pipeline:complete', {
        result: restoredImage,
        totalDuration,
        stageDurations: Object.fromEntries(this.stageDurations) as Record<StageNumber, number>,
      });

      return restoredImage;

    } catch (error) {
      this.status = 'error';
      const err = error instanceof Error ? error : new Error(String(error));

      logger.error('Pipeline failed', this.currentStage, err);

      this.emit('pipeline:error', {
        error: err,
        stage: this.currentStage,
      });

      throw err;
    }
  }

  /**
   * Pause the pipeline
   */
  pause(): void {
    if (this.status === 'processing') {
      this.isPausedFlag = true;
      this.status = 'paused';
      logger.info('Pipeline paused');
    }
  }

  /**
   * Resume the pipeline
   */
  resume(): void {
    if (this.status === 'paused') {
      this.isPausedFlag = false;
      this.status = 'processing';
      logger.info('Pipeline resumed');
    }
  }

  /**
   * Cancel the pipeline
   */
  cancel(): void {
    if (this.status === 'processing' || this.status === 'paused') {
      this.isCancelledFlag = true;
      this.isPausedFlag = false;
      this.status = 'cancelled';
      logger.info('Pipeline cancelled');
      this.emit('pipeline:cancel', {});
    }
  }

  /**
   * Get current pipeline progress
   */
  getProgress(): PipelineProgress {
    const stageInfo = STAGE_INFO[this.currentStage];

    // Calculate overall progress
    let overallProgress = 0;
    for (let s = 1; s < this.currentStage; s++) {
      overallProgress += STAGE_INFO[s as StageNumber].weight * 100;
    }
    overallProgress += STAGE_INFO[this.currentStage].weight * this.stageProgress;

    // Estimate remaining time
    let estimatedTimeRemaining: number | undefined;
    if (this.startTime && overallProgress > 0) {
      const elapsed = Date.now() - this.startTime;
      const rate = overallProgress / elapsed;
      estimatedTimeRemaining = Math.round((100 - overallProgress) / rate);
    }

    return {
      currentStage: this.currentStage,
      totalStages: 4,
      stageProgress: this.stageProgress,
      overallProgress: Math.round(overallProgress),
      status: this.status,
      currentStageName: stageInfo.name,
      startTime: this.startTime || undefined,
      estimatedTimeRemaining,
      message: stageInfo.description,
    };
  }

  /**
   * Get result for a specific stage
   */
  getStageResult(stage: StageNumber): StageResult | null {
    return this.stageResults.get(stage) || null;
  }

  /**
   * Check if pipeline is processing
   */
  isProcessing(): boolean {
    return this.status === 'processing';
  }

  /**
   * Check if pipeline is paused
   */
  isPaused(): boolean {
    return this.status === 'paused';
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TissaiaConfig>): void {
    this.config = mergeConfig({ ...this.config, ...config });

    const validation = validateConfig(this.config);
    if (!validation.valid) {
      logger.warn('Config validation warnings', undefined, validation.errors);
    }

    logger.setLevel(this.config.pipeline.logLevel);
    logger.setEnabled(this.config.pipeline.enableLogging);
  }

  /**
   * Get current configuration
   */
  getConfig(): TissaiaConfig {
    return { ...this.config };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Reset pipeline state
   */
  private reset(): void {
    this.status = 'idle';
    this.currentStage = 1;
    this.stageProgress = 0;
    this.startTime = 0;
    this.isPausedFlag = false;
    this.isCancelledFlag = false;
    this.stageResults.clear();
    this.stageDurations.clear();
  }

  /**
   * Run a single stage with timing and error handling
   */
  private async runStage<T>(
    stage: StageNumber,
    name: StageName,
    execute: () => Promise<T>
  ): Promise<T> {
    this.currentStage = stage;
    this.stageProgress = 0;

    logger.info(`Starting stage ${stage}: ${name}`);

    this.emit('stage:start', {
      stage,
      name,
      timestamp: Date.now(),
    });

    const stageStart = Date.now();

    try {
      const result = await execute();
      const duration = Date.now() - stageStart;

      this.stageDurations.set(stage, duration);

      const stageResult: StageResult = {
        stage,
        name,
        success: true,
        duration,
        data: result as PreparedData | DetectionResult | SmartCropResult | RestoredImage,
      };

      this.stageResults.set(stage, stageResult);

      this.emit('stage:complete', {
        stage,
        result: stageResult,
        duration,
      });

      logger.info(`Stage ${stage} complete in ${duration}ms`);

      return result;

    } catch (error) {
      const duration = Date.now() - stageStart;
      const err = error instanceof Error ? error : new Error(String(error));

      this.stageDurations.set(stage, duration);

      const stageResult: StageResult = {
        stage,
        name,
        success: false,
        duration,
        data: null,
        error: err,
      };

      this.stageResults.set(stage, stageResult);

      this.emit('stage:error', {
        stage,
        error: err,
        recoverable: false,
      });

      throw err;
    }
  }

  /**
   * Emit stage progress event
   */
  private emitStageProgress(stage: StageNumber, progress: number, message: string): void {
    this.stageProgress = progress;

    this.emit('stage:progress', {
      stage,
      progress,
      message,
      details: {
        currentStep: message,
        totalSteps: 10,
        currentStepIndex: Math.floor(progress / 10),
      },
    });
  }

  /**
   * Wait while paused
   */
  private async waitIfPaused(): Promise<void> {
    while (this.isPausedFlag) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Quick process an image with default settings
 */
export async function processImage(
  input: File | Blob | ArrayBuffer,
  config?: Partial<TissaiaConfig>
): Promise<RestoredImage> {
  const pipeline = new TissaiaPipeline(config);
  return pipeline.process(input);
}

/**
 * Process with progress callback
 */
export async function processImageWithProgress(
  input: File | Blob | ArrayBuffer,
  onProgress: (progress: PipelineProgress) => void,
  config?: Partial<TissaiaConfig>
): Promise<RestoredImage> {
  const pipeline = new TissaiaPipeline(config);

  pipeline.on('stage:progress', () => {
    onProgress(pipeline.getProgress());
  });

  pipeline.on('stage:start', () => {
    onProgress(pipeline.getProgress());
  });

  return pipeline.process(input);
}

export default TissaiaPipeline;
