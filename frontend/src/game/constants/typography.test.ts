import { describe, it, expect } from 'vitest'
import {
  TYPOGRAPHY_CONFIG,
  getCornerIndicatorStyle,
  getFaceCardTitleStyle,
  getFaceCardDescriptionStyle,
  loadCustomFonts,
} from './typography'

describe('Typography Configuration', () => {
  describe('TYPOGRAPHY_CONFIG', () => {
    it('should define correct font families', () => {
      expect(TYPOGRAPHY_CONFIG.fonts.orbitron).toBe('Orbitron')
      expect(TYPOGRAPHY_CONFIG.fonts.bebasNeue).toBe('Bebas Neue')
      expect(TYPOGRAPHY_CONFIG.fonts.barlow).toBe('Barlow')
    })

    it('should define correct font fallbacks', () => {
      expect(TYPOGRAPHY_CONFIG.fonts.fallback).toBe('sans-serif')
    })

    it('should define correct corner indicator specs', () => {
      const { cornerIndicator } = TYPOGRAPHY_CONFIG
      expect(cornerIndicator.valueFontSize).toBe(40)
      expect(cornerIndicator.suitFontSize).toBe(28)
      expect(cornerIndicator.fontWeight).toBe(900)
      expect(cornerIndicator.color).toBe('#FF4500')
      expect(cornerIndicator.textShadow).toBe('2px 2px 0 #DC143C, 0 0 10px rgba(255, 69, 0, 0.6)')
      expect(cornerIndicator.lineHeight).toBe(1)
    })

    it('should define correct face card title specs', () => {
      const { faceCardTitle } = TYPOGRAPHY_CONFIG
      expect(faceCardTitle.fontSize).toBe(40)
      expect(faceCardTitle.fontWeight).toBe(400)
      expect(faceCardTitle.letterSpacing).toBe(4)
      expect(faceCardTitle.color).toBe('#FF4500')
      expect(faceCardTitle.textShadow).toBe('2px 2px 0 #212121, 0 0 20px rgba(255, 215, 0, 0.8)')
    })

    it('should define correct face card description specs', () => {
      const { faceCardDescription } = TYPOGRAPHY_CONFIG
      expect(faceCardDescription.fontSize).toBe(16)
      expect(faceCardDescription.fontWeight).toBe(600)
      expect(faceCardDescription.color).toBe('#212121')
      expect(faceCardDescription.lineHeight).toBe(1.4)
      expect(faceCardDescription.opacity).toBe(0.8)
      expect(faceCardDescription.textAlign).toBe('center')
    })
  })

  describe('getCornerIndicatorStyle', () => {
    it('should return correct Phaser TextStyle for value', () => {
      const style = getCornerIndicatorStyle('value')

      expect(style.fontFamily).toBe('Orbitron, sans-serif')
      expect(style.fontSize).toBe('40px')
      expect(style.fontStyle).toBe('900')
      expect(style.color).toBe('#FF4500')
      expect(style.shadow).toEqual({
        offsetX: 2,
        offsetY: 2,
        color: '#DC143C',
        blur: 10,
        stroke: true,
        fill: true,
      })
    })

    it('should return correct Phaser TextStyle for suit', () => {
      const style = getCornerIndicatorStyle('suit')

      expect(style.fontFamily).toBe('Orbitron, sans-serif')
      expect(style.fontSize).toBe('28px')
      expect(style.fontStyle).toBe('900')
      expect(style.color).toBe('#FF4500')
    })
  })

  describe('getFaceCardTitleStyle', () => {
    it('should return correct Phaser TextStyle', () => {
      const style = getFaceCardTitleStyle()

      expect(style.fontFamily).toBe('Bebas Neue, sans-serif')
      expect(style.fontSize).toBe('40px')
      expect(style.fontStyle).toBe('400')
      expect(style.color).toBe('#FF4500')
      expect(style.padding).toEqual({ x: 4, y: 0 }) // letter-spacing workaround
      expect(style.shadow).toEqual({
        offsetX: 2,
        offsetY: 2,
        color: '#212121',
        blur: 20,
        stroke: true,
        fill: true,
      })
    })
  })

  describe('getFaceCardDescriptionStyle', () => {
    it('should return correct Phaser TextStyle', () => {
      const style = getFaceCardDescriptionStyle()

      expect(style.fontFamily).toBe('Barlow, sans-serif')
      expect(style.fontSize).toBe('16px')
      expect(style.fontStyle).toBe('600')
      expect(style.color).toBe('#212121')
      expect(style.align).toBe('center')
      expect(style.lineSpacing).toBeCloseTo(6.4, 1) // lineHeight 1.4 * 16px - 16px
    })
  })

  describe('loadCustomFonts', () => {
    it('should return font loading configuration', () => {
      const config = loadCustomFonts()

      expect(config).toHaveLength(3)

      const orbitronConfig = config.find(f => f.family === 'Orbitron')
      expect(orbitronConfig).toBeDefined()
      expect(orbitronConfig?.url).toBe('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap')

      const bebasConfig = config.find(f => f.family === 'Bebas Neue')
      expect(bebasConfig).toBeDefined()
      expect(bebasConfig?.url).toBe('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap')

      const barlowConfig = config.find(f => f.family === 'Barlow')
      expect(barlowConfig).toBeDefined()
      expect(barlowConfig?.url).toBe('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600&display=swap')
    })
  })
})