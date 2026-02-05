// src/__tests__/unit/hooks/useLocalStorage.test.ts
/**
 * useLocalStorage Hook Tests
 * ==========================
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns initial value when key not in storage', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));

    const [value] = result.current;
    expect(value).toBe('defaultValue');
  });

  it('returns stored value when key exists', () => {
    // Pre-populate localStorage
    window.localStorage.setItem('existingKey', JSON.stringify('storedValue'));

    const { result } = renderHook(() => useLocalStorage('existingKey', 'defaultValue'));

    const [value] = result.current;
    expect(value).toBe('storedValue');
  });

  it('persists value to localStorage on set', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    act(() => {
      const [, setValue] = result.current;
      setValue('newValue');
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify('newValue'));
    expect(result.current[0]).toBe('newValue');
  });

  it('supports function updater pattern', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      const [, setValue] = result.current;
      setValue((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      const [, setValue] = result.current;
      setValue((prev) => prev + 10);
    });

    expect(result.current[0]).toBe(11);
  });

  it('removes value from localStorage', () => {
    window.localStorage.setItem('removeKey', JSON.stringify('valueToRemove'));

    const { result } = renderHook(() => useLocalStorage('removeKey', 'default'));

    expect(result.current[0]).toBe('valueToRemove');

    act(() => {
      const [, , removeValue] = result.current;
      removeValue();
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('removeKey');
    expect(result.current[0]).toBe('default');
  });

  it('handles JSON parse errors gracefully', () => {
    // Set invalid JSON
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValueOnce('invalid json {{{');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('badKey', 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('dispatches local-storage event on change', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const { result } = renderHook(() => useLocalStorage('eventKey', 'initial'));

    act(() => {
      const [, setValue] = result.current;
      setValue('updated');
    });

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));

    dispatchSpy.mockRestore();
  });

  it('works with complex objects', () => {
    const complexObject = {
      name: 'Test',
      nested: { value: 42 },
      array: [1, 2, 3],
    };

    const { result } = renderHook(() => useLocalStorage('objectKey', complexObject));

    expect(result.current[0]).toEqual(complexObject);

    const newObject = { ...complexObject, name: 'Updated' };

    act(() => {
      const [, setValue] = result.current;
      setValue(newObject);
    });

    expect(result.current[0]).toEqual(newObject);
  });

  it('works with arrays', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('arrayKey', []));

    expect(result.current[0]).toEqual([]);

    act(() => {
      const [, setValue] = result.current;
      setValue(['item1', 'item2']);
    });

    expect(result.current[0]).toEqual(['item1', 'item2']);
  });

  it('works with boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('boolKey', false));

    expect(result.current[0]).toBe(false);

    act(() => {
      const [, setValue] = result.current;
      setValue(true);
    });

    expect(result.current[0]).toBe(true);
  });

  it('works with null values', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('nullKey', null));

    expect(result.current[0]).toBe(null);

    act(() => {
      const [, setValue] = result.current;
      setValue('not null');
    });

    expect(result.current[0]).toBe('not null');
  });

  // Note: Testing cross-tab sync requires simulating storage events
  // which is complex in jsdom. We test the listener setup instead.
  it('sets up storage event listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useLocalStorage('listenerKey', 'value'));

    expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('removes storage event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useLocalStorage('unmountKey', 'value'));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
