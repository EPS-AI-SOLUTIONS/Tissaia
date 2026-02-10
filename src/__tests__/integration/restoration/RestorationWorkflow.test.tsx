// src/__tests__/integration/restoration/RestorationWorkflow.test.tsx
/**
 * Restoration Workflow Tests
 * ==========================
 * Integration tests for the full restoration workflow.
 */

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RestoreView from '../../../components/photo/RestoreView';
import { useJobStore } from '../../../store/useJobStore';
import { usePhotoStore } from '../../../store/usePhotoStore';
import { useViewStore } from '../../../store/useViewStore';
import { renderWithProviders } from '../../utils/renderWithProviders';

// Helper to reset all stores
function resetStores() {
  useViewStore.setState({ currentView: 'upload', isLoading: false, progressMessage: '' });
  usePhotoStore.getState().resetPhotos();
  useJobStore.setState({ currentJob: null });
}

// Mock useApi hooks
const mockMutateAsync = vi.fn();
const mockReset = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useRestoreImage: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    reset: mockReset,
  })),
  useAvailableModels: vi.fn(() => ({
    data: [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        capabilities: ['vision', 'text', 'restoration'],
        isAvailable: true,
      },
    ],
    isLoading: false,
  })),
  useSelectedModel: vi.fn(() => ({
    data: 'gemini-2.0-flash-exp',
  })),
  useSetSelectedModel: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useProvidersStatus: vi.fn(() => ({
    data: [{ name: 'google', enabled: true, available: true, priority: 1, last_error: null }],
  })),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

// Create mock photo
function createMockPhoto() {
  return {
    id: 'photo-1',
    name: 'test-restoration.jpg',
    preview: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    size: 2048,
    mimeType: 'image/jpeg',
    uploadedAt: new Date().toISOString(),
    file: new File(['test'], 'test-restoration.jpg', { type: 'image/jpeg' }),
  };
}

// Create mock analysis
function createMockAnalysis() {
  return {
    id: 'analysis-1',
    timestamp: new Date().toISOString(),
    damage_score: 65,
    damage_types: [
      {
        name: 'scratches',
        severity: 'medium' as const,
        description: 'Surface scratches',
        area_percentage: 20,
      },
      {
        name: 'fading',
        severity: 'low' as const,
        description: 'Color fading',
        area_percentage: 35,
      },
    ],
    recommendations: ['Remove scratches', 'Enhance colors', 'Apply sharpening'],
    provider_used: 'google',
  };
}

// Create mock restoration result
function createMockRestorationResult() {
  return {
    id: 'restore-1',
    timestamp: new Date().toISOString(),
    original_image: '/9j/4AAQSkZJRg==',
    restored_image: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA==',
    improvements: ['Scratches removed', 'Colors enhanced', 'Sharpening applied'],
    provider_used: 'google',
    processing_time_ms: 2500,
  };
}

