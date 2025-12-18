import { io, Socket } from 'socket.io-client'
import type { Card, Player, LobbyPlayer, LobbySettings } from '../store/types'

// WebSocket event types from backend
export interface ServerToClientEvents {
  // Connection events
  connected: (data: { playerId: string }) => void
  playerJoined: (player: Player) => void
  playerLeft: (data: { playerId: string }) => void
  playerReady: (data: { playerId: string; isReady: boolean }) => void

  // Lobby events (new)
  'lobby:created': (data: { roomCode: string; hostId: string }) => void
  'lobby:joined': (data: { roomCode: string; players: LobbyPlayer[] }) => void
  'lobby:player_joined': (data: { player: LobbyPlayer }) => void
  'lobby:player_left': (data: { playerId: string }) => void
  'lobby:ready_changed': (data: { playerId: string; isReady: boolean }) => void
  'lobby:settings_changed': (data: { settings: LobbySettings }) => void
  'lobby:game_starting': (data: { gameId: string; countdown: number }) => void
  'lobby:room_closed': (data: { reason: string }) => void
  'lobby:error': (data: { message: string }) => void

  // Game events
  gameStarted: (data: { leaderId: string; round: number }) => void
  cardPlayed: (data: { playerId: string; card: Card }) => void
  roundWon: (data: { winnerId: string; points: number; isDry: boolean; isShowDry: boolean }) => void
  gameEnded: (data: { winnerId: string; finalScores: Record<string, number> }) => void

  // Turn events
  turnChanged: (data: { currentPlayerId: string; timeRemaining: number }) => void
  timerUpdate: (data: { timeRemaining: number }) => void

  // Challenge events
  challengeRaised: (data: { challengerId: string; targetId: string }) => void
  challengeResult: (data: { success: boolean; penaltyPlayerId?: string }) => void

  // Error events
  error: (data: { message: string; code: string }) => void
}

export interface ClientToServerEvents {
  // Connection events
  joinRoom: (data: { roomCode: string; playerName: string }) => void
  createRoom: (data: { playerName: string; settings: Record<string, unknown> }) => void
  leaveRoom: () => void
  setReady: (data: { isReady: boolean }) => void

  // Lobby events (new)
  'lobby:create': (data: {
    hostId: string
    maxPlayers: number
    pointsToWin: number
    surfaceTheme: string
  }) => void
  'lobby:join': (data: { roomCode: string; playerId: string; username: string }) => void
  'lobby:leave': (data: { roomCode: string; playerId: string }) => void
  'lobby:ready': (data: { roomCode: string; playerId: string; isReady: boolean }) => void
  'lobby:start': (data: { roomCode: string; hostId: string }) => void
  'lobby:update_settings': (data: {
    roomCode: string
    hostId: string
    settings: Partial<LobbySettings>
  }) => void

  // Game actions
  playCard: (data: { cardId: string }) => void
  declareDry: () => void
  raiseChallenge: (data: { targetPlayerId: string }) => void

  // Ping
  ping: () => void
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
  private url: string

  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
  }

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(this.url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.setupConnectionListeners()

    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  // Emit events (with type safety)
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit:', event)
      return
    }
    this.socket.emit(event, ...args)
  }

  // Listen to events (with type safety)
  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket?.on(event, handler as any)
  }

  // Remove event listener
  off<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ): void {
    if (handler) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket?.off(event, handler as any)
    } else {
      this.socket?.off(event)
    }
  }

  private setupConnectionListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error.message)
    })
  }
}

// Export a singleton instance
export const socketService = new SocketService()
