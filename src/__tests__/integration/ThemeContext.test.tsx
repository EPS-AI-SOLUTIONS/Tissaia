// src/__tests__/integration/ThemeContext.test.tsx
/**
 * Tests for ThemeContext
 * =======================
 * Tests for theme switching functionality.
 */

import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

// ============================================
// MOCK SETUP
// ============================================

// Mock matchMedia
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// ============================================
// HELPER
// ============================================

function createWrapper(defaultTheme: 'dark' | 'light' | 'system' = 'dark') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider defaultTheme={defaultTheme} storageKey="test-theme">
        {children}
      </ThemeProvider>
    );
  };
}

// ============================================
// TESTS
// ============================================

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document classes
    document.documentElement.classList.remove('light', 'dark');
    vi.clearAllMocks();
  });

  // ============================================
  // BASIC TESTS
  // ============================================

  describe('basic functionality', () => {
    it('provides theme context to children', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(result.current.theme).toBeDefined();
      expect(result.current.setTheme).toBeDefined();
      expect(result.current.toggleTheme).toBeDefined();
      expect(result.current.resolvedTheme).toBeDefined();
    });

    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // DEFAULT THEME TESTS
  // ============================================

  describe('default theme', () => {
    it('uses dark as default theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('uses light as default theme when specified', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('light'),
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('uses system theme when specified', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('system'),
      });

      expect(result.current.theme).toBe('system');
      // System resolves to dark because our mock returns prefers-color-scheme: dark as true
      expect(result.current.resolvedTheme).toBe('dark');
    });
  });

  // ============================================
  // SET THEME TESTS
  // ============================================

  describe('setTheme', () => {
    it('can change theme to light', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('can change theme to dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('light'),
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('can change theme to system', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('light'),
      });

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
    });

    it('saves theme to localStorage', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(localStorage.getItem('test-theme')).toBe('light');
    });
  });

  // ============================================
  // TOGGLE THEME TESTS
  // ============================================

  describe('toggleTheme', () => {
    it('toggles from dark to light', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('toggles from light to dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('light'),
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('can toggle multiple times', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('dark');
    });
  });

  // ============================================
  // RESOLVED THEME TESTS
  // ============================================

  describe('resolvedTheme', () => {
    it('resolves dark theme directly', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('resolves light theme directly', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('light'),
      });

      expect(result.current.resolvedTheme).toBe('light');
    });

    it('resolves system theme based on system preference', () => {
      // Mock prefers dark mode
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('system'),
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });
  });

  // ============================================
  // PERSISTENCE TESTS
  // ============================================

  describe('persistence', () => {
    it('loads theme from localStorage', () => {
      localStorage.setItem('test-theme', 'light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      expect(result.current.theme).toBe('light');
    });

    it('uses default theme when localStorage is empty', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      expect(result.current.theme).toBe('dark');
    });

    it('persists theme changes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorage.getItem('test-theme')).toBe('dark');
    });
  });

  // ============================================
  // DOM CLASS TESTS
  // ============================================

  describe('DOM class updates', () => {
    it('adds dark class to document for dark theme', () => {
      renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('adds light class to document for light theme', () => {
      renderHook(() => useTheme(), {
        wrapper: createWrapper('light'),
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('updates DOM class when theme changes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: createWrapper('dark'),
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
