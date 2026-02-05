# Contributing to Tissaia-AI

First off, thanks for taking the time to contribute! Tissaia-AI follows the "Regis Architecture" principles: precision, elegance, and robust engineering.

## Development Setup

### Prerequisites
- **Node.js**: v20 or higher
- **pnpm**: v9 or higher (`npm install -g pnpm`)
- **Rust**: Latest stable (`rustup update`)
- **Visual Studio Code**: Recommended with "Tauri" and "Rust-Analyzer" extensions.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/tissaia-ai.git
    cd tissaia-ai
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Setup Environment**
    Copy `.env.example` to `.env` and add your API keys.
    ```env
    GOOGLE_API_KEY=your_key_here
    ```

4.  **Run Development Server**
    ```bash
    pnpm tauri:dev
    ```
    This will start the Vite frontend server (port 5175) and the Tauri Rust window.

## Code Style & Conventions

### Frontend (React/TypeScript)
- **Components**: Functional components with named exports.
- **State**: Use `useAppStore` (Zustand) for global state, `useState` for local.
- **Styling**: TailwindCSS utility classes. Use `matrix-*` colors defined in `tailwind.config.js`.
- **Naming**: PascalCase for components (`PhotoCard.tsx`), camelCase for hooks/utils (`useApi.ts`).
- **Tests**: Write unit tests alongside components or in `tests/`.

### Backend (Rust/Tauri)
- **Commands**: Define new commands in `src-tauri/src/commands.rs`.
- **Async**: Use `tokio` for async operations.
- **Errors**: Return `Result<T, String>` (or a serializable Error struct) for all commands.
- **Formatting**: Run `cargo fmt` before committing.

## Commit Messages

We follow the **Conventional Commits** specification:

- `feat: add new AI model support`
- `fix: crash when loading large PNGs`
- `docs: update ARCHITECTURE.md`
- `style: adjust glassmorphism opacity`
- `refactor: move AI logic to separate module`

## Testing

Before submitting a Pull Request, ensure all tests pass:

```bash
# Frontend Unit Tests
pnpm test

# End-to-End Tests
pnpm e2e

# Rust Tests
cd src-tauri && cargo test
```

## Pull Request Process

1.  Create a new branch: `git checkout -b feature/amazing-feature`
2.  Commit your changes.
3.  Push to the branch.
4.  Open a Pull Request.
5.  Wait for the **Regis** (Code Reviewer) to approve.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
