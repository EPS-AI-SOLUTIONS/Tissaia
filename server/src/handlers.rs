// server/src/handlers.rs
//! Axum route handlers — converted from src-tauri/src/commands.rs
//! Tauri State<'_, AppStateHandle> → Axum State<SharedState>
//! Tauri #[tauri::command] params → JSON request bodies
//! Tauri Result<T, String> → Result<Json<T>, AppError>

use crate::ai::AiProvider;
use crate::models::{
    AiModel, AppSettings, BoundingBox, CropResult, CroppedPhoto,
    DetectionResult, HealthResponse, HistoryEntry, OperationType, Point2D,
    ProviderStatus, RestorationResult, VerificationResult,
};
use crate::state::AppState;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info};

pub type SharedState = Arc<Mutex<AppState>>;

// ============================================
// ERROR TYPE
// ============================================

pub struct AppError(anyhow::Error);

impl From<String> for AppError {
    fn from(s: String) -> Self {
        AppError(anyhow::anyhow!(s))
    }
}

impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError(e)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let body = serde_json::json!({ "error": self.0.to_string() });
        (StatusCode::INTERNAL_SERVER_ERROR, Json(body)).into_response()
    }
}

// ============================================
// REQUEST DTOs
// ============================================

#[derive(Deserialize)]
pub struct RestoreRequest {
    pub image_base64: String,
    pub mime_type: String,
}

#[derive(Deserialize)]
pub struct DetectRequest {
    pub image_base64: String,
    pub mime_type: String,
}

#[derive(Deserialize)]
pub struct CropRequest {
    pub image_base64: String,
    pub mime_type: String,
    pub bounding_boxes: Vec<BoundingBox>,
    pub original_filename: String,
}

#[derive(Deserialize)]
pub struct OutpaintRequest {
    pub cropped_base64: String,
    pub mime_type: String,
    pub contour: Vec<Point2D>,
    pub bbox_width: u32,
    pub bbox_height: u32,
}

#[derive(Deserialize)]
pub struct RotateRequest {
    pub image_base64: String,
    pub mime_type: String,
    pub degrees: i32,
}

#[derive(Deserialize)]
pub struct UpscaleRequest {
    pub image_base64: String,
    pub mime_type: String,
    pub scale_factor: Option<f64>,
}

#[derive(Deserialize)]
pub struct FiltersRequest {
    pub image_base64: String,
    pub mime_type: String,
    pub filters: Option<Vec<String>>,
}

#[derive(Deserialize)]
pub struct MetadataRequest {
    pub image_base64: String,
    pub mime_type: String,
}

#[derive(Deserialize)]
pub struct SaveRequest {
    pub image_base64: String,
    pub file_path: String,
}

#[derive(Deserialize)]
pub struct VerifyRestorationRequest {
    pub original_base64: String,
    pub restored_base64: String,
    pub mime_type: String,
}

#[derive(Deserialize)]
pub struct VerifyDetectionRequest {
    pub image_base64: String,
    pub mime_type: String,
    pub bounding_boxes: Vec<BoundingBox>,
}

#[derive(Deserialize)]
pub struct VerifyCropRequest {
    pub cropped_base64: String,
    pub mime_type: String,
    pub crop_index: usize,
}

#[derive(Deserialize)]
pub struct SetApiKeyRequest {
    pub provider: String,
    pub key: String,
}

// ============================================
// IMAGE PROCESSING HELPERS
// ============================================

#[cfg(feature = "image-processing")]
fn auto_trim_dark_edges(img: &image::DynamicImage) -> image::DynamicImage {
    use image::GenericImageView;

    let (w, h) = img.dimensions();
    if w < 20 || h < 20 {
        return img.clone();
    }

    let brightness_threshold: u8 = 60;
    let min_dark_fraction = 0.55;
    let max_trim_fraction = 0.08;

    let max_trim_x = (w as f64 * max_trim_fraction) as u32;
    let max_trim_y = (h as f64 * max_trim_fraction) as u32;

    let is_dark_pixel = |x: u32, y: u32| -> bool {
        let p = img.get_pixel(x, y);
        let avg = (p[0] as u16 + p[1] as u16 + p[2] as u16) / 3;
        avg < brightness_threshold as u16
    };

    let mut left = 0u32;
    for x in 0..max_trim_x {
        let dark_count = (0..h).filter(|&y| is_dark_pixel(x, y)).count();
        if dark_count as f64 / h as f64 >= min_dark_fraction {
            left = x + 1;
        } else {
            break;
        }
    }

    let mut right = w;
    for x in (w.saturating_sub(max_trim_x)..w).rev() {
        let dark_count = (0..h).filter(|&y| is_dark_pixel(x, y)).count();
        if dark_count as f64 / h as f64 >= min_dark_fraction {
            right = x;
        } else {
            break;
        }
    }

    let mut top = 0u32;
    for y in 0..max_trim_y {
        let dark_count = (0..w).filter(|&x| is_dark_pixel(x, y)).count();
        if dark_count as f64 / w as f64 >= min_dark_fraction {
            top = y + 1;
        } else {
            break;
        }
    }

    let mut bottom = h;
    for y in (h.saturating_sub(max_trim_y)..h).rev() {
        let dark_count = (0..w).filter(|&x| is_dark_pixel(x, y)).count();
        if dark_count as f64 / w as f64 >= min_dark_fraction {
            bottom = y;
        } else {
            break;
        }
    }

    let new_w = right.saturating_sub(left).max(1);
    let new_h = bottom.saturating_sub(top).max(1);

    if new_w < w || new_h < h {
        info!("Auto-trim: {}x{} → {}x{} (trimmed L:{} R:{} T:{} B:{})",
            w, h, new_w, new_h, left, w - right, top, h - bottom);
        img.crop_imm(left, top, new_w, new_h)
    } else {
        img.clone()
    }
}

