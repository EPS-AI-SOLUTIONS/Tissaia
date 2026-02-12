// server/src/main.rs
//! Tissaia AI Studio — Standalone Axum Web Server
//! ================================================
//! Replaces the Tauri desktop shell with a pure HTTP API.
//! Deploy on Fly.io (Frankfurt region) for low-latency access.

mod ai;
mod handlers;
mod models;
mod state;

use axum::{Router, routing::{get, post, delete}};
use handlers::SharedState;
use state::AppState;
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;
use tower_http::limit::RequestBodyLimitLayer;
use tracing::info;

#[tokio::main]
async fn main() {
    // Initialize tracing (replaces tauri-plugin-log + env_logger)
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "tissaia_server=info,tower_http=info".into()),
        )
        .init();

    // Load .env file
    match dotenvy::dotenv() {
        Ok(path) => info!("Loaded .env from: {:?}", path),
        Err(e) => info!("No .env file found: {}", e),
    }

    // Debug: Check API keys
    info!("GOOGLE_API_KEY present: {}", std::env::var("GOOGLE_API_KEY").is_ok());
    info!("ANTHROPIC_API_KEY present: {}", std::env::var("ANTHROPIC_API_KEY").is_ok());
    info!("OPENAI_API_KEY present: {}", std::env::var("OPENAI_API_KEY").is_ok());

    // Create shared state
    let shared_state: SharedState = Arc::new(Mutex::new(AppState::new()));

    // CORS configuration — allow frontend origin (Vercel) + localhost dev
    let frontend_origin = std::env::var("FRONTEND_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:5175".to_string());

    let cors = CorsLayer::new()
        .allow_origin(
            frontend_origin
                .split(',')
                .filter_map(|s| s.trim().parse().ok())
                .collect::<Vec<_>>(),
        )
        .allow_methods(Any)
        .allow_headers(Any)
        .max_age(std::time::Duration::from_secs(86400)); // 24h preflight cache

    // Build router
    let app = Router::new()
        // Health & Status
        .route("/api/health", get(handlers::health_check))
        .route("/api/providers", get(handlers::get_providers_status))
        .route("/api/models/ollama", get(handlers::get_ollama_models))
        // Restoration
        .route("/api/restore", post(handlers::restore_image))
        // Photo Separation (Detection + Crop)
        .route("/api/detect", post(handlers::detect_photos))
        .route("/api/detect/retry", post(handlers::detect_photos_with_retry))
        .route("/api/crop", post(handlers::crop_photos))
        .route("/api/outpaint", post(handlers::outpaint_photo))
        // Image Processing
        .route("/api/rotate", post(handlers::rotate_image))
        .route("/api/upscale", post(handlers::upscale_image))
        .route("/api/filters", post(handlers::apply_local_filters))
        .route("/api/metadata", post(handlers::extract_metadata))
        .route("/api/save", post(handlers::save_image))
        // Verification Agent
        .route("/api/verify/restoration", post(handlers::verify_restoration))
        .route("/api/verify/detection", post(handlers::verify_detection))
        .route("/api/verify/crop", post(handlers::verify_crop))
        // History
        .route("/api/history", get(handlers::get_history))
        .route("/api/history", delete(handlers::clear_history))
        // Settings & API Keys
        .route("/api/settings", get(handlers::get_settings))
        .route("/api/settings", post(handlers::save_settings))
        .route("/api/keys", post(handlers::set_api_key))
        // Middleware
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .layer(RequestBodyLimitLayer::new(60 * 1024 * 1024)) // 60MB body limit (images)
        .with_state(shared_state);

    // Bind to port
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .unwrap_or(8080);

    let addr = format!("0.0.0.0:{}", port);
    info!("🟢 Tissaia AI Server v{} starting on {}", env!("CARGO_PKG_VERSION"), addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind address");

    // Graceful shutdown on SIGTERM/SIGINT (Fly.io sends SIGTERM)
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("Server error");
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => info!("Received Ctrl+C, shutting down..."),
        _ = terminate => info!("Received SIGTERM, shutting down..."),
    }
}
