// src/__tests__/unit/services/tissaia/types.test.ts
/**
 * Tests for Tissaia Pipeline Types
 * =================================
 * Type structure validation tests
 */
import { describe, it, expect } from 'vitest';
import type {
  Rectangle,
  Point,
  Size,
  ImageMetadata,
  PreparedData,
  SupportedFormat,
  ObjectType,
  DamageType,
  DamageSeverity,
  DetectedObject,
  DamageRegion,
  CutRegion,
  CutMap,
  CroppedShard,
  ShardContext,
  SmartCropResult,
  CropStrategy,
  QualityScore,
  RestoredImage,
  DetectionResult,
} from '../../../../services/tissaia/types';

// ============================================
// BASIC TYPES TESTS
// ============================================

describe('Basic Types', () => {
  describe('Rectangle', () => {
    it('has correct shape', () => {
      const rect: Rectangle = {
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      };

      expect(rect.x).toBe(10);
      expect(rect.y).toBe(20);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(50);
    });
  });

  describe('Point', () => {
    it('has x and y coordinates', () => {
      const point: Point = { x: 50, y: 75 };

      expect(point.x).toBe(50);
      expect(point.y).toBe(75);
    });
  });

  describe('Size', () => {
    it('has width and height', () => {
      const size: Size = { width: 1920, height: 1080 };

      expect(size.width).toBe(1920);
      expect(size.height).toBe(1080);
    });
  });
});

// ============================================
// STAGE 1: INGESTION TYPES
// ============================================

describe('Stage 1: Ingestion Types', () => {
  describe('SupportedFormat', () => {
    it('includes all supported formats', () => {
      const formats: SupportedFormat[] = ['png', 'jpg', 'jpeg', 'tiff', 'bmp', 'webp'];
      expect(formats).toHaveLength(6);
    });
  });

  describe('ImageMetadata', () => {
    it('has required fields', () => {
      const metadata: ImageMetadata = {
        originalFormat: 'image/jpeg',
        fileSize: 102400,
        colorSpace: 'sRGB',
        bitDepth: 8,
        hasAlpha: false,
      };

      expect(metadata.originalFormat).toBe('image/jpeg');
      expect(metadata.fileSize).toBe(102400);
      expect(metadata.colorSpace).toBe('sRGB');
      expect(metadata.bitDepth).toBe(8);
      expect(metadata.hasAlpha).toBe(false);
    });

    it('supports optional exif data', () => {
      const metadata: ImageMetadata = {
        originalFormat: 'image/jpeg',
        fileSize: 102400,
        colorSpace: 'sRGB',
        bitDepth: 8,
        hasAlpha: false,
        exif: {
          make: 'Canon',
          model: 'EOS 5D',
        },
      };

      expect(metadata.exif?.make).toBe('Canon');
    });
  });

  describe('PreparedData', () => {
    it('has correct structure', () => {
      const mockImageData = new ImageData(100, 100);
      const prepared: PreparedData = {
        buffer: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
        channels: 4,
        metadata: {
          originalFormat: 'image/png',
          fileSize: 5000,
          colorSpace: 'sRGB',
          bitDepth: 8,
          hasAlpha: true,
        },
        imageData: mockImageData,
      };

      expect(prepared.width).toBe(100);
      expect(prepared.height).toBe(100);
      expect(prepared.channels).toBe(4);
      expect(prepared.buffer.length).toBe(40000);
    });
  });
});

// ============================================
// STAGE 2: DETECTION TYPES
// ============================================

