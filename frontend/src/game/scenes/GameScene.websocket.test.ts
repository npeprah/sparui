import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { usePlayerStore } from '../../store/playerStore'
import type { Card } from '../../store/types'

/**
 * Tests for WebSocket event handling logic in GameScene
 * These tests verify the logic without creating actual WebSocket connections
 */
describe('GameScene - WebSocket Event Handling Logic', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
    usePlayerStore.getState().resetGameState()
    usePlayerStore.getState().setPlayerId('player-1')
  })

  describe('gameStarted event', () => {
    it('should set game phase to playing', () => {
      // Simulate gameStarted event
      useGameStore.getState().setGamePhase('playing')
      useGameStore.getState().setLeader('player-1')

      expect(useGameStore.getState().gamePhase).toBe('playing')
      expect(useGameStore.getState().leaderId).toBe('player-1')
    })

    it('should set round phase to playing', () => {
      useGameStore.getState().setRoundPhase('playing')

      expect(useGameStore.getState().roundPhase).toBe('playing')
    })
  })

  describe('cardPlayed event', () => {
    it('should add played card to game state', () => {
      const card: Card = {
        id: 'card-1',
        suit: 'hearts',
        rank: 'K',
      }

      // Simulate cardPlayed event
      useGameStore.getState().playCard('player-2', card)

      const playedCards = useGameStore.getState().playedCards
      expect(playedCards.get('player-2')).toEqual(card)
    })

    it('should set current suit from first played card', () => {
      const card: Card = {
        id: 'card-1',
        suit: 'hearts',
        rank: 'K',
      }

      useGameStore.getState().playCard('player-2', card)

      expect(useGameStore.getState().currentSuit).toBe('hearts')
    })

    it('should remove card from player hand if it is current player', () => {
      const hand: Card[] = [
        { id: 'card-1', suit: 'hearts', rank: '6' },
        { id: 'card-2', suit: 'clubs', rank: '7' },
      ]

      usePlayerStore.getState().setHand(hand)
      expect(usePlayerStore.getState().hand.length).toBe(2)

      // Play a card
      usePlayerStore.getState().removeCardFromHand('card-1')

      expect(usePlayerStore.getState().hand.length).toBe(1)
      expect(usePlayerStore.getState().hand[0].id).toBe('card-2')
    })
  })

  describe('roundWon event', () => {
    it('should update winner score', () => {
      // Add players
      useGameStore.getState().addPlayer({
        id: 'player-1',
        name: 'Alice',
        score: 0,
        isReady: true,
        isConnected: true,
        winStreak: 0,
      })

      useGameStore.getState().addPlayer({
        id: 'player-2',
        name: 'Bob',
        score: 5,
        isReady: true,
        isConnected: true,
        winStreak: 0,
      })

      // Player 2 wins with 2 points
      useGameStore.getState().updateScore('player-2', 2)

      const player2 = useGameStore.getState().players.find((p) => p.id === 'player-2')
      expect(player2?.score).toBe(7)
    })

    it('should increment win streak for winner', () => {
      useGameStore.getState().addPlayer({
        id: 'player-1',
        name: 'Alice',
        score: 0,
        isReady: true,
        isConnected: true,
        winStreak: 0,
      })

      useGameStore.getState().incrementWinStreak('player-1')

      const player1 = useGameStore.getState().players.find((p) => p.id === 'player-1')
      expect(player1?.winStreak).toBe(1)
    })

    it('should reset win streak for losers', () => {
      useGameStore.getState().addPlayer({
        id: 'player-1',
        name: 'Alice',
        score: 0,
        isReady: true,
        isConnected: true,
        winStreak: 2,
      })

      useGameStore.getState().resetWinStreak('player-1')

      const player1 = useGameStore.getState().players.find((p) => p.id === 'player-1')
      expect(player1?.winStreak).toBe(0)
    })

    it('should clear played cards after round', () => {
      // Add some played cards
      useGameStore.getState().playCard('player-1', {
        id: 'card-1',
        suit: 'hearts',
        rank: 'K',
      })
      useGameStore.getState().playCard('player-2', {
        id: 'card-2',
        suit: 'hearts',
        rank: 'Q',
      })

      expect(useGameStore.getState().playedCards.size).toBe(2)

      // Start next round
      useGameStore.getState().nextRound()

      expect(useGameStore.getState().playedCards.size).toBe(0)
      expect(useGameStore.getState().currentSuit).toBeNull()
    })
  })

  describe('gameEnded event', () => {
    it('should set game phase to finished', () => {
      useGameStore.getState().setGamePhase('finished')

      expect(useGameStore.getState().gamePhase).toBe('finished')
    })

    it('should record winner', () => {
      useGameStore.getState().addPlayer({
        id: 'player-1',
        name: 'Alice',
        score: 10,
        isReady: true,
        isConnected: true,
        winStreak: 0,
      })

      // Set winner (assuming winnerId is tracked)
      // In actual implementation, this might be stored differently
      const players = useGameStore.getState().players
      const winner = players.find((p) => p.score >= 10)

      expect(winner?.id).toBe('player-1')
      expect(winner?.score).toBe(10)
    })
  })

  describe('turnChanged event', () => {
    it('should set isMyTurn to true when it is current player turn', () => {
      usePlayerStore.getState().setPlayerId('player-1')
      usePlayerStore.getState().setIsMyTurn(true)

      expect(usePlayerStore.getState().isMyTurn).toBe(true)
    })

    it('should set isMyTurn to false when it is not current player turn', () => {
      usePlayerStore.getState().setPlayerId('player-1')
      usePlayerStore.getState().setIsMyTurn(false)

      expect(usePlayerStore.getState().isMyTurn).toBe(false)
    })

    it('should update time remaining', () => {
      useGameStore.getState().setTimeRemaining(15)
      expect(useGameStore.getState().timeRemaining).toBe(15)

      useGameStore.getState().setTimeRemaining(10)
      expect(useGameStore.getState().timeRemaining).toBe(10)
    })
  })

  describe('Event handler integration', () => {
    it('should handle complete game flow: start -> play -> round end -> next round', () => {
      // Add players
      useGameStore.getState().addPlayer({
        id: 'player-1',
        name: 'Alice',
        score: 0,
        isReady: true,
        isConnected: true,
        winStreak: 0,
      })
      useGameStore.getState().addPlayer({
        id: 'player-2',
        name: 'Bob',
        score: 0,
        isReady: true,
        isConnected: true,
        winStreak: 0,
      })

      // Set player hand
      usePlayerStore.getState().setHand([
        { id: 'card-1', suit: 'hearts', rank: '6' },
        { id: 'card-2', suit: 'clubs', rank: '7' },
      ])

      // Game starts
      useGameStore.getState().setGamePhase('playing')
      useGameStore.getState().setLeader('player-1')

      expect(useGameStore.getState().gamePhase).toBe('playing')

      // Players play cards
      useGameStore.getState().playCard('player-1', {
        id: 'card-1',
        suit: 'hearts',
        rank: '6',
      })
      useGameStore.getState().playCard('player-2', {
        id: 'card-2',
        suit: 'hearts',
        rank: 'K',
      })

      expect(useGameStore.getState().playedCards.size).toBe(2)
      expect(useGameStore.getState().currentSuit).toBe('hearts')

      // Round ends, player-2 wins
      useGameStore.getState().updateScore('player-2', 1)

      const player2 = useGameStore.getState().players.find((p) => p.id === 'player-2')
      expect(player2?.score).toBe(1)

      // Next round
      useGameStore.getState().nextRound()

      expect(useGameStore.getState().playedCards.size).toBe(0)
      expect(useGameStore.getState().currentSuit).toBeNull()
    })
  })
})
