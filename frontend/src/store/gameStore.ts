import { create } from 'zustand'
import type {
  Card,
  Player,
  GameSettings,
  GamePhase,
  RoundPhase,
  BackendGameState,
  BackendCard,
} from './types'

interface GameWinner {
  id: string
  name: string
  score: number
}

interface GameState {
  // Game metadata
  roomCode: string
  hostId: string | null
  gamePhase: GamePhase
  roundPhase: RoundPhase
  currentRound: number
  leaderId: string | null
  winnerId: string | null

  // Game winner info (set when game ends)
  gameWinner: GameWinner | null

  // Players
  players: Player[]
  maxPlayers: number

  // Current round state
  playedCards: Map<string, Card>
  currentSuit: string | null
  timeRemaining: number

  // Game settings
  settings: GameSettings

  // Actions
  setRoomCode: (code: string) => void
  setHostId: (hostId: string) => void
  setGamePhase: (phase: GamePhase) => void
  setRoundPhase: (phase: RoundPhase) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayer: (playerId: string, updates: Partial<Player>) => void
  playCard: (playerId: string, card: Card) => void
  setLeader: (playerId: string) => void
  updateScore: (playerId: string, points: number) => void
  incrementWinStreak: (playerId: string) => void
  resetWinStreak: (playerId: string) => void
  nextRound: () => void
  resetGame: () => void
  updateSettings: (settings: Partial<GameSettings>) => void
  setTimeRemaining: (time: number) => void
  initializeFromBackend: (backendState: BackendGameState) => void
  setGameWinner: (winner: GameWinner | null) => void
}

const DEFAULT_SETTINGS: GameSettings = {
  pointsToWin: 10,
  surfaceTheme: 'poker',
  maxPlayers: 4,
}

// Helper function to convert backend card value to frontend rank
// Handles both old backend format ("king", "queen", etc.) and new frontend format ("K", "Q", etc.)
function convertBackendCardValue(value: string): Card['rank'] {
  // If value is already in frontend format (single char for face cards), return as-is
  if (['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].includes(value)) {
    return value as Card['rank']
  }

  // Otherwise, convert from backend format to frontend format
  const valueMap: Record<string, Card['rank']> = {
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    jack: 'J',
    queen: 'Q',
    king: 'K',
    ace: 'A',
  }
  return valueMap[value.toLowerCase()] || '6'
}

// Helper function to convert backend card to frontend card
// Handles both old backend format (with 'value' field) and new frontend format (with 'rank' field)
function convertBackendCard(backendCard: BackendCard): Card {
  // If card already has rank field (new frontend format), return as-is with id
  if (backendCard.rank) {
    return {
      suit: backendCard.suit,
      rank: backendCard.rank,
      id: backendCard.id || `${backendCard.suit}-${backendCard.rank}`,
    }
  }

  // Otherwise, convert from old backend format with 'value' field
  if (!backendCard.value) {
    console.error('[gameStore] Invalid card format - missing both rank and value:', backendCard)
    // Fallback to a default card
    return {
      suit: backendCard.suit,
      rank: '6',
      id: `${backendCard.suit}-6`,
    }
  }

  const rank = convertBackendCardValue(backendCard.value)
  return {
    suit: backendCard.suit,
    rank,
    id: `${backendCard.suit}-${rank}`,
  }
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  roomCode: '',
  hostId: null,
  gamePhase: 'lobby',
  roundPhase: 'waiting',
  currentRound: 0,
  leaderId: null,
  winnerId: null,
  gameWinner: null,
  players: [],
  maxPlayers: 4,
  playedCards: new Map(),
  currentSuit: null,
  timeRemaining: 15,
  settings: DEFAULT_SETTINGS,

  // Actions
  setRoomCode: (code) => set({ roomCode: code }),

  setHostId: (hostId) => set({ hostId }),

  setGamePhase: (phase) => set({ gamePhase: phase }),

  setRoundPhase: (phase) => set({ roundPhase: phase }),

  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, player],
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),

  updatePlayer: (playerId, updates) =>
    set((state) => ({
      players: state.players.map((p) => (p.id === playerId ? { ...p, ...updates } : p)),
    })),

  playCard: (playerId, card) =>
    set((state) => {
      const newPlayedCards = new Map(state.playedCards)
      newPlayedCards.set(playerId, card)
      return {
        playedCards: newPlayedCards,
        currentSuit: state.currentSuit || card.suit,
      }
    }),

  setLeader: (playerId) => set({ leaderId: playerId }),

  updateScore: (playerId, points) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, score: p.score + points } : p
      ),
    })),

  incrementWinStreak: (playerId) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, winStreak: p.winStreak + 1 } : p
      ),
    })),

  resetWinStreak: (playerId) =>
    set((state) => ({
      players: state.players.map((p) => (p.id === playerId ? { ...p, winStreak: 0 } : p)),
    })),

  nextRound: () =>
    set((state) => ({
      currentRound: state.currentRound + 1,
      playedCards: new Map(),
      currentSuit: null,
      roundPhase: 'waiting',
    })),

  resetGame: () =>
    set({
      currentRound: 0,
      leaderId: null,
      winnerId: null,
      gameWinner: null,
      playedCards: new Map(),
      currentSuit: null,
      gamePhase: 'lobby',
      roundPhase: 'waiting',
      players: [],
    }),

  setGameWinner: (winner) => set({ gameWinner: winner, winnerId: winner?.id || null }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  initializeFromBackend: (backendState) =>
    set((state) => {
      console.log('[gameStore] ===== INITIALIZING FROM BACKEND =====')
      console.log('[gameStore] Backend state:', backendState)

      // Convert backend players to frontend players
      const players: Player[] = backendState.players.map((backendPlayer, index) => {
        console.log(`[gameStore] Converting player ${index}:`, backendPlayer)

        const convertedHand = backendPlayer.hand.map(convertBackendCard)
        console.log(`[gameStore] Player ${backendPlayer.id} hand:`, convertedHand)

        return {
          id: backendPlayer.id,
          name: backendPlayer.username,
          score: backendPlayer.score,
          isReady: true, // All players are ready when game starts
          isConnected: true,
          winStreak: backendPlayer.winStreak,
          avatar: backendPlayer.avatar,
          hand: convertedHand,
        }
      })

      console.log('[gameStore] Converted players:', players)
      console.log('[gameStore] Number of players:', players.length)

      // Update game settings based on backend state
      const updatedSettings: GameSettings = {
        ...state.settings,
        pointsToWin: backendState.pointsToWin,
      }

      const newState = {
        roomCode: backendState.roomCode,
        gamePhase: 'playing' as GamePhase,
        roundPhase: 'waiting' as RoundPhase,
        currentRound: backendState.currentRound,
        leaderId: backendState.leaderId,
        players,
        playedCards: new Map(), // Clear any existing played cards
        currentSuit: null, // Reset current suit
        settings: updatedSettings,
      }

      console.log('[gameStore] New state being set:', newState)
      console.log('[gameStore] INITIALIZATION COMPLETE')

      return newState
    }),
}))
