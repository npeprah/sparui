# Ticket 06 - EK-Style Card Table (THROWAWAY PROTOTYPE)

> **THROWAWAY. Do not ship, do not import.** Fresh-eyes design exploration to make the
> layout / proportions / motion language of the Spar card table concrete enough for the
> game owner to react to. No build step, no backend, no real data. The owner picks a
> direction (or mixes pieces) later - this artifact does **not** declare a winner.

## One-line plan
Three radically different, structurally-disagreeing card-table layouts on one self-contained
`index.html`, switchable via `?variant=A|B|C` and a floating bottom-center switcher, each
expressing the 5 key motion beats (deal / play / round win / fire streak / flag) in its own style.

## How to open
Just double-click `index.html` (or `open index.html`). Any modern browser, no server needed.
Add `?variant=B` etc. to the URL to deep-link a variant.

## Variant keys and directions
- **A - Classic EK**: warm afro-heritage cream/red/gold; opponents in a row across the top,
  a big glowing central play pile, and a wide fanned bottom hand. The "safe, readable" EK take.
- **B - Comic Panel**: pop-art halftone chrome (Ben-Day dots, ink-black outlines, drop shadows);
  opponents on left/right side rails inside a comic-panel frame, offset pile, POW/BAM bursts on
  every play, Impact-font speech-bubble banners. The loudest, most graphic-novel take.
- **C - Neon Arcade**: dark neon (deep purple base, neon pink/cyan glow); opponents compressed
  into avatar+count chips along the top, larger fewer hand cards, and a circular centerpiece
  countdown ring wrapping the drop zone. The sleek modern-arcade take.

## Motion beats (how to trigger)
Top-right control deck buttons, keyboard shortcuts, clicking a hand card, or the AUTO LOOP:
- **DEAL** (`D`) - cards spin out from the deck and fan into the hand with stagger.
- **PLAY** (`P`, or click any hand card) - card flies to the central pile with bouncy overshoot.
- **ROUND WIN** (`W`) - bold variant-styled banner pops + confetti.
- **FIRE STREAK** (`F`) - the top card bursts into flames/glow (the 4-in-a-row beat) + sparks.
- **FLAG** (`G`) - the next opponent's card-back fan flips over to reveal faces.
- **AUTO LOOP** - cycles through the beats hands-free so you can just watch the feel.
- **Arrow keys / switcher arrows** - cycle variants (URL stays shareable/reload-stable).

## Assumptions / notes
- Placeholder cards only (rounded rects, rank + suit pip). Real card art is a separate ticket.
- Mock state: 5-card hand, 3 opponents shown as card-back fans with counts, scores + streak HUD.
- Palettes are loose nods to PRD surface themes (afro_heritage, neon_arcade), fully inline - no
  repo assets or network/CDN dependencies.
- FLAG reveal and pile do not "reset" perfectly between repeats (throwaway); switch variants or
  press DEAL to refresh the table.
