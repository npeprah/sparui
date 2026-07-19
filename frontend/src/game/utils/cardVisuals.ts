/**
 * Card visual effect utilities
 * Implements visual states and transitions based on design specifications
 */

import type Phaser from 'phaser'
import type { Suit } from '../../store/types'
import type { CardState } from '../constants/cardStates'
import { getCardStateConfig } from '../constants/cardStates'
import { getSuitPatternColor } from '../constants/cardColors'

/**
 * Apply visual state to a card sprite
 * @param sprite - The card sprite
 * @param state - The visual state to apply
 * @returns Object with state info and any special effects
 */
export function applyCardVisualState(
  sprite: Phaser.GameObjects.Sprite,
  state: CardState
): { state: CardState; particleEffect?: string } {
  const config = getCardStateConfig(state)
  const result: { state: CardState; particleEffect?: string } = { state }

  // Apply opacity
  if (config.opacity !== undefined) {
    sprite.setAlpha(config.opacity)
  }

  // Apply scale
  if (config.scale !== undefined) {
    sprite.setScale(config.scale)
  }

  // Apply grayscale effect (simulated with tint)
  if (config.grayscale !== undefined && config.grayscale > 0) {
    // Simulate grayscale with a gray tint
    const grayValue = Math.floor(128 * (1 - config.grayscale) + 128 * config.grayscale)
    const tintColor = (grayValue << 16) | (grayValue << 8) | grayValue // RGB to hex
    sprite.setTint(tintColor)
  } else if (state === 'frozen') {
    // Apply blue tint for frozen state
    sprite.setTint(0x00bfff)
  } else if (state === 'default') {
    sprite.clearTint()
  }

  // Handle special states
  if (state === 'hover') {
    // Hover animation handled by transitionToState
    sprite.scene.tweens.add({
      targets: sprite,
      scaleX: config.scale || 1.05,
      scaleY: config.scale || 1.05,
      y: sprite.y + (config.translateY || -30),
      duration: config.duration || 600,
      ease: 'Cubic.easeInOut',
    })
  }

  if (state === 'fire') {
    result.particleEffect = 'fire'
  }

  if (state === 'frozen') {
    result.particleEffect = 'ice'
  }

  return result
}

/**
 * Apply Kente pattern overlay to a card
 * @param sprite - The card sprite
 * @param suit - The card suit for color selection
 * @returns The pattern graphics object
 */
export function applyKentePattern(
  sprite: Phaser.GameObjects.Sprite,
  suit: Suit
): Phaser.GameObjects.Graphics {
  const graphics = sprite.scene.add.graphics()
  const patternColor = getSuitPatternColor(suit)

  // Parse rgba color
  const rgbaMatch = patternColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch
    const color = (parseInt(r) << 16) | (parseInt(g) << 8) | parseInt(b) // RGB to hex

    graphics.fillStyle(color, parseFloat(a))

    // Create simple pattern rectangles (Phaser doesn't support CSS patterns directly)
    const width = sprite.width * 0.9
    const height = sprite.height * 0.85
    const x = sprite.x - width / 2
    const y = sprite.y - height / 2

    // Vertical stripes
    for (let i = 0; i < width; i += 20) {
      graphics.fillRect(x + i, y, 10, height)
    }

    // Horizontal stripes (overlay)
    graphics.setAlpha(0.5)
    for (let i = 0; i < height; i += 20) {
      graphics.fillRect(x, y + i, width, 10)
    }

    graphics.setAlpha(0.7) // Overall pattern opacity
  }

  return graphics
}

/**
 * Create glow effect for a card
 * @param sprite - The card sprite
 * @param state - The card state for glow intensity
 * @returns The glow graphics object
 */
export function createCardGlow(
  sprite: Phaser.GameObjects.Sprite,
  state: CardState
): Phaser.GameObjects.Graphics {
  const graphics = sprite.scene.add.graphics()
  const config = getCardStateConfig(state)

  // Position glow behind card
  graphics.setDepth(sprite.depth - 1)

  let glowColor = 0xff4500 // Default orange glow
  let glowAlpha = 0.3

  if (state === 'hover') {
    glowColor = 0xffd700 // Gold glow
    glowAlpha = 0.6
  } else if (state === 'fire') {
    glowColor = 0xff4500 // Fire orange
    glowAlpha = 0.8
  } else if (state === 'frozen') {
    glowColor = 0x00bfff // Ice blue
    glowAlpha = 0.8
  }

  // Draw multiple layers for glow effect
  for (let i = 3; i > 0; i--) {
    graphics.fillStyle(glowColor, glowAlpha / i)
    graphics.fillRect(
      sprite.x - sprite.width / 2 - i * 10,
      sprite.y - sprite.height / 2 - i * 10,
      sprite.width + i * 20,
      sprite.height + i * 20
    )
  }

  return graphics
}

/**
 * Transition card from one state to another
 * @param sprite - The card sprite
 * @param fromState - Current state
 * @param toState - Target state
 */
export function transitionToState(
  sprite: Phaser.GameObjects.Sprite,
  fromState: CardState,
  toState: CardState
): void {
  // Kill any existing tweens
  sprite.scene.tweens.killTweensOf(sprite)

  if (toState === 'disabled') {
    // Immediately apply disabled state
    sprite.setAlpha(0.5)
    const grayValue = Math.floor(128 * 0.4 + 128 * 0.6) // 60% grayscale
    const tintColor = (grayValue << 16) | (grayValue << 8) | grayValue // RGB to hex
    sprite.setTint(tintColor)
    return
  }

  const config = getStateTransitionConfig(fromState, toState)
  if (config.duration) {
    sprite.scene.tweens.add({
      targets: sprite,
      ...config,
    })
  }
}

/**
 * Get transition configuration between states
 * @param _fromState - Current state (unused but kept for API consistency)
 * @param toState - Target state
 * @returns Tween configuration object
 */
export function getStateTransitionConfig(
  _fromState: CardState,
  toState: CardState
): Phaser.Types.Tweens.TweenBuilderConfig {
  const config: any = {}

  if (toState === 'hover') {
    config.duration = 600
    config.ease = 'Cubic.easeInOut'
    config.scaleX = 1.05
    config.scaleY = 1.05
    config.y = '-=30' // Relative movement
  } else if (toState === 'active') {
    config.duration = 400
    config.ease = 'Power2'
    config.scaleX = 0.95
    config.scaleY = 0.95
  } else if (toState === 'default') {
    config.duration = 300
    config.ease = 'Power1'
    config.scaleX = 1
    config.scaleY = 1
    config.alpha = 1
  }

  return config
}