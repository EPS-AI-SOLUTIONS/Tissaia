/**
 * Tissaia Stage 1: Ingestion - Validation
 * =======================================
 * File and dimension validation functions.
 */

import type { SupportedFormat, ValidationResult } from '../../types';
import {
  MAX_FILE_SIZE,
  MAX_WIDTH,
  MAX_HEIGHT,
  MIN_DIMENSION,
  SUPPORTED_FORMATS,
  MIME_TYPES,
} from '../../config';
import { formatFileSize } from './utils';

/**
 * Check if file format is supported by extension
 */
export function isSupportedFormat(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase() as SupportedFormat;
  return SUPPORTED_FORMATS.includes(extension);
}

/**
 * Get format from filename
 */
export function getFormatFromFilename(filename: string): SupportedFormat | null {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension && SUPPORTED_FORMATS.includes(extension as SupportedFormat)) {
    return extension as SupportedFormat;
  }
  return null;
}

/**
 * Validate file before processing
 */
export function validateFile(file: File | Blob, filename?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum (${formatFileSize(MAX_FILE_SIZE)})`);
  }

  if (file.size === 0) {
    errors.push('File is empty');
  }

  // Check format from filename
  const name = filename || (file instanceof File ? file.name : 'unknown');
  if (!isSupportedFormat(name)) {
    const ext = name.split('.').pop()?.toLowerCase() || 'unknown';
    errors.push(`Unsupported format: ${ext}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
  }

  // Check MIME type if available
  if (file.type && !Object.values(MIME_TYPES).includes(file.type)) {
    warnings.push(`Unexpected MIME type: ${file.type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate image dimensions
 */
export function validateDimensions(width: number, height: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    errors.push(`Image dimensions (${width}x${height}) exceed maximum (${MAX_WIDTH}x${MAX_HEIGHT})`);
  }

  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    errors.push(`Image dimensions (${width}x${height}) below minimum (${MIN_DIMENSION}x${MIN_DIMENSION})`);
  }

  if (width * height > 100_000_000) {
    warnings.push('Very large image - processing may be slow');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
