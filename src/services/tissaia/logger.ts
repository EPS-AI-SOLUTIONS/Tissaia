/**
 * Tissaia Forensic Restoration Engine - Logger
 * ============================================
 * Logging system with levels and persistence.
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  stage?: number;
  message: string;
  data?: unknown;
}

// ============================================
// LOGGER CLASS
// ============================================

class TissaiaLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private level: LogLevel = 'info';
  private enabled = true;
  private prefix = '[Tissaia]';

  private levelPriority: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.enabled && this.levelPriority[level] <= this.levelPriority[this.level];
  }

  private addEntry(level: LogLevel, message: string, stage?: number, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      stage,
      message,
      data,
    };

    this.logs.push(entry);

    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private formatMessage(level: LogLevel, message: string, stage?: number): string {
    const stageStr = stage ? ` [Stage ${stage}]` : '';
    return `${this.prefix}${stageStr} ${message}`;
  }

  error(message: string, stage?: number, data?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, stage), data ?? '');
      this.addEntry('error', message, stage, data);
    }
  }

  warn(message: string, stage?: number, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, stage), data ?? '');
      this.addEntry('warn', message, stage, data);
    }
  }

  info(message: string, stage?: number, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, stage), data ?? '');
      this.addEntry('info', message, stage, data);
    }
  }

  debug(message: string, stage?: number, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, stage), data ?? '');
      this.addEntry('debug', message, stage, data);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  getLogsByStage(stage: number): LogEntry[] {
    return this.logs.filter((log) => log.stage === stage);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const logger = new TissaiaLogger();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export function getTissaiaLogs(): LogEntry[] {
  return logger.getLogs();
}

export function clearTissaiaLogs(): void {
  logger.clearLogs();
}

export function setTissaiaLogLevel(level: LogLevel): void {
  logger.setLevel(level);
}

export function enableTissaiaLogging(enabled: boolean): void {
  logger.setEnabled(enabled);
}

export default logger;