#[cfg(feature = "image-processing")]
fn apply_exif_rotation(image_base64: &str, mime_type: &str) -> Result<String, String> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};

    let image_bytes = STANDARD.decode(image_base64)
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    let orientation = {
        let mut cursor = std::io::Cursor::new(&image_bytes);
        match exif::Reader::new().read_from_container(&mut cursor) {
            Ok(exif_data) => {
                exif_data.get_field(exif::Tag::Orientation, exif::In::PRIMARY)
                    .and_then(|f| f.value.get_uint(0))
                    .unwrap_or(1)
            }
            Err(_) => 1,
        }
    };

    if orientation == 1 {
        return Ok(image_base64.to_string());
    }

    info!("EXIF orientation detected: {} — applying correction", orientation);

    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Image decode error: {}", e))?;

    let corrected = match orientation {
        3 => img.rotate180(),
        6 => img.rotate90(),
        8 => img.rotate270(),
        2 => img.fliph(),
        4 => img.flipv(),
        5 => img.rotate90().fliph(),
        7 => img.rotate270().fliph(),
        _ => img,
    };

    let mut buf = std::io::Cursor::new(Vec::new());
    let output_format = match mime_type {
        "image/png" => image::ImageFormat::Png,
        "image/webp" => image::ImageFormat::WebP,
        _ => image::ImageFormat::Jpeg,
    };
    corrected.write_to(&mut buf, output_format)
        .map_err(|e| format!("Image encode error: {}", e))?;

    Ok(STANDARD.encode(buf.into_inner()))
}

#[cfg(feature = "image-processing")]
fn apply_clahe(img: &image::DynamicImage) -> image::DynamicImage {
    use image::{DynamicImage, GenericImageView, ImageBuffer, Rgba};

    let (w, h) = img.dimensions();
    let mut output = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(w, h);

    let tile_w = (w / 8).max(16);
    let tile_h = (h / 8).max(16);
    let clip_limit: u32 = 40;

    for ty in (0..h).step_by(tile_h as usize) {
        for tx in (0..w).step_by(tile_w as usize) {
            let end_x = (tx + tile_w).min(w);
            let end_y = (ty + tile_h).min(h);

            let mut hist = [0u32; 256];
            let mut count = 0u32;

            for y in ty..end_y {
                for x in tx..end_x {
                    let pixel = img.get_pixel(x, y);
                    let lum = (0.299 * pixel[0] as f64 + 0.587 * pixel[1] as f64 + 0.114 * pixel[2] as f64) as u8;
                    hist[lum as usize] += 1;
                    count += 1;
                }
            }

            if count == 0 { continue; }

            let mut excess = 0u32;
            for bin in hist.iter_mut() {
                if *bin > clip_limit {
                    excess += *bin - clip_limit;
                    *bin = clip_limit;
                }
            }

            let redistrib = excess / 256;
            for bin in hist.iter_mut() {
                *bin += redistrib;
            }

            let mut cdf = [0u32; 256];
            cdf[0] = hist[0];
            for i in 1..256 {
                cdf[i] = cdf[i - 1] + hist[i];
            }

            let cdf_min = cdf.iter().copied().find(|&v| v > 0).unwrap_or(0);
            let denom = (count - cdf_min).max(1);

            for y in ty..end_y {
                for x in tx..end_x {
                    let pixel = img.get_pixel(x, y);
                    let lum = (0.299 * pixel[0] as f64 + 0.587 * pixel[1] as f64 + 0.114 * pixel[2] as f64) as u8;
                    let new_lum = ((cdf[lum as usize] - cdf_min) as f64 / denom as f64 * 255.0).clamp(0.0, 255.0) as u8;

                    let scale = if lum > 0 { new_lum as f64 / lum as f64 } else { 1.0 };
                    let r = (pixel[0] as f64 * scale).clamp(0.0, 255.0) as u8;
                    let g = (pixel[1] as f64 * scale).clamp(0.0, 255.0) as u8;
                    let b = (pixel[2] as f64 * scale).clamp(0.0, 255.0) as u8;
                    output.put_pixel(x, y, Rgba([r, g, b, pixel[3]]));
                }
            }
        }
    }

    DynamicImage::ImageRgba8(output)
}

