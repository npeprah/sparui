# Map: Spar — Playable EK-Style Table

Labels: `wayfinder:map`

## Destination

A 2–4-player game of Spar, core PRD rules (5 rounds, scoring, dry/show dry, flagging,
fire streaks, play-again), on an Exploding Kittens-style card table (fanned hand, central
pile, chunky illustrated cards, bouncy motion, comic UI chrome, cartoon audio incl.
toasty-style easter egg + NBA-Jam fire streak), proven working end-to-end in a real
browser with ≥2 players. Bugs fixed along the way.

## Notes

- Domain: Go backend (`backend/`, authoritative game state, Gorilla WebSocket at `/ws`) +
  React/TypeScript/Phaser frontend (`frontend/`). Rules authority: `PRD.md` §2.
- Do NOT use the repo's `.claude/agents/*` personas — user instruction, fresh eyes only.
  Use plain subagents (`explore`/`coder`) via Agent/AgentSwarm.
- Ticket types: resolve `grilling` tickets with the /grilling + /domain-modeling skills
  (HITL), `research` tickets with research subagents (AFK), `prototype` tickets with the
  /prototype skill (HITL).
- Tracker: local markdown. Map is `.scratch/spar-ek-playable/map.md`; tickets in
  `.scratch/spar-ek-playable/issues/`. Frontier = open, unblocked, unclaimed; first by
  number wins.
- Known starting facts (charting session):
  - Frontend `tsc --noEmit` reports ~40 errors (missing `lucide-react` dep,
    `RoomPlayerReadyResponse.players` mismatch in `LobbyScreen.tsx`, `useSocket.ts`
    typed against Socket.IO while `services/socketService.ts` is a native WebSocket
    client, many unused vars). `npm run build` (`tsc && vite build`) therefore fails.
  - Backend `go build ./...` clean; `go vet` one self-assignment in
    `dry_card_handler.go:115`. Backend has a broad unit-test suite under
    `backend/service/game-server/controller/game/`.
  - No Playwright, no e2e directory; frontend tests are vitest only.
  - Repo has uncommitted changes; last commits: `5a8d68a Broken state`,
    `02b6d5d fix: state fixed`.

## Decisions so far

<!-- one line per closed ticket: gist + link; detail lives in the ticket -->

- **01 current-state audit** ([issues/01](issues/01-current-state-audit.md)): build is RED
  (40 tsc errors, lint 256 problems, 92 failing tests) but the app likely RUNS in dev
  (Vite skips tsc; failing files are mostly dead/orphaned). 3 dead-code chains to purge
  (`useSocket`+`socket.io-client`, duplicate `SettingsModal`, duplicate particle system).
  Live bugs: `LobbyScreen.players`, listener-attach race, missing opponent-hand backs,
  fragile 15-step play-again rebuild, and **no dry/flag UI at all**. Net: stabilize +
  build-the-missing, not resurrect-the-dead.
- **02 backend rules audit** ([issues/02](issues/02-backend-rules-audit.md)): backend is
  NOT a trustworthy rules authority - live websocket path bypasses the tested libraries.
  3 correct / 6 incorrect / 2 missing vs PRD §2. Forces follow-suit (violates core
  freedom rule), no value scoring, dry+flag are stubs, mis-composed spades, fire-streak
  fires a round early (code=2, PRD=3), non-random leader, 3 test packages fail.
- **03 wire-contract audit** ([issues/03](issues/03-wire-contract-audit.md)): ~18 FE↔BE
  mismatches; 2-player game only limps through. `lobby:update_settings` unhandled,
  `lobby:create` shape wrong, `room:player_left` name+shape mismatch, matchmaking wholly
  unwired, `timerUpdate` never sent. No shared contract source. `socket.io-client` dead.

**Cross-cutting takeaway:** the destination is bigger than "restyle the table." There is a
real **backend rules-correctness track** and a **wire-contract track** underneath the
EK-presentation work - the spec's "backend authoritative, frontend mirrors" premise is
false today and must be re-decided.

- **04 e2e acceptance script** ([issues/04](issues/04-e2e-acceptance-script.md)): finish
  line = full ruleset, proven as a SET of targeted browser runs (clean 2p game A;
  correct-flag B; wrong-flag C; timer-expiry D; dry E; show-dry F; fire+freeze G; 3p smoke
  H). Functional assertions are the automated gate; EK "feel" is a separate human pass;
  reconnect out of scope. Harness needs deterministic/seedable deals (→ carried to 05).
- **05 e2e harness** ([issues/05](issues/05-e2e-harness.md)): Playwright multi-context
  (2 ctx full / 3 ctx smoke) vs the real backend over real WS. Backend gets one env-gated
  `SPAR_TEST_MODE` bundling DB-optional boot + a hand-injection hook; frontend gets a
  test-only `window.__sparTest` game API so Playwright drives real actions (not brittle
  canvas clicks). Functional assertions + screenshots for the human feel-pass; anti-flake
  via state waits. One-command local runner, CI-ready but CI-wiring out of scope (no CI
  today). Lives in `frontend/e2e/`.
- **09 quality bar** ([issues/09](issues/09-quality-bar.md)): to declare playable AND for
  every build ticket to land green - zero tsc errors, zero lint warnings, green vitest,
  green `go test ./...`, clean `go vet`, plus the 05 e2e runs + human feel-pass. Reach
  green by triaging existing red (fix regressed / delete dead+speculative / rewrite
  wrong-rule tests), NOT by making all aspirational tests pass. New code tested at seams
  (backend table-driven; FE store/util vitest; Phaser via e2e, not unit). No coverage-%
  gate.
