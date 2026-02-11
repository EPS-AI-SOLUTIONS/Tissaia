// src/utils/tauri.ts
/**
 * Tauri Detection Utilities
 * =========================
 * Detects whether the app is running in Tauri environment.
 * Caches result after first positive detection (WebView2 bridge is persistent once injected).
 */

let cachedResult: boolean | null = null;

/**
 * Check if running in Tauri environment.
 * Re-evaluates until Tauri bridge is detected, then caches the result.
 * WebView2 may inject the __TAURI__ bridge asynchronously after module load.
 */
export function isTauri(): boolean {
  if (cachedResult === true) return true;
  const result = typeof window !== 'undefined' && '__TAURI__' in window;
  if (result) cachedResult = true;
  return result;
}
