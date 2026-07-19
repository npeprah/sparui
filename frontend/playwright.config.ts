import { defineConfig, devices } from '@playwright/test'

// ---------------------------------------------------------------------------
// Playwright e2e config for the Spar test harness.
//
// One command (`npm run test:e2e`) boots BOTH servers and runs the suite:
//   1. the Go game server in SPAR_TEST_MODE (DB-optional, hand injection on)
//   2. the Vite dev server with VITE_SPAR_TEST=true (installs window.__sparTest)
//
// Specs drive REAL browsers over REAL WebSockets against the real backend, using
// multiple browser contexts to simulate multiple players. Assertions poll
// window.__sparTest state (via expect.poll) instead of sleeping - anti-flake.
// ---------------------------------------------------------------------------

const FRONTEND_PORT = 5173
const BACKEND_HEALTH = 'http://localhost:8080/health'
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`

export default defineConfig({
  testDir: './e2e',
  // A real multi-player loop is inherently sequential per test; keep workers at
  // 1 so the shared in-memory backend is not contended across parallel specs.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Boot the backend (test mode) and frontend (test build) before the suite.
  webServer: [
    {
      command: 'go run ./service/game-server/cmd/server.go',
      cwd: '../backend',
      url: BACKEND_HEALTH,
      env: { SPAR_TEST_MODE: '1' },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      cwd: '.',
      url: FRONTEND_URL,
      env: { VITE_SPAR_TEST: 'true' },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
