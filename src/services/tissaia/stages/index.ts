/**
 * Tissaia - Stages Index
 * =======================
 * Re-exports all pipeline stages.
 */

// Stage 1: Ingestion
export * as ingestion from './ingestion';
export {
  ingest,
  isSupportedFormat,
  validateFile,
  formatFileSize,
  imageDataToBlob,
  imageDataToDataUrl,
} from './ingestion';

// Stage 2: Detection
export * as detection from './detection';
export {
  detect,
  sobelEdgeDetection,
  detectObjects,
  detectAllDamage,
  generateCutMap,
} from './detection';

// Stage 3: SmartCrop
export * as smartcrop from './smartcrop';
export {
  smartCrop,
  mergeRectangles,
  extractRegionImageData,
} from './smartcrop';

// Stage 4: Alchemy
export * as alchemy from './alchemy';
export {
  restore,
  calculateQualityScore,
  denoise,
  sharpen,
  adjustContrast,
  correctColors,
} from './alchemy';
