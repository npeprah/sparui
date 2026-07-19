/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_ENV: string
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_ENABLE_MOCK_DATA: string
  readonly VITE_ANALYTICS_ID?: string
  readonly VITE_DEFAULT_TIMEOUT: string
  readonly VITE_MAX_PLAYERS: string
  // Set to 'true' ONLY by the e2e harness to install window.__sparTest. Never
  // set in a production build.
  readonly VITE_SPAR_TEST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
