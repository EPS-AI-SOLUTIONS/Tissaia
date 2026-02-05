// src/hooks/useApi.ts
/**
 * Tissaia-AI API Hooks (Tauri Edition)
 * =====================================
 * Re-exports from modular API hooks for backward compatibility.
 *
 * @see src/hooks/api/ for individual modules:
 *   - types.ts     - TypeScript interfaces
 *   - queryKeys.ts - React Query cache keys
 *   - mocks.ts     - Mock data for browser mode
 *   - utils.ts     - Utility functions
 *   - useHealth.ts - Health & provider status hooks
 *   - useAnalysis.ts - Image analysis hooks
 *   - useRestoration.ts - Image restoration hooks
 *   - useHistory.ts - History management hooks
 *   - useSettings.ts - App settings hooks
 *   - useModels.ts - AI model selection hooks
 */

// Re-export everything from the modular API
export * from './api';
