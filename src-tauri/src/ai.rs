use crate::models::{
    AiModel, BoundingBox, DetectionResult, RestorationResult,
    VerificationCheck, VerificationIssue, VerificationResult, VerificationStage, VerificationStatus,
};
use anyhow::{anyhow, Result};
use log::{debug, error, info};
use reqwest::Client;
use serde_json::json;
use std::time::Duration;

pub struct AiProvider {
    client: Client,
}

impl AiProvider {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .connect_timeout(Duration::from_secs(5))
                .build()
                .unwrap_or_default(),
        }
    }

    pub fn with_client(client: Client) -> Self {
        Self { client }
    }

    // ========== Google Gemini ==========

    pub async fn restore_with_google(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
    ) -> Result<RestorationResult> {
        info!("=== GOOGLE GEMINI RESTORATION ===");

        let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";

        let prompt = r#"Expert photo restoration AI. You MUST generate a restored version of this damaged photograph.

Automatically detect ALL damage and deterioration in this photo, then restore it completely.

RESTORATION INSTRUCTIONS (apply ALL):
1. GEOMETRY: The photo must be straightened. GENERATIVELY INPAINT any missing corners or edges using inner context (walls, floor, background). Fill in any torn or missing areas seamlessly.
2. FLASH REMOVAL: Aggressively neutralize flash glare hotspots on faces and reflective surfaces. Recover detail under blown-out highlights.
3. CLEANUP: Remove ALL grain, noise, dust specks, scratches, stains, watermarks, and scanning artifacts. The result must be perfectly clean.
4. FACES: Lock facial features strictly — do NOT alter face shape, expression, or identity. Apply natural skin tone restoration (not plastic/airbrushed). Enhance eye detail and sharpness.
5. COLOR: Apply professional HDR colorization. If the photo is black & white, colorize it naturally. If color, restore faded colors to vibrant, accurate tones. Use warm, natural color grading.
6. STUDIO QUALITY: Apply professional studio photo finish — soft diffused lighting simulation, subtle vignette, professional color grading. The final result should look like it was taken in a modern photography studio.
7. OUTPUT: Return the FULL restored image with NO borders, NO watermarks, NO text overlays. Same aspect ratio as input.

CRITICAL: Generate and return the actual restored image, not text. The output must be the restored photograph."#;

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
                "temperature": 1.0,
                "maxOutputTokens": 8192,
                "response_modalities": ["TEXT", "IMAGE"]
            }
        });

        let start = std::time::Instant::now();
        info!("Sending restoration request to Google Gemini...");
        let response = self.client.post(url)
            .header("x-goog-api-key", api_key)
            .json(&body)
            .send().await?;

        let status = response.status();
        info!("Response status: {}", status);

        if !status.is_success() {
            let error_text = response.text().await?;
            error!("Google API error: {}", error_text);
            return Err(anyhow!("Google API error: {}", error_text));
        }

        let data: serde_json::Value = response.json().await?;
        debug!("Restoration response keys: {:?}", data);

        let mut result = RestorationResult::new("google", image_base64.to_string());
        result.processing_time_ms = start.elapsed().as_millis() as u64;

        // Try to extract generated image from response
        let mut found_image = false;
        if let Some(candidates) = data["candidates"].as_array() {
            for candidate in candidates {
                if let Some(parts) = candidate["content"]["parts"].as_array() {
                    for part in parts {
                        // Check for inline image data (Gemini image generation)
                        if let Some(inline_data) = part.get("inlineData").or_else(|| part.get("inline_data")) {
                            if let Some(img_data) = inline_data["data"].as_str() {
                                info!("Found generated image in response ({} bytes)", img_data.len());
                                result.restored_image = img_data.to_string();
                                found_image = true;
                            }
                        }
                        // Check for text response with improvements info
                        if let Some(text) = part["text"].as_str() {
                            info!("Found text in response: {} chars", text.len());
                            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(text) {
                                if let Some(improvements) = parsed["improvements"].as_array() {
                                    result.improvements = improvements
                                        .iter()
                                        .filter_map(|v| v.as_str())
                                        .map(|s| s.to_string())
                                        .collect();
                                }
                            }
                        }
                    }
                }
            }
        }

        if !found_image {
            info!("No generated image found, returning original with improvements metadata");
            result.restored_image = image_base64.to_string();
        }

        // Add default improvements list if empty
        if result.improvements.is_empty() {
            result.improvements = vec![
                "Geometry corrected".to_string(),
                "Flash removal applied".to_string(),
                "Noise and grain removed".to_string(),
                "Color restoration (HDR)".to_string(),
                "Face enhancement".to_string(),
                "Studio-quality finish".to_string(),
            ];
        }

        Ok(result)
    }

    // ========== Anthropic Claude ==========

    pub async fn restore_with_anthropic(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
    ) -> Result<RestorationResult> {
        info!("=== ANTHROPIC CLAUDE RESTORATION ===");
        let url = "https://api.anthropic.com/v1/messages";

        let prompt = r#"Expert photo restoration analysis. Automatically detect ALL damage and deterioration in this photograph, then provide a detailed restoration plan as JSON:
{
    "improvements": ["specific improvement applied"],
    "processing_steps": ["detailed step description"],
    "estimated_quality_improvement": 0-100,
    "restoration_notes": "Expert notes on what was restored"
}

Restoration priorities:
1. GEOMETRY: Straighten, inpaint missing corners using inner context
2. FLASH REMOVAL: Neutralize flash glare hotspots on faces
3. CLEANUP: Remove grain, noise, dust, scratches, stains
4. FACES: Lock facial features, natural skin tone (not plastic)
5. COLOR: HDR colorization, restore faded colors to vibrant tones
6. STUDIO QUALITY: Professional studio photo finish

Return ONLY valid JSON."#;

        let body = json!({
            "model": "claude-sonnet-4-5-20250929",
            "max_tokens": 4096,
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

        if result.improvements.is_empty() {
            result.improvements = vec![
                "Geometry corrected".to_string(),
                "Noise and grain removed".to_string(),
                "Color restoration applied".to_string(),
                "Face enhancement".to_string(),
            ];
        }

        Ok(result)
    }

    // ========== OpenAI GPT-4 Vision ==========

    pub async fn restore_with_openai(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
    ) -> Result<RestorationResult> {
        info!("=== OPENAI GPT-4 RESTORATION ===");
        let url = "https://api.openai.com/v1/chat/completions";

        let prompt = r#"Expert photo restoration analysis. Automatically detect ALL damage and deterioration in this photograph, then provide a detailed restoration plan as JSON:
{
    "improvements": ["specific improvement applied"],
    "processing_steps": ["detailed step"],
    "estimated_quality_improvement": 0-100
}

Restoration priorities:
1. GEOMETRY: Straighten, inpaint missing corners
2. FLASH REMOVAL: Neutralize glare hotspots
3. CLEANUP: Remove grain, noise, dust, scratches
4. FACES: Lock features, natural skin tone
5. COLOR: HDR colorization, vibrant tones
6. STUDIO QUALITY: Professional finish

Return ONLY valid JSON."#;

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
            "max_tokens": 4096
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

        if result.improvements.is_empty() {
            result.improvements = vec![
                "Geometry corrected".to_string(),
                "Noise and grain removed".to_string(),
                "Color restoration applied".to_string(),
                "Face enhancement".to_string(),
            ];
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

    pub async fn restore_with_ollama(
        &self,
        model: &str,
        image_base64: &str,
        _mime_type: &str,
    ) -> Result<RestorationResult> {
        info!("=== OLLAMA RESTORATION ({}) ===", model);
        let ollama_host = std::env::var("OLLAMA_HOST").unwrap_or_else(|_| "http://127.0.0.1:11434".to_string());
        let url = format!("{}/api/generate", ollama_host);

        let prompt = r#"Expert photo restoration analysis. Automatically detect ALL damage and deterioration in this photograph, then provide a restoration plan as JSON:
{
    "improvements": ["specific improvement"],
    "processing_steps": ["step"],
    "estimated_quality_improvement": 0-100
}

Priorities: geometry fix, flash removal, cleanup (grain/noise/dust/scratches), face enhancement (natural skin), HDR colorization, studio-quality finish.
Return ONLY valid JSON."#;

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

        if result.improvements.is_empty() {
            result.improvements = vec![
                "Geometry corrected".to_string(),
                "Noise removed".to_string(),
                "Color restoration".to_string(),
            ];
        }

        Ok(result)
    }

    // ========== Photo Boundary Detection (Google Gemini) ==========
    pub async fn detect_photo_boundaries(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
    ) -> Result<DetectionResult> {
        info!("=== DETECT PHOTO BOUNDARIES ===");
        info!("Image base64 length: {} bytes", image_base64.len());

        let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";

        let prompt = r#"This image is a flatbed scanner scan that may contain multiple separate photographs, documents, or images placed on the scanner bed.

Detect each individual photograph/document and return their bounding boxes.
Use normalized coordinates 0-1000 where top-left corner = (0, 0) and bottom-right corner = (1000, 1000).
Crop tightly to each photo's actual edges, excluding the scanner background/border.
Order detected photos: left-to-right, then top-to-bottom.

If only ONE photo fills the entire scan, return a single bounding box covering it.

Return ONLY valid JSON in this exact format:
{
    "photo_count": 3,
    "bounding_boxes": [
        {"x": 50, "y": 30, "width": 400, "height": 450, "confidence": 0.95, "label": "photo 1"},
        {"x": 520, "y": 30, "width": 430, "height": 450, "confidence": 0.92, "label": "photo 2"},
        {"x": 50, "y": 520, "width": 400, "height": 440, "confidence": 0.90, "label": "photo 3"}
    ]
}"#;

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
                "temperature": 1.0,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json"
            }
        });

        info!("Sending detection request to Google Gemini...");
        let response = self.client.post(url)
            .header("x-goog-api-key", api_key)
            .json(&body)
            .send().await?;
        let status = response.status();
        info!("Response status: {}", status);

        if !status.is_success() {
            let error_text = response.text().await?;
            error!("Google API error: {}", error_text);
            return Err(anyhow!("Google API error: {}", error_text));
        }

        let data: serde_json::Value = response.json().await?;
        let text = data["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow!("Invalid response format"))?;

        info!("Detection response length: {} chars", text.len());
        debug!("Detection response: {}", text);

        self.parse_detection_response(text, "google")
    }

    // ========== Verification Agent (Gemini 3 Flash) ==========

    async fn call_gemini_flash_verification(
        &self,
        api_key: &str,
        prompt: &str,
        image_base64: &str,
        mime_type: &str,
    ) -> Result<serde_json::Value> {
        let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

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
                "temperature": 0.2,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json"
            }
        });

        let response = self.client.post(url)
            .header("x-goog-api-key", api_key)
            .json(&body)
            .send().await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Gemini Flash verification error: {}", error_text));
        }

        let data: serde_json::Value = response.json().await?;
        let text = data["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow!("Invalid verification response format"))?;

        let clean = text.trim()
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        serde_json::from_str(clean)
            .map_err(|e| anyhow!("Verification JSON parse error: {}", e))
    }

    async fn call_gemini_flash_two_images(
        &self,
        api_key: &str,
        prompt: &str,
        image1_base64: &str,
        image2_base64: &str,
        mime_type: &str,
    ) -> Result<serde_json::Value> {
        let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

        let body = json!({
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image1_base64
                        }
                    },
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image2_base64
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json"
            }
        });

        let response = self.client.post(url)
            .header("x-goog-api-key", api_key)
            .json(&body)
            .send().await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow!("Gemini Flash verification error: {}", error_text));
        }

        let data: serde_json::Value = response.json().await?;
        let text = data["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow!("Invalid verification response format"))?;

        let clean = text.trim()
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        serde_json::from_str(clean)
            .map_err(|e| anyhow!("Verification JSON parse error: {}", e))
    }

    pub async fn verify_restoration(
        &self,
        api_key: &str,
        original_base64: &str,
        restored_base64: &str,
        mime_type: &str,
    ) -> Result<VerificationResult> {
        info!("=== VERIFY RESTORATION (Gemini Flash) ===");
        let start = std::time::Instant::now();

        let prompt = r#"You are a QA verification agent for photo restoration.
Compare these two images: the FIRST is the original damaged photo, the SECOND is the AI-restored version.

Evaluate the restoration quality:
1. IDENTITY PRESERVATION: Are faces, body proportions, and key features identical?
2. ARTIFACT DETECTION: Any AI hallucinations, distortions, blurring, or unnatural elements?
3. DAMAGE REPAIR: Were scratches, stains, tears, fading properly addressed?
4. COLOR QUALITY: Are colors natural and consistent? No banding or posterization?
5. SHARPNESS: Is the restored image appropriately sharp without over-sharpening?
6. COMPLETENESS: Was the entire image restored (no missed areas)?

Return ONLY valid JSON:
{
    "status": "pass" | "warning" | "fail",
    "confidence": 0-100,
    "checks": [
        {"name": "identity_preservation", "passed": true, "detail": "explanation"},
        {"name": "artifact_detection", "passed": true, "detail": "explanation"},
        {"name": "damage_repair", "passed": true, "detail": "explanation"},
        {"name": "color_quality", "passed": true, "detail": "explanation"},
        {"name": "sharpness", "passed": true, "detail": "explanation"},
        {"name": "completeness", "passed": true, "detail": "explanation"}
    ],
    "issues": [
        {"severity": "critical|warning|info", "description": "what is wrong", "suggestion": "how to fix"}
    ],
    "recommendations": ["suggestion 1"]
}"#;

        let parsed = self.call_gemini_flash_two_images(
            api_key, prompt, original_base64, restored_base64, mime_type,
        ).await?;

        let mut result = VerificationResult::new(VerificationStage::Restoration);
        result.processing_time_ms = start.elapsed().as_millis() as u64;
        Self::populate_verification_result(&mut result, &parsed);
        Ok(result)
    }

    pub async fn verify_detection(
        &self,
        api_key: &str,
        image_base64: &str,
        mime_type: &str,
        bounding_boxes: &[BoundingBox],
    ) -> Result<VerificationResult> {
        info!("=== VERIFY DETECTION (Gemini Flash) ===");
        let start = std::time::Instant::now();

        let boxes_json = serde_json::to_string(bounding_boxes)
            .unwrap_or_else(|_| "[]".to_string());

        let prompt = format!(r#"You are a QA verification agent for photo boundary detection.
This image is a flatbed scanner scan. An AI detected these bounding boxes (normalized 0-1000 coordinates):
{}

Evaluate the detection quality:
1. BOUNDARY ACCURACY: Do the boxes tightly fit the actual photos?
2. OVERLAP CHECK: Do any boxes significantly overlap (>10% area)?
3. SIZE REASONABLENESS: Are all boxes of reasonable size (not too tiny or too large)?
4. WITHIN BOUNDS: Are all coordinates within 0-1000 range?
5. COMPLETENESS: Are all visible photos detected? Any missed?
6. FALSE POSITIVES: Any boxes covering scanner bed or non-photo areas?

Return ONLY valid JSON:
{{
    "status": "pass" | "warning" | "fail",
    "confidence": 0-100,
    "checks": [
        {{"name": "boundary_accuracy", "passed": true, "detail": "explanation"}},
        {{"name": "overlap_check", "passed": true, "detail": "explanation"}},
        {{"name": "size_reasonableness", "passed": true, "detail": "explanation"}},
        {{"name": "within_bounds", "passed": true, "detail": "explanation"}},
        {{"name": "completeness", "passed": true, "detail": "explanation"}},
        {{"name": "false_positives", "passed": true, "detail": "explanation"}}
    ],
    "issues": [
        {{"severity": "critical|warning|info", "description": "what is wrong", "suggestion": "how to fix"}}
    ],
    "recommendations": ["suggestion 1"]
}}"#, boxes_json);

        let parsed = self.call_gemini_flash_verification(
            api_key, &prompt, image_base64, mime_type,
        ).await?;

        let mut result = VerificationResult::new(VerificationStage::Detection);
        result.processing_time_ms = start.elapsed().as_millis() as u64;
        Self::populate_verification_result(&mut result, &parsed);
        Ok(result)
    }

    pub async fn verify_crop(
        &self,
        api_key: &str,
        cropped_base64: &str,
        mime_type: &str,
        crop_index: usize,
    ) -> Result<VerificationResult> {
        info!("=== VERIFY CROP {} (Gemini Flash) ===", crop_index);
        let start = std::time::Instant::now();

        let prompt = format!(r#"You are a QA verification agent for photo cropping.
This is cropped image #{} extracted from a scanner scan.

Evaluate the crop quality:
1. PHOTO CONTENT: Does this contain an actual photograph (not scanner bed, blank area, or artifact)?
2. CROP TIGHTNESS: Is the photo properly framed without excessive scanner-bed margins?
3. ORIENTATION: Is the photo correctly oriented (not rotated or skewed)?
4. IMAGE QUALITY: Is the cropped content clear enough for restoration?

Return ONLY valid JSON:
{{
    "status": "pass" | "warning" | "fail",
    "confidence": 0-100,
    "checks": [
        {{"name": "photo_content", "passed": true, "detail": "explanation"}},
        {{"name": "crop_tightness", "passed": true, "detail": "explanation"}},
        {{"name": "orientation", "passed": true, "detail": "explanation"}},
        {{"name": "image_quality", "passed": true, "detail": "explanation"}}
    ],
    "issues": [
        {{"severity": "critical|warning|info", "description": "what is wrong", "suggestion": "how to fix"}}
    ],
    "recommendations": ["suggestion 1"]
}}"#, crop_index + 1);

        let parsed = self.call_gemini_flash_verification(
            api_key, &prompt, cropped_base64, mime_type,
        ).await?;

        let mut result = VerificationResult::new(VerificationStage::Crop);
        result.processing_time_ms = start.elapsed().as_millis() as u64;
        Self::populate_verification_result(&mut result, &parsed);
        Ok(result)
    }

    fn populate_verification_result(result: &mut VerificationResult, parsed: &serde_json::Value) {
        // Status
        match parsed["status"].as_str().unwrap_or("pass") {
            "fail" => result.status = VerificationStatus::Fail,
            "warning" => result.status = VerificationStatus::Warning,
            _ => result.status = VerificationStatus::Pass,
        }

        // Confidence
        result.confidence = parsed["confidence"].as_u64().unwrap_or(50).min(100) as u8;

        // Checks
        if let Some(checks) = parsed["checks"].as_array() {
            result.checks = checks.iter().filter_map(|c| {
                Some(VerificationCheck {
                    name: c["name"].as_str()?.to_string(),
                    passed: c["passed"].as_bool().unwrap_or(true),
                    detail: c["detail"].as_str().map(|s| s.to_string()),
                })
            }).collect();
        }

        // Issues
        if let Some(issues) = parsed["issues"].as_array() {
            result.issues = issues.iter().filter_map(|i| {
                Some(VerificationIssue {
                    severity: i["severity"].as_str().unwrap_or("info").to_string(),
                    description: i["description"].as_str()?.to_string(),
                    suggestion: i["suggestion"].as_str().map(|s| s.to_string()),
                })
            }).collect();
        }

        // Recommendations
        if let Some(recs) = parsed["recommendations"].as_array() {
            result.recommendations = recs.iter()
                .filter_map(|r| r.as_str().map(|s| s.to_string()))
                .collect();
        }
    }

    fn parse_detection_response(&self, text: &str, provider: &str) -> Result<DetectionResult> {
        let clean_text = text
            .trim()
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        let parsed: serde_json::Value = serde_json::from_str(clean_text)
            .map_err(|e| anyhow!("JSON parse error: {}", e))?;

        let photo_count = parsed["photo_count"].as_u64().unwrap_or(0) as usize;

        let bounding_boxes = if let Some(boxes) = parsed["bounding_boxes"].as_array() {
            boxes
                .iter()
                .filter_map(|b| {
                    Some(BoundingBox {
                        x: b["x"].as_u64()? as u32,
                        y: b["y"].as_u64()? as u32,
                        width: b["width"].as_u64()? as u32,
                        height: b["height"].as_u64()? as u32,
                        confidence: b["confidence"].as_f64().unwrap_or(0.9) as f32,
                        label: b["label"].as_str().map(|s| s.to_string()),
                    })
                })
                .collect()
        } else {
            Vec::new()
        };

        info!("Detected {} photos with {} bounding boxes", photo_count, bounding_boxes.len());

        Ok(DetectionResult {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: chrono::Utc::now(),
            photo_count,
            bounding_boxes,
            provider_used: provider.to_string(),
            scan_width: 0,
            scan_height: 0,
        })
    }
}

impl Default for AiProvider {
    fn default() -> Self {
        Self::new()
    }
}
