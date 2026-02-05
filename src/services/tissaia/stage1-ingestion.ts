/**
 * Tissaia Forensic Restoration Engine - Stage 1: Ingestion
 * ========================================================
 * Load, validate, and prepare image data for processing.
 *
 * This file re-exports from the modular stages/ingestion/ directory
 * for backward compatibility.
 */

// Re-export main function
export { ingest, type IngestionOptions } from './stages/ingestion';
export { ingest as default } from './stages/ingestion';

// Re-export validation
export {
  isSupportedFormat,
  getFormatFromFilename,
  validateFile,
  validateDimensions,
} from './stages/ingestion';

// Re-export format detection
export {
  detectFormatFromBytes,
  getMimeType,
  supportsAlpha,
  isLossyFormat,
} from './stages/ingestion';

// Re-export loader
export {
  loadFileAsBuffer,
  loadFileAsDataUrl,
  loadImage,
  loadImageFromUrl,
  getImageData,
  loadFileAsImageData,
} from './stages/ingestion';

// Re-export metadata
export {
  extractMetadata,
  getFileInfo,
  createMetadataFromImageData,
} from './stages/ingestion';

// Re-export utils
export {
  formatFileSize,
  imageDataToBlob,
  imageDataToDataUrl,
  downloadImageData,
  calculateMemoryUsage,
  fitsInMemoryBudget,
} from './stages/ingestion';
