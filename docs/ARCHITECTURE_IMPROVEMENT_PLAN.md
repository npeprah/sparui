# Spar - Architecture and Code Improvement Plan

Date: 2026-07-18. Based on a full read-only scan of the repo (backend, frontend, tooling, docs). No changes were made. Line numbers reference the current working tree and will drift as files change.

---

## Executive summary

The game works, but the codebase has accumulated significant structural debt, mostly from fast iterative feature work without consolidation. The five most important problems, in order:

1. **The backend's real game logic lives in a 1,677-line `websocket.go` god file, while a well-tested game engine (`controller/game/`, ~3,500 lines) sits completely unused.** The most-tested code in the repo is dead code; the live code is the least-tested.
2. **WebSocket authentication is fake.** Any non-empty string is accepted as a token and identity is derived from its first 8 characters. Combined with a hardcoded fallback JWT secret, any client can impersonate any player.
3. **There are real concurrency bugs** in the live path: map mutation under a read lock in the hub, one global mutex held across all broadcasts (serializing every card play in every room), and room state mutated outside the manager's lock.
4. **The frontend/backend contract is hand-duplicated and already drifted.** Event names, card shapes (modeled 3+ ways with dual-format fallbacks), and payload types disagree; the working tree currently has 40 tsc errors and 256 eslint problems, with no CI to catch any of it.
5. **The frontend mirrors the backend's god-file problem**: `GameScene.ts` (1,477 lines) owns layout, animations, all WebSocket handlers, and a duplicate copy of game state that must be manually reconciled with the Zustand stores.

The plan below is organized as: critical fixes (P0), backend architecture (P1), frontend architecture (P1), contract unification (P1), tooling/CI (P2), and hygiene (P2), followed by a suggested sequencing.

---

## Current state overview

**Backend** (`backend/service/game-server/`, Go 1.25, ~10.9k source lines): chi REST + Gorilla WebSocket. Intended layering (`cmd / controller / entity / repository / mapper / gateway`) is partly aspirational - `mapper/`, `gateway/`, `config/`, and `repository/stats/` are empty directories. Dependency direction between the layers that do exist is clean (controllers -> entity/repository, no cycles). Game state is in-memory only; a server restart loses all live games and rooms. Redis is provisioned in docker-compose and `.env` but there is no Redis client anywhere in the code.

**Frontend** (`frontend/src/`, React + TS + Vite + Zustand + Phaser, ~14.2k source lines): React owns routing/lobby, Phaser owns the table. `strict: true` TypeScript, good store mutation discipline (immutable `set()` everywhere), sound test infrastructure. But there is heavy file-level sprawl: three animation modules, four incompatible theme naming schemes, five stores with overlapping responsibilities, and 254 raw `console.*` calls in production paths.

**Between them**: a hand-maintained JSON envelope (`{event, data}`) with no shared schema, no codegen, and no runtime validation. A full REST API exists under `/api/v1` that the frontend never calls (zero `fetch`/`axios` usage).

**Around them**: no CI of any kind, no pre-commit hooks, ~100 stale planning markdown files at the repo root, compiled 11 MB binaries and two Python virtualenvs committed to git, a 9-byte root README, and a branch named `foo` with 59 uncommitted entries.

---

## P0 - Critical fixes (correctness and security)

These are bugs and holes, not refactors. Do these before anything else.

### P0.1 Real WebSocket authentication

`handleAuth` (`controller/websocket/websocket.go:315-360`) never validates the token. It accepts any non-empty string and sets `playerID = "player-" + token[:8]` (line ~339, with a TODO at ~328). Anyone can impersonate anyone by choosing a token prefix. The `/ws` endpoint (`cmd/server.go:93`) has no auth middleware either.

Fix: validate the JWT via the existing `common/auth.ValidateToken` in `handleAuth` (or better, at upgrade time via query param / first-message handshake) and derive `playerID` from verified claims. Reject unauthenticated sockets.

### P0.2 Remove the hardcoded JWT secret fallback

`"dev-secret-change-in-production-please"` is hardcoded twice (`controller/auth/auth.go:48` and `:109` - env is read in two places). If `JWT_SECRET` is unset, the server runs with a publicly known secret and only logs a warning; tokens become forgeable. Fix: read the secret once in a config package; fail fast at startup when unset outside dev mode.

