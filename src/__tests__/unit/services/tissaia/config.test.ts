// src/__tests__/unit/services/tissaia/config.test.ts
/**
 * Tests for Tissaia Pipeline Configuration
 * =========================================
 * Configuration constants, presets, and kernels tests
 */
import { describe, it, expect } from 'vitest';
import {
  MAX_FILE_SIZE,
  MAX_WIDTH,
  MAX_HEIGHT,
  SUPPORTED_FORMATS,
  KERNELS,
  DETECTION_COLORS,
  CONFIG_PRESETS,
  TISSAIA_CONFIG,
  mergeConfig,
  validateConfig,
} from '../../../../services/tissaia/config';

// ============================================
// CONSTANTS TESTS
// ============================================

describe('Tissaia Config Constants', () => {
  describe('Size Limits', () => {
    it('MAX_FILE_SIZE is 50MB', () => {
      expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    });

    it('MAX_WIDTH is 10000', () => {
      expect(MAX_WIDTH).toBe(10000);
    });

    it('MAX_HEIGHT is 10000', () => {
      expect(MAX_HEIGHT).toBe(10000);
    });
  });

  describe('SUPPORTED_FORMATS', () => {
    it('includes common image formats', () => {
      expect(SUPPORTED_FORMATS).toContain('jpeg');
      expect(SUPPORTED_FORMATS).toContain('png');
      expect(SUPPORTED_FORMATS).toContain('webp');
      expect(SUPPORTED_FORMATS).toContain('jpg');
    });

    it('includes tiff format', () => {
      expect(SUPPORTED_FORMATS).toContain('tiff');
    });

    it('is an array', () => {
      expect(Array.isArray(SUPPORTED_FORMATS)).toBe(true);
    });
  });
});

// ============================================
// KERNELS TESTS
// ============================================

describe('Image Processing Kernels', () => {
  describe('sobelX', () => {
    it('exists', () => {
      expect(KERNELS.sobelX).toBeDefined();
    });

    it('has size 3', () => {
      expect(KERNELS.sobelX.size).toBe(3);
    });

    it('has 9 elements (3x3)', () => {
      expect(KERNELS.sobelX.data.length).toBe(9);
    });

    it('has correct Sobel X values', () => {
      expect(KERNELS.sobelX.data).toEqual([-1, 0, 1, -2, 0, 2, -1, 0, 1]);
    });
  });

  describe('sobelY', () => {
    it('exists', () => {
      expect(KERNELS.sobelY).toBeDefined();
    });

    it('has size 3', () => {
      expect(KERNELS.sobelY.size).toBe(3);
    });

    it('has correct Sobel Y values', () => {
      expect(KERNELS.sobelY.data).toEqual([-1, -2, -1, 0, 0, 0, 1, 2, 1]);
    });
  });

  describe('gaussianBlur3', () => {
    it('exists', () => {
      expect(KERNELS.gaussianBlur3).toBeDefined();
    });

    it('has size 3', () => {
      expect(KERNELS.gaussianBlur3.size).toBe(3);
    });

    it('has divisor 16', () => {
      expect(KERNELS.gaussianBlur3.divisor).toBe(16);
    });

    it('data sums to 16 (before division)', () => {
      const sum = KERNELS.gaussianBlur3.data.reduce((a, b) => a + b, 0);
      expect(sum).toBe(16);
    });
  });

  describe('gaussianBlur5', () => {
    it('exists', () => {
      expect(KERNELS.gaussianBlur5).toBeDefined();
    });

    it('has size 5', () => {
      expect(KERNELS.gaussianBlur5.size).toBe(5);
    });

    it('has 25 elements (5x5)', () => {
      expect(KERNELS.gaussianBlur5.data.length).toBe(25);
    });

    it('has divisor 256', () => {
      expect(KERNELS.gaussianBlur5.divisor).toBe(256);
    });
  });

  describe('sharpen', () => {
    it('exists', () => {
      expect(KERNELS.sharpen).toBeDefined();
    });

    it('has size 3', () => {
      expect(KERNELS.sharpen.size).toBe(3);
    });

    it('has positive center value', () => {
      expect(KERNELS.sharpen.data[4]).toBeGreaterThan(0);
    });

    it('sums to 1 (preserves brightness)', () => {
      const sum = KERNELS.sharpen.data.reduce((a, b) => a + b, 0);
      expect(sum).toBe(1);
    });
  });

  describe('unsharpMask', () => {
    it('exists', () => {
      expect(KERNELS.unsharpMask).toBeDefined();
    });

    it('has size 3', () => {
      expect(KERNELS.unsharpMask.size).toBe(3);
    });

    it('has high positive center value', () => {
      expect(KERNELS.unsharpMask.data[4]).toBeGreaterThan(1);
    });
  });
});

