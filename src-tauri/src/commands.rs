use crate::ai::AiProvider;
use crate::models::{
    AiModel, AnalysisResult, AppSettings, HealthResponse, HistoryEntry, OperationType, ProviderStatus,
    RestorationResult,
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
pub async fn analyze_image(
    state: State<'_, AppStateHandle>,
    image_base64: String,
    mime_type: String,
) -> Result<AnalysisResult, String> {
    info!("=== ANALYZE_IMAGE START ===");
    info!("Image size: {} bytes, MIME type: {}", image_base64.len(), mime_type);

    let provider_name;
    let api_key;

    {
        let state_guard = state.lock().await;
        info!("Available providers: {:?}", state_guard.providers.iter().map(|p| (&p.name, p.available)).collect::<Vec<_>>());

        provider_name = match state_guard.get_available_provider() {
            Some(p) => {
                info!("Selected provider: {}", p);
                p.to_string()
            }
            None => {
                error!("No AI provider available! Check API keys in .env");
                return Err("No AI provider available. Please configure an API key.".to_string());
            }
        };

        api_key = match state_guard.get_api_key(&provider_name) {
            Some(k) => {
                info!("API key found for {} (length: {})", provider_name, k.len());
                k.clone()
            }
            None => {
                error!("API key not found for provider: {}", provider_name);
                return Err("API key not found".to_string());
            }
        };
    }

    let ai = AiProvider::new();
    info!("Calling {} API...", provider_name);

    // Try primary provider first
    let mut result = match provider_name.as_str() {
        "google" => {
            info!("Using Google Gemini for analysis");
            ai.analyze_with_google(&api_key, &image_base64, &mime_type).await
        }
        "anthropic" => {
            info!("Using Anthropic Claude for analysis");
            ai.analyze_with_anthropic(&api_key, &image_base64, &mime_type).await
        }
        "openai" => {
            info!("Using OpenAI GPT-4 for analysis");
            ai.analyze_with_openai(&api_key, &image_base64, &mime_type).await
        }
        _ => {
            error!("Unsupported provider: {}", provider_name);
            Err(anyhow::anyhow!("Unsupported provider"))
        }
    };

    // If primary provider fails, try fallback providers
    if result.is_err() {
        error!("Primary provider {} failed, trying fallbacks...", provider_name);

        // Get fallback info while holding lock briefly
        let fallback_info: Vec<(String, String)> = {
            let state_guard = state.lock().await;
            state_guard.providers.iter()
                .filter(|p| p.enabled && p.available && p.name != provider_name)
                .filter_map(|p| {
                    state_guard.get_api_key(&p.name)
                        .map(|k| (p.name.clone(), k.clone()))
                })
                .collect()
        };

        for (fallback_name, fallback_key) in fallback_info {
            info!("Trying fallback provider: {}", fallback_name);
            let fallback_result = match fallback_name.as_str() {
                "google" => ai.analyze_with_google(&fallback_key, &image_base64, &mime_type).await,       
                "anthropic" => ai.analyze_with_anthropic(&fallback_key, &image_base64, &mime_type).await, 
                                "openai" => ai.analyze_with_openai(&fallback_key, &image_base64, &mime_type).await,
                "ollama" => {
                     let models = ai.get_ollama_models().await.unwrap_or_default();
                     let model = models.first().map(|m| m.name.clone()).unwrap_or("llama3.2:vision".to_string());
                     ai.analyze_with_ollama(&model, &image_base64, &mime_type).await
                },
                _ => continue,
            };

            if fallback_result.is_ok() {
                info!("Fallback provider {} succeeded!", fallback_name);
                result = fallback_result;
                break;
            } else {
                error!("Fallback provider {} also failed", fallback_name);
            }
        }
    }

    match &result {
        Ok(analysis) => {
            info!("=== ANALYSIS SUCCESS ===");
            info!("Damage score: {}%", analysis.damage_score);
            info!("Damage types found: {}", analysis.damage_types.len());
            info!("Recommendations: {}", analysis.recommendations.len());
        }
        Err(e) => {
            error!("=== ANALYSIS FAILED ===");
            error!("Error: {}", e);
        }
    }

    let result = result.map_err(|e| {
        let err_msg = e.to_string();
        error!("Analysis error: {}", err_msg);
        err_msg
    })?;

    // Add to history
    {
        let mut state_guard = state.lock().await;
        let mut entry = HistoryEntry::new(
            OperationType::Analysis,
            image_base64[..100.min(image_base64.len())].to_string(),
            &provider_name,
        );
        entry.success = true;
        state_guard.add_history(entry);
        info!("Added to history");
    }

    info!("=== ANALYZE_IMAGE END ===");
    Ok(result)
}

#[tauri::command]
pub async fn get_ollama_models() -> Result<Vec<AiModel>, String> {
    let ai = AiProvider::new();
    ai.get_ollama_models().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restore_image(
    state: State<'_, AppStateHandle>,
    image_base64: String,
    mime_type: String,
    analysis: AnalysisResult,
) -> Result<RestorationResult, String> {
    let provider_name;
    let api_key;

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
    }

    let ai = AiProvider::new();

    let result = match provider_name.as_str() {
        "google" => {
            ai.restore_with_google(&api_key, &image_base64, &mime_type, &analysis)
                .await
        }
        "anthropic" => {
            ai.restore_with_anthropic(&api_key, &image_base64, &mime_type, &analysis)
                .await
        }
        "openai" => {
            ai.restore_with_openai(&api_key, &image_base64, &mime_type, &analysis)
                .await
        }
        "ollama" => {
             let models = ai.get_ollama_models().await.unwrap_or_default();
             let model = models.first().map(|m| m.name.clone()).unwrap_or("llama3.2:vision".to_string());
             ai.restore_with_ollama(&model, &image_base64, &mime_type, &analysis).await
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


