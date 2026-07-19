import { describe, it, expect, vi } from 'vitest'
import {
  createCardDealAnimation,
  createCardPlayAnimation,
  createSuitSymbolPulseAnimation,
  createHoverFloatAnimation,
  createHoverExitAnimation,
  createFireStateAnimation,
  createFrozenStateAnimation,
  applyDisabledState,
  removeDisabledState,
  createDealSequence,
  calculateCardDealStagger,
  getTargetFramerate,
  optimizeForFramerate,
  createGlowEffect,
  updateGlowPosition,
} from './cardAnimations'

// Mock Phaser Math utilities
const PhaserMath = {
  DegToRad: (degrees: number) => degrees * (Math.PI / 180),
  RadToDeg: (radians: number) => radians * (180 / Math.PI),
}

// Mock Phaser sprite
function createMockSprite(): Phaser.GameObjects.Sprite {
  return {
    x: 100,
    y: 200,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    alpha: 1,
    skewY: 0,
    displayWidth: 100,
    displayHeight: 150,
    depth: 1,
    setAlpha: vi.fn(function (alpha: number) {
      this.alpha = alpha
      return this
    }),
    setTint: vi.fn(function () {
      return this
    }),
    clearTint: vi.fn(function () {
      return this
    }),
    disableInteractive: vi.fn(function () {
      return this
    }),
    setInteractive: vi.fn(function () {
      return this
    }),
    input: {},
  } as unknown as Phaser.GameObjects.Sprite
}

// Mock Phaser graphics
function createMockGraphics(): Phaser.GameObjects.Graphics {
  return {
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
    lineStyle: vi.fn(),
    strokeRoundedRect: vi.fn(),
    setDepth: vi.fn(),
    clear: vi.fn(),
  } as unknown as Phaser.GameObjects.Graphics
}

// Mock Phaser scene
function createMockScene() {
  return {
    add: {
      graphics: vi.fn(() => createMockGraphics()),
    },
    tweens: {
      add: vi.fn(),
    },
  } as unknown as Phaser.Scene
}

