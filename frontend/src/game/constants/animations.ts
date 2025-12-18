/**
 * Animation Constants and Configuration
 *
 * Central configuration for all card and game animations.
 * Following arcade-style timing: snappy, responsive, with juice!
 */

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  // Card dealing animations
  DEAL: 400,
  DEAL_ROTATION: 400,
  DEAL_STAGGER: 150, // Delay between each card dealt

  // Card flip animations
  FLIP: 350,
  FLIP_HALFWAY: 175, // Half of flip duration for texture swap

  // Card play animations
  PLAY: 400,
  PLAY_HOVER: 200,

  // Win/Lose effect animations
  WIN_PULSE: 1000,
  WIN_GLOW: 800,
  LOSE_FADE: 600,
  LOSE_SHRINK: 600,
  COLLECT_TO_WINNER: 800,

  // Interaction animations
  HOVER_LIFT: 200,
  SELECTION_PULSE: 800,

  // Background effects
  PARTICLE_BURST: 1500,
} as const

/**
 * Animation easing functions
 * Using Phaser's built-in easing names
 */
export const ANIMATION_EASING = {
  // Deal animations - bouncy entrance
  DEAL: 'Back.easeOut',
  DEAL_ROTATION: 'Cubic.easeOut',

  // Flip animations - smooth 3D-like rotation
  FLIP_SCALE_DOWN: 'Cubic.easeIn',
  FLIP_SCALE_UP: 'Cubic.easeOut',

  // Play animations - responsive feel
  PLAY: 'Cubic.easeOut',
  HOVER: 'Cubic.easeOut',

  // Win/Lose effects - smooth and satisfying
  WIN_PULSE: 'Sine.easeInOut',
  WIN_GLOW: 'Sine.easeInOut',
  LOSE_FADE: 'Cubic.easeOut',
  COLLECT: 'Cubic.easeInOut',

  // UI interactions
  SELECTION: 'Sine.easeInOut',
} as const

/**
 * Animation scale values
 */
export const ANIMATION_SCALE = {
  // Card flip scales (for 3D-like effect)
  FLIP_MIDPOINT: 0.05, // Almost invisible at midpoint

  // Hover effects
  HOVER_SCALE: 1.1,
  HOVER_LIFT_Y: -30, // pixels

  // Win effects
  WIN_PULSE_MIN: 1.0,
  WIN_PULSE_MAX: 1.08,

  // Lose effects
  LOSE_SCALE: 0.95,
} as const

/**
 * Animation alpha (transparency) values
 */
export const ANIMATION_ALPHA = {
  // Visibility states
  VISIBLE: 1.0,
  PLAYABLE: 1.0,
  NOT_PLAYABLE: 0.5,
  DISABLED: 0.5,

  // Lose effects
  LOSE_ALPHA: 0.7,

  // Glow effects
  GLOW_MIN: 0.4,
  GLOW_MAX: 1.0,
} as const

/**
 * Animation rotation values (in radians)
 */
export const ANIMATION_ROTATION = {
  // Deal rotation range
  DEAL_MIN: -0.3, // ~-17 degrees
  DEAL_MAX: 0.3,  // ~17 degrees

  // Play rotation range (slight random tilt)
  PLAY_MIN: -0.15, // ~-8.6 degrees
  PLAY_MAX: 0.15,  // ~8.6 degrees

  // Flip rotation
  FLIP_Y_AXIS: Math.PI, // 180 degrees (simulated with scale)
} as const

/**
 * Glow effect configuration
 */
export const GLOW_CONFIG = {
  // Hover glow (gold)
  HOVER: {
    color: 0xffd700, // Gold
    thickness: 4,
    alpha: 0.8,
    padding: 4,
    quality: 0.1,
  },

  // Selection glow (ice blue)
  SELECTION: {
    color: 0x00bfff, // Ice blue
    thickness: 4,
    alpha: 1.0,
    padding: 4,
    quality: 0.1,
  },

  // Win glow (intense gold)
  WIN: {
    color: 0xffd700, // Gold
    thickness: 6,
    alpha: 1.0,
    padding: 6,
    quality: 0.15,
  },

  // Fire state glow (orange/red)
  FIRE: {
    color: 0xff4500, // Fire red
    thickness: 5,
    alpha: 0.9,
    padding: 5,
    quality: 0.12,
  },

  // Freeze state glow (ice blue)
  FREEZE: {
    color: 0x00bfff, // Ice blue
    thickness: 5,
    alpha: 0.8,
    padding: 5,
    quality: 0.12,
  },
} as const

