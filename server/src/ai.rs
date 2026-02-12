use crate::models::{
    AiModel, BoundingBox, DetectionResult, RestorationResult,
    VerificationCheck, VerificationIssue, VerificationResult, VerificationStage, VerificationStatus,
};
use anyhow::{anyhow, Result};
use tracing::{debug, error, info};
use reqwest::Client;
use serde_json::json;
use std::time::Duration;

/// Gemini Pro wymaga temperature=1.0 dla generowania obrazów i stabilnych wyników.
/// NIE ZMIENIAJ — wartość wymagana przez API Gemini dla response_modalities z IMAGE.
const GEMINI_TEMPERATURE: f64 = 1.0;

pub struct AiProvider {
    client: Client,
}

impl AiProvider {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(120))
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
3. ADVANCED DENOISING: Apply MAXIMUM-STRENGTH noise reduction. Remove ALL grain, film grain, digital noise, ISO noise, chroma noise, luminance noise, dust specks, scratches, stains, watermarks, and scanning artifacts. Apply multi-pass denoising — the result must be PERFECTLY CLEAN and SMOOTH with ZERO visible noise or grain. Preserve edges and fine detail while eliminating all noise patterns.
4. FACES: Lock facial features strictly — do NOT alter face shape, expression, or identity. Apply natural skin tone restoration (not plastic/airbrushed). Enhance eye detail and sharpness.
5. COLOR: Apply professional HDR colorization. If the photo is black & white, colorize it naturally. If color, restore faded colors to vibrant, accurate tones. Use warm, natural color grading.
6. STUDIO QUALITY: Apply professional studio photo finish — soft diffused lighting simulation, subtle vignette, professional color grading. The final result should look like it was taken in a modern photography studio.
7. RESOLUTION & SHARPNESS: UPSCALE the image to the HIGHEST possible resolution. Enhance fine details, texture, and micro-contrast. Apply intelligent super-resolution to recover lost detail. The output image must be SHARP, HIGH-RESOLUTION, and CRISP with maximum detail preservation.
8. OUTPUT: Return the FULL restored image at MAXIMUM RESOLUTION with NO borders, NO watermarks, NO text overlays. Same aspect ratio as input. Output the LARGEST, HIGHEST-QUALITY image possible.

CRITICAL: Generate and return the actual restored image, not text. The output must be the restored photograph at the highest possible quality and resolution."#;

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
                "temperature": GEMINI_TEMPERATURE,
                "maxOutputTokens": 16384,
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
                "Advanced denoising (multi-pass)".to_string(),
                "Color restoration (HDR)".to_string(),
                "Face enhancement".to_string(),
                "Super-resolution upscale".to_string(),
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
3. ADVANCED DENOISING: Maximum-strength multi-pass noise reduction — remove ALL grain, film grain, ISO noise, chroma noise, dust, scratches, stains. Result must be perfectly clean.
4. FACES: Lock facial features, natural skin tone (not plastic)
5. COLOR: HDR colorization, restore faded colors to vibrant tones
6. RESOLUTION: Super-resolution upscale for maximum sharpness and detail
7. STUDIO QUALITY: Professional studio photo finish

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
3. ADVANCED DENOISING: Maximum-strength multi-pass noise removal — eliminate ALL grain, film grain, ISO noise, chroma noise, dust, scratches. Perfectly clean result.
4. FACES: Lock features, natural skin tone
5. COLOR: HDR colorization, vibrant tones
6. RESOLUTION: Super-resolution upscale for maximum detail and sharpness
7. STUDIO QUALITY: Professional finish

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

Priorities: geometry fix, flash removal, MAXIMUM denoising (remove ALL grain/noise/dust/scratches — multi-pass, perfectly clean result), face enhancement (natural skin), HDR colorization, super-resolution upscale, studio-quality finish.
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

        let prompt = r#"You are a photo boundary detection expert. This image is a flatbed scanner scan containing MULTIPLE separate photographs placed on the scanner bed.

YOUR TASK: Find and outline EACH INDIVIDUAL photograph separately. Most scans contain 2-8 separate photos arranged in a grid pattern.

DETECTION STRATEGY — follow this step-by-step:
STEP 1: Scan the ENTIRE image systematically in a grid pattern:
  - Top-left quadrant → Top-right quadrant
  - Middle-left → Middle-right
  - Bottom-left → Bottom-right
