/**
 * Card Animation Utilities
 *
 * Implements the exact animation specifications from CARD_DESIGN_HANDOFF.md
 * All timings, easings, and properties match the design document precisely.
 */

import type Phaser from 'phaser'

// Helper function for degrees to radians conversion
const degToRad = (degrees: number): number => degrees * (Math.PI / 180)

/**
 * Animation configuration types matching design spec
 */
export interface CardAnimationConfig {
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
 * Card Deal Animation - Exactly as specified in design doc
 * Duration: 800ms
 * Easing: cubic-bezier(0.34, 1.56, 0.64, 1) - Bounce effect
 * Stagger: 150ms between cards
 */
export function createCardDealAnimation(
  card: Phaser.GameObjects.Sprite,
  targetX: number,
  targetY: number,
  cardIndex: number = 0
): CardAnimationConfig {
  const staggerDelay = cardIndex * 150 // 150ms stagger as specified

  return {
    targets: card,
    x: { from: targetX - 200, to: targetX }, // translateX: from -200 to 0
    y: { from: targetY + 100, to: targetY }, // translateY: from 100 to 0
    rotation: { from: degToRad(-15), to: 0 }, // rotate: from -15 to 0 degrees
    alpha: { from: 0, to: 1 }, // opacity: from 0 to 1
    duration: 800, // Exact duration from spec
    ease: 'Back.easeOut', // Closest Phaser equivalent to cubic-bezier(0.34, 1.56, 0.64, 1)
    delay: staggerDelay,
  }
}

/**
 * Card Play Animation - Exactly as specified in design doc
 * Duration: 400ms
 * Easing: ease-out
 * Includes slight random rotation and squash effect
 */
export function createCardPlayAnimation(
  card: Phaser.GameObjects.Sprite,
  tableCenterX: number,
  tableCenterY: number
): CardAnimationConfig {
  // Random slight rotation between -5 and 5 degrees as specified
  const randomRotation = degToRad(Math.random() * 10 - 5)

  return {
    targets: card,
    x: tableCenterX,
    y: tableCenterY,
    rotation: randomRotation,
    scaleX: [
      { value: 1, duration: 0 },
      { value: 0.9, duration: 100 }, // Squash down
      { value: 1, duration: 300 }, // Return to normal
    ],
    scaleY: [
      { value: 1, duration: 0 },
      { value: 0.9, duration: 100 }, // Squash down
      { value: 1, duration: 300 }, // Return to normal
    ],
    duration: 400, // Exact duration from spec
    ease: 'Cubic.easeOut', // Phaser's ease-out equivalent
  }
}

/**
 * Suit Symbol Pulse Animation - Continuous pulse effect
 * Duration: 2000ms (2s cycle)
 * Easing: ease-in-out
 * Loop: infinite
 */
export function createSuitSymbolPulseAnimation(
  symbolSprite: Phaser.GameObjects.Sprite
): CardAnimationConfig {
  return {
    targets: symbolSprite,
    scaleX: [
      { value: 1, duration: 0 },
      { value: 1.05, duration: 1000 },
      { value: 1, duration: 1000 },
    ],
    scaleY: [
      { value: 1, duration: 0 },
      { value: 1.05, duration: 1000 },
      { value: 1, duration: 1000 },
    ],
    duration: 2000, // 2s cycle as specified
    ease: 'Sine.easeInOut', // Phaser's ease-in-out equivalent
    repeat: -1, // Infinite loop
  }
}

/**
 * Fire State Border Animation - Animated gradient border
 * Creates pulsing fire effect
 */
export function createFireStateAnimation(
  glowGraphics: Phaser.GameObjects.Graphics
): CardAnimationConfig {
  return {
    targets: glowGraphics,
    alpha: [
      { value: 0.6, duration: 500 },
      { value: 1, duration: 500 },
    ],
    scaleX: [
      { value: 1, duration: 500 },
      { value: 1.02, duration: 500 },
    ],
    scaleY: [
      { value: 1, duration: 500 },
      { value: 1.02, duration: 500 },
    ],
    duration: 1000, // 1s cycle as specified
    ease: 'Sine.easeInOut',
    repeat: -1, // Infinite loop
  }
}

/**
 * Frozen State Pulse Animation - Ice blue pulsing effect
 */
export function createFrozenStateAnimation(
  glowGraphics: Phaser.GameObjects.Graphics
): CardAnimationConfig {
  return {
    targets: glowGraphics,
    alpha: [
      { value: 0.8, duration: 1000 },
      { value: 0.4, duration: 1000 },
    ],
    duration: 2000, // 2s cycle for frozen effect
    ease: 'Sine.easeInOut',
    repeat: -1, // Infinite loop
  }
}

/**
 * Disabled State Animation - Sets card to disabled appearance
 * No animation, just immediate state change
 */
export function applyDisabledState(card: Phaser.GameObjects.Sprite): void {
  card.setAlpha(0.5) // opacity: 0.5 as specified
  card.setTint(0x808080) // Grayscale effect approximation
  if (card.input) {
    card.disableInteractive() // cursor: not-allowed, pointer-events: none
  }
}

/**
 * Remove Disabled State - Restore card to normal
 */
export function removeDisabledState(card: Phaser.GameObjects.Sprite): void {
  card.setAlpha(1)
  card.clearTint()
  if (card.input) {
    card.setInteractive()
  }
}

/**
 * Deal Animation Sequence - Orchestrates multiple cards being dealt
 * Uses exact stagger timing from spec (150ms between cards)
 */
export function createDealSequence(
  scene: Phaser.Scene,
  cards: Array<{ sprite: Phaser.GameObjects.Sprite; targetX: number; targetY: number }>,
  onComplete?: () => void
): void {
  cards.forEach(({ sprite, targetX, targetY }, index) => {
    const dealConfig = createCardDealAnimation(sprite, targetX, targetY, index)

    scene.tweens.add({
      ...dealConfig,
      onComplete: index === cards.length - 1 ? onComplete : undefined,
    })
  })
}

/**
 * Calculate exact stagger delay for deal animation
 * Matches spec: 150ms between each card
 */
export function calculateCardDealStagger(cardIndex: number): number {
  return cardIndex * 150 // Exact value from spec
}

/**
 * Check if animation should run at reduced framerate
 * Mobile: 40 FPS, Desktop: 60 FPS as specified
 */
export function getTargetFramerate(): number {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  return isMobile ? 40 : 60
}

/**
 * Optimize animation config for target framerate
 */
export function optimizeForFramerate(
  config: CardAnimationConfig,
  targetFPS: number
): CardAnimationConfig {
  if (targetFPS < 60) {
    // For mobile (40 FPS), increase duration slightly for smoother appearance
    return {
      ...config,
      duration: config.duration ? config.duration * 1.1 : config.duration,
    }
  }
  return config
}

/**
 * Create glow effect matching design spec colors
 */
export function createGlowEffect(
  scene: Phaser.Scene,
  card: Phaser.GameObjects.Sprite,
  state: 'hover' | 'fire' | 'frozen' | 'selected'
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics()

  const colors = {
    hover: 0xffd700, // Gold
    fire: 0xff4500, // Fire red
    frozen: 0x00bfff, // Ice blue
    selected: 0x00ff00, // Green
  }

  const thickness = state === 'hover' ? 4 : 5
  const padding = state === 'hover' ? 4 : 5

  graphics.lineStyle(thickness, colors[state], 0.8)
  graphics.strokeRoundedRect(
    card.x - card.displayWidth / 2 - padding,
    card.y - card.displayHeight / 2 - padding,
    card.displayWidth + padding * 2,
    card.displayHeight + padding * 2,
    12
  )
  graphics.setDepth(card.depth - 1)

  return graphics
}

/**
 * Update glow position when card moves
 */
export function updateGlowPosition(
  graphics: Phaser.GameObjects.Graphics,
  card: Phaser.GameObjects.Sprite,
  padding: number = 4
): void {
  graphics.clear()
  graphics.lineStyle(4, 0xffd700, 0.8) // Maintain same style
  graphics.strokeRoundedRect(
    card.x - card.displayWidth / 2 - padding,
    card.y - card.displayHeight / 2 - padding,
    card.displayWidth + padding * 2,
    card.displayHeight + padding * 2,
    12
  )
}
