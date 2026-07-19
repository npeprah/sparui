# What should the EK-style table look and feel like?

Type: prototype
Status: resolved
Blocked by: none

## Question

Produce a cheap, rough, concrete artifact of the Exploding Kittens-style card table
for the user to react to — raising the fidelity of the design discussion before anyone
commits to an implementation.

The destination fixes the ingredients: fanned hand in an arc at the bottom, central
play pile, chunky cards, opponents as card-back fans, bouncy/overshoot motion, comic
UI chrome (bold type, banners for round win / fire streak / flag). The prototype should
make the layout, proportions, and motion language concrete enough to react to — a
static mock, a rough interactive scene, or a storyboard of key beats (deal, play,
round-win, streak, flag). Link the artifact from this ticket as an asset.

The answer to record: the agreed layout + motion + chrome direction, at whatever
resolution the discussion reaches.

## Resolution

Built a throwaway 3-variant UI prototype (fresh-eyes subagent, /prototype UI branch) and
had the owner react. **Asset:**
`prototypes/06-ek-table/index.html` (self-contained; A/B/C via floating switcher; motion
beats D/P/W/F/G + AUTO LOOP). Kept as the primary source.

### Agreed EK direction (a mix - "A's layout, B's chrome, C's ring")

- **Layout = Variant A (Classic EK):** opponents in a row across the top as card-back fans
  with counts; big glowing central play pile; wide fanned hand along the bottom.
- **Chrome = Variant B (Comic Panel):** comic-panel framing, halftone/Ben-Day dots,
  ink-black card outlines with drop shadows, Impact-style speech-bubble banners, POW/BAM
  bursts.
- **Timer = Variant C:** circular countdown ring wrapping the drop zone (for the on-deck
  seat; ties to the 04 timer model - only the on-deck player's ring runs).
- **Motion language (consistent across variants, adopted as-is):** deal = cards spin/stagger
  into the fan; play = fly to pile with bouncy cubic-bezier OVERSHOOT then settle;
  round-win = banner pop + confetti; fire = top card bursts into flames/glow with wiggle +
  rising sparks (on the 3-consecutive-win → 4th-card beat from 04); flag = opponent's
  card-back fan flips to reveal faces.

### Two additions the owner introduced during the reaction (they EXPAND scope)

1. **Palette is player-selectable in settings (3 themes), structure stays fixed.** The
   agreed structure (A-layout + B-chrome + C-ring) is fixed; the base PALETTE is swappable:
   **Warm Heritage** (cream/red/gold, default), **Comic** (loud graphic-novel), **Neon**
   (pink/cyan arcade). Built on the EXISTING `themeStore` + settings modal + surface-theme
   infra. All 3 in scope for the destination. → **Reopens the map's "one fixed look"
   out-of-scope item** (now in scope).
2. **Data-driven, designer-authored comic-callout config.** A config maps game events →
   callout word(s) + style + trigger (e.g. big play → "POW!", flag → "BUSTED!", win →
   "BOOM!"), so the words AND their timing are editable without code changes. In scope. NOT
   a player-facing editor yet (easy to expose later). → **New feature not previously in the
   destination.**

### Hands off

- Unblocks **10** (restyle-vs-rebuild) and steers **07** (card art): faces must be chunky
  cartoon with ink outlines, and must read across all 3 palettes (palette-agnostic art or
  per-theme treatment - decide in 07).
- **05 harness note:** functional e2e runs use the default (Warm Heritage) theme; add a
  small theme-switch smoke (switching palette in settings applies + persists) and capture
  human-feel screenshots per theme at release points.
- Spec (on /to-spec re-run): change the "one fixed look" out-of-scope line; add the theme
  picker (3 palettes) + the callout config as features.
