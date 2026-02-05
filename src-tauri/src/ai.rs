use crate::models::{AnalysisResult, DamageType, RestorationResult, Severity, AiModel};
use anyhow::{anyhow, Result};
use log::{debug, error, info};
use reqwest::Client;
use serde_json::json;

pub struct AiProvider {
    client: Client,
}

impl AiProvider {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    // ========== Google Gemini ==========
    pub async fn analyze_with_google(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
    ) -> Result<AnalysisResult> {
        info!("=== GOOGLE GEMINI API CALL ===");
        info!("API key length: {}", api_key.len());
        info!("Image base64 length: {} bytes", image_base64.len());
        info!("MIME type: {}", mime_type);

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={}",
            api_key
        );
        info!("Request URL: {}", url.replace(api_key, "***"));

        let prompt = r#"Analyze this photo for damage and deterioration. Return a JSON object with:
{
    "damage_score": 0-100 (overall damage percentage),
    "damage_types": [
        {
            "name": "damage type name",
            "severity": "low|medium|high|critical",
            "description": "detailed description",
            "area_percentage": 0-100
        }
    ],
    "recommendations": ["recommendation 1", "recommendation 2"]
}
Look for: scratches, tears, fading, water damage, mold, discoloration, missing parts, creases, stains.
Return ONLY valid JSON, no markdown."#;

