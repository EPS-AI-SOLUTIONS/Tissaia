// src/hooks/api/mocks.ts
/**
 * Mock Data
 * =========
 * Mock responses for browser mode (when Tauri is not available).
 */
import type {
  AiModel,
  AnalysisResult,
  AppSettings,
  AvailableModel,
  DetectionResult,
  HealthResponse,
  ProviderStatus,
  RestorationResult,
} from './types';

// ============================================
// HEALTH & PROVIDERS
// ============================================

export const mockHealthResponse: HealthResponse = {
  status: 'browser_mode',
  version: '0.0.0-browser',
  providers: [],
  uptime_seconds: 0,
};

export const mockProvidersStatus: ProviderStatus[] = [
  {
    name: 'google',
    enabled: false,
    available: false,
    priority: 1,
    last_error: 'Tauri is required',
  },
];

// ============================================
// SETTINGS
// ============================================

export const mockSettings: AppSettings = {
  language: 'pl',
  theme: 'dark',
  auto_save: true,
  output_quality: 85,
  preferred_provider: null,
};

// ============================================
// ANALYSIS
// ============================================

export const mockAnalysisResult: AnalysisResult = {
  id: 'mock-analysis-id',
  timestamp: new Date().toISOString(),
  damage_score: 45,
  damage_types: [
    {
      name: 'discoloration',
      severity: 'medium',
      description: 'Color fading detected',
      area_percentage: 30,
    },
    {
      name: 'scratches',
      severity: 'low',
      description: 'Minor scratches',
      area_percentage: 5,
    },
  ],
  recommendations: ['Color correction', 'Scratch removal'],
  provider_used: 'mock-provider',
};

// ============================================
// RESTORATION
// ============================================

export function createMockRestorationResult(base64Image: string): RestorationResult {
  return {
    id: 'mock-restoration-id',
    timestamp: new Date().toISOString(),
    original_image: base64Image,
    restored_image: base64Image, // Return same image for mock
    improvements: ['Color corrected', 'Scratches removed'],
    provider_used: 'mock-provider',
    processing_time_ms: 2500,
  };
}

// ============================================
// AI MODELS
// ============================================

export const mockOllamaModels: AiModel[] = [
  { id: 'llama3.2:vision', name: 'llama3.2:vision', provider: 'ollama' },
  { id: 'llava', name: 'llava', provider: 'ollama' },
];

export const mockAvailableModel: AvailableModel = {
  id: 'mock-vision',
  name: 'Mock Vision Model',
  provider: 'mock',
  capabilities: ['vision', 'text', 'restoration'],
  isAvailable: true,
};

// ============================================
// PHOTO DETECTION / CROP
// ============================================

export const mockDetectionResult: DetectionResult = {
  id: 'mock-detection-id',
  timestamp: new Date().toISOString(),
  photo_count: 3,
  bounding_boxes: [
    { x: 30, y: 30, width: 440, height: 440, confidence: 0.95, label: 'photo 1' },
    { x: 530, y: 30, width: 440, height: 440, confidence: 0.92, label: 'photo 2' },
    { x: 30, y: 530, width: 440, height: 440, confidence: 0.88, label: 'photo 3' },
  ],
  provider_used: 'mock-provider',
  scan_width: 0,
  scan_height: 0,
};

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_MODEL_ID = 'gemini-2.0-flash-exp';
export const MOCK_ANALYSIS_DELAY = 2000;
export const MOCK_RESTORATION_DELAY = 3000;
export const MOCK_DETECTION_DELAY = 1500;
export const MOCK_CROP_DELAY = 1000;
