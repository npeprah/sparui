import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as cardAnimations from '../utils/cardAnimations'

// Mock dependencies
vi.mock('../utils/cardAnimations', () => ({
  createCardDealAnimation: vi.fn(() => ({
    targets: {},
    duration: 800,
    delay: 0,
  })),
  createCardPlayAnimation: vi.fn(() => ({
    targets: {},
    duration: 400,
  })),
  createSuitSymbolPulseAnimation: vi.fn(() => ({
    targets: {},
    duration: 2000,
    repeat: -1,
  })),
  createHoverFloatAnimation: vi.fn(() => ({
    targets: {},
    duration: 600,
    y: 470,
    scaleX: 1.05,
    scaleY: 1.05,
  })),
  createHoverExitAnimation: vi.fn(() => ({
    targets: {},
    duration: 600,
    y: 500,
    scaleX: 1,
    scaleY: 1,
  })),
  createFireStateAnimation: vi.fn(() => ({
    targets: {},
    duration: 1000,
    repeat: -1,
  })),
  createFrozenStateAnimation: vi.fn(() => ({
    targets: {},
    duration: 2000,
    repeat: -1,
  })),
  applyDisabledState: vi.fn(),
  removeDisabledState: vi.fn(),
  createGlowEffect: vi.fn(() => ({
    destroy: vi.fn(),
    setDepth: vi.fn(),
    lineStyle: vi.fn(),
    strokeRoundedRect: vi.fn(),
  })),
  updateGlowPosition: vi.fn(),
}))

vi.mock('../constants/animations', () => ({
  emitSoundEvent: vi.fn(),
  triggerHaptic: vi.fn(),
  GLOW_CONFIG: {
    WIN: {
      thickness: 6,
      color: 0xffd700,
      alpha: 1,
      padding: 6,
    },
  },
}))

// Create mock scene
function createMockScene() {
  const mockTween = {
    stop: vi.fn(),
    remove: vi.fn(),
  }

  return {
    add: {
      existing: vi.fn(),
      graphics: vi.fn(() => ({
        destroy: vi.fn(),
        lineStyle: vi.fn(),
        strokeRoundedRect: vi.fn(),
        setDepth: vi.fn(),
        clear: vi.fn(),
      })),
    },
    tweens: {
      add: vi.fn(() => mockTween),
      getTweensOf: vi.fn(() => []),
    },
    events: {
      emit: vi.fn(),
    },
    textures: {
      exists: vi.fn(() => true),
    },
    input: {
      on: vi.fn(),
      off: vi.fn(),
    },
  } as unknown as Phaser.Scene
}

