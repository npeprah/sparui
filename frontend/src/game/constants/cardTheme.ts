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
  /**
   * Chrome ink colour (frame/halftone/text on the table). Also the comic card
   * keyline colour. Consumed by `TableScene` for the surrounding chrome - it is
   * NOT a card-face fill (the cream face is drawn in-engine and never covered).
   */
  inkColor: number
  /** Thin card keyline stroke weight in screen px. */
  inkWidth: number
  /** Chrome accent colour (banners / highlights on the table + neon glow). */
  accentColor: number
  /** Corner radius of the card + keyline in px. */
  cornerRadius: number
  /** Drop-shadow colour drawn behind the card for the chunky "lift" feel. */
  shadowColor: number
  /** Drop-shadow opacity (0 disables the shadow). */
  shadowAlpha: number
  /** Vertical offset of the drop shadow in px. */
  shadowOffsetY: number
  /** When true, draw an additive outer glow ring around the card (neon). */
  glow: boolean
  /**
   * Thin dark/accent KEYLINE hugging the card edge (comic ink / neon cyan).
   * `null` = no keyline: the warm "gold" card is just cream + drop shadow, per
   * prototype variant A. Never a face-covering fill.
   */
  keylineColor: number | null
  /**
   * The gold playable-affordance ring colour - the ONLY gold on the card,
   * drawn as an inset ring above the face when the card is playable (mirrors the
   * prototype `.card.playable::after { inset 0 0 0 4px #FFD700 }`).
   */
  ringColor: number
}

/** Ink black shared by the heritage/comic treatments. */
const INK = 0x14100c

/**
 * Per-treatment drawing parameters. Exported so ticket 13 (table scene) and
 * ticket 16 (overlays) can align their chrome with the card frame.
 */
export const EK_BORDER_STYLES: Record<EKBorderTreatment, EKBorderStyle> = {
  // Warm Heritage: cream card + chunky drop shadow, NO keyline (prototype A).
  // Gold is reserved for the playable ring only.
  gold: {
    treatment: 'gold',
    inkColor: INK,
    inkWidth: 3,
    accentColor: 0xffd700,
    cornerRadius: 12,
    shadowColor: 0x000000,
    shadowAlpha: 0.35,
    shadowOffsetY: 6,
    glow: false,
    keylineColor: null,
    ringColor: 0xffd700,
  },
  // Comic Panel: cream card + thin ink keyline + solid offset ink shadow.
  comic: {
    treatment: 'comic',
    inkColor: INK,
    inkWidth: 3,
    accentColor: 0xffd400,
    cornerRadius: 8,
    shadowColor: INK,
    shadowAlpha: 1,
    shadowOffsetY: 5,
    glow: false,
    keylineColor: INK,
    ringColor: 0xffd700,
  },
  // Neon Arcade: cream card + thin cyan keyline + additive cyan glow, soft shadow.
  neon: {
    treatment: 'neon',
    inkColor: 0x00f5ff,
    inkWidth: 2,
    accentColor: 0xff006e,
    cornerRadius: 14,
    shadowColor: 0x000000,
    shadowAlpha: 0.5,
    shadowOffsetY: 6,
    glow: true,
    keylineColor: 0x00f5ff,
    ringColor: 0xffd700,
  },
}

/**
 * Map an app theme (from `themeStore`) to an EK border treatment.
 *
 * The canonical EK palettes are Warm Heritage / Comic / Neon (ticket 15 made
 * these first-class `themeStore` entries, retiring the old four surface-theme
 * names). Each canonical palette maps 1:1 onto a treatment; anything unknown
 * defaults to `gold` so the card always has a valid, well-defined frame.
 */
const THEME_TO_TREATMENT: Record<string, EKBorderTreatment> = {
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
