// src/hooks/api/useHealth.ts
/**
 * Health Hooks — v4.0 Web Edition
 * ================================
 * Hooks for health status and provider monitoring.
 * Always connects to the Axum backend via HTTP.
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import type { HealthResponse, ProviderStatus } from './types';
import { apiGet } from './utils';

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Fetch health status from Axum backend
 */
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: async (): Promise<HealthResponse> => {
      return apiGet<HealthResponse>('/api/health');
    },
    refetchInterval: 30000,
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
      return apiGet<ProviderStatus[]>('/api/providers');
    },
    refetchInterval: 60000,
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
