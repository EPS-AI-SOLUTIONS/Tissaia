# Tissaia-AI v3.0.0 - Regis Architecture

> *"Precyzja to nie uprzejmość, to wymóg."* — Tissaia de Vries

<div align="center">

![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Tauri](https://img.shields.io/badge/Tauri-2.x-FFC131?style=for-the-badge&logo=tauri)
![Rust](https://img.shields.io/badge/Rust-Backend-000000?style=for-the-badge&logo=rust)
![Gemini](https://img.shields.io/badge/Gemini_3_Pro-Primary-4285F4?style=for-the-badge&logo=google)

**AI-powered photo restoration dashboard | Matrix Glass UI | Regis Architecture**

[Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Configuration](#-configuration)

</div>

---

## What's New in v3.0.0

- Migrated to **Tauri 2.x** with Rust backend (replaced Electron + FastAPI)
- **Gemini 3 Pro Preview** as primary AI model
- React 19, Zustand 5, Vite 6, TailwindCSS 4
- TypeScript 5.7 strict mode
- New port: **5175** (frontend dev server)
- Multi-provider fallback: Google → Anthropic → OpenAI → Groq
- Enhanced Matrix Glass UI with light/dark mode
- **New hooks**: `useHotkey` and `useKeyboardShortcuts` (cross-pollination from ClaudeHydra/GeminiHydra)
- **Vite compression**: Gzip + Brotli compression for production builds

---

## Features

### Photo Restoration
- **Damage Detection**: Scratches, fading, tears, water damage
- **Face Enhancement**: AI-powered facial feature restoration
- **Color Correction**: Automatic brightness, contrast, saturation
- **Colorization**: Convert B&W photos to color (optional)
- **Batch Processing**: Process multiple photos in queue

### AI Architecture
- **Gemini 3 Pro Preview**: Primary provider with Vision capabilities
- **Fallback Chain**: Anthropic Claude → OpenAI GPT-4o → Groq
- **Environment Config**: API keys loaded from .env file
- **Detailed Logging**: Full request/response logging for debugging

### UI/UX
- **Matrix Glass**: Dark theme with #00ff41 accents
- **Light Mode**: Elegant light theme option
- **JetBrains Mono**: Code-style typography
- **Skeleton Loaders**: No spinners, smooth loading states
- **Keyboard Shortcuts**: Power-user productivity via `useHotkey` and `useKeyboardShortcuts` hooks

### Cross-Pollination Features
- **Keyboard Hooks**: `useHotkey` (single hotkey listener) and `useKeyboardShortcuts` (multiple shortcuts manager) ported from ClaudeHydra/GeminiHydra
- **Build Optimization**: Vite compression plugins (gzip + brotli) for smaller production bundles

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Rust (for Tauri backend)
- Google API Key with Gemini access

### 1. Install Dependencies

```bash
# Install frontend dependencies
pnpm install
```

### 2. Configure Environment

```bash
# Create .env file in project root
cp .env.example .env

# Add your API keys:
GOOGLE_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=optional_claude_key
OPENAI_API_KEY=optional_openai_key
```

**Important**: Enable "Generative Language API" in Google Cloud Console.

### 3. Run Development Server

```bash
# Start Tauri app (frontend + Rust backend)
pnpm tauri:dev
```

The app opens automatically. Frontend dev server runs on http://localhost:5175

---

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | AI assistant instructions |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and data flow |
| [AGENTS.md](AGENTS.md) | AI providers and fallback chain |
| [CHANGELOG.md](CHANGELOG.md) | Version history and changes |

---

## Architecture

```
Tissaia/
├── src-tauri/              # Rust/Tauri backend
│   ├── src/
│   │   ├── lib.rs          # Entry point + plugins
│   │   ├── commands.rs     # Tauri commands (IPC)
│   │   ├── ai.rs           # AI provider implementations
│   │   ├── state.rs        # App state management
│   │   └── models.rs       # Data structures
│   └── Cargo.toml          # Rust dependencies
├── src/                    # React 19 frontend
│   ├── components/         # UI components
│   │   ├── photo/          # Photo views (Upload, Analyze, Restore, Results)
│   │   └── ui/             # Shared UI components
│   ├── hooks/              # Custom React hooks
│   │   ├── useApi.ts       # API communication hook
│   │   ├── useHotkey.ts    # Single hotkey listener
│   │   └── useKeyboardShortcuts.ts  # Multiple shortcuts manager
│   ├── utils/              # Utilities (tauri.ts)
│   ├── contexts/           # Theme context
│   └── store/              # Zustand global state
├── public/                 # Static assets + test photos
└── e2e/                    # Playwright tests
```

---

## Configuration

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Gemini API key | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Optional |
| `OPENAI_API_KEY` | GPT API key | Optional |

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 19.x |
| Build | Vite | 6.x |
| Language | TypeScript | 5.7 |
| State | Zustand | 5.x |
| Styling | Tailwind CSS | 4.x |
| Desktop | Tauri | 2.x |
| Backend | Rust | Latest |
| AI Primary | Gemini 3 Pro Preview | Latest |
| Testing | Vitest + Playwright | Latest |

---

## Commands

```bash
pnpm dev              # Start frontend only (port 5175)
pnpm tauri:dev        # Start Tauri app (frontend + Rust backend)
pnpm tauri:build      # Build production Tauri app
pnpm test             # Run tests
pnpm storybook        # Storybook (port 6007)
pnpm build            # Production frontend build
pnpm e2e              # End-to-end tests
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Made with love by Pawel Serkowski**

*"W swiecie chaosu, precyzja jest jedyna bronia."*

</div>
