// src/store/useAppStore.ts
/**
 * Tissaia-AI Global State Store
 * =============================
 * Zustand-based state management for the application.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  View,
  PhotoFile,
  PhotoAnalysis,
  RestorationJob,
  RestorationOptions,
  RestorationResult,
  AppSettings,
  HistoryEntry,
  Language,
  Theme,
  GitLabConfig,
} from '../types';

// ============================================
// DEFAULT VALUES
// ============================================

const defaultRestorationOptions: RestorationOptions = {
  removeScratches: true,
  fixFading: true,
  enhanceFaces: true,
  colorize: false,
  denoise: true,
  sharpen: true,
  autoCrop: false,
};

const defaultGitLabConfig: GitLabConfig = {
  enabled: false,
  instanceUrl: 'https://gitlab.com',
  projectId: '',
  privateToken: '',
  branch: 'main',
  uploadPath: 'uploads/restored',
};

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'pl',
  autoAnalyze: true,
  preserveOriginals: true,
  defaultOptions: defaultRestorationOptions,
  apiEndpoint: '/api',
  gitlab: defaultGitLabConfig,
};

// ============================================
// STORE INTERFACE
// ============================================

interface AppState {
  // View state
  currentView: View;
  setCurrentView: (view: View) => void;

  // Photo state
  photos: PhotoFile[];
  addPhoto: (photo: PhotoFile) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;

  // Current job state
  currentJob: RestorationJob | null;
  setCurrentJob: (job: RestorationJob | null) => void;
  updateJobProgress: (progress: number) => void;
  updateJobStatus: (status: RestorationJob['status']) => void;
  setJobAnalysis: (analysis: PhotoAnalysis) => void;
  setJobResult: (result: RestorationResult) => void;
  setJobError: (error: string) => void;

  // Restoration options
  options: RestorationOptions;
  setOptions: (options: Partial<RestorationOptions>) => void;
  resetOptions: () => void;

  // History
  history: HistoryEntry[];
  addToHistory: (entry: HistoryEntry) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  updateGitLabConfig: (config: Partial<GitLabConfig>) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  progressMessage: string;
  setProgressMessage: (message: string) => void;

  // Tauri API state (temporary storage for Tauri results)
  currentAnalysis: unknown | null;
  restorationResult: unknown | null;

  // Reset all
  reset: () => void;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // === VIEW STATE ===
      currentView: 'upload',
      setCurrentView: (view) => set({ currentView: view }),

      // === PHOTO STATE ===
      photos: [],
      addPhoto: (photo) =>
        set((state) => ({
          photos: [...state.photos, photo],
        })),
      removePhoto: (id) =>
        set((state) => ({
          photos: state.photos.filter((p) => p.id !== id),
        })),
      clearPhotos: () => set({ photos: [] }),

      // === CURRENT JOB STATE ===
      currentJob: null,
      setCurrentJob: (job) => set({ currentJob: job }),
      updateJobProgress: (progress) =>
        set((state) => ({
          currentJob: state.currentJob
            ? { ...state.currentJob, progress, updatedAt: new Date() }
            : null,
        })),
      updateJobStatus: (status) =>
        set((state) => ({
          currentJob: state.currentJob
            ? { ...state.currentJob, status, updatedAt: new Date() }
            : null,
        })),
      setJobAnalysis: (analysis) =>
        set((state) => ({
          currentJob: state.currentJob
            ? { ...state.currentJob, analysis, updatedAt: new Date() }
            : null,
        })),
      setJobResult: (result) =>
        set((state) => {
          if (!state.currentJob) return state;
          
          const updatedJob: RestorationJob = {
            ...state.currentJob,
            result,
            status: 'completed',
            progress: 100,
            updatedAt: new Date(),
          };

          // Auto-add to history
          const historyEntry: HistoryEntry = {
            id: `history-${Date.now()}`,
            job: updatedJob,
            createdAt: new Date(),
          };

          return {
            currentJob: updatedJob,
            history: [historyEntry, ...state.history].slice(0, 50), // Keep last 50
          };
        }),
      setJobError: (error) =>
        set((state) => ({
          currentJob: state.currentJob
            ? { ...state.currentJob, error, status: 'failed', updatedAt: new Date() }
            : null,
        })),

      // === RESTORATION OPTIONS ===
      options: defaultRestorationOptions,
      setOptions: (options) =>
        set((state) => ({
          options: { ...state.options, ...options },
        })),
      resetOptions: () => set({ options: defaultRestorationOptions }),

      // === HISTORY ===
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

      // === SETTINGS ===
      settings: defaultSettings,
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

      // === UI STATE ===
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      progressMessage: '',
      setProgressMessage: (message) => set({ progressMessage: message }),

      // === TAURI API STATE ===
      currentAnalysis: null,
      restorationResult: null,

      // === RESET ===
      reset: () =>
        set({
          currentView: 'upload',
          photos: [],
          currentJob: null,
          options: defaultRestorationOptions,
          isLoading: false,
          progressMessage: '',
        }),
    }),
    {
      name: 'tissaia-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        history: state.history,
        settings: state.settings,
        options: state.options,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectCurrentView = (state: AppState) => state.currentView;
export const selectPhotos = (state: AppState) => state.photos;
export const selectCurrentJob = (state: AppState) => state.currentJob;
export const selectOptions = (state: AppState) => state.options;
export const selectHistory = (state: AppState) => state.history;
export const selectSettings = (state: AppState) => state.settings;
export const selectIsLoading = (state: AppState) => state.isLoading;
