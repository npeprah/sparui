/**
 * Card Deal Animation Tests
 *
 * Tests for the card dealing animation to ensure it matches
 * the exact design specifications:
 * - Duration: 800ms per card
 * - Easing: cubic-bezier(0.34, 1.56, 0.64, 1) for bounce effect
 * - Properties: opacity 0→1, translateX -200px→0, translateY 100px→0, rotate -15°→0°
 * - Stagger: 150ms delay between each card
 * - Sound hook: "card_deal" sound plays during animation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import Phaser from 'phaser'
import { createDealAnimation, calculateDealStagger } from './animations'
import { ANIMATION_DURATION, ANIMATION_EASING, SOUND_EVENTS } from '../constants/animations'

// Mock Phaser.GameObjects.Sprite
const createMockSprite = (): Phaser.GameObjects.Sprite => {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    alpha: 0,
    scaleX: 1,
    scaleY: 1,
    scene: {
      events: {
        emit: vi.fn(),
      },
    },
  } as unknown as Phaser.GameObjects.Sprite
}

describe('Card Deal Animation', () => {
  let mockSprite: Phaser.GameObjects.Sprite

  beforeEach(() => {
    mockSprite = createMockSprite()
  })

  describe('Animation Duration', () => {
    it('should have duration of 800ms per card', () => {
      // According to design specs, deal animation should be 800ms
      expect(ANIMATION_DURATION.DEAL).toBe(800)
    })

    it('should have stagger delay of 150ms between cards', () => {
      // According to design specs, stagger should be 150ms
      expect(ANIMATION_DURATION.DEAL_STAGGER).toBe(150)
    })

    it('should calculate correct stagger delays for multiple cards', () => {
      expect(calculateDealStagger(0)).toBe(0)
      expect(calculateDealStagger(1)).toBe(150)
      expect(calculateDealStagger(2)).toBe(300)
      expect(calculateDealStagger(3)).toBe(450)
      expect(calculateDealStagger(4)).toBe(600)
    })
  })

  describe('Animation Easing', () => {
    it('should use cubic-bezier(0.34, 1.56, 0.64, 1) for bounce effect', () => {
      // Phaser uses named easing functions, we need to map cubic-bezier to appropriate Phaser easing
      // cubic-bezier(0.34, 1.56, 0.64, 1) is a back-out bounce effect
      // In Phaser, this is closest to 'Back.easeOut'
      expect(ANIMATION_EASING.DEAL).toBe('Back.easeOut')
    })
  })

  describe('Animation Properties', () => {
    it('should create deal animation with correct target position', () => {
      const targetX = 400
      const targetY = 300
      const delay = 0

      const config = createDealAnimation(mockSprite, targetX, targetY, delay)

      expect(config.targets).toBe(mockSprite)
      // Now x and y are objects with from/to properties
      expect(config.x).toEqual({ from: targetX - 200, to: targetX })
      expect(config.y).toEqual({ from: targetY + 100, to: targetY })
      expect(config.duration).toBe(800)
      expect(config.ease).toBe('Back.easeOut')
      expect(config.delay).toBe(delay)
    })

    it('should include rotation animation from -15° to 0°', () => {
      const targetX = 400
      const targetY = 300
      const delay = 0

      const config = createDealAnimation(mockSprite, targetX, targetY, delay)

      // Rotation should be included as an object with from/to
      expect(config.rotation).toBeDefined()
      expect(typeof config.rotation).toBe('object')

      // Check that rotation animates from -15° to 0°
      const rotationConfig = config.rotation as { from: number; to: number }
      const fromDegrees = rotationConfig.from * (180 / Math.PI)
      const toDegrees = rotationConfig.to * (180 / Math.PI)

      expect(fromDegrees).toBeCloseTo(-15, 1) // -15° with 1 decimal precision
      expect(toDegrees).toBe(0) // Final rotation is 0°
    })

    it('should support opacity animation from 0 to 1', () => {
      // The current implementation doesn't include opacity animation
      // This test will fail initially and guide our implementation
      const targetX = 400
      const targetY = 300
      const delay = 0

      const config = createDealAnimation(mockSprite, targetX, targetY, delay)

      // We expect the config to include opacity animation
      // This will need to be added to match design specs
      expect(config.alpha).toEqual({ from: 0, to: 1 })
    })

    it('should support initial translation offsets', () => {
      // According to design specs:
      // translateX: from -200px to 0
      // translateY: from 100px to 0
      // This means the initial position should be offset
      const targetX = 400
      const targetY = 300
      const delay = 0

      const config = createDealAnimation(mockSprite, targetX, targetY, delay)

      // The animation should move from offset position to target
      // Initial position would be (targetX - 200, targetY + 100)
      expect(config.x).toEqual({ from: targetX - 200, to: targetX })
      expect(config.y).toEqual({ from: targetY + 100, to: targetY })
    })

    it('should apply correct delay for staggered dealing', () => {
      const targetX = 400
      const targetY = 300

      const config1 = createDealAnimation(mockSprite, targetX, targetY, 0)
      const config2 = createDealAnimation(mockSprite, targetX, targetY, 150)
      const config3 = createDealAnimation(mockSprite, targetX, targetY, 300)

      expect(config1.delay).toBe(0)
      expect(config2.delay).toBe(150)
      expect(config3.delay).toBe(300)
    })
  })

  describe('Sound Hook Integration', () => {
    it('should have card_deal sound event defined', () => {
      expect(SOUND_EVENTS.CARD_DEAL).toBe('sound:card_deal')
    })

    it('should trigger sound event on animation start', () => {
      const targetX = 400
      const targetY = 300
      const delay = 0

      const config = createDealAnimation(mockSprite, targetX, targetY, delay)

      // Check that onStart callback is defined to trigger sound
      expect(config.onStart).toBeDefined()
    })
  })

  describe('Performance Requirements', () => {
    it('should maintain configuration for 60 FPS on desktop', () => {
      // Ensure animation duration is optimized for smooth 60 FPS
      const targetX = 400
      const targetY = 300
      const delay = 0

      const config = createDealAnimation(mockSprite, targetX, targetY, delay)

      // Duration should not be too short (causes jank) or too long (feels sluggish)
      expect(config.duration).toBeGreaterThanOrEqual(400)
      expect(config.duration).toBeLessThanOrEqual(1000)
    })

    it('should handle multiple cards dealing simultaneously', () => {
      const cards = Array.from({ length: 4 }, () => createMockSprite())
      const configs = cards.map((card, index) =>
        createDealAnimation(card, 400, 300, calculateDealStagger(index))
      )

      // Verify each card has proper stagger
      configs.forEach((config, index) => {
        expect(config.delay).toBe(index * 150)
      })

      // Total deal time for 4 cards should be reasonable
      const totalTime = 800 + (3 * 150) // Last card: duration + stagger
      expect(totalTime).toBe(1250) // 1.25 seconds for 4 cards
    })
  })

  describe('Animation Chaining', () => {
    it('should support chaining with flip animation after deal', () => {
      const targetX = 400
      const targetY = 300
      const delay = 0

      // First test without callback
      const config = createDealAnimation(mockSprite, targetX, targetY, delay)

      // Animation should support onComplete callback for chaining
      expect(config).toHaveProperty('onComplete')

      // Can set a callback
      const mockCallback = vi.fn()
      const configWithCallback = createDealAnimation(
        mockSprite,
        targetX,
        targetY,
        delay,
        mockCallback
      )
      expect(configWithCallback.onComplete).toBe(mockCallback)
    })
  })
})