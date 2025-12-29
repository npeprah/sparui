import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card } from './types'

interface PlayerState {
  // Local player identity
  playerId: string
  playerName: string
  avatar: string

  // Authentication
  token: string | null

  // Stats (persisted across sessions)
  totalWins: number
  totalGames: number
  totalPoints: number
  longestWinStreak: number

  // Current game state
  hand: Card[]
  isMyTurn: boolean
  canPlay: boolean

  // Actions
  setPlayerId: (id: string) => void
  setPlayerName: (name: string) => void
  setAvatar: (avatar: string) => void
  setToken: (token: string | null) => void
  setHand: (cards: Card[]) => void
  addCardToHand: (card: Card) => void
  removeCardFromHand: (cardId: string) => void
  setIsMyTurn: (isTurn: boolean) => void
  setCanPlay: (can: boolean) => void
  incrementWins: () => void
  incrementGames: () => void
  addPoints: (points: number) => void
  updateLongestStreak: (streak: number) => void
  resetGameState: () => void
  clearAuth: () => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      // Initial state
      playerId: '',
      playerName: 'Guest',
      avatar: '',
      token: null,
      totalWins: 0,
      totalGames: 0,
      totalPoints: 0,
      longestWinStreak: 0,
      hand: [],
      isMyTurn: false,
      canPlay: false,

      // Actions
      setPlayerId: (id) => set({ playerId: id }),

      setPlayerName: (name) => set({ playerName: name }),

      setAvatar: (avatar) => set({ avatar }),

      setToken: (token) => set({ token }),

      setHand: (cards) => set({ hand: cards }),

      addCardToHand: (card) =>
        set((state) => ({
          hand: [...state.hand, card],
        })),

      removeCardFromHand: (cardId) =>
        set((state) => {
          console.log('[playerStore] removeCardFromHand called')
          console.log('  - cardId to remove:', cardId)
          console.log('  - Current hand before removal:', state.hand.map(c => `${c.suit} ${c.rank} (${c.id})`))

          const newHand = state.hand.filter((c) => c.id !== cardId)

          console.log('  - New hand after removal:', newHand.map(c => `${c.suit} ${c.rank} (${c.id})`))
          console.log('  - Removed', state.hand.length - newHand.length, 'cards')

          return { hand: newHand }
        }),

      setIsMyTurn: (isTurn) => set({ isMyTurn: isTurn }),

      setCanPlay: (can) => set({ canPlay: can }),

      incrementWins: () =>
        set((state) => ({
          totalWins: state.totalWins + 1,
        })),

      incrementGames: () =>
        set((state) => ({
          totalGames: state.totalGames + 1,
        })),

      addPoints: (points) =>
        set((state) => ({
          totalPoints: state.totalPoints + points,
        })),

      updateLongestStreak: (streak) =>
        set((state) => ({
          longestWinStreak: Math.max(state.longestWinStreak, streak),
        })),

      resetGameState: () =>
        set({
          hand: [],
          isMyTurn: false,
          canPlay: false,
        }),

      clearAuth: () =>
        set({
          playerId: '',
          token: null,
        }),
    }),
    {
      name: 'spar-player-storage',
      partialize: (state) => ({
        playerName: state.playerName,
        avatar: state.avatar,
        token: state.token,
        playerId: state.playerId,
        totalWins: state.totalWins,
        totalGames: state.totalGames,
        totalPoints: state.totalPoints,
        longestWinStreak: state.longestWinStreak,
      }),
    }
  )
)
