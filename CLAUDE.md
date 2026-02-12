# CLAUDE.md - Instructions for Claude AI

**Version 4.0.0** | **Last Updated: 12 February 2026**

## Project Context

You are working on **Tissaia-AI Studio**, an AI-powered photo restoration platform.

### Architecture — v4.0 Web Edition ("Heavy Metal Performance")
- **Frontend**: Vite SPA → **Vercel CDN** (static files)
- **Backend**: Rust (Axum 0.8 + Tokio) → **Fly.io** (Frankfurt/fra)
- **Connection**: Browser → HTTPS/JSON → Fly.io Rust API (direct, no proxy)
- **No Tauri** — v3.0 desktop shell removed; pure web app

### Key Technologies
- **Frontend**: React 19 + TypeScript 5.9 + Vite 7 + Zustand 5 + TailwindCSS 4 + TanStack Query 5
- **Backend**: Rust + Axum 0.8 + tower-http (CORS, tracing, body-limit)
- **AI Providers**: Gemini 3 Pro Image Preview (Primary), Claude Sonnet 4.5/GPT-4o (Fallback), Ollama (Local)
- **Verification**: Gemini 3 Flash Preview (verification agent)

### New in v4.0.0 (Web Edition)
- **Migrated from Tauri 2.x desktop to standalone Axum HTTP server**.
- All `safeInvoke()` calls replaced with `apiGet/apiPost/apiDelete` using `fetch()`.
- 21 Tauri commands converted to Axum route handlers.
- `VITE_API_URL` env var points frontend to backend (default `http://localhost:8080`).
- CORS configured via `FRONTEND_ORIGIN` env var on backend.
- Deployment: Vercel (frontend) + Fly.io (backend).
- **GEMINI_TEMPERATURE = 1.0** — Required by API for image generation. DO NOT CHANGE.
- BoundingBox coordinate system: normalized 0-1000 space.

### Features
- Photo analysis with Gemini Vision
- AI-powered restoration (scratches, fading, colorization)
- Multi-photo scanner separation (detection + smart crop + outpaint)
- Face detection and enhancement
- Verification agent (quality checks for restoration, detection, crop)
- Matrix Glass UI theme (Dark/Light mode)
- i18n (Polish/English)

## Code Style

### TypeScript (Frontend)
```typescript
// Functional Components + Hooks
interface PhotoProps {
  file: PhotoFile;
  onRestore: (options: RestorationOptions) => void;
}

const PhotoCard: React.FC<PhotoProps> = ({ file, onRestore }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  return <div>{file.name}</div>;
};

// API calls use apiPost/apiGet from hooks/api/utils.ts
const result = await apiPost<DetectionResult>('/api/detect/retry', {
  image_base64: base64,  // snake_case for Rust Deserialize
  mime_type: 'image/jpeg',
});
```

### Rust (Backend — Axum Handlers)
```rust
// Axum handler with shared state
pub async fn restore_image(
    State(state): State<SharedState>,
    Json(req): Json<RestoreRequest>,
) -> Result<Json<RestorationResult>, AppError> {
    let state = state.lock().await;
    let result = crate::ai::restore_image(&state, &req.image_base64, &req.mime_type).await?;
    Ok(Json(result))
}
```

## File Locations

| What | Where |
|------|-------|
| React components | `src/components/` |
| Photo views | `src/components/photo/` |
| UI components | `src/components/ui/` |
| Custom hooks | `src/hooks/` |
| API hooks | `src/hooks/api/` |
| API client (fetch) | `src/hooks/api/utils.ts` |
| Pipeline service | `src/services/pipeline/` |
| Store (Zustand) | `src/store/` |
| **Axum Server** | `server/` |
| Axum Entry Point | `server/src/main.rs` |
| Axum Handlers | `server/src/handlers.rs` |
| AI Logic (Rust) | `server/src/ai.rs` |
| Data Models | `server/src/models.rs` |
| App State | `server/src/state.rs` |
| Vite Config | `vite.config.ts` |
| Fly.io Config | `server/fly.toml` |
| Vercel Config | `vercel.json` |
| Dockerfile | `server/Dockerfile` |

## API Routes (21 endpoints)

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/health` | `health_check` |
| GET | `/api/providers` | `get_providers_status` |
| GET | `/api/models/ollama` | `get_ollama_models` |
| POST | `/api/restore` | `restore_image` |
| POST | `/api/detect` | `detect_photos` |
| POST | `/api/detect/retry` | `detect_photos_with_retry` |
| POST | `/api/crop` | `crop_photos` |
| POST | `/api/outpaint` | `outpaint_photo` |
| POST | `/api/rotate` | `rotate_image` |
| POST | `/api/upscale` | `upscale_image` |
| POST | `/api/filters` | `apply_local_filters` |
| POST | `/api/metadata` | `extract_metadata` |
| POST | `/api/save` | `save_image` |
| POST | `/api/verify/restoration` | `verify_restoration` |
| POST | `/api/verify/detection` | `verify_detection` |
| POST | `/api/verify/crop` | `verify_crop` |
| GET | `/api/history` | `get_history` |
| DELETE | `/api/history` | `clear_history` |
| GET | `/api/settings` | `get_settings` |
| POST | `/api/settings` | `save_settings` |
| POST | `/api/keys` | `set_api_key` |

## Commands

```bash
# Frontend
pnpm install          # Install frontend dependencies
pnpm dev              # Start Vite dev server (port 5175)
pnpm build            # Build production SPA
pnpm test             # Run Vitest
pnpm e2e              # Run Playwright tests
pnpm storybook        # Start Storybook

# Backend (from server/ directory)
cargo run             # Start Axum server (port 8080)
cargo check           # Type-check Rust code
cargo test            # Run Rust tests
cargo build --release # Build production binary

# Deploy
fly deploy            # Deploy backend to Fly.io (from server/)
vercel                # Deploy frontend to Vercel (from root)
```

## Environment Variables

```bash
# Backend (set via fly secrets set, or .env in server/)
PORT=8080
FRONTEND_ORIGIN=https://tissaia.vercel.app
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Frontend (set in Vercel dashboard or .env in root)
VITE_API_URL=https://tissaia-api.fly.dev
```

## Preferences

- **Package Manager**: `pnpm`
- **Strict Mode**: TypeScript strict mode enabled.
- **State Management**: Zustand (frontend), `Arc<Mutex<AppState>>` (backend).
- **API Pattern**: `apiPost<T>('/api/endpoint', { snake_case_body })` — all requests use `fetch()`.
- **Styling**: Tailwind CSS with "Matrix Glass" theme variables.
- **Error Handling**: `Result<T, AppError>` in Rust, Error Boundaries in React.
- **Naming**: camelCase in TypeScript, snake_case in Rust. JSON payloads use snake_case.
- **Linting**: Biome (not ESLint for formatting).

## Critical Rules

1. **GEMINI_TEMPERATURE = 1.0** — Required by API. Never change.
2. **BoundingBox coords**: Normalized 0-1000 space. Do NOT use pixel coordinates.
3. **SharedState**: `pub type SharedState = Arc<Mutex<AppState>>` — defined in `handlers.rs`.
4. **No Tauri**: v4.0 has NO Tauri dependency. All `@tauri-apps/*` packages removed.
5. **snake_case payloads**: Frontend sends `{ image_base64, mime_type }` (not camelCase) to match Rust `#[derive(Deserialize)]`.