#[cfg(feature = "image-processing")]
fn apply_unsharp_mask(img: &image::DynamicImage, amount: f64) -> image::DynamicImage {
    use image::{DynamicImage, GenericImageView, ImageBuffer, Rgba};

    let (w, h) = img.dimensions();
    if w < 3 || h < 3 { return img.clone(); }

    let blurred = img.blur(1.0);
    let mut output = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(w, h);

    for y in 0..h {
        for x in 0..w {
            let orig = img.get_pixel(x, y);
            let blur = blurred.get_pixel(x, y);

            let r = ((orig[0] as f64 + amount * (orig[0] as f64 - blur[0] as f64)).clamp(0.0, 255.0)) as u8;
            let g = ((orig[1] as f64 + amount * (orig[1] as f64 - blur[1] as f64)).clamp(0.0, 255.0)) as u8;
            let b = ((orig[2] as f64 + amount * (orig[2] as f64 - blur[2] as f64)).clamp(0.0, 255.0)) as u8;
            output.put_pixel(x, y, Rgba([r, g, b, orig[3]]));
        }
    }

    DynamicImage::ImageRgba8(output)
}

#[cfg(feature = "image-processing")]
fn apply_bilateral_approx(img: &image::DynamicImage) -> image::DynamicImage {
    use image::{DynamicImage, GenericImageView, ImageBuffer, Rgba};

    let (w, h) = img.dimensions();
    if w < 5 || h < 5 { return img.clone(); }

    let mut output = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(w, h);
    let radius: i32 = 3;
    let sigma_space: f64 = 3.0;
    let sigma_color: f64 = 50.0;

    for y in 0..h {
        for x in 0..w {
            let center = img.get_pixel(x, y);
            let mut sum_r = 0.0f64;
            let mut sum_g = 0.0f64;
            let mut sum_b = 0.0f64;
            let mut weight_sum = 0.0f64;

            for dy in -radius..=radius {
                for dx in -radius..=radius {
                    let nx = x as i32 + dx;
                    let ny = y as i32 + dy;
                    if nx < 0 || ny < 0 || nx >= w as i32 || ny >= h as i32 { continue; }

                    let neighbor = img.get_pixel(nx as u32, ny as u32);

                    let spatial = (-((dx * dx + dy * dy) as f64) / (2.0 * sigma_space * sigma_space)).exp();

                    let diff_r = center[0] as f64 - neighbor[0] as f64;
                    let diff_g = center[1] as f64 - neighbor[1] as f64;
                    let diff_b = center[2] as f64 - neighbor[2] as f64;
                    let color_dist = diff_r * diff_r + diff_g * diff_g + diff_b * diff_b;
                    let color_w = (-(color_dist) / (2.0 * sigma_color * sigma_color)).exp();

                    let weight = spatial * color_w;
                    sum_r += neighbor[0] as f64 * weight;
                    sum_g += neighbor[1] as f64 * weight;
                    sum_b += neighbor[2] as f64 * weight;
                    weight_sum += weight;
                }
            }

            if weight_sum > 0.0 {
                output.put_pixel(x, y, Rgba([
                    (sum_r / weight_sum).clamp(0.0, 255.0) as u8,
                    (sum_g / weight_sum).clamp(0.0, 255.0) as u8,
                    (sum_b / weight_sum).clamp(0.0, 255.0) as u8,
                    center[3],
                ]));
            } else {
                output.put_pixel(x, y, center);
            }
        }
    }

    DynamicImage::ImageRgba8(output)
}

#[cfg(feature = "image-processing")]
fn apply_gaussian_denoise(img: &image::DynamicImage, sigma: f64) -> image::DynamicImage {
    img.blur(sigma as f32)
}

// ============================================
// ROUTE HANDLERS
// ============================================

pub async fn health_check(
    State(state): State<SharedState>,
) -> Result<Json<HealthResponse>, AppError> {
    let state = state.lock().await;
    Ok(Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        providers: state.providers.clone(),
        uptime_seconds: state.uptime_seconds(),
    }))
}

pub async fn get_providers_status(
    State(state): State<SharedState>,
) -> Result<Json<Vec<ProviderStatus>>, AppError> {
    let state = state.lock().await;
    Ok(Json(state.providers.clone()))
}

pub async fn get_ollama_models(
    State(state): State<SharedState>,
) -> Result<Json<Vec<AiModel>>, AppError> {
    let client = {
        let state_guard = state.lock().await;
        state_guard.client().clone()
    };
    let ai = AiProvider::with_client(client);
    let models = ai.get_ollama_models().await.map_err(|e| AppError::from(e.to_string()))?;
    Ok(Json(models))
}

pub async fn restore_image(
    State(state): State<SharedState>,
    Json(req): Json<RestoreRequest>,
) -> Result<Json<RestorationResult>, AppError> {
    let image_base64 = req.image_base64;
    let mime_type = req.mime_type;

    // Apply EXIF orientation correction before sending to AI
    #[cfg(feature = "image-processing")]
    let image_base64 = apply_exif_rotation(&image_base64, &mime_type).unwrap_or(image_base64);

    let provider_name;
    let api_key;
    let client;

    {
        let state_guard = state.lock().await;
        provider_name = state_guard
            .get_available_provider()
            .ok_or_else(|| AppError::from("No AI provider available".to_string()))?
            .to_string();
        api_key = state_guard
            .get_api_key(&provider_name)
            .ok_or_else(|| AppError::from("API key not found".to_string()))?
            .clone();
        client = state_guard.client().clone();
    }

    let ai = AiProvider::with_client(client);

    let result = match provider_name.as_str() {
        "google" => ai.restore_with_google(&api_key, &image_base64, &mime_type).await,
        "anthropic" => ai.restore_with_anthropic(&api_key, &image_base64, &mime_type).await,
        "openai" => ai.restore_with_openai(&api_key, &image_base64, &mime_type).await,
        "ollama" => {
            let models = ai.get_ollama_models().await.unwrap_or_default();
            let model = models.first().map(|m| m.name.clone()).unwrap_or("llama3.2:vision".to_string());
            ai.restore_with_ollama(&model, &image_base64, &mime_type).await
        }
        _ => Err(anyhow::anyhow!("Restoration not supported for this provider yet")),
    }
    .map_err(|e| AppError::from(e.to_string()))?;

    // Add to history
    {
        let mut state_guard = state.lock().await;
        let mut entry = HistoryEntry::new(
            OperationType::Restoration,
            image_base64[..100.min(image_base64.len())].to_string(),
            &provider_name,
        );
        entry.success = true;
        entry.result_preview = Some(result.restored_image[..100.min(result.restored_image.len())].to_string());
        state_guard.add_history(entry);
    }

    Ok(Json(result))
}