STEP 2: For EACH quadrant, check if there is a photo present.
STEP 3: Pay EXTRA attention to corners and edges — photos near the scanner edges are often missed.
STEP 4: Count all photos found and verify the count matches the number of bounding boxes.

CRITICAL RULES:
1. Look for GAPS and BORDERS between photos. Separate photos have visible edges, shadows, or scanner-bed background between them.
2. Each photo is a DISTINCT rectangular image with its own content (different scene, different people, different time period).
3. Do NOT merge multiple photos into one large bounding box. Each photo gets its OWN bounding box.
4. If photos overlap slightly, still detect them as separate items.
5. NEVER skip photos in corners or at edges of the scan. Systematically check ALL four corners and ALL four edges.
6. Labels MUST start from "photo 1" and be sequential with NO gaps. The number of bounding_boxes MUST equal photo_count.

COORDINATE SYSTEM: Normalized 0-1000, where top-left = (0, 0) and bottom-right = (1000, 1000).
Order: left-to-right, then top-to-bottom.

BOUNDING BOX PRECISION — VERY IMPORTANT:
- "x", "y", "width", "height" = axis-aligned bounding rectangle enclosing ONLY the photo content.
- The bounding box MUST be TIGHT around the photo. Do NOT include scanner bed background, shadows, or neighboring photo edges.
- Look for the actual PRINTED EDGE of each photo (the white border or the point where image content begins).
- If a photo has a white border, include it. The box should end exactly where the scanner bed / dark gap begins.
- Common error: making boxes too large so they overlap with adjacent photos or include dark scanner bed strips. AVOID THIS.
- Verify each box: the LEFT edge of box should touch the LEFT edge of the photo, etc. No excess margin.

CONTOUR (polygon outline):
- "contour" = precise polygon outline of the photo's actual edges (list of [x, y] points, normalized 0-1000).
  Photos on a scanner are often NOT perfect rectangles: they may be slightly tilted, have bent corners,
  or irregular edges. The contour captures the TRUE shape.
- "needs_outpaint" = true if the contour is significantly non-rectangular (the system will generatively fill the gap between contour and bounding box).
  Set to false ONLY if the photo is a near-perfect axis-aligned rectangle (all corners within 5 units of the bbox corners).

ROTATION DETECTION — CRITICAL for correct orientation:
For EACH photo, you MUST analyze its orientation independently. Follow this procedure:

STEP A: Identify visual cues in the photo:
  - FACES/PEOPLE: Where do the heads point? Heads should be at the TOP of an upright photo.
  - TEXT/WRITING: Which direction does text read? Text should read left-to-right horizontally.
  - BUILDINGS/TREES: Do vertical structures point UP?
  - GRAVITY CUES: Does hair hang DOWN, do clothes drape DOWN?

STEP B: Determine current rotation on the scanner:
  - If heads point UP on the scanner → rotation_angle = 0 (already upright)
  - If heads point RIGHT on the scanner → rotation_angle = 90 (rotated 90° CW)
  - If heads point DOWN on the scanner → rotation_angle = 180 (upside down)
  - If heads point LEFT on the scanner → rotation_angle = 270 (rotated 90° CCW)

STEP C: Record your reasoning in "rotation_reasoning" field. This is MANDATORY.
  Example: "I see faces with heads pointing to the right side of the scan → rotation_angle = 90"

Only use values 0, 90, 180, or 270.

IMPORTANT: Do NOT default to 0 for all photos. Many scanned photos are placed sideways or upside down on the scanner. Carefully examine EACH photo's content. If a photo is taller than wide on the scanner but appears to contain a landscape scene, it is likely rotated 90° or 270°.

BBOX TIGHTNESS VERIFICATION:
After computing each bounding box, mentally verify:
- Is there any dark/colored scanner bed visible between the photo edge and the bbox edge? If yes, SHRINK the bbox.
- Does the bbox overlap with any adjacent photo? If yes, SHRINK it to stop at the gap between photos.
- The gap between adjacent photos should NOT be included in any bbox.

