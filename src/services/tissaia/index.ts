/**
 * Tissaia Forensic Restoration Engine
 * ===================================
 * Advanced 4-stage image processing pipeline for forensic analysis
 * and restoration of scanned documents, photographs, and damaged images.
 *
 * Named after the legendary sorceress from The Witcher universe,
 * known for her mastery of magic and restoration.
 *
 * ## Architecture
 *
 * The engine is organized into modular components:
 * - `types/` - Type definitions by category
 * - `utils/` - Utility functions (pixel, geometry, canvas)
 * - `algorithms/` - Image processing algorithms
 *
 * @packageDocumentation
 * @module tissaia
 * @version 2.1.0
 */

// ============================================
// MAIN EXPORTS
// ============================================

// Pipeline
export { TissaiaPipeline, processImage, processImageWithProgress } from './pipeline';

// Configuration
export {
  TISSAIA_CONFIG,
  CONFIG_PRESETS,
  mergeConfig,
  validateConfig,
  MAX_FILE_SIZE,
  MAX_WIDTH,
  MAX_HEIGHT,
  SUPPORTED_FORMATS,
  MIME_TYPES,
  KERNELS,
  DETECTION_COLORS,
  STAGE_INFO,
} from './config';

// Logger
export {
  logger,
  getTissaiaLogs,
  clearTissaiaLogs,
  setTissaiaLogLevel,
  enableTissaiaLogging,
  type LogLevel,
  type LogEntry,
} from './logger';

// Stage functions (for advanced usage)
export { ingest, validateFile, isSupportedFormat, formatFileSize, imageDataToBlob, imageDataToDataUrl } from './stage1-ingestion';
export { detect } from './stage2-detection';
export { smartCrop, mergeRectangles, extractRegionImageData } from './stage3-smartcrop';
export { restore, calculateQualityScore, denoise, sharpen, adjustContrast, correctColors } from './stage4-alchemy';

// ============================================
// MODULAR EXPORTS
// ============================================

// Utilities - re-export from utils/
export * as utils from './utils';
export {
  // Pixel utilities
  generateId,
  clamp,
  getPixelIndex,
  getPixel,
  setPixel,
  toGrayscale,
  getLuminance,
  rgbToHsl,
  hslToRgb,
  // Geometry utilities
  rectanglesOverlap,
  rectangleArea,
  pointInRectangle,
  rectangleIntersection,
  expandRectangle,
  constrainRectangle,
  rectangleCenter,
  pointDistance,
  aspectRatio,
  // Canvas utilities
  createCanvas,
  getContext,
  createImageData,
  cloneImageData,
  extractRegion,
  putRegion,
  loadImageData,
  resizeImageData,
} from './utils';

// Algorithms - re-export from algorithms/
export * as algorithms from './algorithms';
export {
  // Convolution
  applyKernel,
  applyKernelRGB,
  applySeparableKernel,
  // Edge detection
  sobelEdgeDetection,
  createEdgeMask,
  cannyEdgeDetection,
  laplacianEdgeDetection,
  // Enhancement
  calculateHistogram,
  adjustBrightness,
  adjustSaturation,
  gammaCorrection,
  // Quality
  calculateSharpness,
  calculateNoise,
  calculateColorAccuracy,
  calculateSNR,
  // Connected components
  findConnectedComponents,
  labelConnectedComponents,
  extractRegionMask,
  dilateMask,
  erodeMask,
} from './algorithms';

// ============================================
// TYPE EXPORTS
// ============================================

export type {
  // Basic types
  Rectangle,
  Point,
  Size,

  // Stage 1: Ingestion
  PreparedData,
  ImageMetadata,
  SupportedFormat,
  IngestionConfig,
  ValidationResult,
  FileInfo,

  // Stage 2: Detection
  ObjectType,
  DamageType,
  DamageSeverity,
  DetectedObject,
  DamageRegion,
  CutRegion,
  CutMap,
  DetectionResult,
  DetectionConfig,

  // Stage 3: SmartCrop
  CropStrategy,
  ShardContext,
  CroppedShard,
  SmartCropConfig,
  SmartCropResult,

  // Stage 4: Alchemy
  InpaintingMethod,
  OutputFormat,
  QualityScore,
  DamageRepairReport,
  RestorationReport,
  RestoredImage,
  AlchemyConfig,

  // Pipeline
  PipelineStatus,
  StageNumber,
  StageName,
  StageResult,
  PipelineProgress,
  PipelineConfig,
  TissaiaConfig,

  // Events
  StageStartEvent,
  StageProgressEvent,
  StageCompleteEvent,
  StageErrorEvent,
  PipelineCompleteEvent,
  PipelineErrorEvent,
  TissaiaEvents,

  // Utility
  PixelProcessor,
  Kernel,
} from './types';

// Type guards
export {
  isPreparedData,
  isDetectionResult,
  isSmartCropResult,
  isRestoredImage,
} from './types';

// ============================================
// DEFAULT EXPORT
// ============================================

export { TissaiaPipeline as default } from './pipeline';
