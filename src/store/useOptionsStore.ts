// src/store/useOptionsStore.ts
/**
 * Restoration Options Store
 * =========================
 * Persisted restoration configuration.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_RESTORATION_OPTIONS } from '../constants/defaults';
import type { RestorationOptions } from '../types';

// ============================================
// STORE INTERFACE
// ============================================

interface OptionsState {
  options: RestorationOptions;
  setOptions: (options: Partial<RestorationOptions>) => void;
  resetOptions: () => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useOptionsStore = create<OptionsState>()(
  persist(
    (set) => ({
      options: DEFAULT_RESTORATION_OPTIONS,
      setOptions: (options) =>
        set((state) => ({
          options: { ...state.options, ...options },
        })),
      resetOptions: () => set({ options: DEFAULT_RESTORATION_OPTIONS }),
    }),
    {
      name: 'tissaia-options',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Migration from unversioned to v1
          return { ...(persistedState as Record<string, unknown>) };
        }
        return persistedState as OptionsState;
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('Options store rehydration failed:', error);
        }
      },
    },
  ),
);

// ============================================
// SELECTORS
// ============================================

export const selectOptions = (state: OptionsState) => state.options;