describe('Restoration Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      resetStores();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // RESTORE VIEW RENDERING
  // ============================================

  describe('RestoreView Rendering', () => {
    it('shows no photo message when store is empty', () => {
      renderWithProviders(<RestoreView />, { locale: 'pl' });
      expect(screen.getByText(/brak zdjęcia do restauracji/i)).toBeInTheDocument();
    });

    it('shows upload button when no photo', () => {
      renderWithProviders(<RestoreView />, { locale: 'pl' });
      expect(screen.getByRole('button', { name: /wgraj zdjęcie/i })).toBeInTheDocument();
    });

    it('displays photo preview when photo exists', () => {
      act(() => {
        usePhotoStore.getState().addPhoto(createMockPhoto());
      });

      renderWithProviders(<RestoreView />, { locale: 'pl' });
      const img = screen.getByAltText('test-restoration.jpg');
      expect(img).toBeInTheDocument();
    });

    it('displays photo name', () => {
      act(() => {
        usePhotoStore.getState().addPhoto(createMockPhoto());
      });

      renderWithProviders(<RestoreView />, { locale: 'pl' });
      expect(screen.getByText('test-restoration.jpg')).toBeInTheDocument();
    });
  });

  // ============================================
  // WITH ANALYSIS RESULTS
  // ============================================

  describe('With Analysis Results', () => {
    beforeEach(() => {
      act(() => {
        usePhotoStore.getState().addPhoto(createMockPhoto());
        usePhotoStore.setState({ currentAnalysis: createMockAnalysis() });
      });
    });

    it('displays damage score from analysis', () => {
      renderWithProviders(<RestoreView />, { locale: 'pl' });
      expect(screen.getByText(/65%/)).toBeInTheDocument();
    });

    it('displays detected problems count', () => {
      renderWithProviders(<RestoreView />, { locale: 'pl' });
      expect(screen.getByText(/wykryte problemy.*2/i)).toBeInTheDocument();
    });

    it('displays provider used', () => {
      renderWithProviders(<RestoreView />, { locale: 'pl' });
      expect(screen.getByText(/provider.*google/i)).toBeInTheDocument();
    });

    it('displays all recommendations', () => {
      renderWithProviders(<RestoreView />, { locale: 'pl' });
      expect(screen.getByText('Remove scratches')).toBeInTheDocument();
      expect(screen.getByText('Enhance colors')).toBeInTheDocument();
      expect(screen.getByText('Apply sharpening')).toBeInTheDocument();
    });

    it('enables start restoration button', () => {
      renderWithProviders(<RestoreView />, { locale: 'pl' });
      const restoreButton = screen.getByRole('button', { name: /rozpocznij restaurację/i });
      expect(restoreButton).not.toBeDisabled();
    });
  });

  // ============================================
  // RESTORATION PROCESS
  // ============================================

  describe('Restoration Process', () => {
    beforeEach(() => {
      act(() => {
        usePhotoStore.getState().addPhoto(createMockPhoto());
        usePhotoStore.setState({ currentAnalysis: createMockAnalysis() });
      });
    });

    it('calls restore mutation when button clicked', async () => {
      mockMutateAsync.mockResolvedValueOnce(createMockRestorationResult());

      renderWithProviders(<RestoreView />, { locale: 'pl' });

      const restoreButton = screen.getByRole('button', { name: /rozpocznij restaurację/i });
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          file: expect.any(File),
          analysis: expect.objectContaining({
            id: 'analysis-1',
            damage_score: 65,
          }),
        });
      });
    });

    it('passes correct file to mutation', async () => {
      mockMutateAsync.mockResolvedValueOnce(createMockRestorationResult());

      renderWithProviders(<RestoreView />, { locale: 'pl' });

      const restoreButton = screen.getByRole('button', { name: /rozpocznij restaurację/i });
      fireEvent.click(restoreButton);

      await waitFor(() => {
        const callArgs = mockMutateAsync.mock.calls[0][0];
        expect(callArgs.file.name).toBe('test-restoration.jpg');
        expect(callArgs.file.type).toBe('image/jpeg');
      });
    });

    it('passes analysis to mutation', async () => {
      mockMutateAsync.mockResolvedValueOnce(createMockRestorationResult());

      renderWithProviders(<RestoreView />, { locale: 'pl' });

      const restoreButton = screen.getByRole('button', { name: /rozpocznij restaurację/i });
      fireEvent.click(restoreButton);

      await waitFor(() => {
        const callArgs = mockMutateAsync.mock.calls[0][0];
        expect(callArgs.analysis.damage_types).toHaveLength(2);
        expect(callArgs.analysis.recommendations).toHaveLength(3);
      });
    });
  });

  // ============================================
  // NAVIGATION
  // ============================================

  describe('Navigation', () => {
    beforeEach(() => {
      act(() => {
        usePhotoStore.getState().addPhoto(createMockPhoto());
      });
    });

    it('navigates to upload when no photo button clicked', () => {
      act(() => {
        usePhotoStore.getState().clearPhotos();
      });

      renderWithProviders(<RestoreView />, { locale: 'pl' });

      const uploadButton = screen.getByRole('button', { name: /wgraj zdjęcie/i });
      fireEvent.click(uploadButton);

      expect(useViewStore.getState().currentView).toBe('upload');
    });

    it('navigates back to analyze when back button clicked', () => {
      renderWithProviders(<RestoreView />, { locale: 'pl' });

      const backButton = screen.getByText(/wróć do analizy/i);
      fireEvent.click(backButton);

      expect(useViewStore.getState().currentView).toBe('analyze');
    });

    it('navigates to results after successful restoration', async () => {
      act(() => {
        usePhotoStore.setState({ currentAnalysis: createMockAnalysis() });
      });

      mockMutateAsync.mockResolvedValueOnce(createMockRestorationResult());

      renderWithProviders(<RestoreView />, { locale: 'pl' });

      const restoreButton = screen.getByRole('button', { name: /rozpocznij restaurację/i });
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(useViewStore.getState().currentView).toBe('results');
      });
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe('Error Handling', () => {
    beforeEach(() => {
      act(() => {
        usePhotoStore.getState().addPhoto(createMockPhoto());
        usePhotoStore.setState({ currentAnalysis: createMockAnalysis() });
      });
    });

    it('handles restoration error gracefully', async () => {
      const sonnerModule = await import('sonner');
      mockMutateAsync.mockRejectedValueOnce(new Error('Restoration failed'));

      renderWithProviders(<RestoreView />, { locale: 'pl' });

      const restoreButton = screen.getByRole('button', { name: /rozpocznij restaurację/i });
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(sonnerModule.toast.error).toHaveBeenCalledWith('Restoration failed');
      });
    });

    it('shows toast error without crashing', async () => {
      const sonnerModule = await import('sonner');
      mockMutateAsync.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<RestoreView />, { locale: 'pl' });

      const restoreButton = screen.getByRole('button', { name: /rozpocznij restaurację/i });
      fireEvent.click(restoreButton);

      await waitFor(() => {
        expect(sonnerModule.toast.error).toHaveBeenCalled();
      });

      // Ensure the component is still rendered after error
      expect(screen.getByText('test-restoration.jpg')).toBeInTheDocument();
    });

    it('shows error message for missing photo', async () => {
      await import('sonner');

      // Clear photos but keep analysis
      act(() => {
        usePhotoStore.getState().clearPhotos();
      });

      renderWithProviders(<RestoreView />, { locale: 'pl' });

      // Should show "no photo" message
      expect(screen.getByText(/brak zdjęcia do restauracji/i)).toBeInTheDocument();
    });

    it('disables restore button when missing analysis', async () => {
      // Clear analysis
      act(() => {
        usePhotoStore.setState({ currentAnalysis: null });
      });

      renderWithProviders(<RestoreView />, { locale: 'pl' });

      // Start button should exist but be disabled
      const restoreButton = screen.getByRole('button', { name: /rozpocznij restaurację/i });
      expect(restoreButton).toBeDisabled();
    });
  });

  // ============================================
  // LOCALIZATION
  // ============================================

  describe('Localization', () => {
    beforeEach(() => {
      act(() => {
        usePhotoStore.getState().addPhoto(createMockPhoto());
        usePhotoStore.setState({ currentAnalysis: createMockAnalysis() });
      });
    });

    it('renders in Polish', () => {
      renderWithProviders(<RestoreView />, { locale: 'pl' });
      expect(screen.getByText(/opcje restauracji/i)).toBeInTheDocument();
      expect(screen.getByText(/wróć do analizy/i)).toBeInTheDocument();
    });

    it('renders in English', () => {
      renderWithProviders(<RestoreView />, { locale: 'en' });
      expect(screen.getByText(/restoration options/i)).toBeInTheDocument();
    });
  });
});
