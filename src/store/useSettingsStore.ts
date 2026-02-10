// src/store/useSettingsStore.ts
/**
 * Settings & History Store
 * ========================
 * Persisted user preferences and restoration history.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import type { AppSettings, GitLabConfig, HistoryEntry, Language, Theme } from '../types';

// ============================================
// STORE INTERFACE
// ============================================

interface SettingsState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  updateGitLabConfig: (config: Partial<GitLabConfig>) => void;

  history: HistoryEntry[];
  addToHistory: (entry: HistoryEntry) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),
      setLanguage: (language) =>
        set((state) => ({
          settings: { ...state.settings, language },
        })),
      updateGitLabConfig: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            gitlab: { ...state.settings.gitlab, ...config },
          },
        })),

      history: [],
      addToHistory: (entry) =>
        set((state) => ({
          history: [entry, ...state.history].slice(0, 50),
        })),
      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'tissaia-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Migration from unversioned to v1
          return { ...(persistedState as Record<string, unknown>) };
        }
        return persistedState as SettingsState;
      },
      partialize: (state) => ({
        settings: state.settings,
        history: state.history.map((entry) => ({
          ...entry,
          job: {
            ...entry.job,
            result: entry.job.result
              ? {
                  ...entry.job.result,
                  restoredImageBase64: '', // Don't persist large base64 in localStorage
                }
              : undefined,
            photo: {
              ...entry.job.photo,
              base64: undefined, // Don't persist large base64 in localStorage
              preview: '', // Don't persist object URLs (invalid after reload)
            },
          },
        })),
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('Settings store rehydration failed:', error);
        }
      },
    },
  ),
);

// ============================================
// SELECTORS
// ============================================

export const selectSettings = (state: SettingsState) => state.settings;
export const selectHistory = (state: SettingsState) => state.history;