### P0.3 Hub broadcast data race

`Hub.Run` (`websocket.go:164-174`) takes `h.mu.RLock()` and then, when a client's send channel is full, executes `close(client.Send)` and `delete(h.Clients, client)` - a map write and channel close under a read lock, concurrent with other RLock holders. This is a concurrent-map-write / double-close crash waiting for load. Fix: under RLock, only collect dead clients; remove them afterwards under a write lock (or route through the `Unregister` channel).

### P0.4 Lock scope and ordering in the play-card path

`handlePlayCard` holds the global `gamesMu` for its entire body (`websocket.go:429-430`, deferred), including `handleRoundCompletion` and every broadcast, which additionally acquire `Hub.mu.RLock` (`websocket.go:1514`, `1542`). Consequences: (a) every card play in every room is serialized on one mutex; (b) the implicit lock order `gamesMu -> Hub.mu` is undocumented and one wrong-order call away from deadlock; (c) `sendJSON` blocks on an unbuffered-full `c.Send` with no `default` (`websocket.go:1493`), so a slow client can stall a handler that holds `gamesMu`.

Fix: mutate state under `gamesMu`, snapshot what the broadcast needs, release the lock, then broadcast. Longer term, use per-room locking (see P1.1).

### P0.5 Room state mutated outside the manager's lock

`roomManager.GetRoom` returns the live `*entity.Room` pointer (`controller/room/room_manager.go:244-254`), and `handleRestartGame` mutates `room.Status`, `room.StartedAt`, and `room.Players[i].IsReady` directly (`websocket.go:1376-1402`) without holding `Manager.mu`. This races with concurrent join/leave/ready calls. Fix: add manager methods that mutate under the lock (e.g. `ResetForRestart`), or have `GetRoom` return copies.

### P0.6 Non-atomic stats updates

`IncrementGameStats` (`repository/user/user_repository.go:323-347`) does read-modify-write without a transaction, so concurrent game completions lose updates. Fix with a single `UPDATE ... SET wins = wins + $1` statement or a transaction. (Same pattern in `game_over_handler.go:454-517` if that code is kept.)

### P0.7 Small but real

- `go vet` flags a self-assignment bug: `dry_card_handler.go:115` assigns `h.gameState.UpdatedAt` to itself.
- `generateClientID()` is `time.Now().Format("20060102150405")` (`websocket.go:1571`) - second resolution, so simultaneous connections collide. Use `google/uuid` (already a dependency). Same for `generateUUID()` in `room_manager.go:390`.
- `GameOverHandler.HandleGameOver` self-deadlocks (`game_over_handler.go:389` takes `mu.Lock` then calls methods that take `mu.RLock`; `sync.RWMutex` is non-reentrant). Currently dead code, but fix or delete it (see P1.1).
- Frontend: `convertBackendCard` silently fabricates a default `'6'` card on malformed input (`store/gameStore.ts:109-114`), hiding backend bugs. Fail loudly instead.

---

## P1 - Backend architecture

### P1.1 Resolve the dead-engine split (the single biggest decision)

`controller/game/` contains a clean, lock-guarded, heavily tested engine (`game_engine.go`, `score_manager.go`, `win_streak_handler.go`, `dry_card_handler.go`, `challenge_handler.go`, `game_over_handler.go`, `timer_manager.go`, `state_broadcaster.go`). **None of it is called in production.** `websocket.go` reimplements the same logic inline - `calculateRoundWinner` exists in both places (`websocket.go:712` vs `game_engine.go:387`) and can drift. There are also two incompatible `Card`/`GameState` type sets (`entity/game.go` vs `controller/game/game.go:44-66`).

Recommendation: **route the live path through the engine rather than deleting it.** The engine is the better-designed and better-tested half. Concretely:

