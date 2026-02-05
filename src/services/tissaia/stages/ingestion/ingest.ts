/**
 * Tissaia Stage 1: Ingestion - Main Function
 * ==========================================
 * Main ingestion orchestrator.
 */

import type { PreparedData, IngestionConfig } from '../../types';
import { DEFAULT_INGESTION_CONFIG } from '../../config';
import { logger } from '../../logger';

import { validateFile, validateDimensions } from './validation';
import { detectFormatFromBytes } from './format-detection';
import { loadFileAsBuffer, loadImage, getImageData } from './loader';
import { extractMetadata } from './metadata';

export interface IngestionOptions {
  config?: Partial<IngestionConfig>;
  onProgress?: (progress: number, message: string) => void;
  filename?: string;
}

/**
 * Stage 1: Ingest image file
 *
 * Process flow:
 * 1. Validate file (size, format)
 * 2. Load file and detect format
 * 3. Load as image element
 * 4. Validate dimensions
 * 5. Extract metadata
 * 6. Create ImageData
 * 7. Return PreparedData
 */
export async function ingest(
  input: File | Blob | ArrayBuffer,
  options: IngestionOptions = {}
): Promise<PreparedData> {
  const config = { ...DEFAULT_INGESTION_CONFIG, ...options.config };
  const { onProgress, filename } = options;

  logger.info('Starting ingestion stage', 1);
  onProgress?.(0, 'Starting image ingestion...');

  // Step 1: Convert ArrayBuffer to Blob if needed
  let file: File | Blob;
  let buffer: ArrayBuffer;

  if (input instanceof ArrayBuffer) {
    buffer = input;
    file = new Blob([input]);
    logger.debug('Input is ArrayBuffer, converted to Blob', 1);
  } else {
    file = input;
    buffer = await loadFileAsBuffer(file);
    logger.debug('Loaded file as ArrayBuffer', 1);
  }

  onProgress?.(10, 'File loaded');

  // Step 2: Validate file
  const fileValidation = validateFile(file, filename);
  if (!fileValidation.valid) {
    const error = new Error(`File validation failed: ${fileValidation.errors.join(', ')}`);
    logger.error('File validation failed', 1, fileValidation.errors);
    throw error;
  }

  if (fileValidation.warnings.length > 0) {
    logger.warn('File validation warnings', 1, fileValidation.warnings);
  }

  onProgress?.(20, 'File validated');

  // Step 3: Detect format from magic bytes
  const detectedFormat = detectFormatFromBytes(buffer);
  if (!detectedFormat) {
    logger.warn('Could not detect format from magic bytes, using filename', 1);
  }

  onProgress?.(30, 'Format detected');

  // Step 4: Load image
  logger.debug('Loading image element', 1);
  const img = await loadImage(file);

  onProgress?.(50, 'Image loaded');

  // Step 5: Validate dimensions
  const dimValidation = validateDimensions(img.width, img.height);
  if (!dimValidation.valid) {
    const error = new Error(`Dimension validation failed: ${dimValidation.errors.join(', ')}`);
    logger.error('Dimension validation failed', 1, dimValidation.errors);
    throw error;
  }

  if (dimValidation.warnings.length > 0) {
    logger.warn('Dimension warnings', 1, dimValidation.warnings);
  }

  onProgress?.(60, 'Dimensions validated');

  // Step 6: Extract metadata
  const metadata = extractMetadata(file, img, detectedFormat, filename);
  logger.debug('Metadata extracted', 1, metadata);

  onProgress?.(70, 'Metadata extracted');

  // Step 7: Get ImageData
  logger.debug('Getting ImageData from image', 1);
  const imageData = getImageData(img);

  onProgress?.(90, 'ImageData created');

  // Step 8: Create PreparedData
  const preparedData: PreparedData = {
    buffer: imageData.data,
    width: imageData.width,
    height: imageData.height,
    channels: 4,
    metadata,
    imageData,
  };

  logger.info(`Ingestion complete: ${img.width}x${img.height} ${metadata.originalFormat}`, 1);
  onProgress?.(100, 'Ingestion complete');

  return preparedData;
}

export default ingest;
