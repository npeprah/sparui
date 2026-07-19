import { describe, it, expect, vi } from 'vitest'
import Phaser from 'phaser'
import {
  createDealAnimation,
  createFlipAnimation,
  createPlayAnimation,
  createWinPulseAnimation,
  createLoseFadeAnimation,
  createCollectAnimation,
  createHoverLiftAnimation,
  createHoverReturnAnimation,
  createGlowPulseAnimation,
  stopAllTweens,
  calculateDealStagger,
  calculateCollectStagger,
  hasTween,
  radiansToDegrees,
  degreesToRadians,
} from './animations'
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  ANIMATION_SCALE,
  ANIMATION_ALPHA,
} from '../constants/animations'

// Mock Phaser sprite
function createMockSprite(): Phaser.GameObjects.Sprite {
  return {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    alpha: 1,
  } as Phaser.GameObjects.Sprite
}

// Mock Phaser graphics
function createMockGraphics(): Phaser.GameObjects.Graphics {
  return {
    alpha: 1,
  } as Phaser.GameObjects.Graphics
}

// Mock Phaser scene
function createMockScene() {
  const tweens: Array<{ stop: () => void; remove: () => void }> = []

  return {
    tweens: {
      getTweensOf: vi.fn(() => tweens),
      createTimeline: vi.fn(() => ({
        add: vi.fn(),
        play: vi.fn(),
      })),
    },
  } as unknown as Phaser.Scene
}

