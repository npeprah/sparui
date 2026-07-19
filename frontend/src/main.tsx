import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Test-only game driver for the Playwright e2e harness. The guard is a static
// string comparison, so in a normal `npm run build` (where VITE_SPAR_TEST is
// undefined) the condition is provably false and Rollup tree-shakes both this
// branch and the dynamically imported module out of the production bundle.
if (import.meta.env.VITE_SPAR_TEST === 'true') {
  import('./services/sparTestApi')
    .then(m => m.installSparTestApi())
    .catch(err => console.error('[sparTest] failed to install test API', err))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