pub async fn detect_photos(
    State(state): State<SharedState>,
    Json(req): Json<DetectRequest>,
) -> Result<Json<DetectionResult>, AppError> {
    info!("=== DETECT_PHOTOS START ===");
    info!("Image size: {} bytes, MIME type: {}", req.image_base64.len(), req.mime_type);

    let provider_name;
    let api_key;
    let client;
    let google_key_fallback;

    {
        let state_guard = state.lock().await;
        provider_name = state_guard
            .get_available_provider()
            .ok_or_else(|| AppError::from("No AI provider available. Please configure an API key.".to_string()))?
            .to_string();
        api_key = state_guard
            .get_api_key(&provider_name)
            .ok_or_else(|| AppError::from("API key not found".to_string()))?
            .clone();
        client = state_guard.client().clone();
        google_key_fallback = state_guard.get_api_key("google").cloned();
    }

    let ai = AiProvider::with_client(client);

    let result = match provider_name.as_str() {
        "google" => ai.detect_photo_boundaries(&api_key, &req.image_base64, &req.mime_type).await,
        _ => {
            if let Some(key) = google_key_fallback {
                ai.detect_photo_boundaries(&key, &req.image_base64, &req.mime_type).await
            } else {
                Err(anyhow::anyhow!("Photo detection requires Google Gemini Vision"))
            }
        }
    }
    .map_err(|e| AppError::from(e.to_string()))?;

    info!("=== DETECT_PHOTOS END === (found {} photos)", result.photo_count);
    Ok(Json(result))
}

pub async fn detect_photos_with_retry(
    State(state): State<SharedState>,
    Json(req): Json<DetectRequest>,
) -> Result<Json<DetectionResult>, AppError> {
    info!("=== DETECT_PHOTOS_WITH_RETRY START ===");

    let (api_key, client, verification_enabled) = {
        let state_guard = state.lock().await;
        let key = state_guard.get_api_key("google")
            .ok_or_else(|| AppError::from("Google API key required".to_string()))?
            .clone();
        let client = state_guard.client().clone();
        let enabled = state_guard.settings.verification_enabled;
        (key, client, enabled)
    };

    let ai = AiProvider::with_client(client);

    // Step 1: Initial detection
    let mut result = ai.detect_photo_boundaries(&api_key, &req.image_base64, &req.mime_type)
        .await
        .map_err(|e| AppError::from(e.to_string()))?;

    info!("Initial detection found {} photos", result.photo_count);

    // Step 2: Verify if enabled
    if !verification_enabled {
        info!("Verification disabled, returning initial result");
        return Ok(Json(result));
    }

    let verification = ai.verify_detection(&api_key, &req.image_base64, &req.mime_type, &result.bounding_boxes)
        .await;

    let verification = match verification {
        Ok(v) => v,
        Err(e) => {
            info!("Verification failed ({}), returning initial result", e);
            return Ok(Json(result));
        }
    };

    info!("Verification status: {:?}, missing boxes: {}", verification.status, verification.missing_boxes.len());

    // Step 3: Merge missing boxes if completeness failed
    let completeness_failed = verification.checks.iter()
        .any(|c| c.name == "completeness" && !c.passed);

    if completeness_failed && !verification.missing_boxes.is_empty() {
        info!("Completeness check failed — merging {} missing boxes from verifier", verification.missing_boxes.len());

        for (i, missing) in verification.missing_boxes.iter().enumerate() {
            let mut merged_box = missing.clone();
            merged_box.label = Some(format!("photo {}", result.bounding_boxes.len() + 1));
            merged_box.confidence = merged_box.confidence.min(0.80);

            info!("  Merging missing box {}: x={}, y={}, w={}, h={} (conf: {:.2})",
                i + 1, merged_box.x, merged_box.y, merged_box.width, merged_box.height, merged_box.confidence);

            result.bounding_boxes.push(merged_box);
        }

        result.photo_count = result.bounding_boxes.len();
        info!("After merge: {} total photos", result.photo_count);
    }

    info!("=== DETECT_PHOTOS_WITH_RETRY END === (found {} photos)", result.photo_count);
    Ok(Json(result))
}

