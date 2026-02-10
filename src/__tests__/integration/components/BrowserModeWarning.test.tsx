// src/__tests__/integration/components/BrowserModeWarning.test.tsx
/**
 * BrowserModeWarning Component Tests
 * ===================================
 * Tests for browser mode warning banner.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BrowserModeWarning from '../../../components/ui/BrowserModeWarning';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock sessionStorage
const sessionStorageMock = (() => {
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

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Helper to render with ThemeProvider
function renderWithTheme(ui: React.ReactElement, theme: 'dark' | 'light' = 'dark') {
  return render(
    <ThemeProvider defaultTheme={theme} storageKey="test-theme">
      {ui}
    </ThemeProvider>,
  );
}

describe('BrowserModeWarning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
    // Ensure we're NOT in Tauri mode
    delete (window as unknown as Record<string, unknown>).__TAURI__;
  });

  // ============================================
  // VISIBILITY
  // ============================================

  describe('visibility', () => {
    it('renders warning in browser mode', () => {
      renderWithTheme(<BrowserModeWarning />);
      expect(screen.getByText('Tryb przegladarki')).toBeInTheDocument();
    });

    it('does not render in Tauri mode', () => {
      (window as unknown as Record<string, unknown>).__TAURI__ = {};
      const { container } = renderWithTheme(<BrowserModeWarning />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when already dismissed', () => {
      sessionStorageMock.getItem.mockReturnValueOnce('true');
      const { container } = renderWithTheme(<BrowserModeWarning />);
      expect(container.firstChild).toBeNull();
    });
  });

  // ============================================
  // CONTENT
  // ============================================

  describe('content', () => {
    it('displays warning message', () => {
      renderWithTheme(<BrowserModeWarning />);
      expect(screen.getByText(/Funkcje AI wymagaja aplikacji desktopowej/)).toBeInTheDocument();
    });

    it('displays browser mode title', () => {
      renderWithTheme(<BrowserModeWarning />);
      expect(screen.getByText('Tryb przegladarki')).toBeInTheDocument();
    });

    it('has dismiss button with aria-label', () => {
      renderWithTheme(<BrowserModeWarning />);
      expect(screen.getByRole('button', { name: 'Zamknij ostrzezenie' })).toBeInTheDocument();
    });
  });

  // ============================================
  // DISMISS FUNCTIONALITY
  // ============================================

  describe('dismiss functionality', () => {
    it('dismisses warning when button clicked', () => {
      renderWithTheme(<BrowserModeWarning />);

      const dismissButton = screen.getByRole('button', { name: 'Zamknij ostrzezenie' });
      fireEvent.click(dismissButton);

      expect(screen.queryByText('Tryb przegladarki')).not.toBeInTheDocument();
    });

    it('saves dismissed state to sessionStorage', () => {
      renderWithTheme(<BrowserModeWarning />);

      const dismissButton = screen.getByRole('button', { name: 'Zamknij ostrzezenie' });
      fireEvent.click(dismissButton);

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'tissaia-browser-warning-dismissed',
        'true',
      );
    });

    it('remembers dismissed state on remount', () => {
      // First render and dismiss
      const { unmount } = renderWithTheme(<BrowserModeWarning />);
      const dismissButton = screen.getByRole('button', { name: 'Zamknij ostrzezenie' });
      fireEvent.click(dismissButton);
      unmount();

      // Second render should not show warning
      sessionStorageMock.getItem.mockReturnValueOnce('true');
      const { container } = renderWithTheme(<BrowserModeWarning />);
      expect(container.firstChild).toBeNull();
    });
  });

  // ============================================
  // THEME STYLING
  // ============================================

  describe('theme styling', () => {
    it('applies dark theme styles by default', () => {
      renderWithTheme(<BrowserModeWarning />, 'dark');
      const title = screen.getByText('Tryb przegladarki');
      expect(title).toHaveClass('text-amber-300');
    });

    it('applies light theme styles when in light mode', () => {
      renderWithTheme(<BrowserModeWarning />, 'light');
      const title = screen.getByText('Tryb przegladarki');
      expect(title).toHaveClass('text-amber-800');
    });
  });

  // ============================================
  // ACCESSIBILITY
  // ============================================

  describe('accessibility', () => {
    it('dismiss button is focusable', () => {
      renderWithTheme(<BrowserModeWarning />);
      const button = screen.getByRole('button', { name: 'Zamknij ostrzezenie' });
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('dismiss button has focus ring styles', () => {
      renderWithTheme(<BrowserModeWarning />);
      const button = screen.getByRole('button', { name: 'Zamknij ostrzezenie' });
      expect(button.className).toContain('focus:outline-none');
      expect(button.className).toContain('focus:ring-2');
    });
  });
});
