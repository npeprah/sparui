import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SUIT_COLORS,
  generateKentePattern,
  CARD_STATES,
  TYPOGRAPHY,
  buildCardStyle,
  getAnimationDuration,
  getAnimationEasing,
  applyCardStyles,
  createCardStyleSheet,
  injectCardStyles,
} from './cardStyles'

describe('Card Styles', () => {
  describe('SUIT_COLORS', () => {
    it('should have colors for all suits', () => {
      expect(SUIT_COLORS.hearts).toBeDefined()
      expect(SUIT_COLORS.clubs).toBeDefined()
      expect(SUIT_COLORS.diamonds).toBeDefined()
      expect(SUIT_COLORS.spades).toBeDefined()
    })

    it('should match design spec colors exactly', () => {
      // Hearts colors
      expect(SUIT_COLORS.hearts.primary).toBe('#FF4500') // Fire Red
      expect(SUIT_COLORS.hearts.secondary).toBe('#FFD700') // Gold
      expect(SUIT_COLORS.hearts.accent).toBe('#DC143C') // Crimson

      // Clubs colors
      expect(SUIT_COLORS.clubs.primary).toBe('#0A5F38') // Rich Green
      expect(SUIT_COLORS.clubs.secondary).toBe('#FFD700') // Gold

      // Diamonds colors
      expect(SUIT_COLORS.diamonds.primary).toBe('#FFD700') // Gold
      expect(SUIT_COLORS.diamonds.secondary).toBe('#8B00FF') // Deep Purple

      // Spades colors
      expect(SUIT_COLORS.spades.primary).toBe('#8B00FF') // Deep Purple
      expect(SUIT_COLORS.spades.secondary).toBe('#00BFFF') // Ice Blue
    })
  })

  describe('generateKentePattern()', () => {
    it('should generate multi-layer pattern', () => {
      const pattern = generateKentePattern('rgba(229, 57, 53, 0.15)')

      // Should contain three gradient layers
      expect(pattern).toContain('repeating-linear-gradient')
      expect(pattern).toContain('0deg') // Vertical stripes
      expect(pattern).toContain('90deg') // Horizontal stripes
      expect(pattern).toContain('45deg') // Diagonal stripes
    })

    it('should use provided suit color', () => {
      const testColor = 'rgba(255, 0, 0, 0.5)'
      const pattern = generateKentePattern(testColor)

      expect(pattern).toContain(testColor)
    })
  })

  describe('CARD_STATES', () => {
    it('should have all required states', () => {
      expect(CARD_STATES.default).toBeDefined()
      expect(CARD_STATES.hover).toBeDefined()
      expect(CARD_STATES.active).toBeDefined()
      expect(CARD_STATES.fire).toBeDefined()
      expect(CARD_STATES.frozen).toBeDefined()
      expect(CARD_STATES.disabled).toBeDefined()
      expect(CARD_STATES.loading).toBeDefined()
      expect(CARD_STATES.winner).toBeDefined()
      expect(CARD_STATES.loser).toBeDefined()
    })

    it('should match hover state specs exactly', () => {
      const hover = CARD_STATES.hover
      expect(hover.transform).toBe('translateY(-30px) rotateY(10deg) scale(1.05)')
      expect(hover.boxShadow).toContain('0 40px 80px rgba(255, 69, 0, 0.4)')
      expect(hover.boxShadow).toContain('0 0 60px rgba(255, 215, 0, 0.6)')
      expect(hover.cursor).toBe('pointer')
    })

    it('should match fire state specs', () => {
      const fire = CARD_STATES.fire
      expect(fire.border).toBe('4px solid transparent')
      expect(fire.boxShadow).toContain('rgba(255, 69, 0, 0.8)')
      expect(fire.animation).toBe('fireBorder 1s infinite')
    })

    it('should match frozen state specs', () => {
      const frozen = CARD_STATES.frozen
      expect(frozen.border).toBe('4px solid #00BFFF')
      expect(frozen.boxShadow).toContain('rgba(0, 191, 255, 0.8)')
      expect(frozen.boxShadow).toContain('rgba(135, 206, 235, 0.4)')
    })

    it('should match disabled state specs', () => {
      const disabled = CARD_STATES.disabled
      expect(disabled.opacity).toBe(0.5)
      expect(disabled.filter).toBe('grayscale(0.6)')
      expect(disabled.cursor).toBe('not-allowed')
      expect(disabled.pointerEvents).toBe('none')
    })
  })

  describe('TYPOGRAPHY', () => {
    it('should match corner indicator specs', () => {
      const corner = TYPOGRAPHY.cornerIndicator
      expect(corner.fontFamily).toBe('"Orbitron", sans-serif')
      expect(corner.fontSize).toBe('40px')
      expect(corner.fontWeight).toBe(900)
      expect(corner.color).toBe('#FF4500')
      expect(corner.textShadow).toContain('2px 2px 0 #DC143C')
    })

    it('should match face card title specs', () => {
      const title = TYPOGRAPHY.faceCardTitle
      expect(title.fontFamily).toBe('"Bebas Neue", sans-serif')
      expect(title.fontSize).toBe('40px')
      expect(title.letterSpacing).toBe('4px')
      expect(title.textShadow).toContain('rgba(255, 215, 0, 0.8)')
    })
  })

  describe('buildCardStyle()', () => {
    it('should return base style for non-default states', () => {
      const style = buildCardStyle('hover')
      expect(style).toEqual(CARD_STATES.hover)
    })

    it('should add Kente pattern for default state with suit', () => {
      const style = buildCardStyle('default', 'hearts')
      expect(style.background).toContain('repeating-linear-gradient')
      expect(style.background).toContain('#FFF9F0') // Hearts background start
    })

    it('should use suit-specific colors', () => {
      const heartsStyle = buildCardStyle('default', 'hearts')
      const spadesStyle = buildCardStyle('default', 'spades')

      expect(heartsStyle.background).toContain('#FFF9F0') // Hearts color
      expect(spadesStyle.background).toContain('#F5F0FF') // Spades color
    })
  })

  describe('getAnimationDuration()', () => {
    it('should return exact durations from spec', () => {
      expect(getAnimationDuration('deal')).toBe(800)
      expect(getAnimationDuration('play')).toBe(400)
      expect(getAnimationDuration('hover')).toBe(600)
      expect(getAnimationDuration('flip')).toBe(350)
      expect(getAnimationDuration('win')).toBe(1000)
      expect(getAnimationDuration('lose')).toBe(600)
      expect(getAnimationDuration('collect')).toBe(800)
    })

    it('should return default duration for unknown state', () => {
      expect(getAnimationDuration('unknown')).toBe(400)
    })
  })

  describe('getAnimationEasing()', () => {
    it('should return exact easings from spec', () => {
      expect(getAnimationEasing('deal')).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)')
      expect(getAnimationEasing('play')).toBe('ease-out')
      expect(getAnimationEasing('hover')).toBe('cubic-bezier(0.23, 1, 0.32, 1)')
    })

    it('should return default easing for unknown state', () => {
      expect(getAnimationEasing('unknown')).toBe('ease-out')
    })
  })

  describe('applyCardStyles()', () => {
    let element: HTMLElement

    beforeEach(() => {
      element = document.createElement('div')
    })

    it('should apply default state styles', () => {
      applyCardStyles(element, 'default')

      expect(element.style.opacity).toBe('1')
      expect(element.style.cursor).toBe('pointer')
      expect(element.style.border).toBe('4px solid rgb(251, 192, 45)') // #FBC02D
    })

    it('should apply hover state styles', () => {
      applyCardStyles(element, 'hover')

      expect(element.style.transform).toBe('translateY(-30px) rotateY(10deg) scale(1.05)')
      expect(element.style.cursor).toBe('pointer')
    })

    it('should apply disabled state styles', () => {
      applyCardStyles(element, 'disabled')

      expect(element.style.opacity).toBe('0.5')
      expect(element.style.filter).toBe('grayscale(0.6)')
      expect(element.style.cursor).toBe('not-allowed')
      expect(element.style.pointerEvents).toBe('none')
    })

    it('should apply suit-specific styles', () => {
      applyCardStyles(element, 'default', 'hearts')

      expect(element.style.background).toContain('linear-gradient')
    })
  })

  describe('createCardStyleSheet()', () => {
    it('should create style element with keyframes', () => {
      const styleSheet = createCardStyleSheet()

      expect(styleSheet.tagName).toBe('STYLE')
      expect(styleSheet.textContent).toContain('@keyframes fireBorder')
      expect(styleSheet.textContent).toContain('@keyframes winPulse')
      expect(styleSheet.textContent).toContain('@keyframes suitPulse')
      expect(styleSheet.textContent).toContain('@keyframes freezePulse')
      expect(styleSheet.textContent).toContain('@keyframes cardDeal')
      expect(styleSheet.textContent).toContain('@keyframes cardFloat')
    })
  })

  describe('injectCardStyles()', () => {
    afterEach(() => {
      // Clean up injected styles
      const existingStyle = document.getElementById('card-animations')
      if (existingStyle) {
        existingStyle.remove()
      }
    })

    it('should inject style sheet into document', () => {
      injectCardStyles()

      const styleSheet = document.getElementById('card-animations')
      expect(styleSheet).toBeTruthy()
      expect(styleSheet?.tagName).toBe('STYLE')
    })

    it('should not inject duplicate style sheets', () => {
      injectCardStyles()
      injectCardStyles() // Second call

      const styleSheets = document.querySelectorAll('#card-animations')
      expect(styleSheets.length).toBe(1)
    })

    it('should contain all keyframe animations', () => {
      injectCardStyles()

      const styleSheet = document.getElementById('card-animations') as HTMLStyleElement
      expect(styleSheet.textContent).toContain('fireBorder')
      expect(styleSheet.textContent).toContain('winPulse')
      expect(styleSheet.textContent).toContain('suitPulse')
    })
  })
})