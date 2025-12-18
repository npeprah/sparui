import { describe, it, expect } from 'vitest'
import { getPlayableCards, mustFollowSuit } from './sparRules'
import type { Card } from '../../store/types'

describe('sparRules', () => {
  describe('mustFollowSuit', () => {
    it('should return true if player has at least one card of the led suit', () => {
      const hand: Card[] = [
        { id: '1', suit: 'hearts', rank: '6' },
        { id: '2', suit: 'hearts', rank: '7' },
        { id: '3', suit: 'clubs', rank: 'J' },
      ]
      const ledSuit = 'hearts'

      const result = mustFollowSuit(hand, ledSuit)

      expect(result).toBe(true)
    })

    it('should return false if player has no cards of the led suit', () => {
      const hand: Card[] = [
        { id: '1', suit: 'clubs', rank: '6' },
        { id: '2', suit: 'diamonds', rank: '7' },
        { id: '3', suit: 'spades', rank: 'J' },
      ]
      const ledSuit = 'hearts'

      const result = mustFollowSuit(hand, ledSuit)

      expect(result).toBe(false)
    })

    it('should return false if no led suit (round leader)', () => {
      const hand: Card[] = [
        { id: '1', suit: 'hearts', rank: '6' },
        { id: '2', suit: 'clubs', rank: '7' },
      ]
      const ledSuit = null

      const result = mustFollowSuit(hand, ledSuit)

      expect(result).toBe(false)
    })

    it('should return false for empty hand', () => {
      const hand: Card[] = []
      const ledSuit = 'hearts'

      const result = mustFollowSuit(hand, ledSuit)

      expect(result).toBe(false)
    })
  })

  describe('getPlayableCards', () => {
    it('should return all cards if no led suit (round leader)', () => {
      const hand: Card[] = [
        { id: '1', suit: 'hearts', rank: '6' },
        { id: '2', suit: 'clubs', rank: '7' },
        { id: '3', suit: 'diamonds', rank: 'J' },
      ]
      const ledSuit = null

      const result = getPlayableCards(hand, ledSuit)

      expect(result).toEqual(hand)
      expect(result.length).toBe(3)
    })

    it('should return only cards matching led suit if player has them', () => {
      const hand: Card[] = [
        { id: '1', suit: 'hearts', rank: '6' },
        { id: '2', suit: 'hearts', rank: '7' },
        { id: '3', suit: 'clubs', rank: 'J' },
        { id: '4', suit: 'diamonds', rank: 'K' },
      ]
      const ledSuit = 'hearts'

      const result = getPlayableCards(hand, ledSuit)

      expect(result.length).toBe(2)
      expect(result[0]).toEqual({ id: '1', suit: 'hearts', rank: '6' })
      expect(result[1]).toEqual({ id: '2', suit: 'hearts', rank: '7' })
    })

    it('should return all cards if player has no cards of led suit', () => {
      const hand: Card[] = [
        { id: '1', suit: 'clubs', rank: '6' },
        { id: '2', suit: 'diamonds', rank: '7' },
        { id: '3', suit: 'spades', rank: 'J' },
      ]
      const ledSuit = 'hearts'

      const result = getPlayableCards(hand, ledSuit)

      expect(result).toEqual(hand)
      expect(result.length).toBe(3)
    })

    it('should return empty array for empty hand', () => {
      const hand: Card[] = []
      const ledSuit = 'hearts'

      const result = getPlayableCards(hand, ledSuit)

      expect(result).toEqual([])
    })

    it('should handle single card matching led suit', () => {
      const hand: Card[] = [{ id: '1', suit: 'hearts', rank: '6' }]
      const ledSuit = 'hearts'

      const result = getPlayableCards(hand, ledSuit)

      expect(result.length).toBe(1)
      expect(result[0]).toEqual({ id: '1', suit: 'hearts', rank: '6' })
    })

    it('should handle single card not matching led suit', () => {
      const hand: Card[] = [{ id: '1', suit: 'clubs', rank: '6' }]
      const ledSuit = 'hearts'

      const result = getPlayableCards(hand, ledSuit)

      expect(result.length).toBe(1)
      expect(result[0]).toEqual({ id: '1', suit: 'clubs', rank: '6' })
    })
  })
})
