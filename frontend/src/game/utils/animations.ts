/**
 * Animation Utility Functions
 *
 * Reusable, pure functions for creating Phaser animations.
 * These functions return Phaser tween config objects that can be
 * passed to scene.tweens.add() or tweens.chain().
 */

import Phaser from 'phaser'
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  ANIMATION_SCALE,
  ANIMATION_ALPHA,
  getRandomPlayRotation,
  emitSoundEvent,
} from '../constants/animations'

/**
 * Tween configuration type (for type safety)
 */
export interface TweenConfig {
  targets: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]
  duration: number
  ease?: string
  delay?: number
  yoyo?: boolean
  repeat?: number
  onComplete?: () => void
  onUpdate?: () => void
  [key: string]: unknown
}

/**
 * Create deal animation tween config
 * Card flies from deck position to hand with rotation
 * Design specs:
 * - Duration: 800ms per card
 * - Easing: cubic-bezier(0.34, 1.56, 0.64, 1) for bounce effect
 * - Properties: opacity 0→1, translateX -200px→0, translateY 100px→0, rotate -15°→0°
 * - Stagger: 150ms delay between each card
 */
export function createDealAnimation(
  card: Phaser.GameObjects.Sprite,
  targetX: number,
  targetY: number,
  delay: number = 0,
  onComplete?: () => void
): TweenConfig {
  // Calculate initial rotation (-15° to 0° as per design spec)
  const initialRotation = degreesToRadians(-15)

  return {
    targets: card,
    // Translation animations with initial offsets
    x: { from: targetX - 200, to: targetX }, // translateX: -200px → 0
    y: { from: targetY + 100, to: targetY }, // translateY: 100px → 0
    // Opacity animation
    alpha: { from: 0, to: 1 }, // opacity: 0 → 1
    // Rotation animation
    rotation: { from: initialRotation, to: 0 }, // rotate: -15° → 0°
    duration: ANIMATION_DURATION.DEAL,
    ease: ANIMATION_EASING.DEAL,
    delay,
    onStart: function () {
      // Trigger sound event when animation starts
      if (card.scene) {
        emitSoundEvent(card.scene, 'CARD_DEAL')
      }
    },
    onComplete,
  }
}

/**
 * Create flip animation tween configs (two-part animation)
 * Returns array of [scaleDown, scaleUp] configs for chaining
 * Design specs:
 * - Duration: 400ms total (200ms each half)
 * - 180° rotation around Y-axis (simulated with scale)
 * - Perspective scale effects
 */
export function createFlipAnimation(
  card: Phaser.GameObjects.Sprite,
  onMidpoint?: () => void,
  onComplete?: () => void
): [TweenConfig, TweenConfig] {
  // First half: scale down to midpoint (card "turns sideways")
  const scaleDown: TweenConfig = {
    targets: card,
    scaleX: ANIMATION_SCALE.FLIP_MIDPOINT,
    scaleY: 0.95, // Slight Y scale for perspective effect
    duration: ANIMATION_DURATION.FLIP_HALFWAY,
    ease: ANIMATION_EASING.FLIP_SCALE_DOWN,
    onStart: function () {
      // Trigger sound event when flip starts
      if (card.scene) {
        emitSoundEvent(card.scene, 'CARD_FLIP')
      }
    },
    onComplete: onMidpoint,
  }

  // Second half: scale back up (card "faces forward" with new texture)
  const scaleUp: TweenConfig = {
    targets: card,
    scaleX: card.scaleY, // Match the Y scale
    scaleY: 1, // Return to normal Y scale
    duration: ANIMATION_DURATION.FLIP_HALFWAY,
    ease: ANIMATION_EASING.FLIP_SCALE_UP,
    onComplete,
  }

  return [scaleDown, scaleUp]
}

/**
 * Create play animation tween config
 * Card moves to center play area with slight rotation
 * Design specs:
 * - Duration: 400ms
 * - Easing: ease-out
 * - Random rotation: -5° to 5°
 * - Squash effect: scale 1 → 0.9 → 1
 */
export function createPlayAnimation(
  card: Phaser.GameObjects.Sprite,
  targetX: number,
  targetY: number,
  targetScale: number,
  onComplete?: () => void
): TweenConfig {
  return {
    targets: card,
    x: targetX,
    y: targetY,
    // Squash effect: scale animation with keyframes
    scaleX: {
      value: [1, 0.9, targetScale],
      duration: [133, 133, 134], // Split 400ms into 3 parts
    },
    scaleY: {
      value: [1, 0.9, targetScale],
      duration: [133, 133, 134],
    },
    rotation: getRandomPlayRotation(),
    duration: ANIMATION_DURATION.PLAY,
    ease: ANIMATION_EASING.PLAY,
    onStart: function () {
      // Trigger sound event when animation starts
      if (card.scene) {
        emitSoundEvent(card.scene, 'CARD_PLAY')
      }
    },
    onComplete,
  }
}

/**
 * Create winning card pulse animation
 * Card pulses and glows with green effect
 * Design specs:
 * - Duration: 300ms
 * - Scale: 1 → 1.05 → 1
 * - Green glow filter
 * - Shadow enhancement
 */
