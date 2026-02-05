/**
 * Tissaia - Stage 4: Alchemy Types
 * =================================
 * Types for image restoration and enhancement.
 */

import type { DamageType } from './detection';

// ============================================
// OUTPUT TYPES
// ============================================

export type InpaintingMethod = 'patchmatch' | 'telea' | 'navier-stokes' | 'fast';

export type OutputFormat = 'png' | 'jpg' | 'webp';

// ============================================
// QUALITY TYPES
// ============================================

export interface QualityScore {
  sharpness: number;
  noise: number;
  contrast: number;
  colorAccuracy: number;
  overall: number;
}

// ============================================
// REPORT TYPES
// ============================================

export interface DamageRepairReport {
  damageId: string;
  damageType: DamageType;
  repaired: boolean;
  method: string;
  effectiveness: number;
}

export interface RestorationReport {
  enhancementsApplied: string[];
  damageRepaired: DamageRepairReport[];
  qualityScore: {
    before: QualityScore;
    after: QualityScore;
    improvement: number;
  };
  processingTime: {
    total: number;
    byStage: Record<number, number>;
  };
}

// ============================================
// RESULT TYPES
// ============================================

export interface RestoredImage {
  data: ImageData;
  format: OutputFormat;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  metadata: {
    width: number;
    height: number;
    processedAt: string;
    pipelineVersion: string;
    originalName?: string;
  };
  report: RestorationReport;
}

// ============================================
// CONFIGURATION
// ============================================

export interface AlchemyConfig {
  denoiseStrength: number;
  sharpenAmount: number;
  contrastBoost: number;
  colorCorrection: boolean;
  inpaintingMethod: InpaintingMethod;
  outputFormat: OutputFormat;
  outputQuality: number;
}
