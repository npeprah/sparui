/**
 * Card visual state configurations
 * Based on design specifications from CARD_DESIGN_HANDOFF.md
 */

export type CardState = 'default' | 'hover' | 'active' | 'disabled' | 'fire' | 'frozen'

/**
 * Visual state configuration interface
 */
interface CardStateConfig {
  // Transform properties
  translateY?: number
  translateX?: number
  rotateY?: number
  scale?: number

  // Visual properties
  opacity?: number
  grayscale?: number
  borderWidth?: number
  borderColor?: string
  borderAnimation?: string
  borderAnimationDuration?: number
  shadow?: string

  // Interaction properties
  cursor?: string
  interactive?: boolean

  // Animation properties
  duration?: number
  easing?: string

  // Special effects
  symbolGlow?: string
  symbolDistortion?: boolean
  symbolTint?: string
  auraColor?: string
  particleEffect?: string
  overlayTexture?: string
  maxGlow?: boolean
  moveToCenter?: boolean
}

/**
 * Card visual state configurations
 * Exact specifications from design handoff document
 */
export const CARD_VISUAL_STATES: Record<CardState, CardStateConfig> = {
  // Default state - cream gradient, Kente pattern, gold border
  default: {
    borderWidth: 4,
    borderColor: '#FFD700', // Gold
    shadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 69, 0, 0.3)',
    opacity: 1,
    scale: 1,
    translateY: 0,
    rotateY: 0,
  },

  // Hover state - lift, tilt, glow enhancement
  hover: {
    translateY: -30, // px
    rotateY: 10, // degrees
    scale: 1.05,
    shadow:
      '0 40px 80px rgba(255, 69, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.6), inset 0 0 30px rgba(255, 215, 0, 0.2)',
    symbolGlow:
      'drop-shadow(0 0 40px rgba(255, 215, 0, 1)) drop-shadow(0 0 80px rgba(255, 69, 0, 0.8))',
    duration: 600, // ms
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },

  // Active state - when card is played
  active: {
    scale: 0.95,
    maxGlow: true,
    moveToCenter: true,
    duration: 400, // ms
    easing: 'ease-out',
  },

  // Disabled state - not playable
  disabled: {
    opacity: 0.5,
    grayscale: 0.6,
    cursor: 'not-allowed',
    interactive: false,
  },

  // Fire state - on fire streak
  fire: {
    borderAnimation: 'linear-gradient(45deg, #FF4500, #FF8C00, #FFD700)',
    borderAnimationDuration: 1000, // ms
    auraColor: 'rgba(255, 69, 0, 0.8)',
    particleEffect: 'fire',
    symbolDistortion: true,
  },

  // Frozen state - freeze counter active
  frozen: {
    borderColor: '#00BFFF', // Ice blue
    borderWidth: 4,
    shadow: '0 0 30px rgba(0, 191, 255, 0.8), inset 0 0 20px rgba(135, 206, 235, 0.4)',
    overlayTexture: 'frost',
    auraColor: 'rgba(0, 191, 255, 0.8)',
    symbolTint: 'blue',
  },
}

/**
 * Get configuration for a specific card state
 * @param state - The card state
 * @returns Configuration for the state
 */
export function getCardStateConfig(state: CardState): CardStateConfig {
  return CARD_VISUAL_STATES[state]
}

/**
 * Get default state configuration
 * @returns Default state configuration
 */
export function getDefaultStateConfig(): CardStateConfig {
  return CARD_VISUAL_STATES.default
}

/**
 * Get hover state configuration
 * @returns Hover state configuration
 */
export function getHoverStateConfig(): CardStateConfig {
  return CARD_VISUAL_STATES.hover
}

/**
 * Get active state configuration
 * @returns Active state configuration
 */
export function getActiveStateConfig(): CardStateConfig {
  return CARD_VISUAL_STATES.active
}

/**
 * Get disabled state configuration
 * @returns Disabled state configuration
 */
export function getDisabledStateConfig(): CardStateConfig {
  return CARD_VISUAL_STATES.disabled
}

/**
 * Get fire state configuration
 * @returns Fire state configuration
 */
export function getFireStateConfig(): CardStateConfig {
  return CARD_VISUAL_STATES.fire
}

/**
 * Get frozen state configuration
 * @returns Frozen state configuration
 */
export function getFrozenStateConfig(): CardStateConfig {
  return CARD_VISUAL_STATES.frozen
}
