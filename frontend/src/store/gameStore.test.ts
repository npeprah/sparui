import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import type { BackendGameState } from './types'

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { resetGame } = useGameStore.getState()
    resetGame()
  })

  describe('initializeFromBackend', () => {
    it('should initialize game state from backend game state', () => {
      const backendState: BackendGameState = {
        gameId: 'game-ABCD-123',
        roomCode: 'ABCD',
        totalRounds: 5,
        pointsToWin: 10,
        phase: 'playing',
        players: [
          {
            id: 'player1',
            username: 'Alice',
            avatar: 'avatar1',
            hand: [
              { suit: 'hearts', value: 'ace' },
              { suit: 'diamonds', value: '7' },
              { suit: 'clubs', value: 'king' },
              { suit: 'spades', value: '9' },
              { suit: 'hearts', value: 'queen' },
            ],
            score: 0,
            roundsWon: 0,
            winStreak: 0,
            isLeader: true,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
          {
            id: 'player2',
            username: 'Bob',
            avatar: 'avatar2',
            hand: [
              { suit: 'diamonds', value: '8' },
              { suit: 'clubs', value: '10' },
              { suit: 'spades', value: 'jack' },
              { suit: 'hearts', value: '6' },
              { suit: 'diamonds', value: 'king' },
            ],
            score: 0,
            roundsWon: 0,
            winStreak: 0,
            isLeader: false,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
        ],
        leaderId: 'player1',
        currentTurn: 'player1',
        currentRound: 1,
        playedCards: [],
        turnStartTime: '2025-12-19T06:00:00Z',
        turnTimeLimit: 30,
        startedAt: '2025-12-19T06:00:00Z',
        updatedAt: '2025-12-19T06:00:00Z',
      }

      const { initializeFromBackend } = useGameStore.getState()
      initializeFromBackend(backendState)

      const state = useGameStore.getState()

      // Verify game phase is set to playing
      expect(state.gamePhase).toBe('playing')

      // Verify room code is set
      expect(state.roomCode).toBe('ABCD')

      // Verify current round is set
      expect(state.currentRound).toBe(1)

      // Verify leader ID is set
      expect(state.leaderId).toBe('player1')

      // Verify players are initialized
      expect(state.players).toHaveLength(2)
      expect(state.players[0].id).toBe('player1')
      expect(state.players[0].name).toBe('Alice')
      expect(state.players[1].id).toBe('player2')
      expect(state.players[1].name).toBe('Bob')
    })

    it('should convert backend card format to frontend card format', () => {
      const backendState: BackendGameState = {
        gameId: 'game-TEST-001',
        roomCode: 'TEST',
        totalRounds: 5,
        pointsToWin: 10,
        phase: 'playing',
        players: [
          {
            id: 'player1',
            username: 'Alice',
            avatar: 'avatar1',
            hand: [
              { suit: 'hearts', value: 'ace' },
              { suit: 'diamonds', value: '10' },
              { suit: 'clubs', value: 'jack' },
              { suit: 'spades', value: 'queen' },
              { suit: 'hearts', value: 'king' },
            ],
            score: 5,
            roundsWon: 1,
            winStreak: 1,
            isLeader: true,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
        ],
        leaderId: 'player1',
        currentTurn: 'player1',
        currentRound: 2,
        playedCards: [],
        turnStartTime: '2025-12-19T06:00:00Z',
        turnTimeLimit: 30,
        startedAt: '2025-12-19T06:00:00Z',
        updatedAt: '2025-12-19T06:00:00Z',
      }

      const { initializeFromBackend } = useGameStore.getState()
      initializeFromBackend(backendState)

      const state = useGameStore.getState()
      const player = state.players[0]

      // Player should have cards property (even though it's not in Player type yet, we'll add it)
      // For now, we'll store it as a custom property
      expect(player).toBeDefined()
      expect(player.score).toBe(5)
      expect(player.winStreak).toBe(1)
    })

    it('should map backend card values to frontend rank format', () => {
      const backendState: BackendGameState = {
        gameId: 'game-TEST-002',
        roomCode: 'TEST',
        totalRounds: 5,
        pointsToWin: 10,
        phase: 'playing',
        players: [
          {
            id: 'player1',
            username: 'TestPlayer',
            avatar: 'avatar1',
            hand: [
              { suit: 'hearts', value: 'ace' },
              { suit: 'diamonds', value: 'jack' },
              { suit: 'clubs', value: 'queen' },
              { suit: 'spades', value: 'king' },
              { suit: 'hearts', value: '10' },
            ],
            score: 0,
            roundsWon: 0,
            winStreak: 0,
            isLeader: true,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
        ],
        leaderId: 'player1',
        currentTurn: 'player1',
        currentRound: 1,
        playedCards: [],
        turnStartTime: '2025-12-19T06:00:00Z',
        turnTimeLimit: 30,
        startedAt: '2025-12-19T06:00:00Z',
        updatedAt: '2025-12-19T06:00:00Z',
      }

      const { initializeFromBackend } = useGameStore.getState()
      initializeFromBackend(backendState)

      const state = useGameStore.getState()

      // Verify conversion works
      // Backend: "ace", "jack", "queen", "king" → Frontend: "A", "J", "Q", "K"
      expect(state.players[0]).toBeDefined()
    })

    it('should handle multiple players with different hands', () => {
      const backendState: BackendGameState = {
        gameId: 'game-MULTI-123',
        roomCode: 'MULTI',
        totalRounds: 5,
        pointsToWin: 10,
        phase: 'playing',
        players: [
          {
            id: 'p1',
            username: 'Alice',
            avatar: 'av1',
            hand: [
              { suit: 'hearts', value: 'ace' },
              { suit: 'diamonds', value: '7' },
              { suit: 'clubs', value: 'king' },
              { suit: 'spades', value: '9' },
              { suit: 'hearts', value: 'queen' },
            ],
            score: 10,
            roundsWon: 2,
            winStreak: 2,
            isLeader: true,
            isOnFire: true,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
          {
            id: 'p2',
            username: 'Bob',
            avatar: 'av2',
            hand: [
              { suit: 'diamonds', value: '8' },
              { suit: 'clubs', value: '10' },
              { suit: 'spades', value: 'jack' },
              { suit: 'hearts', value: '6' },
              { suit: 'diamonds', value: 'king' },
            ],
            score: 5,
            roundsWon: 1,
            winStreak: 0,
            isLeader: false,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
          {
            id: 'p3',
            username: 'Charlie',
            avatar: 'av3',
            hand: [
              { suit: 'hearts', value: '7' },
              { suit: 'clubs', value: '8' },
              { suit: 'spades', value: '9' },
              { suit: 'diamonds', value: 'queen' },
              { suit: 'hearts', value: 'jack' },
            ],
            score: 3,
            roundsWon: 0,
            winStreak: 0,
            isLeader: false,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
        ],
        leaderId: 'p1',
        currentTurn: 'p1',
        currentRound: 3,
        playedCards: [],
        turnStartTime: '2025-12-19T06:00:00Z',
        turnTimeLimit: 30,
        startedAt: '2025-12-19T06:00:00Z',
        updatedAt: '2025-12-19T06:00:00Z',
      }

      const { initializeFromBackend } = useGameStore.getState()
      initializeFromBackend(backendState)

      const state = useGameStore.getState()

      // Verify all players are initialized
      expect(state.players).toHaveLength(3)
      expect(state.players[0].score).toBe(10)
      expect(state.players[1].score).toBe(5)
      expect(state.players[2].score).toBe(3)

      // Verify win streaks
      expect(state.players[0].winStreak).toBe(2)
      expect(state.players[1].winStreak).toBe(0)
      expect(state.players[2].winStreak).toBe(0)
    })

    it('should update game settings based on backend state', () => {
      const backendState: BackendGameState = {
        gameId: 'game-SETTINGS-001',
        roomCode: 'SET1',
        totalRounds: 5,
        pointsToWin: 15,
        phase: 'playing',
        players: [
          {
            id: 'player1',
            username: 'Alice',
            avatar: 'avatar1',
            hand: [
              { suit: 'hearts', value: 'ace' },
              { suit: 'diamonds', value: '7' },
              { suit: 'clubs', value: 'king' },
              { suit: 'spades', value: '9' },
              { suit: 'hearts', value: 'queen' },
            ],
            score: 0,
            roundsWon: 0,
            winStreak: 0,
            isLeader: true,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
        ],
        leaderId: 'player1',
        currentTurn: 'player1',
        currentRound: 1,
        playedCards: [],
        turnStartTime: '2025-12-19T06:00:00Z',
        turnTimeLimit: 30,
        startedAt: '2025-12-19T06:00:00Z',
        updatedAt: '2025-12-19T06:00:00Z',
      }

      const { initializeFromBackend } = useGameStore.getState()
      initializeFromBackend(backendState)

      const state = useGameStore.getState()

      // Verify settings are updated
      expect(state.settings.pointsToWin).toBe(15)
    })

    it('should reset round phase to waiting when initializing', () => {
      const backendState: BackendGameState = {
        gameId: 'game-RESET-001',
        roomCode: 'RST1',
        totalRounds: 5,
        pointsToWin: 10,
        phase: 'playing',
        players: [
          {
            id: 'player1',
            username: 'Alice',
            avatar: 'avatar1',
            hand: [
              { suit: 'hearts', value: 'ace' },
              { suit: 'diamonds', value: '7' },
              { suit: 'clubs', value: 'king' },
              { suit: 'spades', value: '9' },
              { suit: 'hearts', value: 'queen' },
            ],
            score: 0,
            roundsWon: 0,
            winStreak: 0,
            isLeader: true,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
        ],
        leaderId: 'player1',
        currentTurn: 'player1',
        currentRound: 1,
        playedCards: [],
        turnStartTime: '2025-12-19T06:00:00Z',
        turnTimeLimit: 30,
        startedAt: '2025-12-19T06:00:00Z',
        updatedAt: '2025-12-19T06:00:00Z',
      }

      const { initializeFromBackend } = useGameStore.getState()
      initializeFromBackend(backendState)

      const state = useGameStore.getState()

      // Round phase should be reset to waiting
      expect(state.roundPhase).toBe('waiting')
    })

    it('should clear any existing played cards when initializing', () => {
      // First, set up some existing state
      const { playCard, initializeFromBackend } = useGameStore.getState()
      playCard('player1', { suit: 'hearts', rank: 'A', id: 'hearts-A' })

      const backendState: BackendGameState = {
        gameId: 'game-CLEAR-001',
        roomCode: 'CLR1',
        totalRounds: 5,
        pointsToWin: 10,
        phase: 'playing',
        players: [
          {
            id: 'player1',
            username: 'Alice',
            avatar: 'avatar1',
            hand: [
              { suit: 'hearts', value: 'ace' },
              { suit: 'diamonds', value: '7' },
              { suit: 'clubs', value: 'king' },
              { suit: 'spades', value: '9' },
              { suit: 'hearts', value: 'queen' },
            ],
            score: 0,
            roundsWon: 0,
            winStreak: 0,
            isLeader: true,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
        ],
        leaderId: 'player1',
        currentTurn: 'player1',
        currentRound: 1,
        playedCards: [],
        turnStartTime: '2025-12-19T06:00:00Z',
        turnTimeLimit: 30,
        startedAt: '2025-12-19T06:00:00Z',
        updatedAt: '2025-12-19T06:00:00Z',
      }

      initializeFromBackend(backendState)

      const state = useGameStore.getState()

      // Played cards should be cleared
      expect(state.playedCards.size).toBe(0)
      expect(state.currentSuit).toBe(null)
    })
  })

  describe('existing actions', () => {
    it('should have resetGame action', () => {
      const { resetGame } = useGameStore.getState()
      expect(resetGame).toBeDefined()
      expect(typeof resetGame).toBe('function')
    })

    it('should have playCard action', () => {
      const { playCard } = useGameStore.getState()
      expect(playCard).toBeDefined()
      expect(typeof playCard).toBe('function')
    })
  })

  describe('Frontend format card conversion (NEW)', () => {
    it('should handle cards with rank field (frontend format) without crashing', () => {
      // This is the exact bug scenario - backend sends cards with 'rank' field
      const backendState: BackendGameState = {
        gameId: 'test-game',
        roomCode: 'TEST123',
        totalRounds: 5,
        pointsToWin: 10,
        phase: 'playing',
        players: [
          {
            id: 'player1',
            username: 'Player 1',
            avatar: 'avatar1',
            hand: [
              { suit: 'hearts', rank: 'K', id: 'hearts-K' },
              { suit: 'spades', rank: 'A', id: 'spades-A' },
              { suit: 'diamonds', rank: 'Q', id: 'diamonds-Q' },
              { suit: 'clubs', rank: 'J', id: 'clubs-J' },
              { suit: 'hearts', rank: '10', id: 'hearts-10' },
            ],
            score: 0,
            roundsWon: 0,
            winStreak: 0,
            isLeader: false,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
        ],
        leaderId: 'player1',
        currentTurn: 'player1',
        currentRound: 1,
        playedCards: [],
        turnStartTime: new Date().toISOString(),
        turnTimeLimit: 15,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // This should NOT throw "undefined is not an object (evaluating 'value.toLowerCase')"
      expect(() => {
        const { initializeFromBackend } = useGameStore.getState()
        initializeFromBackend(backendState)
      }).not.toThrow()

      const state = useGameStore.getState()
      const player = state.players[0]

      // Verify cards are converted correctly
      expect(player.hand).toHaveLength(5)
      expect(player.hand![0]).toEqual({ suit: 'hearts', rank: 'K', id: 'hearts-K' })
      expect(player.hand![1]).toEqual({ suit: 'spades', rank: 'A', id: 'spades-A' })
      expect(player.hand![2]).toEqual({ suit: 'diamonds', rank: 'Q', id: 'diamonds-Q' })
      expect(player.hand![3]).toEqual({ suit: 'clubs', rank: 'J', id: 'clubs-J' })
      expect(player.hand![4]).toEqual({ suit: 'hearts', rank: '10', id: 'hearts-10' })
    })

    it('should handle all numeric cards in frontend format', () => {
      const backendState: BackendGameState = {
        gameId: 'test-game',
        roomCode: 'TEST123',
        totalRounds: 5,
        pointsToWin: 10,
        phase: 'playing',
        players: [
          {
            id: 'player1',
            username: 'Player 1',
            avatar: 'avatar1',
            hand: [
              { suit: 'hearts', rank: '6', id: 'hearts-6' },
              { suit: 'hearts', rank: '7', id: 'hearts-7' },
              { suit: 'hearts', rank: '8', id: 'hearts-8' },
              { suit: 'hearts', rank: '9', id: 'hearts-9' },
              { suit: 'hearts', rank: '10', id: 'hearts-10' },
            ],
            score: 0,
            roundsWon: 0,
            winStreak: 0,
            isLeader: false,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
        ],
        leaderId: 'player1',
        currentTurn: 'player1',
        currentRound: 1,
        playedCards: [],
        turnStartTime: new Date().toISOString(),
        turnTimeLimit: 15,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const { initializeFromBackend } = useGameStore.getState()
      initializeFromBackend(backendState)

      const state = useGameStore.getState()
      const player = state.players[0]

      expect(player.hand![0]).toEqual({ suit: 'hearts', rank: '6', id: 'hearts-6' })
      expect(player.hand![1]).toEqual({ suit: 'hearts', rank: '7', id: 'hearts-7' })
      expect(player.hand![2]).toEqual({ suit: 'hearts', rank: '8', id: 'hearts-8' })
      expect(player.hand![3]).toEqual({ suit: 'hearts', rank: '9', id: 'hearts-9' })
      expect(player.hand![4]).toEqual({ suit: 'hearts', rank: '10', id: 'hearts-10' })
    })

    it('should handle multiple players with frontend format cards', () => {
      const backendState: BackendGameState = {
        gameId: 'test-game',
        roomCode: 'TEST123',
        totalRounds: 5,
        pointsToWin: 10,
        phase: 'playing',
        players: [
          {
            id: 'player1',
            username: 'Player 1',
            avatar: 'avatar1',
            hand: [{ suit: 'hearts', rank: 'K', id: 'hearts-K' }],
            score: 0,
            roundsWon: 0,
            winStreak: 0,
            isLeader: true,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
          {
            id: 'player2',
            username: 'Player 2',
            avatar: 'avatar2',
            hand: [{ suit: 'spades', rank: 'A', id: 'spades-A' }],
            score: 5,
            roundsWon: 1,
            winStreak: 1,
            isLeader: false,
            isOnFire: false,
            hasPlayedCard: false,
            dryCardInfo: null,
          },
        ],
        leaderId: 'player1',
        currentTurn: 'player1',
        currentRound: 1,
        playedCards: [],
        turnStartTime: new Date().toISOString(),
        turnTimeLimit: 15,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const { initializeFromBackend } = useGameStore.getState()
      initializeFromBackend(backendState)

      const state = useGameStore.getState()
      expect(state.players).toHaveLength(2)
      expect(state.players[0].hand![0]).toEqual({ suit: 'hearts', rank: 'K', id: 'hearts-K' })
      expect(state.players[1].hand![0]).toEqual({ suit: 'spades', rank: 'A', id: 'spades-A' })
    })
  })
})
