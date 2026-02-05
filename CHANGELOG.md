# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2025-01-24

### Added
- **Tauri Backend**: Complete rewrite of the backend layer in Rust, replacing Python/Electron.
- **Gemini 3 Pro**: Integration with the latest Google Gemini models.
- **React 19**: Upgrade to the latest React version with compiler support.
- **Matrix Glass UI**: New visual theme with glassmorphism and matrix-green accents.
- **Zustand 5**: State management upgrade.

### Changed
- **Port**: Frontend dev server moved to port `5175`.
- **Architecture**: Adopted "Regis Architecture" (Hybrid Rust/React).
- **Build System**: Migrated to Vite 6.

### Fixed
- Improved file drag-and-drop stability.
- Fixed memory leaks in large image processing.

### Security
- Implemented stricter Content Security Policy.
- API keys are now handled exclusively in the Rust backend.
