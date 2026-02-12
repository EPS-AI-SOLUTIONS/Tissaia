// src/hooks/api/useHistory.ts
/**
 * History Hooks — v4.0 Web Edition
 * =================================
 * Hooks for processing history management.
 * Always connects to the Axum backend via HTTP.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import type { HistoryEntry } from './types';
import { apiDelete, apiGet } from './utils';

// ============================================
// FETCH HISTORY
// ============================================

/**
 * Fetch processing history
 */
export function useHistory() {
  return useQuery({
    queryKey: queryKeys.history,
    queryFn: async (): Promise<HistoryEntry[]> => {
      return apiGet<HistoryEntry[]>('/api/history');
    },
  });
}

// ============================================
// CLEAR HISTORY
// ============================================

/**
 * Clear processing history
 */
export function useClearHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      return apiDelete('/api/history');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });
}
