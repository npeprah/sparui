import { describe, it, expect } from 'vitest'
import {
  CARD_COLORS,
  getSuitColors,
  getSuitPrimaryColor,
  getSuitSecondaryColor,
  getSuitAccentColor,
  getSuitBackgroundGradient,
  getSuitPatternColor,
} from './cardColors'
import type { Suit } from '../../store/types'

describe('Card Color Palettes', () => {
  describe('CARD_COLORS', () => {
    it('should define correct Hearts palette', () => {
      const hearts = CARD_COLORS.hearts
      expect(hearts.primary).toBe('#FF4500')
      expect(hearts.secondary).toBe('#FFD700')
      expect(hearts.accent).toBe('#DC143C')
      expect(hearts.backgroundStart).toBe('#FFF9F0')
      expect(hearts.backgroundMid).toBe('#FFE8D6')
      expect(hearts.backgroundEnd).toBe('#FFF5E6')
      expect(hearts.pattern).toBe('rgba(229, 57, 53, 0.15)')
    })

    it('should define correct Clubs palette', () => {
      const clubs = CARD_COLORS.clubs
      expect(clubs.primary).toBe('#0A5F38')
      expect(clubs.secondary).toBe('#FFD700')
      expect(clubs.accent).toBe('#006400')
      expect(clubs.backgroundStart).toBe('#F0FFF4')
      expect(clubs.backgroundMid).toBe('#D6F5E0')
      expect(clubs.backgroundEnd).toBe('#E6FFF0')
      expect(clubs.pattern).toBe('rgba(0, 100, 0, 0.15)')
    })

    it('should define correct Diamonds palette', () => {
      const diamonds = CARD_COLORS.diamonds
      expect(diamonds.primary).toBe('#FFD700')
      expect(diamonds.secondary).toBe('#8B00FF')
      expect(diamonds.accent).toBe('#FFBF00')
      expect(diamonds.backgroundStart).toBe('#FFFAF0')
      expect(diamonds.backgroundMid).toBe('#FFF0D6')
      expect(diamonds.backgroundEnd).toBe('#FFF8E6')
      expect(diamonds.pattern).toBe('rgba(255, 215, 0, 0.15)')
    })

    it('should define correct Spades palette', () => {
      const spades = CARD_COLORS.spades
      expect(spades.primary).toBe('#8B00FF')
      expect(spades.secondary).toBe('#00BFFF')
      expect(spades.accent).toBe('#191970')
      expect(spades.backgroundStart).toBe('#F5F0FF')
      expect(spades.backgroundMid).toBe('#E8D6FF')
      expect(spades.backgroundEnd).toBe('#F0E6FF')
      expect(spades.pattern).toBe('rgba(139, 0, 255, 0.15)')
    })
  })

  describe('getSuitColors', () => {
    it('should return correct colors for Hearts', () => {
      const colors = getSuitColors('hearts' as Suit)
      expect(colors.primary).toBe('#FF4500')
      expect(colors.secondary).toBe('#FFD700')
      expect(colors.accent).toBe('#DC143C')
    })

    it('should return correct colors for Clubs', () => {
      const colors = getSuitColors('clubs' as Suit)
      expect(colors.primary).toBe('#0A5F38')
      expect(colors.secondary).toBe('#FFD700')
      expect(colors.accent).toBe('#006400')
    })

    it('should return correct colors for Diamonds', () => {
      const colors = getSuitColors('diamonds' as Suit)
      expect(colors.primary).toBe('#FFD700')
      expect(colors.secondary).toBe('#8B00FF')
      expect(colors.accent).toBe('#FFBF00')
    })

    it('should return correct colors for Spades', () => {
      const colors = getSuitColors('spades' as Suit)
      expect(colors.primary).toBe('#8B00FF')
      expect(colors.secondary).toBe('#00BFFF')
      expect(colors.accent).toBe('#191970')
    })
  })

  describe('getSuitPrimaryColor', () => {
    it('should return correct primary color for each suit', () => {
      expect(getSuitPrimaryColor('hearts' as Suit)).toBe('#FF4500')
      expect(getSuitPrimaryColor('clubs' as Suit)).toBe('#0A5F38')
      expect(getSuitPrimaryColor('diamonds' as Suit)).toBe('#FFD700')
      expect(getSuitPrimaryColor('spades' as Suit)).toBe('#8B00FF')
    })
  })

  describe('getSuitSecondaryColor', () => {
    it('should return correct secondary color for each suit', () => {
      expect(getSuitSecondaryColor('hearts' as Suit)).toBe('#FFD700')
      expect(getSuitSecondaryColor('clubs' as Suit)).toBe('#FFD700')
      expect(getSuitSecondaryColor('diamonds' as Suit)).toBe('#8B00FF')
      expect(getSuitSecondaryColor('spades' as Suit)).toBe('#00BFFF')
    })
  })

  describe('getSuitAccentColor', () => {
    it('should return correct accent color for each suit', () => {
      expect(getSuitAccentColor('hearts' as Suit)).toBe('#DC143C')
      expect(getSuitAccentColor('clubs' as Suit)).toBe('#006400')
      expect(getSuitAccentColor('diamonds' as Suit)).toBe('#FFBF00')
      expect(getSuitAccentColor('spades' as Suit)).toBe('#191970')
    })
  })

  describe('getSuitBackgroundGradient', () => {
    it('should return correct gradient for Hearts', () => {
      const gradient = getSuitBackgroundGradient('hearts' as Suit)
      expect(gradient).toBe('linear-gradient(135deg, #FFF9F0 0%, #FFE8D6 50%, #FFF5E6 100%)')
    })

    it('should return correct gradient for Clubs', () => {
      const gradient = getSuitBackgroundGradient('clubs' as Suit)
      expect(gradient).toBe('linear-gradient(135deg, #F0FFF4 0%, #D6F5E0 50%, #E6FFF0 100%)')
    })

    it('should return correct gradient for Diamonds', () => {
      const gradient = getSuitBackgroundGradient('diamonds' as Suit)
      expect(gradient).toBe('linear-gradient(135deg, #FFFAF0 0%, #FFF0D6 50%, #FFF8E6 100%)')
    })

    it('should return correct gradient for Spades', () => {
      const gradient = getSuitBackgroundGradient('spades' as Suit)
      expect(gradient).toBe('linear-gradient(135deg, #F5F0FF 0%, #E8D6FF 50%, #F0E6FF 100%)')
    })
  })

  describe('getSuitPatternColor', () => {
    it('should return correct pattern color for each suit', () => {
      expect(getSuitPatternColor('hearts' as Suit)).toBe('rgba(229, 57, 53, 0.15)')
      expect(getSuitPatternColor('clubs' as Suit)).toBe('rgba(0, 100, 0, 0.15)')
      expect(getSuitPatternColor('diamonds' as Suit)).toBe('rgba(255, 215, 0, 0.15)')
      expect(getSuitPatternColor('spades' as Suit)).toBe('rgba(139, 0, 255, 0.15)')
    })
  })
})
