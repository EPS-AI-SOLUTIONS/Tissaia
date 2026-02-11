use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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
    Restoration,
    PhotoSeparation,
    Verification,
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
    #[serde(default = "default_true")]
    pub verification_enabled: bool,
}

fn default_true() -> bool {
    true
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "pl".to_string(),
            theme: "dark".to_string(),
            auto_save: true,
            output_quality: 90,
            preferred_provider: None,
            verification_enabled: true,
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

/// A 2D point in normalized 0-1000 coordinate space.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point2D {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
    pub confidence: f32,
    pub label: Option<String>,
    /// Rotation angle in degrees (clockwise). 0 = upright, 90 = rotated right, etc.
    #[serde(default)]
    pub rotation_angle: f32,
    /// Precise polygon contour of the photo (normalized 0-1000 coordinates).
    /// If present, describes the actual photo shape (may not be rectangular).
    /// The area between the polygon and the bounding box rectangle should be
    /// filled generatively (outpainting).
    #[serde(default)]
    pub contour: Vec<Point2D>,
    /// Whether this photo needs generative outpainting to fill non-rectangular edges.
    #[serde(default)]
    pub needs_outpaint: bool,
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

// ============================================
// VERIFICATION AGENT TYPES
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum VerificationStatus {
    Pass,
    Warning,
    Fail,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum VerificationStage {
    Restoration,
    Detection,
    Crop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationCheck {
    pub name: String,
    pub passed: bool,
    pub detail: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationIssue {
    pub severity: String,
    pub description: String,
    pub suggestion: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub stage: VerificationStage,
    pub status: VerificationStatus,
    pub confidence: u8,
    pub checks: Vec<VerificationCheck>,
    pub issues: Vec<VerificationIssue>,
    pub recommendations: Vec<String>,
    pub processing_time_ms: u64,
    pub model_used: String,
    /// Bounding boxes for photos that the verifier detected as missing from the original detection.
    #[serde(default)]
    pub missing_boxes: Vec<BoundingBox>,
}

impl VerificationResult {
    pub fn new(stage: VerificationStage) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            stage,
            status: VerificationStatus::Pass,
            confidence: 0,
            checks: Vec::new(),
            issues: Vec::new(),
            recommendations: Vec::new(),
            processing_time_ms: 0,
            model_used: "gemini-3-flash-preview".to_string(),
            missing_boxes: Vec::new(),
        }
    }
}
