import Phaser from 'phaser'

/**
 * Particle texture keys
 */
export const PARTICLE_KEYS = {
  CIRCLE: 'particle_circle',
  STAR: 'particle_star',
  RECT: 'particle_rect',
} as const

/**
 * Particle color palette
 */
export const PARTICLE_COLORS = {
  GOLD: 0xffd700,
  ORANGE: 0xff4500,
  BLUE: 0x00bfff,
  PURPLE: 0x8b00ff,
  PINK: 0xff1493,
  WHITE: 0xffffff,
} as const

/**
 * Performance limits for particle counts
 */
const PARTICLE_LIMITS = {
  DESKTOP_CONFETTI: 50,
  MOBILE_CONFETTI: 30,
  DESKTOP_SPARKLE: 30,
  MOBILE_SPARKLE: 18,
} as const

/**
 * Create particle textures programmatically
 * Called once during PreloadScene
 */
export function createParticleTextures(scene: Phaser.Scene): void {
  // Circle particle (for sparkles)
  const circleSize = 16
  const circleGraphics = scene.add.graphics()
  circleGraphics.fillStyle(0xffffff, 1)
  circleGraphics.fillCircle(circleSize / 2, circleSize / 2, circleSize / 2)
  circleGraphics.generateTexture(PARTICLE_KEYS.CIRCLE, circleSize, circleSize)
  circleGraphics.destroy()

  // Star particle (for bursts)
  const starSize = 24
  const starGraphics = scene.add.graphics()
  starGraphics.fillStyle(0xffffff, 1)

  // Draw 5-pointed star
  const centerX = starSize / 2
  const centerY = starSize / 2
  const outerRadius = starSize / 2
  const innerRadius = starSize / 4
  const points = 5

  starGraphics.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / points - Math.PI / 2
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    if (i === 0) {
      starGraphics.moveTo(x, y)
    } else {
      starGraphics.lineTo(x, y)
    }
  }
  starGraphics.closePath()
  starGraphics.fillPath()
  starGraphics.generateTexture(PARTICLE_KEYS.STAR, starSize, starSize)
  starGraphics.destroy()

  // Rectangle particle (for confetti strips)
  const rectWidth = 8
  const rectHeight = 24
  const rectGraphics = scene.add.graphics()
  rectGraphics.fillStyle(0xffffff, 1)
  rectGraphics.fillRoundedRect(0, 0, rectWidth, rectHeight, 2)
  rectGraphics.generateTexture(PARTICLE_KEYS.RECT, rectWidth, rectHeight)
  rectGraphics.destroy()
}

/**
 * Particle emitter configuration
 */
export interface ParticleEffectConfig {
  x: number
  y: number
  quantity?: number
  isMobile?: boolean
}

/**
 * Create confetti burst effect for winner celebration
 * Gold and colorful particles falling down
 */
export function createConfettiEffect(
  scene: Phaser.Scene,
  config: ParticleEffectConfig
): Phaser.GameObjects.Particles.ParticleEmitter[] {
  const emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []
  const isMobile = config.isMobile ?? false
  const maxParticles = isMobile ? PARTICLE_LIMITS.MOBILE_CONFETTI : PARTICLE_LIMITS.DESKTOP_CONFETTI
  const quantity = Math.min(config.quantity ?? 20, maxParticles)

  // Confetti colors (mix of gold, orange, blue, purple, pink)
  const colors = [
    PARTICLE_COLORS.GOLD,
    PARTICLE_COLORS.ORANGE,
    PARTICLE_COLORS.BLUE,
    PARTICLE_COLORS.PURPLE,
    PARTICLE_COLORS.PINK,
  ]

  // Create emitter for rectangle confetti
  const confettiEmitter = scene.add.particles(config.x, config.y, PARTICLE_KEYS.RECT, {
    speed: { min: 100, max: 300 },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0.2 },
    lifespan: 1000,
    gravityY: 200,
    quantity: Math.floor(quantity * 0.6), // 60% of particles are confetti
    frequency: -1, // Burst mode (one-time emission)
    tint: colors,
    rotate: { min: 0, max: 360 },
  })

  confettiEmitter.setDepth(1000)
  emitters.push(confettiEmitter)

  // Create emitter for star particles
  const starEmitter = scene.add.particles(config.x, config.y, PARTICLE_KEYS.STAR, {
    speed: { min: 150, max: 250 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 800,
    gravityY: 150,
    quantity: Math.floor(quantity * 0.4), // 40% are stars
    frequency: -1,
    tint: [PARTICLE_COLORS.GOLD, PARTICLE_COLORS.ORANGE, PARTICLE_COLORS.WHITE],
    rotate: { min: 0, max: 360 },
  })

  starEmitter.setDepth(1000)
  emitters.push(starEmitter)

  return emitters
}

/**
 * Create sparkle effect for card highlights
 * Small twinkling particles around card
 */
export function createSparkleEffect(
  scene: Phaser.Scene,
  config: ParticleEffectConfig
): Phaser.GameObjects.Particles.ParticleEmitter {
  const isMobile = config.isMobile ?? false
  const maxParticles = isMobile ? PARTICLE_LIMITS.MOBILE_SPARKLE : PARTICLE_LIMITS.DESKTOP_SPARKLE
  const quantity = Math.min(config.quantity ?? 15, maxParticles)

  const sparkleEmitter = scene.add.particles(config.x, config.y, PARTICLE_KEYS.CIRCLE, {
    speed: { min: 50, max: 150 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: 1500,
    gravityY: 0, // No gravity for sparkles
    quantity,
    frequency: -1,
    tint: [PARTICLE_COLORS.GOLD, PARTICLE_COLORS.WHITE],
    blendMode: 'ADD', // Additive blend for glow effect
  })

  sparkleEmitter.setDepth(1000)

  return sparkleEmitter
}

/**
 * Cleanup particle emitters after animation completes
 */
export function cleanupParticleEmitters(
  emitters: Phaser.GameObjects.Particles.ParticleEmitter[],
  delay: number = 2000
): void {
  // Wait for particles to fade out before destroying
  setTimeout(() => {
    emitters.forEach(emitter => {
      if (emitter && emitter.active) {
        emitter.stop()
        emitter.destroy()
      }
    })
  }, delay)
}

/**
 * Check if device is mobile (for performance optimization)
 */
export function isMobileDevice(scene: Phaser.Scene): boolean {
  return scene.cameras.main.width < 768
}
