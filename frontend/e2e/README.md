# Spar e2e harness (Playwright)

Real browsers driving the real game over real WebSockets. One command boots a
test-mode backend + frontend and runs the suite.

## Run it

```bash
cd frontend
npm install                 # first time (fresh worktree)
npm run test:e2e:install    # first time: download the Chromium browser
npm run test:e2e            # boots backend + frontend + runs specs
npm run test:e2e:ui         # same, with the Playwright UI runner
```

`playwright.config.ts` starts both servers automatically (Playwright `webServer`):

1. Go game server with `SPAR_TEST_MODE=1` (DB-optional boot + hand injection),
   health-checked at `http://localhost:8080/health`.
2. Vite dev server with `VITE_SPAR_TEST=true` (installs `window.__sparTest`) on
   `http://localhost:5173`.

No Postgres/Redis required: in test mode rooms and live gameplay run entirely in
memory, and auth degrades to a non-validating stub.

## How it works

- **Deterministic hands** via the backend hook: `POST /test/inject-hands`
  `{ roomCode, leaderIndex, hands: [[{suit, value|rank}, x5], ...] }`. Pin exact
  hands + opening leader for a room BEFORE `startGame`. Helper: `injectHands()`
  in `support/harness.ts`.
- **Real actions** via `window.__sparTest` (installed only when
  `VITE_SPAR_TEST=true`). It wraps `socketService`/`gameStore` and registers its
  own socket subscriptions, so it is independent of the Phaser `GameScene` and
  survives the scene rebuild. Surface: `connect`, `createRoom`, `joinRoom`,
  `setReady`, `startGame`, `playCard`, `declareDry`, `flag`, `restart`,
  `getState`, `getMyHand`, `getEvents`.
- **Anti-flake**: assertions poll `window.__sparTest.getState()` via
  `Player.waitForState(...)` / `expect.poll` - never fixed sleeps.

## Production safety

`window.__sparTest` is dynamically imported behind a static
`import.meta.env.VITE_SPAR_TEST === 'true'` guard in `main.tsx`, so a normal
`npm run build` tree-shakes it out. Verify:

```bash
npm run build && ! grep -rq "__sparTest" dist/ && echo "clean"
```

## Scope

`smoke.spec.ts` is ticket 11's single end-to-end proof (2 contexts: create,
join, start with injected hands, play, assert propagation to both clients). The
full A-H acceptance runs are ticket 17's job, written against the rebuilt scene
using this same API + injection hook.
