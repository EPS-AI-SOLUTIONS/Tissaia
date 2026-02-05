/**
 * Tissaia Forensic Restoration Engine - Configuration
 * ===================================================
 * Default configuration and constants for the pipeline.
 */

import type {
  TissaiaConfig,
  SupportedFormat,
  IngestionConfig,
  DetectionConfig,
  SmartCropConfig,
  AlchemyConfig,
  PipelineConfig,
  Kernel,
} from './types';

// ============================================
// FILE CONSTRAINTS
// ============================================

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const MAX_WIDTH = 10000;
export const MAX_HEIGHT = 10000;
export const MIN_DIMENSION = 10;

export const SUPPORTED_FORMATS: SupportedFormat[] = [
  'png',
  'jpg',
  'jpeg',
  'tiff',
  'bmp',
  'webp',
];

export const MIME_TYPES: Record<SupportedFormat, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  tiff: 'image/tiff',
  bmp: 'image/bmp',
  webp: 'image/webp',
};

export const MAGIC_BYTES: Record<string, number[]> = {
  png: [0x89, 0x50, 0x4e, 0x47],
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  tiff_le: [0x49, 0x49, 0x2a, 0x00],
  tiff_be: [0x4d, 0x4d, 0x00, 0x2a],
  bmp: [0x42, 0x4d],
  webp: [0x52, 0x49, 0x46, 0x46],
};

// ============================================
// STAGE 1: INGESTION CONFIG
// ============================================

export const DEFAULT_INGESTION_CONFIG: IngestionConfig = {
  normalizeColorSpace: true,
  preserveExif: true,
  targetColorSpace: 'sRGB',
};

// ============================================
// STAGE 2: DETECTION CONFIG
// ============================================

export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  edgeThreshold: 50,
  minObjectArea: 100,
  damageConfidenceThreshold: 0.7,
  enableVisualization: true,
};

// Detection color palette for visualization
export const DETECTION_COLORS = {
  object: {
    text: '#4CAF50',      // Green
    image: '#2196F3',     // Blue
    signature: '#9C27B0', // Purple
    stamp: '#FF9800',     // Orange
    barcode: '#00BCD4',   // Cyan
    face: '#E91E63',      // Pink
    unknown: '#9E9E9E',   // Gray
  },
  damage: {
    stain: '#795548',     // Brown
    tear: '#F44336',      // Red
    fold: '#FF5722',      // Deep Orange
    fade: '#FFEB3B',      // Yellow
    noise: '#607D8B',     // Blue Gray
    artifact: '#673AB7',  // Deep Purple
    scratch: '#FF5722',   // Deep Orange
  },
  severity: {
    low: '#4CAF50',       // Green
    medium: '#FF9800',    // Orange
    high: '#F44336',      // Red
  },
};

// ============================================
// STAGE 3: SMARTCROP CONFIG
// ============================================

export const DEFAULT_SMARTCROP_CONFIG: SmartCropConfig = {
  strategy: 'adaptive',
  padding: 10,
  minShardSize: 50,
  maxShards: 100,
  preserveAspectRatio: true,
};

// ============================================
// STAGE 4: ALCHEMY CONFIG
// ============================================

export const DEFAULT_ALCHEMY_CONFIG: AlchemyConfig = {
  denoiseStrength: 1.5,
  sharpenAmount: 1.0,
  contrastBoost: 1.2,
  colorCorrection: true,
  inpaintingMethod: 'patchmatch',
  outputFormat: 'png',
  outputQuality: 100,
};

// Image processing kernels
export const KERNELS: Record<string, Kernel> = {
  // Edge detection (Sobel X)
  sobelX: {
    data: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
    size: 3,
    divisor: 1,
    offset: 128,
  },
  // Edge detection (Sobel Y)
  sobelY: {
    data: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
    size: 3,
    divisor: 1,
    offset: 128,
  },
  // Gaussian blur 3x3
  gaussianBlur3: {
    data: [1, 2, 1, 2, 4, 2, 1, 2, 1],
    size: 3,
    divisor: 16,
    offset: 0,
  },
  // Gaussian blur 5x5
  gaussianBlur5: {
    data: [
      1, 4, 6, 4, 1,
      4, 16, 24, 16, 4,
      6, 24, 36, 24, 6,
      4, 16, 24, 16, 4,
      1, 4, 6, 4, 1,
    ],
    size: 5,
    divisor: 256,
    offset: 0,
  },
  // Sharpen
  sharpen: {
    data: [0, -1, 0, -1, 5, -1, 0, -1, 0],
    size: 3,
    divisor: 1,
    offset: 0,
  },
  // Unsharp mask
  unsharpMask: {
    data: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
    size: 3,
    divisor: 1,
    offset: 0,
  },
  // Emboss
  emboss: {
    data: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
    size: 3,
    divisor: 1,
    offset: 128,
  },
  // Laplacian edge detection
  laplacian: {
    data: [0, 1, 0, 1, -4, 1, 0, 1, 0],
    size: 3,
    divisor: 1,
    offset: 128,
  },
};

// ============================================
// PIPELINE CONFIG
// ============================================

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  parallelProcessing: false,
  enableLogging: true,
  logLevel: 'info',
  progressInterval: 100,
};

