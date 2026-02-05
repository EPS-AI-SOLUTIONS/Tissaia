// src/hooks/api/useHealth.ts
/**
 * Health Hooks
 * ============
 * Hooks for health status and provider monitoring.
 */
import { useQuery } from '@tanstack/react-query';
import { isTauri } from '../../utils/tauri';
import { queryKeys } from './queryKeys';
import { safeInvoke } from './utils';
import { mockHealthResponse, mockProvidersStatus } from './mocks';
import type { HealthResponse, ProviderStatus } from './types';

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Fetch health status from Rust backend
 */
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: async (): Promise<HealthResponse> => {
      if (!isTauri) {
        return mockHealthResponse;
      }
      return safeInvoke<HealthResponse>('health_check');
    },
    refetchInterval: isTauri ? 30000 : false,
  });
}

// ============================================
// PROVIDERS STATUS
// ============================================

/**
 * Fetch providers status
 */
export function useProvidersStatus() {
  return useQuery({
    queryKey: queryKeys.providers,
    queryFn: async (): Promise<ProviderStatus[]> => {
      if (!isTauri) {
        return mockProvidersStatus;
      }
      return safeInvoke<ProviderStatus[]>('get_providers_status');
    },
    refetchInterval: isTauri ? 60000 : false,
  });
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

/**
 * @deprecated Use useHealth instead
 */
export function useStatus() {
  return useHealth();
}
