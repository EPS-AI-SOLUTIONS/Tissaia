// src/services/pipeline/config.ts
/**
 * Tissaia Pipeline Configuration
 * ==============================
 * Central configuration for the forensic restoration pipeline.
 */
import type { PipelineOptions, SmartCropOptions } from './types';

// ============================================
// FILE CONSTRAINTS
// ============================================

export const FILE_CONSTRAINTS = {
  maxFileSize: 50 * 1024 * 1024, // 50 MB
  maxWidth: 10_000,
  maxHeight: 10_000,
  supportedFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/tiff', 'image/bmp'] as const,
  supportedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'tiff', 'tif', 'bmp'] as const,
} as const;

// Magic bytes for format validation
export const MAGIC_BYTES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // "RIFF"
  'image/bmp': [0x42, 0x4d],
  'image/tiff': [0x49, 0x49], // or [0x4D, 0x4D] for big-endian
};

export const TIFF_BIG_ENDIAN: number[] = [0x4d, 0x4d];

// ============================================
// SMART CROP DEFAULTS
// ============================================

export const DEFAULT_SMART_CROP: SmartCropOptions = {
  strategy: 'adaptive',
  padding: 0.02, // 2% padding factor
  minShardSize: 50, // minimum pixels
  maxShards: 100,
  preserveAspectRatio: true,
};

// ============================================
// PIPELINE DEFAULTS
// ============================================

export const DEFAULT_PIPELINE_OPTIONS: PipelineOptions = {
  enableLocalFilters: false,
  enableUpscale: true,
  upscaleFactor: 2.0,
  concurrency: 1,
  maxRetries: 3,
  smartCrop: DEFAULT_SMART_CROP,
  enableVerification: true,
};

// ============================================
// RETRY CONFIG
// ============================================

export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 16000, // 16 seconds
  backoffMultiplier: 2,
} as const;

// ============================================
// BATCH CONFIG
// ============================================

export const BATCH_CONFIG = {
  maxConcurrency: 3,
  defaultConcurrency: 1,
} as const;

// ============================================
// PROGRESS UPDATE INTERVAL
// ============================================

export const PROGRESS_UPDATE_INTERVAL = 100; // ms
