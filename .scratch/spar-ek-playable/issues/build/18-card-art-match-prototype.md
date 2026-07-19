# 18 — Match the 06 prototype exactly (scrap card + background assets, render in-engine)

**What to build:** The in-game table looks EXACTLY like the chosen prototype
(`.scratch/spar-ek-playable/prototypes/06-ek-table/index.html`): comic-glyph cards AND the
table background/surface, drawn in-engine rather than from image assets. Owner directive:
**scrap all the card assets and the background/surface assets** and reproduce the prototype's
look faithfully in Phaser. This supersedes ticket 07's "reuse the painterly faces" decision
(the shipped painterly + interim glyph mix was rejected on review) and retires the painterly
face PNGs, the interim `spades_6.png` / `card_back.png`, AND the `surface_*.png` background
assets from the render path.

**Blocked by:** none (12/13/16 already merged; this reskins `CardSprite` faces + `TableScene`
background/chrome)

**Status:** ready-for-agent

## Table background / surface (match the prototype)
- [ ] Reproduce the prototype's table background/surface in-engine (the comic-panel backdrop,
      halftone dot texture, ink framing / vignette exactly as the prototype renders it) - do
      NOT load `surface_*.png`; draw it in Phaser (gradient/graphics/tiled dots) per palette.
- [ ] The three palettes (Warm Heritage / Comic / Neon) reskin the background the same way the
      prototype's palette variants do; card faces stay palette-agnostic (only surroundings reskin).
- [ ] Remove the `surface_*.png` assets and any loader references (retire cleanly - no dead
      loads, no missing-asset fallback paths left behind).

## Prototype card spec (the source of truth — pixel-match it)
From the prototype's `.card` CSS:
- Face: cream `#fffdf7`, `border-radius: 12px`, `overflow: hidden`, chunky drop shadow
  (`0 6px 0 rgba(0,0,0,.25)`, `0 10px 18px rgba(0,0,0,.35)`).
- Rank glyph top-left + bottom-right (rotated 180deg), `font-weight: 900`.
- Large centered suit pip (`♥ ♦ ♣ ♠`).
- Colors: red suits `#E4002B`, black suits `#14100c`.
- Playable state: inset gold ring (`inset 0 0 0 4px #FFD700`) that appears on hover; lift on hover.
- Card back: the prototype's `.backart` patterned design.

## Acceptance
- [ ] `CardSprite` renders the face **in-engine** (Phaser graphics/text): cream body, corner ranks (weight-900, TL + rotated BR), large center suit pip, red/ink colors, chunky shadow, 12px corners — visually matching the prototype at the in-game card size.
- [ ] Card back matches the prototype `.backart`, themed by the active palette border.
- [ ] The ticket-12 EK border + per-theme (gold/comic/neon) treatment still frames the card; the gold playable-glow affordance matches the prototype's `inset 4px #FFD700` on hover/playable.
- [ ] The painterly face PNGs and the interim `spades_6.png` / `card_back.png` are removed from the load/render path (PreloadScene no longer loads 35 face PNGs for the table; the loader/asset-path tests are updated accordingly, or the PNGs are kept only if still referenced elsewhere — no dead loads, no missing-asset errors).
- [ ] Fire/freeze/dry overlays (ticket 16) still composite correctly on the new in-engine faces.
- [ ] Full green bar (build/lint/vitest + `go test`) and the Playwright A-H acceptance still pass; capture fresh key-beat screenshots so the look can be compared to the prototype.

## Notes
- This is a visual-fidelity ticket on the frontend only; no rule/backend change. It touches
  `CardSprite` (face rendering), `PreloadScene` (retire face-PNG loads), and their tests.
- "For now it's fine" (owner): not urgent — the game is functionally complete and playable;
  this is a polish pass to make the cards feel like the prototype.
