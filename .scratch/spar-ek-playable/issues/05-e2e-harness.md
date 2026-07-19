# What harness drives the 2-player browser proof?

Type: grilling
Status: resolved
Blocked by: none

## Question

Decide how the ≥2-player real-browser verification is executed.

Facts already established: no Playwright installed, no e2e directory; frontend tests
are vitest+jsdom only (PRD §5.1 mentions Playwright aspirationally). The backend needs
Postgres+Redis via `make db-start` (docker-compose) — or check whether rooms/games run
purely in memory for a test path.

Options to weigh: (a) install Playwright and write an automated 2-context script that
drives the acceptance scenarios; (b) agent-driven manual browsers (agent opens two
browser windows and plays); (c) hybrid — automated happy path, manual spot-checks.
Decide also: must the harness run unattended/CI-style, or is agent-supervised local
execution acceptable? And who owns keeping it green after the destination is reached?

## Resolution

Resolved via /grilling (HITL). Verified facts first: no Playwright/Cypress/Puppeteer, no
e2e dir (vitest only); live gameplay is fully in-memory (`websocket.go:90`
`var games = make(...)`); server currently `log.Fatalf`s without Postgres
(`cmd/server.go`) but the DB is not in the gameplay path; Redis is unused (only a "future"
comment); no CI configured anywhere in the repo.

### Decision: a single env-gated backend "test-mode" + a Playwright suite

- **Tool: Playwright, multi-context.** 2 browser contexts for the full script, 3 for the
  3-player smoke, against the REAL backend over REAL WebSocket - no mocking at this seam
  (it exists to catch contract drift + integration bugs). Rejected agent-driven manual
  (not repeatable, can't gate a build) and hybrid (leaves signature mechanics unproven by
  the repeatable gate, against 04's full-ruleset bar).
- **Backend "test-mode"** (one flag, e.g. `SPAR_TEST_MODE=1`, NEVER enabled in prod)
  bundles:
  1. **DB-optional boot** - server starts without Postgres; auth/stats degrade to
     no-op/in-memory. Chosen over docker-compose Postgres / testcontainers because the DB
     adds zero coverage to the acceptance scenarios (auth is a non-validating stub, stats
     aren't exercised) - so real Postgres is infra weight proving nothing the runs care
     about.
  2. **Hand-injection hook** - set exact hands + deck order for a room so runs load named
     scenarios ("dry-win", "fire-streak", "flag-correct"). Chosen over seedable-RNG-only
     (reverse-engineering a seed to specific hands is brittle + reads as magic numbers).
- **Frontend test-only `window.__sparTest` game API** (also test-mode-gated):
  `playCard(id)`, `flag(playerId)`, `declareDry(card, shown)`, etc. Playwright calls REAL
  game actions (full client → WS → backend → all clients loop) and asserts on the real
  Zustand store / rendered state. React lobby chrome is driven as normal DOM. Chosen over
  canvas x/y clicks (brittle to layout/animation; 04 sends "feel" to a human, not the
  script) and over driving the WS directly (wouldn't be a real browser test, would miss
  the client-wiring bugs the 01 audit found).
- **Assertions:** functional outcomes + cheap state-driven visual facts (per 04). Waits on
  state assertions, NOT fixed sleeps (anti-flake). **Screenshots/video captured at key
  beats** (deal, play→pile, round-win, fire, freeze, flag reveal, game-over) saved as
  artifacts for the separate human EK-feel pass.
- **Run posture:** one command (`npm run test:e2e`-style) boots test-mode backend +
  frontend + suite; runnable on demand by any dev/agent. **CI-ready but wiring CI is OUT
  of scope** (no CI exists; that's a separate deployment-infra track). Green owned by
  whoever changes gameplay, rerun before merge; human feel-pass rides along at release
  points.
- **Location:** `frontend/e2e/` (Playwright config + specs mirroring 04's runs A-H).

### Graduates to build work

(a) backend test-mode = DB-optional boot + hand-injection hook; (b) frontend
`window.__sparTest` API; (c) the Playwright suite + specs for runs A-H; (d) `npm run
test:e2e` wiring. Actual CI pipeline is explicitly deferred.
