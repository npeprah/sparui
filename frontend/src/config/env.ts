// Environment configuration with type safety and defaults

export const config = {
  // Backend
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080',

  // Environment
  env: import.meta.env.VITE_ENV || 'development',
  isDevelopment: import.meta.env.VITE_ENV === 'development',
  isProduction: import.meta.env.VITE_ENV === 'production',

  // Feature flags
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',

  // Analytics
  analyticsId: import.meta.env.VITE_ANALYTICS_ID,

  // Game settings
  defaultTimeout: parseInt(import.meta.env.VITE_DEFAULT_TIMEOUT || '15', 10),
  maxPlayers: parseInt(import.meta.env.VITE_MAX_PLAYERS || '4', 10),
} as const

// Debug logging in development
if (config.enableDebug) {
  console.log('🔧 Environment Config:', config)
}
