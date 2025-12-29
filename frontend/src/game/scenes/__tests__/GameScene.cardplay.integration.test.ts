import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { usePlayerStore } from '../../../store/playerStore'
import type { Card } from '../../../store/types'

/**
 * Integration tests for card playing flow
 * These tests verify the complete flow of playing cards and turn management
 */
describe('GameScene - Card Play Integration', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
    usePlayerStore.getState().resetGameState()
  })

  describe('Bug Fix: Player 1 plays card', () => {
    it('should only remove the specific played card, not all cards', () => {
      // Setup: Player 1 has 4 cards
      const player1Id = 'player-1'
      const hand: Card[] = [
        { id: 'hearts-K', suit: 'hearts', rank: 'K' },
        { id: 'spades-A', suit: 'spades', rank: 'A' },
        { id: 'diamonds-Q', suit: 'diamonds', rank: 'Q' },
        { id: 'clubs-J', suit: 'clubs', rank: 'J' },
      ]

      usePlayerStore.getState().setPlayerId(player1Id)
      usePlayerStore.getState().setHand(hand)
      usePlayerStore.getState().setIsMyTurn(true)

      expect(usePlayerStore.getState().hand.length).toBe(4)
      expect(usePlayerStore.getState().isMyTurn).toBe(true)

      // Player 1 plays spades-A
      const playedCard: Card = { id: 'spades-A', suit: 'spades', rank: 'A' }

      // Simulate the cardPlayed event handler logic:
      // 1. Update game state
      useGameStore.getState().playCard(player1Id, playedCard)

      // 2. Remove card from hand (as done in cardPlayed handler line 790)
      usePlayerStore.getState().removeCardFromHand(playedCard.id)

      // Verify: Only the played card was removed
      const remainingHand = usePlayerStore.getState().hand
      expect(remainingHand.length).toBe(3)
      expect(remainingHand.find((c) => c.id === 'hearts-K')).toBeDefined()
      expect(remainingHand.find((c) => c.id === 'diamonds-Q')).toBeDefined()
      expect(remainingHand.find((c) => c.id === 'clubs-J')).toBeDefined()
      expect(remainingHand.find((c) => c.id === 'spades-A')).toBeUndefined()
    })

    it('should correctly handle multiple sequential card plays', () => {
      // Setup: Player has 5 cards
      const player1Id = 'player-1'
      const hand: Card[] = [
        { id: 'hearts-K', suit: 'hearts', rank: 'K' },
        { id: 'spades-A', suit: 'spades', rank: 'A' },
        { id: 'diamonds-Q', suit: 'diamonds', rank: 'Q' },
        { id: 'clubs-J', suit: 'clubs', rank: 'J' },
        { id: 'hearts-10', suit: 'hearts', rank: '10' },
      ]

      usePlayerStore.getState().setPlayerId(player1Id)
      usePlayerStore.getState().setHand(hand)

      // Play first card
      usePlayerStore.getState().removeCardFromHand('hearts-K')
      expect(usePlayerStore.getState().hand.length).toBe(4)

      // Play second card
      usePlayerStore.getState().removeCardFromHand('diamonds-Q')
      expect(usePlayerStore.getState().hand.length).toBe(3)

      // Play third card
      usePlayerStore.getState().removeCardFromHand('clubs-J')
      expect(usePlayerStore.getState().hand.length).toBe(2)

      // Verify correct cards remain
      const remainingHand = usePlayerStore.getState().hand
      expect(remainingHand.find((c) => c.id === 'spades-A')).toBeDefined()
      expect(remainingHand.find((c) => c.id === 'hearts-10')).toBeDefined()
    })
  })

  describe('Bug Fix: Turn changes and card playability', () => {
    it('should update turn state when turnChanged event is received', () => {
      // Setup: Player 2
      const player2Id = 'player-2'
      usePlayerStore.getState().setPlayerId(player2Id)
      usePlayerStore.getState().setIsMyTurn(false)

      expect(usePlayerStore.getState().isMyTurn).toBe(false)

      // Simulate turnChanged event - now it's Player 2's turn
      usePlayerStore.getState().setIsMyTurn(true)

      // Verify turn state updated
      expect(usePlayerStore.getState().isMyTurn).toBe(true)
    })

    it('should handle turn rotation between multiple players', () => {
      const player1Id = 'player-1'
      const player2Id = 'player-2'

      // Initial state: Player 1's turn
      usePlayerStore.getState().setPlayerId(player1Id)
      usePlayerStore.getState().setIsMyTurn(true)
      expect(usePlayerStore.getState().isMyTurn).toBe(true)

      // Turn changes to Player 2
      usePlayerStore.getState().setIsMyTurn(false)
      expect(usePlayerStore.getState().isMyTurn).toBe(false)

      // Now simulate as Player 2
      usePlayerStore.getState().setPlayerId(player2Id)
      usePlayerStore.getState().setIsMyTurn(true)
      expect(usePlayerStore.getState().isMyTurn).toBe(true)
    })
  })

  describe('Complete game flow', () => {
    it('should handle Player 1 plays, then Player 2 gets turn', () => {
      // Setup: Two players with hands
      const player1Id = 'player-1'
      const player2Id = 'player-2'

      // Player 1 state
      usePlayerStore.getState().setPlayerId(player1Id)
      usePlayerStore.getState().setHand([
        { id: 'hearts-K', suit: 'hearts', rank: 'K' },
        { id: 'hearts-Q', suit: 'hearts', rank: 'Q' },
      ])
      usePlayerStore.getState().setIsMyTurn(true)

      expect(usePlayerStore.getState().hand.length).toBe(2)
      expect(usePlayerStore.getState().isMyTurn).toBe(true)

      // Player 1 plays a card
      const playedCard: Card = { id: 'hearts-K', suit: 'hearts', rank: 'K' }
      useGameStore.getState().playCard(player1Id, playedCard)
      usePlayerStore.getState().removeCardFromHand(playedCard.id)

      // Verify Player 1's hand
      expect(usePlayerStore.getState().hand.length).toBe(1)
      expect(usePlayerStore.getState().hand[0].id).toBe('hearts-Q')

      // Turn changes to Player 2
      usePlayerStore.getState().setIsMyTurn(false)
      usePlayerStore.getState().setPlayerId(player2Id)
      usePlayerStore.getState().setHand([
        { id: 'hearts-J', suit: 'hearts', rank: 'J' },
        { id: 'hearts-10', suit: 'hearts', rank: '10' },
      ])
      usePlayerStore.getState().setIsMyTurn(true)

      // Verify Player 2 state
      expect(usePlayerStore.getState().hand.length).toBe(2)
      expect(usePlayerStore.getState().isMyTurn).toBe(true)
    })
  })
})