describe('Card Animation Utilities', () => {
  describe('createCardDealAnimation()', () => {
    it('should create deal animation with exact specifications', () => {
      const card = createMockSprite()
      const targetX = 300
      const targetY = 400
      const config = createCardDealAnimation(card, targetX, targetY, 0)

      expect(config.targets).toBe(card)
      expect(config.duration).toBe(800) // Exact duration from spec
      expect(config.ease).toBe('Back.easeOut') // Bounce effect
      expect(config.delay).toBe(0)

      // Check animation properties
      const xAnim = config.x as { from: number; to: number }
      const yAnim = config.y as { from: number; to: number }
      const rotationAnim = config.rotation as { from: number; to: number }
      const alphaAnim = config.alpha as { from: number; to: number }

      expect(xAnim.from).toBe(targetX - 200) // translateX: from -200
      expect(xAnim.to).toBe(targetX)
      expect(yAnim.from).toBe(targetY + 100) // translateY: from 100
      expect(yAnim.to).toBe(targetY)
      expect(rotationAnim.from).toBeCloseTo(PhaserMath.DegToRad(-15)) // -15 degrees
      expect(rotationAnim.to).toBe(0)
      expect(alphaAnim.from).toBe(0) // opacity: from 0
      expect(alphaAnim.to).toBe(1)
    })

    it('should apply correct stagger delay (150ms per card)', () => {
      const card = createMockSprite()
      const config1 = createCardDealAnimation(card, 300, 400, 0)
      const config2 = createCardDealAnimation(card, 300, 400, 1)
      const config3 = createCardDealAnimation(card, 300, 400, 2)

      expect(config1.delay).toBe(0)
      expect(config2.delay).toBe(150) // 150ms stagger
      expect(config3.delay).toBe(300) // 300ms stagger
    })
  })

  describe('createCardPlayAnimation()', () => {
    it('should create play animation with exact specifications', () => {
      const card = createMockSprite()
      const tableCenterX = 400
      const tableCenterY = 300
      const config = createCardPlayAnimation(card, tableCenterX, tableCenterY)

      expect(config.targets).toBe(card)
      expect(config.x).toBe(tableCenterX)
      expect(config.y).toBe(tableCenterY)
      expect(config.duration).toBe(400) // Exact duration from spec
      expect(config.ease).toBe('Cubic.easeOut')

      // Check rotation is within specified range (-5 to 5 degrees)
      const rotationDegrees = PhaserMath.RadToDeg(config.rotation as number)
      expect(rotationDegrees).toBeGreaterThanOrEqual(-5)
      expect(rotationDegrees).toBeLessThanOrEqual(5)

      // Check squash effect
      const scaleXAnim = config.scaleX as Array<{ value: number; duration: number }>
      expect(scaleXAnim[0]).toEqual({ value: 1, duration: 0 })
      expect(scaleXAnim[1]).toEqual({ value: 0.9, duration: 100 }) // Squash
      expect(scaleXAnim[2]).toEqual({ value: 1, duration: 300 }) // Return
    })

    it('should generate different random rotations', () => {
      const card = createMockSprite()
      const rotations = new Set<number>()

      for (let i = 0; i < 10; i++) {
        const config = createCardPlayAnimation(card, 400, 300)
        rotations.add(config.rotation as number)
      }

      // Should have multiple different rotations
      expect(rotations.size).toBeGreaterThan(1)
    })
  })

  describe('createSuitSymbolPulseAnimation()', () => {
    it('should create continuous pulse animation', () => {
      const symbol = createMockSprite()
      const config = createSuitSymbolPulseAnimation(symbol)

      expect(config.targets).toBe(symbol)
      expect(config.duration).toBe(2000) // 2s cycle as specified
      expect(config.ease).toBe('Sine.easeInOut')
      expect(config.repeat).toBe(-1) // Infinite loop

      // Check scale animation
      const scaleXAnim = config.scaleX as Array<{ value: number; duration: number }>
      expect(scaleXAnim[0]).toEqual({ value: 1, duration: 0 })
      expect(scaleXAnim[1]).toEqual({ value: 1.05, duration: 1000 })
      expect(scaleXAnim[2]).toEqual({ value: 1, duration: 1000 })
    })
  })

  describe('createHoverFloatAnimation()', () => {
    it('should create hover animation with exact specifications', () => {
      const card = createMockSprite()
      const originalY = 500
      const config = createHoverFloatAnimation(card, originalY)

      expect(config.targets).toBe(card)
      expect(config.y).toBe(originalY - 30) // translateY: -30px as specified
      expect(config.scaleX).toBe(1.05) // scale: 1.05 as specified
      expect(config.scaleY).toBe(1.05)
      expect(config.skewY).toBe(0.05) // Simulated 3D tilt
      expect(config.duration).toBe(600) // Exact duration from spec
      expect(config.ease).toBe('Cubic.easeOut')
    })

    it('should respect original scale', () => {
      const card = createMockSprite()
      const originalScale = 0.8
      const config = createHoverFloatAnimation(card, 500, originalScale)

      expect(config.scaleX).toBe(originalScale * 1.05)
      expect(config.scaleY).toBe(originalScale * 1.05)
    })
  })

  describe('createHoverExitAnimation()', () => {
    it('should return card to original state', () => {
      const card = createMockSprite()
      const originalY = 500
      const originalScale = 0.8
      const config = createHoverExitAnimation(card, originalY, originalScale)

      expect(config.targets).toBe(card)
      expect(config.y).toBe(originalY)
      expect(config.scaleX).toBe(originalScale)
      expect(config.scaleY).toBe(originalScale)
      expect(config.skewY).toBe(0) // Reset tilt
      expect(config.duration).toBe(600)
      expect(config.ease).toBe('Cubic.easeOut')
    })
  })

  describe('createFireStateAnimation()', () => {
    it('should create pulsing fire effect', () => {
      const glow = createMockGraphics()
      const config = createFireStateAnimation(glow)

      expect(config.targets).toBe(glow)
      expect(config.duration).toBe(1000) // 1s cycle as specified
      expect(config.ease).toBe('Sine.easeInOut')
      expect(config.repeat).toBe(-1) // Infinite loop

      // Check alpha animation
      const alphaAnim = config.alpha as Array<{ value: number; duration: number }>
      expect(alphaAnim[0]).toEqual({ value: 0.6, duration: 500 })
      expect(alphaAnim[1]).toEqual({ value: 1, duration: 500 })
    })
  })

  describe('createFrozenStateAnimation()', () => {
    it('should create ice blue pulsing effect', () => {
      const glow = createMockGraphics()
      const config = createFrozenStateAnimation(glow)

      expect(config.targets).toBe(glow)
      expect(config.duration).toBe(2000) // 2s cycle
      expect(config.ease).toBe('Sine.easeInOut')
      expect(config.repeat).toBe(-1) // Infinite loop

      // Check alpha animation
      const alphaAnim = config.alpha as Array<{ value: number; duration: number }>
      expect(alphaAnim[0]).toEqual({ value: 0.8, duration: 1000 })
      expect(alphaAnim[1]).toEqual({ value: 0.4, duration: 1000 })
    })
  })

  describe('applyDisabledState()', () => {
    it('should set card to disabled appearance', () => {
      const card = createMockSprite()
      applyDisabledState(card)

      expect(card.setAlpha).toHaveBeenCalledWith(0.5) // opacity: 0.5 as specified
      expect(card.setTint).toHaveBeenCalledWith(0x808080) // Grayscale
      expect(card.disableInteractive).toHaveBeenCalled() // No interaction
    })
  })

  describe('removeDisabledState()', () => {
    it('should restore card to normal', () => {
      const card = createMockSprite()
      removeDisabledState(card)

      expect(card.setAlpha).toHaveBeenCalledWith(1)
      expect(card.clearTint).toHaveBeenCalled()
      expect(card.setInteractive).toHaveBeenCalled()
    })
  })

  describe('createDealSequence()', () => {
    it('should orchestrate multiple card deals with stagger', () => {
      const scene = createMockScene()
      const cards = [
        { sprite: createMockSprite(), targetX: 100, targetY: 200 },
        { sprite: createMockSprite(), targetX: 150, targetY: 200 },
        { sprite: createMockSprite(), targetX: 200, targetY: 200 },
      ]

      const onComplete = vi.fn()
      createDealSequence(scene, cards, onComplete)

      expect(scene.tweens.add).toHaveBeenCalledTimes(3)

      // Check stagger delays
      const firstCall = vi.mocked(scene.tweens.add).mock.calls[0][0]
      const secondCall = vi.mocked(scene.tweens.add).mock.calls[1][0]
      const thirdCall = vi.mocked(scene.tweens.add).mock.calls[2][0]

      expect(firstCall.delay).toBe(0)
      expect(secondCall.delay).toBe(150) // 150ms stagger
      expect(thirdCall.delay).toBe(300) // 300ms stagger

      // Only last card should have onComplete
      expect(firstCall.onComplete).toBeUndefined()
      expect(secondCall.onComplete).toBeUndefined()
      expect(thirdCall.onComplete).toBe(onComplete)
    })
  })

  describe('calculateCardDealStagger()', () => {
    it('should return exact 150ms stagger per card', () => {
      expect(calculateCardDealStagger(0)).toBe(0)
      expect(calculateCardDealStagger(1)).toBe(150)
      expect(calculateCardDealStagger(2)).toBe(300)
      expect(calculateCardDealStagger(5)).toBe(750)
    })
  })

  describe('getTargetFramerate()', () => {
    it('should return 60 FPS for desktop', () => {
      // Mock desktop user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      })

      expect(getTargetFramerate()).toBe(60)
    })

    it('should return 40 FPS for mobile', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      })

      expect(getTargetFramerate()).toBe(40)
    })
  })

  describe('optimizeForFramerate()', () => {
    it('should not modify config for 60 FPS', () => {
      const config = { targets: {}, duration: 1000 } as any
      const optimized = optimizeForFramerate(config, 60)

      expect(optimized.duration).toBe(1000)
    })

    it('should increase duration for 40 FPS (mobile)', () => {
      const config = { targets: {}, duration: 1000 } as any
      const optimized = optimizeForFramerate(config, 40)

      expect(optimized.duration).toBe(1100) // 10% increase for smoother mobile
    })
  })

  describe('createGlowEffect()', () => {
    it('should create hover glow with gold color', () => {
      const scene = createMockScene()
      const card = createMockSprite()
      const graphics = createGlowEffect(scene, card, 'hover')

      expect(scene.add.graphics).toHaveBeenCalled()
      expect(graphics.lineStyle).toHaveBeenCalledWith(4, 0xffd700, 0.8) // Gold
      expect(graphics.strokeRoundedRect).toHaveBeenCalled()
      expect(graphics.setDepth).toHaveBeenCalledWith(0) // card.depth - 1
    })

    it('should create fire glow with red color', () => {
      const scene = createMockScene()
      const card = createMockSprite()
      const graphics = createGlowEffect(scene, card, 'fire')

      expect(graphics.lineStyle).toHaveBeenCalledWith(5, 0xff4500, 0.8) // Fire red
    })

    it('should create frozen glow with ice blue color', () => {
      const scene = createMockScene()
      const card = createMockSprite()
      const graphics = createGlowEffect(scene, card, 'frozen')

      expect(graphics.lineStyle).toHaveBeenCalledWith(5, 0x00bfff, 0.8) // Ice blue
    })
  })

  describe('updateGlowPosition()', () => {
    it('should update glow to match card position', () => {
      const graphics = createMockGraphics()
      const card = createMockSprite()
      card.x = 250
      card.y = 350

      updateGlowPosition(graphics, card)

      expect(graphics.clear).toHaveBeenCalled()
      expect(graphics.lineStyle).toHaveBeenCalledWith(4, 0xffd700, 0.8)
      expect(graphics.strokeRoundedRect).toHaveBeenCalled()

      // Check position calculation
      const strokeCall = vi.mocked(graphics.strokeRoundedRect).mock.calls[0]
      expect(strokeCall[0]).toBe(250 - 50 - 4) // card.x - displayWidth/2 - padding
      expect(strokeCall[1]).toBe(350 - 75 - 4) // card.y - displayHeight/2 - padding
    })
  })
})
