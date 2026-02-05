// src/__tests__/unit/store/useAppStore.test.ts
/**
 * Tests for useAppStore
 * ======================
 * Tests for Zustand global state management.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  useAppStore,
  selectCurrentView,
  selectPhotos,
  selectCurrentJob,
  selectOptions,
  selectHistory,
  selectSettings,
  selectIsLoading,
} from '../../../store/useAppStore';
import type {
  PhotoFile,
  PhotoAnalysis,
  RestorationJob,
  RestorationResult,
  HistoryEntry,
} from '../../../types';

// ============================================
// MOCK DATA
// ============================================

const createMockPhoto = (id = 'photo-1'): PhotoFile => ({
  id,
  file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
  name: 'test.jpg',
  size: 1024,
  type: 'image/jpeg',
  preview: 'blob:preview',
  uploadedAt: new Date(),
});

const createMockJob = (id = 'job-1'): RestorationJob => ({
  id,
  photoId: 'photo-1',
  status: 'pending',
  progress: 0,
  options: {
    removeScratches: true,
    fixFading: true,
    enhanceFaces: true,
    colorize: false,
    denoise: true,
    sharpen: true,
    autoCrop: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createMockAnalysis = (): PhotoAnalysis => ({
  id: 'analysis-1',
  photoId: 'photo-1',
  damageAssessment: {
    score: 45,
    level: 'moderate',
    types: [
      {
        type: 'scratches',
        severity: 'medium',
        description: 'Minor scratches detected',
        affectedArea: 15,
      },
    ],
  },
  faceDetection: {
    detected: true,
    count: 2,
    faces: [],
  },
  metadata: {
    width: 800,
    height: 600,
    colorSpace: 'sRGB',
    estimatedAge: 30,
    quality: 'medium',
  },
  suggestions: ['Remove scratches', 'Enhance colors'],
  analyzedAt: new Date(),
});

const createMockResult = (): RestorationResult => ({
  id: 'result-1',
  jobId: 'job-1',
  originalUrl: 'blob:original',
  restoredUrl: 'blob:restored',
  previewUrl: 'blob:preview',
  improvements: {
    overall: 35,
    sharpness: 25,
    colorAccuracy: 40,
    noiseReduction: 30,
    scratchRemoval: 45,
    faceEnhancement: 20,
  },
  processingTime: 2500,
  model: 'gemini-3-pro',
  completedAt: new Date(),
});

// ============================================
// TESTS
// ============================================

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useAppStore.getState();
    store.reset();
    store.clearHistory();

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // VIEW STATE TESTS
  // ============================================

  describe('view state', () => {
    it('has default view as upload', () => {
      const state = useAppStore.getState();
      expect(state.currentView).toBe('upload');
    });

    it('can change view', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setCurrentView('analyze');
      });

      expect(useAppStore.getState().currentView).toBe('analyze');
    });

    it('can change to any valid view', () => {
      const store = useAppStore.getState();
      const views = ['upload', 'analyze', 'restore', 'results', 'history', 'settings', 'health'];

      views.forEach((view) => {
        act(() => {
          store.setCurrentView(view as any);
        });
        expect(useAppStore.getState().currentView).toBe(view);
      });
    });
  });

  // ============================================
  // PHOTO STATE TESTS
  // ============================================

  describe('photo state', () => {
    it('has empty photos array by default', () => {
      const state = useAppStore.getState();
      expect(state.photos).toEqual([]);
    });

    it('can add a photo', () => {
      const store = useAppStore.getState();
      const photo = createMockPhoto();

      act(() => {
        store.addPhoto(photo);
      });

      expect(useAppStore.getState().photos).toHaveLength(1);
      expect(useAppStore.getState().photos[0].id).toBe('photo-1');
    });

    it('can add multiple photos', () => {
      const store = useAppStore.getState();

      act(() => {
        store.addPhoto(createMockPhoto('photo-1'));
        store.addPhoto(createMockPhoto('photo-2'));
        store.addPhoto(createMockPhoto('photo-3'));
      });

      expect(useAppStore.getState().photos).toHaveLength(3);
    });

    it('can remove a photo by id', () => {
      const store = useAppStore.getState();

      act(() => {
        store.addPhoto(createMockPhoto('photo-1'));
        store.addPhoto(createMockPhoto('photo-2'));
        store.removePhoto('photo-1');
      });

      expect(useAppStore.getState().photos).toHaveLength(1);
      expect(useAppStore.getState().photos[0].id).toBe('photo-2');
    });

    it('can clear all photos', () => {
      const store = useAppStore.getState();

      act(() => {
        store.addPhoto(createMockPhoto('photo-1'));
        store.addPhoto(createMockPhoto('photo-2'));
        store.clearPhotos();
      });

      expect(useAppStore.getState().photos).toHaveLength(0);
    });
  });

  // ============================================
  // JOB STATE TESTS
  // ============================================

  describe('job state', () => {
    it('has null job by default', () => {
      const state = useAppStore.getState();
      expect(state.currentJob).toBeNull();
    });

    it('can set current job', () => {
      const store = useAppStore.getState();
      const job = createMockJob();

      act(() => {
        store.setCurrentJob(job);
      });

      expect(useAppStore.getState().currentJob).toEqual(job);
    });

    it('can clear current job', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setCurrentJob(createMockJob());
        store.setCurrentJob(null);
      });

      expect(useAppStore.getState().currentJob).toBeNull();
    });

    it('can update job progress', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setCurrentJob(createMockJob());
        store.updateJobProgress(50);
      });

      expect(useAppStore.getState().currentJob?.progress).toBe(50);
    });

    it('does nothing when updating progress with no job', () => {
      const store = useAppStore.getState();

      act(() => {
        store.updateJobProgress(50);
      });

      expect(useAppStore.getState().currentJob).toBeNull();
    });

    it('can update job status', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setCurrentJob(createMockJob());
        store.updateJobStatus('processing');
      });

      expect(useAppStore.getState().currentJob?.status).toBe('processing');
    });

    it('can set job analysis', () => {
      const store = useAppStore.getState();
      const analysis = createMockAnalysis();

      act(() => {
        store.setCurrentJob(createMockJob());
        store.setJobAnalysis(analysis);
      });

      expect(useAppStore.getState().currentJob?.analysis).toEqual(analysis);
    });

    it('can set job result and updates status to completed', () => {
      const store = useAppStore.getState();
      const result = createMockResult();

      act(() => {
        store.setCurrentJob(createMockJob());
        store.setJobResult(result);
      });

      const currentJob = useAppStore.getState().currentJob;
      expect(currentJob?.result).toEqual(result);
      expect(currentJob?.status).toBe('completed');
      expect(currentJob?.progress).toBe(100);
    });

    it('auto-adds to history when job completes', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setCurrentJob(createMockJob());
        store.setJobResult(createMockResult());
      });

      expect(useAppStore.getState().history).toHaveLength(1);
    });

    it('can set job error', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setCurrentJob(createMockJob());
        store.setJobError('Connection failed');
      });

      const currentJob = useAppStore.getState().currentJob;
      expect(currentJob?.error).toBe('Connection failed');
      expect(currentJob?.status).toBe('failed');
    });
  });

  // ============================================
  // OPTIONS TESTS
  // ============================================

  describe('restoration options', () => {
    it('has default options', () => {
      const state = useAppStore.getState();

      expect(state.options.removeScratches).toBe(true);
      expect(state.options.fixFading).toBe(true);
      expect(state.options.enhanceFaces).toBe(true);
      expect(state.options.colorize).toBe(false);
      expect(state.options.denoise).toBe(true);
      expect(state.options.sharpen).toBe(true);
      expect(state.options.autoCrop).toBe(false);
    });

    it('can update single option', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setOptions({ colorize: true });
      });

      expect(useAppStore.getState().options.colorize).toBe(true);
      // Other options should remain unchanged
      expect(useAppStore.getState().options.removeScratches).toBe(true);
    });

    it('can update multiple options', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setOptions({
          colorize: true,
          autoCrop: true,
          denoise: false,
        });
      });

      const options = useAppStore.getState().options;
      expect(options.colorize).toBe(true);
      expect(options.autoCrop).toBe(true);
      expect(options.denoise).toBe(false);
    });

    it('can reset options to defaults', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setOptions({ colorize: true, autoCrop: true });
        store.resetOptions();
      });

      const options = useAppStore.getState().options;
      expect(options.colorize).toBe(false);
      expect(options.autoCrop).toBe(false);
    });
  });

  // ============================================
  // HISTORY TESTS
  // ============================================

  describe('history', () => {
    const createHistoryEntry = (id = 'history-1'): HistoryEntry => ({
      id,
      job: createMockJob(),
      createdAt: new Date(),
    });

    it('has empty history by default', () => {
      const state = useAppStore.getState();
      expect(state.history).toEqual([]);
    });

    it('can add entry to history', () => {
      const store = useAppStore.getState();

      act(() => {
        store.addToHistory(createHistoryEntry());
      });

      expect(useAppStore.getState().history).toHaveLength(1);
    });

    it('adds new entries at the beginning', () => {
      const store = useAppStore.getState();

      act(() => {
        store.addToHistory(createHistoryEntry('history-1'));
        store.addToHistory(createHistoryEntry('history-2'));
      });

      expect(useAppStore.getState().history[0].id).toBe('history-2');
      expect(useAppStore.getState().history[1].id).toBe('history-1');
    });

    it('limits history to 50 entries', () => {
      const store = useAppStore.getState();

      act(() => {
        for (let i = 0; i < 60; i++) {
          store.addToHistory(createHistoryEntry(`history-${i}`));
        }
      });

      expect(useAppStore.getState().history).toHaveLength(50);
    });

    it('can remove entry from history', () => {
      const store = useAppStore.getState();

      act(() => {
        store.addToHistory(createHistoryEntry('history-1'));
        store.addToHistory(createHistoryEntry('history-2'));
        store.removeFromHistory('history-1');
      });

      const history = useAppStore.getState().history;
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('history-2');
    });

    it('can clear all history', () => {
      const store = useAppStore.getState();

      act(() => {
        store.addToHistory(createHistoryEntry('history-1'));
        store.addToHistory(createHistoryEntry('history-2'));
        store.clearHistory();
      });

      expect(useAppStore.getState().history).toHaveLength(0);
    });
  });

  // ============================================
  // SETTINGS TESTS
  // ============================================

  describe('settings', () => {
    it('has default settings', () => {
      const state = useAppStore.getState();

      expect(state.settings.theme).toBe('dark');
      expect(state.settings.language).toBe('pl');
      expect(state.settings.autoAnalyze).toBe(true);
      expect(state.settings.preserveOriginals).toBe(true);
    });

    it('can update settings', () => {
      const store = useAppStore.getState();

      act(() => {
        store.updateSettings({ autoAnalyze: false });
      });

      expect(useAppStore.getState().settings.autoAnalyze).toBe(false);
    });

    it('can set theme', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setTheme('light');
      });

      expect(useAppStore.getState().settings.theme).toBe('light');
    });

    it('can set language', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setLanguage('en');
      });

      expect(useAppStore.getState().settings.language).toBe('en');
    });

    it('can update GitLab config', () => {
      const store = useAppStore.getState();

      act(() => {
        store.updateGitLabConfig({
          enabled: true,
          projectId: '12345',
          privateToken: 'token123',
        });
      });

      const gitlab = useAppStore.getState().settings.gitlab;
      expect(gitlab.enabled).toBe(true);
      expect(gitlab.projectId).toBe('12345');
      expect(gitlab.privateToken).toBe('token123');
    });

    it('preserves other gitlab settings when updating partially', () => {
      const store = useAppStore.getState();

      act(() => {
        store.updateGitLabConfig({ enabled: true });
      });

      const gitlab = useAppStore.getState().settings.gitlab;
      expect(gitlab.enabled).toBe(true);
      expect(gitlab.instanceUrl).toBe('https://gitlab.com');
      expect(gitlab.branch).toBe('main');
    });
  });

  // ============================================
  // UI STATE TESTS
  // ============================================

  describe('UI state', () => {
    it('has default loading state as false', () => {
      const state = useAppStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('can set loading state', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setIsLoading(true);
      });

      expect(useAppStore.getState().isLoading).toBe(true);
    });

    it('has empty progress message by default', () => {
      const state = useAppStore.getState();
      expect(state.progressMessage).toBe('');
    });

    it('can set progress message', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setProgressMessage('Analyzing image...');
      });

      expect(useAppStore.getState().progressMessage).toBe('Analyzing image...');
    });
  });

  // ============================================
  // RESET TESTS
  // ============================================

  describe('reset', () => {
    it('resets to initial state', () => {
      const store = useAppStore.getState();

      // Modify state
      act(() => {
        store.setCurrentView('results');
        store.addPhoto(createMockPhoto());
        store.setCurrentJob(createMockJob());
        store.setIsLoading(true);
        store.setProgressMessage('Processing...');
        store.setOptions({ colorize: true });
      });

      // Reset
      act(() => {
        store.reset();
      });

      const state = useAppStore.getState();
      expect(state.currentView).toBe('upload');
      expect(state.photos).toHaveLength(0);
      expect(state.currentJob).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.progressMessage).toBe('');
      // Options should also reset
      expect(state.options.colorize).toBe(false);
    });

    it('does not reset history', () => {
      const store = useAppStore.getState();

      act(() => {
        store.addToHistory({
          id: 'history-1',
          job: createMockJob(),
          createdAt: new Date(),
        });
        store.reset();
      });

      // History should persist
      expect(useAppStore.getState().history).toHaveLength(1);
    });

    it('does not reset settings', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setTheme('light');
        store.setLanguage('en');
        store.reset();
      });

      // Settings should persist
      const settings = useAppStore.getState().settings;
      expect(settings.theme).toBe('light');
      expect(settings.language).toBe('en');
    });
  });

  // ============================================
  // SELECTORS TESTS
  // ============================================

  describe('selectors', () => {
    it('selectCurrentView returns current view', () => {
      const store = useAppStore.getState();

      act(() => {
        store.setCurrentView('settings');
      });

      expect(selectCurrentView(useAppStore.getState())).toBe('settings');
    });

    it('selectPhotos returns photos array', () => {
      const store = useAppStore.getState();

      act(() => {
        store.addPhoto(createMockPhoto());
      });

      expect(selectPhotos(useAppStore.getState())).toHaveLength(1);
    });

    it('selectCurrentJob returns current job', () => {
      const store = useAppStore.getState();
      const job = createMockJob();

      act(() => {
        store.setCurrentJob(job);
      });

      expect(selectCurrentJob(useAppStore.getState())).toEqual(job);
    });

    it('selectOptions returns options', () => {
      expect(selectOptions(useAppStore.getState()).removeScratches).toBe(true);
    });

    it('selectHistory returns history', () => {
      expect(selectHistory(useAppStore.getState())).toEqual([]);
    });

    it('selectSettings returns settings object', () => {
      const settings = selectSettings(useAppStore.getState());
      expect(settings).toHaveProperty('theme');
      expect(settings).toHaveProperty('language');
      expect(settings).toHaveProperty('autoAnalyze');
    });

    it('selectIsLoading returns loading state', () => {
      expect(selectIsLoading(useAppStore.getState())).toBe(false);
    });
  });
});
