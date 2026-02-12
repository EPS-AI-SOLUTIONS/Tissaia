// src/services/pipeline/browser-detect.ts
/**
 * Browser Gemini Detection — v4.0 Web Edition (DEPRECATED)
 * =========================================================
 * In v4.0, all detection goes through the Axum backend via /api/detect.
 * This file is kept as a stub for backward compatibility.
 * @deprecated Will be removed in v5.0. Use apiPost('/api/detect/retry', ...) instead.
 */

export function getBrowserApiKey(): string | null {
  return null;
}

export function setBrowserApiKey(_key: string): void {
  console.warn('[browser-detect] Deprecated in v4.0 Web Edition. Use backend API instead.');
}

export function isBrowserDetectionAvailable(): boolean {
  return false;
}
