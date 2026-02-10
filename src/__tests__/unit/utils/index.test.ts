// src/__tests__/unit/utils/index.test.ts
/**
 * Utils Index Tests
 * =================
 * Tests for utility functions in src/utils/index.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clamp,
  cn,
  copyToClipboard,
  createObjectURL,
  debounce,
  downloadFile,
  formatBytes,
  formatDuration,
  formatRelativeTime,
  generateId,
  getFileExtension,
  isImageFile,
  sleep,
  throttle,
  truncate,
} from '../../../utils';

// ============================================
// formatBytes
// ============================================

describe('formatBytes', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(10240)).toBe('10 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(5242880)).toBe('5 MB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
    expect(formatBytes(2147483648)).toBe('2 GB');
  });

  it('respects decimal places parameter', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB');
    // parseFloat removes trailing zeros, so 1.50 becomes 1.5
    expect(formatBytes(1536, 2)).toBe('1.5 KB');
    expect(formatBytes(1536, 3)).toBe('1.5 KB');
  });
});

// ============================================
// formatDuration
// ============================================

describe('formatDuration', () => {
  it('formats milliseconds for < 1000ms', () => {
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats seconds for < 60000ms', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(30000)).toBe('30.0s');
    expect(formatDuration(59999)).toBe('60.0s');
  });

  it('formats minutes and seconds correctly', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(3600000)).toBe('60m 0s');
  });
});

// ============================================
// formatRelativeTime
// ============================================

describe('formatRelativeTime', () => {
  it('returns "przed chwilą" for < 60 seconds', () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30000);
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('przed chwilą');
  });

  it('returns minutes ago for < 60 minutes', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 min temu');
  });

  it('returns hours ago for < 24 hours', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('3 godz. temu');
  });

  it('returns days ago for < 7 days', () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 86400000);
    expect(formatRelativeTime(twoDaysAgo)).toBe('2 dni temu');
  });

  it('returns formatted date for >= 7 days', () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 86400000);
    const result = formatRelativeTime(tenDaysAgo);
    // Should be a locale date string
    expect(result).toMatch(/\d+/);
  });
});

// ============================================
// generateId
// ============================================

describe('generateId', () => {
  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('uses provided prefix', () => {
    const id = generateId('photo');
    expect(id).toMatch(/^photo-/);
  });

  it('uses default prefix when not provided', () => {
    const id = generateId();
    expect(id).toMatch(/^id-/);
  });

  it('includes timestamp component', () => {
    const before = Date.now();
    const id = generateId('test');
    const after = Date.now();

    const parts = id.split('-');
    const timestamp = parseInt(parts[1], 10);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

// ============================================
// clamp
// ============================================

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('returns min when value is below', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, 0, 10)).toBe(0);
  });

  it('returns max when value is above', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, 0, 10)).toBe(10);
  });

  it('works with negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });
});

// ============================================
// sleep
// ============================================

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after specified time', async () => {
    const promise = sleep(1000);

    vi.advanceTimersByTime(999);
    // Promise should not be resolved yet
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toBe(true);
  });

  it('resolves immediately for 0ms', async () => {
    const promise = sleep(0);
    await vi.advanceTimersByTimeAsync(0);
    await expect(promise).resolves.toBeUndefined();
  });
});

// ============================================
// truncate
// ============================================

describe('truncate', () => {
  it('returns original string if shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('', 5)).toBe('');
  });

  it('returns original string if equal to maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates and adds ellipsis for longer strings', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
    expect(truncate('this is a long string', 10)).toBe('this is...');
  });

  it('handles edge cases', () => {
    expect(truncate('hello', 3)).toBe('...');
    expect(truncate('ab', 5)).toBe('ab');
  });
});

// ============================================
// copyToClipboard
// ============================================

describe('copyToClipboard', () => {
  it('returns true on success', async () => {
    const result = await copyToClipboard('test text');
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
  });

  it('returns false on failure', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Failed'));
    const result = await copyToClipboard('test text');
    expect(result).toBe(false);
  });
});

// ============================================
// isImageFile
// ============================================

describe('isImageFile', () => {
  it('returns true for image MIME types', () => {
    expect(isImageFile(new File([''], 'test.jpg', { type: 'image/jpeg' }))).toBe(true);
    expect(isImageFile(new File([''], 'test.png', { type: 'image/png' }))).toBe(true);
    expect(isImageFile(new File([''], 'test.gif', { type: 'image/gif' }))).toBe(true);
    expect(isImageFile(new File([''], 'test.webp', { type: 'image/webp' }))).toBe(true);
  });

  it('returns false for non-image types', () => {
    expect(isImageFile(new File([''], 'test.txt', { type: 'text/plain' }))).toBe(false);
    expect(isImageFile(new File([''], 'test.pdf', { type: 'application/pdf' }))).toBe(false);
    expect(isImageFile(new File([''], 'test.json', { type: 'application/json' }))).toBe(false);
  });

  it('returns false for empty type', () => {
    expect(isImageFile(new File([''], 'test', { type: '' }))).toBe(false);
  });
});

// ============================================
// getFileExtension
// ============================================

describe('getFileExtension', () => {
  it('extracts extension correctly', () => {
    expect(getFileExtension('photo.jpg')).toBe('jpg');
    expect(getFileExtension('photo.PNG')).toBe('png');
    expect(getFileExtension('document.pdf')).toBe('pdf');
  });

  it('returns empty string for no extension', () => {
    expect(getFileExtension('filename')).toBe('');
    expect(getFileExtension('')).toBe('');
  });

  it('handles multiple dots in filename', () => {
    expect(getFileExtension('photo.backup.jpg')).toBe('jpg');
    expect(getFileExtension('file.name.with.dots.png')).toBe('png');
  });

  it('handles hidden files', () => {
    expect(getFileExtension('.gitignore')).toBe('gitignore');
  });
});

// ============================================
// createObjectURL
// ============================================

describe('createObjectURL', () => {
  it('creates URL and returns revoke function', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const result = createObjectURL(file);

    expect(result.url).toMatch(/^blob:mock-url/);
    expect(typeof result.revoke).toBe('function');
  });

  it('revoke function calls URL.revokeObjectURL', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const result = createObjectURL(file);

    result.revoke();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(result.url);
  });
});

// ============================================
// downloadFile
// ============================================

describe('downloadFile', () => {
  beforeEach(() => {
    // Mock DOM methods
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  it('creates and clicks download link for string data', () => {
    downloadFile('test content', 'test.txt', 'text/plain');

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('handles Blob data', () => {
    const blob = new Blob(['test'], { type: 'text/plain' });
    downloadFile(blob, 'test.txt');

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});

// ============================================
// debounce
// ============================================

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancels previous call on rapid invocation', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments correctly', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

// ============================================
// throttle
// ============================================

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes immediately on first call', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('limits execution frequency', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('passes arguments correctly', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('arg1', 'arg2');
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

// ============================================
// cn (classnames helper)
// ============================================

describe('cn', () => {
  it('joins class names with space', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('class1', false, 'class2')).toBe('class1 class2');
    expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
    expect(cn('class1', null, 'class2')).toBe('class1 class2');
    expect(cn('class1', '', 'class2')).toBe('class1 class2');
  });

  it('handles all falsy values', () => {
    expect(cn(false, undefined, null, '')).toBe('');
  });

  it('handles boolean expressions', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });
});
