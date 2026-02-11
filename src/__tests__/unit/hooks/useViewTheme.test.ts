// src/__tests__/unit/hooks/useViewTheme.test.ts
/**
 * Tests for useViewTheme hook
 * ============================
 * Tests for the central view theme configuration hook.
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useViewTheme, type ViewTheme } from '../../../hooks/useViewTheme';

// Mock the ThemeContext
const mockUseTheme = vi.fn();
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('useViewTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // DARK THEME TESTS
  // ============================================

  describe('dark theme', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
    });

    it('returns isLight as false', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.isLight).toBe(false);
    });

    it('returns dark container styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.container).toContain('bg-black/20');
      expect(result.current.containerInner).toContain('bg-black/30');
    });

    it('returns dark glass panel styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.glassPanel).toContain('bg-black/40');
      expect(result.current.glassPanel).toContain('backdrop-blur-xl');
      expect(result.current.glassPanelHover).toContain('hover:bg-black/50');
    });

    it('returns dark header styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.header).toContain('bg-black/30');
      expect(result.current.headerTitle).toContain('text-white');
      expect(result.current.headerIcon).toContain('text-white');
    });

    it('returns dark typography styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.title).toBe('text-white');
      expect(result.current.text).toContain('text-white');
      expect(result.current.textMuted).toContain('text-white/50');
      expect(result.current.textAccent).toContain('text-white');
    });

    it('returns dark button styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.btnPrimary).toContain('text-white');
      expect(result.current.btnSecondary).toContain('text-white/80');
      expect(result.current.btnDanger).toContain('text-red-400');
      expect(result.current.btnGhost).toContain('text-white/50');
    });

    it('returns dark input styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.input).toContain('bg-black/30');
      expect(result.current.input).toContain('text-white');
      expect(result.current.inputIcon).toContain('text-white/40');
    });

    it('returns dark card styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.card).toContain('bg-black/40');
      expect(result.current.cardHover).toContain('hover:border-white/20');
      expect(result.current.listItem).toContain('bg-black/30');
    });

    it('returns dark badge styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.badge).toContain('bg-white/5');
      expect(result.current.badgeAccent).toContain('bg-white/10');
    });

    it('returns dark accent colors', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.accentBg).toContain('bg-white/10');
      expect(result.current.accentText).toContain('text-white');
      expect(result.current.accentBorder).toContain('border-white/20');
    });

    it('returns dark icon colors', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.iconDefault).toContain('text-white/70');
      expect(result.current.iconAccent).toContain('text-white');
      expect(result.current.iconMuted).toContain('text-white/40');
    });

    it('returns dark special states', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.empty).toContain('text-white/30');
      expect(result.current.loading).toContain('text-white');
      expect(result.current.error).toContain('text-red-400');
    });

    it('returns dark dropdown styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.dropdown).toContain('bg-black/95');
      expect(result.current.dropdownItem).toContain('text-white/80');
    });
  });

  // ============================================
  // LIGHT THEME TESTS
  // ============================================

  describe('light theme', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });
    });

    it('returns isLight as true', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.isLight).toBe(true);
    });

    it('returns light container styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.container).toContain('bg-[rgba(255,255,255,0.4)]');
      expect(result.current.containerInner).toContain('bg-white/30');
    });

    it('returns light glass panel styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.glassPanel).toContain('bg-white/40');
      expect(result.current.glassPanelHover).toContain('hover:bg-white/50');
      expect(result.current.glassPanelHover).toContain('hover:border-emerald-500/30');
    });

    it('returns light header styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.header).toContain('bg-white/30');
      expect(result.current.headerTitle).toContain('text-black');
      expect(result.current.headerIcon).toContain('text-emerald-600');
    });

    it('returns light typography styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.title).toBe('text-black');
      expect(result.current.text).toContain('text-black');
      expect(result.current.textMuted).toContain('text-gray-500');
      expect(result.current.textAccent).toContain('text-emerald-600');
    });

    it('returns light button styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.btnPrimary).toContain('text-emerald-700');
      expect(result.current.btnSecondary).toContain('text-gray-700');
      expect(result.current.btnDanger).toContain('text-red-600');
      expect(result.current.btnGhost).toContain('text-gray-700');
    });

    it('returns light input styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.input).toContain('bg-white/50');
      expect(result.current.input).toContain('text-black');
      expect(result.current.inputIcon).toContain('text-gray-400');
    });

    it('returns light card styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.card).toContain('bg-white/40');
      expect(result.current.cardHover).toContain('hover:border-emerald-500/30');
    });

    it('returns light accent colors', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.accentBg).toContain('bg-emerald-500/10');
      expect(result.current.accentText).toContain('text-emerald-600');
      expect(result.current.accentBorder).toContain('border-emerald-500/30');
    });

    it('returns light special states', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.empty).toContain('text-gray-400');
      expect(result.current.loading).toContain('text-emerald-600');
      expect(result.current.error).toContain('text-red-600');
    });

    it('returns light dropdown styles', () => {
      const { result } = renderHook(() => useViewTheme());
      expect(result.current.dropdown).toContain('bg-white/95');
      expect(result.current.dropdownItem).toContain('text-black');
    });
  });

  // ============================================
  // MEMOIZATION TESTS
  // ============================================

  describe('memoization', () => {
    it('returns same object reference when theme does not change', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
      const { result, rerender } = renderHook(() => useViewTheme());

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it('returns new object when theme changes', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
      const { result, rerender } = renderHook(() => useViewTheme());

      const darkTheme = result.current;

      mockUseTheme.mockReturnValue({ resolvedTheme: 'light' });
      rerender();

      const lightTheme = result.current;

      expect(darkTheme).not.toBe(lightTheme);
      expect(darkTheme.isLight).toBe(false);
      expect(lightTheme.isLight).toBe(true);
    });
  });

  // ============================================
  // COMPLETE INTERFACE TESTS
  // ============================================

  describe('interface completeness', () => {
    it('returns all required ViewTheme properties', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
      const { result } = renderHook(() => useViewTheme());

      // Check all interface properties exist
      const theme = result.current;
      const requiredKeys: (keyof ViewTheme)[] = [
        'isLight',
        'container',
        'containerInner',
        'glassPanel',
        'glassPanelHover',
        'header',
        'headerTitle',
        'headerSubtitle',
        'headerIcon',
        'title',
        'subtitle',
        'text',
        'textMuted',
        'textAccent',
        'input',
        'inputIcon',
        'btnPrimary',
        'btnSecondary',
        'btnDanger',
        'btnGhost',
        'card',
        'cardHover',
        'listItem',
        'listItemHover',
        'badge',
        'badgeAccent',
        'border',
        'divider',
        'scrollbar',
        'empty',
        'loading',
        'error',
        'dropdown',
        'dropdownItem',
        'accentBg',
        'accentText',
        'accentBorder',
        'iconDefault',
        'iconAccent',
        'iconMuted',
      ];

      requiredKeys.forEach((key) => {
        expect(theme[key]).toBeDefined();
      });
    });

    it('all string properties are non-empty', () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: 'dark' });
      const { result } = renderHook(() => useViewTheme());

      const theme = result.current;
      Object.entries(theme).forEach(([_key, value]) => {
        if (typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
