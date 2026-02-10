use crate::ai::AiProvider;
use crate::models::{
    AiModel, AppSettings, BoundingBox, CropResult, CroppedPhoto,
    DetectionResult, HealthResponse, HistoryEntry, OperationType, ProviderStatus,
    RestorationResult, VerificationResult,
};
use crate::state::AppState;
use log::{error, info};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

type AppStateHandle = Arc<Mutex<AppState>>;

#[tauri::command]
pub async fn health_check(state: State<'_, AppStateHandle>) -> Result<HealthResponse, String> {
    let state = state.lock().await;

    Ok(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        providers: state.providers.clone(),
        uptime_seconds: state.uptime_seconds(),
    })
}

#[tauri::command]
pub async fn get_ollama_models(state: State<'_, AppStateHandle>) -> Result<Vec<AiModel>, String> {
    let client = {
        let state_guard = state.lock().await;
        state_guard.client().clone()
    };
    let ai = AiProvider::with_client(client);
    ai.get_ollama_models().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restore_image(
    state: State<'_, AppStateHandle>,
    image_base64: String,
    mime_type: String,
) -> Result<RestorationResult, String> {
    let provider_name;
    let api_key;
    let client;

    {
        let state_guard = state.lock().await;
        provider_name = state_guard
            .get_available_provider()
            .ok_or("No AI provider available")?
            .to_string();
        api_key = state_guard
            .get_api_key(&provider_name)
            .ok_or("API key not found")?
            .clone();
        client = state_guard.client().clone();
    }

    let ai = AiProvider::with_client(client);

    let result = match provider_name.as_str() {
        "google" => {
            ai.restore_with_google(&api_key, &image_base64, &mime_type)
                .await
        }
        "anthropic" => {
            ai.restore_with_anthropic(&api_key, &image_base64, &mime_type)
                .await
        }
        "openai" => {
            ai.restore_with_openai(&api_key, &image_base64, &mime_type)
                .await
        }
        "ollama" => {
             let models = ai.get_ollama_models().await.unwrap_or_default();
             let model = models.first().map(|m| m.name.clone()).unwrap_or("llama3.2:vision".to_string());
             ai.restore_with_ollama(&model, &image_base64, &mime_type).await
        }
        _ => Err(anyhow::anyhow!(
            "Restoration not supported for this provider yet"
        )),
    }
    .map_err(|e| e.to_string())?;

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

    Ok(result)
}

#[tauri::command]
pub async fn get_history(state: State<'_, AppStateHandle>) -> Result<Vec<HistoryEntry>, String> {
    let state = state.lock().await;
    Ok(state.history.clone())
}

#[tauri::command]
pub async fn clear_history(state: State<'_, AppStateHandle>) -> Result<(), String> {
    let mut state = state.lock().await;
    state.clear_history();
    Ok(())
}

#[tauri::command]
pub async fn get_providers_status(
    state: State<'_, AppStateHandle>,
) -> Result<Vec<ProviderStatus>, String> {
    let state = state.lock().await;
    Ok(state.providers.clone())
}

#[tauri::command]
pub async fn set_api_key(
    state: State<'_, AppStateHandle>,
    provider: String,
    key: String,
) -> Result<(), String> {
    let mut state = state.lock().await;
    state.set_api_key(&provider, key);
    Ok(())
}

#[tauri::command]
pub async fn get_settings(state: State<'_, AppStateHandle>) -> Result<AppSettings, String> {
    let state = state.lock().await;
    Ok(state.settings.clone())
}

#[tauri::command]
pub async fn save_settings(
    state: State<'_, AppStateHandle>,
    settings: AppSettings,
) -> Result<(), String> {
    let mut state = state.lock().await;
    state.settings = settings;
    Ok(())
}

// ============================================
// PHOTO SEPARATION COMMANDS
// ============================================

#[tauri::command]
pub async fn detect_photos(
    state: State<'_, AppStateHandle>,
    image_base64: String,
    mime_type: String,
) -> Result<DetectionResult, String> {
    info!("=== DETECT_PHOTOS START ===");
    info!("Image size: {} bytes, MIME type: {}", image_base64.len(), mime_type);

    let provider_name;
    let api_key;
    let client;

    {
        let state_guard = state.lock().await;
        provider_name = state_guard
            .get_available_provider()
            .ok_or("No AI provider available. Please configure an API key.")?
            .to_string();
        api_key = state_guard
            .get_api_key(&provider_name)
            .ok_or("API key not found")?
            .clone();
        client = state_guard.client().clone();
    }

    let ai = AiProvider::with_client(client);

    // Currently only Google Gemini supports photo detection
    let result = match provider_name.as_str() {
        "google" => ai.detect_photo_boundaries(&api_key, &image_base64, &mime_type).await,
        _ => {
            // Fallback: try google if available
            let google_key = {
                let state_guard = state.lock().await;
                state_guard.get_api_key("google").cloned()
            };
            if let Some(key) = google_key {
                ai.detect_photo_boundaries(&key, &image_base64, &mime_type).await
            } else {
                Err(anyhow::anyhow!("Photo detection requires Google Gemini Vision"))
            }
        }
    }
    .map_err(|e| e.to_string())?;

    info!("=== DETECT_PHOTOS END === (found {} photos)", result.photo_count);
    Ok(result)
}

#[cfg(feature = "image-processing")]
#[tauri::command]
pub async fn crop_photos(
    image_base64: String,
    mime_type: String,
    bounding_boxes: Vec<BoundingBox>,
    original_filename: String,
) -> Result<CropResult, String> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};
    use image::GenericImageView;

    info!("=== CROP_PHOTOS START ===");
    info!("Boxes: {}, filename: {}", bounding_boxes.len(), original_filename);

    let start = std::time::Instant::now();

    // Decode base64 image
    let image_bytes = STANDARD.decode(&image_base64)
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Image decode error: {}", e))?;

    let (img_width, img_height) = img.dimensions();
    info!("Image dimensions: {}x{}", img_width, img_height);

    let padding_factor = 0.02; // 2% padding
    let mut photos = Vec::new();

    for (idx, bbox) in bounding_boxes.iter().enumerate() {
        // Convert normalized coords (0-1000) to pixel coords
        let mut px = (bbox.x as f64 / 1000.0 * img_width as f64) as i64;
        let mut py = (bbox.y as f64 / 1000.0 * img_height as f64) as i64;
        let mut pw = (bbox.width as f64 / 1000.0 * img_width as f64) as i64;
        let mut ph = (bbox.height as f64 / 1000.0 * img_height as f64) as i64;

        // Add padding
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
        let (cw, ch) = cropped.dimensions();

        // Encode back to base64
        let mut buf = std::io::Cursor::new(Vec::new());
        let output_format = match mime_type.as_str() {
            "image/png" => image::ImageFormat::Png,
            "image/webp" => image::ImageFormat::WebP,
            _ => image::ImageFormat::Jpeg,
        };
        cropped.write_to(&mut buf, output_format)
            .map_err(|e| format!("Image encode error: {}", e))?;

        let cropped_base64 = STANDARD.encode(buf.into_inner());

        photos.push(CroppedPhoto {
            id: uuid::Uuid::new_v4().to_string(),
            index: idx,
            image_base64: cropped_base64,
            mime_type: mime_type.clone(),
            width: cw,
            height: ch,
            source_box: bbox.clone(),
        });

        info!("Cropped photo {}: {}x{}", idx, cw, ch);
    }

    let result = CropResult {
        id: uuid::Uuid::new_v4().to_string(),
        timestamp: chrono::Utc::now(),
        original_filename,
        photos,
        processing_time_ms: start.elapsed().as_millis() as u64,
    };

    info!("=== CROP_PHOTOS END === ({} photos, {}ms)", result.photos.len(), result.processing_time_ms);
    Ok(result)
}

