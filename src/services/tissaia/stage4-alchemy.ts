/**
 * Tissaia Forensic Restoration Engine - Stage 4: Alchemy
 * ======================================================
 * Apply restoration and enhancement algorithms.
 *
 * This file re-exports from the modular stages/alchemy/ directory
 * for backward compatibility.
 */

// Re-export main function
export { restore, type AlchemyOptions } from './stages/alchemy';
export { restore as default } from './stages/alchemy';

// Re-export quality analysis
export {
  calculateSharpness,
  calculateNoise,
  calculateContrast,
  calculateColorAccuracy,
  calculateSNR,
  calculateQualityScore,
} from './stages/alchemy';

// Re-export enhancement algorithms
export {
  denoise,
  sharpen,
  adjustContrast,
  correctColors,
  adjustBrightness,
  adjustSaturation,
  gammaCorrection,
  calculateHistogram,
} from './stages/alchemy';

// Re-export inpainting
export {
  inpaintRegion,
  inpaintPatchBased,
  processShard,
} from './stages/alchemy';

// Re-export reassembly
export {
  reassembleShards,
  reassembleShardsWithBlending,
  createShardPreview,
} from './stages/alchemy';
