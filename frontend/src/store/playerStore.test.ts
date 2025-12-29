import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from './playerStore'
import type { Card } from './types'

describe('playerStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePlayerStore.getState().resetGameState()
  })

  describe('removeCardFromHand', () => {
    it('should only remove the specific card with matching ID', () => {
      const hand: Card[] = [
        { id: 'hearts-K', suit: 'hearts', rank: 'K' },
        { id: 'spades-A', suit: 'spades', rank: 'A' },
        { id: 'diamonds-Q', suit: 'diamonds', rank: 'Q' },
      ]

      usePlayerStore.getState().setHand(hand)
      expect(usePlayerStore.getState().hand.length).toBe(3)

      // Remove only the second card
      usePlayerStore.getState().removeCardFromHand('spades-A')

      const remainingHand = usePlayerStore.getState().hand
      expect(remainingHand.length).toBe(2)
      expect(remainingHand[0].id).toBe('hearts-K')
      expect(remainingHand[1].id).toBe('diamonds-Q')
    })

    it('should not remove any cards if ID does not match', () => {
      const hand: Card[] = [
        { id: 'hearts-K', suit: 'hearts', rank: 'K' },
        { id: 'spades-A', suit: 'spades', rank: 'A' },
      ]

      usePlayerStore.getState().setHand(hand)

      // Try to remove a card that doesn't exist
      usePlayerStore.getState().removeCardFromHand('clubs-7')

      const remainingHand = usePlayerStore.getState().hand
      expect(remainingHand.length).toBe(2)
      expect(remainingHand[0].id).toBe('hearts-K')
      expect(remainingHand[1].id).toBe('spades-A')
    })

    it('should remove the first card correctly', () => {
      const hand: Card[] = [
        { id: 'hearts-6', suit: 'hearts', rank: '6' },
        { id: 'hearts-7', suit: 'hearts', rank: '7' },
        { id: 'hearts-8', suit: 'hearts', rank: '8' },
      ]

      usePlayerStore.getState().setHand(hand)

      // Remove the first card
      usePlayerStore.getState().removeCardFromHand('hearts-6')

      const remainingHand = usePlayerStore.getState().hand
      expect(remainingHand.length).toBe(2)
      expect(remainingHand[0].id).toBe('hearts-7')
      expect(remainingHand[1].id).toBe('hearts-8')
    })

    it('should remove the last card correctly', () => {
      const hand: Card[] = [
        { id: 'hearts-6', suit: 'hearts', rank: '6' },
        { id: 'hearts-7', suit: 'hearts', rank: '7' },
        { id: 'hearts-8', suit: 'hearts', rank: '8' },
      ]

      usePlayerStore.getState().setHand(hand)

      // Remove the last card
      usePlayerStore.getState().removeCardFromHand('hearts-8')

      const remainingHand = usePlayerStore.getState().hand
      expect(remainingHand.length).toBe(2)
      expect(remainingHand[0].id).toBe('hearts-6')
      expect(remainingHand[1].id).toBe('hearts-7')
    })

    it('should handle empty hand gracefully', () => {
      usePlayerStore.getState().setHand([])

      // Try to remove a card from empty hand
      usePlayerStore.getState().removeCardFromHand('hearts-K')

      expect(usePlayerStore.getState().hand.length).toBe(0)
    })
  })

  describe('hand management', () => {
    it('should set hand correctly', () => {
      const hand: Card[] = [
        { id: 'hearts-K', suit: 'hearts', rank: 'K' },
        { id: 'spades-A', suit: 'spades', rank: 'A' },
      ]

      usePlayerStore.getState().setHand(hand)

      expect(usePlayerStore.getState().hand).toEqual(hand)
    })

    it('should add card to hand', () => {
      usePlayerStore.getState().setHand([])

      const card: Card = { id: 'hearts-K', suit: 'hearts', rank: 'K' }
      usePlayerStore.getState().addCardToHand(card)

      expect(usePlayerStore.getState().hand.length).toBe(1)
      expect(usePlayerStore.getState().hand[0]).toEqual(card)
    })
  })
})
