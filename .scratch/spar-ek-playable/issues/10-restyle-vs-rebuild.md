# Restyle the existing GameScene or rebuild the table scene?

Type: grilling
Status: resolved
Blocked by: 01, 06 (both resolved)

## Question

Decide the implementation approach for the EK-style table: restyle/refactor the
existing `frontend/src/game/scenes/GameScene.ts` + `CardSprite.ts` in place, or build a
new table scene alongside/instead and cut over.

Depends on the current-state audit (01) — how sound is the existing scene's structure —
and the EK-table prototype (06) — how far the agreed design sits from what exists.
Weigh: amount of dead code in the current scene, test coverage of scene behavior
(`PreloadScene.test.ts` and utils tests exist), and the risk of carrying animation
debt into the new design.

## Resolution

Resolved via /grilling (HITL). Facts: `GameScene.ts` is a 1477-line god-class (layout,
theme, player-info, WS listeners, deal/play/animation, state subs, the fragile 15-step
play-again rebuild) - debt lives in the ORCHESTRATION. The building blocks are sound:
`CardSprite` (928 lines, states + animations), deal/play/overshoot animation utils,
`ParticleEffects`, the stores. The corrected 04 rules (anyone-plays-after-leader, timer
walks the sequence, flag-voids-game) force a rework of the turn/round orchestration
regardless.

### Decisions

- **Rebuild the scene ORCHESTRATION; reuse the building blocks.** New clean table `Scene`
  replaces `GameScene`'s layout/turn/play-again logic. (Rejected restyle-in-place -
  carries the god-class + play-again debt into the new design; rejected full-scratch -
  wastes the solid CardSprite/animation work.)
- **Reuse + extend:** `CardSprite` gains the EK ink-outline border + per-theme
  (gold/comic/neon) treatment + state overlays, keeping its state-machine/animation/drag
  work (refactor only methods that fight the change). Reuse as-is: deal/play/overshoot
  animation utils, `ParticleEffects`, the stores (`gameStore`/`playerStore`/`themeStore`/
  `uiStore`), the `sparRules` playable-card mirror.
- **Rebuild fresh:** table layout (A-layout + C timer-ring), comic chrome (B) + callout
  config, 3-palette theming via `themeStore`, the play-again path (clean, against corrected
  rules), turn/round handling (04 model), and **opponent card-back fan rendering** (missing
  today). Fix along the way: listener-attach race (`GameScene.ts:1116-1119`), the
  auto-play-300ms hack (`:736-740`), stale-streak reads (`:1211-1220`).
- **Cutover: replace in place on a dedicated INTEGRATION BRANCH** (wide-refactor pattern;
  the 09 exception). Sub-tickets may be red in isolation on the branch; a final
  **integrate-and-verify** (05 acceptance runs pass + all 09 gates green) gates the merge
  to `main`. **`main` never goes red**; the branch is red mid-rebuild. The old `GameScene`
  + its aspirational tests are deleted as part of the rebuild.

### Graduates to build work

The scene rebuild is one integration-branch effort with an integrate-and-verify gate, not
independently-mergeable slices. /to-tickets should model it as: CardSprite extension →
new-scene layout/chrome/theming → turn/round + play-again against corrected rules →
opponent-hand rendering → integrate-and-verify (05 runs green) → delete old GameScene.
