/**
 * EK (Exploding-Kittens-style) card border/chrome treatments.
 *
 * Ticket 12: `CardSprite` renders a chunky ink-outline border + comic framing
 * whose exact look is chosen per active theme. The mapping from the app's
 * `themeStore` themes to one of the three EK treatments (gold / comic / neon)
 * lives here as pure, unit-testable logic. `CardSprite` reads the active theme
 * and calls {@link getEKBorderStyle} to draw the correct frame.
 *
 * Visual targets are lifted from the agreed EK prototype
 * (`.scratch/spar-ek-playable/prototypes/06-ek-table/index.html`):
 *  - Variant A "Classic EK"   -> gold  (Warm Heritage: cream/red/gold, ink outline)
 *  - Variant B "Comic Panel"  -> comic (pop-art yellow/red/ink-black, chunky offset shadow)
 *  - Variant C "Neon Arcade"  -> neon  (dark base, cyan/magenta glow)
 */

import type { ThemeName } from '../../store/themeStore'

/** The three EK border/chrome treatments the card frame can render. */
export type EKBorderTreatment = 'gold' | 'comic' | 'neon'

/**
 * Resolved drawing parameters for one EK treatment. Colours are Phaser hex
 * ints (0xRRGGBB); widths/offsets are in screen pixels (drawn in screen space
 * so the outline stays chunky regardless of the card's render scale).
 */
export interface EKBorderStyle {
  treatment: EKBorderTreatment
  /** Chunky outer outline colour (the "ink" sticker edge). */
  inkColor: number
  /** Outline weight in screen px (also the border margin around the card). */
  inkWidth: number
  /** Accent colour used for the playable/highlight tint and neon glow. */
  accentColor: number
  /** Corner radius of the frame in px. */
  cornerRadius: number
  /** Drop-shadow colour drawn behind the card for the chunky "sticker" feel. */
  shadowColor: number
  /** Drop-shadow opacity (0 disables the shadow). */
  shadowAlpha: number
  /** Vertical offset of the drop shadow in px. */
  shadowOffsetY: number
  /** When true, draw an additive outer glow ring in the accent colour (neon). */
  glow: boolean
  /**
   * Optional thin inner frame colour drawn between the ink edge and the card
   * face (e.g. the white pop-art line in the comic treatment). `null` = none.
   */
  innerFrameColor: number | null
}

/** Ink black shared by the heritage/comic treatments. */
const INK = 0x14100c

/**
 * Per-treatment drawing parameters. Exported so ticket 13 (table scene) and
 * ticket 16 (overlays) can align their chrome with the card frame.
 */
export const EK_BORDER_STYLES: Record<EKBorderTreatment, EKBorderStyle> = {
  // Warm Heritage: ink outline, gold accent, soft warm drop shadow.
  gold: {
    treatment: 'gold',
    inkColor: INK,
    inkWidth: 4,
    accentColor: 0xffd700,
    cornerRadius: 12,
    shadowColor: 0x000000,
    shadowAlpha: 0.35,
    shadowOffsetY: 8,
    glow: false,
    innerFrameColor: 0xffd700,
  },
  // Comic Panel: heavy ink outline, solid offset ink shadow, white pop line.
  comic: {
    treatment: 'comic',
    inkColor: INK,
    inkWidth: 5,
    accentColor: 0xffd400,
    cornerRadius: 8,
    shadowColor: INK,
    shadowAlpha: 1,
    shadowOffsetY: 6,
    glow: false,
    innerFrameColor: 0xffffff,
  },
  // Neon Arcade: cyan edge, magenta accent, additive glow, no hard shadow.
  neon: {
    treatment: 'neon',
    inkColor: 0x00f5ff,
    inkWidth: 3,
    accentColor: 0xff006e,
    cornerRadius: 14,
    shadowColor: 0x00f5ff,
    shadowAlpha: 0.5,
    shadowOffsetY: 0,
    glow: true,
    innerFrameColor: null,
  },
}

/**
 * Map an app theme (from `themeStore`) to an EK border treatment.
 *
 * The canonical EK palettes are Warm Heritage / Comic / Neon (ticket 15 will
 * introduce those as first-class `themeStore` entries). Until then this maps
 * the existing four surface themes onto the three treatments and also accepts
 * the future canonical keys, defaulting to `gold` for anything unknown so the
 * card always has a valid, well-defined frame.
 */
const THEME_TO_TREATMENT: Record<string, EKBorderTreatment> = {
  // Existing surface themes.
  afro_heritage: 'gold',
  royal_gold: 'gold',
  neon_arcade: 'neon',
  ocean_breeze: 'comic',
  // Forward-compatible canonical EK theme keys (ticket 15).
  warm_heritage: 'gold',
  comic: 'comic',
  neon: 'neon',
}

/**
 * Resolve the EK border treatment for a given theme name.
 * Unknown themes fall back to `gold`.
 */
export function resolveEKTreatment(theme: ThemeName | string): EKBorderTreatment {
  return THEME_TO_TREATMENT[theme] ?? 'gold'
}

/**
 * Resolve the full EK border style for a given theme name.
 */
export function getEKBorderStyle(theme: ThemeName | string): EKBorderStyle {
  return EK_BORDER_STYLES[resolveEKTreatment(theme)]
}
