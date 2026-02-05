/**
 * Tissaia Stage 1: Ingestion - Metadata
 * =====================================
 * Metadata extraction and file info.
 */

import type { SupportedFormat, ImageMetadata, FileInfo } from '../../types';
import { getFormatFromFilename } from './validation';
import { supportsAlpha } from './format-detection';

/**
 * Extract metadata from file and image
 */
export function extractMetadata(
  file: File | Blob,
  img: HTMLImageElement,
  detectedFormat: SupportedFormat | null,
  filename?: string
): ImageMetadata {
  const name = filename || (file instanceof File ? file.name : 'unknown');
  const format = detectedFormat || getFormatFromFilename(name) || 'unknown';

  return {
    originalFormat: format,
    fileSize: file.size,
    colorSpace: 'sRGB', // Canvas always converts to sRGB
    bitDepth: 8, // Canvas uses 8-bit per channel
    hasAlpha: format !== 'unknown' && supportsAlpha(format as SupportedFormat),
    originalName: name,
  };
}

/**
 * Get file info
 */
export function getFileInfo(file: File | Blob, filename?: string): FileInfo {
  return {
    name: filename || (file instanceof File ? file.name : 'unknown'),
    size: file.size,
    type: file.type,
    lastModified: file instanceof File ? file.lastModified : Date.now(),
  };
}

/**
 * Create basic metadata from ImageData
 */
export function createMetadataFromImageData(
  imageData: ImageData,
  filename: string = 'unknown'
): ImageMetadata {
  return {
    originalFormat: 'unknown',
    fileSize: imageData.data.length,
    colorSpace: 'sRGB',
    bitDepth: 8,
    hasAlpha: true,
    originalName: filename,
  };
}
