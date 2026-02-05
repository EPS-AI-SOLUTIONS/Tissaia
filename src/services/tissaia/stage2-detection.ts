/**
 * Tissaia Forensic Restoration Engine - Stage 2: Detection
 * ========================================================
 * Analyze image for objects, damage, and areas of interest.
 *
 * This file re-exports from the modular stages/detection/ directory
 * for backward compatibility.
 */

// Re-export main detection function
export { detect, type DetectionOptions } from './stages/detection';
export { detect as default } from './stages/detection';

// Re-export helpers
export {
  generateId,
  clamp,
  getPixelIndex,
  getPixel,
  toGrayscale,
  getLuminance,
} from './stages/detection';

// Re-export edge detection
export {
  applyKernel,
  sobelEdgeDetection,
  createEdgeMask,
} from './stages/detection';

// Re-export object detection
export {
  classifyObject,
  getObjectPriority,
  detectObjects,
  filterObjectsByConfidence,
  sortObjectsByPriority,
} from './stages/detection';

// Re-export damage detection
export {
  detectStains,
  detectScratches,
  detectFading,
  detectNoise,
  detectAllDamage,
} from './stages/detection';

// Re-export region analysis
export {
  findConnectedComponents,
  findConnectedComponents8,
  extractRegionMask,
  labelConnectedComponents,
  dilateMask,
  erodeMask,
} from './stages/detection';

// Re-export cut map
export {
  rectanglesOverlap,
  createVisualization,
  generateCutMap,
  mergeCutRegions,
} from './stages/detection';
