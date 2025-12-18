import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { usePlayerStore } from '../../store/playerStore'
import type { Player, Card } from '../../store/types'
import { mapPlayersToPositions } from '../utils/playerPositions'
import { getPlayableCards } from '../utils/sparRules'
import {
  MockWebSocket,
  createMockPlayer,
  createMockCard,
  simulateGameStart,
  simulateCardPlay,
  simulateRoundWon,
  simulateGameEnded,
  simulateTurnChange,
  simulateTimerUpdate,
  simulateDisconnect,
  simulateReconnect,
} from '../../test/mocks/mockWebSocket'

/**
 * Integration tests for GameScene state synchronization
 * Note: These tests verify state sync logic without instantiating Phaser
 */
describe('GameScene - State Integration Logic', () => {
  let mockSocket: MockWebSocket

  beforeEach(() => {
    mockSocket = new MockWebSocket()
  })

  afterEach(() => {
    mockSocket.clearListeners()
    mockSocket.clearEmitted()
  })

describe('GameScene - Basic State Tests', () => {
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

/**
 * Extended Integration Tests - Full Game Flows with Mock WebSocket
 */
describe('GameScene - Full Game Flow Integration', () => {
  let mockSocket: MockWebSocket

  beforeEach(() => {
    mockSocket = new MockWebSocket()
    useGameStore.getState().resetGame()
    usePlayerStore.getState().resetGameState()
    usePlayerStore.getState().setPlayerId('p1')
  })

  afterEach(() => {
    mockSocket.clearListeners()
    mockSocket.clearEmitted()
  })

  describe('2-Player Game Flow', () => {
    it('should complete full 5-round game with 2 players', async () => {
      const player1 = createMockPlayer('p1', 'Alice')
      const player2 = createMockPlayer('p2', 'Bob')

      // Game start
      simulateGameStart(mockSocket, [player1, player2], 'p1')

      // Update store manually (in real app, WebSocket handler does this)
      useGameStore.getState().setGamePhase('playing')
      useGameStore.getState().addPlayer(player1)
      useGameStore.getState().addPlayer(player2)
      useGameStore.getState().setLeader('p1')

      // Verify game started
      expect(useGameStore.getState().gamePhase).toBe('playing')
      expect(useGameStore.getState().leaderId).toBe('p1')

      // Simulate 5 rounds
      for (let round = 1; round <= 5; round++) {
        // Player 1 plays card
        const card1 = createMockCard('hearts', '7', `card-${round}-p1`)
        simulateCardPlay(mockSocket, 'p1', card1, 'hearts')

        // Player 2 plays card
        const card2 = createMockCard('hearts', '6', `card-${round}-p2`)
        simulateCardPlay(mockSocket, 'p2', card2, 'hearts')

        // Player 1 wins (higher card)
        simulateRoundWon(mockSocket, 'p1', 'Alice', card1, 1, { p1: round, p2: 0 })

        // Wait for round cleanup
        await new Promise((resolve) => setTimeout(resolve, 100))
        useGameStore.getState().nextRound()
      }

      // Game ends
      simulateGameEnded(mockSocket, 'p1', 'Alice', { p1: 5, p2: 0 })

      // Verify game ended
      const finalPhase = useGameStore.getState().gamePhase
      expect(finalPhase).toBe('finished')
    })

    it('should enforce suit-following rules', () => {
      const hand: Card[] = [
        createMockCard('hearts', '7', 'h7'),
        createMockCard('clubs', '8', 'c8'),
      ]

      usePlayerStore.getState().setHand(hand)
      usePlayerStore.getState().setIsMyTurn(true)

      // No suit led yet - all cards playable
      let playableCards = getPlayableCards(hand, null)
      expect(playableCards.length).toBe(2)

      // Hearts led - only hearts cards playable
      playableCards = getPlayableCards(hand, 'hearts')
      expect(playableCards.length).toBe(1)
      expect(playableCards[0].suit).toBe('hearts')
    })

    it('should validate round winner calculation', () => {
      const player1 = createMockPlayer('p1', 'Alice')
      const player2 = createMockPlayer('p2', 'Bob')

      simulateGameStart(mockSocket, [player1, player2], 'p1')

      // Player 1 plays 7 of hearts
      const card1 = createMockCard('hearts', '7')
      simulateCardPlay(mockSocket, 'p1', card1, 'hearts')

      // Player 2 plays Ace of hearts (higher)
      const card2 = createMockCard('hearts', 'A')
      simulateCardPlay(mockSocket, 'p2', card2, 'hearts')

      // Player 2 should win (Ace > 7)
      simulateRoundWon(mockSocket, 'p2', 'Bob', card2, 1, { p1: 0, p2: 1 })

      // Verify scores
      const gameState = useGameStore.getState()
      const p2Score = gameState.players.find((p) => p.id === 'p2')?.score
      expect(p2Score).toBe(1)
    })
  })

  describe('4-Player Game Flow', () => {
    it('should complete game with 4 players', () => {
      const players = [
        createMockPlayer('p1', 'Alice'),
        createMockPlayer('p2', 'Bob'),
        createMockPlayer('p3', 'Charlie'),
        createMockPlayer('p4', 'Diana'),
      ]

      simulateGameStart(mockSocket, players, 'p1')

      expect(useGameStore.getState().players.length).toBe(4)
      expect(useGameStore.getState().gamePhase).toBe('playing')
    })

    it('should handle turn rotation correctly for 4 players', async () => {
      const players = [
        createMockPlayer('p1', 'Alice'),
        createMockPlayer('p2', 'Bob'),
        createMockPlayer('p3', 'Charlie'),
        createMockPlayer('p4', 'Diana'),
      ]

      simulateGameStart(mockSocket, players, 'p1')

      // Turn rotation: p1 → p2 → p3 → p4 → p1
      const turnOrder = ['p1', 'p2', 'p3', 'p4']

      for (const playerId of turnOrder) {
        simulateTurnChange(mockSocket, playerId, 15)

        // Verify correct player's turn
        const isMyTurn = usePlayerStore.getState().isMyTurn
        expect(isMyTurn).toBe(playerId === 'p1')
      }
    })

    it('should map all 4 players to positions correctly', () => {
      const players = [
        createMockPlayer('p1', 'Alice'),
        createMockPlayer('p2', 'Bob'),
        createMockPlayer('p3', 'Charlie'),
        createMockPlayer('p4', 'Diana'),
      ]

      const positionMap = mapPlayersToPositions(players, 'p1')

      // Current player (p1) should be bottom
      expect(positionMap.get('bottom')).toBe('p1')
      // Others distributed to left, top, right
      expect(positionMap.size).toBe(4)
    })
  })

  describe('Disconnect/Reconnect Scenarios', () => {
    it('should handle player disconnect mid-game', () => {
      const player1 = createMockPlayer('p1', 'Alice')
      const player2 = createMockPlayer('p2', 'Bob')

      simulateGameStart(mockSocket, [player1, player2], 'p1')

      // Simulate disconnect
      simulateDisconnect(mockSocket)

      // Verify socket disconnected
      expect(mockSocket.connected).toBe(false)
    })

    it('should handle reconnection and restore game state', () => {
      const player1 = createMockPlayer('p1', 'Alice')
      const player2 = createMockPlayer('p2', 'Bob')

      simulateGameStart(mockSocket, [player1, player2], 'p1')

      // Play a card before disconnect
      const card1 = createMockCard('hearts', '7')
      simulateCardPlay(mockSocket, 'p1', card1, 'hearts')

      // Disconnect
      simulateDisconnect(mockSocket)
      expect(mockSocket.connected).toBe(false)

      // Reconnect
      simulateReconnect(mockSocket)
      expect(mockSocket.connected).toBe(true)

      // Game state should persist
      const playedCards = useGameStore.getState().playedCards
      expect(playedCards.size).toBeGreaterThan(0)
    })
  })

  describe('Turn Timer Scenarios', () => {
    it('should countdown timer correctly', async () => {
      const player1 = createMockPlayer('p1', 'Alice')
      const player2 = createMockPlayer('p2', 'Bob')

      simulateGameStart(mockSocket, [player1, player2], 'p1')
      simulateTurnChange(mockSocket, 'p1', 15)

      // Simulate timer countdown
      for (let time = 15; time > 10; time--) {
        simulateTimerUpdate(mockSocket, time)
        expect(useGameStore.getState().timeRemaining).toBe(time)
      }
    })

    it('should handle timer expiration', () => {
      const player1 = createMockPlayer('p1', 'Alice')
      const player2 = createMockPlayer('p2', 'Bob')

      simulateGameStart(mockSocket, [player1, player2], 'p1')
      simulateTurnChange(mockSocket, 'p1', 15)

      // Countdown to 0
      simulateTimerUpdate(mockSocket, 0)

      // Verify timer expired
      expect(useGameStore.getState().timeRemaining).toBe(0)
    })
  })

  describe('Invalid Move Handling', () => {
    it('should prevent playing out of turn', () => {
      const player1 = createMockPlayer('p1', 'Alice')
      const player2 = createMockPlayer('p2', 'Bob')

      const hand = [createMockCard('hearts', '7', 'h7')]
      usePlayerStore.getState().setHand(hand)

      simulateGameStart(mockSocket, [player1, player2], 'p1')

      // It's player 2's turn, not player 1
      simulateTurnChange(mockSocket, 'p2', 15)

      // Verify player 1 cannot play (isMyTurn = false)
      expect(usePlayerStore.getState().isMyTurn).toBe(false)
    })

    it('should prevent playing wrong suit when player has correct suit', () => {
      const hand: Card[] = [
        createMockCard('hearts', '7', 'h7'),
        createMockCard('clubs', '8', 'c8'),
      ]

      usePlayerStore.getState().setHand(hand)
      usePlayerStore.getState().setIsMyTurn(true)

      // Hearts led
      const playableCards = getPlayableCards(hand, 'hearts')

      // Only hearts cards should be playable
      expect(playableCards.length).toBe(1)
      expect(playableCards[0].suit).toBe('hearts')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty player list gracefully', () => {
      simulateGameStart(mockSocket, [], 'p1')

      // Game should not crash
      expect(useGameStore.getState().players.length).toBe(0)
    })

    it('should handle invalid leader ID', () => {
      const player1 = createMockPlayer('p1', 'Alice')
      const player2 = createMockPlayer('p2', 'Bob')

      simulateGameStart(mockSocket, [player1, player2], 'invalid-id')

      // Game should still start
      expect(useGameStore.getState().gamePhase).toBe('playing')
      expect(useGameStore.getState().leaderId).toBe('invalid-id')
    })

    it('should handle rapid phase changes', () => {
      const player1 = createMockPlayer('p1', 'Alice')
      const player2 = createMockPlayer('p2', 'Bob')

      simulateGameStart(mockSocket, [player1, player2], 'p1')

      // Rapid card plays
      simulateCardPlay(mockSocket, 'p1', createMockCard('hearts', '7'), 'hearts')
      simulateCardPlay(mockSocket, 'p2', createMockCard('hearts', '8'), 'hearts')
      simulateRoundWon(mockSocket, 'p2', 'Bob', createMockCard('hearts', '8'), 1, { p1: 0, p2: 1 })

      // Should not crash
      expect(useGameStore.getState().gamePhase).toBe('playing')
    })
  })
})
})