describe('Animation Utilities', () => {
  describe('createDealAnimation()', () => {
    it('should return valid tween config for dealing', () => {
      const card = createMockSprite()
      const config = createDealAnimation(card, 100, 200, 0)

      expect(config.targets).toBe(card)
      // Deal uses Phaser from/to value syntax so the card slides in from an offset
      expect(config.x).toEqual({ from: 100 - 200, to: 100 })
      expect(config.y).toEqual({ from: 200 + 100, to: 200 })
      expect(config.duration).toBe(ANIMATION_DURATION.DEAL)
      expect(config.ease).toBe(ANIMATION_EASING.DEAL)
      expect(config.delay).toBe(0)
      expect(config.rotation).toBeDefined()
    })

    it('should include delay when provided', () => {
      const card = createMockSprite()
      const config = createDealAnimation(card, 100, 200, 300)

      expect(config.delay).toBe(300)
    })

    it('should have random rotation within range', () => {
      const card = createMockSprite()
      const rotations = new Set()

      for (let i = 0; i < 10; i++) {
        const config = createDealAnimation(card, 100, 200)
        rotations.add(config.rotation)
      }

      // Should have multiple different rotations
      expect(rotations.size).toBeGreaterThan(1)
    })
  })

  describe('createFlipAnimation()', () => {
    it('should return two-part animation configs', () => {
      const card = createMockSprite()
      const [scaleDown, scaleUp] = createFlipAnimation(card)

      expect(scaleDown).toBeDefined()
      expect(scaleUp).toBeDefined()
      expect(scaleDown.targets).toBe(card)
      expect(scaleUp.targets).toBe(card)
    })

    it('should scale down to midpoint in first half', () => {
      const card = createMockSprite()
      const [scaleDown] = createFlipAnimation(card)

      expect(scaleDown.scaleX).toBe(ANIMATION_SCALE.FLIP_MIDPOINT)
      expect(scaleDown.duration).toBe(ANIMATION_DURATION.FLIP_HALFWAY)
      expect(scaleDown.ease).toBe(ANIMATION_EASING.FLIP_SCALE_DOWN)
    })

    it('should scale up to original scale in second half', () => {
      const card = createMockSprite()
      card.scaleY = 0.8
      const [, scaleUp] = createFlipAnimation(card)

      expect(scaleUp.scaleX).toBe(0.8) // Matches scaleY
      expect(scaleUp.duration).toBe(ANIMATION_DURATION.FLIP_HALFWAY)
      expect(scaleUp.ease).toBe(ANIMATION_EASING.FLIP_SCALE_UP)
    })

    it('should call onMidpoint callback at transition', () => {
      const card = createMockSprite()
      const onMidpoint = vi.fn()
      const [scaleDown] = createFlipAnimation(card, onMidpoint)

      expect(scaleDown.onComplete).toBe(onMidpoint)
    })
  })

  describe('createPlayAnimation()', () => {
    it('should return valid tween config for playing card', () => {
      const card = createMockSprite()
      const config = createPlayAnimation(card, 150, 250, 0.7)

      expect(config.targets).toBe(card)
      expect(config.x).toBe(150)
      expect(config.y).toBe(250)
      // Play applies a squash keyframe effect (1 -> 0.9 -> targetScale)
      expect(config.scaleX).toEqual({ value: [1, 0.9, 0.7], duration: [133, 133, 134] })
      expect(config.scaleY).toEqual({ value: [1, 0.9, 0.7], duration: [133, 133, 134] })
      expect(config.duration).toBe(ANIMATION_DURATION.PLAY)
      expect(config.ease).toBe(ANIMATION_EASING.PLAY)
      expect(config.rotation).toBeDefined()
    })

    it('should have different rotation values', () => {
      const card = createMockSprite()
      const rotations = new Set()

      for (let i = 0; i < 10; i++) {
        const config = createPlayAnimation(card, 150, 250, 0.7)
        rotations.add(config.rotation)
      }

      expect(rotations.size).toBeGreaterThan(1)
    })
  })

  describe('createWinPulseAnimation()', () => {
    it('should return pulsing animation config', () => {
      const card = createMockSprite()
      const config = createWinPulseAnimation(card)

      expect(config.targets).toBe(card)
      expect(config.duration).toBe(ANIMATION_DURATION.WIN_PULSE)
      expect(config.ease).toBe(ANIMATION_EASING.WIN_PULSE)
      expect(config.yoyo).toBe(true)
      expect(config.repeat).toBe(2)
    })

    it('should scale between min and max values', () => {
      const card = createMockSprite()
      const config = createWinPulseAnimation(card)

      expect(config.scaleX).toBeDefined()
      expect(config.scaleY).toBeDefined()
      expect((config.scaleX as { from: number; to: number }).from).toBe(
        ANIMATION_SCALE.WIN_PULSE_MIN
      )
      expect((config.scaleX as { from: number; to: number }).to).toBe(ANIMATION_SCALE.WIN_PULSE_MAX)
    })
  })

  describe('createLoseFadeAnimation()', () => {
    it('should return fade and shrink animation config', () => {
      const card = createMockSprite()
      const config = createLoseFadeAnimation(card)

      expect(config.targets).toBe(card)
      expect(config.alpha).toBe(ANIMATION_ALPHA.LOSE_ALPHA)
      expect(config.scaleX).toBe(ANIMATION_SCALE.LOSE_SCALE)
      expect(config.scaleY).toBe(ANIMATION_SCALE.LOSE_SCALE)
      expect(config.duration).toBe(ANIMATION_DURATION.LOSE_FADE)
      expect(config.ease).toBe(ANIMATION_EASING.LOSE_FADE)
    })
  })

  describe('createCollectAnimation()', () => {
    it('should return collection animation config', () => {
      const card = createMockSprite()
      const config = createCollectAnimation(card, 300, 400, 0)

      expect(config.targets).toBe(card)
      expect(config.x).toBe(300)
      expect(config.y).toBe(400)
      expect(config.scaleX).toBe(0.3)
      expect(config.scaleY).toBe(0.3)
      expect(config.alpha).toBe(0.5)
      expect(config.duration).toBe(ANIMATION_DURATION.COLLECT_TO_WINNER)
      expect(config.ease).toBe(ANIMATION_EASING.COLLECT)
    })

    it('should include delay when provided', () => {
      const card = createMockSprite()
      const config = createCollectAnimation(card, 300, 400, 500)

      expect(config.delay).toBe(500)
    })
  })

  describe('createHoverLiftAnimation()', () => {
    it('should lift card up and scale', () => {
      const card = createMockSprite()
      card.scaleX = 0.8
      card.scaleY = 0.8
      const originalY = 100
      const config = createHoverLiftAnimation(card, originalY)

      expect(config.targets).toBe(card)
      expect(config.y).toBe(originalY + ANIMATION_SCALE.HOVER_LIFT_Y)
      expect(config.scaleX).toBe(0.8 * ANIMATION_SCALE.HOVER_SCALE)
      expect(config.scaleY).toBe(0.8 * ANIMATION_SCALE.HOVER_SCALE)
      expect(config.duration).toBe(ANIMATION_DURATION.HOVER_LIFT)
      expect(config.ease).toBe(ANIMATION_EASING.HOVER)
    })
  })

  describe('createHoverReturnAnimation()', () => {
    it('should return card to original position and scale', () => {
      const card = createMockSprite()
      const config = createHoverReturnAnimation(card, 100, 0.8, 0.8)

      expect(config.targets).toBe(card)
      expect(config.y).toBe(100)
      expect(config.scaleX).toBe(0.8)
      expect(config.scaleY).toBe(0.8)
      expect(config.duration).toBe(ANIMATION_DURATION.HOVER_LIFT)
      expect(config.ease).toBe(ANIMATION_EASING.HOVER)
    })
  })

  describe('createGlowPulseAnimation()', () => {
    it('should create pulsing glow animation', () => {
      const glow = createMockGraphics()
      const config = createGlowPulseAnimation(glow, 0.4, 1.0)

      expect(config.targets).toBe(glow)
      expect(config.alpha).toEqual({ from: 1.0, to: 0.4 })
      expect(config.duration).toBe(ANIMATION_DURATION.SELECTION_PULSE)
      expect(config.ease).toBe(ANIMATION_EASING.SELECTION)
      expect(config.yoyo).toBe(true)
      expect(config.repeat).toBe(-1) // Infinite
    })

    it('should use default alpha values if not provided', () => {
      const glow = createMockGraphics()
      const config = createGlowPulseAnimation(glow)

      expect(config.alpha).toEqual({ from: 1.0, to: 0.4 })
    })
  })

  describe('stopAllTweens()', () => {
    it('should stop and remove all tweens on target', () => {
      const scene = createMockScene()
      const card = createMockSprite()

      const mockTween1 = { stop: vi.fn(), remove: vi.fn() }
      const mockTween2 = { stop: vi.fn(), remove: vi.fn() }

      vi.mocked(scene.tweens.getTweensOf).mockReturnValue([mockTween1, mockTween2] as any)

      stopAllTweens(scene, card)

      expect(scene.tweens.getTweensOf).toHaveBeenCalledWith(card)
      expect(mockTween1.stop).toHaveBeenCalled()
      expect(mockTween1.remove).toHaveBeenCalled()
      expect(mockTween2.stop).toHaveBeenCalled()
      expect(mockTween2.remove).toHaveBeenCalled()
    })

    it('should handle no tweens gracefully', () => {
      const scene = createMockScene()
      const card = createMockSprite()

      vi.mocked(scene.tweens.getTweensOf).mockReturnValue([])

      expect(() => stopAllTweens(scene, card)).not.toThrow()
    })
  })

  describe('calculateDealStagger()', () => {
    it('should return correct stagger delays', () => {
      expect(calculateDealStagger(0)).toBe(0)
      expect(calculateDealStagger(1)).toBe(ANIMATION_DURATION.DEAL_STAGGER)
      expect(calculateDealStagger(2)).toBe(ANIMATION_DURATION.DEAL_STAGGER * 2)
      expect(calculateDealStagger(5)).toBe(ANIMATION_DURATION.DEAL_STAGGER * 5)
    })

    it('should handle negative indices', () => {
      expect(calculateDealStagger(-1)).toBe(-ANIMATION_DURATION.DEAL_STAGGER)
    })
  })

  describe('calculateCollectStagger()', () => {
    it('should return correct stagger delays', () => {
      expect(calculateCollectStagger(0)).toBe(0)
      expect(calculateCollectStagger(1)).toBe(100)
      expect(calculateCollectStagger(2)).toBe(200)
      expect(calculateCollectStagger(4)).toBe(400)
    })
  })

  describe('hasTween()', () => {
    it('should return true if target has tweens', () => {
      const scene = createMockScene()
      const card = createMockSprite()

      vi.mocked(scene.tweens.getTweensOf).mockReturnValue([{} as any])

      expect(hasTween(scene, card)).toBe(true)
    })

    it('should return false if target has no tweens', () => {
      const scene = createMockScene()
      const card = createMockSprite()

      vi.mocked(scene.tweens.getTweensOf).mockReturnValue([])

      expect(hasTween(scene, card)).toBe(false)
    })
  })

  describe('radiansToDegrees()', () => {
    it('should convert radians to degrees correctly', () => {
      expect(radiansToDegrees(0)).toBe(0)
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180, 5)
      expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 5)
      expect(radiansToDegrees(Math.PI * 2)).toBeCloseTo(360, 5)
    })
  })

  describe('degreesToRadians()', () => {
    it('should convert degrees to radians correctly', () => {
      expect(degreesToRadians(0)).toBe(0)
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 5)
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 5)
      expect(degreesToRadians(360)).toBeCloseTo(Math.PI * 2, 5)
    })
  })
})
