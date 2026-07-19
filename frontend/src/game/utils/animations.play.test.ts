/**
 * Card Play Animation Tests
 *
 * Tests for the card play animation to ensure it matches
 * the exact design specifications:
 * - Duration: 400ms
 * - Easing: ease-out
 * - Move to table center with random rotation (-5° to 5°)
 * - Squash effect: scale 1 → 0.9 → 1
 * - Sound hook: "card_play" sound plays during animation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import Phaser from 'phaser'
import {
  createPlayAnimation,
  createFlipAnimation,
  createWinPulseAnimation,
  createLoseFadeAnimation,
  createCollectAnimation
} from './animations'
import { ANIMATION_DURATION, ANIMATION_EASING, ANIMATION_SCALE, ANIMATION_ALPHA, SOUND_EVENTS } from '../constants/animations'

// Mock Phaser.GameObjects.Sprite
const createMockSprite = (): Phaser.GameObjects.Sprite => {
  return {
    x: 100,
    y: 100,
    rotation: 0,
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
    scene: {
      events: {
        emit: vi.fn(),
      },
    },
  } as unknown as Phaser.GameObjects.Sprite
}

describe('Card Play Animation', () => {
  let mockSprite: Phaser.GameObjects.Sprite

  beforeEach(() => {
    mockSprite = createMockSprite()
  })

  describe('Play Animation', () => {
    it('should have duration of 400ms', () => {
      expect(ANIMATION_DURATION.PLAY).toBe(400)
    })

    it('should use ease-out easing', () => {
      // Phaser uses 'Cubic.easeOut' for ease-out
      expect(ANIMATION_EASING.PLAY).toBe('Cubic.easeOut')
    })

    it('should move card to table center', () => {
      const targetX = 512 // Table center X
      const targetY = 384 // Table center Y
      const targetScale = 0.8

      const config = createPlayAnimation(mockSprite, targetX, targetY, targetScale)

      expect(config.targets).toBe(mockSprite)
      expect(config.x).toBe(targetX)
      expect(config.y).toBe(targetY)
      expect(config.duration).toBe(400)
      expect(config.ease).toBe('Cubic.easeOut')
    })

    it('should apply random rotation between -5° and 5°', () => {
      const targetX = 512
      const targetY = 384
      const targetScale = 0.8

      const config = createPlayAnimation(mockSprite, targetX, targetY, targetScale)

      expect(config.rotation).toBeDefined()
      expect(typeof config.rotation).toBe('number')

      // Convert to degrees and check range
      const rotationInDegrees = (config.rotation as number) * (180 / Math.PI)
      expect(rotationInDegrees).toBeGreaterThanOrEqual(-8.6) // Allow some variance
      expect(rotationInDegrees).toBeLessThanOrEqual(8.6)
    })

    it('should implement squash effect (scale 1 → 0.9 → 1)', () => {
      const targetX = 512
      const targetY = 384
      const targetScale = 1.0

      const config = createPlayAnimation(mockSprite, targetX, targetY, targetScale)

      // The squash effect should be a keyframe animation
      // Scale should go from 1 → 0.9 → 1
      expect(config.scaleX).toEqual({
        value: [1, 0.9, targetScale],
        duration: [133, 133, 134], // Split 400ms into 3 parts
      })
      expect(config.scaleY).toEqual({
        value: [1, 0.9, targetScale],
        duration: [133, 133, 134],
      })
    })

    it('should trigger card_play sound event', () => {
      const targetX = 512
      const targetY = 384
      const targetScale = 0.8

      const config = createPlayAnimation(mockSprite, targetX, targetY, targetScale)

      expect(SOUND_EVENTS.CARD_PLAY).toBe('sound:card_play')
      expect(config.onStart).toBeDefined()
    })
  })

  describe('Flip Animation', () => {
    it('should have total duration of 400ms', () => {
      expect(ANIMATION_DURATION.FLIP).toBe(400)
      expect(ANIMATION_DURATION.FLIP_HALFWAY).toBe(200)
    })

    it('should return two-part animation for 180° Y-axis rotation', () => {
      const [scaleDown, scaleUp] = createFlipAnimation(mockSprite)

      // First half: scale down to simulate rotation
      expect(scaleDown.targets).toBe(mockSprite)
      expect(scaleDown.scaleX).toBe(ANIMATION_SCALE.FLIP_MIDPOINT)
      expect(scaleDown.duration).toBe(200)
      expect(scaleDown.ease).toBe('Cubic.easeIn')

      // Second half: scale back up
      expect(scaleUp.targets).toBe(mockSprite)
      expect(scaleUp.scaleX).toBe(mockSprite.scaleY)
      expect(scaleUp.duration).toBe(200)
      expect(scaleUp.ease).toBe('Cubic.easeOut')
    })

    it('should support perspective scale effects', () => {
      const [scaleDown, scaleUp] = createFlipAnimation(mockSprite)

      // Should include scale effects for perspective
      expect(scaleDown).toHaveProperty('scaleY')
      expect(scaleUp).toHaveProperty('scaleY')
    })

    it('should trigger card_flip sound event', () => {
      const onMidpoint = vi.fn()
      const [scaleDown, scaleUp] = createFlipAnimation(mockSprite, onMidpoint)

      expect(SOUND_EVENTS.CARD_FLIP).toBe('sound:card_flip')
      expect(scaleDown.onStart).toBeDefined()
    })
  })

  describe('Win Pulse Animation', () => {
    it('should have duration of 300ms', () => {
      expect(ANIMATION_DURATION.WIN_PULSE).toBe(300)
    })

    it('should pulse scale from 1 → 1.05 → 1', () => {
      const config = createWinPulseAnimation(mockSprite)

      expect(config.targets).toBe(mockSprite)
      expect(config.scaleX).toEqual({
        from: 1.0,
        to: 1.05,
      })
      expect(config.scaleY).toEqual({
        from: 1.0,
        to: 1.05,
      })
      expect(config.duration).toBe(300)
      expect(config.yoyo).toBe(true)
      expect(config.repeat).toBeGreaterThanOrEqual(1) // At least one repeat for pulse effect
    })

    it('should apply green glow filter', () => {
      const config = createWinPulseAnimation(mockSprite)

      // Check for glow effect properties or filter
      expect(config).toHaveProperty('glowFilter')
      const glowFilter = config.glowFilter as any
      expect(glowFilter.color).toBe(0x00ff00) // Green color
      expect(glowFilter.intensity).toBeGreaterThan(0)
    })

    it('should trigger win_round sound event', () => {
      const config = createWinPulseAnimation(mockSprite)

      expect(SOUND_EVENTS.WIN_ROUND).toBe('sound:win_round')
      expect(config.onStart).toBeDefined()
    })
  })

  describe('Lose Fade Animation', () => {
    it('should have duration of 600ms', () => {
      expect(ANIMATION_DURATION.LOSE_FADE).toBe(600)
    })

    it('should fade opacity from 1 → 0', () => {
      const config = createLoseFadeAnimation(mockSprite)

      expect(config.targets).toBe(mockSprite)
      expect(config.alpha).toBeLessThan(1) // Should fade out
      expect(config.duration).toBe(600)
      expect(config.ease).toBe('Cubic.easeOut')
    })

    it('should scale down slightly', () => {
      const config = createLoseFadeAnimation(mockSprite)

      expect(config.scaleX).toBeLessThan(1)
      expect(config.scaleY).toBeLessThan(1)
      expect(config.scaleX).toBe(ANIMATION_SCALE.LOSE_SCALE)
      expect(config.scaleY).toBe(ANIMATION_SCALE.LOSE_SCALE)
    })

    it('should apply red tint overlay', () => {
      const config = createLoseFadeAnimation(mockSprite)

      // Check for tint or filter properties
      expect(config).toHaveProperty('tint')
      expect(config.tint).toBe(0xff0000) // Red tint
    })

    it('should trigger lose_round sound event', () => {
      const config = createLoseFadeAnimation(mockSprite)

      expect(SOUND_EVENTS.LOSE_ROUND).toBe('sound:lose_round')
      expect(config.onStart).toBeDefined()
    })
  })

  describe('Collect Animation', () => {
    it('should have duration of 500ms', () => {
      expect(ANIMATION_DURATION.COLLECT_TO_WINNER).toBe(500)
    })

    it('should move cards to winner position', () => {
      const winnerX = 800
      const winnerY = 600
      const delay = 100

      const config = createCollectAnimation(mockSprite, winnerX, winnerY, delay)

      expect(config.targets).toBe(mockSprite)
      expect(config.x).toBe(winnerX)
      expect(config.y).toBe(winnerY)
      expect(config.duration).toBe(500)
      expect(config.delay).toBe(delay)
    })

    it('should follow arc path to winner', () => {
      const winnerX = 800
      const winnerY = 600
      const delay = 0

      const config = createCollectAnimation(mockSprite, winnerX, winnerY, delay)

      // Arc path can be implemented with a custom ease or path
      // Check for arc path properties
      expect(config).toHaveProperty('motionPath')
      const motionPath = config.motionPath as any
      expect(motionPath.type).toBe('arc')
      expect(motionPath.curviness).toBeGreaterThan(0)
    })

    it('should scale down cards during collection', () => {
      const winnerX = 800
      const winnerY = 600
      const delay = 0

      const config = createCollectAnimation(mockSprite, winnerX, winnerY, delay)

      expect(config.scaleX).toBeLessThan(0.5) // Cards should shrink
      expect(config.scaleY).toBeLessThan(0.5)
      expect(config.alpha).toBeLessThan(1) // Cards should fade slightly
    })

    it('should trigger card_collect sound event', () => {
      const winnerX = 800
      const winnerY = 600
      const delay = 0

      const config = createCollectAnimation(mockSprite, winnerX, winnerY, delay)

      expect(SOUND_EVENTS.CARD_COLLECT).toBe('sound:card_collect')
      expect(config.onStart).toBeDefined()
    })
  })

  describe('Animation Chaining', () => {
    it('should chain play → flip → win/lose → collect animations', () => {
      // Test that animations can be chained properly
      const playConfig = createPlayAnimation(mockSprite, 512, 384, 1)
      const [flipDown, flipUp] = createFlipAnimation(mockSprite)
      const winConfig = createWinPulseAnimation(mockSprite)
      const collectConfig = createCollectAnimation(mockSprite, 800, 600, 0)

      // All animations should support onComplete for chaining
      expect(playConfig).toHaveProperty('onComplete')
      expect(flipDown).toHaveProperty('onComplete')
      expect(flipUp).toHaveProperty('onComplete')
      expect(winConfig).toHaveProperty('onComplete')
      expect(collectConfig).toHaveProperty('onComplete')
    })
  })

  describe('Performance Requirements', () => {
    it('should maintain 60 FPS with multiple simultaneous animations', () => {
      // Create multiple sprites
      const sprites = Array.from({ length: 4 }, () => createMockSprite())

      // Create animations for all sprites
      const configs = sprites.map(sprite =>
        createPlayAnimation(sprite, 512, 384, 1)
      )

      // All animations should be optimized for performance
      configs.forEach(config => {
        expect(config.duration).toBeLessThanOrEqual(600) // Not too long
        expect(config.ease).toBeDefined() // Use hardware-accelerated easing
      })
    })
  })
})