export function createWinPulseAnimation(
  card: Phaser.GameObjects.Sprite,
  onComplete?: () => void
): TweenConfig {
  return {
    targets: card,
    scaleX: {
      from: 1.0,
      to: 1.05,
    },
    scaleY: {
      from: 1.0,
      to: 1.05,
    },
    duration: ANIMATION_DURATION.WIN_PULSE,
    ease: ANIMATION_EASING.WIN_PULSE,
    yoyo: true,
    repeat: 2, // Pulse 3 times total
    // Green glow filter effect
    glowFilter: {
      color: 0x00ff00, // Green color
      intensity: 1.5,
      innerStrength: 2,
      outerStrength: 4,
      knockout: false,
    },
    onStart: function () {
      // Trigger sound event when win animation starts
      if (card.scene) {
        emitSoundEvent(card.scene, 'WIN_ROUND')
      }
    },
    onComplete,
  }
}

/**
 * Create losing card fade/shrink animation
 * Card fades out and shrinks slightly
 * Design specs:
 * - Duration: 600ms
 * - Opacity: 1 → 0
 * - Red tint overlay
 * - Scale down slightly
 */
export function createLoseFadeAnimation(
  card: Phaser.GameObjects.Sprite,
  onComplete?: () => void
): TweenConfig {
  return {
    targets: card,
    alpha: ANIMATION_ALPHA.LOSE_ALPHA,
    scaleX: ANIMATION_SCALE.LOSE_SCALE,
    scaleY: ANIMATION_SCALE.LOSE_SCALE,
    tint: 0xff0000, // Red tint overlay
    duration: ANIMATION_DURATION.LOSE_FADE,
    ease: ANIMATION_EASING.LOSE_FADE,
    onStart: function () {
      // Trigger sound event when lose animation starts
      if (card.scene) {
        emitSoundEvent(card.scene, 'LOSE_ROUND')
      }
    },
    onComplete,
  }
}

/**
 * Create card collection animation
 * Cards move to winner's position
 * Design specs:
 * - Duration: 500ms
 * - Arc path motion to winner
 * - Scale down during collection
 */
export function createCollectAnimation(
  card: Phaser.GameObjects.Sprite,
  targetX: number,
  targetY: number,
  delay: number = 0,
  onComplete?: () => void
): TweenConfig {
  // Calculate arc path control point (midpoint raised up)
  const startX = card.x
  const startY = card.y
  const midX = (startX + targetX) / 2
  const midY = Math.min(startY, targetY) - 100 // Arc height

  return {
    targets: card,
    x: targetX,
    y: targetY,
    scaleX: 0.3,
    scaleY: 0.3,
    alpha: 0.5,
    duration: ANIMATION_DURATION.COLLECT_TO_WINNER,
    ease: ANIMATION_EASING.COLLECT,
    delay,
    // Arc path motion
    motionPath: {
      type: 'arc',
      curviness: 1.5,
      path: [
        { x: startX, y: startY },
        { x: midX, y: midY },
        { x: targetX, y: targetY },
      ],
    },
    onStart: function () {
      // Trigger sound event when collect animation starts
      if (card.scene) {
        emitSoundEvent(card.scene, 'CARD_COLLECT')
      }
    },
    onComplete,
  }
}

/**
 * Create hover lift animation
 * Card lifts up and scales slightly
 */
export function createHoverLiftAnimation(
  card: Phaser.GameObjects.Sprite,
  originalY: number,
  onComplete?: () => void
): TweenConfig {
  return {
    targets: card,
    y: originalY + ANIMATION_SCALE.HOVER_LIFT_Y,
    scaleX: card.scaleX * ANIMATION_SCALE.HOVER_SCALE,
    scaleY: card.scaleY * ANIMATION_SCALE.HOVER_SCALE,
    duration: ANIMATION_DURATION.HOVER_LIFT,
    ease: ANIMATION_EASING.HOVER,
    onComplete,
  }
}

/**
 * Create hover return animation
 * Card returns to original position
 */
export function createHoverReturnAnimation(
  card: Phaser.GameObjects.Sprite,
  originalY: number,
  originalScaleX: number,
  originalScaleY: number,
  onComplete?: () => void
): TweenConfig {
  return {
    targets: card,
    y: originalY,
    scaleX: originalScaleX,
    scaleY: originalScaleY,
    duration: ANIMATION_DURATION.HOVER_LIFT,
    ease: ANIMATION_EASING.HOVER,
    onComplete,
  }
}

/**
 * Create glow pulse animation for graphics object
 * Used for selection and special effects
 */
export function createGlowPulseAnimation(
  glow: Phaser.GameObjects.Graphics,
  minAlpha: number = 0.4,
  maxAlpha: number = 1.0
): TweenConfig {
  return {
    targets: glow,
    alpha: { from: maxAlpha, to: minAlpha },
    duration: ANIMATION_DURATION.SELECTION_PULSE,
    ease: ANIMATION_EASING.SELECTION,
    yoyo: true,
    repeat: -1, // Infinite loop
  }
}

/**
 * Stop all tweens on a game object
 * Useful for cleanup and state changes
 */
export function stopAllTweens(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject): void {
  scene.tweens.getTweensOf(target).forEach(tween => {
    tween.stop()
    tween.remove()
  })
}

/**
 * Calculate stagger delay for dealing multiple cards
 */
export function calculateDealStagger(cardIndex: number): number {
  return cardIndex * ANIMATION_DURATION.DEAL_STAGGER
}

/**
 * Calculate stagger delay for collecting multiple cards
 */
export function calculateCollectStagger(cardIndex: number): number {
  return cardIndex * 100 // 100ms stagger for collection
}

/**
 * Check if a tween is currently active on a target
 */
export function hasTween(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject): boolean {
  return scene.tweens.getTweensOf(target).length > 0
}

/**
 * Get rotation in degrees from radians
 * Helper for debugging and testing
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI)
}

/**
 * Get rotation in radians from degrees
 * Helper for setting specific rotations
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}
