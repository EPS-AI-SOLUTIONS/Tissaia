// src/types.ts
/**
 * Tissaia-AI Type Definitions
 * ===========================
 */

// ============================================
// VIEW TYPES
// ============================================

export type View =
  | 'upload' // Main photo upload view
  | 'crop' // Photo separation from scans
  | 'analyze' // Photo analysis view
  | 'restore' // Restoration in progress
  | 'results' // Restoration results
  | 'history' // Past restorations
  | 'settings' // App settings
  | 'health'; // Provider health dashboard

// ============================================
// PHOTO TYPES
// ============================================

export interface PhotoFile {
  id: string;
  file: File;
  preview: string; // Object URL for preview
  base64?: string; // Base64 encoded data
  mimeType: string;
  size: number;
  name: string;
  uploadedAt: string; // ISO 8601 string (survives JSON serialization)
}

export interface FaceDetection {
  count: number;
  confidence: number;
  positions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface DamageAssessment {
  overallScore: number; // 0-100, higher = more damage
  scratches: boolean;
  fading: boolean;
  tears: boolean;
  waterDamage: boolean;
  mold: boolean;
  description: string;
}

export interface PhotoAnalysis {
  id: string;
  filename: string;
  faces: FaceDetection;
  damage: DamageAssessment;
  estimatedEra: string | null;
  isColor: boolean;
  qualityScore: number;
  resolution: {
    width: number;
    height: number;
  };
  recommendations: string[];
  analyzedAt: string; // ISO 8601 string (survives JSON serialization)
}

export interface RestorationOptions {
  removeScratches: boolean;
  fixFading: boolean;
  enhanceFaces: boolean;
  colorize: boolean;
  denoise: boolean;
  sharpen: boolean;
  autoCrop: boolean;
}

export interface RestorationResult {
  id: string;
  originalFilename: string;
  restoredImageBase64: string;
  mimeType: string;
  improvementsApplied: string[];
  qualityBefore: number;
  qualityAfter: number;
  processingTimeMs: number;
  restoredAt: string; // ISO 8601 string (survives JSON serialization)
}

export interface RestorationJob {
  id: string;
  photo: PhotoFile;
  analysis: PhotoAnalysis | null;
  options: RestorationOptions;
  result: RestorationResult | null;
  status: 'pending' | 'analyzing' | 'restoring' | 'completed' | 'failed';
  error: string | null;
  progress: number; // 0-100
  createdAt: string; // ISO 8601 string (survives JSON serialization)
  updatedAt: string; // ISO 8601 string (survives JSON serialization)
}

// ============================================
// API TYPES
// ============================================

export interface ProviderStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  latencyMs: number | null;
  error: string | null;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptimeSeconds: number;
  providers: ProviderStatus[];
  timestamp: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string | null;
  contextWindow: number | null;
  supportsVision: boolean;
  supportsStreaming: boolean;
  pricing: {
    input: number;
    output: number;
  } | null;
}

export interface ModelsResponse {
  google: ModelInfo[];
  anthropic: ModelInfo[];
  openai: ModelInfo[];
  mistral: ModelInfo[];
  groq: ModelInfo[];
  ollama: ModelInfo[];
  default: string;
  cacheTtlSeconds: number;
}

// ============================================
// UI TYPES
// ============================================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface ProgressMessage {
  text: string;
  textEn: string;
}

export type Theme = 'dark' | 'light' | 'system';

export type Language = 'pl' | 'en';

// ============================================
// SETTINGS TYPES
// ============================================

export interface AppSettings {
  theme: Theme;
  language: Language;
  autoAnalyze: boolean;
  preserveOriginals: boolean;
  defaultOptions: RestorationOptions;
  apiEndpoint: string;
  gitlab: GitLabConfig;
}

// ============================================
// HISTORY TYPES
// ============================================

export interface HistoryEntry {
  id: string;
  job: RestorationJob;
  createdAt: string; // ISO 8601 string (survives JSON serialization)
}

// ============================================
// GITLAB TYPES
// ============================================

export interface GitLabConfig {
  enabled: boolean;
  instanceUrl: string; // e.g., 'https://gitlab.com' or self-hosted URL
  projectId: string; // Project ID or URL-encoded path (e.g., 'user/project')
  privateToken: string; // Personal Access Token
  branch: string; // Target branch for commits (default: 'main')
  uploadPath: string; // Path in repo for uploads (e.g., 'uploads/restored')
}

export interface GitLabUploadResponse {
  id: number;
  alt: string;
  url: string;
  full_path: string;
  markdown: string;
}

export interface GitLabCommitResponse {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  created_at: string;
  web_url: string;
}

export interface GitLabFileResponse {
  file_path: string;
  branch: string;
  commit_id: string;
}