                let body = json!({
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_base64
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json"
            }
        });

        info!("Sending request to Google Gemini...");
        let response = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await?;

        let status = response.status();
        info!("Response status: {}", status);

        if !status.is_success() {
            let error_text = response.text().await?;
            error!("Google API error response: {}", error_text);
            return Err(anyhow!("Google API error: {}", error_text));
        }

        let data: serde_json::Value = response.json().await?;
        debug!("Full response: {:?}", data);

        let text = data["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .ok_or_else(|| {
                error!("Invalid response format. Data: {:?}", data);
                anyhow!("Invalid response format")
            })?;

        info!("AI response text length: {} chars", text.len());
        debug!("AI response: {}", text);

        self.parse_analysis_response(text, "google")
    }

    pub async fn restore_with_google(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
        analysis: &AnalysisResult,
    ) -> Result<RestorationResult> {
        // Google Gemini for image analysis and recommendations
        // Actual restoration would need a dedicated image generation API
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={}",
            api_key
        );

        let damage_summary: String = analysis
            .damage_types
            .iter()
            .map(|d| format!("- {}: {}", d.name, d.description))
            .collect::<Vec<_>>()
            .join("\n");

        let prompt = format!(
            r#"Based on this damaged photo analysis:
{}

Provide detailed restoration instructions as JSON:
{{
    "improvements": ["specific improvement 1", "specific improvement 2"],
    "processing_steps": ["step 1", "step 2"],
    "estimated_quality_improvement": 0-100
}}
Return ONLY valid JSON."#,
            damage_summary
        );

                let body = json!({
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_base64
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json"
            }
        });

        let start = std::time::Instant::now();
        let response = self.client.post(&url).json(&body).send().await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Google API error: {}", error_text));
        }

        let data: serde_json::Value = response.json().await?;
        let text = data["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow!("Invalid response format"))?;

        let mut result = RestorationResult::new("google", image_base64.to_string());
        result.processing_time_ms = start.elapsed().as_millis() as u64;

        // Parse improvements from response
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(text) {
            if let Some(improvements) = parsed["improvements"].as_array() {
                result.improvements = improvements
                    .iter()
                    .filter_map(|v| v.as_str())
                    .map(|s| s.to_string())
                    .collect();
            }
        }

        // For now, return the original image as "restored"
        // Real implementation would use an image generation/editing API
        result.restored_image = image_base64.to_string();

        Ok(result)
    }

    // ========== Anthropic Claude ==========
    pub async fn analyze_with_anthropic(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
    ) -> Result<AnalysisResult> {
        info!("=== ANTHROPIC CLAUDE API CALL ===");
        info!("API key length: {}", api_key.len());
        info!("Image base64 length: {} bytes", image_base64.len());
        info!("MIME type: {}", mime_type);

        let url = "https://api.anthropic.com/v1/messages";
        info!("Request URL: {}", url);

        let prompt = r#"Analyze this photo for damage and deterioration. Return a JSON object with:
{
    "damage_score": 0-100,
    "damage_types": [{"name": "type", "severity": "low|medium|high|critical", "description": "desc", "area_percentage": 0-100}],
    "recommendations": ["rec1", "rec2"]
}
Return ONLY valid JSON."#;

        let body = json!({
            "model": "claude-3-5-sonnet-20240620",
            "max_tokens": 2048,
            "messages": [{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": image_base64
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }]
        });

        info!("Sending request to Anthropic Claude...");
        let response = self
            .client
            .post(url)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await?;

        let status = response.status();
        info!("Response status: {}", status);

        if !status.is_success() {
            let error_text = response.text().await?;
            error!("Anthropic API error response: {}", error_text);
            return Err(anyhow!("Anthropic API error: {}", error_text));
        }

        let data: serde_json::Value = response.json().await?;
        debug!("Full response: {:?}", data);

        let text = data["content"][0]["text"]
            .as_str()
            .ok_or_else(|| {
                error!("Invalid Anthropic response format. Data: {:?}", data);
                anyhow!("Invalid response format")
            })?;

        info!("AI response text length: {} chars", text.len());
        self.parse_analysis_response(text, "anthropic")
    }

    pub async fn restore_with_anthropic(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
        analysis: &AnalysisResult,
    ) -> Result<RestorationResult> {
        let url = "https://api.anthropic.com/v1/messages";
        let damage_summary: String = analysis.damage_types.iter().map(|d| format!("- {}: {}", d.name, d.description)).collect::<Vec<_>>().join("\n");
        let prompt = format!(r#"Based on this analysis:
{}
Provide detailed restoration instructions as JSON: {{"improvements": ["imp1"], "processing_steps": ["step1"], "estimated_quality_improvement": 0-100}}. Return ONLY valid JSON."#, damage_summary);

        let body = json!({
            "model": "claude-3-5-sonnet-20240620",
            "max_tokens": 2048,
            "messages": [{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": image_base64
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }]
        });

        let start = std::time::Instant::now();
        let response = self.client.post(url)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Anthropic API error: {}", response.text().await?));
        }

        let data: serde_json::Value = response.json().await?;
        let text = data["content"][0]["text"].as_str().ok_or_else(|| anyhow!("Invalid response"))?;

        let mut result = RestorationResult::new("anthropic", image_base64.to_string());
        result.processing_time_ms = start.elapsed().as_millis() as u64;
        result.restored_image = image_base64.to_string();

        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(text) {
             if let Some(imp) = parsed["improvements"].as_array() {
                 result.improvements = imp.iter().filter_map(|v| v.as_str()).map(|s| s.to_string()).collect();
             }
        }
        Ok(result)
    }

    // ========== OpenAI GPT-4 Vision ==========
    pub async fn analyze_with_openai(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
    ) -> Result<AnalysisResult> {
        info!("=== OPENAI GPT-4 API CALL ===");
        info!("API key length: {}", api_key.len());
        info!("Image base64 length: {} bytes", image_base64.len());
        info!("MIME type: {}", mime_type);

        let url = "https://api.openai.com/v1/chat/completions";
        info!("Request URL: {}", url);

        let prompt = r#"Analyze this photo for damage. Return JSON:
{"damage_score": 0-100, "damage_types": [{"name": "", "severity": "low|medium|high|critical", "description": "", "area_percentage": 0-100}], "recommendations": []}
Return ONLY valid JSON."#;

        let image_url = format!("data:{};base64,{}", mime_type, image_base64);

        let body = json!({
            "model": "gpt-4o",
            "messages": [{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url,
                            "detail": "high"
                        }
                    }
                ]
            }],
            "max_tokens": 2048
        });

        info!("Sending request to OpenAI GPT-4...");
        let response = self
            .client
            .post(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&body)
            .send()
            .await?;

        let status = response.status();
        info!("Response status: {}", status);

        if !status.is_success() {
            let error_text = response.text().await?;
            error!("OpenAI API error response: {}", error_text);
            return Err(anyhow!("OpenAI API error: {}", error_text));
        }

        let data: serde_json::Value = response.json().await?;
        debug!("Full response: {:?}", data);

        let text = data["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| {
                error!("Invalid OpenAI response format. Data: {:?}", data);
                anyhow!("Invalid response format")
            })?;

        info!("AI response text length: {} chars", text.len());
        self.parse_analysis_response(text, "openai")
    }

    pub async fn restore_with_openai(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
        analysis: &AnalysisResult,
    ) -> Result<RestorationResult> {
        let url = "https://api.openai.com/v1/chat/completions";
        let damage_summary: String = analysis.damage_types.iter().map(|d| format!("- {}: {}", d.name, d.description)).collect::<Vec<_>>().join("\n");
        let prompt = format!(r#"Based on analysis: {}
Provide detailed restoration instructions as JSON: {{"improvements": ["imp1"], "processing_steps": ["step1"], "estimated_quality_improvement": 0-100}}. Return ONLY valid JSON."#, damage_summary);

        let image_url = format!("data:{};base64,{}", mime_type, image_base64);
        let body = json!({
            "model": "gpt-4o",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url, "detail": "high"}}
                ]
            }],
            "max_tokens": 2048
        });

        let start = std::time::Instant::now();
        let response = self.client.post(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("OpenAI API error: {}", response.text().await?));
        }

        let data: serde_json::Value = response.json().await?;
        let text = data["choices"][0]["message"]["content"].as_str().ok_or_else(|| anyhow!("Invalid response"))?;

        let mut result = RestorationResult::new("openai", image_base64.to_string());
        result.processing_time_ms = start.elapsed().as_millis() as u64;
        result.restored_image = image_base64.to_string();

        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(text) {
             if let Some(imp) = parsed["improvements"].as_array() {
                 result.improvements = imp.iter().filter_map(|v| v.as_str()).map(|s| s.to_string()).collect();
             }
        }
        Ok(result)
    }

        // ========== Ollama ==========
    pub async fn get_ollama_models(&self) -> Result<Vec<AiModel>> {
        let ollama_host = std::env::var("OLLAMA_HOST").unwrap_or_else(|_| "http://127.0.0.1:11434".to_string());
        let url = format!("{}/api/tags", ollama_host);
        
        info!("Fetching Ollama models from {}", url);

        let response = self.client.get(&url).send().await?;
        
        if !response.status().is_success() {
            return Err(anyhow!("Failed to fetch Ollama models"));
        }

        let data: serde_json::Value = response.json().await?;
        let mut models = Vec::new();

        if let Some(model_list) = data["models"].as_array() {
            for m in model_list {
                if let Some(name) = m["name"].as_str() {
                    models.push(AiModel {
                        id: name.to_string(),
                        name: name.to_string(),
                        provider: "ollama".to_string(),
                    });
                }
            }
        }

        Ok(models)
    }

    pub async fn analyze_with_ollama(
        &self,
        model: &str,
        image_base64: &str,
        _mime_type: &str,
    ) -> Result<AnalysisResult> {
        info!("=== OLLAMA API CALL ({}) ===", model);
        let ollama_host = std::env::var("OLLAMA_HOST").unwrap_or_else(|_| "http://127.0.0.1:11434".to_string());
        let url = format!("{}/api/generate", ollama_host);

        let prompt = r#"Analyze this photo for damage. Return JSON:
{"damage_score": 0-100, "damage_types": [{"name": "type", "severity": "low|medium|high|critical", "description": "desc", "area_percentage": 0-100}], "recommendations": []}
Return ONLY valid JSON."#;

        let body = json!({
            "model": model,
            "prompt": prompt,
            "images": [image_base64],
            "stream": false,
            "format": "json"
        });

        info!("Sending request to Ollama...");
        let response = self.client.post(&url).json(&body).send().await?;

        if !response.status().is_success() {
             let error_text = response.text().await?;
             return Err(anyhow!("Ollama API error: {}", error_text));
        }

        let data: serde_json::Value = response.json().await?;
        let text = data["response"].as_str().ok_or_else(|| anyhow!("Invalid Ollama response"))?;
        
        self.parse_analysis_response(text, "ollama")
    }

    pub async fn restore_with_ollama(
        &self,
        model: &str,
        image_base64: &str,
        _mime_type: &str,
        analysis: &AnalysisResult,
    ) -> Result<RestorationResult> {
        let ollama_host = std::env::var("OLLAMA_HOST").unwrap_or_else(|_| "http://127.0.0.1:11434".to_string());
        let url = format!("{}/api/generate", ollama_host);

        let damage_summary: String = analysis.damage_types.iter().map(|d| format!("- {}: {}", d.name, d.description)).collect::<Vec<_>>().join("\n");
        let prompt = format!(r#"Based on this analysis:
{}
Provide detailed restoration instructions as JSON: {{"improvements": ["imp1"], "processing_steps": ["step1"], "estimated_quality_improvement": 0-100}}. Return ONLY valid JSON."#, damage_summary);

        let body = json!({
            "model": model,
            "prompt": prompt,
            "images": [image_base64],
            "stream": false,
            "format": "json"
        });

        let start = std::time::Instant::now();
        let response = self.client.post(&url).json(&body).send().await?;

        if !response.status().is_success() {
             return Err(anyhow!("Ollama API error: {}", response.text().await?));
        }

        let data: serde_json::Value = response.json().await?;
        let text = data["response"].as_str().ok_or_else(|| anyhow!("Invalid Ollama response"))?;

        let mut result = RestorationResult::new("ollama", image_base64.to_string());
        result.processing_time_ms = start.elapsed().as_millis() as u64;
        result.restored_image = image_base64.to_string();

        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(text) {
             if let Some(imp) = parsed["improvements"].as_array() {
                 result.improvements = imp.iter().filter_map(|v| v.as_str()).map(|s| s.to_string()).collect();
             }
        }
        Ok(result)
    }

    // ========== Helper: Parse Analysis Response ==========
    fn parse_analysis_response(&self, text: &str, provider: &str) -> Result<AnalysisResult> {
        info!("=== PARSING AI RESPONSE ===");
        info!("Provider: {}, Raw text length: {}", provider, text.len());

        // Clean JSON from markdown code blocks
        let clean_text = text
            .trim()
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        debug!("Cleaned text: {}", clean_text);

        let parsed: serde_json::Value =
            serde_json::from_str(clean_text).map_err(|e| {
                error!("JSON parse error: {}. Text was: {}", e, clean_text);
                anyhow!("JSON parse error: {}", e)
            })?;

        info!("JSON parsed successfully");

        let mut result = AnalysisResult::new(provider);

        result.damage_score = parsed["damage_score"].as_f64().unwrap_or(0.0) as f32;

        if let Some(types) = parsed["damage_types"].as_array() {
            result.damage_types = types
                .iter()
                .filter_map(|t| {
                    Some(DamageType {
                        name: t["name"].as_str()?.to_string(),
                        severity: match t["severity"].as_str()?.to_lowercase().as_str() {
                            "low" => Severity::Low,
                            "medium" => Severity::Medium,
                            "high" => Severity::High,
                            "critical" => Severity::Critical,
                            _ => Severity::Low,
                        },
                        description: t["description"].as_str()?.to_string(),
                        area_percentage: t["area_percentage"].as_f64()? as f32,
                    })
                })
                .collect();
        }

        if let Some(recs) = parsed["recommendations"].as_array() {
            result.recommendations = recs
                .iter()
                .filter_map(|r| r.as_str())
                .map(|s| s.to_string())
                .collect();
        }

        Ok(result)
    }
}

impl Default for AiProvider {
    fn default() -> Self {
        Self::new()
    }
}
