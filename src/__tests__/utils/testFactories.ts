// src/__tests__/utils/testFactories.ts
/**
 * Test Factories
 * ==============
 * Factory functions for creating mock data in tests.
 */
import type {
  AppSettings,
  DamageAssessment,
  FaceDetection,
  GitLabConfig,
  HistoryEntry,
  PhotoAnalysis,
  PhotoFile,
  RestorationJob,
  RestorationOptions,
  RestorationResult,
} from '../../types';

// ============================================
// COUNTER FOR UNIQUE IDS
// ============================================

let idCounter = 0;

export function resetIdCounter() {
  idCounter = 0;
}

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

// ============================================
// MOCK FILE CREATION
// ============================================

export function createMockFile(
  name = 'test-photo.jpg',
  type = 'image/jpeg',
  size = 1024 * 1024, // 1MB
): File {
  const content = new Array(size).fill('x').join('');
  return new File([content], name, { type });
}

// ============================================
// PHOTO FILE FACTORY
// ============================================

export function createMockPhotoFile(overrides?: Partial<PhotoFile>): PhotoFile {
  const file = createMockFile();
  return {
    id: nextId('photo'),
    file,
    preview: `blob:mock-preview-${Date.now()}`,
    mimeType: 'image/jpeg',
    size: file.size,
    name: file.name,
    uploadedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// FACE DETECTION FACTORY
// ============================================

export function createMockFaceDetection(overrides?: Partial<FaceDetection>): FaceDetection {
  return {
    count: 2,
    confidence: 0.95,
    positions: [
      { x: 100, y: 100, width: 80, height: 100 },
      { x: 250, y: 120, width: 75, height: 95 },
    ],
    ...overrides,
  };
}

// ============================================
// DAMAGE ASSESSMENT FACTORY
// ============================================

export function createMockDamageAssessment(
  overrides?: Partial<DamageAssessment>,
): DamageAssessment {
  return {
    overallScore: 35,
    scratches: true,
    fading: true,
    tears: false,
    waterDamage: false,
    mold: false,
    description: 'Minor scratches and color fading detected.',
    ...overrides,
  };
}

// ============================================
// PHOTO ANALYSIS FACTORY
// ============================================

export function createMockPhotoAnalysis(overrides?: Partial<PhotoAnalysis>): PhotoAnalysis {
  return {
    id: nextId('analysis'),
    filename: 'test-photo.jpg',
    faces: createMockFaceDetection(),
    damage: createMockDamageAssessment(),
    estimatedEra: '1970s',
    isColor: false,
    qualityScore: 65,
    resolution: { width: 1920, height: 1080 },
    recommendations: ['Remove scratches', 'Restore faded colors', 'Enhance faces'],
    analyzedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// RESTORATION OPTIONS FACTORY
// ============================================

export function createMockRestorationOptions(
  overrides?: Partial<RestorationOptions>,
): RestorationOptions {
  return {
    removeScratches: true,
    fixFading: true,
    enhanceFaces: true,
    colorize: false,
    denoise: true,
    sharpen: true,
    autoCrop: false,
    ...overrides,
  };
}

// ============================================
// RESTORATION RESULT FACTORY
// ============================================

export function createMockRestorationResult(
  overrides?: Partial<RestorationResult>,
): RestorationResult {
  return {
    id: nextId('result'),
    originalFilename: 'test-photo.jpg',
    restoredImageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    mimeType: 'image/jpeg',
    improvementsApplied: ['Scratches removed', 'Colors restored', 'Faces enhanced'],
    qualityBefore: 45,
    qualityAfter: 85,
    processingTimeMs: 2500,
    restoredAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// RESTORATION JOB FACTORY
// ============================================

export function createMockRestorationJob(
  overrides?: Partial<RestorationJob>,
  status: RestorationJob['status'] = 'pending',
): RestorationJob {
  const photo = createMockPhotoFile();
  const analysis = status !== 'pending' ? createMockPhotoAnalysis() : null;
  const result = status === 'completed' ? createMockRestorationResult() : null;

  return {
    id: nextId('job'),
    photo,
    analysis,
    options: createMockRestorationOptions(),
    result,
    status,
    error: status === 'failed' ? 'Analysis failed due to API error' : null,
    progress: status === 'completed' ? 100 : status === 'failed' ? 0 : 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// HISTORY ENTRY FACTORY
// ============================================

export function createMockHistoryEntry(overrides?: Partial<HistoryEntry>): HistoryEntry {
  return {
    id: nextId('history'),
    job: createMockRestorationJob({}, 'completed'),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// GITLAB CONFIG FACTORY
// ============================================

export function createMockGitLabConfig(overrides?: Partial<GitLabConfig>): GitLabConfig {
  return {
    enabled: false,
    instanceUrl: 'https://gitlab.com',
    projectId: 'user/project',
    privateToken: '',
    branch: 'main',
    uploadPath: 'uploads/restored',
    ...overrides,
  };
}

// ============================================
// APP SETTINGS FACTORY
// ============================================

export function createMockAppSettings(overrides?: Partial<AppSettings>): AppSettings {
  return {
    theme: 'dark',
    language: 'pl',
    autoAnalyze: true,
    preserveOriginals: true,
    defaultOptions: createMockRestorationOptions(),
    apiEndpoint: 'http://localhost:8000',
    gitlab: createMockGitLabConfig(),
    ...overrides,
  };
}

// ============================================
// HISTORY LIST FACTORY
// ============================================

export function createMockHistoryList(count = 5): HistoryEntry[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - i);

    return createMockHistoryEntry({
      createdAt: date.toISOString(),
      job: createMockRestorationJob(
        {
          status: i % 4 === 3 ? 'failed' : 'completed',
        },
        i % 4 === 3 ? 'failed' : 'completed',
      ),
    });
  });
}

// ============================================
// PHOTO LIST FACTORY
// ============================================

export function createMockPhotoList(count = 3): PhotoFile[] {
  return Array.from({ length: count }, (_, i) =>
    createMockPhotoFile({
      name: `photo-${i + 1}.jpg`,
    }),
  );
}
