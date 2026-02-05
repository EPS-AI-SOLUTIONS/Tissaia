// src/hooks/api/queryKeys.ts
/**
 * Query Keys
 * ==========
 * Centralized React Query cache keys.
 */

export const queryKeys = {
  // Health & Status
  health: ['health'] as const,
  providers: ['providers'] as const,

  // Data
  history: ['history'] as const,
  settings: ['settings'] as const,

  // AI Models
  selectedModel: ['selected_model'] as const,
  availableModels: ['available_models'] as const,
  ollamaModels: ['ollama_models'] as const,
} as const;

// Type helper for query keys
export type QueryKey = (typeof queryKeys)[keyof typeof queryKeys];
