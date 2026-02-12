// src/hooks/api/useRestoration.ts
/**
 * Restoration Hooks — v4.0 Web Edition
 * ======================================
 * Hooks for image restoration operations.
 * Always connects to the Axum backend via HTTP.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import type { RestorationResult } from './types';
import { apiPost, fileToBase64 } from './utils';

// ============================================
// RESTORE IMAGE
// ============================================

export interface RestoreImageParams {
  file: File;
}

/**
 * Restore an image using the Axum backend
 */
export function useRestoreImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file }: RestoreImageParams): Promise<RestorationResult> => {
      const { base64, mimeType } = await fileToBase64(file);
      return apiPost<RestorationResult>('/api/restore', {
        image_base64: base64,
        mime_type: mimeType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });
}
