# Spec: Spar — Playable EK-Style Table

Labels: `ready-for-agent`
Source: synthesized from the completed /wayfinder charting (map: `.scratch/spar-ek-playable/map.md`;
all 10 decision tickets resolved under `.scratch/spar-ek-playable/issues/`). This supersedes the
earlier draft written before discovery closed.

## Problem Statement

Spar is unplayable right now. From the player's perspective: you cannot sit down with a friend
and finish a game in the browser.

- The frontend does not build (tsc is red), and the lobby and game screens disagree with the
  backend about the WebSocket contract, so screens read fields the server never sends and
  host-settings/player-left paths are silently broken.
- The gameplay that does exist is **wrong**: the shipped backend path forces you to follow suit
  (killing the game's core strategic freedom), never awards the real card-value scores, and leaves
  the signature "dry / show dry" and "flagging" mechanics as dead stubs with no frontend UI at all.
- The one round-flow that works has accumulated bugs — a fragile multi-step "play again" rebuild,
  a listener-attachment race that can leave the table inert, opponents whose hands never render.

On top of that, the table that renders feels like a flat poker simulation, while Spar's identity is
over-the-top arcade fun. The player wants the charm and energy of Exploding Kittens — chunky playful
cards, bouncy motion, comic presentation, silly sounds — and the ability to switch the look, with a
game that is provably correct and finishable.

## Solution

A 2–4-player game of Spar, playable end-to-end in a real browser, **correct to the game owner's
pinned rules** (which override the PRD and the current code where they differ), presented on an
Exploding-Kittens-style table:

- Your hand fans in an arc at the bottom; opponents appear as card-back fans with counts; played
  cards land on a central pile with bouncy overshoot; a countdown ring wraps the drop zone for the
  on-deck player.
- Comic chrome: bold chunky type, comic-panel framing, ink-outlined cards, banner/POW-style callouts
  for round wins, streaks, and flags.
- The look is **player-selectable** in settings across three palettes (Warm Heritage, Comic, Neon)
  over one fixed table structure.
- Cartoon audio: playful licensed SFX plus an original "toasty"-style easter-egg byte and an original
  NBA-Jam-style fire-streak "on fire!" sting (soundalikes, not the trademarked samples).

Correctness is proven, not assumed: verified working end-to-end in a real browser with at least two
players playing full games, across the signature mechanics.

## User Stories

### Joining and starting a game

1. As a player, I want to create a private room and get a shareable code, so that I can play with
   specific friends.
2. As a player, I want to join a room by entering its code, so that I can play with the friend who
   created it.
3. As a player, I want to see who is in the room and their ready state, so that I know when we can
   start.
4. As a player, I want to mark myself ready, so that the host knows I'm set.
5. As the host, I want to change room settings (e.g. points target) and have them actually take
   effect, so that the game is configured as intended.
6. As the host, I want to start the game once at least 2 players are present, so that we don't wait
   for stragglers.
7. As a player, I want the game to support 2, 3, or 4 players, so that any small group can play.

### Dealing and the round loop

8. As a player, I want to be dealt 5 cards from a correct 35-card Spar deck (6–A hearts/clubs/diamonds,
   6–K spades, no ace of spades), so that the game plays by the real deck.
9. As a player, I want a random leader chosen for the first game and the previous round's winner to
   lead the next round, so that starts are fair and momentum matters.
10. As the leader, I want to play any card to set the led suit, and only I can open the round — if a
    following player tries to play before me their card is rejected harmlessly, so that the round
    always starts cleanly.
11. As a following player, I want to be able to play at any time after the leader has opened (not
    forced to wait my strict turn), so that the game keeps the fast "rush" feel.
12. As a player, I want a turn timer that walks the clockwise sequence one seat at a time (leader 15s,
    first follower 8s, subsequent followers 5s) and only pressures the current on-deck seat, so that
    the pace stays frantic without blocking others from jumping in.
13. As a player, I want the led suit clearly indicated, so that I know what I'm expected to follow.
14. As a player holding the led suit, I want the freedom to break suit strategically (the system does
    NOT reject an off-suit play), so that I can manage my hand and accept the flag risk.
15. As a player, I want the highest card of the led suit to win the round, so that the rules match the
    real game.
16. As the leader, I want to win the round by default when no other player has the led suit, so that
    the round still resolves; a player without the led suit cannot win it.
17. As a player, I want the game to flow continuously without pause screens between rounds, so that the
    fast pace is preserved.
18. As a player whose turn timer runs out, I want the system to auto-play a safe legal card for me
    (my lowest led-suit card if I hold it, else my lowest card; the leader auto-plays their lowest to
    set the suit), so that the game never stalls and I'm never auto-forced into a flaggable move.

### Flagging (challenges)

19. As a player, I want to flag an opponent who broke suit when I suspect they held the led suit, so
    that I can punish an illegal move (playing the wrong suit while holding the led suit).
20. As a player, I want a correct flag to cost the flagged player -3 on the cumulative match score and
    then void the whole current game (reshuffle, fresh game), so that flagging has real teeth.
21. As a player, I want an incorrect flag to cost me (the challenger) -3 on the match score and void
    the game symmetrically, so that flagging is a genuine two-way risk.
22. As a player, I want the cumulative match score to persist across voided/new games, so that the -3
    penalties actually matter.
23. As a player, I want the flagged player's hand revealed on resolution, so that the outcome is
    transparent.

### Dry / Show Dry

24. As a player, I want to declare one 6 or 7 as "dry" (face-down) at game start, so that I can chase
    bonus points (6 pts for a 6, 4 pts for a 7) if I win the final round with it.
25. As a player, I want to declare "show dry" (face-up) instead for double stakes (12 pts for a 6,
    8 pts for a 7), so that I can gamble bigger.
26. As a player, I want to skip declaring entirely, so that I'm not forced into a bad bet.
27. As a player, I want the dry/show-dry bonus to score ONLY when I win the final round with the
    declared card, so that the bet carries real risk.
28. As a player, I want declared cards set aside visually (face-down back for dry, face-up for show
    dry), so that everyone can see the state of the declaration.

### Scoring and winning

29. As a player, I want the winner of the 5th and final round to win the game, so that the endgame is
    dramatic.
30. As a player, I want final-round wins scored by card value (6→3 pts, 7→2 pts, 8+→1 pt), so that
    low-card wins feel special.
31. As a player, I want dry/show-dry bonuses to replace the base score when I win the final round with
    my declared card, so that declarations pay off.
32. As a player, I want cumulative match scores visible, so that we can play to a target total across
    games.

### Fire streaks and effects

33. As a player, I want my card to burst into flames on the 4th round after winning 3 consecutive
    rounds as leader (fire streak), so that dominance feels spectacular.
34. As a player, I want breaking someone's streak to trigger a freeze effect, so that the counter-play
    feels equally spectacular.
35. As a player, I want a rare "toasty"-style pop-up + sound byte on special plays, so that the game
    has comic surprises.

### EK-style presentation

36. As a player, I want my hand fanned in an arc at the bottom with chunky, ink-outlined cards, so
    that the table feels playful and tactile.
37. As a player, I want opponents shown as card-back fans with counts, so that the table reads at a
    glance.
38. As a player, I want played cards to fly to a central pile with bouncy overshoot motion, so that
    plays feel punchy.
39. As a player, I want a countdown ring wrapping the drop zone for the on-deck player, so that turn
    pressure is visible where the action is.
40. As a player, I want illustrated, characterful card faces (the existing afro-heritage art), so that
    the game has soul.
41. As a player, I want bold comic banners and callouts for round wins, streaks, and flags, so that
    events land with impact.
42. As a player, I want playful cartoon sound effects for dealing, playing, and winning, so that the
    game sounds as fun as it looks.

### Theme selection (new)

43. As a player, I want to choose the table's look in settings among Warm Heritage, Comic, and Neon,
    so that I can play in the style I like.
44. As a player, I want my chosen theme to persist and apply across the table (chrome, borders, back,
    callouts) while the card faces stay consistent, so that switching feels coherent.

### Comic callouts (new)

45. As the designer, I want a data-driven config that maps game events to callout words, styles, and
    triggers (e.g. big play → "POW!", flag → "BUSTED!", win → "BOOM!"), so that I can change what
    shows and when without touching code.

### Game over and replay

46. As a player, I want a victory screen showing the winner, winning card, and points earned, so that
    the win is celebrated.
47. As a player, I want "play again" to reliably deal a fresh game for everyone in the room without
    re-lobbying and without the cards/state breaking, so that rematches are instant.

### Developer / maintainer stories

48. As a maintainer, I want the frontend to build with zero TypeScript errors, so that the build is
    trustworthy.
49. As a maintainer, I want lint at zero warnings and the vitest + `go test` suites green and `go vet`
    clean, so that regressions are caught.
50. As a maintainer, I want the frontend↔backend WebSocket contract to agree exactly (one source of
    truth), so that no screen reads a field the server never sends.
51. As a maintainer, I want the backend to be the authoritative, CORRECT rules engine (once fixed), so
    that the client only mirrors rules for affordances.
52. As a maintainer, I want dead code removed (orphaned `socket.io-client`/`useSocket`, duplicate
    SettingsModal, duplicate particle system), so that future work starts clean.
53. As a maintainer, I want a repeatable one-command way to run a ≥2-player game in real browsers and
    verify the acceptance scenarios, so that "playable" is provable on demand.

## Implementation Decisions

Discovery revealed the destination is bigger than "restyle the table." There are three tracks —
**backend rules-correctness**, **wire-contract**, and **frontend rebuild + EK presentation** — plus
audio and card-art work.

### Rules authority

- The **game owner's pinned rules override both the PRD and the current code** where they differ.
  The authoritative rules (recorded in ticket 04 / the map) are:
  - Off-suit is NOT system-rejected; breaking suit while holding the led suit is legal and policed
    only by flagging.
  - Turn order governs whose *timer* runs, not who may play: only the leader opens (pre-leader plays
    rejected); after the leader, anyone may play at any time; the timer walks the clockwise sequence
    (first follower 8s, subsequent 5s), pressuring only the on-deck seat.
  - A correct flag → flagged player -3 on the cumulative match score, whole current game voided +
    reshuffled + fresh game. A wrong flag → challenger -3, game voided symmetrically. Match score
    persists across games.
  - Timer expiry → auto-play the lowest led-suit card if held, else the lowest card; leader auto-plays
    lowest to set the suit.
  - Fire streak = 3 consecutive round wins as leader → the 4th-round card is "on fire"; freeze counter
    when the streak is broken.
  - 35-card deck: 6–A hearts/clubs/diamonds, 6–K spades, **no ace of spades**.

### Backend rules-correctness track

- The shipped WebSocket path currently bypasses the tested rule libraries and is wrong. It must be
  corrected to the pinned rules and become the single authoritative engine: remove forced
  follow-suit; loosen strict turn-order enforcement to the timer-walks-sequence model; implement
  value scoring (6→3/7→2/8+→1); wire dry/show-dry and flagging (currently stubs) with the correct
  declaration/resolution and the game-void + persistent-match-score behavior; fix the deck
  composition; set the fire-streak threshold to 3; choose a random first leader; implement
  timer-expiry auto-play. Remove the invented point bonuses not in the ruleset.
- Backend remains the authority; the frontend mirrors rules only for affordances (highlighting
  playable cards).

### Wire-contract track

- Reconcile the ~18 frontend↔backend event mismatches into an agreed contract with a single source of
  truth: fix the lobby-create payload shape, add the missing `update_settings` handling, align the
  player-left event name/shape, ensure the server streams turn-timer updates, and correct the typed
  client interfaces so no screen reads a field the server never sends.
- Remove the dead Socket.IO surface (`socket.io-client` dependency, orphaned `useSocket`).

### Frontend rebuild + EK presentation

- **Rebuild the table scene's orchestration; reuse the building blocks.** Replace the god-class
  `GameScene` with a new, clean table scene; reuse and extend `CardSprite` (add EK ink-outline
  border + per-theme treatment + state overlays) and reuse the deal/play/overshoot animation utils,
  the particle-effects system, the Zustand stores, and the client-side `sparRules` mirror.
- Build fresh: the agreed layout (Variant-A structure), comic-panel chrome (Variant B), the
  countdown ring at the drop zone (Variant C), the bouncy motion beats, opponent card-back fan
  rendering (missing today), the clean play-again path against the corrected rules, and the corrected
  turn/round handling. Fix the listener-attach race, the auto-play-on-any-click hack, and the
  stale-streak reads in the process.
- **Cutover: replace in place on a dedicated integration branch.** The scene rebuild is a wide
  refactor — its sub-steps may be red in isolation on the branch; a final integrate-and-verify (the
  acceptance runs pass + all quality gates green) gates the merge to `main`, so `main` never goes red.
  Delete the old `GameScene` + its aspirational tests as part of the cutover.

### Theming (now in scope)

- A player-selectable palette picker in settings — **Warm Heritage** (default), **Comic**, **Neon** —
  over one fixed table structure, built on the existing `themeStore` + settings modal + surface-theme
  infrastructure. Themes reskin chrome/borders/table/back/callouts; card faces stay palette-agnostic.

### Comic-callout config (new feature)

- A data-driven, designer-authored config maps game events → callout word(s) + style + trigger.
  Editable without code changes. Not a player-facing editor (that is out of scope).

### Card art

- Reuse the existing painterly afro-heritage illustrations as the card faces (one set, palette-
  agnostic). Get EK chunkiness from in-engine chrome: chunky ink-outline borders + comic framing +
  per-theme (gold/comic/neon) treatment, rendered programmatically in Phaser/CSS — NOT baked into
  per-theme PNGs.
- Fill the two asset gaps via the existing AI card pipeline (prompts + processing + compression):
  the missing `spades_6` (to complete the corrected 35-card deck) and a single designed card back
  (replacing the procedural one), in matching style.
- Fire/freeze/dry card states render as runtime overlays/effects on the faces (via the particle
  system + border treatment), not as new art.

### Audio

- Replace the 16 synthetic placeholder SFX (already wired by key) with real, license-clean cartoon
  SFX on the signature moments — a file-swap at the existing keys, from CC0/Pixabay/Freesound-CC0
  packs, all logged in the existing manifest/credits.
- The "toasty" easter egg and the fire "on fire!" beat are **original soundalikes** that evoke, not
  copy, the Mortal Kombat / NBA Jam references — never the trademarked samples; vet each clip that it
  isn't a disguised rip.
- Repurpose the `invalid_move` placeholder for the pre-leader rejection (off-suit is not rejected).

## Testing Decisions

A good test asserts external behavior — events emitted, state transitions, scores, turn flow — not
implementation details, and lives at the highest seam that can catch the bug.

- **Top seam — real-browser E2E (the acceptance proof).** Playwright driving 2 browser contexts (full
  script) and 3 contexts (a reduced smoke) against the real backend over real WebSocket. No mocking
  at this seam — it exists to catch contract drift and integration bugs. Structured as targeted runs:
  A) clean full 2-player game (room→deal→rounds with off-suit freedom→final-round value scoring→game
  over→play again→match score persists); B) correct flag → offender -3, game voided; C) wrong flag →
  challenger -3, game voided; D) timer-expiry auto-play; E) dry win; F) show-dry win; G) fire streak
  + freeze; H) 3-player smoke exercising the subsequent-follower 5s timer + multi-opponent rendering.
  - Enabled by a single env-gated backend **test-mode** (`SPAR_TEST_MODE`, never in prod) bundling
    DB-optional boot (server runs without Postgres; auth/stats degrade) and a hand-injection hook
    (set exact hands + deck order for named scenarios), plus a frontend test-only `window.__sparTest`
    game API (`playCard`, `flag`, `declareDry`, …) so Playwright drives real actions through the full
    client→WS→backend→clients loop and asserts on the real store/rendered state. React lobby chrome
    is driven as normal DOM.
  - Asserts functional outcomes + cheap state-driven visual facts. Captures screenshots/video at the
    key beats for a separate **human EK-feel pass** (motion/juice/audio) reviewed against the `06`
    prototype at release points — feel is NOT scripted pass/fail. Waits on state assertions, not fixed
    sleeps (anti-flake). One-command local runner (`npm run test:e2e`-style); lives in `frontend/e2e/`.