// Stage names and durations (for progress estimation)
export const STAGE_INFO = {
  1: { name: 'ingestion' as const, weight: 0.1, description: 'Loading and validating image' },
  2: { name: 'detection' as const, weight: 0.3, description: 'Detecting objects and damage' },
  3: { name: 'smartcrop' as const, weight: 0.2, description: 'Smart cropping and segmentation' },
  4: { name: 'alchemy' as const, weight: 0.4, description: 'Restoration and enhancement' },
};

// ============================================
// DEFAULT COMPLETE CONFIG
// ============================================

export const TISSAIA_CONFIG: TissaiaConfig = {
  maxFileSize: MAX_FILE_SIZE,
  maxWidth: MAX_WIDTH,
  maxHeight: MAX_HEIGHT,
  supportedFormats: SUPPORTED_FORMATS,
  ingestion: DEFAULT_INGESTION_CONFIG,
  detection: DEFAULT_DETECTION_CONFIG,
  smartCrop: DEFAULT_SMARTCROP_CONFIG,
  alchemy: DEFAULT_ALCHEMY_CONFIG,
  pipeline: DEFAULT_PIPELINE_CONFIG,
};

// ============================================
// CONFIG PRESETS
// ============================================

export const CONFIG_PRESETS = {
  // High quality for archival documents
  archival: {
    ...TISSAIA_CONFIG,
    detection: {
      ...DEFAULT_DETECTION_CONFIG,
      damageConfidenceThreshold: 0.5,
      minObjectArea: 50,
    },
    alchemy: {
      ...DEFAULT_ALCHEMY_CONFIG,
      denoiseStrength: 2.0,
      sharpenAmount: 0.5,
      outputQuality: 100,
    },
  } as TissaiaConfig,

  // Quick processing for previews
  preview: {
    ...TISSAIA_CONFIG,
    smartCrop: {
      ...DEFAULT_SMARTCROP_CONFIG,
      maxShards: 10,
    },
    alchemy: {
      ...DEFAULT_ALCHEMY_CONFIG,
      denoiseStrength: 1.0,
      outputQuality: 80,
    },
  } as TissaiaConfig,

  // Aggressive restoration for heavily damaged images
  aggressive: {
    ...TISSAIA_CONFIG,
    detection: {
      ...DEFAULT_DETECTION_CONFIG,
      damageConfidenceThreshold: 0.4,
      edgeThreshold: 30,
    },
    alchemy: {
      ...DEFAULT_ALCHEMY_CONFIG,
      denoiseStrength: 3.0,
      sharpenAmount: 1.5,
      contrastBoost: 1.5,
    },
  } as TissaiaConfig,

  // Gentle restoration for well-preserved images
  gentle: {
    ...TISSAIA_CONFIG,
    detection: {
      ...DEFAULT_DETECTION_CONFIG,
      damageConfidenceThreshold: 0.8,
    },
    alchemy: {
      ...DEFAULT_ALCHEMY_CONFIG,
      denoiseStrength: 0.5,
      sharpenAmount: 0.3,
      contrastBoost: 1.05,
    },
  } as TissaiaConfig,
};

// ============================================
// CONFIG UTILITIES
// ============================================

/**
 * Merge partial config with defaults
 */
export function mergeConfig(partial: Partial<TissaiaConfig>): TissaiaConfig {
  return {
    ...TISSAIA_CONFIG,
    ...partial,
    ingestion: {
      ...TISSAIA_CONFIG.ingestion,
      ...partial.ingestion,
    },
    detection: {
      ...TISSAIA_CONFIG.detection,
      ...partial.detection,
    },
    smartCrop: {
      ...TISSAIA_CONFIG.smartCrop,
      ...partial.smartCrop,
    },
    alchemy: {
      ...TISSAIA_CONFIG.alchemy,
      ...partial.alchemy,
    },
    pipeline: {
      ...TISSAIA_CONFIG.pipeline,
      ...partial.pipeline,
    },
  };
}

/**
 * Validate config values
 */
export function validateConfig(config: TissaiaConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.maxFileSize <= 0) {
    errors.push('maxFileSize must be positive');
  }
  if (config.maxWidth <= 0 || config.maxHeight <= 0) {
    errors.push('maxWidth and maxHeight must be positive');
  }
  if (config.detection.edgeThreshold < 0 || config.detection.edgeThreshold > 255) {
    errors.push('edgeThreshold must be between 0 and 255');
  }
  if (config.detection.damageConfidenceThreshold < 0 || config.detection.damageConfidenceThreshold > 1) {
    errors.push('damageConfidenceThreshold must be between 0 and 1');
  }
  if (config.alchemy.denoiseStrength < 0 || config.alchemy.denoiseStrength > 10) {
    errors.push('denoiseStrength must be between 0 and 10');
  }
  if (config.alchemy.sharpenAmount < 0 || config.alchemy.sharpenAmount > 5) {
    errors.push('sharpenAmount must be between 0 and 5');
  }
  if (config.alchemy.outputQuality < 1 || config.alchemy.outputQuality > 100) {
    errors.push('outputQuality must be between 1 and 100');
  }

  return { valid: errors.length === 0, errors };
}

export default TISSAIA_CONFIG;
