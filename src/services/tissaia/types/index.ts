/**
 * Tissaia - Type Definitions Index
 * =================================
 * Re-exports all types from categorized modules.
 */

// Basic types
export type {
  Rectangle,
  Point,
  Size,
  ValidationResult,
  FileInfo,
  PixelProcessor,
  Kernel,
} from './basic';

// Stage 1: Ingestion types
export type {
  SupportedFormat,
  ImageMetadata,
  PreparedData,
  IngestionConfig,
} from './ingestion';

// Stage 2: Detection types
export type {
  ObjectType,
  DamageType,
  DamageSeverity,
  DetectedObject,
  DamageRegion,
  CutRegion,
  CutMap,
  DetectionResult,
  DetectionConfig,
} from './detection';

// Stage 3: SmartCrop types
export type {
  CropStrategy,
  ShardContext,
  CroppedShard,
  SmartCropResult,
  SmartCropConfig,
} from './smartcrop';

// Stage 4: Alchemy types
export type {
  InpaintingMethod,
  OutputFormat,
  QualityScore,
  DamageRepairReport,
  RestorationReport,
  RestoredImage,
  AlchemyConfig,
} from './alchemy';

// Pipeline types
export type {
  PipelineStatus,
  StageNumber,
  StageName,
  StageResult,
  PipelineProgress,
  PipelineConfig,
  TissaiaConfig,
  StageStartEvent,
  StageProgressEvent,
  StageCompleteEvent,
  StageErrorEvent,
  PipelineCompleteEvent,
  PipelineErrorEvent,
  TissaiaEvents,
} from './pipeline';

// Type guards
export {
  isPreparedData,
  isDetectionResult,
  isSmartCropResult,
  isRestoredImage,
} from './guards';
