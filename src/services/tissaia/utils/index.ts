/**
 * Tissaia - Utilities Index
 * =========================
 * Re-exports all utility functions.
 */

// Pixel utilities
export {
  generateId,
  clamp,
  getPixelIndex,
  getPixel,
  setPixel,
  toGrayscale,
  getLuminance,
  rgbToHsl,
  hslToRgb,
} from './pixel';

// Geometry utilities
export {
  rectanglesOverlap,
  rectangleArea,
  pointInRectangle,
  rectangleIntersection,
  mergeRectangles,
  expandRectangle,
  constrainRectangle,
  rectangleCenter,
  pointDistance,
  aspectRatio,
} from './geometry';

// Canvas utilities
export {
  createCanvas,
  getContext,
  createImageData,
  cloneImageData,
  extractRegion,
  putRegion,
  imageDataToBlob,
  imageDataToDataUrl,
  loadImageData,
  resizeImageData,
} from './canvas';
