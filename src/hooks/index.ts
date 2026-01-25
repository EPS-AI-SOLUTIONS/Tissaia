// src/hooks/index.ts
/**
 * Hooks Exports
 * =============
 */

// Theme Hooks
export { useGlassPanel, useIsLightTheme, useThemeClass } from './useThemeClass';
export { useViewTheme } from './useViewTheme';
export type { ViewTheme } from './useViewTheme';

// API Hooks (Tauri)
export {
  useHealth,
  useStatus,
  useModels,
  useDefaultModel,
  useAnalyzeImage,
  useRestoreImage,
  useRestorationWorkflow,
  useHistory,
  useClearHistory,
  useSettings,
  useSaveSettings,
  useSetApiKey,
  useProvidersStatus,
  queryKeys,
} from './useApi';

// Types from API
export type {
  AnalysisResult,
  RestorationResult,
  HistoryEntry,
  ProviderStatus,
  HealthResponse,
  AppSettings,
  DamageType,
} from './useApi';

// Custom Hooks
export { useLocalStorage } from './useLocalStorage';
export { useDebounce } from './useDebounce';

// Keyboard Shortcuts
export { useHotkey, isHotkeyPressed } from './useHotkey';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