/**
 * Particle effect configuration
 */
export const PARTICLE_CONFIG = {
  // Win celebration particles
  WIN_CONFETTI: {
    speed: { min: 200, max: 400 },
    angle: { min: -120, max: -60 }, // Upward burst
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 1500,
    frequency: 5,
    quantity: 3,
    gravityY: 300,
  },

  // Background ambient particles
  AMBIENT_SPARKLES: {
    speed: { min: 10, max: 30 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.6, end: 0 },
    lifespan: 3000,
    frequency: 500,
    quantity: 1,
  },
} as const

/**
 * Sound effect hook event names
 * (Placeholders for future audio implementation)
 */
export const SOUND_EVENTS = {
  CARD_DEAL: 'sound:card_deal',
  CARD_FLIP: 'sound:card_flip',
  CARD_PLAY: 'sound:card_play',
  CARD_HOVER: 'sound:card_hover',
  WIN_ROUND: 'sound:win_round',
  LOSE_ROUND: 'sound:lose_round',
  SELECTION: 'sound:selection',
  ERROR: 'sound:error',
} as const

/**
 * Haptic feedback patterns
 * (For mobile vibration API)
 */
export const HAPTIC_PATTERNS = {
  LIGHT: 10,
  MEDIUM: 20,
  HEAVY: 30,

  // Pattern arrays [vibrate, pause, vibrate, ...]
  CARD_PLAY: [10, 5, 10],
  WIN: [20, 10, 20, 10, 20],
  LOSE: [50],
  ERROR: [10, 10, 10, 10, 10],
} as const

/**
 * Animation state types
 */
export type AnimationState =
  | 'idle'
  | 'dealing'
  | 'flipping'
  | 'playing'
  | 'hovering'
  | 'winning'
  | 'losing'
  | 'collecting'

/**
 * Card effect states (visual modifiers)
 */
export type CardEffectState =
  | 'default'
  | 'hover'
  | 'selected'
  | 'fire'
  | 'frozen'
  | 'disabled'
  | 'winner'
  | 'loser'

/**
 * Helper function to generate random rotation within deal range
 */
export function getRandomDealRotation(): number {
  return (
    ANIMATION_ROTATION.DEAL_MIN +
    Math.random() * (ANIMATION_ROTATION.DEAL_MAX - ANIMATION_ROTATION.DEAL_MIN)
  )
}

/**
 * Helper function to generate random rotation within play range
 */
export function getRandomPlayRotation(): number {
  return (
    ANIMATION_ROTATION.PLAY_MIN +
    Math.random() * (ANIMATION_ROTATION.PLAY_MAX - ANIMATION_ROTATION.PLAY_MIN)
  )
}

/**
 * Helper function to trigger haptic feedback (mobile only)
 */
export function triggerHaptic(pattern: keyof typeof HAPTIC_PATTERNS): void {
  if (!navigator.vibrate) return

  const hapticPattern = HAPTIC_PATTERNS[pattern]

  if (typeof hapticPattern === 'number') {
    navigator.vibrate(hapticPattern)
  } else {
    // Cast to mutable array for VibratePattern
    navigator.vibrate([...hapticPattern])
  }
}

/**
 * Helper function to emit sound event (placeholder)
 * Future implementation will hook into audio system
 */
export function emitSoundEvent(
  scene: Phaser.Scene,
  event: keyof typeof SOUND_EVENTS
): void {
  // Emit event on scene for audio system to listen to
  scene.events.emit(SOUND_EVENTS[event])

  // Log in development
  if (import.meta.env.DEV) {
    console.log(`[Sound Event] ${SOUND_EVENTS[event]}`)
  }
}
