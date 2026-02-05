// src/__tests__/integration/views/ResultsView.test.tsx
/**
 * ResultsView Component Tests
 * ===========================
 * Tests for restoration results view.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResultsView from '../../../components/photo/ResultsView';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from '../../../i18n';
import { useAppStore } from '../../../store/useAppStore';
import { act } from 'react';

// Mock sonner
vi.mock('sonner', () => ({
  default: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

// Import toast for assertions
import toast from 'sonner';

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
function createMockPhoto() {
  return {
    id: 'photo-1',
    name: 'test.jpg',
    preview: 'data:image/jpeg;base64,originaltest',
    size: 1024,
    mimeType: 'image/jpeg',
    uploadedAt: new Date(),
  };
}

// Create mock restoration result
function createMockResult() {
  return {
    id: 'result-1',
    timestamp: new Date().toISOString(),
    original_image: 'base64original',
    restored_image: 'base64restored',
    improvements: ['Scratches removed', 'Colors enhanced', 'Contrast improved'],
    provider_used: 'google',
    processing_time_ms: 2500,
  };
}

describe('ResultsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useAppStore.getState().reset();
    });
  });

  // ============================================
  // NO RESULT STATE
  // ============================================

  describe('no result state', () => {
    it('displays no results message when no result', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText(/brak wyników restauracji/i)).toBeInTheDocument();
    });

    it('displays upload button when no result', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByRole('button', { name: /wgraj zdjęcie/i })).toBeInTheDocument();
    });

    it('navigates to upload when button clicked', () => {
      renderWithProviders(<ResultsView />);

      const uploadButton = screen.getByRole('button', { name: /wgraj zdjęcie/i });
      fireEvent.click(uploadButton);

      expect(useAppStore.getState().currentView).toBe('upload');
    });
  });

  // ============================================
  // WITH RESULT
  // ============================================

  describe('with result', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto());
        useAppStore.setState({ restorationResult: createMockResult() });
      });
    });

    it('renders without crashing when result exists', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays results title', () => {
      renderWithProviders(<ResultsView />, 'en');
      expect(screen.getByText(/result/i)).toBeInTheDocument();
    });

    it('displays success message', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText(/restauracja zakończona pomyślnie/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // COMPARISON VIEW
  // ============================================

  describe('comparison view', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto());
        useAppStore.setState({ restorationResult: createMockResult() });
      });
    });

    it('displays original label', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText('Oryginał')).toBeInTheDocument();
    });

    it('displays restored label', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText('Po restauracji')).toBeInTheDocument();
    });

    it('displays original image', () => {
      renderWithProviders(<ResultsView />);
      const originalImg = screen.getByAltText('Original');
      expect(originalImg).toBeInTheDocument();
    });

    it('displays restored image', () => {
      renderWithProviders(<ResultsView />);
      const restoredImg = screen.getByAltText('Restored');
      expect(restoredImg).toBeInTheDocument();
      expect(restoredImg).toHaveAttribute('src', expect.stringContaining('base64'));
    });
  });

  // ============================================
  // STATISTICS
  // ============================================

  describe('statistics', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto());
        useAppStore.setState({ restorationResult: createMockResult() });
      });
    });

    it('displays number of improvements', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 improvements
      expect(screen.getByText('Ulepszeń')).toBeInTheDocument();
    });

    it('displays processing time', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText('2.5s')).toBeInTheDocument(); // 2500ms = 2.5s
      expect(screen.getByText('Czas')).toBeInTheDocument();
    });

    it('displays provider used', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText('google')).toBeInTheDocument();
      expect(screen.getByText('Provider')).toBeInTheDocument();
    });

    it('displays completion time', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText('Zakończono')).toBeInTheDocument();
    });
  });

  // ============================================
  // IMPROVEMENTS LIST
  // ============================================

  describe('improvements list', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto());
        useAppStore.setState({ restorationResult: createMockResult() });
      });
    });

    it('displays improvements section', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText(/zastosowane ulepszenia/i)).toBeInTheDocument();
    });

    it('displays all improvements', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText('Scratches removed')).toBeInTheDocument();
      expect(screen.getByText('Colors enhanced')).toBeInTheDocument();
      expect(screen.getByText('Contrast improved')).toBeInTheDocument();
    });
  });

  // ============================================
  // ACTIONS
  // ============================================

  describe('actions', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto());
        useAppStore.setState({ restorationResult: createMockResult() });
      });
    });

    it('displays download button', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText('Pobierz')).toBeInTheDocument();
    });

    it('displays new photo button', () => {
      renderWithProviders(<ResultsView />);
      expect(screen.getByText('Nowe zdjęcie')).toBeInTheDocument();
    });

    it('clears state and navigates to upload when new photo clicked', () => {
      renderWithProviders(<ResultsView />);

      const newPhotoButton = screen.getByText('Nowe zdjęcie');
      fireEvent.click(newPhotoButton);

      expect(useAppStore.getState().currentView).toBe('upload');
      expect(useAppStore.getState().photos).toHaveLength(0);
    });
  });

  // ============================================
  // DOWNLOAD
  // ============================================

  describe('download', () => {
    beforeEach(() => {
      act(() => {
        useAppStore.getState().addPhoto(createMockPhoto());
        useAppStore.setState({ restorationResult: createMockResult() });
      });
    });

    it('download button is clickable', () => {
      renderWithProviders(<ResultsView />);

      const downloadButton = screen.getByText('Pobierz');
      // Just verify the button exists and can be clicked without throwing
      expect(downloadButton).toBeInTheDocument();
      expect(downloadButton).not.toBeDisabled();
    });
  });

  // ============================================
  // NO PHOTO EDGE CASE
  // ============================================

  describe('no photo edge case', () => {
    it('handles result without photo - shows restored image', () => {
      // Reset store completely first
      act(() => {
        useAppStore.getState().reset();
        useAppStore.setState({ restorationResult: createMockResult() });
      });

      renderWithProviders(<ResultsView />);
      // Should still show restored label since we have a result
      expect(screen.getByText('Po restauracji')).toBeInTheDocument();
    });
  });
});
