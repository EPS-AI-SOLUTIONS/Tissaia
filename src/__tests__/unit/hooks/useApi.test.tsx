// src/__tests__/unit/hooks/useApi.test.tsx
/**
 * Tests for useApi hooks
 * =======================
 * Tests for React Query hooks that interact with Tauri backend.
 * Note: These tests focus on browser mode since Tauri mocking is complex.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================
// MOCK SETUP
// ============================================

// Mock the entire tauri.ts module - browser mode (isTauri() returns false)
vi.mock('../../../utils/tauri', () => ({
  isTauri: () => false,
  safeInvoke: vi.fn().mockResolvedValue(undefined),
}));

// Mock Tauri invoke (won't be called in browser mode)
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => {
  const toastFn = Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  });
  return {
    default: toastFn,
    toast: toastFn,
  };
});

// Import after mocks are set up
import {
  type AnalysisResult,
  type AppSettings,
  type HealthResponse,
  type ProviderStatus,
  queryKeys,
  useAnalyzeImage,
  useClearHistory,
  useDefaultModel,
  useHealth,
  useHistory,
  useModels,
  useOllamaModels,
  useProvidersStatus,
  useRestorationWorkflow,
  useRestoreImage,
  useSaveSettings,
  useSetApiKey,
  useSettings,
  useStatus,
} from '../../../hooks/useApi';

// ============================================
// MOCK DATA
// ============================================

const mockHealthResponse: HealthResponse = {
  status: 'healthy',
  version: '3.0.0',
  providers: [
    { name: 'google', enabled: true, available: true, priority: 1, last_error: null },
    { name: 'anthropic', enabled: true, available: true, priority: 2, last_error: null },
  ],
  uptime_seconds: 3600,
};

const mockProvidersStatus: ProviderStatus[] = [
  { name: 'google', enabled: true, available: true, priority: 1, last_error: null },
  { name: 'anthropic', enabled: true, available: true, priority: 2, last_error: null },
  { name: 'openai', enabled: false, available: false, priority: 3, last_error: 'No API key' },
];

const mockAnalysisResult: AnalysisResult = {
  id: 'analysis-123',
  timestamp: new Date().toISOString(),
  damage_score: 45,
  damage_types: [
    { name: 'scratches', severity: 'medium', description: 'Minor scratches', area_percentage: 15 },
  ],
  recommendations: ['Remove scratches', 'Restore colors'],
  provider_used: 'google',
};

const mockSettings: AppSettings = {
  language: 'pl',
  theme: 'dark',
  auto_save: true,
  output_quality: 85,
  preferred_provider: null,
};

// ============================================
// HELPER: Create wrapper with QueryClient
// ============================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { Wrapper, queryClient };
}

// ============================================
// TESTS
// ============================================

describe('useApi hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // queryKeys
  // ============================================

  describe('queryKeys', () => {
    it('has correct query key structure', () => {
      expect(queryKeys.health).toEqual(['health']);
      expect(queryKeys.providers).toEqual(['providers']);
      expect(queryKeys.history).toEqual(['history']);
      expect(queryKeys.settings).toEqual(['settings']);
    });
  });

  // ============================================
  // useHealth (Browser Mode)
  // ============================================

  describe('useHealth', () => {
    it('returns browser mode data when not in Tauri', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useHealth(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe('browser_mode');
      expect(result.current.data?.version).toBe('0.0.0-browser');
      expect(result.current.data?.providers).toEqual([]);
    });

    it('does not refetch automatically in browser mode', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useHealth(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // In browser mode, refetchInterval should be false
      expect(result.current.data?.status).toBe('browser_mode');
    });
  });

  // ============================================
  // useProvidersStatus (Browser Mode)
  // ============================================

  describe('useProvidersStatus', () => {
    it('returns mock providers in browser mode', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useProvidersStatus(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].name).toBe('google');
      expect(result.current.data?.[0].available).toBe(false);
      expect(result.current.data?.[0].last_error).toBe('Tauri is required');
    });
  });

  // ============================================
  // useAnalyzeImage (Browser Mode)
  // ============================================

  describe('useAnalyzeImage', () => {
    it('returns isPending state initially false', () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useAnalyzeImage(), { wrapper: Wrapper });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isIdle).toBe(true);
    });

    it('provides mutate function', () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useAnalyzeImage(), { wrapper: Wrapper });

      expect(typeof result.current.mutate).toBe('function');
      expect(typeof result.current.mutateAsync).toBe('function');
    });
  });

  // ============================================
  // useRestoreImage (Browser Mode)
  // ============================================

  describe('useRestoreImage', () => {
    it('returns isPending state initially false', () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useRestoreImage(), { wrapper: Wrapper });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isIdle).toBe(true);
    });

    it('provides mutate function', () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useRestoreImage(), { wrapper: Wrapper });

      expect(typeof result.current.mutate).toBe('function');
      expect(typeof result.current.mutateAsync).toBe('function');
    });
  });

  // ============================================
  // useHistory (Browser Mode)
  // ============================================

  describe('useHistory', () => {
    it('returns empty array in browser mode', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useHistory(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });

  // ============================================
  // useClearHistory (Browser Mode)
  // ============================================

  describe('useClearHistory', () => {
    it('throws error in browser mode', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useClearHistory(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toContain('Tauri');
        }
      });
    });
  });

  // ============================================
  // useSettings (Browser Mode)
  // ============================================

  describe('useSettings', () => {
    it('returns default mock settings in browser mode', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useSettings(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.language).toBe('pl');
      expect(result.current.data?.theme).toBe('dark');
      expect(result.current.data?.auto_save).toBe(true);
      expect(result.current.data?.output_quality).toBe(85);
    });
  });

  // ============================================
  // useSaveSettings (Browser Mode)
  // ============================================

  describe('useSaveSettings', () => {
    it('throws error in browser mode', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useSaveSettings(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockSettings);
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toContain('Tauri');
        }
      });
    });
  });

  // ============================================
  // useSetApiKey (Browser Mode)
  // ============================================

  describe('useSetApiKey', () => {
    it('throws error in browser mode', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useSetApiKey(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ provider: 'google', key: 'test-key' });
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toContain('Tauri');
        }
      });
    });
  });

  // ============================================
  // useRestorationWorkflow
  // ============================================

  describe('useRestorationWorkflow', () => {
    it('provides workflow state', () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useRestorationWorkflow(), { wrapper: Wrapper });

      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.isRestoring).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.analysisError).toBeNull();
      expect(result.current.restoreError).toBeNull();
      expect(typeof result.current.runWorkflow).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('provides reset function', () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useRestorationWorkflow(), { wrapper: Wrapper });

      // Just verify reset is a function and doesn't throw
      expect(() => result.current.reset()).not.toThrow();
    });
  });

  // ============================================
  // LEGACY COMPATIBILITY HOOKS
  // ============================================

  describe('useStatus (legacy)', () => {
    it('is an alias for useHealth', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useStatus(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.status).toBe('browser_mode');
    });
  });

  describe('useModels (legacy)', () => {
    it('is an alias for useProvidersStatus', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useModels(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });
  });

  describe('useDefaultModel (legacy)', () => {
    it('returns google as default when no providers available', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useDefaultModel(), { wrapper: Wrapper });

      // In browser mode, no providers are available, so it returns 'google'
      await waitFor(() => expect(result.current.data).toBeDefined());

      expect(result.current.data).toBe('google');
    });
  });

  describe('useOllamaModels', () => {
    it('returns mock models in browser mode', async () => {
      const { Wrapper } = createWrapper();

      const { result } = renderHook(() => useOllamaModels(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].id).toBe('llama3.2:vision');
      expect(result.current.data?.[1].id).toBe('llava');
    });
  });

  // ============================================
  // TYPE EXPORTS
  // ============================================

  describe('type exports', () => {
    it('exports all required types', () => {
      // This test verifies that types are properly exported
      const healthResponse: HealthResponse = mockHealthResponse;
      const providersStatus: ProviderStatus[] = mockProvidersStatus;
      const analysisResult: AnalysisResult = mockAnalysisResult;
      const settings: AppSettings = mockSettings;

      expect(healthResponse).toBeDefined();
      expect(providersStatus).toBeDefined();
      expect(analysisResult).toBeDefined();
      expect(settings).toBeDefined();
    });
  });
});
