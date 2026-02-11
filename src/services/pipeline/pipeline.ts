// src/services/pipeline/pipeline.ts
/**
 * Tissaia Pipeline Orchestrator
 * =============================
 * Central pipeline class that coordinates all 4 stages:
 * 1. Ingestion - validate and prepare image
 * 2. Detection - detect photos in scan
 * 3. SmartCrop - crop detected regions with priority
 * 4. Alchemy - restore, enhance, upscale each photo
 */
import { v4 as uuidv4 } from 'uuid';
import {
  createMockRestorationResult,
  MOCK_DETECTION_DELAY,
  MOCK_RESTORATION_DELAY,
} from '../../hooks/api/mocks';
import type {
  BoundingBox,
  CroppedPhoto,
  CropResult,
  DetectionResult,
  RestorationResult,
} from '../../hooks/api/types';
import { delay, fileToBase64, safeInvoke } from '../../hooks/api/utils';
import { isTauri } from '../../utils/tauri';
import {
  DEFAULT_PIPELINE_OPTIONS,
  FILE_CONSTRAINTS,
  MAGIC_BYTES,
  RETRY_CONFIG,
  TIFF_BIG_ENDIAN,
} from './config';
import { PipelineEventEmitter } from './events';
import type {
  CropShard,
  ImageMetadata,
  IngestionResult,
  PipelineOptions,
  PipelineProgress,
  PipelineReport,
  PipelineStage,
  PipelineStatus,
  RestorationReport,
} from './types';

// ============================================
// PIPELINE CLASS
// ============================================

export class TissaiaPipeline {
  private emitter = new PipelineEventEmitter();
  private options: PipelineOptions;
  private status: PipelineStatus = 'idle';
  private cancelledRef = false;
  private pausePromise: Promise<void> | null = null;
  private pauseResolve: (() => void) | null = null;
  private progress: PipelineProgress;
  private stageStartTimes: Partial<Record<PipelineStage, number>> = {};
  private stageDurations: Partial<Record<PipelineStage, number>> = {};

  // Results accumulated during pipeline
  private ingestionResult: IngestionResult | null = null;
  private detectionResult: DetectionResult | null = null;
  private cropResult: CropResult | null = null;
  private shards: CropShard[] = [];
  private photoReports: RestorationReport[] = [];
  private restorationResults: Map<string, RestorationResult> = new Map();

  constructor(options?: Partial<PipelineOptions>) {
    this.options = { ...DEFAULT_PIPELINE_OPTIONS, ...options };
    this.progress = this.createInitialProgress();
  }

  // ============================================
  // EVENT DELEGATION
  // ============================================

  on: PipelineEventEmitter['on'] = (type, handler) => this.emitter.on(type, handler);
  off: PipelineEventEmitter['off'] = (type, handler) => this.emitter.off(type, handler);

  // ============================================
  // PUBLIC API
  // ============================================

