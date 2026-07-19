// ---------------------------------------------------------------------------
// WebSocket wire contract - SINGLE SOURCE OF TRUTH (TypeScript side)
//
// This file is the authoritative TypeScript definition of every WebSocket event
// exchanged between the client and the game server. It mirrors, event for event
// and field for field, the Go file:
//
//   backend/service/game-server/controller/websocket/contract.go
//
// RULE: any change here MUST be reflected there (and vice-versa). Every message
// on the wire is a JSON envelope { event: string, data: <payload> }; the types
// below describe the `data` object for each event.
//
// Naming convention:
//   - room:*        room / lobby lifecycle (create, join, ready, leave, settings)
//   - game:*        in-game state (started, restarted, redirect)
//   - matchmaking:* quick-match queue
//   - bare names    (cardPlayed, roundWon, gameEnded, turnChanged, timerUpdate)
//     are legacy in-game events consumed by the Phaser scene.
// ---------------------------------------------------------------------------

import type {
  Card,
  LobbySettings,
  RoomCreatedResponse,
  RoomPlayerJoinedResponse,
  RoomPlayerLeftResponse,
  RoomPlayerReadyResponse,
  RoomSettingsUpdatedResponse,
  GameStartedResponse,
  BackendGameState,
} from '../store/types'

// Settings carried by lobby:create. Matches the backend RoomSettings object
// (entity.RoomSettings) nested under a `settings` key.
export type LobbyCreateSettings = LobbySettings

// timerUpdate payload.
//
// CONTRACT OWNED BY TICKET 02, EMITTED BY TICKET 04 (the turn-timer engine).
// The client reads `secondsRemaining` as the authoritative countdown value and
// ticks down locally between server emissions. `playerId` identifies whose turn
// timer is running; `turnDurationSeconds` is the full length of the turn (for
// the progress ring). Ticket 04 MUST broadcast this exact shape.
export interface TimerUpdatePayload {
  playerId: string
  secondsRemaining: number
  turnDurationSeconds?: number
}

// turnChanged payload - starts a new turn; carries the initial server-provided
// countdown value which the client then ticks down locally.
export interface TurnChangedPayload {
  currentPlayerId: string
  timeRemaining: number
}

// room:player_disconnected - transient notice while the reconnection window is
// open; the player is still listed. Permanent removal arrives via
// room:player_left.
export interface RoomPlayerDisconnectedResponse {
  playerId: string
  message?: string
}

// gameEnded payload. Score fields are aligned to the backend (finalRoundsWon,
// winnerScore) - the winner/score computation itself is owned by ticket 05.
export interface GameEndedResponse {
  winnerId: string
  winnerName: string
  winnerScore: number
  finalRoundsWon: Record<string, number>
  totalRounds: number
}

// Matchmaking payloads (quick-match queue).
export interface MatchmakingJoinedResponse {
  playerId: string
  position: number
  totalPlayers: number
  estimatedWaitTime: number
  message?: string
}

export interface MatchmakingStatusResponse {
  totalPlayers: number
  estimatedWaitTime: number
  yourPosition: number
  matchesCreated: number
}

export interface MatchmakingMatchFoundResponse {
  matchId: string
  roomCode: string
  playerIds: string[]
  numPlayers: number
  countdownTime: number
  message?: string
}

export interface GameRedirectResponse {
  roomCode: string
  matchId: string
  autoStart: boolean
  countdown: number
  redirectTo: string
  message?: string
}

// WebSocket events sent FROM the server TO the client.
export interface ServerToClientEvents {
  // Connection / auth
  connected: (data: { playerId: string }) => void
  'auth:success': (data: { playerId: string; message: string }) => void
  'auth:error': (data: { error: string }) => void

  // Room / lobby lifecycle
  'room:created': (data: RoomCreatedResponse) => void
  'room:player_joined': (data: RoomPlayerJoinedResponse) => void
  'room:player_left': (data: RoomPlayerLeftResponse) => void
  'room:player_ready': (data: RoomPlayerReadyResponse) => void
  'room:player_disconnected': (data: RoomPlayerDisconnectedResponse) => void
  'room:settings_updated': (data: RoomSettingsUpdatedResponse) => void
  'lobby:left': (data: { message: string }) => void
  'lobby:error': (data: { error: string }) => void

  // Game lifecycle
  'game:started': (data: GameStartedResponse) => void
  'game:restarted': (data: { roomCode: string; gameState: BackendGameState }) => void
  'game:redirect': (data: GameRedirectResponse) => void

  // In-game (legacy bare names)
  cardPlayed: (data: {
    playerId: string
    card: Card
    currentTurn?: string
    ledSuit?: string | null
    roundComplete?: boolean
  }) => void
  roundWon: (data: {
    winnerId: string
    roundsWon?: Record<string, number>
    isDry: boolean
    isShowDry: boolean
    currentRound?: number
    gameOver?: boolean
    // Fire streak / freeze counter state (ticket 08) - visual only, no points.
    // `frozenCard` is the breaker's winning card that broke a fire streak,
    // present only when `freezeTriggered` is true.
    fireStreakPlayer?: string
    freezeTriggered?: boolean
    frozenCard?: Card | null
  }) => void
  gameEnded: (data: GameEndedResponse) => void
  turnChanged: (data: TurnChangedPayload) => void
  timerUpdate: (data: TimerUpdatePayload) => void

  // Matchmaking
  'matchmaking:joined': (data: MatchmakingJoinedResponse) => void
  'matchmaking:left': (data: { playerId: string; message?: string }) => void
  'matchmaking:timeout': (data: { playerId: string; message?: string; waitTime?: number }) => void
  'matchmaking:match_found': (data: MatchmakingMatchFoundResponse) => void
  'matchmaking:status': (data: MatchmakingStatusResponse) => void
  'matchmaking:status_update': (data: MatchmakingStatusResponse) => void
  'matchmaking:error': (data: { error: string }) => void

  // Errors
  error: (data: { error: string; code?: string }) => void
}

// WebSocket events sent FROM the client TO the server.
export interface ClientToServerEvents {
  // Auth
  auth: (data: { token: string }) => void

  // Room / lobby lifecycle
  'lobby:create': (data: { settings: LobbyCreateSettings }) => void
  'lobby:join': (data: { roomCode: string }) => void
  'lobby:leave': (data: Record<string, never>) => void
  'lobby:ready': (data: { isReady: boolean }) => void
  'lobby:start_game': (data: Record<string, never>) => void
  'lobby:update_settings': (data: { settings: Partial<LobbyCreateSettings> }) => void

  // Game actions
  'game:play_card': (data: { card: Card }) => void
  'game:declare_dry': (data: { card?: Card; isShown: boolean }) => void
  'game:flag_player': (data: {
    targetPlayerId: string
    roundIndex: number
    cardIndex: number
  }) => void
  'game:restart': (data: Record<string, never>) => void

  // Matchmaking
  'matchmaking:join': (data: Record<string, never>) => void
  'matchmaking:leave': (data: Record<string, never>) => void
  'matchmaking:status': (data: Record<string, never>) => void
}
