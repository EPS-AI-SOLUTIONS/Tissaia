# Security Policy

## Supported Versions

| Version | Supported | Notes |
| ------- | --------- | ----- |
| 3.x.x   | :white_check_mark: | Current Stable |
| 2.x.x   | :x: | End of Life |

## Reporting a Vulnerability

Use this section to report security vulnerabilities to the Tissaia-AI team.

**DO NOT** report security vulnerabilities through public GitHub issues.

### Procedure

1.  Email the vulnerability details to `security@tissaia-ai.example.com` (Placeholder).
2.  Include a proof of concept (PoC) or clear steps to reproduce.
3.  We will acknowledge receipt within 48 hours.
4.  We will provide a timeline for the fix.

## Security Features

### 1. Tauri Security Context
Tissaia-AI is built on **Tauri**, which provides a secure default environment:
- **No Node.js in Renderer**: The frontend code cannot directly execute system commands.
- **IPC Isolation**: Communication happens only through explicitly defined commands.

### 2. API Key Protection
- API Keys (`GOOGLE_API_KEY`, etc.) are loaded into the **Rust backend** process.
- The frontend generally invokes commands like `restore_image`, and the backend handles the authentication with external providers.
- Avoid logging API keys in `agent_swarm.log` or console output.

### 3. File System Access
- Access is restricted to directories explicitly allowed by the user (e.g., via the File Dialog selection).
- The application does not have arbitrary write access to the entire OS.

## Best Practices for Developers

- **Never commit .env files**. Ensure `.gitignore` includes `.env`.
- **Validate inputs** in Rust commands before processing.
- **Update dependencies** regularly (`pnpm audit`, `cargo audit`).
