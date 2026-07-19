import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardSprite } from './CardSprite'
import * as cardVisuals from '../utils/cardVisuals'

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    GameObjects: {
      Sprite: vi.fn().mockImplementation(function (scene, x, y, texture) {
        this.scene = scene
        this.x = x
        this.y = y
        this.texture = texture
        this.setOrigin = vi.fn().mockReturnThis()
        this.setInteractive = vi.fn().mockReturnThis()
        this.setScale = vi.fn().mockReturnThis()
        this.setAlpha = vi.fn().mockReturnThis()
        this.setTint = vi.fn().mockReturnThis()
        this.clearTint = vi.fn().mockReturnThis()
        this.on = vi.fn().mockReturnThis()
        this.off = vi.fn().mockReturnThis()
        this.removeAllListeners = vi.fn().mockReturnThis()
        this.width = 160
        this.height = 240
        this.depth = 1
        this.setDepth = vi.fn().mockReturnThis()
        this.visible = true
        this.active = true
        return this
      }),
    },
  },
}))

// Mock card visuals utilities
vi.mock('../utils/cardVisuals', () => ({
  applyCardVisualState: vi.fn().mockReturnValue({ state: 'default' }),
  transitionToState: vi.fn(),
  createCardGlow: vi.fn(),
  applyKentePattern: vi.fn(),
}))

const mockScene = {
  add: {
    existing: vi.fn(),
    graphics: vi.fn(),
  },
  tweens: {
    add: vi.fn(),
    killTweensOf: vi.fn(),
  },
  textures: {
    exists: vi.fn().mockReturnValue(true),
  },
}

describe('CardSprite Visual States', () => {
  let cardSprite: CardSprite

  beforeEach(() => {
    vi.clearAllMocks()
    cardSprite = new CardSprite(mockScene as any, 100, 200, 'hearts', '7', 'player1')
  })

  describe('setState', () => {
    it('should apply default state on initialization', () => {
      expect(cardVisuals.applyCardVisualState).toHaveBeenCalledWith(
        expect.objectContaining({
          scene: mockScene,
          x: 100,
          y: 200,
        }),
        'default'
      )
    })

    it('should transition to hover state', () => {
      // Make card playable first
      cardSprite.setPlayable(true)
      vi.clearAllMocks()

      cardSprite.setState('hover')

      expect(cardVisuals.transitionToState).toHaveBeenCalledWith(
        expect.objectContaining({
          scene: mockScene,
        }),
        'default',
        'hover'
      )
    })

    it('should transition to active state', () => {
      // Make card playable first
      cardSprite.setPlayable(true)
      vi.clearAllMocks()

      cardSprite.setState('active')

      expect(cardVisuals.transitionToState).toHaveBeenCalledWith(
        expect.objectContaining({
          scene: mockScene,
        }),
        'default',
        'active'
      )
    })

    it('should apply disabled state', () => {
      cardSprite.setState('disabled')

      expect(cardVisuals.transitionToState).toHaveBeenCalledWith(
        expect.objectContaining({
          scene: mockScene,
        }),
        'default',
        'disabled'
      )
    })

    it('should apply fire state', () => {
      cardSprite.setState('fire')

      expect(cardVisuals.transitionToState).toHaveBeenCalledWith(
        expect.objectContaining({
          scene: mockScene,
        }),
        'default',
        'fire'
      )
    })

    it('should apply frozen state', () => {
      cardSprite.setState('frozen')

      expect(cardVisuals.transitionToState).toHaveBeenCalledWith(
        expect.objectContaining({
          scene: mockScene,
        }),
        'default',
        'frozen'
      )
    })
  })

  describe('Visual state tracking', () => {
    it('should track current visual state', () => {
      expect(cardSprite.getVisualState()).toBe('default')

      // Make card playable to allow hover/active states
      cardSprite.setPlayable(true)

      cardSprite.setState('hover')
      expect(cardSprite.getVisualState()).toBe('hover')

      cardSprite.setState('active')
      expect(cardSprite.getVisualState()).toBe('active')
    })

    it('should not transition if already in target state', () => {
      // Make card playable first
      cardSprite.setPlayable(true)
      vi.clearAllMocks()

      cardSprite.setState('hover')
      vi.clearAllMocks()

      cardSprite.setState('hover')
      expect(cardVisuals.transitionToState).not.toHaveBeenCalled()
    })
  })

  describe('Playable state interaction', () => {
    it('should apply hover state only when playable', () => {
      cardSprite.setPlayable(false)
      cardSprite.setState('hover')

      // Should not apply hover when not playable
      expect(cardSprite.getVisualState()).toBe('disabled')
    })

    it('should automatically apply disabled state when not playable', () => {
      // First make it playable
      cardSprite.setPlayable(true)
      vi.clearAllMocks()

      // Then make it not playable
      cardSprite.setPlayable(false)

      expect(cardVisuals.transitionToState).toHaveBeenCalledWith(
        expect.anything(),
        'default',
        'disabled'
      )
    })

    it('should restore default state when made playable again', () => {
      // First make it playable, then not playable
      cardSprite.setPlayable(true)
      cardSprite.setPlayable(false)
      vi.clearAllMocks()

      // Then make it playable again
      cardSprite.setPlayable(true)

      expect(cardVisuals.transitionToState).toHaveBeenCalledWith(
        expect.anything(),
        'disabled',
        'default'
      )
    })
  })
})