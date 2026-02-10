// src/__tests__/mocks/tauri.mock.ts
/**
 * Tauri API Mocks
 * ===============
 * Mocks for @tauri-apps/api modules.
 */
import { vi } from 'vitest';

// ============================================
// MOCK INVOKE FUNCTION
// ============================================

export const mockInvoke = vi.fn();

// ============================================
// MOCK RESPONSES
// ============================================

export const mockHealthResponse = {
  status: 'healthy',
  version: '3.0.0',
  providers: [
    { name: 'google', enabled: true, available: true, priority: 1, last_error: null },
    { name: 'anthropic', enabled: true, available: true, priority: 2, last_error: null },
    { name: 'openai', enabled: true, available: true, priority: 3, last_error: null },
  ],
  uptime_seconds: 3600,
};

export const mockProvidersResponse = [
  { name: 'google', enabled: true, available: true, priority: 1, last_error: null },
  { name: 'anthropic', enabled: true, available: true, priority: 2, last_error: null },
  { name: 'openai', enabled: true, available: false, priority: 3, last_error: 'No API key' },
  { name: 'mistral', enabled: false, available: false, priority: 4, last_error: null },
  { name: 'groq', enabled: false, available: false, priority: 5, last_error: null },
  {
    name: 'ollama',
    enabled: true,
    available: false,
    priority: 6,
    last_error: 'Connection refused',
  },
];

export const mockAnalysisResult = {
  id: 'analysis-123',
  timestamp: new Date().toISOString(),
  damage_score: 45,
  damage_types: [
    {
      name: 'scratches',
      severity: 'medium',
      description: 'Minor scratches visible',
      area_percentage: 15,
    },
    { name: 'fading', severity: 'low', description: 'Slight color fading', area_percentage: 25 },
  ],
  recommendations: ['Remove scratches', 'Restore colors', 'Enhance contrast'],
  provider_used: 'google',
};

export const mockRestorationResult = {
  id: 'restoration-456',
  timestamp: new Date().toISOString(),
  original_image: 'base64-original...',
  restored_image: 'base64-restored...',
  improvements: ['Scratches removed', 'Colors enhanced', 'Contrast improved'],
  provider_used: 'google',
  processing_time_ms: 2500,
};

export const mockHistoryEntries = [
  {
    id: 'history-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    operation: 'analysis',
    input_preview: 'photo1.jpg',
    result_preview: null,
    provider: 'google',
    success: true,
    error_message: null,
  },
  {
    id: 'history-2',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    operation: 'restoration',
    input_preview: 'photo2.jpg',
    result_preview: 'restored_photo2.jpg',
    provider: 'anthropic',
    success: true,
    error_message: null,
  },
];

export const mockSettings = {
  language: 'pl',
  theme: 'dark',
  auto_save: true,
  output_quality: 85,
  preferred_provider: null,
};

export const mockOllamaModels = [
  { id: 'llava:latest', name: 'llava:latest', provider: 'ollama' },
  { id: 'llama3.2:vision', name: 'llama3.2:vision', provider: 'ollama' },
];

// ============================================
// SETUP MOCK INVOKE WITH DEFAULT RESPONSES
// ============================================

export function setupMockInvoke() {
  mockInvoke.mockImplementation((command: string, _args?: Record<string, unknown>) => {
    switch (command) {
      case 'health_check':
        return Promise.resolve(mockHealthResponse);
      case 'get_providers_status':
        return Promise.resolve(mockProvidersResponse);
      case 'analyze_image':
        return Promise.resolve(mockAnalysisResult);
      case 'restore_image':
        return Promise.resolve(mockRestorationResult);
      case 'get_history':
        return Promise.resolve(mockHistoryEntries);
      case 'clear_history':
        return Promise.resolve();
      case 'get_settings':
        return Promise.resolve(mockSettings);
      case 'save_settings':
        return Promise.resolve();
      case 'set_api_key':
        return Promise.resolve();
      case 'get_ollama_models':
        return Promise.resolve(mockOllamaModels);
      default:
        return Promise.reject(new Error(`Unknown command: ${command}`));
    }
  });
}

// ============================================
// VITEST MOCK MODULE
// ============================================

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

// Reset mock between tests
export function resetMockInvoke() {
  mockInvoke.mockReset();
  setupMockInvoke();
}
