/**
 * Card color palettes by suit
 * Based on design specifications from CARD_DESIGN_HANDOFF.md
 */

import type { Suit } from '../../store/types'

/**
 * Color palette interface for a card suit
 */
interface SuitColorPalette {
  primary: string
  secondary: string
  accent: string
  backgroundStart: string
  backgroundMid: string
  backgroundEnd: string
  pattern: string
}

/**
 * Card color palettes for each suit
 * All hex values match design specifications exactly
 */
export const CARD_COLORS = {
  // Hearts (Passion/Love)
  hearts: {
    primary: '#FF4500', // Fire Red
    secondary: '#FFD700', // Gold
    accent: '#DC143C', // Crimson
    backgroundStart: '#FFF9F0',
    backgroundMid: '#FFE8D6',
    backgroundEnd: '#FFF5E6',
    pattern: 'rgba(229, 57, 53, 0.15)', // Kente Red
  },

  // Clubs (Strength/Power)
  clubs: {
    primary: '#0A5F38', // Rich Green
    secondary: '#FFD700', // Gold
    accent: '#006400', // Dark Forest
    backgroundStart: '#F0FFF4',
    backgroundMid: '#D6F5E0',
    backgroundEnd: '#E6FFF0',
    pattern: 'rgba(0, 100, 0, 0.15)',
  },

  // Diamonds (Wealth/Prosperity)
  diamonds: {
    primary: '#FFD700', // Gold
    secondary: '#8B00FF', // Deep Purple
    accent: '#FFBF00', // Amber
    backgroundStart: '#FFFAF0',
    backgroundMid: '#FFF0D6',
    backgroundEnd: '#FFF8E6',
    pattern: 'rgba(255, 215, 0, 0.15)',
  },

  // Spades (Wisdom/Strategy)
  spades: {
    primary: '#8B00FF', // Deep Purple
    secondary: '#00BFFF', // Ice Blue
    accent: '#191970', // Midnight Blue
    backgroundStart: '#F5F0FF',
    backgroundMid: '#E8D6FF',
    backgroundEnd: '#F0E6FF',
    pattern: 'rgba(139, 0, 255, 0.15)',
  },
} as const

/**
 * Get complete color palette for a suit
 * @param suit - The card suit
 * @returns Color palette for the suit
 */
export function getSuitColors(suit: Suit): SuitColorPalette {
  return CARD_COLORS[suit]
}

/**
 * Get primary color for a suit
 * @param suit - The card suit
 * @returns Primary color hex value
 */
export function getSuitPrimaryColor(suit: Suit): string {
  return CARD_COLORS[suit].primary
}

/**
 * Get secondary color for a suit
 * @param suit - The card suit
 * @returns Secondary color hex value
 */
export function getSuitSecondaryColor(suit: Suit): string {
  return CARD_COLORS[suit].secondary
}

/**
 * Get accent color for a suit
 * @param suit - The card suit
 * @returns Accent color hex value
 */
export function getSuitAccentColor(suit: Suit): string {
  return CARD_COLORS[suit].accent
}

/**
 * Get CSS background gradient for a suit
 * @param suit - The card suit
 * @returns CSS gradient string
 */
export function getSuitBackgroundGradient(suit: Suit): string {
  const colors = CARD_COLORS[suit]
  return `linear-gradient(135deg, ${colors.backgroundStart} 0%, ${colors.backgroundMid} 50%, ${colors.backgroundEnd} 100%)`
}

/**
 * Get pattern overlay color for a suit
 * @param suit - The card suit
 * @returns RGBA color string for pattern overlay
 */
export function getSuitPatternColor(suit: Suit): string {
  return CARD_COLORS[suit].pattern
}