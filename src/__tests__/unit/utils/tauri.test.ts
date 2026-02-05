// src/__tests__/unit/utils/tauri.test.ts
/**
 * Tauri Utils Tests
 * =================
 * Tests for Tauri detection utilities in src/utils/tauri.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enableTauriMode, disableTauriMode } from '../../setup';

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
      expect(isTauri).toBe(false);
    });

    it('returns true when __TAURI__ exists in window', async () => {
      enableTauriMode();

      // Force module re-evaluation
      vi.resetModules();
      const { isTauri } = await import('../../../utils/tauri');
      expect(isTauri).toBe(true);
    });
  });

  describe('safeInvoke', () => {
    it('returns undefined and logs warning when not in Tauri', async () => {
      disableTauriMode();
      vi.resetModules();

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { safeInvoke } = await import('../../../utils/tauri');

      const result = await safeInvoke('test_command');

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test_command')
      );

      consoleSpy.mockRestore();
    });

    it('calls invoke with command and args when in Tauri', async () => {
      enableTauriMode();
      vi.resetModules();

      // Mock the @tauri-apps/api/core module
      const mockInvoke = vi.fn().mockResolvedValue({ success: true });
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke,
      }));

      const { safeInvoke } = await import('../../../utils/tauri');

      const result = await safeInvoke('test_command', { arg1: 'value1' });

      expect(mockInvoke).toHaveBeenCalledWith('test_command', { arg1: 'value1' });
      expect(result).toEqual({ success: true });
    });

    it('propagates errors from invoke', async () => {
      enableTauriMode();
      vi.resetModules();

      const testError = new Error('Invoke failed');
      const mockInvoke = vi.fn().mockRejectedValue(testError);
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke,
      }));

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { safeInvoke } = await import('../../../utils/tauri');

      // Should rethrow the error
      await expect(safeInvoke('failing_command')).rejects.toThrow('Invoke failed');
      // console.error is called in the catch block before rethrowing
      // The actual behavior depends on implementation - just check it rejects

      consoleSpy.mockRestore();
    });

    it('handles invoke without args', async () => {
      enableTauriMode();
      vi.resetModules();

      const mockInvoke = vi.fn().mockResolvedValue('result');
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke,
      }));

      const { safeInvoke } = await import('../../../utils/tauri');

      const result = await safeInvoke('no_args_command');

      expect(mockInvoke).toHaveBeenCalledWith('no_args_command', undefined);
      expect(result).toBe('result');
    });
  });
});
