import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardSprite } from './CardSprite'
import * as cardVisuals from '../utils/cardVisuals'
import { useThemeStore } from '../../store/themeStore'
import { getCardAssetKey } from '../constants/cards'

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

const makeGraphicsStub = () => ({
  lineStyle: vi.fn().mockReturnThis(),
  fillStyle: vi.fn().mockReturnThis(),
  strokeRoundedRect: vi.fn().mockReturnThis(),
  fillRoundedRect: vi.fn().mockReturnThis(),
  fillRect: vi.fn().mockReturnThis(),
  clear: vi.fn().mockReturnThis(),
  setPosition: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
  setVisible: vi.fn().mockReturnThis(),
  setAlpha: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
})

const mockScene = {
  add: {
    existing: vi.fn(),
    graphics: vi.fn(() => makeGraphicsStub()),
  },
  tweens: {
    add: vi.fn(),
    killTweensOf: vi.fn(),
  },
  textures: {
    exists: vi.fn().mockReturnValue(true),
  },
  events: {
    emit: vi.fn(),
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

  describe('EK border treatment (ticket 12)', () => {
    it('resolves a treatment from the active theme (default gold)', () => {
      // Default themeStore theme is warm_heritage -> gold treatment.
      expect(cardSprite.getEKTreatment()).toBe('gold')
    })

    it('reskins the border per palette while the FACE stays palette-agnostic', () => {
      const faceKey = getCardAssetKey('hearts', '7')
      const treatments: Record<string, string> = {}

      for (const theme of ['warm_heritage', 'comic', 'neon'] as const) {
        useThemeStore.setState({ selectedTheme: theme })
        const card = new CardSprite(mockScene as any, 100, 200, 'hearts', '7', 'p')
        treatments[theme] = card.getEKTreatment()
        // The card FACE texture is the same across every palette - only the
        // surrounding border treatment changes.
        expect((card as any).texture).toBe(faceKey)
      }

      // Each palette produced its own distinct border treatment.
      expect(treatments).toEqual({ warm_heritage: 'gold', comic: 'comic', neon: 'neon' })

      // Restore the default palette for the remaining tests.
      useThemeStore.setState({ selectedTheme: 'warm_heritage' })
    })
  })

  describe('State-overlay hooks/slots (ticket 12 -> ticket 16)', () => {
    it('starts with all overlay slots inactive', () => {
      expect(cardSprite.getOverlayState()).toEqual({
        fire: false,
        freeze: false,
        dry: false,
      })
    })

    it('setDryState toggles only the dry slot and reports via isOverlayActive', () => {
      cardSprite.setDryState(true)
      expect(cardSprite.isOverlayActive('dry')).toBe(true)
      expect(cardSprite.getOverlayState()).toEqual({
        fire: false,
        freeze: false,
        dry: true,
      })

      cardSprite.setDryState(false)
      expect(cardSprite.isOverlayActive('dry')).toBe(false)
    })

    it('setFireState marks the fire overlay slot active', () => {
      cardSprite.setFireState(true)
      expect(cardSprite.isOverlayActive('fire')).toBe(true)

      cardSprite.setFireState(false)
      expect(cardSprite.isOverlayActive('fire')).toBe(false)
    })

    it('setFreezeState marks the freeze overlay slot active', () => {
      cardSprite.setFreezeState(true)
      expect(cardSprite.isOverlayActive('freeze')).toBe(true)

      cardSprite.setFreezeState(false)
      expect(cardSprite.isOverlayActive('freeze')).toBe(false)
    })

    it('attachOverlay stores an object, marks the slot active, and detach destroys it', () => {
      const destroy = vi.fn()
      const fakeEffect = { destroy } as unknown as import('phaser').GameObjects.GameObject

      cardSprite.attachOverlay('dry', fakeEffect)
      expect(cardSprite.isOverlayActive('dry')).toBe(true)

      cardSprite.detachOverlay('dry')
      expect(destroy).toHaveBeenCalledOnce()
    })

    it('attaching a new object to a slot destroys the previous one', () => {
      const firstDestroy = vi.fn()
      const secondDestroy = vi.fn()
      const first = { destroy: firstDestroy } as unknown as import('phaser').GameObjects.GameObject
      const second = {
        destroy: secondDestroy,
      } as unknown as import('phaser').GameObjects.GameObject

      cardSprite.attachOverlay('fire', first)
      cardSprite.attachOverlay('fire', second)

      expect(firstDestroy).toHaveBeenCalledOnce()
      expect(secondDestroy).not.toHaveBeenCalled()
    })
  })
})
