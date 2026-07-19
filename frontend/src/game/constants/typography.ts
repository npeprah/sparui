/**
 * Typography configuration for card visual design
 * Based on design specifications from CARD_DESIGN_HANDOFF.md
 */

import type Phaser from 'phaser'

/**
 * Font configuration interface
 */
interface FontConfig {
  family: string
  url: string
}

/**
 * Typography configuration object containing all text styling specifications
 */
export const TYPOGRAPHY_CONFIG = {
  fonts: {
    orbitron: 'Orbitron',
    bebasNeue: 'Bebas Neue',
    barlow: 'Barlow',
    fallback: 'sans-serif',
  },

  // Corner indicator typography (value and suit symbols)
  cornerIndicator: {
    valueFontSize: 40, // px (2.5rem)
    suitFontSize: 28, // px (1.8rem)
    fontWeight: 900, // Black weight
    color: '#FF4500', // Fire Red
    textShadow: '2px 2px 0 #DC143C, 0 0 10px rgba(255, 69, 0, 0.6)',
    lineHeight: 1,
  },

  // Face card title typography (Jack/Queen/King)
  faceCardTitle: {
    fontSize: 40, // px (2.5rem)
    fontWeight: 400, // Regular
    letterSpacing: 4, // px
    color: '#FF4500',
    textShadow: '2px 2px 0 #212121, 0 0 20px rgba(255, 215, 0, 0.8)',
  },

  // Face card description typography
  faceCardDescription: {
    fontSize: 16, // px (1rem)
    fontWeight: 600, // Semi-Bold
    color: '#212121', // Kente Black
    lineHeight: 1.4,
    opacity: 0.8,
    textAlign: 'center' as const,
  },
} as const

/**
 * Get Phaser TextStyle configuration for corner indicators
 * @param type - 'value' for card value (larger) or 'suit' for suit symbol (smaller)
 * @returns Phaser.Types.GameObjects.Text.TextStyle configuration
 */
export function getCornerIndicatorStyle(
  type: 'value' | 'suit'
): Phaser.Types.GameObjects.Text.TextStyle {
  const { cornerIndicator, fonts } = TYPOGRAPHY_CONFIG
  const fontSize = type === 'value' ? cornerIndicator.valueFontSize : cornerIndicator.suitFontSize

  return {
    fontFamily: `${fonts.orbitron}, ${fonts.fallback}`,
    fontSize: `${fontSize}px`,
    fontStyle: String(cornerIndicator.fontWeight),
    color: cornerIndicator.color,
    shadow: {
      offsetX: 2,
      offsetY: 2,
      color: '#DC143C',
      blur: 10,
      stroke: true,
      fill: true,
    },
  }
}

/**
 * Get Phaser TextStyle configuration for face card titles
 * @returns Phaser.Types.GameObjects.Text.TextStyle configuration
 */
export function getFaceCardTitleStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  const { faceCardTitle, fonts } = TYPOGRAPHY_CONFIG

  return {
    fontFamily: `${fonts.bebasNeue}, ${fonts.fallback}`,
    fontSize: `${faceCardTitle.fontSize}px`,
    fontStyle: String(faceCardTitle.fontWeight),
    color: faceCardTitle.color,
    padding: { x: faceCardTitle.letterSpacing, y: 0 }, // Phaser doesn't have letter-spacing, use padding as workaround
    shadow: {
      offsetX: 2,
      offsetY: 2,
      color: '#212121',
      blur: 20,
      stroke: true,
      fill: true,
    },
  }
}

/**
 * Get Phaser TextStyle configuration for face card descriptions
 * @returns Phaser.Types.GameObjects.Text.TextStyle configuration
 */
export function getFaceCardDescriptionStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  const { faceCardDescription, fonts } = TYPOGRAPHY_CONFIG

  return {
    fontFamily: `${fonts.barlow}, ${fonts.fallback}`,
    fontSize: `${faceCardDescription.fontSize}px`,
    fontStyle: String(faceCardDescription.fontWeight),
    color: faceCardDescription.color,
    align: faceCardDescription.textAlign,
    lineSpacing: faceCardDescription.fontSize * faceCardDescription.lineHeight - faceCardDescription.fontSize,
  }
}

/**
 * Load custom fonts configuration for web font loader
 * @returns Array of font configurations to load
 */
export function loadCustomFonts(): FontConfig[] {
  return [
    {
      family: TYPOGRAPHY_CONFIG.fonts.orbitron,
      url: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap',
    },
    {
      family: TYPOGRAPHY_CONFIG.fonts.bebasNeue,
      url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    },
    {
      family: TYPOGRAPHY_CONFIG.fonts.barlow,
      url: 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;600&display=swap',
    },
  ]
}