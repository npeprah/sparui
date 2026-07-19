/**
 * Card face model - pure, framework-free helpers describing how a Spar card
 * face and back are drawn IN-ENGINE (ticket 18).
 *
 * The owner-approved look is the 06 EK prototype
 * (`.scratch/spar-ek-playable/prototypes/06-ek-table/index.html`, `.card` CSS):
 *   - cream `#fffdf7` body, chunky rounded corners
 *   - corner ranks (weight-900) top-left + bottom-right (rotated 180deg)
 *   - a large centered suit pip (♥ ♦ ♣ ♠)
 *   - red suits `#E4002B`, black suits `#14100c`
 *
 * These functions map a suit/rank to the glyphs, colours and geometry the
 * Phaser texture factory (`cardTextureFactory.ts`) rasterises. Keeping them pure
 * makes the suit->glyph/colour mapping and the card geometry unit-testable
 * without a live Phaser/canvas context. The FACE is palette-agnostic: only the
 * EK border/table chrome around it reskins per theme.
 */

import type { Suit, Rank } from '../../store/types'

/**
 * Face texture resolution. Kept identical to the retired painterly PNGs
 * (512x768) so every downstream scale, layout placement, overlay anchor and EK
 * border margin stays byte-for-byte unchanged when we swap loaded art for the
 * drawn face.
 */
export const CARD_TEXTURE_WIDTH = 512
export const CARD_TEXTURE_HEIGHT = 768

/** Cream card body, from the prototype `.card { background: #fffdf7 }`. */
export const CARD_FACE_CREAM = '#fffdf7'
/** Red suits (hearts/diamonds), from `.card.red { color: #E4002B }`. */
export const CARD_FACE_RED = '#E4002B'
/** Black suits (clubs/spades) + ink outlines, from `.card.blk { color: #14100c }`. */
export const CARD_FACE_INK = '#14100c'

const SUIT_GLYPHS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

/** The large centred pip / corner glyph for a suit. */
export function suitGlyph(suit: Suit): string {
  return SUIT_GLYPHS[suit]
}

/** Hearts and diamonds are the red suits; clubs and spades are black. */
export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

/** Ink colour used for a suit's ranks and pip (`#E4002B` red / `#14100c` ink). */
export function faceInkColor(suit: Suit): string {
  return isRedSuit(suit) ? CARD_FACE_RED : CARD_FACE_INK
}

/** Corner rank label as printed on the card ("10" stays two chars). */
export function rankLabel(rank: Rank): string {
  return rank
}

/**
 * Face geometry in texture pixels (512x768), scaled up from the prototype's
 * fixed 92x130 CSS card so the in-engine face keeps the same internal
 * proportions as the approved look.
 */
export const CARD_FACE_GEOMETRY = {
  /** Rounded-corner radius (~12px on the scaled-down card, matching the EK frame). */
  cornerRadius: 44,
  /** Corner rank glyph inset from the card edge. */
  marginX: 50,
  marginY: 40,
  /** Corner rank number font size (weight 900). */
  rankFontSize: 118,
  /** Small suit glyph tucked under each corner rank. */
  rankSuitFontSize: 82,
  /** Large centred suit pip. */
  pipFontSize: 272,
} as const

/**
 * Card-back geometry in texture pixels (512x768), scaled from the prototype
 * `.backart` (inset 6px, 8px radius, centred ♠).
 */
export const CARD_BACK_GEOMETRY = {
  /** Inset of the patterned art panel from the cream body edge. */
  inset: 34,
  /** Rounded-corner radius of the art panel. */
  panelRadius: 40,
  /** Centred spade glyph size. */
  glyphFontSize: 180,
} as const

/** Card-back palette, from the prototype `.backart` gradient + stripes. */
export const CARD_BACK_COLORS = {
  /** Radial gradient inner colour (`#ff8a3d`). */
  gradientInner: '#ff8a3d',
  /** Radial gradient outer colour (`#c81d5a`). */
  gradientOuter: '#c81d5a',
  /** Diagonal hatch stripe colour (`rgba(255,255,255,.14)`). */
  stripe: 'rgba(255,255,255,0.14)',
  /** Inner white keyline (`inset 0 0 0 3px rgba(255,255,255,.5)`). */
  keyline: 'rgba(255,255,255,0.5)',
  /** Centred spade glyph colour. */
  glyph: '#ffffff',
} as const