#[cfg(not(feature = "image-processing"))]
#[tauri::command]
pub async fn crop_photos(
    _image_base64: String,
    _mime_type: String,
    _bounding_boxes: Vec<BoundingBox>,
    _original_filename: String,
) -> Result<CropResult, String> {
    Err("Image processing feature is not enabled. Rebuild with --features image-processing".to_string())
}

// ============================================
// VERIFICATION AGENT COMMANDS
// ============================================

#[tauri::command]
pub async fn verify_restoration(
    state: State<'_, AppStateHandle>,
    original_base64: String,
    restored_base64: String,
    mime_type: String,
) -> Result<VerificationResult, String> {
    info!("=== VERIFY_RESTORATION START ===");

    let (api_key, client, enabled) = {
        let state_guard = state.lock().await;
        let enabled = state_guard.settings.verification_enabled;
        let key = state_guard.get_api_key("google")
            .ok_or("Google API key required for verification")?
            .clone();
        let client = state_guard.client().clone();
        (key, client, enabled)
    };

    if !enabled {
        return Err("Verification is disabled in settings".to_string());
    }

    let ai = AiProvider::with_client(client);
    let result = ai.verify_restoration(&api_key, &original_base64, &restored_base64, &mime_type)
        .await
        .map_err(|e| e.to_string())?;

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
    Ok(result)
}

#[tauri::command]
pub async fn verify_detection(
    state: State<'_, AppStateHandle>,
    image_base64: String,
    mime_type: String,
    bounding_boxes: Vec<BoundingBox>,
) -> Result<VerificationResult, String> {
    info!("=== VERIFY_DETECTION START ===");

    let (api_key, client, enabled) = {
        let state_guard = state.lock().await;
        let enabled = state_guard.settings.verification_enabled;
        let key = state_guard.get_api_key("google")
            .ok_or("Google API key required for verification")?
            .clone();
        let client = state_guard.client().clone();
        (key, client, enabled)
    };

    if !enabled {
        return Err("Verification is disabled in settings".to_string());
    }

    let ai = AiProvider::with_client(client);
    let result = ai.verify_detection(&api_key, &image_base64, &mime_type, &bounding_boxes)
        .await
        .map_err(|e| e.to_string())?;

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
    Ok(result)
}

#[tauri::command]
pub async fn verify_crop(
    state: State<'_, AppStateHandle>,
    cropped_base64: String,
    mime_type: String,
    crop_index: usize,
) -> Result<VerificationResult, String> {
    info!("=== VERIFY_CROP {} START ===", crop_index);

    let (api_key, client, enabled) = {
        let state_guard = state.lock().await;
        let enabled = state_guard.settings.verification_enabled;
        let key = state_guard.get_api_key("google")
            .ok_or("Google API key required for verification")?
            .clone();
        let client = state_guard.client().clone();
        (key, client, enabled)
    };

    if !enabled {
        return Err("Verification is disabled in settings".to_string());
    }

    let ai = AiProvider::with_client(client);
    let result = ai.verify_crop(&api_key, &cropped_base64, &mime_type, crop_index)
        .await
        .map_err(|e| e.to_string())?;

    {
        let mut state_guard = state.lock().await;
        let mut entry = HistoryEntry::new(
            OperationType::Verification,
            format!("verify_crop_{}_{}", crop_index, result.id),
            "google-flash",
        );
        entry.success = true;
        state_guard.add_history(entry);
    }

    info!("=== VERIFY_CROP {} END === (status: {:?})", crop_index, result.status);
    Ok(result)
}
