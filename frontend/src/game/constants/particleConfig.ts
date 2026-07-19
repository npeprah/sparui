/**
 * Particle system configuration constants
 * Defines all particle types, textures, colors, and emitter configurations
 */

/**
 * Particle effect types
 */
export type ParticleType = 'fire' | 'ice' | 'explosion' | 'confetti'

/**
 * Performance modes for particle effects
 */
export type PerformanceMode = 'low' | 'normal' | 'high'

/**
 * Particle texture keys organized by type
 * These map to actual texture files loaded in PreloadScene
 */
export const PARTICLE_TEXTURES = {
  FIRE: [
    'flame_large',
    'flame_small',
    'fire_burst',
    'firebolt',
    'firestorm',
    'fire_trail',
    'fire_ring',
    'embers'
  ],
  ICE: [
    'snowflake_large',
    'snowflake_small',
    'ice_shard',
    'frost',
    'ice_burst',
    'ice_ring',
    'freeze_wave',
    'blizzard'
  ],
  EXPLOSION: [
    'burst_large',
    'burst_small',
    'spark_shower',
    'flash_gold',
    'flash_white',
    'energy_wave',
    'shockwave',
    'impact_hit',
    'smoke_puff',
    'smoke_trail'
  ],
  CONFETTI: [
    'confetti_multi',
    'streamers',
    'star_gold',
    'star_multi',
    'sparkle_large',
    'sparkle_small',
    'coin_gold',
    'celebrations'
  ]
} as const

/**
 * Particle color palettes for each effect type
 */
export const PARTICLE_COLORS = {
  FIRE: [
    0xFF4500, // Orange Red
    0xFF8C00, // Dark Orange
    0xFFD700, // Gold
    0xFF6347, // Tomato
    0xFFA500  // Orange
  ],
  ICE: [
    0x00BFFF, // Deep Sky Blue
    0x87CEEB, // Sky Blue
    0xFFFFFF, // White
    0xB0E0E6, // Powder Blue
    0xADD8E6  // Light Blue
  ],
  EXPLOSION: [
    0xFFD700, // Gold
    0xFF4500, // Orange Red
    0xFFFFFF, // White
    0xFFFF00, // Yellow
    0xFFA500  // Orange
  ],
  CONFETTI: [
    0xFFD700, // Gold
    0xFF4500, // Orange Red
    0x00BFFF, // Deep Sky Blue
    0x8B00FF, // Purple
    0xFF1493, // Deep Pink
    0x32CD32, // Lime Green
    0xFFFF00  // Yellow
  ]
} as const

/**
 * Performance limits for particle counts
 */
export const PARTICLE_LIMITS = {
  DESKTOP: {
    FIRE: 100,      // 50-100 visible particles for fire state
    ICE: 60,        // 30-60 visible particles for frozen state
    EXPLOSION: 200, // Burst effect, many particles but short lived
    CONFETTI: 500   // 500-1000 for round win celebration
  },
  MOBILE: {
    FIRE: 50,       // Reduced for mobile performance
    ICE: 30,
    EXPLOSION: 100,
    CONFETTI: 100
  },
  MAX_EMITTERS: {
    DESKTOP: 10,    // Maximum concurrent emitters
    MOBILE: 5
  }
} as const

/**
 * Base emitter configuration interface
 */
export interface EmitterConfig {
  speed: { min: number; max: number }
  scale: { start: number; end: number }
  lifespan: { min: number; max: number }
  alpha: { start: number; end: number }
  gravityY: number
  quantity: number
  frequency: number
  blendMode: string
  angle?: { min: number; max: number }
  rotate?: { min: number; max: number }
  rotateSpeed?: { min: number; max: number }
  emitZone?: {
    type: string
    source: {
      x: number
      y: number
      width: number
      height: number
    }
  }
}

/**
 * Fire emitter configuration
 * Orange/red particles with upward movement, 1-2s lifespan
 */
export const FIRE_EMITTER_CONFIG: EmitterConfig = {
  speed: { min: 50, max: 150 },
  scale: { start: 0.8, end: 0 },
  lifespan: { min: 1000, max: 2000 },
  alpha: { start: 1, end: 0 },
  gravityY: -100, // Negative for upward movement
  quantity: 2,
  frequency: 100, // Emit every 100ms
  blendMode: 'ADD',
  angle: { min: -10, max: 10 }, // Mostly upward with slight variation
}

/**
 * Ice emitter configuration
 * Blue/white particles with floating/falling movement, 1-3s lifespan
 */
