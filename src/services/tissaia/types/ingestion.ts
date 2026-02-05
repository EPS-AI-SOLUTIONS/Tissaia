/**
 * Tissaia - Stage 1: Ingestion Types
 * ===================================
 * Types for image loading and preparation.
 */

// ============================================
// FORMAT TYPES
// ============================================

export type SupportedFormat = 'png' | 'jpg' | 'jpeg' | 'tiff' | 'bmp' | 'webp';

// ============================================
// METADATA TYPES
// ============================================

export interface ImageMetadata {
  originalFormat: string;
  fileSize: number;
  colorSpace: string;
  bitDepth: number;
  hasAlpha: boolean;
  exif?: Record<string, unknown>;
  originalName?: string;
}

// ============================================
// PREPARED DATA
// ============================================

export interface PreparedData {
  buffer: Uint8ClampedArray;
  width: number;
  height: number;
  channels: 4;
  metadata: ImageMetadata;
  imageData: ImageData;
}

// ============================================
// CONFIGURATION
// ============================================

export interface IngestionConfig {
  normalizeColorSpace: boolean;
  preserveExif: boolean;
  targetColorSpace: string;
}
