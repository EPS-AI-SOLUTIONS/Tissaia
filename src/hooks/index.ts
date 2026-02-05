// src/hooks/index.ts
/**
 * Hooks Exports
 * =============
 */

// Theme Hooks
export { useGlassPanel, useIsLightTheme, useThemeClass } from './useThemeClass';
export { useViewTheme } from './useViewTheme';
export type { ViewTheme } from './useViewTheme';

// API Hooks (Tauri) - Modular Exports
export {
  // Health & Status
  useHealth,
  useStatus,
  useProvidersStatus,
  // Analysis
  useAnalyzeImage,
  // Restoration
  useRestoreImage,
  useRestorationWorkflow,
  // History
  useHistory,
  useClearHistory,
  // Settings
  useSettings,
  useSaveSettings,
  useSetApiKey,
  // Models
  useModels,
  useDefaultModel,
  useOllamaModels,
  useAvailableModels,
  useSelectedModel,
  useSetSelectedModel,
  // Query Keys
  queryKeys,
  // Utilities
  safeInvoke,
  fileToBase64,
} from './useApi';

// Types from API
export type {
  // Core Types
  AnalysisResult,
  RestorationResult,
  HistoryEntry,
  ProviderStatus,
  HealthResponse,
  AppSettings,
  DamageType,
  DamageSeverity,
  // Model Types
  AiModel,
  AvailableModel,
  ModelCapability,
  // Workflow Types
  WorkflowProgress,
  WorkflowResult,
} from './useApi';

// Custom Hooks
export { useLocalStorage } from './useLocalStorage';
export { useDebounce } from './useDebounce';

// Keyboard Shortcuts
export { useHotkey, isHotkeyPressed } from './useHotkey';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