1. Give the engine a single coordinator that owns `*entity.GameState` and one lock per game (replacing today's global `gamesMu` and the eight per-handler mutexes that independently guard the same state).
2. Make `websocket.go` a thin transport: parse message -> call engine method -> broadcast the returned events. The engine returns events/state diffs; it never touches the Hub.
3. Delete the duplicated inline logic from `websocket.go` and the conflicting types in `controller/game/game.go`.
4. This also naturally implements per-room locking (fixes the P0.4 serialization) and finally makes the dry-card/challenge handlers real: today `handleDeclareDry` and `handleFlagPlayer` are stubs that return fake acks (`websocket.go:796`, `:895`, TODOs at `:840`, `:937`) even though full implementations sit unused in `dry_card_handler.go` / `challenge_handler.go`.

Target shape for `controller/websocket/`: `hub.go` (connection lifecycle), `dispatch.go` (event switch), `handlers_lobby.go`, `handlers_game.go` (thin adapters), `card_format.go`. Nothing over ~400 lines.

### P1.2 Delete or implement the stub HTTP API

All of `controller/game/game.go`'s HTTP handlers return hardcoded fake data (`handleCreateRoom` returns room `"ABC123"` at `game.go:101-110`, fixed stats at `:229-235`, ~20 TODOs) and are mounted live at `/api/v1/game/*` (`cmd/server.go:86`) with no auth. The frontend never calls any REST endpoint. Recommendation: delete the stub routes now (fake data on live routes is worse than a 404), and reintroduce REST endpoints only when a consumer exists.

### P1.3 Central config package

Config is scattered and partly ignored: `cmd/server.go` has `getEnv` helpers for DB, `auth.go` reads `JWT_SECRET` directly (twice), `CORS_ORIGINS`/`REDIS_URL`/`ENVIRONMENT` exist in `.env` but are never read, CORS origins are hardcoded to localhost in two places (`cmd/server.go:66` and WS `CheckOrigin` at `websocket.go:24-28` - production would reject all real origins), and turn-timer values conflict between code paths (30s in `websocket.go:1474` vs 15/8/5s in `game_engine.go:288-292`). `db.ParseDatabaseURL` (`common/db/postgres.go:94-116`) ignores its argument and returns hardcoded defaults.

Fix: populate the empty `config/` directory with one package that loads and validates all env at startup (port, DB URL, JWT secret, CORS/WS origins, timeouts, timer values) and inject it. Delete unused env vars (or implement them).

### P1.4 Persistence strategy

Live games and rooms are in-memory maps; DB writes for rooms are best-effort and ignored on failure (`room_manager.go:117-120` and five similar sites, commented "in-memory sufficient for MVP"). That is a defensible MVP choice, but make it explicit: either commit to in-memory (delete the dead best-effort writes and the unused Redis container) or implement recovery (persist game snapshots so a restart does not kill every active game; Redis is the natural fit and is already provisioned). Also: `lib/pq` is in maintenance mode - migrate to `pgx` whenever the repository layer is next touched.

### P1.5 Consistent HTTP error handling

Three styles coexist: structured JSON `respondError` in auth (`auth.go:358`), plain-text `http.Error` in game stubs and middleware, and a `panic` in a route constructor (`controller/stats/routes.go:25`). Standardize on one JSON error helper in a shared package; remove the panic in favor of a constructor error.

### P1.6 Deck shuffle fairness

`entity/deck.go:57` shuffles with `math/rand`. Functional (auto-seeded since Go 1.20) but predictable in principle; for a competitive card game, use `crypto/rand`-backed shuffling (room codes already do, `room_manager.go:377`).

---

## P1 - Frontend architecture

### P1.7 Decompose `GameScene.ts` and make the stores the single source of truth

`GameScene.ts` (1,477 lines) does layout math, theming, scoreboard UI, dealing, playing, animation orchestration, all seven WebSocket handlers, store subscriptions, and restart handling. The deeper problem is **duplicate state**: hands live in both `usePlayerStore.hand` and `GameScene.playerHands` (line 40), played cards in both `useGameStore.playedCards` (by playerId) and `GameScene.playedCards` (by position, line 43), and turn state is split across `playerStore.isMyTurn` and `gameStore.leaderId` inference (`isPlayersTurn`, lines 455-468). `syncPlayerHand()` (lines 1009-1075) is a 66-line reconciliation loop that exists only because of this dual model; opponent hands live only in the scene.

Plan:
1. Make the Zustand stores authoritative for all game state, including opponent hand counts. The scene renders from store subscriptions and never keeps its own logical state (sprite references only).
2. Extract WebSocket handling into a `GameSocketController` (plain TS module: socket events in, store mutations out). Neither the scene nor `LobbyScreen` should register socket handlers - today the "init from backend" sequence is duplicated between `LobbyScreen.tsx:205-239` and the scene's `game:restarted` handler (lines 1376-1423).
3. Extract scoreboard/HUD rendering and layout math into their own modules. Target: `GameScene.ts` under ~400 lines of orchestration.
4. Same treatment for `CardSprite.ts` (928 lines, ~40 methods): split interaction handling (drag/click/hover) from visual-state animation into composable helpers.

### P1.8 Consolidate the WebSocket client

- Two reconnect implementations exist: socketService's internal backoff (`socketService.ts:356-380`) and the unused, more sophisticated `connectionManager.ts` (287 lines, with its own 355-line test). Keep one; wire connection-status UI to it.
- `useSocket.ts` is dead and cannot compile (assigns `void` from `connect()` to a `Socket`, then calls `.on` on it) and is the only reference to `socket.io-client`. Delete the hook and the dependency.
- The three-strategy message parser in `onmessage` (`socketService.ts:256-318`), including a naive brace-depth splitter that breaks on `}` inside strings, exists to cope with concatenated JSON frames. Fix the framing contract with the backend (one JSON document per WS message) and delete the fallbacks.
- On open, the service emits a fabricated `connected` event with an empty `playerId` (`socketService.ts:253`). Emit real events only.

### P1.9 Consolidate stores

Five stores with overlaps: `gameStore` and `lobbyStore` both hold `roomCode`, `hostId`, `maxPlayers`, `settings`, and player lists, with near-identical mutators and two `DEFAULT_SETTINGS`; `isConnecting` lives in both `lobbyStore` and `uiStore`; hands are duplicated between `playerStore.hand` and `gameStore.players[].hand`. Merge room/lobby data into one store (lobby is just the pre-game view of the same room), keep one connection-state owner, and derive rather than store computed values (leader/tie/turn are currently recomputed ad hoc inside the scene). Also fix the score impedance mismatch: `updateScore` is delta-based while the backend sends absolute `roundsWon`, forcing the scene to compute deltas (`GameScene.ts:1203-1204`) - store absolutes.

### P1.10 Delete duplicates and unify naming

- **Animations**: `game/utils/animations.ts` (400 lines) duplicates the deal/play specs of `game/utils/cardAnimations.ts` (329 lines); only `cardAnimations.ts` is actually used - the other's functions are imported by GameScene but never called, and are exercised only by their own tests. Keep `cardAnimations.ts`, delete the rest. Rename the React-side `src/utils/animations.ts` (framer-motion variants, legitimately different) to `motionVariants.ts` to kill the name collision.
- **Particle config**: `PARTICLE_CONFIG` is defined in both `game/constants/animations.ts:173` and `game/constants/particleConfig.ts`. Keep one.
- **Themes**: four incompatible naming schemes exist (`themeStore.ThemeName` underscore names that match real asset keys; hyphenated `SurfaceTheme` in `types.ts:34` with 8 values; `GameSettings.surfaceTheme` with a `marble` that exists nowhere; `cardThemes.ts:75` with `sunset-fire`/`festival-drums` found nowhere else). Define one `SurfaceTheme` union matching asset keys; delete the other three.
- **Dead code**: `components/modals/SettingsModal.tsx` (unused duplicate of `components/settings/SettingsModal.tsx`, plus its 335-line test, plus it imports `lucide-react` which is not even in package.json), `scenes/TestScene.ts` (not registered in the game config), deprecated `dealTestHand()` (`GameScene.ts:566`).

### P1.11 Scene lifecycle hygiene

- Replace raw `setTimeout` with `this.time.delayedCall` so timers die with the scene (`GameScene.ts:554, 576, 737, 1176, 1262`, `CardSprite.ts:889`, `particles.ts:194`). The existing `if (!card.scene || !card.active)` guards are papering over this.
- `this.scale.on('resize', ...)` (`GameScene.ts:483`) is never `off()`'d in `shutdown()` - leaks across restarts.
- AudioManager is torn down in two places (`GameScene.shutdown` and `PhaserGame.tsx:29`) - pick one owner.

---

## P1 - Frontend/backend contract

### P1.12 One source of truth for the wire protocol

Today every message shape is written by hand on both sides and they have already diverged:

- Frontend `ClientToServerEvents` omits all three `matchmaking:*` events the backend accepts (`websocket.go:303-307`).
- The backend emits `room:created` / `room:player_joined` / `game:started` etc., while the frontend also declares a parallel set of `lobby:*` event names the backend never sends (`socketService.ts:35-45`) - two naming conventions for the same concepts.
- `LobbyScreen.tsx:156-161` reads `.players` off a payload type that does not have it (a live tsc error).
- The card is modeled at least three ways: backend `entity.Card{Suit, Value:"king"}`, the translated frontend shape `{suit, rank:"K", id}` via `card_format.go`, and `BackendCard` in `store/types.ts:97` carrying both `value?` and `rank?` "for backward compatibility". The backend's inbound handler likewise accepts both `value` and `rank` (`websocket.go:393-413`), and two hand-maintained switch tables map ranks in each direction (`websocket.go:373`, `card_format.go:11`).

Plan:
1. Write down the protocol once - a single `protocol.md` (or JSON Schema) listing every event name and payload.
2. Pick one card wire shape (recommend the frontend's `{suit, rank}` since the translation layer already exists) and delete the dual-format fallbacks on both sides.
3. Generate or share types: either generate TS types from the Go structs (e.g. tygo/typescriptify) or maintain one schema and generate both. Add zod (or equivalent) runtime validation at `handleServerEvent` (`socketService.ts:338`) so malformed payloads fail loudly instead of being cast blindly.
4. Normalize event naming to one convention (`domain:action`, pick `room:*` or `lobby:*`, not both).

### P1.13 Reconcile the scoring spec

PRD §2.5 specifies card-value-based final scoring (win with 6 = 3 pts, 7 = 2, 8+ = 1). The code awards a flat 1 point per round win with a 21-point threshold (`score_manager.go:35-57`, `entity/quick_match.go:8`), and implements fire-streak (+5), freeze (+10), and challenge (±10/5) mechanics that §2.5 does not clearly document. This is a product decision, not a refactor: either the PRD is stale (update it) or the game is wrong (implement 3/2/1 scoring). Flagging it here because every scoring change downstream depends on which is true.

---

## P2 - Tooling, CI, and quality gates

### P2.1 Make the tree green, then keep it green

Current working tree: 40 tsc errors, 256 eslint problems (184 errors - the `--max-warnings 0` lint gate is red), 1 `go vet` warning. Many errors come from the dead files listed above, so P1.8/P1.10 deletions fix a large chunk for free. Then:

1. **Add CI** (GitHub Actions): backend job (`go vet`, `golangci-lint`, `go test ./...`), frontend job (`tsc --noEmit`, `npm run lint`, `npx vitest run`, `npm run build`). There is currently no `.github/` directory at all.
2. **Type-check tests**: `tsconfig.json:30` excludes all `*.test.ts` from tsc, so tests are never type-checked. Add a `tsconfig.test.json` or include them in the CI check.
3. **Tighten eslint**: enable `@typescript-eslint/no-explicit-any` (31 `any`s in production code today, including `socketHandlers: Map<..., any>` and `(data as any).roundsWon` in GameScene) and `no-console`.
4. Optional: pre-commit hooks (lefthook/husky) running format + lint on staged files.

### P2.2 Logging

Frontend: 254 `console.*` calls in production paths (GameScene 68, PreloadScene 54, LobbyScreen 38, audioManager 29, socketService 26), including logging full hands on every card play - noisy and a minor information leak. Introduce a tiny dev-gated logger and sweep. Backend: `slog` JSON is good, but `handlePlayCard` emits ~8 info logs per card play plus a per-broadcast summary (`websocket.go:1563`) - drop hot-path logs to debug level.

### P2.3 Test suite consolidation

- The frontend has a >1.2:1 test-to-source ratio but fragmented organization: CardSprite has 7 test files, GameScene 8, split between colocated `*.test.ts` and `__tests__/` dirs, with accretion names like `CardSprite.newAnimations.test.ts`. Consolidate per unit, one convention.
- Depth/visual tests assert on internal z-index constants and glow internals - brittle implementation-detail tests; prefer behavior assertions.
- The 192-line hand-written `CardSprite` mock is larger than many real modules; shrink it or test against the real class with the Phaser mock.
- Backend test gaps are inverted: the dead engine is thoroughly tested while the live `websocket.go` logic, message dispatch, auth handler, `common/auth` (JWT/bcrypt), `controller/auth` handlers, and all repositories have little or no coverage. Routing gameplay through the engine (P1.1) instantly makes the existing engine tests cover production. Add one end-to-end WS test that drives a real connection through the hub.

### P2.4 Developer experience

- **One-command dev stack**: add a root Makefile (or Taskfile/Procfile) with `make dev` = db-start + backend + frontend. Today it takes three manual steps in two directories.
- **Root README**: currently 9 bytes (`# sparui`). Write a real one: what the game is, stack, one-command setup, links to backend/frontend docs. `frontend/` has no README at all.
- Remove the Redis container from docker-compose until something uses it (or implement P1.4).
- Deduplicate the `@` alias defined in both `vite.config.ts` and `vitest.config.ts`; consider `manualChunks` so Phaser (~1MB) is split/lazy-loaded from the lobby bundle.

---

## P2 - Repo hygiene

1. **Purge committed artifacts**: `backend/bin/*` and `backend/server` (11 MB binaries), five `coverage.out` files, and two full Python virtualenvs (`.venv-audio/`, `.venv-card-processing/`) are tracked in git. Remove them and fix `.gitignore`, which was never tailored to Go (it ignores `backend/node_modules` but not `backend/bin/` or `*.out`).
2. **Archive the markdown sprawl**: ~100 planning/handoff files at the repo root (45 `TASK-*`, 10 `AUDIO_*`, 9 `WEEK*`, 8 `PARTICLE_*`, ...), nearly all stale snapshots from Dec 2025. Move to `docs/archive/` (or delete - git history keeps them). Keep only `AGENTS.md`/`CLAUDE.md`, `PRD.md`, and this doc as living documentation; retire `PROJECT_STATE.md` (153 KB) or shrink it to a one-page status.
3. **Loose scratch files**: `card-*-showcase.html`, `test-batch-showcase.html` at root, `frontend/test-depth-fix.js`, `frontend/test-audio-sounds.html` - move under a `tools/` dir or delete.
4. **Git workflow**: 59 uncommitted entries on a branch named `foo`, with recent history like `fix: state fixed`, `Broken state`, `huge diff`. Land or discard the WIP, adopt short-lived feature branches with descriptive commit messages, and let the new CI gate merges.

---

## Suggested sequencing

**Phase 0 - Stop the bleeding (days).** P0.1-P0.7: WS auth, JWT secret, hub race, lock scope, room mutation, atomic stats, vet fix, UUIDs. Commit or shelve the current 59-entry working tree first so fixes land on a clean base.

**Phase 1 - Gates (days).** P2.1 CI + green tree, P2.4 root README and `make dev`, P2 hygiene items 1 and 3 (artifacts out of git, gitignore fixed). Cheap, and everything after this is protected by CI.

**Phase 2 - Backend consolidation (1-2 weeks).** P1.1 route gameplay through the engine and dismantle `websocket.go`; P1.2 delete the stub REST layer; P1.3 config package; P1.5 error handling. This is the highest-leverage refactor in the repo: it deletes duplicated logic, activates the existing test suite, fixes the per-room locking model, and finally implements dry/challenge for real.

**Phase 3 - Contract (3-5 days, backend + frontend together).** P1.12 protocol doc, single card shape, generated/shared types, runtime validation, one event-naming convention. Do this immediately after Phase 2 while the wire surface is fresh; P1.13 (scoring spec decision) should be settled during this phase too.

**Phase 4 - Frontend consolidation (1-2 weeks).** P1.7 GameScene decomposition + single source of truth, P1.8 one socket client, P1.9 store merge, P1.10 delete duplicates/unify themes, P1.11 lifecycle fixes, P2.2 logger sweep, P2.3 test consolidation.

**Phase 5 - Ongoing.** Persistence decision (P1.4), `pgx` migration, bundle splitting, dependency major-version upgrades (React 19, Vite, Zustand 5), doc archive (hygiene item 2).

A deliberate ordering choice: backend consolidation before frontend, because the contract work (Phase 3) needs the backend's wire surface to be final, and the frontend's dual-format card handling and event-name drift cannot be cleaned up until the backend commits to one protocol.
