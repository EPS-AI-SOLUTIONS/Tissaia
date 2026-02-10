// src/__tests__/unit/hooks/useThemeClass.test.ts
/**
 * Tests for useGlassPanel hook
 * =============================
 * Tests for glass panel theming hook.
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGlassPanel } from '../../../hooks/useThemeClass';

// Mock the ThemeContext
const mockUseTheme = vi.fn();
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('useGlassPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
