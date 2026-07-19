import { describe, it, expect } from 'vitest'
import { ALL_SUITS } from '../constants/cards'
import {
  suitGlyph,
  isRedSuit,
  faceInkColor,
  rankLabel,
  CARD_FACE_RED,
  CARD_FACE_INK,
  CARD_TEXTURE_WIDTH,
  CARD_TEXTURE_HEIGHT,
} from './cardFace'

describe('cardFace pure helpers', () => {
  describe('suitGlyph', () => {
    it('maps each suit to its unicode pip', () => {
      expect(suitGlyph('hearts')).toBe('♥')
      expect(suitGlyph('diamonds')).toBe('♦')
      expect(suitGlyph('clubs')).toBe('♣')
      expect(suitGlyph('spades')).toBe('♠')
    })

    it('returns a non-empty glyph for every suit', () => {
      for (const suit of ALL_SUITS) {
        expect(suitGlyph(suit).length).toBeGreaterThan(0)
      }
    })
  })

  describe('isRedSuit', () => {
    it('treats hearts and diamonds as red', () => {
      expect(isRedSuit('hearts')).toBe(true)
      expect(isRedSuit('diamonds')).toBe(true)
    })

    it('treats clubs and spades as black', () => {
      expect(isRedSuit('clubs')).toBe(false)
      expect(isRedSuit('spades')).toBe(false)
    })
  })

  describe('faceInkColor', () => {
    it('uses the prototype red for red suits', () => {
      expect(faceInkColor('hearts')).toBe(CARD_FACE_RED)
      expect(faceInkColor('diamonds')).toBe(CARD_FACE_RED)
    })

    it('uses ink black for black suits', () => {
      expect(faceInkColor('clubs')).toBe(CARD_FACE_INK)
      expect(faceInkColor('spades')).toBe(CARD_FACE_INK)
    })
  })

  describe('rankLabel', () => {
    it('prints ranks as-is, keeping "10" two characters', () => {
      expect(rankLabel('10')).toBe('10')
      expect(rankLabel('A')).toBe('A')
      expect(rankLabel('6')).toBe('6')
    })
  })

  describe('texture dimensions', () => {
    it('keeps the retired PNG resolution so downstream layout is unchanged', () => {
      expect(CARD_TEXTURE_WIDTH).toBe(512)
      expect(CARD_TEXTURE_HEIGHT).toBe(768)
    })
  })
})
