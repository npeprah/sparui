import { describe, it, expect } from 'vitest'
import {
  CARD_VISUAL_STATES,
  getCardStateConfig,
  getDefaultStateConfig,
  getHoverStateConfig,
  getActiveStateConfig,
  getDisabledStateConfig,
  getFireStateConfig,
  getFrozenStateConfig,
} from './cardStates'

describe('Card Visual States', () => {
  describe('CARD_VISUAL_STATES', () => {
    it('should define correct default state configuration', () => {
      const defaultState = CARD_VISUAL_STATES.default
      expect(defaultState.borderWidth).toBe(4)
      expect(defaultState.borderColor).toBe('#FFD700')
      expect(defaultState.shadow).toBe(
        '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 69, 0, 0.3)'
      )
      expect(defaultState.opacity).toBe(1)
      expect(defaultState.scale).toBe(1)
      expect(defaultState.translateY).toBe(0)
      expect(defaultState.rotateY).toBe(0)
    })

    it('should define correct hover state configuration', () => {
      const hoverState = CARD_VISUAL_STATES.hover
      expect(hoverState.translateY).toBe(-30)
      expect(hoverState.rotateY).toBe(10)
      expect(hoverState.scale).toBe(1.05)
      expect(hoverState.shadow).toContain('0 40px 80px rgba(255, 69, 0, 0.4)')
      expect(hoverState.shadow).toContain('0 0 60px rgba(255, 215, 0, 0.6)')
      expect(hoverState.shadow).toContain('inset 0 0 30px rgba(255, 215, 0, 0.2)')
      expect(hoverState.duration).toBe(600)
      expect(hoverState.easing).toBe('cubic-bezier(0.23, 1, 0.32, 1)')
      expect(hoverState.symbolGlow).toBe(
        'drop-shadow(0 0 40px rgba(255, 215, 0, 1)) drop-shadow(0 0 80px rgba(255, 69, 0, 0.8))'
      )
    })

    it('should define correct active state configuration', () => {
      const activeState = CARD_VISUAL_STATES.active
      expect(activeState.scale).toBe(0.95)
      expect(activeState.duration).toBe(400)
      expect(activeState.easing).toBe('ease-out')
      expect(activeState.maxGlow).toBe(true)
      expect(activeState.moveToCenter).toBe(true)
    })

    it('should define correct disabled state configuration', () => {
      const disabledState = CARD_VISUAL_STATES.disabled
      expect(disabledState.opacity).toBe(0.5)
      expect(disabledState.grayscale).toBe(0.6)
      expect(disabledState.cursor).toBe('not-allowed')
      expect(disabledState.interactive).toBe(false)
    })

    it('should define correct fire state configuration', () => {
      const fireState = CARD_VISUAL_STATES.fire
      expect(fireState.borderAnimation).toBe('linear-gradient(45deg, #FF4500, #FF8C00, #FFD700)')
      expect(fireState.borderAnimationDuration).toBe(1000)
      expect(fireState.auraColor).toBe('rgba(255, 69, 0, 0.8)')
      expect(fireState.particleEffect).toBe('fire')
      expect(fireState.symbolDistortion).toBe(true)
    })

    it('should define correct frozen state configuration', () => {
      const frozenState = CARD_VISUAL_STATES.frozen
      expect(frozenState.borderColor).toBe('#00BFFF')
      expect(frozenState.borderWidth).toBe(4)
      expect(frozenState.shadow).toBe(
        '0 0 30px rgba(0, 191, 255, 0.8), inset 0 0 20px rgba(135, 206, 235, 0.4)'
      )
      expect(frozenState.overlayTexture).toBe('frost')
      expect(frozenState.auraColor).toBe('rgba(0, 191, 255, 0.8)')
      expect(frozenState.symbolTint).toBe('blue')
    })
  })

  describe('State getter functions', () => {
    it('getCardStateConfig should return correct state configuration', () => {
      expect(getCardStateConfig('default')).toEqual(CARD_VISUAL_STATES.default)
      expect(getCardStateConfig('hover')).toEqual(CARD_VISUAL_STATES.hover)
      expect(getCardStateConfig('active')).toEqual(CARD_VISUAL_STATES.active)
      expect(getCardStateConfig('disabled')).toEqual(CARD_VISUAL_STATES.disabled)
      expect(getCardStateConfig('fire')).toEqual(CARD_VISUAL_STATES.fire)
      expect(getCardStateConfig('frozen')).toEqual(CARD_VISUAL_STATES.frozen)
    })

    it('getDefaultStateConfig should return default state', () => {
      expect(getDefaultStateConfig()).toEqual(CARD_VISUAL_STATES.default)
    })

    it('getHoverStateConfig should return hover state', () => {
      expect(getHoverStateConfig()).toEqual(CARD_VISUAL_STATES.hover)
    })

    it('getActiveStateConfig should return active state', () => {
      expect(getActiveStateConfig()).toEqual(CARD_VISUAL_STATES.active)
    })

    it('getDisabledStateConfig should return disabled state', () => {
      expect(getDisabledStateConfig()).toEqual(CARD_VISUAL_STATES.disabled)
    })

    it('getFireStateConfig should return fire state', () => {
      expect(getFireStateConfig()).toEqual(CARD_VISUAL_STATES.fire)
    })

    it('getFrozenStateConfig should return frozen state', () => {
      expect(getFrozenStateConfig()).toEqual(CARD_VISUAL_STATES.frozen)
    })
  })

  describe('Animation configuration', () => {
    it('should have correct animation durations', () => {
      expect(CARD_VISUAL_STATES.hover.duration).toBe(600)
      expect(CARD_VISUAL_STATES.active.duration).toBe(400)
      expect(CARD_VISUAL_STATES.fire.borderAnimationDuration).toBe(1000)
    })

    it('should have correct easing functions', () => {
      expect(CARD_VISUAL_STATES.hover.easing).toBe('cubic-bezier(0.23, 1, 0.32, 1)')
      expect(CARD_VISUAL_STATES.active.easing).toBe('ease-out')
    })
  })
})
