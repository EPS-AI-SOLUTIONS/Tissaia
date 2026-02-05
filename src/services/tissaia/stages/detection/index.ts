/**
 * Tissaia Stage 2: Detection - Index
 * ===================================
 * Re-exports all detection modules.
 */

// Main detection function
export { detect, type DetectionOptions } from './detect';
export { detect as default } from './detect';

// Helpers
export {
  generateId,
  clamp,
  getPixelIndex,
  getPixel,
  toGrayscale,
  getLuminance,
} from './helpers';

// Edge detection
export {
  applyKernel,
  sobelEdgeDetection,
  createEdgeMask,
  type SobelResult,
} from './edge-detection';

// Object detection
export {
  classifyObject,
  getObjectPriority,
  detectObjects,
  filterObjectsByConfidence,
  sortObjectsByPriority,
} from './object-detection';

// Damage detection
export {
  detectStains,
  detectScratches,
  detectFading,
  detectNoise,
  detectAllDamage,
} from './damage-detection';

// Region analysis
export {
  findConnectedComponents,
  findConnectedComponents8,
  extractRegionMask,
  labelConnectedComponents,
  dilateMask,
  erodeMask,
} from './region-analysis';

// Cut map generation
export {
  rectanglesOverlap,
  createVisualization,
  generateCutMap,
  mergeCutRegions,
} from './cutmap';
