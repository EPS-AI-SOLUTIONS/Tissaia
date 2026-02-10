// src/__tests__/setup.ts
/**
 * Vitest Global Setup
 * ===================
 * Mocks and configurations for all tests.
 */
import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';

// ============================================
// MOCK: matchMedia (for theme detection)
// ============================================

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================
// MOCK: localStorage
// ============================================

const localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((key) => {
      delete localStorageStore[key];
    });
  }),
  get length() {
    return Object.keys(localStorageStore).length;
  },
  key: vi.fn((index: number) => Object.keys(localStorageStore)[index] ?? null),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ============================================
// MOCK: sessionStorage
// ============================================

const sessionStorageStore: Record<string, string> = {};

const sessionStorageMock = {
  getItem: vi.fn((key: string) => sessionStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(sessionStorageStore).forEach((key) => {
      delete sessionStorageStore[key];
    });
  }),
  get length() {
    return Object.keys(sessionStorageStore).length;
  },
  key: vi.fn((index: number) => Object.keys(sessionStorageStore)[index] ?? null),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// ============================================
// MOCK: ImageData (for Canvas API tests)
// ============================================

if (typeof global.ImageData === 'undefined') {
  class ImageDataMock {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly colorSpace: PredefinedColorSpace;

    constructor(width: number, height: number);
    constructor(data: Uint8ClampedArray, width: number, height?: number);
    constructor(
      dataOrWidth: Uint8ClampedArray | number,
      widthOrHeight: number,
      heightOrUndefined?: number,
    ) {
      if (typeof dataOrWidth === 'number') {
        // Constructor: ImageData(width, height)
        this.width = dataOrWidth;
        this.height = widthOrHeight;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        // Constructor: ImageData(data, width, height?)
        this.data = dataOrWidth;
        this.width = widthOrHeight;
        this.height = heightOrUndefined ?? Math.floor(dataOrWidth.length / (widthOrHeight * 4));
      }
      this.colorSpace = 'srgb';
    }
  }

  global.ImageData = ImageDataMock as unknown as typeof ImageData;
}

// ============================================
// MOCK: ResizeObserver
// ============================================

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ============================================
// MOCK: IntersectionObserver
// ============================================

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// ============================================
// MOCK: URL.createObjectURL / revokeObjectURL
// ============================================

URL.createObjectURL = vi.fn((_blob: Blob) => `blob:mock-url-${Math.random()}`);
URL.revokeObjectURL = vi.fn();

// ============================================
// MOCK: navigator.clipboard
// ============================================

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
});

// ============================================
// MOCK: window.scrollTo
// ============================================

window.scrollTo = vi.fn();

// ============================================
// MOCK: HTMLElement.scrollIntoView
// ============================================

Element.prototype.scrollIntoView = vi.fn();

// ============================================
// CLEANUP BETWEEN TESTS
// ============================================

beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Clear storage
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Reset Tauri mock state
  delete (window as unknown as Record<string, unknown>).__TAURI__;
});

afterEach(() => {
  // Cleanup any pending timers
  vi.clearAllTimers();
});

// ============================================
// EXPORTS for test utilities
// ============================================

export { localStorageMock, sessionStorageMock };

// Helper to enable Tauri mode in tests
export function enableTauriMode() {
  (window as unknown as Record<string, unknown>).__TAURI__ = {
    convertFileSrc: vi.fn(),
  };
}

// Helper to disable Tauri mode in tests
export function disableTauriMode() {
  delete (window as unknown as Record<string, unknown>).__TAURI__;
}
