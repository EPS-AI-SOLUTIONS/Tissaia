use crate::models::{AppSettings, HistoryEntry, ProviderStatus};
use std::collections::HashMap;
use std::time::Instant;

pub struct AppState {
    pub history: Vec<HistoryEntry>,
    pub settings: AppSettings,
    pub api_keys: HashMap<String, String>,
    pub providers: Vec<ProviderStatus>,
    pub start_time: Instant,
}

impl AppState {
    pub fn new() -> Self {
        let api_keys = Self::load_api_keys();
        let providers = Self::init_providers(&api_keys);

        Self {
            history: Vec::new(),
            settings: AppSettings::default(),
            api_keys,
            providers,
            start_time: Instant::now(),
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
                name: "anthropic".to_string(),
                enabled: true,
                available: api_keys.contains_key("anthropic"),
                priority: 1, // High Quality (Claude 3.5 Sonnet)
                last_error: None,
            },
            ProviderStatus {
                name: "openai".to_string(),
                enabled: true,
                available: api_keys.contains_key("openai"),
                priority: 2, // High Quality (GPT-4o)
                last_error: None,
            },
            ProviderStatus {
                name: "google".to_string(),
                enabled: true,
                available: api_keys.contains_key("google"),
                priority: 3, // High Speed/Context
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
                available: true,
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

    pub fn get_available_provider(&self) -> Option<&str> {
        self.providers
            .iter()
            .filter(|p| p.enabled && p.available)
            .min_by_key(|p| p.priority)
            .map(|p| p.name.as_str())
    }

    pub fn add_history(&mut self, entry: HistoryEntry) {
        self.history.insert(0, entry);
        // Keep only last 100 entries
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


