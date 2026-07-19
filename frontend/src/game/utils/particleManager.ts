import Phaser from 'phaser'
import {
  ParticleType,
  PerformanceMode,
  PARTICLE_TEXTURES,
  PARTICLE_COLORS,
  PARTICLE_LIMITS,
  FIRE_EMITTER_CONFIG,
  ICE_EMITTER_CONFIG,
  EXPLOSION_EMITTER_CONFIG,
  CONFETTI_EMITTER_CONFIG,
  getParticleConfig,
  getPerformanceAdjustedQuantity,
  EmitterConfig
} from '../constants/particleConfig'

/**
 * Confetti emitter options
 */
export interface ConfettiOptions {
  quantity?: number
  duration?: number
  spread?: number
  colors?: number[]
}

/**
 * Sprite attachment options
 */
export interface AttachmentOptions {
  offsetX?: number
  offsetY?: number
}

/**
 * ParticleManager - Manages all particle effects in the game
 * Handles creation, tracking, performance optimization, and cleanup of particle emitters
 */
export class ParticleManager {
  private scene: Phaser.Scene
  private activeEmitters: Set<Phaser.GameObjects.Particles.ParticleEmitter>
  private performanceMode: PerformanceMode
  private attachmentMap: WeakMap<
    Phaser.GameObjects.Particles.ParticleEmitter,
    { sprite: Phaser.GameObjects.Sprite; listener: () => void }
  >

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.activeEmitters = new Set()
    this.performanceMode = 'normal'
    this.attachmentMap = new WeakMap()
  }

  /**
   * Check if device is mobile for performance optimization
   */
  isMobile(): boolean {
    return this.scene.cameras.main.width < 768
  }

  /**
   * Set performance mode
   */
  setPerformanceMode(mode: PerformanceMode): void {
    this.performanceMode = mode
  }

  /**
   * Get list of active emitters
   */
  getActiveEmitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    return Array.from(this.activeEmitters)
  }

  /**
   * Create fire particle emitter
   */
  createFireEmitter(x: number, y: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const config = { ...FIRE_EMITTER_CONFIG }
    const isMobile = this.isMobile()

    // Adjust quantity for performance
    config.quantity = getPerformanceAdjustedQuantity(
      'fire',
      config.quantity * 10, // Total particles over time
      isMobile,
      this.performanceMode
    ) / 10 // Back to per-emission quantity

    // Select random textures from fire set
    const textures = this.getRandomTextures(PARTICLE_TEXTURES.FIRE, 4)

    const emitter = this.scene.add.particles(x, y, textures, {
      ...config,
      tint: PARTICLE_COLORS.FIRE as number[]
    })

    emitter.setDepth(1000)
    this.trackEmitter(emitter)

    return emitter
  }

  /**
   * Create ice particle emitter
   */
  createIceEmitter(x: number, y: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const config = { ...ICE_EMITTER_CONFIG }
    const isMobile = this.isMobile()

    // Adjust quantity for performance
    config.quantity = getPerformanceAdjustedQuantity(
      'ice',
      config.quantity * 10,
      isMobile,
      this.performanceMode
    ) / 10

    // Select random textures from ice set
    const textures = this.getRandomTextures(PARTICLE_TEXTURES.ICE, 4)

    const emitter = this.scene.add.particles(x, y, textures, {
      ...config,
      tint: PARTICLE_COLORS.ICE as number[]
    })

    emitter.setDepth(1000)
    this.trackEmitter(emitter)

    return emitter
  }

  /**
   * Create explosion particle emitter
   */
  createExplosionEmitter(x: number, y: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const config = { ...EXPLOSION_EMITTER_CONFIG }
    const isMobile = this.isMobile()

    // Adjust quantity for performance
    config.quantity = getPerformanceAdjustedQuantity(
      'explosion',
      config.quantity,
      isMobile,
      this.performanceMode
    )

    // Select random textures from explosion set
    const textures = this.getRandomTextures(PARTICLE_TEXTURES.EXPLOSION, 4)

    const emitter = this.scene.add.particles(x, y, textures, {
      ...config,
      tint: PARTICLE_COLORS.EXPLOSION as number[]
    })

    emitter.setDepth(1001) // Higher depth for explosions
    this.trackEmitter(emitter)

    // Auto-cleanup after burst
    this.scene.time.delayedCall(1500, () => {
      this.stopEmitter(emitter)
    })

    return emitter
  }

  /**
   * Create confetti celebration emitter
   */
  createConfettiEmitter(
    x: number,
    y: number,
    options: ConfettiOptions = {}
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const config = { ...CONFETTI_EMITTER_CONFIG }
    const isMobile = this.isMobile()

    // Apply options
    const quantity = options.quantity ?? 100
    config.quantity = getPerformanceAdjustedQuantity(
      'confetti',
      quantity,
      isMobile,
      this.performanceMode
    ) / 20 // Divide by approximate emissions over duration

    // Adjust angle spread if specified
    if (options.spread !== undefined) {
      const halfSpread = options.spread / 2
      config.angle = { min: -halfSpread, max: halfSpread }
    }

    // Use custom colors if provided
    const colors = options.colors ?? (PARTICLE_COLORS.CONFETTI as number[])

    // Select random textures from confetti set
    const textures = this.getRandomTextures(PARTICLE_TEXTURES.CONFETTI, 5)

    const emitter = this.scene.add.particles(x, y, textures, {
      ...config,
      tint: colors
    })

    emitter.setDepth(1002) // Highest depth for celebrations
    this.trackEmitter(emitter)

    // Auto-cleanup after duration
    const duration = options.duration ?? 3000
    this.scene.time.delayedCall(duration, () => {
      this.stopEmitter(emitter)
    })

    return emitter
  }

  /**
   * Attach emitter to a sprite to follow its position
   */
  attachToSprite(
    emitter: Phaser.GameObjects.Particles.ParticleEmitter,
    sprite: Phaser.GameObjects.Sprite,
    options: AttachmentOptions = {}
  ): void {
    const offsetX = options.offsetX ?? 0
    const offsetY = options.offsetY ?? 0

    const updatePosition = () => {
      if (!sprite.active) {
        // Sprite destroyed, cleanup
        sprite.off('postupdate', updatePosition)
        this.stopEmitter(emitter)
        return
      }

      emitter.setPosition(sprite.x + offsetX, sprite.y + offsetY)
    }

    sprite.on('postupdate', updatePosition)

    // Store the attachment info for cleanup
    this.attachmentMap.set(emitter, { sprite, listener: updatePosition })

    // Initial position update
    updatePosition()
  }

  /**
   * Stop and remove an emitter
   */
  stopEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    // Clean up any sprite attachment
    const attachment = this.attachmentMap.get(emitter)
    if (attachment) {
      attachment.sprite.off('postupdate', attachment.listener)
      this.attachmentMap.delete(emitter)
    }

    // Stop and destroy emitter
    if (emitter && emitter.active) {
      emitter.stop()
      emitter.destroy()
    }

    this.activeEmitters.delete(emitter)
  }

  /**
   * Stop all active emitters
   */
  stopAllEmitters(): void {
    const emitters = Array.from(this.activeEmitters)
    emitters.forEach(emitter => this.stopEmitter(emitter))
  }

  /**
   * Destroy the particle manager and cleanup
   */
  destroy(): void {
    this.stopAllEmitters()
    this.activeEmitters.clear()
  }

  /**
   * Track an emitter and enforce limits
   */
  private trackEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    this.activeEmitters.add(emitter)

    // Enforce max emitter limit
    const maxEmitters = this.isMobile()
      ? PARTICLE_LIMITS.MAX_EMITTERS.MOBILE
      : PARTICLE_LIMITS.MAX_EMITTERS.DESKTOP

    if (this.activeEmitters.size > maxEmitters) {
      // Remove oldest emitter
      const oldest = this.activeEmitters.values().next().value
      if (oldest) {
        this.stopEmitter(oldest)
      }
    }
  }

  /**
   * Get random subset of textures
   */
  private getRandomTextures(textures: readonly string[], count: number): string[] {
    const shuffled = [...textures].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, textures.length))
  }
}

/**
 * Singleton instance for global access
 */
let particleManagerInstance: ParticleManager | null = null

/**
 * Get or create the ParticleManager instance
 */
export function getParticleManager(scene?: Phaser.Scene): ParticleManager {
  if (!particleManagerInstance && scene) {
    particleManagerInstance = new ParticleManager(scene)
  }

  if (!particleManagerInstance) {
    throw new Error('ParticleManager not initialized. Provide a scene on first call.')
  }

  return particleManagerInstance
}

/**
 * Reset the ParticleManager instance (useful for testing or scene changes)
 */
export function resetParticleManager(): void {
  if (particleManagerInstance) {
    particleManagerInstance.destroy()
    particleManagerInstance = null
  }
}