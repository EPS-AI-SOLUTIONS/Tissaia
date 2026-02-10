use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub damage_score: f32,
    pub damage_types: Vec<DamageType>,
    pub recommendations: Vec<String>,
    pub provider_used: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DamageType {
    pub name: String,
    pub severity: Severity,
    pub description: String,
    pub area_percentage: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestorationResult {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub original_image: String,
    pub restored_image: String,
    pub improvements: Vec<String>,
    pub provider_used: String,
    pub processing_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub operation: OperationType,
    pub input_preview: String,
    pub result_preview: Option<String>,
    pub provider: String,
    pub success: bool,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OperationType {
    Analysis,
    Restoration,
    PhotoSeparation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderStatus {
    pub name: String,
    pub enabled: bool,
    pub available: bool,
    pub priority: u8,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub language: String,
    pub theme: String,
    pub auto_save: bool,
    pub output_quality: u8,
    pub preferred_provider: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "pl".to_string(),
            theme: "dark".to_string(),
            auto_save: true,
            output_quality: 90,
            preferred_provider: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub providers: Vec<ProviderStatus>,
    pub uptime_seconds: u64,
}

impl AnalysisResult {
    pub fn new(provider: &str) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            damage_score: 0.0,
            damage_types: Vec::new(),
            recommendations: Vec::new(),
            provider_used: provider.to_string(),
        }
    }
}

impl RestorationResult {
    pub fn new(provider: &str, original: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            original_image: original,
            restored_image: String::new(),
            improvements: Vec::new(),
            provider_used: provider.to_string(),
            processing_time_ms: 0,
        }
    }
}

impl HistoryEntry {
    pub fn new(operation: OperationType, input: String, provider: &str) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            operation,
            input_preview: input,
            result_preview: None,
            provider: provider.to_string(),
            success: false,
            error_message: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiModel {
    pub id: String,
    pub name: String,
    pub provider: String,
}

// ============================================
// PHOTO SEPARATION / CROP TYPES
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
    pub confidence: f32,
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectionResult {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub photo_count: usize,
    pub bounding_boxes: Vec<BoundingBox>,
    pub provider_used: String,
    pub scan_width: u32,
    pub scan_height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CroppedPhoto {
    pub id: String,
    pub index: usize,
    pub image_base64: String,
    pub mime_type: String,
    pub width: u32,
    pub height: u32,
    pub source_box: BoundingBox,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CropResult {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub original_filename: String,
    pub photos: Vec<CroppedPhoto>,
    pub processing_time_ms: u64,
}
