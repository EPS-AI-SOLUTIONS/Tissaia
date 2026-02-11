// src/__tests__/unit/utils/tauri.test.ts
/**
 * Tauri Utils Tests
 * =================
 * Tests for Tauri detection utilities in src/utils/tauri.ts
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { disableTauriMode, enableTauriMode } from '../../setup';

// We need to test the module with different window states,
// so we'll use dynamic imports

describe('tauri utils', () => {
  beforeEach(() => {
    // Reset modules before each test
    vi.resetModules();
    disableTauriMode();
  });

  describe('isTauri', () => {
    it('returns false when __TAURI__ does not exist in window', async () => {
      disableTauriMode();

      const { isTauri } = await import('../../../utils/tauri');
      expect(isTauri()).toBe(false);
    });

    it('returns true when __TAURI__ exists in window', async () => {
      enableTauriMode();

      // Force module re-evaluation
      vi.resetModules();
      const { isTauri } = await import('../../../utils/tauri');
      expect(isTauri()).toBe(true);
    });

    it('re-evaluates dynamically when __TAURI__ is added after load', async () => {
      disableTauriMode();

      const { isTauri } = await import('../../../utils/tauri');
      expect(isTauri()).toBe(false);

      // Simulate WebView2 injecting __TAURI__ asynchronously
      enableTauriMode();
      expect(isTauri()).toBe(true);

      // Once cached as true, result stays true (WebView2 bridge is persistent)
      disableTauriMode();
      expect(isTauri()).toBe(true);
    });
  });
});
