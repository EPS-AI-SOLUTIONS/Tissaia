// src/hooks/api/utils.ts
/**
 * API Utilities
 * =============
 * Shared utility functions for API hooks.
 */
import { toast } from 'sonner';
import { isTauri } from '../../utils/tauri';

// Re-export sleep as delay for backward compatibility within API hooks
export { sleep as delay } from '../../utils';

// ============================================
// BROWSER MODE WARNING
// ============================================

let browserModeWarningShown = false;

export function showBrowserModeWarning(): void {
  if (!browserModeWarningShown) {
    browserModeWarningShown = true;
    toast('Tryb przeglądarkowy - niektóre funkcje wymagają aplikacji Tauri', {
      icon: '⚠️',
      duration: 5000,
    });
  }
}

export function resetBrowserModeWarning(): void {
  browserModeWarningShown = false;
}

// ============================================
// SAFE INVOKE
// ============================================

/**
 * Safe invoke wrapper - throws when not in Tauri, calls Tauri command otherwise.
 * This is the canonical version used by all API hooks.
 */
export async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    showBrowserModeWarning();
    throw new Error(`Tauri is required for "${command}" - running in browser mode`);
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
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
