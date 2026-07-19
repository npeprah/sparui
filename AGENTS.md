# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spar - a real-time multiplayer card game (traditional Ghanaian card game) with arcade-style
presentation. Monorepo with a Go backend (`backend/`) and a React/TypeScript/Phaser frontend
(`frontend/`).

## Commands

### Backend (`backend/`)

- `make db-start` / `make db-stop` / `make db-reset` - Postgres + Redis via docker-compose
- `make run` (or `go run ./service/game-server/cmd/server.go`) - dev server on `:8080`
- `make build` - build binary to `bin/server`
- `make test` - `go test -v ./...`
- Single test: `go test ./service/game-server/controller/websocket/ -run TestHandlePlayCard_FollowSuitValidation -v`
- `make test-coverage` - writes `coverage.out` and `coverage.html`
- `make fmt` - `gofmt -w -s .`
- `make lint` - golangci-lint (`make install-tools` first if not installed)

### Frontend (`frontend/`)

- `npm run dev` - Vite dev server
- `npm run build` - `tsc && vite build`
- `npm run lint` - eslint, zero warnings allowed (`--max-warnings 0`)
- `npm run format` / `npm run format:check` - prettier
- `npm test` - vitest in watch mode; `npm run test:coverage` for coverage
- Single test file: `npx vitest run src/game/utils/sparRules.test.ts`
- Single test by name: `npx vitest run -t "test name"`

Path alias `@/*` resolves to `frontend/src/*` (configured in both `tsconfig.json` and
`vitest.config.ts`).

## Architecture

### Backend (`backend/service/game-server/`)

Layered by responsibility rather than by feature:

- `cmd/server.go` - entrypoint; connects the DB, initializes the auth/stats/websocket services,
  mounts REST routes under `/api/v1` (chi router), and the WebSocket endpoint at `/ws`
- `controller/` - handlers grouped by domain:
  - `game/` - the game engine itself: card play, dry-card declarations, challenges, win-streak
    tracking, scoring and timers (`game_engine.go`, `score_manager.go`, `win_streak_handler.go`,
    `dry_card_handler.go`, `challenge_handler.go`, `state_broadcaster.go`)
  - `websocket/` - connection manager and message dispatch (`connection_manager.go` tracks
    per-room client sets; `websocket.go` parses/dispatches `{event, data}` JSON messages;
    `card_format.go` is the wire format for cards)
  - `room/` - room lifecycle (create/join/ready/start)
  - `matchmaking/` - queue manager + quick-match
  - `stats/` - leaderboard and player rank endpoints
  - `auth/` - register/login/logout/JWT
- `entity/` - domain models (`game.go`, `room.go`, `deck.go`, `user.go`, `matchmaking.go`,
  `leaderboard.go`)
- `repository/` - persistence per aggregate (`game`, `room`, `user`, `stats`)
- `mapper/`, `gateway/` - entity/transport conversion and external integrations
- `common/auth`, `common/db` - shared packages usable by other services in the module

Game state is authoritative on the backend. Every client connects to the single `/ws` endpoint;
the connection manager keeps per-room broadcast lists and pushes JSON event messages to all
clients in a room.

### Frontend (`frontend/src/`)

React owns routing and menu/lobby chrome; Phaser owns the actual card table.

- `App.tsx` + `pages/` - routes: `/`, `/lobby`, `/game`, `/test-connection`
- `components/PhaserGame.tsx` - mounts a single `Phaser.Game` instance (`game/config.ts`) into
  the DOM once and owns its lifecycle independently of React re-renders
- `game/scenes/` - `PreloadScene` (loads all card/particle/avatar/sound assets up front),
  `GameScene` (table layout, turn handling, animations)
- `game/sprites/CardSprite.ts`, `game/systems/ParticleEffects.ts`, `game/utils/*` - card visuals
  and state, deal/flip/win/lose animations, particle/celebration effects, dev FPS counter
- `game/utils/sparRules.ts` - client-side mirror of the suit-following rule, used only to
  highlight playable cards; the backend remains the authority on legality
- `services/socketService.ts` - a native `WebSocket` client (not Socket.IO, despite the
  `socket.io-client` dependency in `package.json`) matching the Gorilla WebSocket backend;
  handles the auth handshake, message (de)serialization, and reconnect-with-backoff
- `services/connectionManager.ts` - reconnection state machine (5 attempts, exponential backoff
  1s -> 16s) used to drive connection-status UI
- `store/` - Zustand stores: `gameStore` (round/turn/score state; `initializeFromBackend`
  converts the backend's player/card shapes into frontend types), `lobbyStore`, `playerStore`,
  `uiStore`, `themeStore`
- React and Phaser share state indirectly: WebSocket event handlers write into the Zustand
  stores, and `GameScene` reads/writes those same stores directly rather than via React props

### Game domain rules (Spar)

- Must-follow-suit: a player must play the led suit if holding it (mirrored in `sparRules.ts`,
  enforced authoritatively in the backend game engine)
- "Dry" / "Show Dry": once per game, a player may declare a low card (6 or 7) face-down (dry) or
  face-up (show dry) for bonus points; opponents can challenge ("flag") a suspected declaration
- Win streaks: 4 consecutive round wins trigger a "Fire Streak" (visual + scoring effect) that
  persists until broken by a round loss
- `PRD.md` section 2 has the full scoring/mechanic spec if you're changing game logic

## Notes

- The repo root has many dated planning/handoff/status markdown files (`TASK-*.md`, `WEEK*.md`,
  `AUDIO_*.md`, etc.) left over from prior work sessions - treat these as historical notes, not
  living documentation. `PROJECT_STATE.md` is the closest thing to a current status doc but can
  also lag; prefer reading the code and `git log` over these files for ground truth.
- CORS in `cmd/server.go` only allow-lists `localhost:5173`/`5174` - update it if the frontend
  dev port changes.
