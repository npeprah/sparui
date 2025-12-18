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
  getRandomDealRotation,
  getRandomPlayRotation,
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
 */
export function createDealAnimation(
  card: Phaser.GameObjects.Sprite,
  targetX: number,
  targetY: number,
  delay: number = 0
): TweenConfig {
  return {
    targets: card,
    x: targetX,
    y: targetY,
    rotation: getRandomDealRotation(),
    duration: ANIMATION_DURATION.DEAL,
    ease: ANIMATION_EASING.DEAL,
    delay,
  }
}

/**
 * Create flip animation tween configs (two-part animation)
 * Returns array of [scaleDown, scaleUp] configs for chaining
 */
export function createFlipAnimation(
  card: Phaser.GameObjects.Sprite,
  onMidpoint?: () => void
): [TweenConfig, TweenConfig] {
  // First half: scale down to midpoint (card "turns sideways")
  const scaleDown: TweenConfig = {
    targets: card,
    scaleX: ANIMATION_SCALE.FLIP_MIDPOINT,
    duration: ANIMATION_DURATION.FLIP_HALFWAY,
    ease: ANIMATION_EASING.FLIP_SCALE_DOWN,
    onComplete: onMidpoint,
  }

  // Second half: scale back up (card "faces forward" with new texture)
  const scaleUp: TweenConfig = {
    targets: card,
    scaleX: card.scaleY, // Match the Y scale
    duration: ANIMATION_DURATION.FLIP_HALFWAY,
    ease: ANIMATION_EASING.FLIP_SCALE_UP,
  }

  return [scaleDown, scaleUp]
}

/**
 * Create play animation tween config
 * Card moves to center play area with slight rotation
 */
export function createPlayAnimation(
  card: Phaser.GameObjects.Sprite,
  targetX: number,
  targetY: number,
  targetScale: number
): TweenConfig {
  return {
    targets: card,
    x: targetX,
    y: targetY,
    scaleX: targetScale,
    scaleY: targetScale,
    rotation: getRandomPlayRotation(),
    duration: ANIMATION_DURATION.PLAY,
    ease: ANIMATION_EASING.PLAY,
  }
}

/**
 * Create winning card pulse animation
 * Card pulses and glows with gold effect
 */
export function createWinPulseAnimation(
  card: Phaser.GameObjects.Sprite
): TweenConfig {
  return {
    targets: card,
    scaleX: {
      from: ANIMATION_SCALE.WIN_PULSE_MIN,
      to: ANIMATION_SCALE.WIN_PULSE_MAX,
    },
    scaleY: {
      from: ANIMATION_SCALE.WIN_PULSE_MIN,
      to: ANIMATION_SCALE.WIN_PULSE_MAX,
    },
    duration: ANIMATION_DURATION.WIN_PULSE,
    ease: ANIMATION_EASING.WIN_PULSE,
    yoyo: true,
    repeat: 2, // Pulse 3 times total
  }
}

/**
 * Create losing card fade/shrink animation
 * Card fades out and shrinks slightly
 */
export function createLoseFadeAnimation(
  card: Phaser.GameObjects.Sprite
): TweenConfig {
  return {
    targets: card,
    alpha: ANIMATION_ALPHA.LOSE_ALPHA,
    scaleX: ANIMATION_SCALE.LOSE_SCALE,
    scaleY: ANIMATION_SCALE.LOSE_SCALE,
    duration: ANIMATION_DURATION.LOSE_FADE,
    ease: ANIMATION_EASING.LOSE_FADE,
  }
}

/**
 * Create card collection animation
 * Cards move to winner's position
 */
export function createCollectAnimation(
  card: Phaser.GameObjects.Sprite,
  targetX: number,
  targetY: number,
  delay: number = 0
): TweenConfig {
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
  }
}

/**
 * Create hover lift animation
 * Card lifts up and scales slightly
 */
export function createHoverLiftAnimation(
  card: Phaser.GameObjects.Sprite,
  originalY: number
): TweenConfig {
  return {
    targets: card,
    y: originalY + ANIMATION_SCALE.HOVER_LIFT_Y,
    scaleX: card.scaleX * ANIMATION_SCALE.HOVER_SCALE,
    scaleY: card.scaleY * ANIMATION_SCALE.HOVER_SCALE,
    duration: ANIMATION_DURATION.HOVER_LIFT,
    ease: ANIMATION_EASING.HOVER,
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
  originalScaleY: number
): TweenConfig {
  return {
    targets: card,
    y: originalY,
    scaleX: originalScaleX,
    scaleY: originalScaleY,
    duration: ANIMATION_DURATION.HOVER_LIFT,
    ease: ANIMATION_EASING.HOVER,
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
export function stopAllTweens(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject
): void {
  scene.tweens.getTweensOf(target).forEach((tween) => {
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
export function hasTween(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject
): boolean {
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
