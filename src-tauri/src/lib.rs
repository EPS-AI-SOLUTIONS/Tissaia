mod ai;
mod commands;
mod models;
mod state;

use state::AppState;
use std::sync::Arc;
use tokio::sync::Mutex;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load environment variables
    match dotenvy::dotenv() {
        Ok(path) => println!("[Tissaia] Loaded .env from: {:?}", path),
        Err(e) => println!("[Tissaia] No .env file found or error: {}", e),
    }

    // Debug: Check if API keys are loaded
    println!("[Tissaia] GOOGLE_API_KEY present: {}", std::env::var("GOOGLE_API_KEY").is_ok());
    println!("[Tissaia] ANTHROPIC_API_KEY present: {}", std::env::var("ANTHROPIC_API_KEY").is_ok());
    println!("[Tissaia] OPENAI_API_KEY present: {}", std::env::var("OPENAI_API_KEY").is_ok());

    let app_state = Arc::new(Mutex::new(AppState::new()));

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build()
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::health_check,
            commands::analyze_image,
            commands::get_ollama_models,
            commands::restore_image,
            commands::get_history,
            commands::clear_history,
            commands::get_providers_status,
            commands::set_api_key,
            commands::get_settings,
            commands::save_settings,
            commands::detect_photos,
            commands::crop_photos,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tissaia AI");
}