#[cfg(feature = "image-processing")]
pub async fn crop_photos(
    Json(req): Json<CropRequest>,
) -> Result<Json<CropResult>, AppError> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};
    use image::GenericImageView;

    info!("=== CROP_PHOTOS START ===");
    info!("Boxes: {}, filename: {}", req.bounding_boxes.len(), req.original_filename);

    let start = std::time::Instant::now();

    let image_bytes = STANDARD.decode(&req.image_base64)
        .map_err(|e| AppError::from(format!("Base64 decode error: {}", e)))?;

    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| AppError::from(format!("Image decode error: {}", e)))?;

    let (img_width, img_height) = img.dimensions();
    info!("Image dimensions: {}x{}", img_width, img_height);

    let padding_factor = 0.005;
    let mut photos = Vec::new();

    for (idx, bbox) in req.bounding_boxes.iter().enumerate() {
        info!("Box {}: x={} y={} w={} h={} rotation_angle={} label={:?}",
            idx, bbox.x, bbox.y, bbox.width, bbox.height, bbox.rotation_angle, bbox.label);
    }

    // Validate and fix overlapping bounding boxes
    let mut fixed_boxes: Vec<BoundingBox> = req.bounding_boxes.clone();
    for i in 0..fixed_boxes.len() {
        for j in (i + 1)..fixed_boxes.len() {
            let (a, b) = (&fixed_boxes[i], &fixed_boxes[j]);
            let a_right = a.x + a.width;
            let b_right = b.x + b.width;
            let a_bottom = a.y + a.height;
            let b_bottom = b.y + b.height;

            let h_overlap = (a_right.min(b_right) as i64 - a.x.max(b.x) as i64).max(0);
            let v_overlap = (a_bottom.min(b_bottom) as i64 - a.y.max(b.y) as i64).max(0);

            if h_overlap > 0 && v_overlap > 0 {
                let overlap = h_overlap.min(v_overlap);
                info!("Overlap detected between box {} and {}: {} units. Shrinking.", i, j, overlap);
                let shrink = (overlap / 2 + 1) as u32;
                if h_overlap <= v_overlap {
                    if fixed_boxes[i].x < fixed_boxes[j].x {
                        fixed_boxes[i].width = fixed_boxes[i].width.saturating_sub(shrink);
                        fixed_boxes[j].x += shrink;
                        fixed_boxes[j].width = fixed_boxes[j].width.saturating_sub(shrink);
                    } else {
                        fixed_boxes[j].width = fixed_boxes[j].width.saturating_sub(shrink);
                        fixed_boxes[i].x += shrink;
                        fixed_boxes[i].width = fixed_boxes[i].width.saturating_sub(shrink);
                    }
                } else {
                    if fixed_boxes[i].y < fixed_boxes[j].y {
                        fixed_boxes[i].height = fixed_boxes[i].height.saturating_sub(shrink);
                        fixed_boxes[j].y += shrink;
                        fixed_boxes[j].height = fixed_boxes[j].height.saturating_sub(shrink);
                    } else {
                        fixed_boxes[j].height = fixed_boxes[j].height.saturating_sub(shrink);
                        fixed_boxes[i].y += shrink;
                        fixed_boxes[i].height = fixed_boxes[i].height.saturating_sub(shrink);
                    }
                }
            }
        }
    }

    for (idx, bbox) in fixed_boxes.iter().enumerate() {
        let mut px = (bbox.x as f64 / 1000.0 * img_width as f64) as i64;
        let mut py = (bbox.y as f64 / 1000.0 * img_height as f64) as i64;
        let mut pw = (bbox.width as f64 / 1000.0 * img_width as f64) as i64;
        let mut ph = (bbox.height as f64 / 1000.0 * img_height as f64) as i64;

        let pad_x = (pw as f64 * padding_factor) as i64;
        let pad_y = (ph as f64 * padding_factor) as i64;
        px = (px - pad_x).max(0);
        py = (py - pad_y).max(0);
        pw = (pw + 2 * pad_x).min(img_width as i64 - px);
        ph = (ph + 2 * pad_y).min(img_height as i64 - py);

        if pw <= 0 || ph <= 0 {
            error!("Invalid crop dimensions for box {}: {}x{}", idx, pw, ph);
            continue;
        }

        let cropped = img.crop_imm(px as u32, py as u32, pw as u32, ph as u32);

        let rotation = bbox.rotation_angle;
        let rotated = if (rotation - 90.0).abs() < 45.0 {
            info!("Photo {} detected at 90° CW → correcting with 270° CW (90° CCW)", idx);
            cropped.rotate270()
        } else if (rotation - 180.0).abs() < 45.0 {
            info!("Photo {} detected at 180° → correcting with 180°", idx);
            cropped.rotate180()
        } else if (rotation - 270.0).abs() < 45.0 {
            info!("Photo {} detected at 270° CW → correcting with 90° CW", idx);
            cropped.rotate90()
        } else {
            cropped
        };

        let trimmed = auto_trim_dark_edges(&rotated);
        let (cw, ch) = trimmed.dimensions();

        let mut buf = std::io::Cursor::new(Vec::new());
        let output_format = match req.mime_type.as_str() {
            "image/png" => image::ImageFormat::Png,
            "image/webp" => image::ImageFormat::WebP,
            _ => image::ImageFormat::Jpeg,
        };
        trimmed.write_to(&mut buf, output_format)
            .map_err(|e| AppError::from(format!("Image encode error: {}", e)))?;

        let cropped_base64 = STANDARD.encode(buf.into_inner());

        photos.push(CroppedPhoto {
            id: uuid::Uuid::new_v4().to_string(),
            index: idx,
            image_base64: cropped_base64,
            mime_type: req.mime_type.clone(),
            width: cw,
            height: ch,
            source_box: bbox.clone(),
        });

        info!("Cropped photo {}: {}x{}", idx, cw, ch);
    }

    let result = CropResult {
        id: uuid::Uuid::new_v4().to_string(),
        timestamp: chrono::Utc::now(),
        original_filename: req.original_filename,
        photos,
        processing_time_ms: start.elapsed().as_millis() as u64,
    };

    info!("=== CROP_PHOTOS END === ({} photos, {}ms)", result.photos.len(), result.processing_time_ms);
    Ok(Json(result))
}

