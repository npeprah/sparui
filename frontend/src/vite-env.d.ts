/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_ENV: string
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_ENABLE_MOCK_DATA: string
  readonly VITE_ANALYTICS_ID?: string
  readonly VITE_DEFAULT_TIMEOUT: string
  readonly VITE_MAX_PLAYERS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
