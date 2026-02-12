// server/src/state.rs
//! Application state — identical to src-tauri/src/state.rs
//! No Tauri dependencies. Pure Rust state management.

use crate::models::{AppSettings, HistoryEntry, ProviderStatus};
use reqwest::Client;
use std::collections::HashMap;
use std::time::{Duration, Instant};

pub struct AppState {
    pub history: Vec<HistoryEntry>,
    pub settings: AppSettings,
    pub api_keys: HashMap<String, String>,
    pub providers: Vec<ProviderStatus>,
    pub start_time: Instant,
    client: Client,
}

impl AppState {
    pub fn new() -> Self {
        let api_keys = Self::load_api_keys();
        let providers = Self::init_providers(&api_keys);

        let client = Client::builder()
            .timeout(Duration::from_secs(120))
            .connect_timeout(Duration::from_secs(5))
            .build()
            .unwrap_or_default();

        Self {
            history: Vec::new(),
            settings: AppSettings::default(),
            api_keys,
            providers,
            start_time: Instant::now(),
            client,
        }
    }

    fn load_api_keys() -> HashMap<String, String> {
        let mut keys = HashMap::new();

        if let Ok(key) = std::env::var("GOOGLE_API_KEY") {
            keys.insert("google".to_string(), key);
        }
        if let Ok(key) = std::env::var("ANTHROPIC_API_KEY") {
            keys.insert("anthropic".to_string(), key);
        }
        if let Ok(key) = std::env::var("OPENAI_API_KEY") {
            keys.insert("openai".to_string(), key);
        }
        if let Ok(key) = std::env::var("MISTRAL_API_KEY") {
            keys.insert("mistral".to_string(), key);
        }
        if let Ok(key) = std::env::var("GROQ_API_KEY") {
            keys.insert("groq".to_string(), key);
        }

        keys
    }

    fn init_providers(api_keys: &HashMap<String, String>) -> Vec<ProviderStatus> {
        vec![
            ProviderStatus {
                name: "google".to_string(),
                enabled: true,
                available: api_keys.contains_key("google"),
                priority: 1,
                last_error: None,
            },
            ProviderStatus {
                name: "anthropic".to_string(),
                enabled: true,
                available: api_keys.contains_key("anthropic"),
                priority: 2,
                last_error: None,
            },
            ProviderStatus {
                name: "openai".to_string(),
                enabled: true,
                available: api_keys.contains_key("openai"),
                priority: 3,
                last_error: None,
            },
            ProviderStatus {
                name: "mistral".to_string(),
                enabled: true,
                available: api_keys.contains_key("mistral"),
                priority: 4,
                last_error: None,
            },
            ProviderStatus {
                name: "groq".to_string(),
                enabled: true,
                available: api_keys.contains_key("groq"),
                priority: 5,
                last_error: None,
            },
            ProviderStatus {
                name: "ollama".to_string(),
                enabled: true,
                available: false,
                priority: 6,
                last_error: None,
            },
        ]
    }

    pub fn set_api_key(&mut self, provider: &str, key: String) {
        self.api_keys.insert(provider.to_string(), key);
        self.update_provider_availability(provider, true);
    }

    pub fn get_api_key(&self, provider: &str) -> Option<&String> {
        self.api_keys.get(provider)
    }

    fn update_provider_availability(&mut self, provider: &str, available: bool) {
        if let Some(p) = self.providers.iter_mut().find(|p| p.name == provider) {
            p.available = available;
        }
    }

    pub fn client(&self) -> &Client {
        &self.client
    }

    pub fn get_available_provider(&self) -> Option<&str> {
        if let Some(ref preferred) = self.settings.preferred_provider {
            if let Some(provider) = self.providers.iter().find(|p| &p.name == preferred && p.enabled && p.available) {
                return Some(&provider.name);
            }
        }
        self.providers
            .iter()
            .filter(|p| p.enabled && p.available)
            .min_by_key(|p| p.priority)
            .map(|p| p.name.as_str())
    }

    pub fn add_history(&mut self, entry: HistoryEntry) {
        self.history.insert(0, entry);
        if self.history.len() > 100 {
            self.history.truncate(100);
        }
    }

    pub fn clear_history(&mut self) {
        self.history.clear();
    }

    pub fn uptime_seconds(&self) -> u64 {
        self.start_time.elapsed().as_secs()
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
