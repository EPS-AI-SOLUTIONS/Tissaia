# CLAUDE.md - Instructions for Claude AI

**Version 3.0.0** | **Last Updated: 24 January 2026**

## Project Context

You are working on **Tissaia-AI Studio**, an AI-powered photo restoration platform.

### Key Technologies
- **Frontend**: React 19 + TypeScript 5.7 + Vite 6 + Zustand 5 + TailwindCSS 4
- **Backend**: Rust + Tauri 2.x
- **Desktop**: Tauri (uses WebView2 on Windows, WebKit on Linux/macOS)
- **AI Providers**: Gemini 3 Pro (Primary), Anthropic/OpenAI (Fallback)

### New in v3.0.0 (Regis Architecture)
- Migrated from Electron/FastAPI to **Tauri 2.x + Rust**.
- **Gemini 3 Pro Preview** as primary AI model.
- React 19, Zustand 5, Vite 6, TailwindCSS 4.
- Port 5175 (frontend dev server).
- **Cross-pollination hooks**: `useHotkey`, `useKeyboardShortcuts` (from ClaudeHydra/GeminiHydra).
- **Vite compression**: Gzip + Brotli for production builds.

### Features
- Photo analysis with Gemini Vision
- AI-powered restoration (scratches, fading, colorization)
- Face detection and enhancement
- Matrix Glass UI theme (Dark/Light mode)
- Robust error handling with Rust Result types

## Code Style

### TypeScript (Frontend)
```typescript
// Good - Functional Components + Hooks
interface PhotoProps {
  file: PhotoFile;
  onRestore: (options: RestorationOptions) => void;
}

const PhotoCard: React.FC<PhotoProps> = ({ file, onRestore }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  return <div>{file.name}</div>;
};

// Use Tailwind for styling
// <div className="p-4 bg-matrix-bg-primary text-matrix-text-primary" />
```

### Rust (Backend)
```rust
// Good - Tauri Commands
#[tauri::command]
pub async fn analyze_image(state: State<'_, AppState>, path: String) -> Result<AnalysisResult, String> {
    // Use ? for error propagation
    let result = ai::analyze(&path).await.map_err(|e| e.to_string())?;
    Ok(result)
}
```

## File Locations

| What | Where |
|------|-------|
| React components | `src/components/` |
| Photo views | `src/components/photo/` |
| UI components | `src/components/ui/` |
| Custom hooks | `src/hooks/` |
| Hotkey hook | `src/hooks/useHotkey.ts` |
| Keyboard shortcuts hook | `src/hooks/useKeyboardShortcuts.ts` |
| Store (Zustand) | `src/store/` |
| Rust Source | `src-tauri/src/` |
| Tauri Commands | `src-tauri/src/commands.rs` |
| AI Logic (Rust) | `src-tauri/src/ai.rs` |
| App State (Rust) | `src-tauri/src/state.rs` |
| Vite Config | `vite.config.ts` |

## Commands

```bash
pnpm install          # Install frontend dependencies
pnpm tauri:dev        # Start Tauri app (Frontend + Rust)
pnpm dev              # Start frontend only (browser mode)
pnpm tauri:build      # Build production app
pnpm test             # Run Vitest
pnpm e2e              # Run Playwright tests
pnpm storybook        # Start Storybook
```

## Preferences

- **Package Manager**: `pnpm`
- **Strict Mode**: TypeScript strict mode enabled.
- **State Management**: Zustand (frontend), Arc<Mutex<AppState>> (backend).
- **Styling**: Tailwind CSS with "Matrix Glass" theme variables.
- **Error Handling**: Explicit `Result<T, E>` in Rust, Error Boundaries in React.
