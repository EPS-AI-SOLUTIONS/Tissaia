// src/hooks/api/utils.ts
/**
 * API Utilities — v4.0 Web Edition
 * =================================
 * HTTP client functions for communicating with the Axum backend.
 * Replaces Tauri's invoke() with standard fetch().
 */

// Re-export sleep as delay for backward compatibility within API hooks
export { sleep as delay } from '../../utils';

// ============================================
// API CLIENT
// ============================================

/** Backend base URL — defaults to localhost:8080 for local dev */
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8080';

/** Default timeout for API calls (120s — AI operations like restore_image are slow) */
const DEFAULT_TIMEOUT_MS = 120_000;

interface ApiErrorBody {
  error?: string;
}

/**
 * Parse response — throw on non-2xx status codes.
 */
async function handleResponse<T>(response: Response, path: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    const message = (body as ApiErrorBody).error || `HTTP ${response.status} on ${path}`;
    throw new Error(message);
  }
  return (await response.json()) as T;
}

/**
 * GET request to the Axum backend.
 */
export async function apiGet<T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    return handleResponse<T>(response, path);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request to ${path} timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * POST request with JSON body to the Axum backend.
 */
export async function apiPost<T>(
  path: string,
  body: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return handleResponse<T>(response, path);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request to ${path} timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * DELETE request to the Axum backend.
 */
export async function apiDelete<T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    return handleResponse<T>(response, path);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request to ${path} timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================
// FILE UTILITIES
// ============================================

export interface FileBase64Result {
  base64: string;
  mimeType: string;
}

/**
 * Convert a File to base64 string
 */
export function fileToBase64(file: File): Promise<FileBase64Result> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a File to a full data URL string (for previews)
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================
// STORAGE UTILITIES
// ============================================

const STORAGE_PREFIX = 'tissaia-';

export function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(getStorageKey(key));
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}
