# How do we produce the illustrated card art?

Type: grilling
Status: resolved
Blocked by: none

## Question

Decide the production path for the chunky illustrated card faces the EK-style table
needs.

Context: the repo already has AI-asset pipelines — `scripts/batch_process_cards.py`,
`scripts/process_card.py`, `scripts/compress_images.py`, and prompt collections at the
root (`AI-PROMPTS-READY-TO-USE.md`, `AI-PROMPTS-TEST-BATCH.md`) — plus existing card
images under `frontend/public/assets/cards/`. Options to weigh: reuse/regenerate via
the existing AI pipeline, placeholder-first (simple illustrated look drawn in code,
upgrade later), or another source. Also decide whether all 35 faces get unique
illustrations or a smaller set of illustrated variants, and what the card back looks
like.

## Resolution

Resolved via /grilling (HITL). Key fact: an existing set of **34 premium painterly
afro-heritage card illustrations** already exists (`frontend/public/assets/cards/<suit>/`,
+ `raw_assets/` originals, ~12MB, ~89KB/card) - high production value, but a different
style from the EK "chunky cartoon" of 06. Gaps: **`spades_6` missing** (set is 34;
`PreloadScene` even hardcodes "34 cards"), and **no card-back image** (procedural in code).

### Decisions

- **Face art: REUSE the existing painterly illustrations.** Don't regenerate cartoon faces.
  EK chunkiness comes from **chrome + borders + motion** (06's B-chrome + bouncy motion),
  not from the face art. One maintainable face set; strong culturally-rooted art preserved.
- **Faces are PALETTE-AGNOSTIC; themes reskin the surroundings.** Same faces across Warm
  Heritage / Comic / Neon; the chunky ink-outline **border adapts per theme** (gold /
  bold-black comic / neon-glow), plus themed table/back/callouts. No per-theme face
  variants. (A per-theme face color-grade was considered and rejected unless plain faces
  read badly on Neon in the real build.)
- **Card back: ONE base afro-heritage illustration**, themed via the same per-theme
  border/chrome; replaces the procedural code-drawn back so opponent card-back fans look
  finished.
- **Production path: existing AI pipeline for the 2 gap illustrations; chrome in-engine.**
  Generate `spades_6` + the card back via `AI-PROMPTS-*` + `process_card.py` +
  `compress_images.py` in matching style. Borders/chrome + per-theme treatments are
  **rendered programmatically in Phaser/CSS, NOT baked into PNGs** - so theming is dynamic
  and the asset set stays small (baking would be ~35×3 = 105 images and kill dynamic
  theming).

### Cross-cutting / folded in

- **Deck correctness:** art must match the corrected PRD deck - **spades 6-K, NO ace of
  spades**. Existing art is spades 7-K, so **add `spades_6`**; never wire an ace-of-spades
  asset. (Ties to the 02 deck-composition bug.)
- **Resolves the "fire/frozen/dry card-state rendering" open item:** these are **runtime
  overlays/effects** on the faces - fire burst/glow, freeze tint, dry = set-aside
  face-down / show-dry = face-up - via the existing `ParticleEffects` + border treatment,
  **not new face art**.
- Build cleanups: `cards.test.ts` path-casing failure + the "34 cards" hardcode in
  `PreloadScene` (bump to 35, fix `getCardAssetPath`).

### Graduates to build work

Generate + compress `spades_6` and the card back; build the in-engine per-theme chunky
border/chrome/callout rendering; wire the corrected 35-card asset set; card-state overlays
via ParticleEffects.
