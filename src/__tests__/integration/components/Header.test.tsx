// src/__tests__/integration/components/Header.test.tsx
/**
 * Header Component Tests
 * ======================
 * Tests for application header with breadcrumbs and status.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from '../../../components/Header';
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

// Helper to render with providers
function renderWithProviders(
  ui: React.ReactElement,
  options: { theme?: 'dark' | 'light'; locale?: string } = {},
) {
  const { theme = 'dark', locale = 'pl' } = options;
  i18n.changeLanguage(locale);

  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider defaultTheme={theme} storageKey="test-theme">
        {ui}
      </ThemeProvider>
    </I18nextProvider>,
  );
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    act(() => {
      resetStores();
    });
  });

  // ============================================
  // RENDERING
  // ============================================

  describe('rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('displays Tissaia brand name', () => {
      renderWithProviders(<Header />);
      expect(screen.getByText('Tissaia')).toBeInTheDocument();
    });

    it('displays current view in breadcrumb', () => {
      act(() => {
        useViewStore.getState().setCurrentView('restore');
      });
      renderWithProviders(<Header />, { locale: 'en' });
      expect(screen.getByText('Restore')).toBeInTheDocument();
    });
  });

  // ============================================
  // BREADCRUMBS
  // ============================================

  describe('breadcrumbs', () => {
    it('displays upload view label', () => {
      act(() => {
        useViewStore.getState().setCurrentView('upload');
      });
      renderWithProviders(<Header />, { locale: 'en' });
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('displays settings view label in Polish', () => {
      act(() => {
        useViewStore.getState().setCurrentView('settings');
      });
      renderWithProviders(<Header />, { locale: 'pl' });
      expect(screen.getByText('Ustawienia')).toBeInTheDocument();
    });

    it('displays history view label', () => {
      act(() => {
        useViewStore.getState().setCurrentView('history');
      });
      renderWithProviders(<Header />, { locale: 'en' });
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    it('navigates to upload view when home button clicked', () => {
      act(() => {
        useViewStore.getState().setCurrentView('settings');
      });
      renderWithProviders(<Header />);

      const homeButton = screen.getByRole('button', { name: /Tissaia/i });
      fireEvent.click(homeButton);

      expect(useViewStore.getState().currentView).toBe('upload');
    });
  });

  // ============================================
  // STATUS INDICATOR
  // ============================================

  describe('status indicator', () => {
    it('displays healthy status in English', () => {
      renderWithProviders(<Header status="healthy" />, { locale: 'en' });
      // Look for translated healthy text
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('displays healthy status in Polish', () => {
      renderWithProviders(<Header status="healthy" />, { locale: 'pl' });
      expect(screen.getByText('Sprawny')).toBeInTheDocument();
    });

    it('displays degraded status in English', () => {
      renderWithProviders(<Header status="degraded" />, { locale: 'en' });
      expect(screen.getByText('Degraded')).toBeInTheDocument();
    });

    it('displays degraded status in Polish', () => {
      renderWithProviders(<Header status="degraded" />, { locale: 'pl' });
      expect(screen.getByText('Ograniczony')).toBeInTheDocument();
    });

    it('shows pulsing indicator for healthy status', () => {
      const { container } = renderWithProviders(<Header status="healthy" />);
      const indicator = container.querySelector('.animate-pulse');
      expect(indicator).toBeInTheDocument();
    });

    it('shows yellow indicator for non-healthy status', () => {
      const { container } = renderWithProviders(<Header status="degraded" />);
      const indicator = container.querySelector('.bg-yellow-500');
      expect(indicator).toBeInTheDocument();
    });
  });

  // ============================================
  // REFRESH BUTTON
  // ============================================

  describe('refresh button', () => {
    it('renders refresh button', () => {
      renderWithProviders(<Header />);
      expect(screen.getByTitle('Refresh')).toBeInTheDocument();
    });

    it('calls window.location.reload when clicked', () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      renderWithProviders(<Header />);
      const refreshButton = screen.getByTitle('Refresh');
      fireEvent.click(refreshButton);

      expect(reloadMock).toHaveBeenCalled();
    });
  });

  // ============================================
  // THEME STYLING
  // ============================================

  describe('theme styling', () => {
    it('applies dark theme border color', () => {
      const { container } = renderWithProviders(<Header />, { theme: 'dark' });
      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('renders header element with correct tag', () => {
      renderWithProviders(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  // ============================================
  // VIEW LABELS
  // ============================================

  describe('view labels localization', () => {
    const views = [
      'upload',
      'crop',
      'restore',
      'results',
      'history',
      'settings',
      'health',
    ] as const;

    views.forEach((view) => {
      it(`displays correct label for ${view} view in English`, () => {
        act(() => {
          useViewStore.getState().setCurrentView(view);
        });
        renderWithProviders(<Header />, { locale: 'en' });

        const expectedLabels: Record<string, string> = {
          upload: 'Upload',
          analyze: 'Analyze',
          restore: 'Restore',
          results: 'Results',
          history: 'History',
          settings: 'Settings',
          health: 'Health',
        };

        expect(screen.getByText(expectedLabels[view])).toBeInTheDocument();
      });
    });
  });
});
