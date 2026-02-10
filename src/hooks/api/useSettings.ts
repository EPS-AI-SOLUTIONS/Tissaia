// src/hooks/api/useSettings.ts
/**
 * Settings Hooks
 * ==============
 * Hooks for application settings management.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isTauri } from '../../utils/tauri';
import { mockSettings } from './mocks';
import { queryKeys } from './queryKeys';
import type { AppSettings } from './types';
import { safeInvoke } from './utils';

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
      if (!isTauri()) {
        return mockSettings;
      }
      return safeInvoke<AppSettings>('get_settings');
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
      if (!isTauri()) {
        toast.error('Zapisywanie ustawień wymaga aplikacji Tauri');
        throw new Error('Tauri is required for saving settings');
      }
      return safeInvoke('save_settings', { settings });
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
      if (!isTauri()) {
        toast.error('Ustawianie klucza API wymaga aplikacji Tauri');
        throw new Error('Tauri is required for setting API key');
      }
      return safeInvoke('set_api_key', { provider, key });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers });
      queryClient.invalidateQueries({ queryKey: queryKeys.health });
    },
  });
}