export const ICE_EMITTER_CONFIG: EmitterConfig = {
  speed: { min: 30, max: 100 },
  scale: { start: 0.6, end: 0.2 },
  lifespan: { min: 1000, max: 3000 },
  alpha: { start: 1, end: 0 },
  gravityY: 50, // Gentle falling
  quantity: 1,
  frequency: 150, // Emit every 150ms
  blendMode: 'ADD',
  rotate: { min: 0, max: 360 },
  rotateSpeed: { min: -180, max: 180 }
}

/**
 * Explosion emitter configuration
 * Multi-color burst with radial spread, 0.5-1s lifespan
 */
export const EXPLOSION_EMITTER_CONFIG: EmitterConfig = {
  speed: { min: 200, max: 500 },
  scale: { start: 1.2, end: 0 },
  lifespan: { min: 500, max: 1000 },
  alpha: { start: 1, end: 0 },
  gravityY: 0, // No gravity for explosion
  quantity: 30, // Burst quantity
  frequency: -1, // Burst mode (one-time emission)
  blendMode: 'ADD',
  angle: { min: 0, max: 360 }, // Full 360 degree spread
}

/**
 * Confetti emitter configuration
 * Colorful particles with gravity, 2-4s lifespan
 */
export const CONFETTI_EMITTER_CONFIG: EmitterConfig = {
  speed: { min: 100, max: 400 },
  scale: { start: 1, end: 0.5 },
  lifespan: { min: 2000, max: 4000 },
  alpha: { start: 1, end: 0 },
  gravityY: 200, // Gravity-affected falling
  quantity: 5,
  frequency: 50, // Emit every 50ms
  blendMode: 'NORMAL',
  angle: { min: -30, max: 30 }, // Upward cone
  rotate: { min: 0, max: 360 },
  rotateSpeed: { min: -360, max: 360 }
}

/**
 * Get particle configuration by type
 */
export function getParticleConfig(type: ParticleType): EmitterConfig {
  switch (type) {
    case 'fire':
      return FIRE_EMITTER_CONFIG
    case 'ice':
      return ICE_EMITTER_CONFIG
    case 'explosion':
      return EXPLOSION_EMITTER_CONFIG
    case 'confetti':
      return CONFETTI_EMITTER_CONFIG
    default:
      throw new Error(`Unknown particle type: ${type}`)
  }
}

/**
 * Get performance-adjusted particle quantity
 */
export function getPerformanceAdjustedQuantity(
  type: ParticleType,
  requestedQuantity: number,
  isMobile: boolean,
  performanceMode: PerformanceMode = 'normal'
): number {
  // Get base limit for device type
  const limits = isMobile ? PARTICLE_LIMITS.MOBILE : PARTICLE_LIMITS.DESKTOP
  let maxQuantity: number

  switch (type) {
    case 'fire':
      maxQuantity = limits.FIRE
      break
    case 'ice':
      maxQuantity = limits.ICE
      break
    case 'explosion':
      maxQuantity = limits.EXPLOSION
      break
    case 'confetti':
      maxQuantity = limits.CONFETTI
      break
    default:
      maxQuantity = 50
  }

  // Apply performance mode multiplier
  let multiplier = 1
  switch (performanceMode) {
    case 'low':
      multiplier = 0.5
      break
    case 'normal':
      multiplier = 1
      break
    case 'high':
      multiplier = 1.5
      break
  }

  // Calculate final quantity - ensure low mode actually reduces
  const adjustedQuantity = Math.min(requestedQuantity, maxQuantity)
  return Math.floor(adjustedQuantity * multiplier)
}

/**
 * Celebration effect configurations
 */
export const CELEBRATION_CONFIG = {
  ROUND_WIN: {
    confettiQuantity: 50,  // 500-1000 particles total over duration
    duration: 2000,         // 2 seconds
    emitFromWinner: true,
    explosions: 1
  },
  GAME_WIN: {
    confettiQuantity: 100,  // 1500+ particles total over duration
    duration: 5000,         // 5 seconds
    emitFromWinner: true,
    explosions: 3,
    explosionDelay: 500     // Stagger explosions
  }
} as const

/**
 * Card state particle configurations
 */
export const CARD_STATE_CONFIG = {
  FIRE: {
    particleCount: 75,      // 50-100 visible
    attachToEdges: true,
    offset: { x: 0, y: 0 },
    edgeEmitZone: {
      width: 120,           // Card width + margin
      height: 180           // Card height + margin
    }
  },
  FROZEN: {
    particleCount: 45,      // 30-60 visible
    attachToCard: true,
    offset: { x: 0, y: -10 }, // Slightly above card
    sparkleEffect: true
  }
} as const