#[cfg(not(feature = "image-processing"))]
pub async fn crop_photos(
    Json(_req): Json<CropRequest>,
) -> Result<Json<CropResult>, AppError> {
    Err(AppError::from("Image processing feature is not enabled. Rebuild with --features image-processing".to_string()))
}

pub async fn outpaint_photo(
    State(state): State<SharedState>,
    Json(req): Json<OutpaintRequest>,
) -> Result<Json<String>, AppError> {
    info!("=== OUTPAINT_PHOTO START ===");

    if req.contour.len() < 3 {
        info!("Contour has < 3 points, returning original image");
        return Ok(Json(req.cropped_base64));
    }

    let (api_key, client) = {
        let state_guard = state.lock().await;
        let key = state_guard.get_api_key("google")
            .ok_or_else(|| AppError::from("Google API key required for outpainting".to_string()))?
            .clone();
        let client = state_guard.client().clone();
        (key, client)
    };

    let ai = AiProvider::with_client(client);
    let result = ai.outpaint_to_rectangle(
        &api_key, &req.cropped_base64, &req.mime_type, &req.contour, req.bbox_width, req.bbox_height,
    )
    .await
    .map_err(|e| AppError::from(e.to_string()))?;

    info!("=== OUTPAINT_PHOTO END ===");
    Ok(Json(result))
}

#[cfg(feature = "image-processing")]
pub async fn rotate_image(
    Json(req): Json<RotateRequest>,
) -> Result<Json<String>, AppError> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};

    info!("=== ROTATE_IMAGE {} degrees ===", req.degrees);

    let image_bytes = STANDARD.decode(&req.image_base64)
        .map_err(|e| AppError::from(format!("Base64 decode error: {}", e)))?;

    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| AppError::from(format!("Image decode error: {}", e)))?;

    let normalized = ((req.degrees % 360) + 360) % 360;
    let rotated = match normalized {
        90 => img.rotate90(),
        180 => img.rotate180(),
        270 => img.rotate270(),
        _ => img,
    };

    let mut buf = std::io::Cursor::new(Vec::new());
    let output_format = match req.mime_type.as_str() {
        "image/png" => image::ImageFormat::Png,
        "image/webp" => image::ImageFormat::WebP,
        _ => image::ImageFormat::Jpeg,
    };
    rotated.write_to(&mut buf, output_format)
        .map_err(|e| AppError::from(format!("Image encode error: {}", e)))?;

    let result_base64 = STANDARD.encode(buf.into_inner());
    info!("=== ROTATE_IMAGE END ===");
    Ok(Json(result_base64))
}

#[cfg(not(feature = "image-processing"))]
pub async fn rotate_image(
    Json(_req): Json<RotateRequest>,
) -> Result<Json<String>, AppError> {
    Err(AppError::from("Image processing feature is not enabled".to_string()))
}

#[cfg(feature = "image-processing")]
pub async fn upscale_image(
    Json(req): Json<UpscaleRequest>,
) -> Result<Json<String>, AppError> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};
    use image::GenericImageView;

    let factor = req.scale_factor.unwrap_or(2.0);
    info!("=== UPSCALE_IMAGE START === scale: {}x", factor);

    let start = std::time::Instant::now();

    let image_bytes = STANDARD.decode(&req.image_base64)
        .map_err(|e| AppError::from(format!("Base64 decode error: {}", e)))?;

    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| AppError::from(format!("Image decode error: {}", e)))?;

    let (orig_w, orig_h) = img.dimensions();
    let new_w = (orig_w as f64 * factor) as u32;
    let new_h = (orig_h as f64 * factor) as u32;

    info!("Upscaling {}x{} -> {}x{} ({}x)", orig_w, orig_h, new_w, new_h, factor);

    let upscaled = img.resize_exact(new_w, new_h, image::imageops::FilterType::Lanczos3);

    let mut buf = std::io::Cursor::new(Vec::new());
    let output_format = match req.mime_type.as_str() {
        "image/png" => image::ImageFormat::Png,
        "image/webp" => image::ImageFormat::WebP,
        _ => image::ImageFormat::Jpeg,
    };
    upscaled.write_to(&mut buf, output_format)
        .map_err(|e| AppError::from(format!("Image encode error: {}", e)))?;

    let result_base64 = STANDARD.encode(buf.into_inner());

    info!("=== UPSCALE_IMAGE END === ({}x{} -> {}x{}, {}ms)",
        orig_w, orig_h, new_w, new_h, start.elapsed().as_millis());

    Ok(Json(result_base64))
}

