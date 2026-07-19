import Phaser from 'phaser'
import { ParticleManager, getParticleManager, resetParticleManager } from './particleManager'
import { CELEBRATION_CONFIG } from '../constants/particleConfig'

/**
 * Position for particle emission
 */
export interface EmitPosition {
  x: number
  y: number
}

/**
 * Track active celebration emitters
 */
let activeCelebrationEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []

/**
 * Create round win celebration effect
 * Confetti burst (500-1000 particles) for 2 seconds from winner position
 */
export function createRoundWinCelebration(
  scene: Phaser.Scene,
  winnerPosition: EmitPosition
): Phaser.GameObjects.Particles.ParticleEmitter[] {
  const particleManager = getParticleManager(scene)
  const emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []
  const isMobile = scene.cameras.main.width < 768

  // Play win sound
  if (scene.sound) {
    scene.sound.play('sound:win_round')
  }

  // Calculate particle count based on device
  const baseQuantity = CELEBRATION_CONFIG.ROUND_WIN.confettiQuantity
  const quantity = isMobile ? Math.floor(baseQuantity * 0.6) : baseQuantity

  // Create confetti burst slightly above winner position for better visibility
  const confettiEmitter = particleManager.createConfettiEmitter(
    winnerPosition.x,
    winnerPosition.y - 50,
    {
      quantity: quantity * 10, // Total particles over duration
      duration: CELEBRATION_CONFIG.ROUND_WIN.duration,
      spread: 60 // 60 degree spread cone
    }
  )
  emitters.push(confettiEmitter)

  // Add a single explosion at winner position
  const explosionEmitter = particleManager.createExplosionEmitter(
    winnerPosition.x,
    winnerPosition.y
  )
  emitters.push(explosionEmitter)

  // Track for cleanup
  activeCelebrationEmitters.push(...emitters)

  return emitters
}

/**
 * Create game win celebration effect
 * Multiple explosions + confetti rain (1500+ particles) for 5 seconds
 */
export function createGameWinCelebration(
  scene: Phaser.Scene,
  winnerPosition: EmitPosition
): Phaser.GameObjects.Particles.ParticleEmitter[] {
  const particleManager = getParticleManager(scene)
  const emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []
  const isMobile = scene.cameras.main.width < 768

  // Play victory sound
  if (scene.sound) {
    scene.sound.play('sound:game_victory')
  }

  // Calculate particle count based on device
  const baseQuantity = CELEBRATION_CONFIG.GAME_WIN.confettiQuantity
  const quantity = isMobile ? Math.floor(baseQuantity * 0.5) : baseQuantity

  // Get screen dimensions
  const { centerX, centerY, width, height } = scene.cameras.main

  // Create sustained confetti rain from multiple positions
  // Center confetti (main celebration)
  const centerConfetti = particleManager.createConfettiEmitter(
    winnerPosition.x,
    winnerPosition.y - 100,
    {
      quantity: quantity * 15, // Total particles over duration
      duration: CELEBRATION_CONFIG.GAME_WIN.duration,
      spread: 90 // Wider spread for game win
    }
  )
  emitters.push(centerConfetti)

  // Side confetti for screen-wide effect (desktop only)
  if (!isMobile) {
    // Left side
    const leftConfetti = particleManager.createConfettiEmitter(
      width * 0.25,
      height * 0.3,
      {
        quantity: quantity * 10,
        duration: CELEBRATION_CONFIG.GAME_WIN.duration,
        spread: 60
      }
    )
    emitters.push(leftConfetti)

    // Right side
    const rightConfetti = particleManager.createConfettiEmitter(
      width * 0.75,
      height * 0.3,
      {
        quantity: quantity * 10,
        duration: CELEBRATION_CONFIG.GAME_WIN.duration,
        spread: 60
      }
    )
    emitters.push(rightConfetti)
  }

  // Create staggered explosions for fireworks effect
  const explosionCount = isMobile ? 2 : CELEBRATION_CONFIG.GAME_WIN.explosions
  const explosionDelay = CELEBRATION_CONFIG.GAME_WIN.explosionDelay

  for (let i = 0; i < explosionCount; i++) {
    scene.time.delayedCall(i * explosionDelay, () => {
      // Vary explosion positions around winner
      const offsetX = (Math.random() - 0.5) * 200
      const offsetY = (Math.random() - 0.5) * 150

      const explosion = particleManager.createExplosionEmitter(
        winnerPosition.x + offsetX,
        winnerPosition.y + offsetY
      )
      emitters.push(explosion)
      activeCelebrationEmitters.push(explosion)
    })
  }

  // Track for cleanup
  activeCelebrationEmitters.push(...emitters)

  return emitters
}

/**
 * Stop all active celebration effects
 */
export function stopAllCelebrations(): void {
  activeCelebrationEmitters.forEach(emitter => {
    if (emitter && emitter.active) {
      emitter.stop()
      emitter.destroy()
    }
  })
  activeCelebrationEmitters = []
}

/**
 * Create a custom celebration at specified position
 */
export function createCustomCelebration(
  scene: Phaser.Scene,
  position: EmitPosition,
  options: {
    confetti?: boolean
    explosion?: boolean
    duration?: number
    quantity?: number
    spread?: number
    colors?: number[]
  } = {}
): Phaser.GameObjects.Particles.ParticleEmitter[] {
  const particleManager = getParticleManager(scene)
  const emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []

  if (options.confetti !== false) {
    const confettiEmitter = particleManager.createConfettiEmitter(
      position.x,
      position.y,
      {
        quantity: options.quantity ?? 50,
        duration: options.duration ?? 2000,
        spread: options.spread ?? 60,
        colors: options.colors
      }
    )
    emitters.push(confettiEmitter)
  }

  if (options.explosion) {
    const explosionEmitter = particleManager.createExplosionEmitter(
      position.x,
      position.y
    )
    emitters.push(explosionEmitter)
  }

  // Track for cleanup
  activeCelebrationEmitters.push(...emitters)

  return emitters
}