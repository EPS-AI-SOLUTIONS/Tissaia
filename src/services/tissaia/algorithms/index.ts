/**
 * Tissaia - Algorithms Index
 * ==========================
 * Re-exports all image processing algorithms.
 */

// Convolution algorithms
export {
  applyKernel,
  applyKernelRGB,
  applySeparableKernel,
} from './convolution';

// Edge detection algorithms
export {
  sobelEdgeDetection,
  createEdgeMask,
  nonMaxSuppression,
  doubleThreshold,
  hysteresis,
  cannyEdgeDetection,
  laplacianEdgeDetection,
  type SobelResult,
} from './edge-detection';

// Enhancement algorithms
export {
  denoise,
  sharpen,
  calculateHistogram,
  adjustContrast,
  correctColors,
  adjustBrightness,
  adjustSaturation,
  gammaCorrection,
} from './enhancement';

// Quality analysis algorithms
export {
  calculateSharpness,
  calculateNoise,
  calculateContrast as calculateContrastMetric,
  calculateColorAccuracy,
  calculateQualityScore,
  calculateSNR,
} from './quality';

// Connected components algorithms
export {
  findConnectedComponents,
  findConnectedComponents8,
  labelConnectedComponents,
  extractRegionMask,
  dilateMask,
  erodeMask,
} from './connected-components';
