// src/__tests__/integration/components/Sidebar.test.tsx
/**
 * Sidebar Component Tests
 * =======================
 * Tests for navigation sidebar with grouped navigation.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Sidebar from '../../../components/Sidebar';
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

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

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

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
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
      renderWithProviders(<Sidebar />);
      // Logo should be present
      expect(screen.getByAltText('TISSAIA')).toBeInTheDocument();
    });

    it('displays logo', () => {
      renderWithProviders(<Sidebar />);
      const logo = screen.getByAltText('TISSAIA');
      expect(logo).toBeInTheDocument();
    });

    it('displays version info', () => {
      renderWithProviders(<Sidebar />);
      expect(screen.getByText(/v3.0.0/)).toBeInTheDocument();
    });
  });

  // ============================================
  // NAVIGATION GROUPS
  // ============================================

  describe('navigation groups', () => {
    it('displays main group items', () => {
      renderWithProviders(<Sidebar />, { locale: 'en' });
      // Main navigation items should be visible (groups expanded by default)
      expect(screen.getByRole('button', { name: /Upload/i })).toBeInTheDocument();
    });

    it('displays data group items', () => {
      renderWithProviders(<Sidebar />, { locale: 'en' });
      expect(screen.getByRole('button', { name: /History/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();
    });

    it('displays system group items', () => {
      renderWithProviders(<Sidebar />, { locale: 'en' });
      // Health/Status should be visible
      expect(screen.getByRole('button', { name: /Health|Status/i })).toBeInTheDocument();
    });
  });

  // ============================================
  // NAVIGATION
  // ============================================

  describe('navigation', () => {
    it('navigates to upload view when clicked', () => {
      renderWithProviders(<Sidebar />, { locale: 'en' });
      const uploadButton = screen.getByRole('button', { name: /Upload/i });
      fireEvent.click(uploadButton);
      expect(useViewStore.getState().currentView).toBe('upload');
    });

    it('navigates to restore view when clicked', () => {
      renderWithProviders(<Sidebar />, { locale: 'en' });
      const restoreButton = screen.getByRole('button', { name: /Restor/i });
      fireEvent.click(restoreButton);
      expect(useViewStore.getState().currentView).toBe('restore');
    });

    it('navigates to settings view when clicked', () => {
      renderWithProviders(<Sidebar />, { locale: 'en' });
      const settingsButton = screen.getByRole('button', { name: /Settings/i });
      fireEvent.click(settingsButton);
      expect(useViewStore.getState().currentView).toBe('settings');
    });

    it('highlights active view', () => {
      act(() => {
        useViewStore.getState().setCurrentView('settings');
      });
      renderWithProviders(<Sidebar />, { locale: 'en' });

      const settingsButton = screen.getByRole('button', { name: /Settings/i });
      expect(settingsButton.className).toContain('text-matrix-accent');
    });
  });

  // ============================================
  // COLLAPSE FUNCTIONALITY
  // ============================================

  describe('collapse functionality', () => {
    it('starts expanded by default', () => {
      const { container } = renderWithProviders(<Sidebar />);
      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar.className).toContain('w-64');
    });

    it('collapses when toggle button clicked', () => {
      const { container } = renderWithProviders(<Sidebar />);

      const collapseButton = screen.getByTitle('Collapse sidebar');
      fireEvent.click(collapseButton);

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar.className).toContain('w-20');
    });

    it('expands when toggle button clicked in collapsed state', () => {
      const { container } = renderWithProviders(<Sidebar />);

      // First collapse
      const collapseButton = screen.getByTitle('Collapse sidebar');
      fireEvent.click(collapseButton);

      // Then expand
      const expandButton = screen.getByTitle('Expand sidebar');
      fireEvent.click(expandButton);

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar.className).toContain('w-64');
    });

    it('persists collapsed state to localStorage', () => {
      renderWithProviders(<Sidebar />);

      const collapseButton = screen.getByTitle('Collapse sidebar');
      fireEvent.click(collapseButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('tissaia_sidebar_collapsed', 'true');
    });
  });

  // ============================================
  // THEME TOGGLE
  // ============================================

  describe('theme toggle', () => {
    it('displays theme toggle button', () => {
      renderWithProviders(<Sidebar />, { locale: 'en' });
      expect(screen.getByText(/DARK MODE|LIGHT MODE/i)).toBeInTheDocument();
    });

    it('shows dark mode label in dark theme', () => {
      renderWithProviders(<Sidebar />, { theme: 'dark', locale: 'en' });
      expect(screen.getByText(/DARK MODE/i)).toBeInTheDocument();
    });

    it('shows light mode label in light theme', () => {
      renderWithProviders(<Sidebar />, { theme: 'light', locale: 'en' });
      expect(screen.getByText(/LIGHT MODE/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // LANGUAGE SELECTOR
  // ============================================

  describe('language selector', () => {
    it('displays language selector button', () => {
      renderWithProviders(<Sidebar />);
      // Should show current language code
      expect(screen.getByText('PL')).toBeInTheDocument();
    });

    it('shows language dropdown when clicked', () => {
      renderWithProviders(<Sidebar />);

      // Find and click the language button (contains globe icon)
      const langButtons = screen.getAllByRole('button');
      const langButton = langButtons.find((btn) => btn.textContent?.includes('PL'));
      expect(langButton).toBeDefined();

      if (langButton) {
        fireEvent.click(langButton);
        // Dropdown should show language options
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Polski')).toBeInTheDocument();
      }
    });

    it('changes language when option selected', () => {
      renderWithProviders(<Sidebar />);

      // Open dropdown
      const langButtons = screen.getAllByRole('button');
      const langButton = langButtons.find((btn) => btn.textContent?.includes('PL'));
      if (langButton) {
        fireEvent.click(langButton);

        // Select English
        const englishOption = screen.getByText('English');
        fireEvent.click(englishOption);

        expect(i18n.language).toBe('en');
      }
    });
  });

  // ============================================
  // CURRENT JOB STATUS
  // ============================================

  describe('current job status', () => {
    it('does not display job status when no current job', () => {
      renderWithProviders(<Sidebar />);
      expect(screen.queryByText('Bieżące zadanie')).not.toBeInTheDocument();
    });

    it('displays job status when current job exists', () => {
      act(() => {
        useJobStore.getState().setCurrentJob({
          id: 'job-1',
          photo: {
            id: 'photo-1',
            file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
            name: 'test.jpg',
            preview: '',
            mimeType: 'image/jpeg',
            size: 1000,
            uploadedAt: new Date().toISOString(),
          },
          analysis: null,
          options: {
            removeScratches: true,
            fixFading: true,
            enhanceFaces: false,
            colorize: false,
            denoise: false,
            sharpen: false,
            autoCrop: false,
          },
          result: null,
          status: 'analyzing',
          error: null,
          progress: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      renderWithProviders(<Sidebar />);
      expect(screen.getByText('Bieżące zadanie')).toBeInTheDocument();
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    it('displays job progress bar when processing', () => {
      act(() => {
        useJobStore.getState().setCurrentJob({
          id: 'job-1',
          photo: {
            id: 'photo-1',
            file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
            name: 'test.jpg',
            preview: '',
            mimeType: 'image/jpeg',
            size: 1000,
            uploadedAt: new Date().toISOString(),
          },
          analysis: null,
          options: {
            removeScratches: true,
            fixFading: true,
            enhanceFaces: false,
            colorize: false,
            denoise: false,
            sharpen: false,
            autoCrop: false,
          },
          result: null,
          status: 'analyzing',
          error: null,
          progress: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      const { container } = renderWithProviders(<Sidebar />);
      expect(container.querySelector('.progress-matrix')).toBeInTheDocument();
    });

    it('displays completed status badge', () => {
      act(() => {
        useJobStore.getState().setCurrentJob({
          id: 'job-1',
          photo: {
            id: 'photo-1',
            file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
            name: 'test.jpg',
            preview: '',
            mimeType: 'image/jpeg',
            size: 1000,
            uploadedAt: new Date().toISOString(),
          },
          analysis: null,
          options: {
            removeScratches: true,
            fixFading: true,
            enhanceFaces: false,
            colorize: false,
            denoise: false,
            sharpen: false,
            autoCrop: false,
          },
          result: null,
          status: 'completed',
          error: null,
          progress: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      renderWithProviders(<Sidebar />);
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  // ============================================
  // LOGO
  // ============================================

  describe('logo', () => {
    it('displays dark logo in dark theme', () => {
      renderWithProviders(<Sidebar />, { theme: 'dark' });
      const logo = screen.getByAltText('TISSAIA') as HTMLImageElement;
      expect(logo.src).toContain('logodark.webp');
    });

    it('displays light logo in light theme', () => {
      renderWithProviders(<Sidebar />, { theme: 'light' });
      const logo = screen.getByAltText('TISSAIA') as HTMLImageElement;
      expect(logo.src).toContain('logolight.webp');
    });
  });
});
