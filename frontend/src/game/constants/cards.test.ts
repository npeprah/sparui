import { describe, it, expect } from 'vitest'
import {
  ALL_SUITS,
  ALL_RANKS,
  SPADES_RANKS,
  SPAR_DECK_SIZE,
  getCardAssetKey,
  getCardAssetPath,
  isValidSparCard,
  getValidRanksForSuit,
  generateSparDeck,
} from './cards'

describe('Card Constants', () => {
  describe('ALL_SUITS', () => {
    it('should contain exactly 4 suits', () => {
      expect(ALL_SUITS).toHaveLength(4)
    })

    it('should contain hearts, clubs, diamonds, spades', () => {
      expect(ALL_SUITS).toEqual(['hearts', 'clubs', 'diamonds', 'spades'])
    })
  })

  describe('ALL_RANKS', () => {
    it('should contain exactly 9 ranks', () => {
      expect(ALL_RANKS).toHaveLength(9)
    })

    it('should contain ranks 6-10, J, Q, K, A', () => {
      expect(ALL_RANKS).toEqual(['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'])
    })

    it('should not contain ranks 2-5', () => {
      expect(ALL_RANKS).not.toContain('2')
      expect(ALL_RANKS).not.toContain('3')
      expect(ALL_RANKS).not.toContain('4')
      expect(ALL_RANKS).not.toContain('5')
    })
  })

  describe('SPADES_RANKS', () => {
    it('should contain exactly 8 ranks', () => {
      expect(SPADES_RANKS).toHaveLength(8)
    })

    it('should contain ranks 6-10, J, Q, K', () => {
      expect(SPADES_RANKS).toEqual(['6', '7', '8', '9', '10', 'J', 'Q', 'K'])
    })

    it('should contain 6 but not A', () => {
      expect(SPADES_RANKS).toContain('6')
      expect(SPADES_RANKS).not.toContain('A')
    })
  })

  describe('SPAR_DECK_SIZE', () => {
    it('should be 35 cards total', () => {
      expect(SPAR_DECK_SIZE).toBe(35)
    })
  })
})

describe('Card Asset Functions', () => {
  describe('getCardAssetKey', () => {
    it('should generate correct asset key for number cards', () => {
      expect(getCardAssetKey('hearts', '6')).toBe('card_hearts_6')
      expect(getCardAssetKey('clubs', '10')).toBe('card_clubs_10')
    })

    it('should generate correct asset key for face cards', () => {
      expect(getCardAssetKey('diamonds', 'J')).toBe('card_diamonds_j')
      expect(getCardAssetKey('spades', 'Q')).toBe('card_spades_q')
      expect(getCardAssetKey('hearts', 'K')).toBe('card_hearts_k')
    })

    it('should generate correct asset key for aces', () => {
      expect(getCardAssetKey('hearts', 'A')).toBe('card_hearts_a')
      expect(getCardAssetKey('clubs', 'A')).toBe('card_clubs_a')
    })

    it('should use lowercase for rank in asset key', () => {
      const key = getCardAssetKey('hearts', 'J')
      expect(key).toBe('card_hearts_j')
      expect(key).not.toContain('J') // uppercase
    })
  })

  describe('getCardAssetPath', () => {
    it('should generate correct path for number cards', () => {
      expect(getCardAssetPath('hearts', '6')).toBe('assets/cards/hearts/hearts_6.png')
      expect(getCardAssetPath('clubs', '10')).toBe('assets/cards/clubs/clubs_10.png')
    })

    it('should generate the correct lowercase path for the 6 of spades', () => {
      expect(getCardAssetPath('spades', '6')).toBe('assets/cards/spades/spades_6.png')
    })

    it('should use lowercase for face-card rank in path (casing)', () => {
      expect(getCardAssetPath('spades', 'K')).toBe('assets/cards/spades/spades_k.png')
      expect(getCardAssetPath('hearts', '10')).toBe('assets/cards/hearts/hearts_10.png')
      expect(getCardAssetPath('spades', 'K')).not.toContain('_K.')
    })

    it('should generate correct path for face cards', () => {
      expect(getCardAssetPath('diamonds', 'J')).toBe('assets/cards/diamonds/diamonds_j.png')
      expect(getCardAssetPath('spades', 'Q')).toBe('assets/cards/spades/spades_q.png')
      expect(getCardAssetPath('hearts', 'K')).toBe('assets/cards/hearts/hearts_k.png')
    })

    it('should generate correct path for aces', () => {
      expect(getCardAssetPath('hearts', 'A')).toBe('assets/cards/hearts/hearts_a.png')
      expect(getCardAssetPath('clubs', 'A')).toBe('assets/cards/clubs/clubs_a.png')
    })

    it('should use lowercase for rank in path', () => {
      const path = getCardAssetPath('hearts', 'J')
      expect(path).toBe('assets/cards/hearts/hearts_j.png')
      expect(path).not.toContain('_J.') // uppercase
    })
  })
})

