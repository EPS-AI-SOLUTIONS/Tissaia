// src/hooks/api/index.ts
/**
 * API Hooks - Barrel Export
 * =========================
 * Centralized exports for all API hooks.
 */

export type { QueryKey } from './queryKeys';

// Query Keys
export { queryKeys } from './queryKeys';
// Types
export type {
  AiModel,
  AppSettings,
  AvailableModel,
  BoundingBox,
  CroppedPhoto,
  CropResult,
  DetectionResult,
  HealthResponse,
  HistoryEntry,
  ModelCapability,
  OperationType,
  ProviderStatus,
  RestorationResult,
} from './types';
export type { CropPhotosParams, DetectPhotosParams } from './useCrop';
// Crop Hooks
export { useCropPhotos, useDetectPhotos } from './useCrop';
// Health Hooks
export { useHealth, useProvidersStatus, useStatus } from './useHealth';
// History Hooks
export { useClearHistory, useHistory } from './useHistory';
// Model Hooks
export {
  useAvailableModels,
  useDefaultModel,
  useModels,
  useOllamaModels,
  useSelectedModel,
  useSetSelectedModel,
} from './useModels';
export type { RestoreImageParams } from './useRestoration';
// Restoration Hooks
export { useRestoreImage } from './useRestoration';
export type { SetApiKeyParams } from './useSettings';
// Settings Hooks
export { useSaveSettings, useSetApiKey, useSettings } from './useSettings';
export type { FileBase64Result } from './utils';
// Utilities
export {
  delay,
  fileToBase64,
  fileToDataUrl,
  getFromStorage,
  getStorageKey,
  resetBrowserModeWarning,
  safeInvoke,
  setToStorage,
  showBrowserModeWarning,
} from './utils';
