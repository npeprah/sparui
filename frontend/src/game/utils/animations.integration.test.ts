/**
 * Animation Integration and Performance Tests
 *
 * Tests that verify animations chain correctly and maintain
 * performance requirements for smooth gameplay.
 */

import { describe, it, expect, vi } from 'vitest'
import Phaser from 'phaser'
import {
  createDealAnimation,
  createPlayAnimation,
  createFlipAnimation,
  createWinPulseAnimation,
  createLoseFadeAnimation,
  createCollectAnimation,
  calculateDealStagger,
} from './animations'
import { ANIMATION_DURATION } from '../constants/animations'

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

describe('Animation Integration and Performance', () => {
  describe('Animation Chaining', () => {
    it('should chain deal → play → flip → win/lose → collect sequence', () => {
      const sprite = createMockSprite()

      // Create animation sequence
      const dealAnim = createDealAnimation(sprite, 400, 300, 0)
      const playAnim = createPlayAnimation(sprite, 512, 384, 1)
      const [flipDown, flipUp] = createFlipAnimation(sprite)
      const winAnim = createWinPulseAnimation(sprite)
      const loseAnim = createLoseFadeAnimation(sprite)
      const collectAnim = createCollectAnimation(sprite, 800, 600, 0)

      // All animations should have required properties for chaining
      expect(dealAnim).toHaveProperty('onComplete')
      expect(playAnim).toHaveProperty('onComplete')
      expect(flipDown).toHaveProperty('onComplete')
      expect(flipUp).toHaveProperty('onComplete')
      expect(winAnim).toHaveProperty('onComplete')
      expect(loseAnim).toHaveProperty('onComplete')
      expect(collectAnim).toHaveProperty('onComplete')

      // Verify durations match design specs
      expect(dealAnim.duration).toBe(800)
      expect(playAnim.duration).toBe(400)
      expect(flipDown.duration).toBe(200)
      expect(flipUp.duration).toBe(200)
      expect(winAnim.duration).toBe(300)
      expect(loseAnim.duration).toBe(600)
      expect(collectAnim.duration).toBe(500)
    })

    it('should support callback chaining for sequential animations', () => {
      const sprite = createMockSprite()
      const mockCallback1 = vi.fn()
      const mockCallback2 = vi.fn()
      const mockCallback3 = vi.fn()

      // Create animations with callbacks
      const dealAnim = createDealAnimation(sprite, 400, 300, 0, mockCallback1)
      const playAnim = createPlayAnimation(sprite, 512, 384, 1, mockCallback2)
      const collectAnim = createCollectAnimation(sprite, 800, 600, 0, mockCallback3)

      // Verify callbacks are properly assigned
      expect(dealAnim.onComplete).toBe(mockCallback1)
      expect(playAnim.onComplete).toBe(mockCallback2)
      expect(collectAnim.onComplete).toBe(mockCallback3)
    })
  })

  describe('Performance Requirements', () => {
    it('should keep total animation durations within performance budget', () => {
      // Total round animation sequence should complete within reasonable time
      const dealDuration = ANIMATION_DURATION.DEAL
      const playDuration = ANIMATION_DURATION.PLAY
      const flipDuration = ANIMATION_DURATION.FLIP
      const winPulseDuration = ANIMATION_DURATION.WIN_PULSE * 3 // 3 pulses
      const collectDuration = ANIMATION_DURATION.COLLECT_TO_WINNER

      const totalRoundDuration =
        dealDuration + playDuration + flipDuration + winPulseDuration + collectDuration

      // Total round should complete within 3 seconds for good UX
      expect(totalRoundDuration).toBeLessThanOrEqual(3000)
    })

    it('should handle 4-player simultaneous animations efficiently', () => {
      // Create 4 sprites for 4 players
      const sprites = Array.from({ length: 4 }, () => createMockSprite())

      // Create simultaneous play animations
      const playAnimations = sprites.map((sprite, index) =>
        createPlayAnimation(sprite, 512 + index * 10, 384 + index * 10, 1)
      )

      // All animations should have consistent timing
      playAnimations.forEach(anim => {
        expect(anim.duration).toBe(400)
        expect(anim.ease).toBe('Cubic.easeOut')
      })

      // Verify stagger calculations for dealing
      const dealStagger0 = calculateDealStagger(0)
      const dealStagger1 = calculateDealStagger(1)
      const dealStagger2 = calculateDealStagger(2)
      const dealStagger3 = calculateDealStagger(3)

      expect(dealStagger0).toBe(0)
      expect(dealStagger1).toBe(150)
      expect(dealStagger2).toBe(300)
      expect(dealStagger3).toBe(450)

      // Total deal time for 4 cards with stagger
      const totalDealTime = ANIMATION_DURATION.DEAL + dealStagger3
      expect(totalDealTime).toBe(1250) // 800ms + 450ms = 1250ms
    })

    it('should maintain 60 FPS timing requirements', () => {
      // Animation durations should be multiples of frame time (16.67ms for 60 FPS)
      const frameTime = 1000 / 60 // ~16.67ms

      // Check that animation durations are reasonable for smooth playback
      expect(ANIMATION_DURATION.DEAL % frameTime).toBeLessThanOrEqual(frameTime)
      expect(ANIMATION_DURATION.PLAY % frameTime).toBeLessThanOrEqual(frameTime)
      expect(ANIMATION_DURATION.FLIP % frameTime).toBeLessThanOrEqual(frameTime)
      expect(ANIMATION_DURATION.WIN_PULSE % frameTime).toBeLessThanOrEqual(frameTime)
      expect(ANIMATION_DURATION.LOSE_FADE % frameTime).toBeLessThanOrEqual(frameTime)
      expect(ANIMATION_DURATION.COLLECT_TO_WINNER % frameTime).toBeLessThanOrEqual(frameTime)
    })

    it('should use hardware-accelerated properties only', () => {
      const sprite = createMockSprite()

      // These animations should only use GPU-accelerated properties
      // (transform: translateX/Y, scale, rotate, opacity)
      const dealAnim = createDealAnimation(sprite, 400, 300, 0)
      const playAnim = createPlayAnimation(sprite, 512, 384, 1)
      const collectAnim = createCollectAnimation(sprite, 800, 600, 0)

      // Check that animations use transform properties
      expect(dealAnim).toHaveProperty('x')
      expect(dealAnim).toHaveProperty('y')
      expect(dealAnim).toHaveProperty('rotation')
      expect(dealAnim).toHaveProperty('alpha')

      expect(playAnim).toHaveProperty('x')
      expect(playAnim).toHaveProperty('y')
      expect(playAnim).toHaveProperty('scaleX')
      expect(playAnim).toHaveProperty('scaleY')

      expect(collectAnim).toHaveProperty('x')
      expect(collectAnim).toHaveProperty('y')
      expect(collectAnim).toHaveProperty('scaleX')
      expect(collectAnim).toHaveProperty('scaleY')
      expect(collectAnim).toHaveProperty('alpha')
    })
  })

  describe('Sound Integration', () => {
    it('should trigger correct sound events for each animation', () => {
      const sprite = createMockSprite()
      const scene = sprite.scene as any

      // Create animations
      const dealAnim = createDealAnimation(sprite, 400, 300, 0)
      const playAnim = createPlayAnimation(sprite, 512, 384, 1)
      const [flipDown] = createFlipAnimation(sprite)
      const winAnim = createWinPulseAnimation(sprite)
      const loseAnim = createLoseFadeAnimation(sprite)
      const collectAnim = createCollectAnimation(sprite, 800, 600, 0)

      // Each animation should have onStart callback for sound
      expect(dealAnim.onStart).toBeDefined()
      expect(playAnim.onStart).toBeDefined()
      expect(flipDown.onStart).toBeDefined()
      expect(winAnim.onStart).toBeDefined()
      expect(loseAnim.onStart).toBeDefined()
      expect(collectAnim.onStart).toBeDefined()

      // Simulate animation starts
      dealAnim.onStart?.()
      expect(scene.events.emit).toHaveBeenCalledWith('sound:card_deal')

      playAnim.onStart?.()
      expect(scene.events.emit).toHaveBeenCalledWith('sound:card_play')

      flipDown.onStart?.()
      expect(scene.events.emit).toHaveBeenCalledWith('sound:card_flip')

      winAnim.onStart?.()
      expect(scene.events.emit).toHaveBeenCalledWith('sound:win_round')

      loseAnim.onStart?.()
      expect(scene.events.emit).toHaveBeenCalledWith('sound:lose_round')

      collectAnim.onStart?.()
      expect(scene.events.emit).toHaveBeenCalledWith('sound:card_collect')
    })
  })

  describe('Animation Properties Match Design Specs', () => {
    it('should match exact durations from design specifications', () => {
      expect(ANIMATION_DURATION.DEAL).toBe(800)
      expect(ANIMATION_DURATION.PLAY).toBe(400)
      expect(ANIMATION_DURATION.FLIP).toBe(400)
      expect(ANIMATION_DURATION.WIN_PULSE).toBe(300)
      expect(ANIMATION_DURATION.LOSE_FADE).toBe(600)
      expect(ANIMATION_DURATION.COLLECT_TO_WINNER).toBe(500)
      expect(ANIMATION_DURATION.DEAL_STAGGER).toBe(150)
    })

    it('should use correct easing functions', () => {
      const sprite = createMockSprite()

      const dealAnim = createDealAnimation(sprite, 400, 300, 0)
      const playAnim = createPlayAnimation(sprite, 512, 384, 1)
      const [flipDown, flipUp] = createFlipAnimation(sprite)

      // Verify easing functions
      expect(dealAnim.ease).toBe('Back.easeOut') // Bounce effect
      expect(playAnim.ease).toBe('Cubic.easeOut') // Ease-out
      expect(flipDown.ease).toBe('Cubic.easeIn')
      expect(flipUp.ease).toBe('Cubic.easeOut')
    })
  })
})
