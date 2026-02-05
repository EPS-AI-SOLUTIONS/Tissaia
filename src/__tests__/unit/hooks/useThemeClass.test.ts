// src/__tests__/unit/hooks/useThemeClass.test.ts
/**
 * Tests for useThemeClass hooks
 * ==============================
 * Tests for useGlassPanel, useIsLightTheme, and useThemeClass hooks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useGlassPanel, useIsLightTheme, useThemeClass } from '../../../hooks/useThemeClass';

// Mock the ThemeContext
const mockUseTheme = vi.fn();
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('useThemeClass hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // useGlassPanel TESTS
  // ============================================

  describe('useGlassPanel', () => {
    it('returns glass-panel-light for light theme', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });

      const { result } = renderHook(() => useGlassPanel());

      expect(result.current).toBe('glass-panel-light');
    });

    it('returns glass-panel-dark for dark theme', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });

      const { result } = renderHook(() => useGlassPanel());

      expect(result.current).toBe('glass-panel-dark');
    });

    it('updates when theme changes', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
      const { result, rerender } = renderHook(() => useGlassPanel());

      expect(result.current).toBe('glass-panel-dark');

      mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });
      rerender();

      expect(result.current).toBe('glass-panel-light');
    });
  });

  // ============================================
  // useIsLightTheme TESTS
  // ============================================

  describe('useIsLightTheme', () => {
    it('returns true for light theme', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });

      const { result } = renderHook(() => useIsLightTheme());

      expect(result.current).toBe(true);
    });

    it('returns false for dark theme', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });

      const { result } = renderHook(() => useIsLightTheme());

      expect(result.current).toBe(false);
    });

    it('updates when theme changes', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });
      const { result, rerender } = renderHook(() => useIsLightTheme());

      expect(result.current).toBe(true);

      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
      rerender();

      expect(result.current).toBe(false);
    });
  });

  // ============================================
  // useThemeClass TESTS
  // ============================================

  describe('useThemeClass', () => {
    it('returns light class for light theme', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });

      const { result } = renderHook(() =>
        useThemeClass('bg-white text-black', 'bg-black text-white')
      );

      expect(result.current).toBe('bg-white text-black');
    });

    it('returns dark class for dark theme', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });

      const { result } = renderHook(() =>
        useThemeClass('bg-white text-black', 'bg-black text-white')
      );

      expect(result.current).toBe('bg-black text-white');
    });

    it('handles empty strings', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });

      const { result } = renderHook(() => useThemeClass('', 'dark-class'));

      expect(result.current).toBe('');
    });

    it('handles complex class strings', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });

      const lightClass = 'bg-white/50 backdrop-blur-xl border border-white/20 shadow-lg';
      const darkClass = 'bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl';

      const { result } = renderHook(() => useThemeClass(lightClass, darkClass));

      expect(result.current).toBe(darkClass);
    });

    it('updates when theme changes', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });
      const { result, rerender } = renderHook(() =>
        useThemeClass('light-class', 'dark-class')
      );

      expect(result.current).toBe('light-class');

      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
      rerender();

      expect(result.current).toBe('dark-class');
    });
  });
});