#[cfg(not(feature = "image-processing"))]
pub async fn upscale_image(
    Json(_req): Json<UpscaleRequest>,
) -> Result<Json<String>, AppError> {
    Err(AppError::from("Image processing feature is not enabled".to_string()))
}

#[cfg(feature = "image-processing")]
pub async fn apply_local_filters(
    Json(req): Json<FiltersRequest>,
) -> Result<Json<String>, AppError> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};
    use image::GenericImageView;

    info!("=== APPLY_LOCAL_FILTERS START ===");
    let start = std::time::Instant::now();

    let image_bytes = STANDARD.decode(&req.image_base64)
        .map_err(|e| AppError::from(format!("Base64 decode error: {}", e)))?;

    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| AppError::from(format!("Image decode error: {}", e)))?;

    let (w, h) = img.dimensions();
    info!("Processing {}x{} image", w, h);

    let active_filters = req.filters.unwrap_or_else(|| vec![
        "clahe".to_string(),
        "sharpen".to_string(),
    ]);

    let mut current = img;

    for filter_name in &active_filters {
        current = match filter_name.as_str() {
            "clahe" => apply_clahe(&current),
            "sharpen" => apply_unsharp_mask(&current, 1.0),
            "sharpen_mild" => apply_unsharp_mask(&current, 0.5),
            "sharpen_strong" => apply_unsharp_mask(&current, 2.0),
            "bilateral" => apply_bilateral_approx(&current),
            "denoise" => apply_gaussian_denoise(&current, 1.5),
            "denoise_mild" => apply_gaussian_denoise(&current, 0.8),
            "denoise_strong" => apply_gaussian_denoise(&current, 3.0),
            _ => {
                info!("Unknown filter: {}, skipping", filter_name);
                current
            }
        };
    }

    let mut buf = std::io::Cursor::new(Vec::new());
    let output_format = match req.mime_type.as_str() {
        "image/png" => image::ImageFormat::Png,
        "image/webp" => image::ImageFormat::WebP,
        _ => image::ImageFormat::Jpeg,
    };
    current.write_to(&mut buf, output_format)
        .map_err(|e| AppError::from(format!("Image encode error: {}", e)))?;

    let result = STANDARD.encode(buf.into_inner());

    info!("=== APPLY_LOCAL_FILTERS END === (filters: {:?}, {}ms)",
        active_filters, start.elapsed().as_millis());

    Ok(Json(result))
}

#[cfg(not(feature = "image-processing"))]
pub async fn apply_local_filters(
    Json(_req): Json<FiltersRequest>,
) -> Result<Json<String>, AppError> {
    Err(AppError::from("Image processing feature is not enabled".to_string()))
}

#[cfg(feature = "image-processing")]
pub async fn extract_metadata(
    Json(req): Json<MetadataRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};

    info!("=== EXTRACT_METADATA START ===");

    let image_bytes = STANDARD.decode(&req.image_base64)
        .map_err(|e| AppError::from(format!("Base64 decode error: {}", e)))?;

    let mut metadata = serde_json::Map::new();

    if let Ok(img) = image::load_from_memory(&image_bytes) {
        use image::GenericImageView;
        let (w, h) = img.dimensions();
        metadata.insert("width".to_string(), serde_json::json!(w));
        metadata.insert("height".to_string(), serde_json::json!(h));
        metadata.insert("color_type".to_string(), serde_json::json!(format!("{:?}", img.color())));
    }

    metadata.insert("mime_type".to_string(), serde_json::json!(req.mime_type));
    metadata.insert("file_size".to_string(), serde_json::json!(image_bytes.len()));

    let mut cursor = std::io::Cursor::new(&image_bytes);
    if let Ok(exif_data) = exif::Reader::new().read_from_container(&mut cursor) {
        let mut exif_map = serde_json::Map::new();

        for field in exif_data.fields() {
            let tag_name = format!("{}", field.tag);
            let value = format!("{}", field.display_value().with_unit(&exif_data));
            exif_map.insert(tag_name, serde_json::json!(value));
        }

        if !exif_map.is_empty() {
            metadata.insert("exif".to_string(), serde_json::Value::Object(exif_map));
        }
    }

    info!("=== EXTRACT_METADATA END ===");
    Ok(Json(serde_json::Value::Object(metadata)))
}

#[cfg(not(feature = "image-processing"))]
pub async fn extract_metadata(
    Json(_req): Json<MetadataRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(serde_json::json!({"error": "Image processing feature is not enabled"})))
}

pub async fn save_image(
    Json(req): Json<SaveRequest>,
) -> Result<Json<String>, AppError> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};

    info!("=== SAVE_IMAGE START === path: {}", req.file_path);

    let image_bytes = STANDARD.decode(&req.image_base64)
        .map_err(|e| AppError::from(format!("Base64 decode error: {}", e)))?;

    std::fs::write(&req.file_path, &image_bytes)
        .map_err(|e| AppError::from(format!("File write error: {}", e)))?;

    info!("=== SAVE_IMAGE END === ({} bytes written)", image_bytes.len());
    Ok(Json(req.file_path))
}

