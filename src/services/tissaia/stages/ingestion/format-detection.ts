/**
 * Tissaia Stage 1: Ingestion - Format Detection
 * ==============================================
 * Magic bytes and format detection.
 */

import type { SupportedFormat } from '../../types';
import { MAGIC_BYTES } from '../../config';

/**
 * Check if bytes match magic bytes pattern
 */
function matchesMagicBytes(bytes: Uint8Array, pattern: number[]): boolean {
  if (bytes.length < pattern.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    if (bytes[i] !== pattern[i]) return false;
  }
  return true;
}

/**
 * Detect format from magic bytes
 */
export function detectFormatFromBytes(buffer: ArrayBuffer): SupportedFormat | null {
  const bytes = new Uint8Array(buffer.slice(0, 12));

  // Check PNG
  if (matchesMagicBytes(bytes, MAGIC_BYTES.png)) {
    return 'png';
  }

  // Check JPEG
  if (matchesMagicBytes(bytes, MAGIC_BYTES.jpg)) {
    return 'jpg';
  }

  // Check WebP (RIFF....WEBP)
  if (matchesMagicBytes(bytes, MAGIC_BYTES.webp)) {
    const webpSignature = new Uint8Array([0x57, 0x45, 0x42, 0x50]); // "WEBP"
    if (matchesMagicBytes(bytes.slice(8), Array.from(webpSignature))) {
      return 'webp';
    }
  }

  // Check BMP
  if (matchesMagicBytes(bytes, MAGIC_BYTES.bmp)) {
    return 'bmp';
  }

  // Check TIFF (little-endian or big-endian)
  if (matchesMagicBytes(bytes, MAGIC_BYTES.tiff_le) || matchesMagicBytes(bytes, MAGIC_BYTES.tiff_be)) {
    return 'tiff';
  }

  return null;
}

/**
 * Get MIME type from format
 */
export function getMimeType(format: SupportedFormat): string {
  const mimeTypes: Record<SupportedFormat, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    tiff: 'image/tiff',
    bmp: 'image/bmp',
    webp: 'image/webp',
  };
  return mimeTypes[format];
}

/**
 * Check if format supports alpha channel
 */
export function supportsAlpha(format: SupportedFormat): boolean {
  return format === 'png' || format === 'webp';
}

/**
 * Check if format is lossy
 */
export function isLossyFormat(format: SupportedFormat): boolean {
  return format === 'jpg' || format === 'jpeg' || format === 'webp';
}
