// src/__tests__/integration/views/AnalyzeView.test.tsx
/**
 * AnalyzeView Component Tests
 * ===========================
 * Tests for photo analysis view.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalyzeView from '../../../components/photo/AnalyzeView';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from '../../../i18n';
import { useAppStore } from '../../../store/useAppStore';
import { act } from 'react';

// Mock useApi hooks
const mockMutateAsync = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useAnalyzeImage: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
  useAvailableModels: vi.fn(() => ({
    data: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google', capabilities: ['vision', 'text', 'restoration'], isAvailable: true },
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
  default: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement, locale: string = 'pl') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  i18n.changeLanguage(locale);

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider defaultTheme="dark" storageKey="test-theme">
          {ui}
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

// Create mock photo
function createMockPhoto(id: string = 'photo-1', name: string = 'test.jpg') {
  return {
    id,
    name,
    preview: 'data:image/jpeg;base64,test',
    size: 1024,
    mimeType: 'image/jpeg',
    uploadedAt: new Date(),
    file: new File([''], name, { type: 'image/jpeg' }),
  };
}

describe('AnalyzeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    act(() => {
      useAppStore.getState().reset();
    });
  });

  // ============================================
  // REDIRECT BEHAVIOR
  // ============================================

  describe('redirect behavior', () => {
    it('redirects to upload when no photos', () => {
      renderWithProviders(<AnalyzeView />);
      // Should set current view to upload
      expect(useAppStore.getState().currentView).toBe('upload');
    });
  });

  // ============================================
  // RENDERING WITH PHOTOS
  // ============================================

  describe('rendering with photos', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto());
      });
    });

    it('renders without crashing when photos exist', () => {
      renderWithProviders(<AnalyzeView />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays analyze title', () => {
      renderWithProviders(<AnalyzeView />);
      // Check for heading element
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays photo count', () => {
      renderWithProviders(<AnalyzeView />);
      expect(screen.getByText(/1\s*z\s*1/)).toBeInTheDocument();
    });

    it('displays photo thumbnail', () => {
      renderWithProviders(<AnalyzeView />);
      // Check for image element with data URL
      expect(document.querySelector('img[src^="data:image"]')).toBeInTheDocument();
    });
  });

  // ============================================
  // MULTIPLE PHOTOS
  // ============================================

  describe('multiple photos', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto('photo-1', 'test1.jpg'));
        useAppStore.getState().addPhoto(createMockPhoto('photo-2', 'test2.jpg'));
      });
    });

    it('displays correct photo count', () => {
      renderWithProviders(<AnalyzeView />);
      expect(screen.getByText(/1\s*z\s*2/)).toBeInTheDocument();
    });

    it('displays thumbnails for all photos', () => {
      renderWithProviders(<AnalyzeView />);
      const thumbnails = document.querySelectorAll('button img');
      expect(thumbnails.length).toBe(2);
    });

    it('switches to next photo when thumbnail clicked', async () => {
      renderWithProviders(<AnalyzeView />);

      // Find second thumbnail button
      const thumbnails = screen.getAllByRole('button').filter(
        btn => btn.querySelector('img')
      );

      if (thumbnails[1]) {
        fireEvent.click(thumbnails[1]);
      }

      await waitFor(() => {
        expect(screen.getByText(/2\s*z\s*2/)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // ANALYSIS STATE
  // ============================================

  describe('analysis state', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto());
      });
    });

    it('shows no results message initially', () => {
      // Reset mutation to not trigger auto-analysis
      mockMutateAsync.mockReset();

      renderWithProviders(<AnalyzeView />);
      // After auto-analysis is disabled or before it runs - may have multiple matches
      const noResultsElements = screen.getAllByText(/brak wyników analizy|rozpocznij analizę/i);
      expect(noResultsElements.length).toBeGreaterThan(0);
    });

    it('shows start analysis button when no results', () => {
      mockMutateAsync.mockReset();

      renderWithProviders(<AnalyzeView />);
      expect(screen.getByRole('button', { name: /rozpocznij analizę/i })).toBeInTheDocument();
    });
  });

  // ============================================
  // LOADING STATE
  // ============================================

  describe('loading state', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto());
      });
    });

    it('shows progress bar when analyzing', async () => {
      const { useAnalyzeImage } = await import('../../../hooks/useApi');
      (useAnalyzeImage as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        mutateAsync: mockMutateAsync,
        isPending: true,
      });

      const { container } = renderWithProviders(<AnalyzeView />);
      // When analyzing, the AnalysisProgressBar is shown (has step indicators)
      const stepDots = container.querySelectorAll('.w-10.h-10.rounded-full');
      expect(stepDots.length).toBe(6);
    });
  });

  // ============================================
  // NAVIGATION
  // ============================================

  describe('navigation', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto());
      });
    });

    it('does not show restore button without analysis', () => {
      mockMutateAsync.mockReset();

      renderWithProviders(<AnalyzeView />);
      expect(screen.queryByText(/przejdź do restauracji/i)).not.toBeInTheDocument();
    });
  });
});