- **08 audio sourcing** ([issues/08](issues/08-audio-sourcing.md)): 16 placeholder SFX are
  already wired but synthetic - replace with real cartoon SFX (signature moments) via a
  file-swap at existing keys. Sourcing = ALL licensed free packs (CC0/Pixabay/Freesound-
  CC0), logged in the manifest/credits. Toasty + "on fire!" beats = original soundalikes
  (evoke, not copy - no MK/NBA-Jam samples). Music OUT of scope; broader announcer OUT of
  scope. `invalid_move` sound repurposed for pre-leader rejection (off-suit isn't
  rejected).

**Rules pinned by the owner during the 04 grilling (authoritative - override PRD/code where
they differ; these correct ticket 02's audit):**

- **Off-suit is NOT rejected** - a player may break suit while holding the led suit; policed
  only by flagging. Backend's forced follow-suit is a confirmed BUG to REMOVE.
- **Turn order = whose TIMER runs, not who may play.** Only the leader opens (pre-leader
  plays rejected). After the leader anyone may play anytime; a timer walks the clockwise
  sequence (first follower 8s, subsequent 5s), pressuring only the on-deck seat. Backend's
  strict turn-order enforcement is a confirmed BUG to LOOSEN.
- **Illegal move = wrong suit while holding the led suit.**
- **Correct flag:** offender -3 on cumulative MATCH score; whole current 5-round game VOIDED
  + reshuffle + fresh game; match score persists. (Diverges from PRD "round ends".)
- **Wrong flag:** symmetric - challenger -3, game voided.
- **Timer expiry:** auto-play lowest led-suit card if held else lowest card; leader
  auto-plays lowest to set suit. (Makes reconnect non-essential for finishing.)
- **Fire streak = 3 consecutive wins as leader → 4th-round card on fire**; freeze counter
  when broken. (Settles the 2/3/4 contradiction; code=2 and CLAUDE.md=4 are both wrong.)

- **06 EK-table prototype** ([issues/06](issues/06-ek-table-prototype.md), asset:
  `prototypes/06-ek-table/index.html`): agreed EK direction = **A's layout** (opponents
  across top, big central pile, wide bottom fan) + **B's chrome** (comic panel, halftone,
  ink outlines, speech-bubble banners, POW/BAM bursts) + **C's timer ring** (circular
  countdown wrapping the drop zone). Motion: deal stagger, play bouncy-overshoot, banner
  pop, fire burst, flag reveal. **Scope-expanding additions:** (1) palette is
  player-selectable in settings - 3 themes (Warm Heritage default / Comic / Neon), fixed
  structure, on the existing `themeStore` (moves theme customization INTO scope); (2) a
  data-driven, designer-authored comic-callout config (event → word + style + trigger),
  editable without code (new feature). Unblocks 10; steers 07 (art must read across 3
  palettes).
- **07 card art** ([issues/07](issues/07-card-art-production.md)): REUSE the existing 34
  painterly afro-heritage illustrations as faces; EK chunkiness comes from chrome + borders
  + motion, not new faces. Faces palette-agnostic; per-theme chunky border/chrome
  (gold/comic/neon) reskins the surroundings. One base card back, themed by border.
  Generate the 2 gaps (`spades_6` + card back) via the existing AI pipeline; render
  borders/chrome/per-theme treatments IN-ENGINE (not baked into PNGs). Fire/freeze/dry are
  runtime overlays on faces via ParticleEffects (not new art). Art matches corrected deck
  (spades 6-K, no ace).
- **10 restyle-vs-rebuild** ([issues/10](issues/10-restyle-vs-rebuild.md)): REBUILD the
  scene orchestration, REUSE the building blocks. New clean table Scene replaces the
  1477-line `GameScene` god-class; reuse+extend `CardSprite` (EK border/theme/state
  overlays), reuse animation utils + `ParticleEffects` + stores + `sparRules`. Rebuild
  fresh: A-layout + C ring, comic chrome + callouts, 3-palette theming, clean play-again,
  04 turn/round model, opponent card-back fans. Cutover = replace in place on an
  INTEGRATION BRANCH (wide-refactor exception to 09): branch red mid-rebuild, `main` green
  at the integrate-and-verify merge (05 runs + 09 gates); delete old GameScene + aspirational
  tests as part of it.

## Not yet specified

_Discovery complete - all 10 decision tickets resolved. Remaining unknowns are now build
detail, owned by the /to-spec re-run + /to-tickets breakdown, not further charting. The
concrete bug-fix list (from audits 01-03) and the dead-code cleanup scope (from 03) feed
the /to-tickets breakdown directly._

## Out of scope

- AI opponents / single-player mode (PRD lists it; ruled out at charting).
- Public matchmaking (same).
- Accounts, stats persistence, leaderboards.
- ~~Table-surface and card-theme customization systems~~ - **PARTIALLY IN SCOPE as of 06**:
  a settings palette picker with 3 themes (Warm Heritage / Comic / Neon) over a fixed table
  structure IS now in scope. Still OUT: three fully distinct table layouts, and arbitrary
  card-theme/surface systems beyond those 3 palettes.
- A player-facing editor for the comic-callout words (the callout CONFIG is in scope as of
  06, but designer-authored only; letting players edit the words/triggers is out).
- Mobile/Capacitor builds, deployment/hosting.