- **Backend seam — game-engine unit tests.** Rules behavior tested with table-driven unit tests
  matching the existing challenge/dry/score/streak/engine style. The corrected rules must be covered
  here; tests that currently encode the right behavior and fail (e.g. off-suit legality) are made
  green by fixing the code.
- **Frontend seam — stores and utils via vitest.** Client logic (game store, rules mirror, animation/
  sprite helpers, theme store, callout config) tested with vitest, matching the existing layout.
  Phaser canvas rendering is NOT unit-tested — it's covered by the E2E seam + the human feel-pass.
- **Reaching green from today's red: triage, don't obey.** A test is authoritative only if it reflects
  a decision. Fix correct-but-regressed tests; delete tests for purged dead code and out-of-scope
  speculative features; rewrite tests asserting old/wrong rules to the pinned rules.
- **The green bar.** "Playable" and every merge to `main` require: zero tsc/build errors, zero lint
  warnings, green vitest, green `go test ./...`, clean `go vet`, plus the E2E acceptance runs + the
  human feel-pass at release points. Each build ticket lands green at `main`; the scene rebuild is the
  one integration-branch exception (green promised at its integrate-and-verify merge). New code comes
  with tests at the established seams. No numeric coverage-% gate.

## Out of Scope

- AI opponents / single-player mode.
- Public matchmaking.
- Accounts, stats persistence, leaderboards.
- Disconnect/reconnect-and-resume (auto-play-on-expiry already lets a game finish if someone drops).
- Background music, and any broader announcer voice-line system beyond the toasty + fire stingers.
- A player-facing editor for the comic-callout words (the callout config is designer-authored only).
- Three fully distinct table layouts, or arbitrary table-surface/card-theme systems beyond the three
  palettes over one fixed structure.
