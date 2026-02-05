// src/utils/tauri.ts
/**
 * Tauri Detection Utilities
 * =========================
 * Detects whether the app is running in Tauri environment.
 */

/**
 * Check if running in Tauri environment
 */
export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

/**
 * Safe invoke wrapper that returns undefined when not in Tauri
 */
export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T | undefined> {
  if (!isTauri) {
    console.warn(`[Tauri] Command "${command}" skipped - not running in Tauri`);
    return undefined;
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<T>(command, args);
  } catch (error) {
    console.error(`[Tauri] Failed to invoke "${command}":`, error);
    throw error;
  }
}
