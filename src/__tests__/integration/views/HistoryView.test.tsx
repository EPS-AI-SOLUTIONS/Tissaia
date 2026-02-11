// src/__tests__/integration/views/HistoryView.test.tsx
/**
 * HistoryView Component Tests
 * ===========================
 * Tests for restoration history view.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HistoryView from '../../../components/HistoryView';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import i18n from '../../../i18n';
import { useJobStore } from '../../../store/useJobStore';
import { usePhotoStore } from '../../../store/usePhotoStore';
import { useViewStore } from '../../../store/useViewStore';

// Helper to reset all stores
function resetStores() {
  useViewStore.setState({ currentView: 'upload', isLoading: false, progressMessage: '' });
  usePhotoStore.getState().resetPhotos();
  useJobStore.setState({ currentJob: null });
}

// Mock useApi hooks
const mockHistory = [
  {
    id: 'entry-1',
    timestamp: new Date().toISOString(),
    operation: 'analysis',
    input_preview: 'photo1.jpg',
    result_preview: null,
    provider: 'google',
    success: true,
    error_message: null,
  },
  {
    id: 'entry-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    operation: 'restoration',
    input_preview: 'photo2.jpg',
    result_preview: 'restored_photo2.jpg',
    provider: 'anthropic',
    success: false,
    error_message: 'Processing failed',
  },
];

const mockClearHistoryMutateAsync = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useHistory: vi.fn(() => ({
    data: mockHistory,
    isLoading: false,
    isError: false,
  })),
  useClearHistory: vi.fn(() => ({
    mutateAsync: mockClearHistoryMutateAsync,
    isPending: false,
  })),
}));

// Mock sonner
vi.mock('sonner', () => {
  const toastFn = Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  });
  return { default: toastFn, toast: toastFn };
});

// Mock window.confirm
const mockConfirm = vi.fn(() => true);
window.confirm = mockConfirm;

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
    </QueryClientProvider>,
  );
}

describe('HistoryView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    act(() => {
      resetStores();
    });
  });

  // ============================================
  // RENDERING
  // ============================================

  describe('rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<HistoryView />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays history title', () => {
      renderWithProviders(<HistoryView />, 'en');
      expect(screen.getByText(/history/i)).toBeInTheDocument();
    });

    it('displays number of operations', () => {
      renderWithProviders(<HistoryView />);
      expect(screen.getByText(/2\s*operacji/)).toBeInTheDocument();
    });
  });

  // ============================================
  // HISTORY ENTRIES
  // ============================================

  describe('history entries', () => {
    it('displays history entries', () => {
      renderWithProviders(<HistoryView />);
      expect(screen.getByText('Analiza')).toBeInTheDocument();
      expect(screen.getByText('Restauracja')).toBeInTheDocument();
    });

    it('displays provider badges', () => {
      renderWithProviders(<HistoryView />);
      expect(screen.getByText('google')).toBeInTheDocument();
      expect(screen.getByText('anthropic')).toBeInTheDocument();
    });

    it('displays success icon for successful operations', () => {
      const { container } = renderWithProviders(<HistoryView />);
      // Check for CheckCircle icon (white background in dark theme)
      expect(container.querySelector('.bg-white\\/10')).toBeInTheDocument();
    });

    it('displays error icon for failed operations', () => {
      const { container } = renderWithProviders(<HistoryView />);
      // Check for XCircle icon (red background)
      expect(container.querySelector('.bg-red-500\\/10')).toBeInTheDocument();
    });

    it('displays error message for failed operations', () => {
      renderWithProviders(<HistoryView />);
      expect(screen.getByText('Processing failed')).toBeInTheDocument();
    });
  });

  // ============================================
  // CLEAR HISTORY
  // ============================================

  describe('clear history', () => {
    it('displays clear button when history exists', () => {
      renderWithProviders(<HistoryView />);
      expect(screen.getByText(/wyczyść/i)).toBeInTheDocument();
    });

    it('shows confirmation dialog when clear button clicked', () => {
      renderWithProviders(<HistoryView />);

      const clearButton = screen.getByText(/wyczyść/i);
      fireEvent.click(clearButton);

      expect(mockConfirm).toHaveBeenCalledWith('Czy na pewno chcesz wyczyścić historię?');
    });

    it('calls clearHistory mutation when confirmed', async () => {
      renderWithProviders(<HistoryView />);

      const clearButton = screen.getByText(/wyczyść/i);
      fireEvent.click(clearButton);

      expect(mockClearHistoryMutateAsync).toHaveBeenCalled();
    });

    it('does not call clearHistory when cancelled', async () => {
      mockConfirm.mockReturnValueOnce(false);

      renderWithProviders(<HistoryView />);

      const clearButton = screen.getByText(/wyczyść/i);
      fireEvent.click(clearButton);

      expect(mockClearHistoryMutateAsync).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // LOADING STATE
  // ============================================

  describe('loading state', () => {
    it('shows skeletons when loading', async () => {
      const { useHistory } = await import('../../../hooks/useApi');
      (useHistory as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        isError: false,
      });

      const { container } = renderWithProviders(<HistoryView />);
      // Should show skeleton loaders
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // EMPTY STATE
  // ============================================

  describe('empty state', () => {
    it('shows empty message when no history', async () => {
      const { useHistory } = await import('../../../hooks/useApi');
      (useHistory as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        data: [],
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<HistoryView />);
      expect(screen.getByText(/brak historii operacji/i)).toBeInTheDocument();
    });

    it('does not show clear button when no history', async () => {
      const { useHistory } = await import('../../../hooks/useApi');
      (useHistory as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        data: [],
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<HistoryView />);
      expect(screen.queryByText(/wyczyść/i)).not.toBeInTheDocument();
    });
  });
});
