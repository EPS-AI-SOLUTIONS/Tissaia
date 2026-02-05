/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_TELEMETRY_ENABLED: string;
  readonly VITE_DEBUG: string;
  readonly VITE_ALLOWED_ORIGINS: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
