import { create } from 'zustand'
import type { Card, Player, GameSettings, GamePhase, RoundPhase } from './types'

interface GameState {
  // Game metadata
  roomCode: string
  gamePhase: GamePhase
  roundPhase: RoundPhase
  currentRound: number
  leaderId: string | null
  winnerId: string | null

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
}

const DEFAULT_SETTINGS: GameSettings = {
  pointsToWin: 10,
  surfaceTheme: 'poker',
  maxPlayers: 4,
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  roomCode: '',
  gamePhase: 'lobby',
  roundPhase: 'waiting',
  currentRound: 0,
  leaderId: null,
  winnerId: null,
  players: [],
  maxPlayers: 4,
  playedCards: new Map(),
  currentSuit: null,
  timeRemaining: 15,
  settings: DEFAULT_SETTINGS,

  // Actions
  setRoomCode: (code) => set({ roomCode: code }),

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
      playedCards: new Map(),
      currentSuit: null,
      gamePhase: 'lobby',
      roundPhase: 'waiting',
      players: [],
    }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setTimeRemaining: (time) => set({ timeRemaining: time }),
}))