// ============================================
// DETECTION COLORS TESTS
// ============================================

describe('Detection Colors', () => {
  it('has object colors', () => {
    expect(DETECTION_COLORS.object).toBeDefined();
    expect(DETECTION_COLORS.object.text).toBeDefined();
    expect(DETECTION_COLORS.object.image).toBeDefined();
    expect(DETECTION_COLORS.object.signature).toBeDefined();
  });

  it('has damage colors', () => {
    expect(DETECTION_COLORS.damage).toBeDefined();
    expect(DETECTION_COLORS.damage.stain).toBeDefined();
    expect(DETECTION_COLORS.damage.tear).toBeDefined();
    expect(DETECTION_COLORS.damage.scratch).toBeDefined();
  });

  it('has severity colors', () => {
    expect(DETECTION_COLORS.severity).toBeDefined();
    expect(DETECTION_COLORS.severity.low).toBeDefined();
    expect(DETECTION_COLORS.severity.medium).toBeDefined();
    expect(DETECTION_COLORS.severity.high).toBeDefined();
  });

  it('all colors are valid hex format', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;

    Object.values(DETECTION_COLORS.object).forEach((color) => {
      expect(hexRegex.test(color)).toBe(true);
    });

    Object.values(DETECTION_COLORS.damage).forEach((color) => {
      expect(hexRegex.test(color)).toBe(true);
    });

    Object.values(DETECTION_COLORS.severity).forEach((color) => {
      expect(hexRegex.test(color)).toBe(true);
    });
  });
});

// ============================================
// CONFIG PRESETS TESTS
// ============================================

describe('Configuration Presets', () => {
  describe('archival preset', () => {
    it('exists', () => {
      expect(CONFIG_PRESETS.archival).toBeDefined();
    });

    it('has detection config', () => {
      expect(CONFIG_PRESETS.archival.detection).toBeDefined();
    });

    it('has alchemy config', () => {
      expect(CONFIG_PRESETS.archival.alchemy).toBeDefined();
    });

    it('has high output quality', () => {
      expect(CONFIG_PRESETS.archival.alchemy.outputQuality).toBe(100);
    });
  });

  describe('preview preset', () => {
    it('exists', () => {
      expect(CONFIG_PRESETS.preview).toBeDefined();
    });

    it('has lower max shards for faster processing', () => {
      expect(CONFIG_PRESETS.preview.smartCrop.maxShards).toBeLessThan(
        TISSAIA_CONFIG.smartCrop.maxShards
      );
    });
  });

  describe('aggressive preset', () => {
    it('exists', () => {
      expect(CONFIG_PRESETS.aggressive).toBeDefined();
    });

    it('has stronger denoise', () => {
      expect(CONFIG_PRESETS.aggressive.alchemy.denoiseStrength).toBeGreaterThan(
        TISSAIA_CONFIG.alchemy.denoiseStrength
      );
    });

    it('has stronger sharpen', () => {
      expect(CONFIG_PRESETS.aggressive.alchemy.sharpenAmount).toBeGreaterThan(
        TISSAIA_CONFIG.alchemy.sharpenAmount
      );
    });
  });

  describe('gentle preset', () => {
    it('exists', () => {
      expect(CONFIG_PRESETS.gentle).toBeDefined();
    });

    it('has milder denoise', () => {
      expect(CONFIG_PRESETS.gentle.alchemy.denoiseStrength).toBeLessThan(
        TISSAIA_CONFIG.alchemy.denoiseStrength
      );
    });
  });
});

// ============================================
// TISSAIA_CONFIG DEFAULT TESTS
// ============================================