// ============================================
// VERIFICATION HANDLERS
// ============================================

pub async fn verify_restoration(
    State(state): State<SharedState>,
    Json(req): Json<VerifyRestorationRequest>,
) -> Result<Json<VerificationResult>, AppError> {
    info!("=== VERIFY_RESTORATION START ===");

    let (api_key, client, enabled) = {
        let state_guard = state.lock().await;
        let enabled = state_guard.settings.verification_enabled;
        let key = state_guard.get_api_key("google")
            .ok_or_else(|| AppError::from("Google API key required for verification".to_string()))?
            .clone();
        let client = state_guard.client().clone();
        (key, client, enabled)
    };

    if !enabled {
        return Err(AppError::from("Verification is disabled in settings".to_string()));
    }

    let ai = AiProvider::with_client(client);
    let result = ai.verify_restoration(&api_key, &req.original_base64, &req.restored_base64, &req.mime_type)
        .await
        .map_err(|e| AppError::from(e.to_string()))?;

    {
        let mut state_guard = state.lock().await;
        let mut entry = HistoryEntry::new(
            OperationType::Verification,
            format!("verify_restoration_{}", result.id),
            "google-flash",
        );
        entry.success = true;
        state_guard.add_history(entry);
    }

    info!("=== VERIFY_RESTORATION END === (status: {:?}, confidence: {})", result.status, result.confidence);
    Ok(Json(result))
}

pub async fn verify_detection(
    State(state): State<SharedState>,
    Json(req): Json<VerifyDetectionRequest>,
) -> Result<Json<VerificationResult>, AppError> {
    info!("=== VERIFY_DETECTION START ===");

    let (api_key, client, enabled) = {
        let state_guard = state.lock().await;
        let enabled = state_guard.settings.verification_enabled;
        let key = state_guard.get_api_key("google")
            .ok_or_else(|| AppError::from("Google API key required for verification".to_string()))?
            .clone();
        let client = state_guard.client().clone();
        (key, client, enabled)
    };

    if !enabled {
        return Err(AppError::from("Verification is disabled in settings".to_string()));
    }

    let ai = AiProvider::with_client(client);
    let result = ai.verify_detection(&api_key, &req.image_base64, &req.mime_type, &req.bounding_boxes)
        .await
        .map_err(|e| AppError::from(e.to_string()))?;

    {
        let mut state_guard = state.lock().await;
        let mut entry = HistoryEntry::new(
            OperationType::Verification,
            format!("verify_detection_{}", result.id),
            "google-flash",
        );
        entry.success = true;
        state_guard.add_history(entry);
    }

    info!("=== VERIFY_DETECTION END === (status: {:?})", result.status);
    Ok(Json(result))
}

pub async fn verify_crop(
    State(state): State<SharedState>,
    Json(req): Json<VerifyCropRequest>,
) -> Result<Json<VerificationResult>, AppError> {
    info!("=== VERIFY_CROP {} START ===", req.crop_index);

    let (api_key, client, enabled) = {
        let state_guard = state.lock().await;
        let enabled = state_guard.settings.verification_enabled;
        let key = state_guard.get_api_key("google")
            .ok_or_else(|| AppError::from("Google API key required for verification".to_string()))?
            .clone();
        let client = state_guard.client().clone();
        (key, client, enabled)
    };

    if !enabled {
        return Err(AppError::from("Verification is disabled in settings".to_string()));
    }

    let ai = AiProvider::with_client(client);
    let result = ai.verify_crop(&api_key, &req.cropped_base64, &req.mime_type, req.crop_index)
        .await
        .map_err(|e| AppError::from(e.to_string()))?;

    {
        let mut state_guard = state.lock().await;
        let mut entry = HistoryEntry::new(
            OperationType::Verification,
            format!("verify_crop_{}_{}", req.crop_index, result.id),
            "google-flash",
        );
        entry.success = true;
        state_guard.add_history(entry);
    }

    info!("=== VERIFY_CROP {} END === (status: {:?})", req.crop_index, result.status);
    Ok(Json(result))
}

// ============================================
// HISTORY & SETTINGS HANDLERS
// ============================================

pub async fn get_history(
    State(state): State<SharedState>,
) -> Result<Json<Vec<HistoryEntry>>, AppError> {
    let state = state.lock().await;
    Ok(Json(state.history.clone()))
}

pub async fn clear_history(
    State(state): State<SharedState>,
) -> Result<Json<()>, AppError> {
    let mut state = state.lock().await;
    state.clear_history();
    Ok(Json(()))
}

pub async fn get_settings(
    State(state): State<SharedState>,
) -> Result<Json<AppSettings>, AppError> {
    let state = state.lock().await;
    Ok(Json(state.settings.clone()))
}

pub async fn save_settings(
    State(state): State<SharedState>,
    Json(settings): Json<AppSettings>,
) -> Result<Json<()>, AppError> {
    let mut state = state.lock().await;
    state.settings = settings;
    Ok(Json(()))
}

pub async fn set_api_key(
    State(state): State<SharedState>,
    Json(req): Json<SetApiKeyRequest>,
) -> Result<Json<()>, AppError> {
    let mut state = state.lock().await;
    state.set_api_key(&req.provider, req.key);
    Ok(Json(()))
}
