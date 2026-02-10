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
  AnalysisResult,
  AppSettings,
  AvailableModel,
  BoundingBox,
  CroppedPhoto,
  CropResult,
  DamageSeverity,
  DamageType,
  DetectionResult,
  HealthResponse,
  HistoryEntry,
  ModelCapability,
  OperationType,
  ProviderStatus,
  RestorationResult,
  WorkflowProgress,
  WorkflowResult,
} from './types';
export type { AnalyzeImageParams } from './useAnalysis';
// Analysis Hooks
export { useAnalyzeImage } from './useAnalysis';
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
export type { RestoreImageParams, WorkflowProgressCallback } from './useRestoration';
// Restoration Hooks
export { useRestorationWorkflow, useRestoreImage } from './useRestoration';
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
