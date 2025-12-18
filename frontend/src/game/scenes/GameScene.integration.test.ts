import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { usePlayerStore } from '../../store/playerStore'
import type { Player, Card } from '../../store/types'
import { mapPlayersToPositions } from '../utils/playerPositions'
import { getPlayableCards } from '../utils/sparRules'

/**
 * Integration tests for GameScene state synchronization
 * Note: These tests verify state sync logic without instantiating Phaser
 */
describe('GameScene - State Integration Logic', () => {
  beforeEach(() => {
    // Reset stores
    useGameStore.getState().resetGame()
    usePlayerStore.getState().resetGameState()
    usePlayerStore.getState().setPlayerId('player-1')
  })

  describe('Store subscription', () => {
    it('should react to hand changes in playerStore', () => {
      let handUpdateCount = 0
      const unsubscribe = usePlayerStore.subscribe((state) => {
        if (state.hand.length > 0) {
          handUpdateCount++
        }
      })

      usePlayerStore.getState().setHand([
        { id: 'card-1', suit: 'hearts', rank: '6' },
      ])

      expect(handUpdateCount).toBeGreaterThan(0)
      unsubscribe()
    })

    it('should react to currentSuit changes in gameStore', () => {
      let suitUpdateCount = 0
      const unsubscribe = useGameStore.subscribe((state) => {
        if (state.currentSuit) {
          suitUpdateCount++
        }
      })

      useGameStore.getState().playCard('player-2', {
        id: 'card-1',
        suit: 'hearts',
        rank: 'K',
      })

      expect(suitUpdateCount).toBeGreaterThan(0)
      unsubscribe()
    })
  })

  describe('Playable cards determination', () => {
    it('should determine all cards as playable when no currentSuit (player is leader)', () => {
      const hand: Card[] = [
        { id: 'card-1', suit: 'hearts', rank: '6' },
        { id: 'card-2', suit: 'clubs', rank: '7' },
      ]

      const playableCards = getPlayableCards(hand, null)

      expect(playableCards.length).toBe(2)
    })

    it('should determine only matching suit cards as playable when suit is led', () => {
      const hand: Card[] = [
        { id: 'card-1', suit: 'hearts', rank: '6' },
        { id: 'card-2', suit: 'hearts', rank: '7' },
        { id: 'card-3', suit: 'clubs', rank: 'J' },
      ]

      // Someone led hearts
      const playableCards = getPlayableCards(hand, 'hearts')

      expect(playableCards.length).toBe(2)
      expect(playableCards.every((c) => c.suit === 'hearts')).toBe(true)
    })

    it('should determine all cards as playable when player is out of led suit', () => {
      const hand: Card[] = [
        { id: 'card-1', suit: 'clubs', rank: '6' },
        { id: 'card-2', suit: 'diamonds', rank: '7' },
        { id: 'card-3', suit: 'spades', rank: 'J' },
      ]

      // Someone led hearts, but player has no hearts
      const playableCards = getPlayableCards(hand, 'hearts')

      expect(playableCards.length).toBe(3)
    })

    it('should integrate with gameStore currentSuit', () => {
      const hand: Card[] = [
        { id: 'card-1', suit: 'hearts', rank: '6' },
        { id: 'card-2', suit: 'clubs', rank: '7' },
      ]

      // Set current suit in store
      useGameStore.getState().playCard('player-2', {
        id: 'other-card',
        suit: 'hearts',
        rank: 'K',
      })

      const currentSuit = useGameStore.getState().currentSuit
      expect(currentSuit).toBe('hearts')

      const playableCards = getPlayableCards(hand, currentSuit as any)
      expect(playableCards.length).toBe(1)
      expect(playableCards[0].suit).toBe('hearts')
    })
  })

  describe('Player mapping integration', () => {
    it('should map current player to bottom position', () => {
      const players: Player[] = [
        {
          id: 'player-1',
          name: 'Alice',
          score: 0,
          isReady: true,
          isConnected: true,
          winStreak: 0,
        },
        {
          id: 'player-2',
          name: 'Bob',
          score: 0,
          isReady: true,
          isConnected: true,
          winStreak: 0,
        },
      ]

      const currentPlayerId = usePlayerStore.getState().playerId
      const positionMap = mapPlayersToPositions(players, currentPlayerId)

      expect(positionMap.get('bottom')).toBe('player-1')
      expect(positionMap.get('top')).toBe('player-2')
    })

    it('should integrate with gameStore players', () => {
      const players: Player[] = [
        {
          id: 'player-1',
          name: 'Alice',
          score: 0,
          isReady: true,
          isConnected: true,
          winStreak: 0,
        },
        {
          id: 'player-2',
          name: 'Bob',
          score: 0,
          isReady: true,
          isConnected: true,
          winStreak: 0,
        },
      ]

      players.forEach((player) => useGameStore.getState().addPlayer(player))

      const storePlayers = useGameStore.getState().players
      expect(storePlayers.length).toBe(2)

      const currentPlayerId = usePlayerStore.getState().playerId
      const positionMap = mapPlayersToPositions(storePlayers, currentPlayerId)

      expect(positionMap.get('bottom')).toBe('player-1')
    })
  })

  describe('State sync workflow', () => {
    it('should sync hand state from playerStore to display', () => {
      // Set initial hand
      usePlayerStore.getState().setHand([
        { id: 'card-1', suit: 'hearts', rank: '6' },
        { id: 'card-2', suit: 'clubs', rank: '7' },
      ])

      const hand = usePlayerStore.getState().hand
      expect(hand.length).toBe(2)

      // In GameScene, this would trigger syncPlayerHand()
      // which would create CardSprite instances for each card
    })

    it('should sync playable state based on turn and suit', () => {
      const hand: Card[] = [
        { id: 'card-1', suit: 'hearts', rank: '6' },
        { id: 'card-2', suit: 'clubs', rank: '7' },
      ]

      // Not player's turn
      usePlayerStore.getState().setIsMyTurn(false)
      expect(usePlayerStore.getState().isMyTurn).toBe(false)

      // When not player's turn, no cards should be playable
      // This would be handled by updatePlayableCards() in GameScene

      // Player's turn
      usePlayerStore.getState().setIsMyTurn(true)
      expect(usePlayerStore.getState().isMyTurn).toBe(true)

      // With no current suit, all cards should be playable
      const playableCards = getPlayableCards(hand, null)
      expect(playableCards.length).toBe(2)
    })
  })
})
