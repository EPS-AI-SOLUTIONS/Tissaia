/**
 * Tissaia - Type Guards
 * =====================
 * Runtime type checking utilities.
 */

import type { PreparedData } from './ingestion';
import type { DetectionResult } from './detection';
import type { SmartCropResult } from './smartcrop';
import type { RestoredImage } from './alchemy';

/**
 * Check if data is PreparedData (Stage 1 output)
 */
export function isPreparedData(data: unknown): data is PreparedData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'buffer' in data &&
    'width' in data &&
    'height' in data &&
    'channels' in data
  );
}

/**
 * Check if data is DetectionResult (Stage 2 output)
 */
export function isDetectionResult(data: unknown): data is DetectionResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'objects' in data &&
    'damages' in data &&
    'cutMap' in data
  );
}

/**
 * Check if data is SmartCropResult (Stage 3 output)
 */
export function isSmartCropResult(data: unknown): data is SmartCropResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'shards' in data &&
    'totalShards' in data
  );
}

/**
 * Check if data is RestoredImage (Stage 4 output)
 */
export function isRestoredImage(data: unknown): data is RestoredImage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    'blob' in data &&
    'report' in data
  );
}
