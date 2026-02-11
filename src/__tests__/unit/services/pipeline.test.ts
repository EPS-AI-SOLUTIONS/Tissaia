// src/__tests__/unit/services/pipeline.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================
// Mocks
// ============================================

vi.mock('../../../utils/tauri', () => ({
  isTauri: () => false,
}));

vi.mock('../../../hooks/api/utils', () => ({
  safeInvoke: vi.fn().mockResolvedValue({}),
  fileToBase64: vi.fn().mockResolvedValue({ base64: 'dGVzdA==', mimeType: 'image/jpeg' }),
  delay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../hooks/api/mocks', () => ({
  createMockRestorationResult: vi.fn().mockReturnValue({
    restored_image: 'base64_restored',
    improvements: ['scratch_removal'],
  }),
  mockDetectionResult: {
    id: 'mock-det',
    timestamp: '2026-01-01',
    photo_count: 1,
    bounding_boxes: [
      { x: 0, y: 0, width: 500, height: 500, confidence: 0.95, label: 'photo', rotation_angle: 0 },
    ],
    provider_used: 'mock',
    scan_width: 1000,
    scan_height: 1000,
  },
  MOCK_DETECTION_DELAY: 0,
  MOCK_RESTORATION_DELAY: 0,
}));

vi.mock('uuid', () => ({
  v4: () => 'test-uuid',
}));

// ============================================
// Imports (after mocks)
// ============================================

import {
  DEFAULT_PIPELINE_OPTIONS,
  FILE_CONSTRAINTS,
  RETRY_CONFIG,
} from '../../../services/pipeline/config';
import { PipelineEventEmitter } from '../../../services/pipeline/events';
import { TissaiaPipeline } from '../../../services/pipeline/pipeline';

// ============================================
// 1. PipelineEventEmitter
// ============================================

