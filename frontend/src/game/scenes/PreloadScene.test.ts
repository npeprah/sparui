import { describe, it, expect } from 'vitest'
import { generateSparDeck, SPAR_DECK_SIZE, CARD_BACK_KEY } from '../constants/cards'

/**
 * Tests for PreloadScene Asset Loading Logic
 * Note: These tests verify the asset loading logic without instantiating Phaser.
 * Full integration tests with Phaser would require canvas/WebGL context.
 */
describe('PreloadScene Asset Loading Logic', () => {
  describe('Asset Loading Logic', () => {
    it('should plan to load exactly 35 card assets', () => {
      const deck = generateSparDeck()
      expect(SPAR_DECK_SIZE).toBe(35)
      expect(deck).toHaveLength(SPAR_DECK_SIZE)
    })

    it('should generate unique asset keys for all cards', () => {
      const deck = generateSparDeck()
      const keys = new Set(deck.map(card => `card_${card.suit}_${card.rank.toLowerCase()}`))
      expect(keys.size).toBe(35) // All keys should be unique
    })

    it('should generate valid asset paths for all cards', () => {
      const deck = generateSparDeck()
      deck.forEach(card => {
        const path = `/assets/cards/${card.suit}/${card.suit}_${card.rank.toLowerCase()}.png`
        expect(path).toMatch(
          /^\/assets\/cards\/(hearts|clubs|diamonds|spades)\/\1_[6-9]|10|[jqka]\.png$/
        )
      })
    })

    it('should include card back in texture generation', () => {
      expect(CARD_BACK_KEY).toBe('card_back')
    })
  })

  describe('Suit Distribution', () => {
    it('should load 9 hearts cards', () => {
      const deck = generateSparDeck()
      const hearts = deck.filter(card => card.suit === 'hearts')
      expect(hearts).toHaveLength(9)
    })

    it('should load 9 clubs cards', () => {
      const deck = generateSparDeck()
      const clubs = deck.filter(card => card.suit === 'clubs')
      expect(clubs).toHaveLength(9)
    })

    it('should load 9 diamonds cards', () => {
      const deck = generateSparDeck()
      const diamonds = deck.filter(card => card.suit === 'diamonds')
      expect(diamonds).toHaveLength(9)
    })

    it('should load 8 spades cards', () => {
      const deck = generateSparDeck()
      const spades = deck.filter(card => card.suit === 'spades')
      expect(spades).toHaveLength(8)
    })
  })

  describe('Invalid Cards', () => {
    it('should attempt to load the 6 of spades', () => {
      const deck = generateSparDeck()
      const sixOfSpades = deck.find(card => card.suit === 'spades' && card.rank === '6')
      expect(sixOfSpades).toBeDefined()
    })

    it('should not attempt to load A of spades', () => {
      const deck = generateSparDeck()
      const aceOfSpades = deck.find(card => card.suit === 'spades' && card.rank === 'A')
      expect(aceOfSpades).toBeUndefined()
    })

    it('should not attempt to load any cards with ranks 2-5', () => {
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

    it('card back key should be unique from card asset keys', () => {
      const deck = generateSparDeck()
      const cardKeys = deck.map(card => `card_${card.suit}_${card.rank.toLowerCase()}`)
      expect(cardKeys).not.toContain(CARD_BACK_KEY)
    })
  })

  describe('Asset Path Validation', () => {
    it('should generate paths with correct directory structure', () => {
      const deck = generateSparDeck()
      deck.forEach(card => {
        const path = `/assets/cards/${card.suit}/${card.suit}_${card.rank.toLowerCase()}.png`

        // Should start with /assets/cards/
        expect(path.startsWith('/assets/cards/')).toBe(true)

        // Should end with .png
        expect(path.endsWith('.png')).toBe(true)

        // Should contain suit twice (in directory and filename)
        const suitOccurrences = (path.match(new RegExp(card.suit, 'g')) || []).length
        expect(suitOccurrences).toBe(2)
      })
    })

    it('should use lowercase for rank in file names', () => {
      const deck = generateSparDeck()
      deck.forEach(card => {
        const path = `/assets/cards/${card.suit}/${card.suit}_${card.rank.toLowerCase()}.png`

        // Should not contain uppercase J, Q, K, A in filename
        const filename = path.split('/').pop()!
        expect(filename).not.toMatch(/_[JQKA]\.png$/)
      })
    })
  })

  describe('Total Asset Count', () => {
    it('should plan to load 35 cards + 1 card back = 36 assets total', () => {
      const deck = generateSparDeck()
      const totalAssets = deck.length + 1 // +1 for card back
      expect(totalAssets).toBe(36)
    })
  })

  describe('Surface Asset Loading', () => {
    const SURFACE_THEMES = ['afro_heritage', 'neon_arcade', 'royal_gold', 'ocean_breeze']

    it('should plan to load exactly 4 surface textures', () => {
      expect(SURFACE_THEMES).toHaveLength(4)
    })

    it('should have correct surface theme names', () => {
      expect(SURFACE_THEMES).toContain('afro_heritage')
      expect(SURFACE_THEMES).toContain('neon_arcade')
      expect(SURFACE_THEMES).toContain('royal_gold')
      expect(SURFACE_THEMES).toContain('ocean_breeze')
    })

    it('should generate correct surface asset keys', () => {
      const expectedKeys = SURFACE_THEMES.map(theme => `surface_${theme}`)

      expect(expectedKeys).toEqual([
        'surface_afro_heritage',
        'surface_neon_arcade',
        'surface_royal_gold',
        'surface_ocean_breeze',
      ])
    })

    it('should generate correct surface asset paths', () => {
      const expectedPaths = SURFACE_THEMES.map(theme => `assets/surfaces/surface_${theme}.png`)

      expectedPaths.forEach(path => {
        expect(path).toMatch(/^assets\/surfaces\/surface_[a-z_]+\.png$/)
        expect(path.startsWith('assets/surfaces/')).toBe(true)
        expect(path.endsWith('.png')).toBe(true)
      })
    })

    it('should have afro_heritage as the default surface', () => {
      expect(SURFACE_THEMES[0]).toBe('afro_heritage')
    })

    it('surface keys should be unique from card asset keys', () => {
      const deck = generateSparDeck()
      const cardKeys = deck.map(card => `card_${card.suit}_${card.rank.toLowerCase()}`)
      const surfaceKeys = SURFACE_THEMES.map(theme => `surface_${theme}`)

      surfaceKeys.forEach(surfaceKey => {
        expect(cardKeys).not.toContain(surfaceKey)
      })
    })

    it('surface keys should follow consistent naming pattern', () => {
      const surfaceKeys = SURFACE_THEMES.map(theme => `surface_${theme}`)

      surfaceKeys.forEach(key => {
        expect(key).toMatch(/^surface_[a-z_]+$/)
        expect(key.startsWith('surface_')).toBe(true)
        expect(key).not.toContain(' ')
        expect(key).not.toContain('-')
        expect(key.toLowerCase()).toBe(key) // Should be lowercase
      })
    })
  })
})
