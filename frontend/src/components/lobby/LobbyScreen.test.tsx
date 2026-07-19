import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { LobbyScreen } from './LobbyScreen'
import { useLobbyStore, usePlayerStore, useUIStore, useGameStore } from '../../store'
import { socketService } from '../../services/socketService'
import type {
  RoomCreatedResponse,
  RoomPlayerJoinedResponse,
  RoomPlayerLeftResponse,
  RoomPlayerReadyResponse,
  RoomSettingsUpdatedResponse,
  GameStartedResponse,
} from '../../store/types'

// Mock socket service
vi.mock('../../services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    isConnected: vi.fn(() => true),
  },
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LobbyScreen - Backend Integration', () => {
  // Store event handlers for simulating server events
  const eventHandlers: Record<string, Function> = {}

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    mockNavigate.mockClear()

    // Reset stores
    useLobbyStore.getState().reset()
    usePlayerStore.setState({
      playerId: 'player-123',
      playerName: 'Test Player',
      token: 'test-token',
    })

    // Mock socket.on to capture event handlers
    vi.mocked(socketService.on).mockImplementation((event: string, handler: Function) => {
      eventHandlers[event] = handler
    })
  })

  const renderLobbyScreen = () => {
    return render(
      <BrowserRouter>
        <LobbyScreen />
      </BrowserRouter>
    )
  }

  describe('Room Creation', () => {
    it('should handle room:created event and update state', async () => {
      // Set up initial state - simulate being in connecting state
      useLobbyStore.setState({
        isConnecting: true,
        roomCode: null,
      })

      renderLobbyScreen()

      // Simulate server response
      const mockData: RoomCreatedResponse = {
        roomCode: 'ABC123',
        hostId: 'player-123',
        maxPlayers: 4,
        settings: {
          pointsToWin: 10,
          surfaceTheme: 'afro-heritage',
          maxPlayers: 4,
        },
      }

      // Trigger the room:created event
      await waitFor(() => {
        expect(eventHandlers['room:created']).toBeDefined()
      })

      eventHandlers['room:created'](mockData)

      // Verify store was updated correctly
      await waitFor(() => {
        const state = useLobbyStore.getState()
        expect(state.roomCode).toBe('ABC123')
        expect(state.hostId).toBe('player-123')
        expect(state.isHost).toBe(true)
        expect(state.isInLobby).toBe(true)
        expect(state.isConnecting).toBe(false)
        expect(state.currentPlayers).toHaveLength(1)
        expect(state.currentPlayers[0].id).toBe('player-123')
        expect(state.currentPlayers[0].isHost).toBe(true)
      })

      // Verify notification was added
      const uiState = useUIStore.getState()
      expect(uiState.notifications).toContainEqual(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('ABC123'),
        })
      )
    })
  })

  describe('Player Join', () => {
    it('should handle room:player_joined event for existing room', async () => {
      // Set up initial state - host already in room
      useLobbyStore.setState({
        roomCode: 'ABC123',
        isHost: true,
        hostId: 'player-123',
        currentPlayers: [
          {
            id: 'player-123',
            username: 'Test Player',
            isHost: true,
            isReady: false,
          },
        ],
      })

      renderLobbyScreen()

      await waitFor(() => {
        expect(eventHandlers['room:player_joined']).toBeDefined()
      })

      // Simulate second player joining
      const mockData: RoomPlayerJoinedResponse = {
        player: {
          id: 'player-456',
          username: 'Player 2',
          isHost: false,
          isReady: false,
        },
        players: [
          {
            id: 'player-123',
            username: 'Test Player',
            isHost: true,
            isReady: false,
          },
          {
            id: 'player-456',
            username: 'Player 2',
            isHost: false,
            isReady: false,
          },
        ],
        roomCode: 'ABC123',
      }

      eventHandlers['room:player_joined'](mockData)

      // Verify player list updated
      await waitFor(() => {
        const state = useLobbyStore.getState()
        expect(state.currentPlayers).toHaveLength(2)
        expect(state.currentPlayers[1].username).toBe('Player 2')
      })

      // Verify notification for other player joining
      const uiState = useUIStore.getState()
      expect(uiState.notifications).toContainEqual(
        expect.objectContaining({
          type: 'info',
          message: expect.stringContaining('Player 2'),
        })
      )
    })

    it('should handle room:player_joined event when joining as non-host', async () => {
      // Set up initial state - not in room yet
      useLobbyStore.setState({
        roomCode: null,
        isConnecting: true,
      })

      renderLobbyScreen()

      await waitFor(() => {
        expect(eventHandlers['room:player_joined']).toBeDefined()
      })

      // Simulate joining room as second player
      const mockData: RoomPlayerJoinedResponse = {
        player: {
          id: 'player-123',
          username: 'Test Player',
          isHost: false,
          isReady: false,
        },
        players: [
          {
            id: 'player-456',
            username: 'Host Player',
            isHost: true,
            isReady: false,
          },
          {
            id: 'player-123',
            username: 'Test Player',
            isHost: false,
            isReady: false,
          },
        ],
        roomCode: 'XYZ789',
      }

      eventHandlers['room:player_joined'](mockData)

      // Verify state updated for joining
      await waitFor(() => {
        const state = useLobbyStore.getState()
        expect(state.roomCode).toBe('XYZ789')
        expect(state.isHost).toBe(false)
        expect(state.hostId).toBe('player-456')
        expect(state.currentPlayers).toHaveLength(2)
      })
    })
  })

  describe('Player Leave', () => {
    it('should handle room:player_left event', async () => {
      // Set up initial state with 2 players
      useLobbyStore.setState({
        roomCode: 'ABC123',
        isHost: true,
        hostId: 'player-123',
        currentPlayers: [
          { id: 'player-123', username: 'Host', isHost: true, isReady: false },
          { id: 'player-456', username: 'Player 2', isHost: false, isReady: false },
        ],
      })

      renderLobbyScreen()

      await waitFor(() => {
        expect(eventHandlers['room:player_left']).toBeDefined()
      })

      // Simulate player leaving
      const mockData: RoomPlayerLeftResponse = {
        playerId: 'player-456',
        players: [{ id: 'player-123', username: 'Host', isHost: true, isReady: false }],
      }

      eventHandlers['room:player_left'](mockData)

      // Verify player removed
      await waitFor(() => {
        const state = useLobbyStore.getState()
        expect(state.currentPlayers).toHaveLength(1)
        expect(state.currentPlayers.find((p) => p.id === 'player-456')).toBeUndefined()
      })
    })

    it('should handle host migration on room:player_left', async () => {
      // Set up initial state - we are not host
      useLobbyStore.setState({
        roomCode: 'ABC123',
        isHost: false,
        hostId: 'player-456',
        currentPlayers: [
          { id: 'player-456', username: 'Old Host', isHost: true, isReady: false },
          { id: 'player-123', username: 'Test Player', isHost: false, isReady: false },
        ],
      })

      renderLobbyScreen()

      await waitFor(() => {
        expect(eventHandlers['room:player_left']).toBeDefined()
      })

      // Simulate old host leaving
      const mockData: RoomPlayerLeftResponse = {
        playerId: 'player-456',
        players: [{ id: 'player-123', username: 'Test Player', isHost: true, isReady: false }],
        newHostId: 'player-123',
      }

      eventHandlers['room:player_left'](mockData)

      // Verify we became host
      await waitFor(() => {
        const state = useLobbyStore.getState()
        expect(state.isHost).toBe(true)
        expect(state.hostId).toBe('player-123')
      })

      // Verify notification
      const uiState = useUIStore.getState()
      expect(uiState.notifications).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('You are now the host'),
        })
      )
    })
  })

  describe('Ready Status', () => {
    it('should handle room:player_ready event', async () => {
      useLobbyStore.setState({
        roomCode: 'ABC123',
        currentPlayers: [
          { id: 'player-123', username: 'Test Player', isHost: true, isReady: false },
          { id: 'player-456', username: 'Player 2', isHost: false, isReady: false },
        ],
      })

      renderLobbyScreen()

      await waitFor(() => {
        expect(eventHandlers['room:player_ready']).toBeDefined()
      })

      // Simulate player 2 ready
      const mockData: RoomPlayerReadyResponse = {
        playerId: 'player-456',
        isReady: true,
        allReady: false,
      }

      eventHandlers['room:player_ready'](mockData)

      // Verify ready status updated
      await waitFor(() => {
        const state = useLobbyStore.getState()
        const player2 = state.currentPlayers.find((p) => p.id === 'player-456')
        expect(player2?.isReady).toBe(true)
        expect(state.allReady).toBe(false)
      })
    })

    it('should update allReady flag when all players ready', async () => {
      useLobbyStore.setState({
        roomCode: 'ABC123',
        currentPlayers: [
          { id: 'player-123', username: 'Test Player', isHost: true, isReady: true },
          { id: 'player-456', username: 'Player 2', isHost: false, isReady: false },
        ],
      })

      renderLobbyScreen()

      await waitFor(() => {
        expect(eventHandlers['room:player_ready']).toBeDefined()
      })

      // Simulate last player ready
      const mockData: RoomPlayerReadyResponse = {
        playerId: 'player-456',
        isReady: true,
        allReady: true,
      }

      eventHandlers['room:player_ready'](mockData)

      // Verify allReady flag set
      await waitFor(() => {
        const state = useLobbyStore.getState()
        expect(state.allReady).toBe(true)
      })
    })
  })

  describe('Settings Update', () => {
    it('should handle room:settings_updated event', async () => {
      useLobbyStore.setState({
        roomCode: 'ABC123',
        settings: {
          pointsToWin: 10,
          surfaceTheme: 'afro-heritage',
          maxPlayers: 4,
        },
      })

      renderLobbyScreen()

      await waitFor(() => {
        expect(eventHandlers['room:settings_updated']).toBeDefined()
      })

      // Simulate settings update
      const mockData: RoomSettingsUpdatedResponse = {
        settings: {
          pointsToWin: 21,
          surfaceTheme: 'neon-arcade',
          maxPlayers: 3,
        },
      }

      eventHandlers['room:settings_updated'](mockData)

      // Verify settings updated
      await waitFor(() => {
        const state = useLobbyStore.getState()
        expect(state.settings.pointsToWin).toBe(21)
        expect(state.settings.surfaceTheme).toBe('neon-arcade')
        expect(state.settings.maxPlayers).toBe(3)
      })
    })
  })

  describe('Game Start', () => {
    it('should handle game:started event and navigate to game', async () => {
      useLobbyStore.setState({
        roomCode: 'ABC123',
        currentPlayers: [
          { id: 'player-123', username: 'Test Player', isHost: true, isReady: true },
          { id: 'player-456', username: 'Player 2', isHost: false, isReady: true },
        ],
      })

      renderLobbyScreen()

      await waitFor(() => {
        expect(eventHandlers['game:started']).toBeDefined()
      })

      // Simulate game start with full backend game state
      const mockData: GameStartedResponse = {
        roomCode: 'ABC123',
        players: [
          { id: 'player-123', username: 'Test Player', isHost: true, isReady: true },
          { id: 'player-456', username: 'Player 2', isHost: false, isReady: true },
        ],
        gameState: {
          gameId: 'game-ABC123-001',
          roomCode: 'ABC123',
          totalRounds: 5,
          pointsToWin: 10,
          phase: 'playing',
          players: [
            {
              id: 'player-123',
              username: 'Test Player',
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
              id: 'player-456',
              username: 'Player 2',
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
          leaderId: 'player-123',
          currentTurn: 'player-123',
          currentRound: 1,
          playedCards: [],
          turnStartTime: '2025-12-19T06:00:00Z',
          turnTimeLimit: 30,
          startedAt: '2025-12-19T06:00:00Z',
          updatedAt: '2025-12-19T06:00:00Z',
        },
      }

      eventHandlers['game:started'](mockData)

      // Verify navigation after delay
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/game', {
            state: {
              roomCode: 'ABC123',
              players: expect.any(Array),
            },
          })
        },
        { timeout: 1000 }
      )
    })

    it('should initialize game store with backend state when game starts', async () => {
      useLobbyStore.setState({
        roomCode: 'ABC123',
        currentPlayers: [
          { id: 'player-123', username: 'Alice', isHost: true, isReady: true },
          { id: 'player-456', username: 'Bob', isHost: false, isReady: true },
        ],
      })

      renderLobbyScreen()

      await waitFor(() => {
        expect(eventHandlers['game:started']).toBeDefined()
      })

      // Simulate game start with full backend game state
      const mockData: GameStartedResponse = {
        roomCode: 'ABC123',
        players: [
          { id: 'player-123', username: 'Alice', isHost: true, isReady: true },
          { id: 'player-456', username: 'Bob', isHost: false, isReady: true },
        ],
        gameState: {
          gameId: 'game-ABC123-001',
          roomCode: 'ABC123',
          totalRounds: 5,
          pointsToWin: 15,
          phase: 'playing',
          players: [
            {
              id: 'player-123',
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
              id: 'player-456',
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
          leaderId: 'player-123',
          currentTurn: 'player-123',
          currentRound: 1,
          playedCards: [],
          turnStartTime: '2025-12-19T06:00:00Z',
          turnTimeLimit: 30,
          startedAt: '2025-12-19T06:00:00Z',
          updatedAt: '2025-12-19T06:00:00Z',
        },
      }

      eventHandlers['game:started'](mockData)

      // Verify game store was initialized correctly
      await waitFor(() => {
        const gameState = useGameStore.getState()

        // Check game phase
        expect(gameState.gamePhase).toBe('playing')

        // Check room code
        expect(gameState.roomCode).toBe('ABC123')

        // Check current round
        expect(gameState.currentRound).toBe(1)

        // Check leader ID
        expect(gameState.leaderId).toBe('player-123')

        // Check players
        expect(gameState.players).toHaveLength(2)
        expect(gameState.players[0].id).toBe('player-123')
        expect(gameState.players[0].name).toBe('Alice')
        expect(gameState.players[1].id).toBe('player-456')
        expect(gameState.players[1].name).toBe('Bob')

        // Check player hands
        expect(gameState.players[0].hand).toHaveLength(5)
        expect(gameState.players[1].hand).toHaveLength(5)

        // Check settings
        expect(gameState.settings.pointsToWin).toBe(15)
      })
    })
  })

  describe('Error Handling', () => {
    it('should register error event listener', async () => {
      renderLobbyScreen()

      await waitFor(() => {
        expect(eventHandlers['error']).toBeDefined()
        expect(typeof eventHandlers['error']).toBe('function')
      })
    })
  })

  describe('Event Cleanup', () => {
    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderLobbyScreen()

      // Verify listeners registered
      expect(socketService.on).toHaveBeenCalledWith('room:created', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('room:player_joined', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('room:player_left', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('room:player_ready', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('room:settings_updated', expect.any(Function))
      expect(socketService.on).toHaveBeenCalledWith('game:started', expect.any(Function))

      // Clear mock calls
      vi.clearAllMocks()

      // Unmount
      unmount()

      // Verify cleanup called
      expect(socketService.off).toHaveBeenCalledWith('room:created')
      expect(socketService.off).toHaveBeenCalledWith('room:player_joined')
      expect(socketService.off).toHaveBeenCalledWith('room:player_left')
      expect(socketService.off).toHaveBeenCalledWith('room:player_ready')
      expect(socketService.off).toHaveBeenCalledWith('room:settings_updated')
      expect(socketService.off).toHaveBeenCalledWith('game:started')
    })
  })
})
