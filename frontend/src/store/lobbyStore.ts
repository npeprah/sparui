import { create } from 'zustand'
import type { LobbyPlayer, LobbySettings } from './types'

interface LobbyState {
  // Room data
  roomCode: string | null
  maxPlayers: number
  currentPlayers: LobbyPlayer[]
  hostId: string | null

  // Settings
  settings: LobbySettings

  // Status
  isInLobby: boolean
  isHost: boolean
  isReady: boolean
  isConnecting: boolean
  allReady: boolean

  // Actions
  setRoomCode: (code: string) => void
  setHostId: (id: string) => void
  addPlayer: (player: LobbyPlayer) => void
  removePlayer: (playerId: string) => void
  updatePlayerReady: (playerId: string, isReady: boolean) => void
  updateSettings: (settings: Partial<LobbySettings>) => void
  setIsHost: (isHost: boolean) => void
  setIsReady: (isReady: boolean) => void
  setIsInLobby: (inLobby: boolean) => void
  setIsConnecting: (connecting: boolean) => void
  setCurrentPlayers: (players: LobbyPlayer[]) => void
  setAllReady: (allReady: boolean) => void
  isPlayerReady: (playerId: string) => boolean
  leaveLobby: () => void
  reset: () => void
}

const DEFAULT_SETTINGS: LobbySettings = {
  pointsToWin: 10,
  surfaceTheme: 'poker',
  maxPlayers: 4,
}

export const useLobbyStore = create<LobbyState>((set, get) => ({
  // Initial state
  roomCode: null,
  maxPlayers: 4,
  currentPlayers: [],
  hostId: null,
  settings: DEFAULT_SETTINGS,
  isInLobby: false,
  isHost: false,
  isReady: false,
  isConnecting: false,
  allReady: false,

  // Actions
  setRoomCode: (code) => set({ roomCode: code }),

  setHostId: (id) => set({ hostId: id }),

  addPlayer: (player) =>
    set((state) => {
      // Prevent duplicates
      if (state.currentPlayers.find((p) => p.id === player.id)) {
        return state
      }
      return {
        currentPlayers: [...state.currentPlayers, player],
      }
    }),

  removePlayer: (playerId) =>
    set((state) => ({
      currentPlayers: state.currentPlayers.filter((p) => p.id !== playerId),
    })),

  updatePlayerReady: (playerId, isReady) =>
    set((state) => ({
      currentPlayers: state.currentPlayers.map((p) => (p.id === playerId ? { ...p, isReady } : p)),
    })),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setIsHost: (isHost) => set({ isHost }),

  setIsReady: (isReady) => set({ isReady }),

  setIsInLobby: (inLobby) => set({ isInLobby: inLobby }),

  setIsConnecting: (connecting) => set({ isConnecting: connecting }),

  setCurrentPlayers: (players) => set({ currentPlayers: players }),

  setAllReady: (allReady) => set({ allReady }),

  isPlayerReady: (playerId) => {
    const player = get().currentPlayers.find((p) => p.id === playerId)
    return player?.isReady || false
  },

  leaveLobby: () =>
    set({
      roomCode: null,
      currentPlayers: [],
      hostId: null,
      isInLobby: false,
      isHost: false,
      isReady: false,
      allReady: false,
    }),

  reset: () =>
    set({
      roomCode: null,
      maxPlayers: 4,
      currentPlayers: [],
      hostId: null,
      settings: DEFAULT_SETTINGS,
      isInLobby: false,
      isHost: false,
      isReady: false,
      isConnecting: false,
      allReady: false,
    }),
}))
