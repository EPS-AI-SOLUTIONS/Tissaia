// src/__tests__/unit/hooks/useApiModels.test.ts
/**
 * useApi Model Hooks Tests
 * ========================
 * Unit tests for AI model selection hooks.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock isTauri
vi.mock('../../../utils/tauri', () => ({
  isTauri: false,
}));

// Import hooks after mocking
import {
  useAvailableModels,
  useSelectedModel,
  useSetSelectedModel,
  useProvidersStatus,
} from '../../../hooks/useApi';

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe('Model Selection Hooks', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ============================================
  // useSelectedModel
  // ============================================

  describe('useSelectedModel', () => {
    it('returns default model when no selection is stored', async () => {
      const { result } = renderHook(() => useSelectedModel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBe('gemini-2.0-flash-exp');
      });
    });

    it('returns stored model from localStorage', async () => {
      localStorage.setItem('tissaia-selected-model', 'gpt-4o');

      const { result } = renderHook(() => useSelectedModel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBe('gpt-4o');
      });
    });
  });

  // ============================================
  // useSetSelectedModel
  // ============================================

  describe('useSetSelectedModel', () => {
    it('stores selected model in localStorage', async () => {
      const { result } = renderHook(() => useSetSelectedModel(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('claude-3-5-sonnet');
      });

      await waitFor(() => {
        expect(localStorage.getItem('tissaia-selected-model')).toBe('claude-3-5-sonnet');
      });
    });

    it('returns mutation result', async () => {
      const { result } = renderHook(() => useSetSelectedModel(), {
        wrapper: createWrapper(),
      });

      let mutationResult: string | undefined;

      await act(async () => {
        mutationResult = await result.current.mutateAsync('gpt-4o');
      });

      expect(mutationResult).toBe('gpt-4o');
    });
  });

  // ============================================
  // useProvidersStatus (mock mode)
  // ============================================

  describe('useProvidersStatus', () => {
    it('returns mock providers in browser mode', async () => {
      const { result } = renderHook(() => useProvidersStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      // In browser mode, should return mock providers
      expect(result.current.data?.[0].name).toBe('google');
    });
  });

  // ============================================
  // useAvailableModels
  // ============================================

  describe('useAvailableModels', () => {
    it('returns mock models in browser mode', async () => {
      const { result } = renderHook(() => useAvailableModels(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      // Should have at least mock model
      expect(result.current.data?.length).toBeGreaterThanOrEqual(1);
    });

    it('returns models with required properties', async () => {
      const { result } = renderHook(() => useAvailableModels(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      const firstModel = result.current.data?.[0];
      expect(firstModel).toHaveProperty('id');
      expect(firstModel).toHaveProperty('name');
      expect(firstModel).toHaveProperty('provider');
      expect(firstModel).toHaveProperty('capabilities');
      expect(firstModel).toHaveProperty('isAvailable');
    });

    it('models have valid capabilities', async () => {
      const { result } = renderHook(() => useAvailableModels(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      const firstModel = result.current.data?.[0];
      expect(Array.isArray(firstModel?.capabilities)).toBe(true);

      // Capabilities should be from allowed set
      const validCapabilities = ['vision', 'text', 'restoration'];
      firstModel?.capabilities.forEach((cap) => {
        expect(validCapabilities).toContain(cap);
      });
    });
  });
});
