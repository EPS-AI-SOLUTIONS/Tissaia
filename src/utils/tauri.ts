// src/utils/tauri.ts
/**
 * Tauri Detection Utilities
 * =========================
 * Detects whether the app is running in Tauri environment.
 */

/**
 * Check if running in Tauri environment.
 * This is a function (not a const) so it re-evaluates every call.
 * WebView2 may inject the __TAURI__ bridge asynchronously after module load.
 */
// Legacy: export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
