import { describe, it, expect } from 'vitest'
import {
  generateSparDeck,
  SPAR_DECK_SIZE,
  CARD_BACK_KEY,
  getCardAssetKey,
} from '../constants/cards'

/**
 * Tests for the PreloadScene card-texture plan.
 *
 * Card faces + the card back are now DRAWN in-engine (ticket 18,
 * `cardTextureFactory.ts`) rather than loaded as PNGs, so these tests assert the
 * set of textures the scene generates - not asset file paths (there are none).
 * Full Phaser canvas rendering is exercised by the e2e harness; these are the
 * framework-free planning checks.
 */
describe('PreloadScene card texture plan', () => {
  describe('Generated texture set', () => {
    it('should plan to generate exactly 35 card faces', () => {
      const deck = generateSparDeck()
      expect(SPAR_DECK_SIZE).toBe(35)
      expect(deck).toHaveLength(SPAR_DECK_SIZE)
    })

    it('should generate unique texture keys for all cards', () => {
      const deck = generateSparDeck()
      const keys = new Set(deck.map(card => getCardAssetKey(card.suit, card.rank)))
      expect(keys.size).toBe(35) // All keys should be unique
    })

    it('should key faces as card_<suit>_<rank> in lowercase', () => {
      const deck = generateSparDeck()
      deck.forEach(card => {
        const key = getCardAssetKey(card.suit, card.rank)
        expect(key).toMatch(/^card_(hearts|clubs|diamonds|spades)_(?:[6-9]|10|j|q|k|a)$/)
      })
    })

    it('should generate a card back texture', () => {
      expect(CARD_BACK_KEY).toBe('card_back')
    })
  })

  describe('Suit Distribution', () => {
    it('should generate 9 hearts cards', () => {
      const deck = generateSparDeck()
      const hearts = deck.filter(card => card.suit === 'hearts')
      expect(hearts).toHaveLength(9)
    })

    it('should generate 9 clubs cards', () => {
      const deck = generateSparDeck()
      const clubs = deck.filter(card => card.suit === 'clubs')
      expect(clubs).toHaveLength(9)
    })

    it('should generate 9 diamonds cards', () => {
      const deck = generateSparDeck()
      const diamonds = deck.filter(card => card.suit === 'diamonds')
      expect(diamonds).toHaveLength(9)
    })

    it('should generate 8 spades cards', () => {
      const deck = generateSparDeck()
      const spades = deck.filter(card => card.suit === 'spades')
      expect(spades).toHaveLength(8)
    })
  })

  describe('Invalid Cards', () => {
    it('should generate the 6 of spades', () => {
      const deck = generateSparDeck()
      const sixOfSpades = deck.find(card => card.suit === 'spades' && card.rank === '6')
      expect(sixOfSpades).toBeDefined()
    })

    it('should not generate the A of spades', () => {
      const deck = generateSparDeck()
      const aceOfSpades = deck.find(card => card.suit === 'spades' && card.rank === 'A')
      expect(aceOfSpades).toBeUndefined()
    })

    it('should not generate any cards with ranks 2-5', () => {
      const deck = generateSparDeck()
      const invalidRanks = deck.filter(card => ['2', '3', '4', '5'].includes(card.rank))
      expect(invalidRanks).toHaveLength(0)
    })
  })

  describe('Card Back Texture', () => {
    it('should define card back texture key', () => {
      expect(CARD_BACK_KEY).toBe('card_back')
      expect(typeof CARD_BACK_KEY).toBe('string')
    })

    it('card back key should be unique from card face keys', () => {
      const deck = generateSparDeck()
      const faceKeys = deck.map(card => getCardAssetKey(card.suit, card.rank))
      expect(faceKeys).not.toContain(CARD_BACK_KEY)
    })
  })

  describe('Total Texture Count', () => {
    it('should generate 35 faces + 1 card back = 36 textures total', () => {
      const deck = generateSparDeck()
      const totalTextures = deck.length + 1 // +1 for card back
      expect(totalTextures).toBe(36)
    })
  })
})
