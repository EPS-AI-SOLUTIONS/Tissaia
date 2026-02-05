// src/__tests__/unit/hooks/useKeyboardShortcuts.test.ts
/**
 * useKeyboardShortcuts Hook Tests
 * ================================
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';

// Helper to create keyboard events
function createKeyboardEvent(
  key: string,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false,
    bubbles: true,
  });
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles multiple shortcuts', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        'ctrl+s': callback1,
        'ctrl+n': callback2,
        'escape': callback3,
      })
    );

    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(callback1).toHaveBeenCalledTimes(1);

    window.dispatchEvent(createKeyboardEvent('n', { ctrlKey: true }));
    expect(callback2).toHaveBeenCalledTimes(1);

    window.dispatchEvent(createKeyboardEvent('Escape'));
    expect(callback3).toHaveBeenCalledTimes(1);
  });

  it('executes correct callback for matching shortcut', () => {
    const saveCallback = vi.fn();
    const newCallback = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        'ctrl+s': saveCallback,
        'ctrl+n': newCallback,
      })
    );

    // Trigger ctrl+s
    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));

    expect(saveCallback).toHaveBeenCalledTimes(1);
    expect(newCallback).not.toHaveBeenCalled();
  });

  it('allows dynamic registration', () => {
    const initialCallback = vi.fn();
    const dynamicCallback = vi.fn();

    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        'ctrl+s': initialCallback,
      })
    );

    // Register new shortcut
    act(() => {
      result.current.registerShortcut('ctrl+d', dynamicCallback);
    });

    // Trigger the new shortcut
    window.dispatchEvent(createKeyboardEvent('d', { ctrlKey: true }));

    expect(dynamicCallback).toHaveBeenCalledTimes(1);
  });

  it('allows unregistration', () => {
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useKeyboardShortcuts({
        'ctrl+s': callback,
      })
    );

    // Trigger shortcut - should work
    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(callback).toHaveBeenCalledTimes(1);

    // Unregister
    act(() => {
      result.current.unregisterShortcut('ctrl+s');
    });

    // Trigger again - should not work
    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('stops at first matching shortcut', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts({
        'ctrl+s': callback1,
        'ctrl+shift+s': callback2,
      })
    );

    // Trigger ctrl+s (should only match the first)
    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));

    // Only the matching one should be called
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();
  });

  it('respects enabled option', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ enabled }) =>
        useKeyboardShortcuts(
          { 'ctrl+s': callback },
          { enabled }
        ),
      { initialProps: { enabled: true } }
    );

    // Trigger while enabled
    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(callback).toHaveBeenCalledTimes(1);

    // Disable
    rerender({ enabled: false });

    // Trigger while disabled
    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it('sets up event listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useKeyboardShortcuts({ 'ctrl+s': vi.fn() }));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('removes event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardShortcuts({ 'ctrl+s': vi.fn() }));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('prevents default when configured', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts(
        { 'ctrl+s': callback },
        { preventDefault: true }
      )
    );

    const event = createKeyboardEvent('s', { ctrlKey: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('stops propagation when configured', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts(
        { 'ctrl+s': callback },
        { stopPropagation: true }
      )
    );

    const event = createKeyboardEvent('s', { ctrlKey: true });
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    window.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('handles empty shortcuts object', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useKeyboardShortcuts({}));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    // Should not throw when triggering keys
    expect(() => {
      window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    }).not.toThrow();

    addEventListenerSpy.mockRestore();
  });

  it('updates shortcuts when props change', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(
      ({ shortcuts }) => useKeyboardShortcuts(shortcuts),
      { initialProps: { shortcuts: { 'ctrl+s': callback1 } } }
    );

    // Trigger with initial shortcuts
    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(callback1).toHaveBeenCalledTimes(1);

    // Update shortcuts
    rerender({ shortcuts: { 'ctrl+s': callback2 } });

    // Trigger with new shortcuts
    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
