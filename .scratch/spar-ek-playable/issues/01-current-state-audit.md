# Current-state audit: what works and what's broken?

Type: research
Status: resolved
Blocked by: none

## Question

What is the actual current state of the frontend — what builds, what runs, what's
broken, and what's dead? Produce the factual baseline every other decision depends on.

Cover, at minimum:

- Build/test state: `tsc --noEmit` error inventory grouped by file/theme (already known:
  ~40 errors incl. missing `lucide-react`, `LobbyScreen.tsx` using
  `RoomPlayerReadyResponse.players`, `useSocket.ts` typed for Socket.IO), `npm run lint`,
  and `npx vitest run` — what passes, what fails.
- Structure inventory: how `HomePage` → lobby → `PhaserGame` → `PreloadScene` →
  `GameScene` fits together; what `GameScene.ts` currently renders (layout, hand, played
  cards, timers, dry/flag UI); what `CardSprite.ts` and `game/utils/*` provide.
- Dead/duplicated code: `hooks/useSocket.ts` vs `services/socketService.ts` vs the
  `socket.io-client` dependency — which is live, which is orphaned.
- Uncommitted-change state: what the modified/untracked files in `git status` were
  reaching for (avatars, card colors/states, particle config, modals/settings) and
  whether they compile into the app or dangle.
- Apparent bug list: anything visibly broken in code paths for dealing, playing,
  round transitions, scoring display, play-again — from reading, not browser runs
  (browser verification is a separate ticket).

Do not fix anything. Report findings with file:line references.

## Resolution

Audited (fresh-eyes subagent, read-only).

**Build/run/lint/test state:**
- **`npm run build` FAILS** at `tsc` with **40 errors across 11 files.** But **`npm run dev`
  (Vite/esbuild, no tsc) almost certainly RUNS** - every failing file is either
  dead/orphaned or fails only on `noUnusedLocals`/type-noise esbuild ignores, and the one
  hard missing-module error (`lucide-react`) is in a dead component never in the runtime
  graph.
- **Lint FAILS:** 256 problems (184 errors, 72 warnings); `--max-warnings 0` → always red.
  Bulk is `@typescript-eslint/no-explicit-any`, mostly in `*.test.ts` and mock files.
- **Tests FAIL:** vitest = 10 failed files / 58 passed (68 total); 92 failed / 1109 passed
  (1201 tests). Many failures are newly-added tests written against behavior the code
  doesn't implement (surface system, audio manager, new animation shapes) + a broken
  CardSprite test-mock (`ReferenceError: CardSprite is not defined`).

**The 40 tsc errors group as:** 1 missing `lucide-react` (dead file), 6 in dead
`useSocket.ts`, **4 LIVE** in `LobbyScreen.tsx:156-161` (`.players` bug, cross-ref 03),
11 in dead `particleManager.ts`, 16 unused-locals (mixed), 1 LIVE duplicate-`targets`
object-literal bug in `cardVisuals.ts:186`.

**Dead / duplicated code (3 orphan chains inflating the counts):**
- `hooks/useSocket.ts` (+ `hooks/index.ts` barrel imported by nothing) - dead; sole
  importer of `socket.io-client`. Both removable.
- **Duplicate `SettingsModal`**: `components/settings/` is LIVE (used by HomePage);
  `components/modals/` is DEAD (barrel imported by nothing) and is the only thing pulling
  in the missing `lucide-react`.
- **Duplicate particle system**: `game/systems/ParticleEffects.ts` is LIVE;
  `game/utils/particleManager.ts` + `celebrationEffects.ts` + `constants/particleConfig.ts`
  are a dead orphan chain (11 tsc errors). Also orphaned: `constants/typography.ts`,
  `game/styles/cardStyles.ts`.
- Uncommitted work that IS wired: avatars + `components/avatar/` + `components/settings/`,
  `cardColors`/`cardStates`, `cardVisuals`/`cardAnimations`, `themeStore`.

**Structure:** `HomePage` → `socketService.connect` → lobby → `LobbyScreen` (owns
room/ready/start) → `game:started` → `GamePage` → `PhaserGame` → `config.ts`
[`PreloadScene`, `GameScene`]. `PreloadScene` loads cards/particles/avatars/4 surfaces.
`GameScene` (1477 lines) renders themed background, fanned hand (4 positions), click/drag
play; `CardSprite` (928 lines) owns card visuals + fire/frozen/selected states.

**Apparent bug list (read-only):**
1. **`LobbyScreen` ready-sync is dead** - reads `data.players` that never exists at runtime
   (`LobbyScreen.tsx:156-161`).
2. **GameScene listeners can silently never attach** - `setupWebSocketListeners()` returns
   early if socket not connected at scene-create, no retry (`GameScene.ts:1116-1119`). Navigate
   straight to `/game` or reconnect-in-flight → inert table.
3. **Opponents' hands never rendered as face-down backs** - deal only deals own cards to
   `bottom` (`GameScene.ts:546-557`); opponent sprites conjured on-demand when they play.
4. **Fire-streak threshold mismatch on frontend too** - triggers at `winnerStreak >= 3`
   (`GameScene.ts:1249`) vs CLAUDE.md's "4" (and backend's "2" - three different numbers
   across the stack; cross-ref 02).
5. Stale-object read for streak count (`GameScene.ts:1211-1220`) - brittle.
6. **No client-side turn gating** - auto-emits `game:play_card` 300ms after any click
   regardless of `isMyTurn` ("MVP testing", `GameScene.ts:736-740`).
7. Redundant double `playedCards.set` (`GameScene.ts:767,831`) - copy-paste drift near the
   fragile play-again logic (git `6e0043e`, `68c8680`).
8. `cardVisuals.ts:186` duplicate `targets` key silently overwrites one config.
9. **`game:restarted` is a 15-step manual teardown/rebuild** (`GameScene.ts:1332-1442`)
   with explicit ordering comments - exactly the play-again path recent "Broken state" /
   "state fixed" commits churned on. Standing correctness risk.
10. **Dry/Show-Dry/Flag mechanic has NO frontend UI at all** - `isDry`/`isShowDry` arrive
    from backend and are only `console.log`'d. A core game feature is entirely unbuilt
    client-side (cross-ref 02, where the backend side is also stubbed).

**Implication for the spec:** "the frontend does not compile" is technically true (tsc/build
red) but the app likely *runs in dev* - so this is less "resurrect a dead app" and more
"stabilize build+lint+tests, fix a handful of live bugs, and BUILD the missing dry/flag UI
+ opponent-hand rendering." Bug #9 (play-again) and #2 (listener attach) are the highest
correctness risks. Unblocks ticket 10 (restyle-vs-rebuild) together with the 06 prototype.
