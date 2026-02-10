// src/hooks/api/useAnalysis.ts
/**
 * Analysis Hooks
 * ==============
 * Hooks for image analysis operations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isTauri } from '../../utils/tauri';
import { MOCK_ANALYSIS_DELAY, mockAnalysisResult } from './mocks';
import { queryKeys } from './queryKeys';
import type { AnalysisResult } from './types';
import { delay, fileToBase64, safeInvoke } from './utils';

// ============================================
// ANALYZE IMAGE
// ============================================

export interface AnalyzeImageParams {
  file: File;
}

/**
 * Analyze an image using Tauri backend
 */
export function useAnalyzeImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file }: AnalyzeImageParams): Promise<AnalysisResult> => {
      if (!isTauri()) {
        // Mock analysis for browser/test mode
        await delay(MOCK_ANALYSIS_DELAY);
        return {
          ...mockAnalysisResult,
          id: `mock-analysis-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
      }

      const { base64, mimeType } = await fileToBase64(file);
      return safeInvoke<AnalysisResult>('analyze_image', {
        imageBase64: base64,
        mimeType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });
}
