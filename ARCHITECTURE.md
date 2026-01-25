# Tissaia-AI Architecture (Regis Specification)

**Version 3.0.0**

This document describes the high-level architecture of Tissaia-AI Studio v3.

## Overview

Tissaia-AI is a **Hybrid Desktop Application** built with **Tauri**. It combines a modern web frontend (React) with a high-performance native backend (Rust).

```mermaid
graph TD
    User[User Interface] <--> React[React 19 Frontend]
    React <-->|IPC / Tauri Invoke| Rust[Rust Backend (Tauri Core)]
    
    subgraph Frontend
        React --> Zustand[Zustand Store]
        React --> Components[UI Components]
        React --> Hooks[Custom Hooks]
    end
    
    subgraph Backend
        Rust --> Commands[Commands Handler]
        Rust --> State[App State (Arc/Mutex)]
        Rust --> AILogic[AI Service Layer]
        Rust --> FS[File System Plugin]
    end
    
    subgraph External_Services
        AILogic <-->|HTTPS| Gemini[Google Gemini API]
        AILogic <-->|HTTPS| Anthropic[Anthropic API]
        AILogic <-->|HTTPS| OpenAI[OpenAI API]
    end
```

## Layers

### 1. Presentation Layer (Frontend)
- **Technology**: React 19, TypeScript 5.7, Vite 6.
- **Styling**: TailwindCSS 4 with "Matrix Glass" design system.
- **State Management**: `zustand` for global app state (current view, settings, history).
- **Communication**: Uses `@tauri-apps/api/core` to invoke Rust commands.
- **Hooks Layer**: Custom hooks for reusable logic (see below).

### 2. Bridge Layer (IPC)
- **Mechanism**: Tauri IPC (Inter-Process Communication).
- **Format**: JSON serialization (via `serde`).
- **Commands**: Defined in `src-tauri/src/commands.rs`.
  - `analyze_image(path)`
  - `restore_image(path, options)`
  - `get_history()`

### 3. Application Layer (Backend)
- **Technology**: Rust (Tauri 2.x).
- **Concurrency**: `tokio` async runtime.
- **State**: In-memory `AppState` protected by `Mutex` for thread safety.
- **Responsibilities**:
  - File I/O (reading/writing images).
  - API Key management.
  - Image processing (if local).
  - Orchestrating AI API calls.

### 4. Infrastructure Layer (External AI)
- **Primary**: Google Gemini 3 Pro (Vision).
- **Fallback**: Anthropic Claude 3.5 Sonnet -> OpenAI GPT-4o.
- **Data Flow**: Images are converted to Base64 (or uploaded depending on provider API) and sent for analysis/processing.

## Directory Structure

```
Tissaia/
├── src/                    # Frontend Source
│   ├── components/         # React Components
│   ├── hooks/              # Logic abstraction
│   ├── store/              # State management
│   ├── services/           # (Optional) Frontend services
│   └── App.tsx             # Root Component
├── src-tauri/              # Backend Source
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── lib.rs          # Plugin assembly
│   │   ├── commands.rs     # API Interface
│   │   ├── ai.rs           # AI Provider Logic
│   │   └── state.rs        # Runtime state
│   ├── Cargo.toml          # Dependencies
│   └── tauri.conf.json     # App Configuration
```

## Security Design

- **CSP**: Strict Content Security Policy configured in `tauri.conf.json`.
- **Permissions**: Using Tauri v2 capabilities system to restrict file system access to user-selected files only.
- **Secrets**: API Keys are injected via environment variables (`.env`) during development or securely stored in runtime state. They are never exposed to the frontend client-side code directly if possible (proxy via Rust).

## Hooks Layer

Custom React hooks provide reusable logic abstractions:

| Hook | Purpose | Origin |
|------|---------|--------|
| `useApi` | API communication with Tauri backend | Native |
| `useHotkey` | Single keyboard shortcut listener | Cross-pollination (ClaudeHydra/GeminiHydra) |
| `useKeyboardShortcuts` | Multiple shortcuts manager with register/unregister | Cross-pollination (ClaudeHydra/GeminiHydra) |

### Keyboard Hooks Usage

```typescript
// Single hotkey
useHotkey('ctrl+s', () => saveDocument(), { preventDefault: true });

// Multiple shortcuts
const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts({
  'ctrl+enter': () => submitForm(),
  'escape': () => closeModal(),
});
```

## Performance Optimization

- **React**: Uses `React.lazy` and `Suspense` for view splitting.
- **Rust**: Native performance for heavy lifting (I/O).
- **Assets**: WebP format used for internal assets.

## Vite Compression Plugins

Production builds include dual compression for optimal delivery:

```typescript
// vite.config.ts
plugins: [
  // Gzip compression (threshold: 1KB)
  viteCompression({ algorithm: 'gzip', threshold: 1024 }),
  // Brotli compression (threshold: 1KB)
  viteCompression({ algorithm: 'brotliCompress', threshold: 1024 }),
]
```

Benefits:
- **Gzip**: Universal browser support, ~70% size reduction.
- **Brotli**: Modern browsers, ~80% size reduction.
- Original files preserved (`deleteOriginFile: false`).