describe('Card Validation Functions', () => {
  describe('isValidSparCard', () => {
    it('should return true for all hearts cards (6-A)', () => {
      const ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const
      ranks.forEach(rank => {
        expect(isValidSparCard('hearts', rank)).toBe(true)
      })
    })

    it('should return true for all clubs cards (6-A)', () => {
      const ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const
      ranks.forEach(rank => {
        expect(isValidSparCard('clubs', rank)).toBe(true)
      })
    })

    it('should return true for all diamonds cards (6-A)', () => {
      const ranks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const
      ranks.forEach(rank => {
        expect(isValidSparCard('diamonds', rank)).toBe(true)
      })
    })

    it('should return true for valid spades cards (6-K)', () => {
      const validRanks = ['6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
      validRanks.forEach(rank => {
        expect(isValidSparCard('spades', rank)).toBe(true)
      })
    })

    it('should return true for 6 of spades', () => {
      expect(isValidSparCard('spades', '6')).toBe(true)
    })

    it('should return false for A of spades', () => {
      expect(isValidSparCard('spades', 'A')).toBe(false)
    })
  })

  describe('getValidRanksForSuit', () => {
    it('should return 9 ranks for hearts', () => {
      const ranks = getValidRanksForSuit('hearts')
      expect(ranks).toHaveLength(9)
      expect(ranks).toEqual(['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'])
    })

    it('should return 9 ranks for clubs', () => {
      const ranks = getValidRanksForSuit('clubs')
      expect(ranks).toHaveLength(9)
      expect(ranks).toEqual(['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'])
    })

    it('should return 9 ranks for diamonds', () => {
      const ranks = getValidRanksForSuit('diamonds')
      expect(ranks).toHaveLength(9)
      expect(ranks).toEqual(['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'])
    })

    it('should return 8 ranks for spades (6-K, no A)', () => {
      const ranks = getValidRanksForSuit('spades')
      expect(ranks).toHaveLength(8)
      expect(ranks).toEqual(['6', '7', '8', '9', '10', 'J', 'Q', 'K'])
      expect(ranks).toContain('6')
      expect(ranks).not.toContain('A')
    })
  })

  describe('generateSparDeck', () => {
    it('should generate exactly 35 cards', () => {
      const deck = generateSparDeck()
      expect(deck).toHaveLength(35)
    })

    it('should include 9 hearts cards', () => {
      const deck = generateSparDeck()
      const hearts = deck.filter(card => card.suit === 'hearts')
      expect(hearts).toHaveLength(9)
    })

    it('should include 9 clubs cards', () => {
      const deck = generateSparDeck()
      const clubs = deck.filter(card => card.suit === 'clubs')
      expect(clubs).toHaveLength(9)
    })

    it('should include 9 diamonds cards', () => {
      const deck = generateSparDeck()
      const diamonds = deck.filter(card => card.suit === 'diamonds')
      expect(diamonds).toHaveLength(9)
    })

    it('should include 8 spades cards', () => {
      const deck = generateSparDeck()
      const spades = deck.filter(card => card.suit === 'spades')
      expect(spades).toHaveLength(8)
    })

    it('should include the 6 of spades', () => {
      const deck = generateSparDeck()
      const sixOfSpades = deck.find(card => card.suit === 'spades' && card.rank === '6')
      expect(sixOfSpades).toBeDefined()
    })

    it('should not include A of spades', () => {
      const deck = generateSparDeck()
      const aceOfSpades = deck.find(card => card.suit === 'spades' && card.rank === 'A')
      expect(aceOfSpades).toBeUndefined()
    })

    it('should include all valid cards and only valid cards', () => {
      const deck = generateSparDeck()
      deck.forEach(card => {
        expect(isValidSparCard(card.suit, card.rank)).toBe(true)
      })
    })

    it('should have correct distribution: 9+9+9+8=35', () => {
      const deck = generateSparDeck()
      const distribution = {
        hearts: deck.filter(c => c.suit === 'hearts').length,
        clubs: deck.filter(c => c.suit === 'clubs').length,
        diamonds: deck.filter(c => c.suit === 'diamonds').length,
        spades: deck.filter(c => c.suit === 'spades').length,
      }

      expect(distribution.hearts).toBe(9)
      expect(distribution.clubs).toBe(9)
      expect(distribution.diamonds).toBe(9)
      expect(distribution.spades).toBe(8)
      expect(
        distribution.hearts + distribution.clubs + distribution.diamonds + distribution.spades
      ).toBe(35)
    })
  })
})
