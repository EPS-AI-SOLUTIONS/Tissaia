// src/hooks/index.ts
/**
 * Hooks Exports
 * =============
 */

// Types from API
export type {
  // Model Types
  AiModel,
  // Core Types
  AppSettings as ApiAppSettings,
  AvailableModel,
  HealthResponse as ApiHealthResponse,
  HistoryEntry as ApiHistoryEntry,
  ModelCapability,
  ProviderStatus as ApiProviderStatus,
  RestorationResult as ApiRestorationResult,
} from './useApi';
// API Hooks (Tauri) - Modular Exports
export {
  fileToBase64,
  // Query Keys
  queryKeys,
  // Utilities
  safeInvoke,
  useAvailableModels,
  useClearHistory,
  useDefaultModel,
  // Health & Status
  useHealth,
  // History
  useHistory,
  // Models
  useModels,
  useOllamaModels,
  useProvidersStatus,
  // Restoration
  useRestoreImage,
  useSaveSettings,
  useSelectedModel,
  useSetApiKey,
  useSetSelectedModel,
  // Settings
  useSettings,
  useStatus,
} from './useApi';
// Custom Hooks
export { useDebounce } from './useDebounce';
// Keyboard Shortcuts
export { isHotkeyPressed, useHotkey } from './useHotkey';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
// Theme Hooks
export { useGlassPanel } from './useThemeClass';
export type { ViewTheme } from './useViewTheme';
export { useViewTheme } from './useViewTheme';
