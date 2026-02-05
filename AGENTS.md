# AI Agents & Providers (The "Swarm")

Tissaia-AI utilizes a multi-model approach (sometimes referred to as a "Swarm" of models) to ensure high availability and quality of results.

## The Provider Chain

The application implements a fallback mechanism defined in `src-tauri/src/ai.rs`.

### 1. Primary: Google Gemini
- **Model**: `gemini-2.0-flash-exp` or `gemini-1.5-pro` (Configurable).
- **Role**: High-speed analysis and vision tasks.
- **Strengths**: Multimodal understanding, large context window.

### 2. Secondary: Anthropic Claude (Optional)
- **Model**: `claude-3-5-sonnet-latest`.
- **Role**: Creative restoration suggestions and complex reasoning.
- **Activation**: Triggers if Gemini fails or returns low-confidence results.

### 3. Tertiary: OpenAI (Optional)
- **Model**: `gpt-4o`.
- **Role**: Fallback for general purpose analysis.

## Internal "Personas" (Development)

While the application uses external APIs for image processing, the development and maintenance of Tissaia-AI follows the **Witcher School** persona system (inspired by Project GeminiHydra):

| Agent | Persona | Role |
|-------|---------|------|
| **Regis** | The Architect | System design, documentation, high-level strategy. |
| **Yennefer** | The Sorceress | Frontend UX/UI, visual effects, React component structure. |
| **Geralt** | The Witcher | Security audits, Rust backend logic, vulnerability hunting. |
| **Jaskier** | The Bard | User communication, translations (i18n), easy-to-read reports. |
| **Triss** | The Healer | QA, Testing (Playwright/Vitest), Bug fixing. |
| **Vesemir** | The Mentor | Code review, legacy system maintenance, best practices. |

*Note: These personas represent the "hats" worn by the developers (or the AI assistants helping them) during the creation of this software.*
