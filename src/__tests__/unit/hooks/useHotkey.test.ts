// src/__tests__/unit/hooks/useHotkey.test.ts
/**
 * useHotkey Hook Tests
 * ====================
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isHotkeyPressed, useHotkey } from '../../../hooks/useHotkey';

// Helper to create keyboard events
function createKeyboardEvent(
  key: string,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {},
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

describe('useHotkey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers keydown listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const callback = vi.fn();

    renderHook(() => useHotkey('ctrl+s', callback));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('removes listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const callback = vi.fn();

    const { unmount } = renderHook(() => useHotkey('ctrl+s', callback));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('calls callback on matching hotkey', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('ctrl+s', callback));

    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not call callback on non-matching hotkey', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('ctrl+s', callback));

    // Different key
    window.dispatchEvent(createKeyboardEvent('a', { ctrlKey: true }));
    // Missing modifier
    window.dispatchEvent(createKeyboardEvent('s'));

    expect(callback).not.toHaveBeenCalled();
  });

  it('handles ctrl+key combinations', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('ctrl+enter', callback));

    window.dispatchEvent(createKeyboardEvent('Enter', { ctrlKey: true }));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('handles shift+key combinations', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('shift+a', callback));

    window.dispatchEvent(createKeyboardEvent('a', { shiftKey: true }));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('handles alt+key combinations', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('alt+f', callback));

    window.dispatchEvent(createKeyboardEvent('f', { altKey: true }));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('handles meta/cmd+key combinations', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('meta+n', callback));

    window.dispatchEvent(createKeyboardEvent('n', { metaKey: true }));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('handles cmd as alias for meta', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('cmd+n', callback));

    window.dispatchEvent(createKeyboardEvent('n', { metaKey: true }));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('handles multiple modifiers', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('ctrl+shift+s', callback));

    // Both modifiers
    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true, shiftKey: true }));
    expect(callback).toHaveBeenCalledTimes(1);

    // Missing one modifier - should not trigger
    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('prevents default when configured', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('ctrl+s', callback, { preventDefault: true }));

    const event = createKeyboardEvent('s', { ctrlKey: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does not prevent default when disabled', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('ctrl+s', callback, { preventDefault: false }));

    const event = createKeyboardEvent('s', { ctrlKey: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('stops propagation when configured', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('ctrl+s', callback, { stopPropagation: true }));

    const event = createKeyboardEvent('s', { ctrlKey: true });
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    window.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('does not trigger when disabled', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('ctrl+s', callback, { enabled: false }));

    window.dispatchEvent(createKeyboardEvent('s', { ctrlKey: true }));

    expect(callback).not.toHaveBeenCalled();
  });

  it('handles simple key without modifiers', () => {
    const callback = vi.fn();

    renderHook(() => useHotkey('escape', callback));

    window.dispatchEvent(createKeyboardEvent('Escape'));

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('isHotkeyPressed', () => {
  it('matches simple key', () => {
    const event = createKeyboardEvent('a');
    expect(isHotkeyPressed(event, 'a')).toBe(true);
    expect(isHotkeyPressed(event, 'b')).toBe(false);
  });

  it('matches ctrl modifier', () => {
    const event = createKeyboardEvent('s', { ctrlKey: true });
    expect(isHotkeyPressed(event, 'ctrl+s')).toBe(true);
    expect(isHotkeyPressed(event, 's')).toBe(false);
  });

  it('matches shift modifier', () => {
    const event = createKeyboardEvent('a', { shiftKey: true });
    expect(isHotkeyPressed(event, 'shift+a')).toBe(true);
    expect(isHotkeyPressed(event, 'a')).toBe(false);
  });

  it('matches alt modifier', () => {
    const event = createKeyboardEvent('f', { altKey: true });
    expect(isHotkeyPressed(event, 'alt+f')).toBe(true);
    expect(isHotkeyPressed(event, 'f')).toBe(false);
  });

  it('matches meta modifier', () => {
    const event = createKeyboardEvent('n', { metaKey: true });
    expect(isHotkeyPressed(event, 'meta+n')).toBe(true);
    expect(isHotkeyPressed(event, 'cmd+n')).toBe(true);
    expect(isHotkeyPressed(event, 'n')).toBe(false);
  });

  it('matches special keys', () => {
    expect(isHotkeyPressed(createKeyboardEvent('Enter'), 'enter')).toBe(true);
    expect(isHotkeyPressed(createKeyboardEvent('Escape'), 'escape')).toBe(true);
    expect(isHotkeyPressed(createKeyboardEvent('Tab'), 'tab')).toBe(true);
    expect(isHotkeyPressed(createKeyboardEvent('Backspace'), 'backspace')).toBe(true);
    expect(isHotkeyPressed(createKeyboardEvent('Delete'), 'delete')).toBe(true);
  });

  it('handles space key alias', () => {
    const event = createKeyboardEvent(' ');
    expect(isHotkeyPressed(event, 'space')).toBe(true);
  });

  it('is case insensitive', () => {
    const event = createKeyboardEvent('s', { ctrlKey: true });
    expect(isHotkeyPressed(event, 'CTRL+S')).toBe(true);
    expect(isHotkeyPressed(event, 'Ctrl+S')).toBe(true);
    expect(isHotkeyPressed(event, 'ctrl+s')).toBe(true);
  });

  it('handles arrow keys', () => {
    expect(isHotkeyPressed(createKeyboardEvent('ArrowUp'), 'arrowup')).toBe(true);
    expect(isHotkeyPressed(createKeyboardEvent('ArrowDown'), 'arrowdown')).toBe(true);
    expect(isHotkeyPressed(createKeyboardEvent('ArrowLeft'), 'arrowleft')).toBe(true);
    expect(isHotkeyPressed(createKeyboardEvent('ArrowRight'), 'arrowright')).toBe(true);
  });
});