describe('CardSprite Animation Methods', () => {
  let scene: Phaser.Scene
  let card: CardSprite

  beforeEach(() => {
    scene = createMockScene()
    card = new CardSprite(scene, 100, 200, 'hearts', '6')
  })

  describe('Fire State Animation', () => {
    it('should enable fire state with animation', () => {
      card.setFireState(true)

      expect(card.cardState).toBe('fire')
      expect(cardAnimations.createGlowEffect).toHaveBeenCalledWith(scene, card, 'fire')
      expect(cardAnimations.createFireStateAnimation).toHaveBeenCalled()
      expect(scene.tweens.add).toHaveBeenCalled()
    })

    it('should disable fire state and clear effects', () => {
      card.setFireState(true)
      card.setFireState(false)

      expect(card.cardState).toBe('default')
    })

    it('should not re-apply fire state if already active', () => {
      card.setFireState(true)
      const callCount = vi.mocked(cardAnimations.createGlowEffect).mock.calls.length

      card.setFireState(true) // Second call

      expect(vi.mocked(cardAnimations.createGlowEffect).mock.calls.length).toBe(callCount)
    })
  })

  describe('Frozen State Animation', () => {
    it('should enable frozen state with animation and tint', () => {
      const setTintSpy = vi.spyOn(card, 'setTint')

      card.setFrozenState(true)

      expect(card.cardState).toBe('frozen')
      expect(cardAnimations.createGlowEffect).toHaveBeenCalledWith(scene, card, 'frozen')
      expect(cardAnimations.createFrozenStateAnimation).toHaveBeenCalled()
      expect(setTintSpy).toHaveBeenCalledWith(0xccddff) // Ice blue tint
    })

    it('should disable frozen state and clear tint', () => {
      const clearTintSpy = vi.spyOn(card, 'clearTint')

      card.setFrozenState(true)
      card.setFrozenState(false)

      expect(card.cardState).toBe('default')
      expect(clearTintSpy).toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('should apply disabled state', () => {
      card.setDisabledState(true)

      expect(card.cardState).toBe('disabled')
      expect(cardAnimations.applyDisabledState).toHaveBeenCalledWith(card)
    })

    it('should remove disabled state', () => {
      card.setDisabledState(true)
      card.setDisabledState(false)

      expect(card.cardState).toBe('default')
      expect(cardAnimations.removeDisabledState).toHaveBeenCalledWith(card)
    })

    it('should prevent hover when disabled', () => {
      card.setDisabledState(true)

      // Trigger hover - should not create hover animation
      const pointerOverEvent = new Event('pointerover')
      card.emit('pointerover', pointerOverEvent)

      // Since card is disabled, hover animation should not be created
      const hoverCalls = vi.mocked(cardAnimations.createHoverFloatAnimation).mock.calls.length
      expect(hoverCalls).toBe(0)
    })
  })

  describe('Suit Symbol Pulse', () => {
    it('should start continuous pulse animation', () => {
      card.startSuitPulse()

      expect(cardAnimations.createSuitSymbolPulseAnimation).toHaveBeenCalledWith(card)
      expect(scene.tweens.add).toHaveBeenCalled()

      const tweenConfig = vi.mocked(scene.tweens.add).mock.calls[0][0]
      expect(tweenConfig.duration).toBe(2000)
      expect(tweenConfig.repeat).toBe(-1) // Infinite
    })

    it('should stop pulse and reset scale', () => {
      const setScaleSpy = vi.spyOn(card, 'setScale')

      card.startSuitPulse()
      card.stopSuitPulse()

      expect(setScaleSpy).toHaveBeenCalledWith(1) // Original scale
    })

    it('should restart pulse if already running', () => {
      card.startSuitPulse()
      const firstTween = vi.mocked(scene.tweens.add).mock.results[0].value

      card.startSuitPulse() // Second call

      expect(firstTween.stop).toHaveBeenCalled()
      expect(scene.tweens.add).toHaveBeenCalledTimes(2)
    })
  })

  describe('Deal Animation', () => {
    it('should animate deal with exact specifications', () => {
      card.animateDeal(300, 400, 0)

      expect(cardAnimations.createCardDealAnimation).toHaveBeenCalledWith(card, 300, 400, 0)
      expect(scene.tweens.add).toHaveBeenCalled()

      const tweenConfig = vi.mocked(scene.tweens.add).mock.calls[0][0]
      expect(tweenConfig.duration).toBe(800) // Exact duration from spec
    })

    it('should apply stagger delay for multiple cards', () => {
      card.animateDeal(300, 400, 2)

      expect(cardAnimations.createCardDealAnimation).toHaveBeenCalledWith(card, 300, 400, 2)

      const tweenConfig = vi.mocked(cardAnimations.createCardDealAnimation).mock.results[0].value
      expect(tweenConfig.delay).toBe(300) // 150ms * 2
    })

    it('should start suit pulse after deal completes', (done) => {
      const startPulseSpy = vi.spyOn(card, 'startSuitPulse')

      card.animateDeal(300, 400, 0)

      const tweenConfig = vi.mocked(scene.tweens.add).mock.calls[0][0]
      tweenConfig.onComplete?.()

      // Wait for async operations
      setTimeout(() => {
        expect(startPulseSpy).toHaveBeenCalled()
        done()
      }, 10)
    })

    it('should store original position after deal', () => {
      card.animateDeal(300, 400, 0)

      const tweenConfig = vi.mocked(scene.tweens.add).mock.calls[0][0]
      tweenConfig.onComplete?.()

      expect(card['originalY']).toBe(400)
      expect(card['originalScale']).toBe(1)
    })
  })

  describe('Play Animation', () => {
    it('should animate play with exact specifications', () => {
      card.animatePlay(400, 300)

      expect(cardAnimations.createCardPlayAnimation).toHaveBeenCalledWith(card, 400, 300)
      expect(scene.tweens.add).toHaveBeenCalled()

      const tweenConfig = vi.mocked(scene.tweens.add).mock.calls[0][0]
      expect(tweenConfig.duration).toBe(400) // Exact duration from spec
    })

    it('should stop suit pulse when playing', () => {
      const stopPulseSpy = vi.spyOn(card, 'stopSuitPulse')

      card.startSuitPulse()
      card.animatePlay(400, 300)

      expect(stopPulseSpy).toHaveBeenCalled()
    })

    it('should emit sound and haptic on complete', async () => {
      const { emitSoundEvent, triggerHaptic } = await import('../constants/animations')

      card.animatePlay(400, 300)

      const tweenConfig = vi.mocked(scene.tweens.add).mock.calls[0][0]
      tweenConfig.onComplete?.()

      expect(emitSoundEvent).toHaveBeenCalledWith(scene, 'CARD_PLAY')
      expect(triggerHaptic).toHaveBeenCalledWith('CARD_PLAY')
    })
  })

  describe('Hover Animations', () => {
    it('should use exact hover specifications', () => {
      // Trigger hover enter
      card['onHoverEnter']()

      expect(cardAnimations.createHoverFloatAnimation).toHaveBeenCalledWith(card, 200, 1)
      expect(scene.tweens.add).toHaveBeenCalled()

      const tweenConfig = vi.mocked(scene.tweens.add).mock.calls[0][0]
      expect(tweenConfig.duration).toBe(600) // Exact duration from spec
      expect(tweenConfig.y).toBe(470) // originalY (200) - 30
      expect(tweenConfig.scaleX).toBe(1.05)
    })

    it('should use exact hover exit specifications', () => {
      // Trigger hover exit
      card['onHoverExit']()

      expect(cardAnimations.createHoverExitAnimation).toHaveBeenCalledWith(card, 200, 1)
      expect(scene.tweens.add).toHaveBeenCalled()

      const tweenConfig = vi.mocked(scene.tweens.add).mock.calls[0][0]
      expect(tweenConfig.duration).toBe(600)
      expect(tweenConfig.y).toBe(500) // Return to original
      expect(tweenConfig.scaleX).toBe(1)
    })

    it('should not hover when in disabled state', () => {
      card.setDisabledState(true)
      card['onHoverEnter']()

      expect(cardAnimations.createHoverFloatAnimation).not.toHaveBeenCalled()
    })
  })

  describe('State Transitions', () => {
    it('should clear previous state when changing states', () => {
      // Set fire state
      card.setFireState(true)
      expect(card.cardState).toBe('fire')

      // Change to frozen state
      card.setFrozenState(true)
      expect(card.cardState).toBe('frozen')

      // Fire state should be cleared
      card.setFireState(false)
      expect(card.cardState).toBe('frozen') // Should remain frozen
    })

    it('should handle rapid state changes', () => {
      card.setFireState(true)
      card.setFrozenState(true)
      card.setDisabledState(true)
      card.setDisabledState(false)

      expect(card.cardState).toBe('default')
    })
  })

  describe('Cleanup', () => {
    it('should clean up all animations on destroy', () => {
      // Start various animations
      card.startSuitPulse()
      card.setFireState(true)
      card['onHoverEnter']()

      // Store references to tweens
      const suitPulseTween = card['suitPulseTween']
      const stateTween = card['stateTween']
      const hoverTween = card['hoverTween']

      card.destroy()

      expect(suitPulseTween?.stop).toHaveBeenCalled()
      expect(stateTween?.stop).toHaveBeenCalled()
      expect(hoverTween?.stop).toHaveBeenCalled()
    })

    it('should destroy glow effect on cleanup', () => {
      card.setFireState(true)

      const glowEffect = card['glowEffect']
      card.destroy()

      expect(glowEffect?.destroy).toHaveBeenCalled()
    })
  })
})