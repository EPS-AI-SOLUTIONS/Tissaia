/**
 * Tissaia Stage 1: Ingestion
 * ==========================
 * Image loading, validation, and preparation.
 */

// Main function
export { ingest, type IngestionOptions } from './ingest';
export { ingest as default } from './ingest';

// Validation
export {
  isSupportedFormat,
  getFormatFromFilename,
  validateFile,
  validateDimensions,
} from './validation';

// Format detection
export {
  detectFormatFromBytes,
  getMimeType,
  supportsAlpha,
  isLossyFormat,
} from './format-detection';

// File loading
export {
  loadFileAsBuffer,
  loadFileAsDataUrl,
  loadImage,
  loadImageFromUrl,
  getImageData,
  loadFileAsImageData,
} from './loader';

// Metadata
export {
  extractMetadata,
  getFileInfo,
  createMetadataFromImageData,
} from './metadata';

// Utilities
export {
  formatFileSize,
  imageDataToBlob,
  imageDataToDataUrl,
  downloadImageData,
  calculateMemoryUsage,
  fitsInMemoryBudget,
} from './utils';
