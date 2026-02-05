// src/hooks/api/useRestoration.ts
/**
 * Restoration Hooks
 * =================
 * Hooks for image restoration operations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isTauri } from '../../utils/tauri';
import { queryKeys } from './queryKeys';
import { safeInvoke, fileToBase64, delay } from './utils';
import { createMockRestorationResult, MOCK_RESTORATION_DELAY } from './mocks';
import type { AnalysisResult, RestorationResult, WorkflowResult } from './types';
import { useAnalyzeImage } from './useAnalysis';

// ============================================
// RESTORE IMAGE
// ============================================

export interface RestoreImageParams {
  file: File;
  analysis: AnalysisResult;
}

/**
 * Restore an image using Tauri backend
 */
export function useRestoreImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, analysis }: RestoreImageParams): Promise<RestorationResult> => {
      if (!isTauri) {
        // Mock restoration for browser/test mode
        await delay(MOCK_RESTORATION_DELAY);
        const { base64 } = await fileToBase64(file);
        return createMockRestorationResult(base64);
      }

      const { base64, mimeType } = await fileToBase64(file);
      return safeInvoke<RestorationResult>('restore_image', {
        imageBase64: base64,
        mimeType,
        analysis,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });
}

// ============================================
// RESTORATION WORKFLOW
// ============================================

export type WorkflowProgressCallback = (stage: string, progress: number) => void;

/**
 * Full restoration workflow: analyze + restore
 */
export function useRestorationWorkflow() {
  const analyzeMutation = useAnalyzeImage();
  const restoreMutation = useRestoreImage();

  const runWorkflow = async (
    file: File,
    onProgress?: WorkflowProgressCallback
  ): Promise<WorkflowResult> => {
    // Stage 1: Analyze
    onProgress?.('analyzing', 0);
    const analysisResult = await analyzeMutation.mutateAsync({ file });
    onProgress?.('analyzing', 100);

    // Stage 2: Restore
    onProgress?.('restoring', 0);
    const restoreResult = await restoreMutation.mutateAsync({
      file,
      analysis: analysisResult,
    });
    onProgress?.('restoring', 100);

    return {
      analysis: analysisResult,
      result: restoreResult,
    };
  };

  return {
    runWorkflow,
    isAnalyzing: analyzeMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isLoading: analyzeMutation.isPending || restoreMutation.isPending,
    analysisError: analyzeMutation.error,
    restoreError: restoreMutation.error,
    reset: () => {
      analyzeMutation.reset();
      restoreMutation.reset();
    },
  };
}