describe('Stage 2: Detection Types', () => {
  describe('ObjectType', () => {
    it('includes all object types', () => {
      const types: ObjectType[] = [
        'text',
        'image',
        'signature',
        'stamp',
        'barcode',
        'face',
        'unknown',
      ];
      expect(types).toHaveLength(7);
    });
  });

  describe('DamageType', () => {
    it('includes all damage types', () => {
      const types: DamageType[] = [
        'stain',
        'tear',
        'fold',
        'fade',
        'noise',
        'artifact',
        'scratch',
      ];
      expect(types).toHaveLength(7);
    });
  });

  describe('DamageSeverity', () => {
    it('includes all severity levels', () => {
      const severities: DamageSeverity[] = ['low', 'medium', 'high'];
      expect(severities).toHaveLength(3);
    });
  });

  describe('DetectedObject', () => {
    it('has correct structure', () => {
      const obj: DetectedObject = {
        id: 'obj-1',
        type: 'text',
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        confidence: 0.95,
        priority: 1,
      };

      expect(obj.id).toBe('obj-1');
      expect(obj.type).toBe('text');
      expect(obj.confidence).toBe(0.95);
      expect(obj.priority).toBe(1);
    });

    it('supports optional features', () => {
      const obj: DetectedObject = {
        id: 'obj-2',
        type: 'face',
        bounds: { x: 50, y: 50, width: 80, height: 100 },
        confidence: 0.9,
        priority: 2,
        features: {
          landmarks: [{ x: 60, y: 70 }],
        },
      };

      expect(obj.features?.landmarks).toBeDefined();
    });
  });

  describe('DamageRegion', () => {
    it('has correct structure', () => {
      const damage: DamageRegion = {
        id: 'dmg-1',
        type: 'scratch',
        bounds: { x: 30, y: 30, width: 10, height: 150 },
        severity: 'medium',
        mask: new Uint8ClampedArray(1500),
        area: 1500,
        confidence: 0.85,
      };

      expect(damage.type).toBe('scratch');
      expect(damage.severity).toBe('medium');
      expect(damage.confidence).toBe(0.85);
    });
  });

  describe('CutRegion', () => {
    it('has correct structure', () => {
      const region: CutRegion = {
        id: 'cut-1',
        bounds: { x: 0, y: 0, width: 500, height: 500 },
        priority: 1,
        containsObjects: ['obj-1', 'obj-2'],
        containsDamage: ['dmg-1'],
      };

      expect(region.containsObjects).toHaveLength(2);
      expect(region.containsDamage).toHaveLength(1);
    });
  });

  describe('CutMap', () => {
    it('has regions and grid', () => {
      const cutMap: CutMap = {
        regions: [],
        grid: [[1, 0], [0, 1]],
        visualization: new ImageData(100, 100),
      };

      expect(cutMap.regions).toBeDefined();
      expect(cutMap.grid).toHaveLength(2);
      expect(cutMap.visualization).toBeInstanceOf(ImageData);
    });
  });

  describe('DetectionResult', () => {
    it('combines all detection outputs', () => {
      const result: DetectionResult = {
        objects: [
          {
            id: 'obj-1',
            type: 'text',
            bounds: { x: 10, y: 10, width: 100, height: 50 },
            confidence: 0.95,
            priority: 1,
          },
        ],
        damages: [
          {
            id: 'dmg-1',
            type: 'scratch',
            bounds: { x: 30, y: 30, width: 10, height: 150 },
            severity: 'medium',
            mask: new Uint8ClampedArray(1500),
            area: 1500,
            confidence: 0.85,
          },
        ],
        cutMap: {
          regions: [],
          grid: [[1]],
          visualization: new ImageData(100, 100),
        },
        visualization: new ImageData(100, 100),
        stats: {
          totalObjects: 1,
          totalDamageRegions: 1,
          damagePercentage: 5,
          dominantDamageType: 'scratch',
        },
      };

      expect(result.objects).toHaveLength(1);
      expect(result.damages).toHaveLength(1);
      expect(result.cutMap).toBeDefined();
      expect(result.stats.totalObjects).toBe(1);
    });
  });
});

// ============================================
// STAGE 3: SMARTCROP TYPES
// ============================================

