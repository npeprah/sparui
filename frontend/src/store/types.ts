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
  hand?: Card[] // Player's cards (only visible to the player)
}

export interface GameSettings {
  pointsToWin: number
  surfaceTheme: 'poker' | 'wooden' | 'marble'
  maxPlayers: number
}

export type GamePhase = 'lobby' | 'playing' | 'finished'
export type RoundPhase = 'waiting' | 'playing' | 'ended'

// Lobby-specific types
export type SurfaceTheme =
  | 'afro-heritage'
  | 'neon-arcade'
  | 'beach-sunset'
  | 'poker'
  | 'street'
  | 'wooden'
  | 'neon'
  | 'beach'

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

// Backend room response types
export interface RoomCreatedResponse {
  roomCode: string
  hostId: string
  maxPlayers: number
  settings: LobbySettings
}

export interface RoomPlayerJoinedResponse {
  player: LobbyPlayer
  players: LobbyPlayer[]
  roomCode: string
}

export interface RoomPlayerLeftResponse {
  playerId: string
  players: LobbyPlayer[]
  newHostId?: string
}

export interface RoomPlayerReadyResponse {
  playerId: string
  isReady: boolean
  allReady: boolean
  // Backend sends the full player list on room:player_ready so clients can
  // resync. LobbyScreen guards on its presence and falls back when absent.
  players?: LobbyPlayer[]
}

export interface RoomSettingsUpdatedResponse {
  settings: LobbySettings
}

export interface GameStartedResponse {
  roomCode: string
  players: LobbyPlayer[]
  gameState: BackendGameState
}

// Backend game state types
// Note: Backend now sends cards in frontend format (with rank field)
// but we keep value field for backward compatibility
export interface BackendCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  value?: string // Old format: "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"
  rank?: Rank // New format: "6", "7", "8", "9", "10", "J", "Q", "K", "A"
  id?: string // New format includes id
}

export interface BackendPlayer {
  id: string
  username: string
  avatar: string
  hand: BackendCard[] // Player's 5 cards
  score: number
  roundsWon: number
  winStreak: number
  isLeader: boolean
  isOnFire: boolean
  hasPlayedCard: boolean
  dryCardInfo: Record<string, unknown> | null
}

export interface BackendGameState {
  gameId: string
  roomCode: string
  totalRounds: number
  pointsToWin: number
  phase: 'playing' | 'paused' | 'ended'
  players: BackendPlayer[]
  leaderId: string
  currentTurn: string
  currentRound: number
  // The backend may include the led suit on state snapshots (e.g. on restart);
  // full contract alignment is ticket 02.
  currentSuit?: string | null
  playedCards: Array<{
    playerId: string
    card: BackendCard
  }>
  turnStartTime: string
  turnTimeLimit: number
  startedAt: string
  updatedAt: string
}
