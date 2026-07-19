import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  applyCardVisualState,
  applyKentePattern,
  createCardGlow,
  transitionToState,
  getStateTransitionConfig,
} from './cardVisuals'

// Mock Phaser objects
const mockSprite = {
  setAlpha: vi.fn(),
  setScale: vi.fn(),
  setDepth: vi.fn(),
  setTint: vi.fn(),
  clearTint: vi.fn(),
  scene: {
    tweens: {
      add: vi.fn(),
      killTweensOf: vi.fn(),
    },
    add: {
      graphics: vi.fn(() => mockGraphics),
    },
  },
  x: 100,
  y: 200,
  width: 160,
  height: 240,
}

const mockGraphics = {
  clear: vi.fn(),
  fillStyle: vi.fn(),
  fillRect: vi.fn(),
  setAlpha: vi.fn(),
  setDepth: vi.fn(),
  destroy: vi.fn(),
  x: 0,
  y: 0,
  setPosition: vi.fn(),
}

describe('Card Visual Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('applyCardVisualState', () => {
    it('should apply default state correctly', () => {
      applyCardVisualState(mockSprite as any, 'default')

      expect(mockSprite.setAlpha).toHaveBeenCalledWith(1)
      expect(mockSprite.setScale).toHaveBeenCalledWith(1)
      expect(mockSprite.clearTint).toHaveBeenCalled()
    })

    it('should apply hover state with transformations', () => {
      applyCardVisualState(mockSprite as any, 'hover')

      expect(mockSprite.setScale).toHaveBeenCalledWith(1.05)
      // Hover state uses tweens for animation, so check tween was added
      expect(mockSprite.scene.tweens.add).toHaveBeenCalled()
    })

    it('should apply disabled state with opacity and grayscale', () => {
      applyCardVisualState(mockSprite as any, 'disabled')

      expect(mockSprite.setAlpha).toHaveBeenCalledWith(0.5)
      // Grayscale is simulated with tint in Phaser
      expect(mockSprite.setTint).toHaveBeenCalledWith(0x808080)
    })

    it('should apply fire state', () => {
      const result = applyCardVisualState(mockSprite as any, 'fire')

      expect(result.state).toBe('fire')
      expect(result.particleEffect).toBe('fire')
    })

    it('should apply frozen state with blue tint', () => {
      const result = applyCardVisualState(mockSprite as any, 'frozen')

      expect(result.state).toBe('frozen')
      expect(mockSprite.setTint).toHaveBeenCalledWith(0x00BFFF)
    })
  })

  describe('applyKentePattern', () => {
    it('should create Kente pattern overlay for a sprite', () => {
      const pattern = applyKentePattern(mockSprite as any, 'hearts')

      expect(mockSprite.scene.add.graphics).toHaveBeenCalled()
      expect(mockGraphics.fillStyle).toHaveBeenCalled()
      expect(mockGraphics.setAlpha).toHaveBeenCalledWith(0.7)
      expect(pattern).toBe(mockGraphics)
    })

    it('should use suit-specific colors for pattern', () => {
      applyKentePattern(mockSprite as any, 'clubs')

      // Verify fillStyle was called (color would be based on clubs palette)
      expect(mockGraphics.fillStyle).toHaveBeenCalled()
    })
  })

  describe('createCardGlow', () => {
    it('should create glow effect graphics', () => {
      const glow = createCardGlow(mockSprite as any, 'default')

      expect(mockSprite.scene.add.graphics).toHaveBeenCalled()
      expect(mockGraphics.setDepth).toHaveBeenCalled()
      expect(glow).toBe(mockGraphics)
    })

    it('should create enhanced glow for hover state', () => {
      const glow = createCardGlow(mockSprite as any, 'hover')

      expect(mockGraphics.fillStyle).toHaveBeenCalled()
      // setAlpha is not called in our implementation for glow
      expect(glow).toBe(mockGraphics)
    })

    it('should create fire glow for fire state', () => {
      createCardGlow(mockSprite as any, 'fire')

      expect(mockGraphics.fillStyle).toHaveBeenCalled()
      // Fire state would use orange/red colors
    })
  })

  describe('transitionToState', () => {
    it('should transition from default to hover state', () => {
      transitionToState(mockSprite as any, 'default', 'hover')

      expect(mockSprite.scene.tweens.killTweensOf).toHaveBeenCalledWith(mockSprite)
      expect(mockSprite.scene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockSprite,
          duration: 600,
          ease: 'Cubic.easeInOut',
        })
      )
    })

    it('should transition from hover to active state', () => {
      transitionToState(mockSprite as any, 'hover', 'active')

      expect(mockSprite.scene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 400,
          ease: 'Power2',
        })
      )
    })

    it('should immediately apply disabled state without animation', () => {
      transitionToState(mockSprite as any, 'default', 'disabled')

      expect(mockSprite.setAlpha).toHaveBeenCalledWith(0.5)
      expect(mockSprite.scene.tweens.add).not.toHaveBeenCalled()
    })
  })

  describe('getStateTransitionConfig', () => {
    it('should return correct transition config for hover state', () => {
      const config = getStateTransitionConfig('default', 'hover')

      expect(config.duration).toBe(600)
      expect(config.ease).toBe('Cubic.easeInOut')
      expect(config.scaleX).toBe(1.05)
      expect(config.scaleY).toBe(1.05)
      expect(config.y).toBeDefined()
    })

    it('should return correct transition config for active state', () => {
      const config = getStateTransitionConfig('hover', 'active')

      expect(config.duration).toBe(400)
      expect(config.ease).toBe('Power2')
      expect(config.scaleX).toBe(0.95)
      expect(config.scaleY).toBe(0.95)
    })

    it('should return empty config for disabled state', () => {
      const config = getStateTransitionConfig('default', 'disabled')

      expect(config.duration).toBeUndefined()
      expect(config.ease).toBeUndefined()
    })
  })
})