describe('Stage 3: SmartCrop Types', () => {
  describe('CropStrategy', () => {
    it('includes all strategies', () => {
      const strategies: CropStrategy[] = [
        'content-aware',
        'damage-aware',
        'grid',
        'adaptive',
      ];
      expect(strategies).toHaveLength(4);
    });
  });

  describe('ShardContext', () => {
    it('has context information', () => {
      const context: ShardContext = {
        containsText: true,
        containsDamage: false,
        damageTypes: ['scratch'],
        objectTypes: ['text'],
        neighbors: ['shard-0', 'shard-2'],
        originalPosition: { x: 0, y: 0, width: 100, height: 100 },
      };

      expect(context.containsText).toBe(true);
      expect(context.damageTypes).toContain('scratch');
      expect(context.neighbors).toHaveLength(2);
    });
  });

  describe('CroppedShard', () => {
    it('has correct structure', () => {
      const shard: CroppedShard = {
        id: 'shard-1',
        data: new ImageData(250, 250),
        bounds: { x: 0, y: 0, width: 250, height: 250 },
        priority: 1,
        context: {
          containsText: false,
          containsDamage: true,
          damageTypes: [],
          objectTypes: [],
          neighbors: [],
          originalPosition: { x: 0, y: 0, width: 250, height: 250 },
        },
      };

      expect(shard.id).toBe('shard-1');
      expect(shard.bounds.width).toBe(250);
      expect(shard.priority).toBe(1);
    });
  });

  describe('SmartCropResult', () => {
    it('has shards and metadata', () => {
      const result: SmartCropResult = {
        shards: [],
        totalShards: 4,
        strategy: 'adaptive',
        gridSize: { width: 2, height: 2 },
      };

      expect(result.strategy).toBe('adaptive');
      expect(result.totalShards).toBe(4);
    });
  });
});

// ============================================
// STAGE 4: ALCHEMY TYPES
// ============================================

describe('Stage 4: Alchemy Types', () => {
  describe('QualityScore', () => {
    it('has all quality metrics', () => {
      const score: QualityScore = {
        sharpness: 0.9,
        noise: 0.2,
        contrast: 0.8,
        colorAccuracy: 0.9,
        overall: 0.85,
      };

      expect(score.overall).toBe(0.85);
      expect(score.sharpness).toBe(0.9);
      expect(score.noise).toBe(0.2);
    });

    it('values are between 0 and 1', () => {
      const score: QualityScore = {
        sharpness: 0.9,
        noise: 0.2,
        contrast: 0.8,
        colorAccuracy: 0.9,
        overall: 0.85,
      };

      Object.values(score).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('RestoredImage', () => {
    it('has correct structure', () => {
      const restored: RestoredImage = {
        data: new ImageData(100, 100),
        format: 'png',
        blob: new Blob(),
        dataUrl: 'data:image/png;base64,...',
        width: 100,
        height: 100,
        metadata: {
          width: 100,
          height: 100,
          processedAt: new Date().toISOString(),
          pipelineVersion: '2.0.0',
        },
        report: {
          enhancementsApplied: ['denoise', 'sharpen'],
          damageRepaired: [],
          qualityScore: {
            before: { sharpness: 0.5, noise: 0.5, contrast: 0.5, colorAccuracy: 0.5, overall: 0.5 },
            after: { sharpness: 0.9, noise: 0.2, contrast: 0.8, colorAccuracy: 0.9, overall: 0.85 },
            improvement: 0.35,
          },
          processingTime: {
            total: 1500,
            byStage: { 1: 200, 2: 500, 3: 300, 4: 500 },
          },
        },
      };

      expect(restored.width).toBe(100);
      expect(restored.format).toBe('png');
      expect(restored.report.qualityScore.after.overall).toBeGreaterThan(
        restored.report.qualityScore.before.overall
      );
    });
  });
});

// ============================================
// TYPE COMPATIBILITY TESTS
// ============================================

describe('Type Compatibility', () => {
  it('DetectedObject bounds is a Rectangle', () => {
    const rect: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
    const obj: DetectedObject = {
      id: 'test',
      type: 'unknown',
      bounds: rect,
      confidence: 0.5,
      priority: 0,
    };

    expect(obj.bounds).toEqual(rect);
  });

  it('DamageRegion bounds is a Rectangle', () => {
    const rect: Rectangle = { x: 0, y: 0, width: 50, height: 50 };
    const damage: DamageRegion = {
      id: 'test',
      type: 'noise',
      bounds: rect,
      severity: 'low',
      mask: new Uint8ClampedArray(0),
      area: 0,
      confidence: 0.5,
    };

    expect(damage.bounds).toEqual(rect);
  });

  it('CroppedShard bounds is a Rectangle', () => {
    const rect: Rectangle = { x: 0, y: 0, width: 200, height: 200 };
    const shard: CroppedShard = {
      id: 'test',
      data: new ImageData(200, 200),
      bounds: rect,
      priority: 1,
      context: {
        containsText: false,
        containsDamage: false,
        damageTypes: [],
        objectTypes: [],
        neighbors: [],
        originalPosition: rect,
      },
    };

    expect(shard.bounds).toEqual(rect);
  });
});
