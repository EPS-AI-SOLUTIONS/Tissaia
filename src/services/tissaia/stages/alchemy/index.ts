/**
 * Tissaia Stage 4: Alchemy - Index
 * =================================
 * Re-exports all Alchemy modules.
 */

// Main function
export { restore, type AlchemyOptions } from './restore';
export { restore as default } from './restore';

// Quality analysis
export {
  calculateSharpness,
  calculateNoise,
  calculateContrast,
  calculateColorAccuracy,
  calculateSNR,
  calculateQualityScore,
} from './quality';

// Enhancement algorithms
export {
  denoise,
  sharpen,
  adjustContrast,
  correctColors,
  adjustBrightness,
  adjustSaturation,
  gammaCorrection,
  calculateHistogram,
} from './enhancement';

// Inpainting and repair
export {
  inpaintRegion,
  inpaintPatchBased,
  processShard,
} from './inpainting';

// Reassembly
export {
  reassembleShards,
  reassembleShardsWithBlending,
  createShardPreview,
} from './reassembly';
