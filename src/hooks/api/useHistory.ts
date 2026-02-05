// src/hooks/api/useHistory.ts
/**
 * History Hooks
 * =============
 * Hooks for processing history management.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isTauri } from '../../utils/tauri';
import { queryKeys } from './queryKeys';
import { safeInvoke } from './utils';
import type { HistoryEntry } from './types';

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
      if (!isTauri) {
        return [];
      }
      return safeInvoke<HistoryEntry[]>('get_history');
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
      if (!isTauri) {
        toast.error('Czyszczenie historii wymaga aplikacji Tauri');
        throw new Error('Tauri is required for clearing history');
      }
      return safeInvoke('clear_history');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });
}