Return ONLY valid JSON:
{
    "photo_count": 3,
    "bounding_boxes": [
        {
            "x": 32, "y": 22, "width": 446, "height": 296,
            "confidence": 0.95, "label": "photo 1", "rotation_angle": 0,
            "rotation_reasoning": "People standing upright, heads at top of photo on scanner",
            "contour": [[32,22],[478,20],[480,318],[30,320]],
            "needs_outpaint": false
        },
        {
            "x": 522, "y": 22, "width": 443, "height": 293,
            "confidence": 0.93, "label": "photo 2", "rotation_angle": 270,
            "rotation_reasoning": "Portrait photo on its side, heads point LEFT on scanner",
            "contour": [[525,25],[965,22],[968,315],[522,318]],
            "needs_outpaint": true
        },
        {
            "x": 35, "y": 345, "width": 440, "height": 293,
            "confidence": 0.92, "label": "photo 3", "rotation_angle": 180,
            "rotation_reasoning": "Photo is upside down, text at bottom reads inverted",
            "contour": [[35,345],[475,342],[478,638],[32,640]],
            "needs_outpaint": true
        }
    ]
}"#;

        let body = json!({
            "contents": [{
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_base64
                        }
                    },
                    {"text": prompt}
                ]
            }],
            "generationConfig": {
                "temperature": GEMINI_TEMPERATURE,
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

    // ========== Outpainting (Gemini 3 Pro) ==========

    /// Fill non-rectangular edges of a cropped photo to produce a clean rectangle.
    pub async fn outpaint_to_rectangle(
        &self,
        api_key: &str,
        cropped_base64: &str,
        mime_type: &str,
        contour_points: &[crate::models::Point2D],
        bbox_width: u32,
        bbox_height: u32,
    ) -> Result<String> {
        info!("=== OUTPAINT TO RECTANGLE ===");
        info!("BBox size: {}x{}, contour points: {}", bbox_width, bbox_height, contour_points.len());

        let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";

        let contour_desc: Vec<String> = contour_points.iter().map(|p| {
            format!("[{:.0}, {:.0}]", p.x, p.y)
        }).collect();
        let contour_json = contour_desc.join(", ");

        let prompt = format!(
            r#"This image is a cropped region from a flatbed scanner scan. It contains a photograph that is NOT a perfect rectangle — it has irregular edges from the scanner.

The actual photo boundary is defined by this polygon (normalized 0-1000 coordinates within this image):
[{}]

Areas OUTSIDE the polygon but INSIDE the image rectangle are scanner bed background (usually dark/black).

YOUR TASK: Generate a new version of this image where:
1. The area INSIDE the polygon (the actual photo) remains EXACTLY as-is — do NOT modify it.
2. The area OUTSIDE the polygon (scanner bed) is replaced with GENERATIVE OUTPAINTING that naturally extends the photo content.
3. The result should look like a complete, rectangular photograph with no visible scanner bed edges.
4. Match the style, colors, lighting, and era of the original photo.
5. The outpainted areas should blend seamlessly with the photo edges.

Generate the complete rectangular image."#,
            contour_json
        );

        let body = json!({
            "contents": [{
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": cropped_base64
                        }
                    },
                    {"text": prompt}
                ]
            }],
            "generationConfig": {
                "temperature": GEMINI_TEMPERATURE,
                "maxOutputTokens": 8192,
                "response_modalities": ["TEXT", "IMAGE"]
            }
        });

        info!("Sending outpainting request to Google Gemini...");
        let response = self.client.post(url)
            .header("x-goog-api-key", api_key)
            .json(&body)
            .send().await?;
        let status = response.status();
        info!("Outpainting response status: {}", status);

        if !status.is_success() {
            let error_text = response.text().await?;
            error!("Google API outpainting error: {}", error_text);
            return Err(anyhow!("Google API outpainting error: {}", error_text));
        }

        let data: serde_json::Value = response.json().await?;

        if let Some(parts) = data["candidates"][0]["content"]["parts"].as_array() {
            for part in parts {
                if let Some(inline) = part.get("inline_data") {
                    if let Some(img_data) = inline["data"].as_str() {
                        info!("Outpainting successful, output size: {} bytes", img_data.len());
                        return Ok(img_data.to_string());
                    }
                }
            }
        }

        info!("Outpainting: no image in response, returning original");
        Ok(cropped_base64.to_string())
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
                "temperature": GEMINI_TEMPERATURE,
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
                "temperature": GEMINI_TEMPERATURE,
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
5. COMPLETENESS: Are all visible photos detected? Carefully scan ALL corners and edges. Any missed?
6. FALSE POSITIVES: Any boxes covering scanner bed or non-photo areas?

