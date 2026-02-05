// src/hooks/api/index.ts
/**
 * API Hooks - Barrel Export
 * =========================
 * Centralized exports for all API hooks.
 */

// Types
export type {
  DamageType,
  DamageSeverity,
  AnalysisResult,
  RestorationResult,
  HistoryEntry,
  OperationType,
  ProviderStatus,
  HealthResponse,
  AiModel,
  AvailableModel,
  ModelCapability,
  AppSettings,
  WorkflowProgress,
  WorkflowResult,
} from './types';

// Query Keys
export { queryKeys } from './queryKeys';
export type { QueryKey } from './queryKeys';

// Utilities
export {
  safeInvoke,
  fileToBase64,
  delay,
  showBrowserModeWarning,
  resetBrowserModeWarning,
  getFromStorage,
  setToStorage,
  getStorageKey,
} from './utils';
export type { FileBase64Result } from './utils';

// Health Hooks
export { useHealth, useProvidersStatus, useStatus } from './useHealth';

// Analysis Hooks
export { useAnalyzeImage } from './useAnalysis';
export type { AnalyzeImageParams } from './useAnalysis';

// Restoration Hooks
export { useRestoreImage, useRestorationWorkflow } from './useRestoration';
export type { RestoreImageParams, WorkflowProgressCallback } from './useRestoration';

// History Hooks
export { useHistory, useClearHistory } from './useHistory';

// Settings Hooks
export { useSettings, useSaveSettings, useSetApiKey } from './useSettings';
export type { SetApiKeyParams } from './useSettings';

// Model Hooks
export {
  useOllamaModels,
  useAvailableModels,
  useSelectedModel,
  useSetSelectedModel,
  useModels,
  useDefaultModel,
} from './useModels';
