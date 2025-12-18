// Shared type definitions for stores

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
// Spar deck ranks: 6-10, J, Q, K, A (Note: Spades has no 6 or A)
export type Rank = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
  id: string
}

export interface Player {
  id: string
  name: string
  score: number
  isReady: boolean
  isConnected: boolean
  winStreak: number
  avatar?: string
}

export interface GameSettings {
  pointsToWin: number
  surfaceTheme: 'poker' | 'wooden' | 'marble'
  maxPlayers: number
}

export type GamePhase = 'lobby' | 'playing' | 'finished'
export type RoundPhase = 'waiting' | 'playing' | 'ended'

// Lobby-specific types
export type SurfaceTheme = 'poker' | 'street' | 'wooden' | 'neon' | 'beach'

export interface LobbyPlayer {
  id: string
  username: string
  avatar?: string
  isReady: boolean
  isHost: boolean
}

export interface LobbySettings {
  pointsToWin: 10 | 15 | 21
  surfaceTheme: SurfaceTheme
  maxPlayers: 2 | 3 | 4
}
