// src/hooks/api/types.ts
/**
 * API Types
 * =========
 * TypeScript interfaces matching Rust backend structs (snake_case).
 * These represent the wire format from the Rust/Tauri backend.
 *
 * NOTE: UI-facing types live in src/types.ts (camelCase).
 * These API types use snake_case to match Rust serde serialization.
 */

// ============================================
// DAMAGE & ANALYSIS TYPES
// ============================================

export type DamageSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface DamageType {
  name: string;
  severity: DamageSeverity;
  description: string;
  area_percentage: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  damage_score: number;
  damage_types: DamageType[];
  recommendations: string[];
  provider_used: string;
}

// ============================================
// RESTORATION TYPES
// ============================================

export interface RestorationResult {
  id: string;
  timestamp: string;
  original_image: string;
  restored_image: string;
  improvements: string[];
  provider_used: string;
  processing_time_ms: number;
}

// ============================================
// HISTORY TYPES
// ============================================

export type OperationType = 'analysis' | 'restoration' | 'photoseparation';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  operation: OperationType;
  input_preview: string;
  result_preview: string | null;
  provider: string;
  success: boolean;
  error_message: string | null;
}

// ============================================
// PROVIDER TYPES
// ============================================

export interface ProviderStatus {
  name: string;
  enabled: boolean;
  available: boolean;
  priority: number;
  last_error: string | null;
}

export interface HealthResponse {
  status: string;
  version: string;
  providers: ProviderStatus[];
  uptime_seconds: number;
}

// ============================================
// AI MODEL TYPES
// ============================================

export type ModelCapability = 'vision' | 'text' | 'restoration';

export interface AiModel {
  id: string;
  name: string;
  provider: string;
}

export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapability[];
  isAvailable: boolean;
}

// ============================================
// SETTINGS TYPES (API/Backend format)
// ============================================

export interface AppSettings {
  language: string;
  theme: string;
  auto_save: boolean;
  output_quality: number;
  preferred_provider: string | null;
}

// ============================================
// PHOTO SEPARATION / CROP TYPES
// ============================================

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label: string | null;
}

export interface DetectionResult {
  id: string;
  timestamp: string;
  photo_count: number;
  bounding_boxes: BoundingBox[];
  provider_used: string;
  scan_width: number;
  scan_height: number;
}

export interface CroppedPhoto {
  id: string;
  index: number;
  image_base64: string;
  mime_type: string;
  width: number;
  height: number;
  source_box: BoundingBox;
}

export interface CropResult {
  id: string;
  timestamp: string;
  original_filename: string;
  photos: CroppedPhoto[];
  processing_time_ms: number;
}

// ============================================
// WORKFLOW TYPES
// ============================================

export interface WorkflowProgress {
  stage: 'analyzing' | 'restoring';
  progress: number;
}

export interface WorkflowResult {
  analysis: AnalysisResult;
  result: RestorationResult;
}