  async process(file: File, existingBoxes?: BoundingBox[]): Promise<PipelineReport> {
    if (this.status === 'running') {
      throw new Error('Pipeline is already running');
    }

    this.reset();
    this.status = 'running';
    this.progress.status = 'running';
    this.progress.startTime = Date.now();

    try {
      // Stage 1: Ingestion
      this.ingestionResult = await this.runStage('ingestion', () => this.stageIngestion(file));

      // Stage 2: Detection (skip if boxes provided)
      if (existingBoxes && existingBoxes.length > 0) {
        this.detectionResult = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          photo_count: existingBoxes.length,
          bounding_boxes: existingBoxes,
          provider_used: 'user-provided',
          scan_width: this.ingestionResult.metadata.width,
          scan_height: this.ingestionResult.metadata.height,
        };
        this.emitStageComplete('detection', 0);
      } else {
        this.detectionResult = await this.runStage('detection', () => {
          if (!this.ingestionResult) throw new Error('Ingestion result missing');
          return this.stageDetection(this.ingestionResult);
        });
      }

      // Stage 3: SmartCrop
      this.cropResult = await this.runStage('smartcrop', () => {
        if (!this.ingestionResult || !this.detectionResult) {
          throw new Error('Previous stage results missing');
        }
        return this.stageSmartCrop(this.ingestionResult, this.detectionResult);
      });

      // Stage 4: Alchemy (restore each photo)
      await this.runStage('alchemy', () => {
        if (!this.cropResult) throw new Error('Crop result missing');
        return this.stageAlchemy(this.cropResult);
      });

      // Build final report
      const report = this.buildReport();
      this.status = 'completed';
      this.progress.status = 'completed';
      this.progress.overallProgress = 100;
      this.emitter.emit('pipeline:complete', { report });
      this.emitProgress();
      return report;
    } catch (error) {
      if (this.cancelledRef) {
        this.status = 'cancelled';
        this.progress.status = 'cancelled';
        this.emitter.emit('pipeline:cancel', {});
        throw new Error('Pipeline cancelled');
      }
      this.status = 'error';
      this.progress.status = 'error';
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitter.emit('pipeline:error', { error: err });
      throw err;
    }
  }

  pause(): void {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this.progress.status = 'paused';
    this.pausePromise = new Promise<void>((resolve) => {
      this.pauseResolve = resolve;
    });
    this.emitter.emit('pipeline:pause', {});
    this.emitProgress();
  }

  resume(): void {
    if (this.status !== 'paused') return;
    this.status = 'running';
    this.progress.status = 'running';
    this.pauseResolve?.();
    this.pausePromise = null;
    this.pauseResolve = null;
    this.emitter.emit('pipeline:resume', {});
    this.emitProgress();
  }

  cancel(): void {
    this.cancelledRef = true;
    this.status = 'cancelled';
    this.progress.status = 'cancelled';
    // Also resume if paused so the loop can exit
    this.pauseResolve?.();
    this.pausePromise = null;
  }

  getProgress(): PipelineProgress {
    return { ...this.progress };
  }

  getResults() {
    return {
      ingestion: this.ingestionResult,
      detection: this.detectionResult,
      crop: this.cropResult,
      shards: this.shards,
      restorations: this.restorationResults,
      reports: this.photoReports,
    };
  }

  isProcessing(): boolean {
    return this.status === 'running' || this.status === 'paused';
  }

  updateOptions(opts: Partial<PipelineOptions>): void {
    this.options = { ...this.options, ...opts };
  }

  destroy(): void {
    this.cancel();
    this.emitter.clear();
  }

  // ============================================
  // STAGE RUNNER
  // ============================================

  private async runStage<T>(stage: PipelineStage, fn: () => Promise<T>): Promise<T> {
    await this.checkPauseAndCancel();

    this.progress.currentStage = stage;
    this.stageStartTimes[stage] = Date.now();

    const stageNames: Record<PipelineStage, string> = {
      idle: 'Idle',
      ingestion: 'Przygotowanie obrazu',
      detection: 'Wykrywanie zdjec',
      smartcrop: 'Inteligentne kadrowanie',
      alchemy: 'Restauracja i ulepszanie',
    };

    this.emitter.emit('stage:start', {
      stage,
      name: stageNames[stage],
      timestamp: Date.now(),
    });

    this.progress.message = stageNames[stage];
    this.emitProgress();

    try {
      const result = await fn();
      const duration = Date.now() - (this.stageStartTimes[stage] || Date.now());
      this.stageDurations[stage] = duration;
      this.emitStageComplete(stage, duration);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.emitter.emit('stage:error', {
        stage,
        error,
        recoverable: stage === 'alchemy',
      });
      throw error;
    }
  }

  // ============================================
  // STAGE 1: INGESTION
  // ============================================

  private async stageIngestion(file: File): Promise<IngestionResult> {
    this.emitStageProgress('ingestion', 10, 'Walidacja formatu pliku...');

    // Validate file size
    if (file.size > FILE_CONSTRAINTS.maxFileSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      throw new Error(
        `Plik zbyt duzy: ${sizeMB} MB (max ${FILE_CONSTRAINTS.maxFileSize / 1024 / 1024} MB)`,
      );
    }

    // Validate MIME type
    const supportedFormats = FILE_CONSTRAINTS.supportedFormats as readonly string[];
    if (!supportedFormats.includes(file.type)) {
      throw new Error(
        `Nieobslugiwany format: ${file.type}. Obslugiwane: ${supportedFormats.join(', ')}`,
      );
    }

    this.emitStageProgress('ingestion', 30, 'Sprawdzanie magic bytes...');

    // Validate magic bytes
    await this.validateMagicBytes(file);

    this.emitStageProgress('ingestion', 50, 'Konwersja do base64...');

    // Convert to base64
    const { base64, mimeType } = await fileToBase64(file);

    this.emitStageProgress('ingestion', 70, 'Odczyt wymiarow obrazu...');

    // Get image dimensions
    const dimensions = await this.getImageDimensions(file);

    if (
      dimensions.width > FILE_CONSTRAINTS.maxWidth ||
      dimensions.height > FILE_CONSTRAINTS.maxHeight
    ) {
      throw new Error(
        `Rozdzielczosc zbyt duza: ${dimensions.width}x${dimensions.height} (max ${FILE_CONSTRAINTS.maxWidth}x${FILE_CONSTRAINTS.maxHeight})`,
      );
    }

    this.emitStageProgress('ingestion', 90, 'Ekstrakcja metadanych...');

    // Extract metadata via Rust (optional)
    let exifData: Record<string, unknown> | undefined;
    if (isTauri()) {
      try {
        exifData = await safeInvoke<Record<string, unknown>>('extract_metadata', {
          imageBase64: base64,
          mimeType,
        });
      } catch {
        // extract_metadata may not exist - graceful fallback
      }
    }

    const metadata: ImageMetadata = {
      originalFormat: mimeType,
      fileSize: file.size,
      width: dimensions.width,
      height: dimensions.height,
      colorSpace: 'sRGB',
      hasAlpha: mimeType === 'image/png' || mimeType === 'image/webp',
      bitDepth: 8,
      exif: exifData,
    };

    this.emitStageProgress('ingestion', 100, 'Przygotowanie zakonczone');

    return { file, base64, mimeType, metadata, validatedAt: new Date().toISOString() };
  }

  private async validateMagicBytes(file: File): Promise<void> {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const formatChecks = Object.entries(MAGIC_BYTES);
    let matched = false;

    for (const [mime, magic] of formatChecks) {
      if (file.type === mime) {
        const isMatch = magic.every((byte, i) => bytes[i] === byte);
        if (mime === 'image/tiff' && !isMatch) {
          const isBE = TIFF_BIG_ENDIAN.every((byte, i) => bytes[i] === byte);
          if (isBE) {
            matched = true;
            break;
          }
        }
        if (isMatch) {
          matched = true;
          break;
        }
      }
    }

    // If MIME is in our table but magic bytes don't match -> corrupted
    if (!matched && MAGIC_BYTES[file.type]) {
      throw new Error(`Plik wydaje sie uszkodzony - naglowek nie pasuje do formatu ${file.type}`);
    }
  }

  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Nie udalo sie odczytac wymiarow obrazu'));
      };
      img.src = url;
    });
  }

  // ============================================
  // STAGE 2: DETECTION
  // ============================================

  private async stageDetection(ingestion: IngestionResult): Promise<DetectionResult> {
    this.emitStageProgress('detection', 10, 'Wysylanie do AI...');
    await this.checkPauseAndCancel();

    if (!isTauri()) {
      await delay(MOCK_DETECTION_DELAY);
      const { mockDetectionResult } = await import('../../hooks/api/mocks');
      this.emitStageProgress('detection', 100, 'Detekcja zakonczona');
      return {
        ...mockDetectionResult,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
      };
    }

    this.emitStageProgress('detection', 50, 'Analiza AI w toku...');

    const result = await safeInvoke<DetectionResult>('detect_photos', {
      imageBase64: ingestion.base64,
      mimeType: ingestion.mimeType,
    });

    // Fallback: if no boxes detected, treat entire image as one photo
    if (result.bounding_boxes.length === 0) {
      result.bounding_boxes = [
        {
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
          confidence: 1.0,
          label: 'full scan',
          rotation_angle: 0,
        },
      ];
      result.photo_count = 1;
    }

    this.emitStageProgress('detection', 100, `Wykryto ${result.bounding_boxes.length} zdjec`);
    return result;
  }

  // ============================================
  // STAGE 3: SMARTCROP
  // ============================================

  private async stageSmartCrop(
    ingestion: IngestionResult,
    detection: DetectionResult,
  ): Promise<CropResult> {
    this.emitStageProgress('smartcrop', 10, 'Przygotowanie kadrowania...');
    await this.checkPauseAndCancel();

    // Sort boxes by priority (confidence + position)
    const sortedBoxes = this.prioritizeBoxes(detection.bounding_boxes);

    this.emitStageProgress('smartcrop', 30, 'Przycinanie zdjec...');

    let cropResult: CropResult;

    if (!isTauri()) {
      // Browser mode: use Canvas API
      const { cropRegionBrowser } = await import('./browser-crop');
      cropResult = await cropRegionBrowser(
        ingestion.file,
        sortedBoxes,
        ingestion.file.name,
        this.options.smartCrop.padding,
      );
    } else {
      cropResult = await safeInvoke<CropResult>('crop_photos', {
        imageBase64: ingestion.base64,
        mimeType: ingestion.mimeType,
        boundingBoxes: sortedBoxes,
        originalFilename: ingestion.file.name,
      });
    }

    this.emitStageProgress('smartcrop', 80, 'Budowanie kontekstu shardow...');

    // Build smart shards with context
    this.shards = cropResult.photos.map((photo, idx) => ({
      ...photo,
      priority: this.calculatePriority(sortedBoxes[idx], idx),
      context: {
        containsText: false,
        containsDamage: true,
        damageTypes: ['unknown'],
        objectTypes: [sortedBoxes[idx]?.label || 'photo'],
        neighbors: this.findNeighbors(idx, sortedBoxes),
      },
    }));

    this.progress.totalPhotos = cropResult.photos.length;
    this.emitStageProgress('smartcrop', 100, `Przycieto ${cropResult.photos.length} zdjec`);
    return cropResult;
  }

  private prioritizeBoxes(boxes: BoundingBox[]): BoundingBox[] {
    return [...boxes].sort((a, b) => {
      const confDiff = b.confidence - a.confidence;
      if (Math.abs(confDiff) > 0.1) return confDiff;
      const rowDiff = Math.floor(a.y / 200) - Math.floor(b.y / 200);
      if (rowDiff !== 0) return rowDiff;
      return a.x - b.x;
    });
  }

  private calculatePriority(box: BoundingBox | undefined, index: number): number {
    if (!box) return 5;
    const confPriority = Math.round(box.confidence * 10);
    const posPriority = Math.max(0, 3 - index);
    return Math.min(10, Math.max(1, Math.round((confPriority + posPriority) / 2)));
  }

  private findNeighbors(index: number, boxes: BoundingBox[]): string[] {
    const current = boxes[index];
    if (!current) return [];
    return boxes
      .map((b, i) => ({ box: b, idx: i }))
      .filter(({ box, idx }) => {
        if (idx === index) return false;
        const dx = Math.abs(box.x + box.width / 2 - (current.x + current.width / 2));
        const dy = Math.abs(box.y + box.height / 2 - (current.y + current.height / 2));
        return dx < 150 || dy < 150;
      })
      .map(({ idx }) => `shard-${idx}`);
  }

  // ============================================
  // STAGE 4: ALCHEMY
  // ============================================

  private async stageAlchemy(cropResult: CropResult): Promise<void> {
    const photos = cropResult.photos;
    const total = photos.length;
    this.progress.totalPhotos = total;

    if (this.options.concurrency > 1 && total > 1) {
      await this.alchemyBatch(photos, total);
    } else {
      await this.alchemySequential(photos, total);
    }
  }

  private async alchemySequential(photos: CroppedPhoto[], total: number): Promise<void> {
    for (let i = 0; i < photos.length; i++) {
      await this.checkPauseAndCancel();
      await this.processOnePhoto(photos[i], i, total);
    }
  }

  private async alchemyBatch(photos: CroppedPhoto[], total: number): Promise<void> {
    const concurrency = Math.min(this.options.concurrency, photos.length);
    let nextIndex = 0;

    const processNext = async (): Promise<void> => {
      while (nextIndex < photos.length) {
        await this.checkPauseAndCancel();
        const idx = nextIndex++;
        await this.processOnePhoto(photos[idx], idx, total);
      }
    };

    const active: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) {
      active.push(processNext());
    }
    await Promise.all(active);
  }

  private async processOnePhoto(photo: CroppedPhoto, index: number, total: number): Promise<void> {
    const startTime = Date.now();
    this.progress.currentPhotoIndex = index;
    const stageBase = (index / total) * 100;

    this.emitStageProgress(
      'alchemy',
      Math.round(stageBase),
      `Restauracja zdjecia ${index + 1}/${total}...`,
    );

    const report: RestorationReport = {
      photoId: photo.id,
      enhancementsApplied: [],
      qualityScore: { before: 0, after: 0, improvement: 0 },
      processingTime: { total: 0, restoration: 0, upscale: 0, localFilters: 0 },
      localFiltersApplied: [],
    };

    // Retry wrapper
    const restorationResult = await this.withRetry(() => this.restorePhoto(photo), index);

    report.processingTime.restoration = Date.now() - startTime;
    report.enhancementsApplied = restorationResult.improvements;

    let finalImage = restorationResult.restored_image;

    // Optional: Apply local filters (Rust-side)
    if (this.options.enableLocalFilters && isTauri()) {
      const filterStart = Date.now();
      try {
        finalImage = await safeInvoke<string>('apply_local_filters', {
          imageBase64: finalImage,
          mimeType: photo.mime_type,
        });
        report.localFiltersApplied.push('enhance');
      } catch {
        // local filters command may not exist yet
      }
      report.processingTime.localFilters = Date.now() - filterStart;
    }

    // Optional: Upscale
    if (this.options.enableUpscale && isTauri()) {
      const upscaleStart = Date.now();
      this.emitStageProgress(
        'alchemy',
        Math.round(stageBase + (0.7 / total) * 100),
        `Podnoszenie rozdzielczosci ${index + 1}/${total}...`,
      );
      try {
        finalImage = await safeInvoke<string>('upscale_image', {
          imageBase64: finalImage,
          mimeType: photo.mime_type,
          scaleFactor: this.options.upscaleFactor,
        });
        report.enhancementsApplied.push(`Upscale ${this.options.upscaleFactor}x`);
      } catch (err) {
        console.warn('[Pipeline] Upscale failed:', err);
      }
      report.processingTime.upscale = Date.now() - upscaleStart;
    }

    // Store result
    const finalResult: RestorationResult = { ...restorationResult, restored_image: finalImage };
    this.restorationResults.set(photo.id, finalResult);

    report.processingTime.total = Date.now() - startTime;
    report.qualityScore.before = 40;
    report.qualityScore.after = Math.min(95, 40 + restorationResult.improvements.length * 10);
    report.qualityScore.improvement = report.qualityScore.after - report.qualityScore.before;

    this.photoReports.push(report);

    this.emitter.emit('photo:complete', { photoIndex: index, photoId: photo.id, report });

    const photoProgress = Math.round(((index + 1) / total) * 100);
    this.emitStageProgress('alchemy', photoProgress, `Zdjecie ${index + 1}/${total} przetworzone`);
  }

  private async restorePhoto(photo: CroppedPhoto): Promise<RestorationResult> {
    if (!isTauri()) {
      await delay(MOCK_RESTORATION_DELAY);
      return createMockRestorationResult(photo.image_base64);
    }
    return safeInvoke<RestorationResult>('restore_image', {
      imageBase64: photo.image_base64,
      mimeType: photo.mime_type,
    });
  }

  // ============================================
  // RETRY WITH EXPONENTIAL BACKOFF
  // ============================================

  private async withRetry<T>(fn: () => Promise<T>, photoIndex: number): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const willRetry = attempt < this.options.maxRetries;

        this.emitter.emit('photo:error', { photoIndex, error: lastError, willRetry });

        if (!willRetry) break;

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped)
        const backoffDelay = Math.min(
          RETRY_CONFIG.baseDelay * RETRY_CONFIG.backoffMultiplier ** attempt,
          RETRY_CONFIG.maxDelay,
        );

        console.warn(
          `[Pipeline] Photo ${photoIndex} attempt ${attempt + 1} failed, retrying in ${backoffDelay}ms:`,
          lastError.message,
        );

        await delay(backoffDelay);
        await this.checkPauseAndCancel();
      }
    }

    throw lastError || new Error('Unknown error during retry');
  }

  // ============================================
  // PAUSE / CANCEL CHECK
  // ============================================

  private async checkPauseAndCancel(): Promise<void> {
    if (this.cancelledRef) throw new Error('Pipeline cancelled');
    if (this.pausePromise) await this.pausePromise;
    if (this.cancelledRef) throw new Error('Pipeline cancelled');
  }

  // ============================================
  // PROGRESS HELPERS
  // ============================================

  private emitStageProgress(stage: PipelineStage, progress: number, message: string): void {
    this.progress.stageProgress = progress;
    this.progress.message = message;
    this.updateOverallProgress(stage, progress);
    this.emitter.emit('stage:progress', { stage, progress, message });
    this.emitProgress();
  }

  private emitStageComplete(stage: PipelineStage, duration: number): void {
    this.progress.stageTimings[stage] = duration;
    this.emitter.emit('stage:complete', { stage, duration });
  }

  private emitProgress(): void {
    this.updateEstimatedTime();
    this.emitter.emit('pipeline:progress', { ...this.progress });
  }

  private updateOverallProgress(stage: PipelineStage, stageProgress: number): void {
    const stageWeights: Record<PipelineStage, { start: number; weight: number }> = {
      idle: { start: 0, weight: 0 },
      ingestion: { start: 0, weight: 5 },
      detection: { start: 5, weight: 15 },
      smartcrop: { start: 20, weight: 10 },
      alchemy: { start: 30, weight: 70 },
    };
    const w = stageWeights[stage];
    this.progress.overallProgress = Math.round(w.start + (stageProgress / 100) * w.weight);
  }

  private updateEstimatedTime(): void {
    const elapsed = Date.now() - this.progress.startTime;
    const progress = this.progress.overallProgress;
    if (progress > 5) {
      const totalEstimate = (elapsed / progress) * 100;
      this.progress.estimatedTimeRemaining = Math.round(totalEstimate - elapsed);
    }
  }

  // ============================================
  // REPORT BUILDER
  // ============================================

  private buildReport(): PipelineReport {
    const now = new Date().toISOString();
    const totalImprovement =
      this.photoReports.length > 0
        ? this.photoReports.reduce((sum, r) => sum + r.qualityScore.improvement, 0) /
          this.photoReports.length
        : 0;

    return {
      id: uuidv4(),
      startedAt: new Date(this.progress.startTime).toISOString(),
      completedAt: now,
      totalDuration: Date.now() - this.progress.startTime,
      stageDurations: this.stageDurations as Record<PipelineStage, number>,
      photoReports: this.photoReports,
      overallQualityImprovement: Math.round(totalImprovement),
    };
  }

  // ============================================
  // RESET
  // ============================================

  private reset(): void {
    this.cancelledRef = false;
    this.pausePromise = null;
    this.pauseResolve = null;
    this.status = 'idle';
    this.stageStartTimes = {};
    this.stageDurations = {};
    this.ingestionResult = null;
    this.detectionResult = null;
    this.cropResult = null;
    this.shards = [];
    this.photoReports = [];
    this.restorationResults = new Map();
    this.progress = this.createInitialProgress();
  }

  private createInitialProgress(): PipelineProgress {
    return {
      currentStage: 'idle',
      totalStages: 4,
      stageProgress: 0,
      overallProgress: 0,
      status: 'idle',
      currentPhotoIndex: 0,
      totalPhotos: 0,
      message: '',
      startTime: 0,
      estimatedTimeRemaining: null,
      stageTimings: {},
    };
  }
}