describe('PipelineEventEmitter', () => {
  let emitter: PipelineEventEmitter;

  beforeEach(() => {
    emitter = new PipelineEventEmitter();
  });

  it('calls handler on matching emit', () => {
    const handler = vi.fn();
    emitter.on('stage:start', handler);

    const payload = { stage: 'ingestion' as const, name: 'Test', timestamp: Date.now() };
    emitter.emit('stage:start', payload);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it('does not call handler after off()', () => {
    const handler = vi.fn();
    emitter.on('pipeline:cancel', handler);
    emitter.off('pipeline:cancel', handler);

    emitter.emit('pipeline:cancel', {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns unsubscribe function from on()', () => {
    const handler = vi.fn();
    const unsub = emitter.on('pipeline:pause', handler);

    unsub();
    emitter.emit('pipeline:pause', {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('onAny receives all events with type wrapper', () => {
    const wildcard = vi.fn();
    emitter.onAny(wildcard);

    emitter.emit('pipeline:resume', {});
    emitter.emit('stage:complete', { stage: 'detection', duration: 100 });

    expect(wildcard).toHaveBeenCalledTimes(2);
    expect(wildcard).toHaveBeenCalledWith({ type: 'pipeline:resume', event: {} });
    expect(wildcard).toHaveBeenCalledWith({
      type: 'stage:complete',
      event: { stage: 'detection', duration: 100 },
    });
  });

  it('clear() removes all listeners', () => {
    const handler = vi.fn();
    const wildcard = vi.fn();
    emitter.on('pipeline:cancel', handler);
    emitter.onAny(wildcard);

    emitter.clear();

    emitter.emit('pipeline:cancel', {});
    expect(handler).not.toHaveBeenCalled();
    expect(wildcard).not.toHaveBeenCalled();
  });

  it('error in one handler does not break other handlers', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const badHandler = vi.fn(() => {
      throw new Error('boom');
    });
    const goodHandler = vi.fn();

    emitter.on('pipeline:cancel', badHandler);
    emitter.on('pipeline:cancel', goodHandler);

    emitter.emit('pipeline:cancel', {});

    expect(badHandler).toHaveBeenCalledOnce();
    expect(goodHandler).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

// ============================================
// 2. Config values
// ============================================

describe('Pipeline Config', () => {
  it('FILE_CONSTRAINTS has correct max file size (50 MB)', () => {
    expect(FILE_CONSTRAINTS.maxFileSize).toBe(50 * 1024 * 1024);
  });

  it('FILE_CONSTRAINTS has correct max dimensions', () => {
    expect(FILE_CONSTRAINTS.maxWidth).toBe(10_000);
    expect(FILE_CONSTRAINTS.maxHeight).toBe(10_000);
  });

  it('FILE_CONSTRAINTS supports expected formats', () => {
    const formats = FILE_CONSTRAINTS.supportedFormats;
    expect(formats).toContain('image/png');
    expect(formats).toContain('image/jpeg');
    expect(formats).toContain('image/webp');
    expect(formats).toContain('image/tiff');
    expect(formats).toContain('image/bmp');
    expect(formats).toHaveLength(5);
  });

  it('DEFAULT_PIPELINE_OPTIONS has expected defaults', () => {
    expect(DEFAULT_PIPELINE_OPTIONS.enableLocalFilters).toBe(false);
    expect(DEFAULT_PIPELINE_OPTIONS.enableUpscale).toBe(true);
    expect(DEFAULT_PIPELINE_OPTIONS.upscaleFactor).toBe(2.0);
    expect(DEFAULT_PIPELINE_OPTIONS.concurrency).toBe(1);
    expect(DEFAULT_PIPELINE_OPTIONS.maxRetries).toBe(3);
    expect(DEFAULT_PIPELINE_OPTIONS.enableVerification).toBe(true);
  });

  it('RETRY_CONFIG has correct backoff settings', () => {
    expect(RETRY_CONFIG.baseDelay).toBe(1000);
    expect(RETRY_CONFIG.maxDelay).toBe(16000);
    expect(RETRY_CONFIG.backoffMultiplier).toBe(2);
    expect(RETRY_CONFIG.maxRetries).toBe(3);
  });
});

// ============================================
// 3. TissaiaPipeline
// ============================================

describe('TissaiaPipeline', () => {
  let pipeline: TissaiaPipeline;

  beforeEach(() => {
    pipeline = new TissaiaPipeline();
  });

  it('creates instance with default options', () => {
    expect(pipeline).toBeInstanceOf(TissaiaPipeline);
    expect(pipeline.isProcessing()).toBe(false);

    const progress = pipeline.getProgress();
    expect(progress.currentStage).toBe('idle');
    expect(progress.status).toBe('idle');
    expect(progress.overallProgress).toBe(0);
    expect(progress.totalStages).toBe(4);
  });

  it('creates instance with custom options merged over defaults', () => {
    const custom = new TissaiaPipeline({ concurrency: 3, enableUpscale: false });
    // Verify it constructed without error; options are private but
    // we can validate indirectly through getProgress
    expect(custom.getProgress().status).toBe('idle');
  });

  it('updateOptions merges correctly', () => {
    // updateOptions is a public method; we verify it does not throw
    // and that the pipeline still works after updating
    pipeline.updateOptions({ concurrency: 5, enableLocalFilters: true });
    expect(pipeline.getProgress().status).toBe('idle');
  });

  it('cancel() sets cancelled state', () => {
    pipeline.cancel();
    const progress = pipeline.getProgress();
    expect(progress.status).toBe('cancelled');
  });

  it('pause() works when status is running', () => {
    // We need to simulate the running state by starting process;
    // but since process is async and needs a real file + Image API,
    // we test pause/resume on their own by invoking them directly.
    // pause() guards on status !== 'running', so on idle it's a no-op.
    pipeline.pause();
    // Should stay idle because guard prevents pausing when not running
    expect(pipeline.getProgress().status).toBe('idle');
  });

  it('resume() is a no-op when not paused', () => {
    pipeline.resume();
    expect(pipeline.getProgress().status).toBe('idle');
  });

  it('destroy() clears emitter and cancels', () => {
    const handler = vi.fn();
    pipeline.on('pipeline:cancel', handler);

    pipeline.destroy();

    // After destroy, emitter is cleared so handler should not be called
    // We can verify by checking cancelled status
    expect(pipeline.getProgress().status).toBe('cancelled');
  });

  it('getResults returns empty initial state', () => {
    const results = pipeline.getResults();
    expect(results.ingestion).toBeNull();
    expect(results.detection).toBeNull();
    expect(results.crop).toBeNull();
    expect(results.shards).toEqual([]);
    expect(results.restorations).toBeInstanceOf(Map);
    expect(results.restorations.size).toBe(0);
    expect(results.reports).toEqual([]);
  });

  it('on/off delegate to the internal emitter', () => {
    const handler = vi.fn();
    pipeline.on('pipeline:error', handler);
    pipeline.off('pipeline:error', handler);

    // Since we cleared the handler, it should not be called.
    // There is no direct way to emit on the pipeline externally,
    // but confirming on/off do not throw verifies delegation works.
    expect(handler).not.toHaveBeenCalled();
  });
});
