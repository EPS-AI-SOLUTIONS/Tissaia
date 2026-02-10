/**
 * useHotkey - Single Hotkey Listener Hook
 * @module hooks/useHotkey
 *
 * Registers a single keyboard shortcut with automatic cleanup.
 * Ported from ClaudeHydra/GeminiHydra cross-pollination.
 */

import { useEffect } from 'react';

interface UseHotkeyOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
}

/**
 * Hook for listening to a single keyboard hotkey
 *
 * Supported formats:
 * - 'ctrl+s', 'ctrl+shift+s'
 * - 'cmd+s' (Mac alternative to ctrl)
 * - 'meta+s' (Windows key)
 * - 'alt+s'
 * - 'shift+s'
 * - Single key: 's'
 *
 * @param hotkey - Hotkey combination string (e.g., 'ctrl+enter', 'meta+n')
 * @param callback - Function to execute when hotkey is pressed
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useHotkey('ctrl+s', () => {
 *   console.log('Save pressed!');
 * }, { preventDefault: true });
 * ```
 */
export const useHotkey = (
  hotkey: string,
  callback: () => void,
  options: UseHotkeyOptions = {},
): void => {
  const { preventDefault = true, stopPropagation = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isHotkeyPressed(event, hotkey)) {
        return;
      }

      if (preventDefault) {
        event.preventDefault();
      }

      if (stopPropagation) {
        event.stopPropagation();
      }

      callback();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hotkey, callback, preventDefault, stopPropagation, enabled]);
};

/**
 * Check if a keyboard event matches the given hotkey combination
 */
export const isHotkeyPressed = (event: KeyboardEvent, hotkey: string): boolean => {
  const parts = hotkey.toLowerCase().split('+');
  const key = parts[parts.length - 1];

  const hasCtrl = parts.includes('ctrl');
  const hasShift = parts.includes('shift');
  const hasAlt = parts.includes('alt');
  const hasMeta = parts.includes('meta') || parts.includes('cmd');

  const ctrlMatch = hasCtrl === event.ctrlKey && hasMeta === event.metaKey;
  const shiftMatch = hasShift === event.shiftKey;
  const altMatch = hasAlt === event.altKey;

  const eventKey = event.key.toLowerCase();

  const keyMap: Record<string, string[]> = {
    enter: ['enter'],
    escape: ['escape'],
    tab: ['tab'],
    delete: ['delete'],
    backspace: ['backspace'],
    arrowup: ['arrowup'],
    arrowdown: ['arrowdown'],
    arrowleft: ['arrowleft'],
    arrowright: ['arrowright'],
    space: [' ', 'space'],
  };

  const validKeys = keyMap[key] || [key];

  return ctrlMatch && shiftMatch && altMatch && validKeys.includes(eventKey);
};

export default useHotkey;
