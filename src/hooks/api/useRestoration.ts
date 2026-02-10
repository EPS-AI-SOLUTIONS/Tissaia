// src/hooks/api/useRestoration.ts
/**
 * Restoration Hooks
 * =================
 * Hooks for image restoration operations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isTauri } from '../../utils/tauri';
import { createMockRestorationResult, MOCK_RESTORATION_DELAY } from './mocks';
import { queryKeys } from './queryKeys';
import type { RestorationResult } from './types';
import { delay, fileToBase64, safeInvoke } from './utils';

// ============================================
// RESTORE IMAGE
// ============================================

export interface RestoreImageParams {
  file: File;
}

/**
 * Restore an image using Tauri backend
 */
export function useRestoreImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file }: RestoreImageParams): Promise<RestorationResult> => {
      if (!isTauri()) {
        // Mock restoration for browser/test mode
        await delay(MOCK_RESTORATION_DELAY);
        const { base64 } = await fileToBase64(file);
        return createMockRestorationResult(base64);
      }

      const { base64, mimeType } = await fileToBase64(file);
      return safeInvoke<RestorationResult>('restore_image', {
        imageBase64: base64,
        mimeType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });
}