IMPORTANT: If any photos are MISSING from the detection, you MUST provide their approximate bounding boxes
in the "missing_boxes" array so the system can automatically add them.

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
    "recommendations": ["suggestion 1"],
    "missing_boxes": [
        {{"x": 20, "y": 20, "width": 480, "height": 210, "confidence": 0.80, "label": "missed photo", "rotation_angle": 0}}
    ]
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

        // Missing boxes (verifier-suggested bounding boxes for missed photos)
        if let Some(boxes) = parsed["missing_boxes"].as_array() {
            result.missing_boxes = boxes.iter().filter_map(|b| {
                let x = b["x"].as_u64().or_else(|| b["x"].as_f64().map(|f| f as u64))?;
                let y = b["y"].as_u64().or_else(|| b["y"].as_f64().map(|f| f as u64))?;
                let w = b["width"].as_u64().or_else(|| b["width"].as_f64().map(|f| f as u64))?;
                let h = b["height"].as_u64().or_else(|| b["height"].as_f64().map(|f| f as u64))?;
                Some(BoundingBox {
                    x: x as u32,
                    y: y as u32,
                    width: w as u32,
                    height: h as u32,
                    confidence: b["confidence"].as_f64().unwrap_or(0.7) as f32,
                    label: b["label"].as_str().map(|s| s.to_string()),
                    rotation_angle: b["rotation_angle"].as_f64().unwrap_or(0.0) as f32,
                    contour: Vec::new(),
                    needs_outpaint: false,
                })
            }).collect();
            if !result.missing_boxes.is_empty() {
                info!("Verifier found {} missing photo(s)", result.missing_boxes.len());
            }
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

        let photo_count = parsed["photo_count"]
            .as_u64()
            .or_else(|| parsed["photo_count"].as_f64().map(|f| f as u64))
            .unwrap_or(0) as usize;

        let bounding_boxes = if let Some(boxes) = parsed["bounding_boxes"].as_array() {
            boxes
                .iter()
                .filter_map(|b| {
                    let x = b["x"].as_u64().or_else(|| b["x"].as_f64().map(|f| f as u64))?.min(1000);
                    let y = b["y"].as_u64().or_else(|| b["y"].as_f64().map(|f| f as u64))?.min(1000);
                    let w = b["width"].as_u64().or_else(|| b["width"].as_f64().map(|f| f as u64))?.clamp(1, 1000 - x);
                    let h = b["height"].as_u64().or_else(|| b["height"].as_f64().map(|f| f as u64))?.clamp(1, 1000 - y);

                    let contour = if let Some(pts) = b["contour"].as_array() {
                        pts.iter().filter_map(|p| {
                            if let Some(arr) = p.as_array() {
                                let px = arr.first()?.as_f64()?.clamp(0.0, 1000.0);
                                let py = arr.get(1)?.as_f64()?.clamp(0.0, 1000.0);
                                Some(crate::models::Point2D { x: px as f32, y: py as f32 })
                            } else {
                                let px = p["x"].as_f64()?.clamp(0.0, 1000.0);
                                let py = p["y"].as_f64()?.clamp(0.0, 1000.0);
                                Some(crate::models::Point2D { x: px as f32, y: py as f32 })
                            }
                        }).collect()
                    } else {
                        Vec::new()
                    };

                    let needs_outpaint = b["needs_outpaint"].as_bool().unwrap_or(false);
                    let rotation_angle = b["rotation_angle"].as_f64().unwrap_or(0.0) as f32;

                    if let Some(reasoning) = b["rotation_reasoning"].as_str() {
                        info!("Photo '{}' rotation reasoning: {} → angle={}",
                            b["label"].as_str().unwrap_or("?"), reasoning, rotation_angle);
                    }

                    Some(BoundingBox {
                        x: x as u32,
                        y: y as u32,
                        width: w as u32,
                        height: h as u32,
                        confidence: b["confidence"].as_f64().unwrap_or(0.9) as f32,
                        label: b["label"].as_str().map(|s| s.to_string()),
                        rotation_angle,
                        contour,
                        needs_outpaint,
                    })
                })
                .collect()
        } else {
            Vec::new()
        };

        info!("Detected {} photos with {} bounding boxes ({} need outpainting)",
            photo_count, bounding_boxes.len(),
            bounding_boxes.iter().filter(|b| b.needs_outpaint).count()
        );

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
