// src/hooks/api/useSettings.ts
/**
 * Settings Hooks — v4.0 Web Edition
 * ===================================
 * Hooks for application settings management.
 * Always connects to the Axum backend via HTTP.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import type { AppSettings } from './types';
import { apiGet, apiPost } from './utils';

// ============================================
// FETCH SETTINGS
// ============================================

/**
 * Fetch app settings
 */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async (): Promise<AppSettings> => {
      return apiGet<AppSettings>('/api/settings');
    },
  });
}

// ============================================
// SAVE SETTINGS
// ============================================

/**
 * Save app settings
 */
export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: AppSettings): Promise<void> => {
      return apiPost('/api/settings', { settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}

// ============================================
// API KEY MANAGEMENT
// ============================================

export interface SetApiKeyParams {
  provider: string;
  key: string;
}

/**
 * Set API key for a provider
 */
export function useSetApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ provider, key }: SetApiKeyParams): Promise<void> => {
      return apiPost('/api/keys', { provider, key });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers });
      queryClient.invalidateQueries({ queryKey: queryKeys.health });
    },
  });
}