- Mobile/Capacitor builds, deployment/hosting, and wiring a CI pipeline (the E2E harness is CI-ready
  but CI itself is a separate track).
- Match-series point targets beyond tracking cumulative scores across games in a room.

## Further Notes

- **Discovery record.** This spec collapses the resolved wayfinder map (`map.md`) and its ten decision
  tickets. The EK-table design was chosen from a 3-variant prototype (asset:
  `prototypes/06-ek-table/index.html`) as "A's layout + B's chrome + C's timer ring."
- **Known starting facts (from audits 01–03).** The frontend build is red (~40 tsc errors) but the app
  likely runs in dev (Vite skips tsc; most failing files are dead/orphaned). The backend is not a
  trustworthy rules authority today (live path bypasses the tested libraries; 3/6/2 rules
  correct/incorrect/missing; 3 test packages fail). ~18 wire-contract mismatches exist with no shared
  contract source. Three dead-code chains await removal.
- **Ubiquitous language.** led suit; leader; on-deck seat; follow / off-suit; illegal move (off-suit
  while holding the led suit); flag (challenge); dry / show dry; round (highest led-suit card wins);
  game (5 rounds); match score (cumulative, persists across games); fire streak; freeze counter;
  callout; theme/palette (Warm Heritage / Comic / Neon).
- **Sequencing hint for /to-tickets.** Natural spine: green-build + wire-contract + dead-code purge →
  backend rules correctness → frontend scene rebuild (integration branch) with the corrected rules and
  EK chrome/theming/callouts → card-art gaps + audio swap → test-mode + Playwright harness →
  integrate-and-verify against the acceptance runs. The scene rebuild is a wide refactor, not
  independently-mergeable slices.
