# 19 — Pixel-exact duplicate of prototype Variant B (Comic Panel)

**What to build:** The in-game table (`TableScene` + `CardSprite` + animations) is a PIXEL-EXACT
duplicate of the prototype's **Variant B (Comic Panel)** - layout, sprites, background, chrome,
banners, and the motion/flow (deal, play, round-win, fire, flag, timer). Owner directive: "be
pixel obsessed... an exact duplicate... everything the same as the prototype... it should flow
exactly like how the prototype works, the animations, the sprites, the background, everything."

This supersedes ticket 18's hybrid look. Target = Variant B ONLY (not A, not C, not the
earlier A-layout+B-chrome+C-ring hybrid).

**Source of truth:** `.scratch/spar-ek-playable/prototypes/06-ek-table/index.html` — read the
`body[data-variant="B"]` CSS blocks AND the shared `.card`, banner, `.pow`, deal/play/win/fire/
flag JS beats. Reference screenshots at each beat: scratchpad `proto-B/B-{rest,play,win,fire,flag}.png`
(rendered at 1280x720, the game canvas size). EXCLUDE the dev chrome from the target: the
`#proto-tag` (top-left), `#controls` deck (top-right), and `#switcher` (bottom-center) are
prototype-only and must NOT appear in the game.

## Variant B spec (from the prototype CSS - replicate exactly, scaled to the 1280x720 canvas)
- **Background:** `linear-gradient(135deg,#ffd400 0%,#ffb700 100%)` + halftone dots
  `radial-gradient(rgba(0,0,0,.14) 2px, transparent 2px) 0 0 / 14px 14px`.
- **Comic-panel frame:** inset 14px, `6px solid #14100c` with `inset 0 0 0 4px #fff, inset 0 0 0 10px #14100c` (ink border, white gap, inner ink line).
- **Opponents = side rails** (NOT top). Left rail `left:30px`, right rail `right:30px`, vertically spaced. Each opponent box: white bg, `5px solid #14100c`, `box-shadow: 6px 6px 0 #14100c`, width 150px; Impact-style name (uppercase), a fan of card-backs (`.backart`: diagonal white stripes + radial `#ff8a3d→#c81d5a`, inset white border, ♠), and a count badge (`#14100c` bg, `#ffd400` text, card glyph + "N CARDS"). Active opponent: `#ff4d6d` bg + extra ink outline. (Prototype puts opponent idx 1 on the right rail, others on the left.)
- **Central pile:** offset `left:50%, top:40%`; label "THE PILE!" as a white box, `3px solid #14100c`, Impact, rotated -3deg, positioned above the pile; NO glow. Played cards settle stacked with slight random rotation. (No black placeholder box.)
- **Cards (shared `.card` + B overrides):** cream `#fffdf7`, radius 12px, corner ranks (weight 900, tl + br rotated 180, ~20px with a small suit under the rank), big center pip (~46px), red `#E4002B` / ink `#14100c`. B override: `border: 3px solid #14100c` + `box-shadow: 0 5px 0 #14100c, 0 8px 0 rgba(0,0,0,.25)` (ink outline + ink drop shadow). Card size 92x130 (scale to canvas). Playable: gold inset ring `inset 0 0 0 4px #FFD700` on hover + hover lift translateY(-22).
- **Bottom hand:** tight arc, `width 560px`, fan spread 28deg, radius 360 (see `fanPos(i,n,spread,radius)` + layoutHand cfg B). Cards overlap with rotation; corner ranks peek out.
- **YOU badge:** bottom-left, `#14100c` bg, `#ffd400` Impact text, rotated -3deg.
- **HUD score:** bottom-right, white box, `5px solid #14100c`, `box-shadow: 6px 6px 0 #14100c`, Impact; "YOU n | THEM n" + "🔥 STREAK n/4" (fire in `#E4002B`).
- **Timer:** B uses the horizontal `#timer-generic` bar (positioned above the hand, `bottom:150px`), label "⏱ ..." + bar with `linear-gradient(90deg,#37e07a,#ffd700,#E4002B)` fill, `3px solid #14100c`. (NOT the C ring.)
- **Banners (round-win etc.):** variant-B speech bubble — `#ffd400` bg, `8px solid #14100c`, `box-shadow: 12px 12px 0 #14100c`, uppercase Impact, `bannerpop .6s cubic-bezier(0.18,1.9,0.5,1)`, with a tail triangle bottom-left.
- **POW bursts:** on play, `.pow` "POW!"/"BAM!"/"WHAP!" cycling, Impact `#ffd400` text with ink shadow, `powpop .6s` overshoot.

## Motion / flow (replicate the prototype beats + easings exactly)
- `--bounce: cubic-bezier(0.34,1.56,0.64,1)`, `--bounce-hard: cubic-bezier(0.18,1.9,0.5,1)`.
- **DEAL:** cards start at top-center deck (offscreen up, rotate ~320deg, scale .5, opacity 0) and fan into the hand with a 90ms per-card stagger, `transform .6s var(--bounce)`.
- **PLAY:** the played card flies to the pile with bouncy overshoot (`var(--bounce-hard)`), a small random spin, scale 1.06 then settle to 1; a POW!/BAM!/WHAP! burst pops at the pile; the card stays stacked on the pile.
- **ROUND WIN:** speech-bubble banner pops + confetti.
- **FIRE STREAK:** target card wiggles + flame glow (`box-shadow 0 0 24px #ff7a00...`) + 🔥 + rising sparks.
- **FLAG:** an opponent's card-backs flip (scaleX->0) to revealed faces; "CAUGHT YOU!" banner.

## Acceptance
- [ ] Full-screen renders of the game at each beat are visually indistinguishable from `proto-B/B-*.png` (side-by-side): background, halftone, comic frame, side-rail opponents, THE PILE!, ink cards, hand arc, YOU/score boxes, timer bar, banners, POW bursts.
- [ ] Deal / play / round-win / fire / flag animations match the prototype's motion + easing + timing.
- [ ] Dev chrome (proto-tag/controls/switcher) is NOT present.
- [ ] Real gameplay still works (drives from backend state) and Playwright A-H still pass; full gate green (build/lint/vitest + go test).

## Loop process
Iterate: agent builds -> capture full-screen game shots at each beat -> diff against proto-B refs
-> feed precise pixel deltas back -> repeat until indistinguishable. Then /no-mistakes + merge.