describe('TISSAIA_CONFIG (Default)', () => {
  it('has maxFileSize', () => {
    expect(TISSAIA_CONFIG.maxFileSize).toBe(MAX_FILE_SIZE);
  });

  it('has maxWidth', () => {
    expect(TISSAIA_CONFIG.maxWidth).toBe(MAX_WIDTH);
  });

  it('has maxHeight', () => {
    expect(TISSAIA_CONFIG.maxHeight).toBe(MAX_HEIGHT);
  });

  it('has supportedFormats', () => {
    expect(TISSAIA_CONFIG.supportedFormats).toEqual(SUPPORTED_FORMATS);
  });

  it('has ingestion config', () => {
    expect(TISSAIA_CONFIG.ingestion).toBeDefined();
    expect(TISSAIA_CONFIG.ingestion.normalizeColorSpace).toBeDefined();
  });

  it('has detection config', () => {
    expect(TISSAIA_CONFIG.detection).toBeDefined();
    expect(TISSAIA_CONFIG.detection.edgeThreshold).toBeGreaterThan(0);
  });

  it('has smartCrop config', () => {
    expect(TISSAIA_CONFIG.smartCrop).toBeDefined();
    expect(TISSAIA_CONFIG.smartCrop.strategy).toBeDefined();
  });

  it('has alchemy config', () => {
    expect(TISSAIA_CONFIG.alchemy).toBeDefined();
    expect(TISSAIA_CONFIG.alchemy.denoiseStrength).toBeGreaterThanOrEqual(0);
  });

  it('has pipeline config', () => {
    expect(TISSAIA_CONFIG.pipeline).toBeDefined();
    expect(TISSAIA_CONFIG.pipeline.enableLogging).toBeDefined();
  });
});

// ============================================
// CONFIG FUNCTIONS TESTS
// ============================================

describe('Configuration Functions', () => {
  describe('mergeConfig', () => {
    it('returns full config when no overrides', () => {
      const config = mergeConfig({});

      expect(config.maxFileSize).toBe(TISSAIA_CONFIG.maxFileSize);
      expect(config.ingestion).toBeDefined();
      expect(config.detection).toBeDefined();
      expect(config.smartCrop).toBeDefined();
      expect(config.alchemy).toBeDefined();
    });

    it('merges partial alchemy config', () => {
      const config = mergeConfig({
        alchemy: {
          denoiseStrength: 5.0,
        },
      });

      expect(config.alchemy.denoiseStrength).toBe(5.0);
      expect(config.alchemy.sharpenAmount).toBe(TISSAIA_CONFIG.alchemy.sharpenAmount);
    });

    it('merges partial detection config', () => {
      const config = mergeConfig({
        detection: {
          edgeThreshold: 100,
        },
      });

      expect(config.detection.edgeThreshold).toBe(100);
      expect(config.detection.minObjectArea).toBe(TISSAIA_CONFIG.detection.minObjectArea);
    });

    it('merges partial smartCrop config', () => {
      const config = mergeConfig({
        smartCrop: {
          strategy: 'grid',
          maxShards: 16,
        },
      });

      expect(config.smartCrop.strategy).toBe('grid');
      expect(config.smartCrop.maxShards).toBe(16);
      expect(config.smartCrop.padding).toBe(TISSAIA_CONFIG.smartCrop.padding);
    });

    it('merges top-level and nested config', () => {
      const config = mergeConfig({
        maxFileSize: 100 * 1024 * 1024,
        alchemy: {
          outputQuality: 90,
        },
      });

      expect(config.maxFileSize).toBe(100 * 1024 * 1024);
      expect(config.alchemy.outputQuality).toBe(90);
    });
  });

  describe('validateConfig', () => {
    it('returns valid for default config', () => {
      const result = validateConfig(TISSAIA_CONFIG);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns valid for preset configs', () => {
      Object.values(CONFIG_PRESETS).forEach((preset) => {
        const result = validateConfig(preset);
        expect(result.valid).toBe(true);
      });
    });

    it('catches negative maxFileSize', () => {
      const badConfig = mergeConfig({ maxFileSize: -1 });
      const result = validateConfig(badConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('catches invalid edgeThreshold', () => {
      const badConfig = mergeConfig({
        detection: { edgeThreshold: 300 },
      });
      const result = validateConfig(badConfig);
      expect(result.valid).toBe(false);
    });

    it('catches invalid damageConfidenceThreshold', () => {
      const badConfig = mergeConfig({
        detection: { damageConfidenceThreshold: 1.5 },
      });
      const result = validateConfig(badConfig);
      expect(result.valid).toBe(false);
    });

    it('catches invalid denoiseStrength', () => {
      const badConfig = mergeConfig({
        alchemy: { denoiseStrength: 15 },
      });
      const result = validateConfig(badConfig);
      expect(result.valid).toBe(false);
    });

    it('catches invalid outputQuality', () => {
      const badConfig = mergeConfig({
        alchemy: { outputQuality: 150 },
      });
      const result = validateConfig(badConfig);
      expect(result.valid).toBe(false);
    });
  });
});
