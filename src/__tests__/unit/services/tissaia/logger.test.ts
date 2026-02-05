// src/__tests__/unit/services/tissaia/logger.test.ts
/**
 * Tests for Tissaia Logger
 * ========================
 * Logging system tests
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  logger,
  getTissaiaLogs,
  clearTissaiaLogs,
  setTissaiaLogLevel,
  enableTissaiaLogging,
} from '../../../../services/tissaia/logger';

// ============================================
// MOCK CONSOLE
// ============================================

const originalConsole = {
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

beforeEach(() => {
  console.info = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  console.debug = vi.fn();
  clearTissaiaLogs();
  setTissaiaLogLevel('info');
  enableTissaiaLogging(true);
});

afterEach(() => {
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
});

// ============================================
// LOGGER INSTANCE TESTS
// ============================================

describe('TissaiaLogger', () => {
  describe('info', () => {
    it('logs info messages', () => {
      logger.info('Test message');
      expect(console.info).toHaveBeenCalled();
    });

    it('includes prefix in output', () => {
      logger.info('Test message');
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[Tissaia]');
    });

    it('includes message in output', () => {
      logger.info('Test message');
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('Test message');
    });

    it('stores log entry', () => {
      logger.info('Test message');
      const logs = getTissaiaLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].level).toBe('info');
    });

    it('can include stage number', () => {
      logger.info('Test message', 1);
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('[Stage 1]');
    });
  });

  describe('warn', () => {
    it('logs warning messages', () => {
      logger.warn('Warning message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('stores warn entry', () => {
      logger.warn('Warning message');
      const logs = getTissaiaLogs();
      expect(logs[logs.length - 1].level).toBe('warn');
    });
  });

  describe('error', () => {
    it('logs error messages', () => {
      logger.error('Error message');
      expect(console.error).toHaveBeenCalled();
    });

    it('stores error entry', () => {
      logger.error('Error message');
      const logs = getTissaiaLogs();
      expect(logs[logs.length - 1].level).toBe('error');
    });

    it('can include additional data', () => {
      logger.error('Error occurred', undefined, { code: 500 });
      const logs = getTissaiaLogs();
      expect(logs[logs.length - 1].data).toEqual({ code: 500 });
    });
  });

  describe('debug', () => {
    it('logs debug messages when level is debug', () => {
      setTissaiaLogLevel('debug');
      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });

    it('does not log debug when level is info', () => {
      setTissaiaLogLevel('info');
      logger.debug('Debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('log levels', () => {
    it('error level only logs errors', () => {
      setTissaiaLogLevel('error');

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('warn level logs warn and error', () => {
      setTissaiaLogLevel('warn');

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('info level logs info, warn, and error', () => {
      setTissaiaLogLevel('info');

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('debug level logs everything', () => {
      setTissaiaLogLevel('debug');

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('enable/disable', () => {
    it('does not log when disabled', () => {
      enableTissaiaLogging(false);
      logger.info('Test');
      expect(console.info).not.toHaveBeenCalled();
    });

    it('logs when re-enabled', () => {
      enableTissaiaLogging(false);
      enableTissaiaLogging(true);
      logger.info('Test');
      expect(console.info).toHaveBeenCalled();
    });
  });
});

// ============================================
// GLOBAL LOG FUNCTIONS TESTS
// ============================================

describe('Global Log Functions', () => {
  describe('getTissaiaLogs', () => {
    it('returns empty array initially', () => {
      const logs = getTissaiaLogs();
      expect(logs).toEqual([]);
    });

    it('returns accumulated logs', () => {
      logger.info('First');
      logger.info('Second');
      logger.info('Third');

      const logs = getTissaiaLogs();
      expect(logs.length).toBe(3);
    });

    it('returns logs in chronological order', () => {
      logger.info('First');
      logger.info('Second');

      const logs = getTissaiaLogs();
      expect(logs[0].message).toBe('First');
      expect(logs[1].message).toBe('Second');
    });

    it('returns a copy (not the original array)', () => {
      logger.info('Test');
      const logs1 = getTissaiaLogs();
      const logs2 = getTissaiaLogs();
      expect(logs1).not.toBe(logs2);
    });
  });

  describe('clearTissaiaLogs', () => {
    it('clears all logs', () => {
      logger.info('Test');
      clearTissaiaLogs();
      const logs = getTissaiaLogs();
      expect(logs).toEqual([]);
    });
  });

  describe('setTissaiaLogLevel', () => {
    it('sets global log level to debug', () => {
      setTissaiaLogLevel('debug');
      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });

    it('sets global log level to error', () => {
      setTissaiaLogLevel('error');
      logger.info('Info message');
      expect(console.info).not.toHaveBeenCalled();
    });
  });
});

// ============================================
// LOG ENTRY STRUCTURE TESTS
// ============================================

describe('Log Entry Structure', () => {
  it('has correct fields', () => {
    logger.info('Test message', 2, { extra: 'data' });

    const logs = getTissaiaLogs();
    const entry = logs[0];

    expect(entry).toHaveProperty('timestamp');
    expect(entry).toHaveProperty('level');
    expect(entry).toHaveProperty('message');
    expect(entry).toHaveProperty('stage');
    expect(entry).toHaveProperty('data');
  });

  it('timestamp is a valid number', () => {
    const before = Date.now();
    logger.info('Test');
    const after = Date.now();

    const logs = getTissaiaLogs();
    expect(logs[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(logs[0].timestamp).toBeLessThanOrEqual(after);
  });

  it('level matches log method', () => {
    logger.info('Info');
    logger.warn('Warn');
    logger.error('Error');

    const logs = getTissaiaLogs();
    expect(logs[0].level).toBe('info');
    expect(logs[1].level).toBe('warn');
    expect(logs[2].level).toBe('error');
  });

  it('stage is optional', () => {
    logger.info('Without stage');
    const logs = getTissaiaLogs();
    expect(logs[0].stage).toBeUndefined();
  });

  it('stage is included when provided', () => {
    logger.info('With stage', 3);
    const logs = getTissaiaLogs();
    expect(logs[0].stage).toBe(3);
  });
});

// ============================================
// LOG FILTERING TESTS
// ============================================

describe('Log Filtering', () => {
  beforeEach(() => {
    setTissaiaLogLevel('debug');
    logger.debug('Debug', 1);
    logger.info('Info', 2);
    logger.warn('Warn', 2);
    logger.error('Error', 3);
  });

  it('filters by level', () => {
    const errorLogs = logger.getLogsByLevel('error');
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].message).toBe('Error');
  });

  it('filters by stage', () => {
    const stage2Logs = logger.getLogsByStage(2);
    expect(stage2Logs.length).toBe(2);
  });
});

// ============================================
// LOG PERSISTENCE TESTS
// ============================================

describe('Log Persistence', () => {
  it('respects max log limit (1000 entries)', () => {
    // Add 1100 logs
    for (let i = 0; i < 1100; i++) {
      logger.info(`Log ${i}`);
    }

    const logs = getTissaiaLogs();
    expect(logs.length).toBeLessThanOrEqual(1000);
  });

  it('keeps newest logs when exceeding limit', () => {
    for (let i = 0; i < 1100; i++) {
      logger.info(`Log ${i}`);
    }

    const logs = getTissaiaLogs();
    // Last log should be from the end of the loop
    expect(logs[logs.length - 1].message).toBe('Log 1099');
  });
});

// ============================================
// EXPORT TESTS
// ============================================

describe('Log Export', () => {
  it('exports logs as JSON string', () => {
    logger.info('Test 1');
    logger.info('Test 2');

    const exported = logger.exportLogs();
    expect(typeof exported).toBe('string');

    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
  });
});
