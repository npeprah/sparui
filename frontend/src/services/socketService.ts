import type {
  Card,
  Player,
  LobbyPlayer,
  LobbySettings,
  RoomCreatedResponse,
  RoomPlayerJoinedResponse,
  RoomPlayerLeftResponse,
  RoomPlayerReadyResponse,
  RoomSettingsUpdatedResponse,
  GameStartedResponse,
  BackendGameState,
} from '../store/types'

// WebSocket event types from backend
export interface ServerToClientEvents {
  // Connection events
  connected: (data: { playerId: string }) => void
  playerJoined: (player: Player) => void
  playerLeft: (data: { playerId: string }) => void
  playerReady: (data: { playerId: string; isReady: boolean }) => void

  // Auth events
  'auth:success': (data: { playerId: string; message: string }) => void
  'auth:error': (data: { error: string }) => void

  // Backend room events (Phase 2 - correct event names from backend spec)
  'room:created': (data: RoomCreatedResponse) => void
  'room:player_joined': (data: RoomPlayerJoinedResponse) => void
  'room:player_left': (data: RoomPlayerLeftResponse) => void
  'room:player_ready': (data: RoomPlayerReadyResponse) => void
  'room:settings_updated': (data: RoomSettingsUpdatedResponse) => void
  'game:started': (data: GameStartedResponse) => void

  // Legacy lobby events (Phase 1 - keeping for backward compatibility)
  'lobby:created': (data: { roomCode: string; hostId: string }) => void
  'lobby:joined': (data: { roomCode: string; players: LobbyPlayer[] }) => void
  'lobby:room_created': (data: { room: unknown }) => void
  'lobby:room_state': (data: { room: unknown }) => void
  'lobby:player_joined': (data: { player: LobbyPlayer; room?: unknown }) => void
  'lobby:player_left': (data: { playerId: string; room?: unknown }) => void
  'lobby:left': (data: { message: string }) => void
  'lobby:ready_changed': (data: { playerId: string; isReady: boolean }) => void
  'lobby:settings_changed': (data: { settings: LobbySettings }) => void
  'lobby:game_starting': (data: { gameId: string; countdown: number }) => void
  'lobby:room_closed': (data: { reason: string }) => void
  'lobby:error': (data: { error: string }) => void

  // Game events
  gameStarted: (data: { leaderId: string; round: number }) => void
  'game:restarted': (data: { roomCode: string; gameState: BackendGameState }) => void
  cardPlayed: (data: { playerId: string; card: Card; currentTurn?: string; ledSuit?: string | null; roundComplete?: boolean }) => void
  roundWon: (data: { winnerId: string; roundsWon?: Record<string, number>; isDry: boolean; isShowDry: boolean; currentRound?: number; gameOver?: boolean }) => void
  gameEnded: (data: { winnerId: string; finalScores: Record<string, number> }) => void

  // Turn events
  turnChanged: (data: { currentPlayerId: string; timeRemaining: number }) => void
  timerUpdate: (data: { timeRemaining: number }) => void

  // Challenge events
  challengeRaised: (data: { challengerId: string; targetId: string }) => void
  challengeResult: (data: { success: boolean; penaltyPlayerId?: string }) => void

  // Error events
  error: (data: { error: string; code?: string }) => void
}

export interface ClientToServerEvents {
  // Auth events
  auth: (data: { token: string }) => void

  // Lobby events (matching backend spec from prompt)
  'lobby:create': (data: {
    maxPlayers: number // 2-4
    pointsToWin: number // 10, 15, or 21
    surfaceTheme: string // "afro-heritage", "neon-arcade", etc.
  }) => void
  'lobby:join': (data: { roomCode: string }) => void
  'lobby:leave': (data: Record<string, never>) => void
  'lobby:ready': (data: { isReady: boolean }) => void
  'lobby:start_game': (data: Record<string, never>) => void
  'lobby:update_settings': (data: {
    maxPlayers?: number
    pointsToWin?: number
    surfaceTheme?: string
  }) => void

  // Game actions
  'game:play_card': (data: { card: Card }) => void
  'game:declare_dry': (data: { type: string; card?: Card }) => void
  'game:flag_player': (data: { targetPlayerId: string; reason: string }) => void
  'game:restart': (data: Record<string, never>) => void

  // Connection events
  ping: () => void
}

// WebSocket message format from backend
interface WebSocketMessage {
  event: string
  data: unknown
}

// Event handler type
type EventHandler<T = unknown> = (data: T) => void

/**
 * Native WebSocket service compatible with Gorilla WebSocket backend
 * Replaces Socket.IO client with native WebSocket implementation
 */
class SocketService {
  private ws: WebSocket | null = null
  private url: string
  private eventHandlers: Map<string, Set<EventHandler>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isIntentionalClose = false
  private messageQueue: string[] = []
  private authToken: string | null = null

  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
  }

  /**
   * Connect to WebSocket server
   * @param token - Optional JWT token for immediate authentication
   */
  connect(token?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connected or connecting')
      return
    }

    try {
      this.isIntentionalClose = false
      this.ws = new WebSocket(this.url)

      if (token) {
        this.authToken = token
      }

      this.setupEventListeners()
      console.log('Connecting to WebSocket:', this.url)
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.handleReconnect()
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionalClose = true
    this.authToken = null
    this.messageQueue = []

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Send authentication message
   * @param token - JWT token
   */
  authenticate(token: string): void {
    this.authToken = token
    this.emit('auth', { token })
  }

  /**
   * Emit event to server
   */
  emit<K extends keyof ClientToServerEvents>(
    event: K,
    data: Parameters<ClientToServerEvents[K]>[0]
  ): void {
    const message: WebSocketMessage = {
      event: event as string,
      data,
    }

    const messageStr = JSON.stringify(message)

    if (!this.isConnected()) {
      console.warn('WebSocket not connected, queueing message:', event)
      this.messageQueue.push(messageStr)
      return
    }

    try {
      this.ws!.send(messageStr)
      console.log('Sent WebSocket message:', event, data)
    } catch (error) {
      console.error('Failed to send message:', error)
      this.messageQueue.push(messageStr)
    }
  }

  /**
   * Register event handler
   */
  on<K extends keyof ServerToClientEvents>(event: K, handler: ServerToClientEvents[K]): void {
    const eventName = event as string
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set())
    }
    this.eventHandlers.get(eventName)!.add(handler as EventHandler)
  }

  /**
   * Remove event handler
   */
  off<K extends keyof ServerToClientEvents>(event: K, handler?: ServerToClientEvents[K]): void {
    const eventName = event as string
    if (handler) {
      this.eventHandlers.get(eventName)?.delete(handler as EventHandler)
    } else {
      this.eventHandlers.delete(eventName)
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully')
      this.reconnectAttempts = 0

      // Send authentication if token available
      if (this.authToken) {
        console.log('Sending authentication on connect')
        this.authenticate(this.authToken)
      }

      // Send queued messages
      this.flushMessageQueue()

      // Emit connected event
      this.handleServerEvent('connected', { playerId: '' })
    }

    this.ws.onmessage = (event) => {
      // Handle potentially multiple JSON messages in a single WebSocket frame
      // This can happen when the server sends multiple events in quick succession
      const rawData = event.data as string

      // Try to parse as single JSON first (most common case)
      try {
        const message: WebSocketMessage = JSON.parse(rawData)
        console.log('Received WebSocket message:', message.event, message.data)
        this.handleServerEvent(message.event, message.data)
        return
      } catch {
        // If single parse fails, try splitting by newlines or concatenated JSON objects
      }

      // Split by newlines and parse each message
      const lines = rawData.split('\n').filter(line => line.trim())
      if (lines.length > 1) {
        console.log(`Processing ${lines.length} concatenated messages`)
        for (const line of lines) {
          try {
            const message: WebSocketMessage = JSON.parse(line)
            console.log('Received WebSocket message:', message.event, message.data)
            this.handleServerEvent(message.event, message.data)
          } catch (error) {
            console.error('Failed to parse WebSocket message line:', error, line)
          }
        }
        return
      }

      // Try to split concatenated JSON objects (e.g., {...}{...}{...})
      const jsonObjects: string[] = []
      let depth = 0
      let start = 0
      for (let i = 0; i < rawData.length; i++) {
        if (rawData[i] === '{') {
          if (depth === 0) start = i
          depth++
        } else if (rawData[i] === '}') {
          depth--
          if (depth === 0) {
            jsonObjects.push(rawData.slice(start, i + 1))
          }
        }
      }

      if (jsonObjects.length > 1) {
        console.log(`Processing ${jsonObjects.length} concatenated JSON objects`)
        for (const jsonStr of jsonObjects) {
          try {
            const message: WebSocketMessage = JSON.parse(jsonStr)
            console.log('Received WebSocket message:', message.event, message.data)
            this.handleServerEvent(message.event, message.data)
          } catch (error) {
            console.error('Failed to parse WebSocket JSON object:', error, jsonStr)
          }
        }
        return
      }

      console.error('Failed to parse WebSocket message:', rawData)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.handleServerEvent('error', { error: 'WebSocket connection error', code: 'WS_ERROR' })
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason)
      this.ws = null

      if (!this.isIntentionalClose) {
        this.handleReconnect()
      }
    }
  }

  /**
   * Handle incoming server events
   */
  private handleServerEvent(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers && handlers.size > 0) {
      handlers.forEach((handler) => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in handler for event ${event}:`, error)
        }
      })
    } else {
      console.warn('No handlers registered for event:', event)
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.isIntentionalClose) {
      console.log('Intentional close, not reconnecting')
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.handleServerEvent('error', {
        error: 'Failed to reconnect after multiple attempts',
        code: 'MAX_RECONNECT',
      })
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      console.log('Attempting to reconnect...')
      this.connect(this.authToken || undefined)
    }, delay)
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return

    console.log(`Flushing ${this.messageQueue.length} queued messages`)
    const queue = [...this.messageQueue]
    this.messageQueue = []

    queue.forEach((message) => {
      try {
        this.ws!.send(message)
      } catch (error) {
        console.error('Failed to send queued message:', error)
      }
    })
  }

  /**
   * Get underlying WebSocket instance (for testing)
   */
  getSocket(): WebSocket | null {
    return this.ws
  }
}

// Export singleton instance
export const socketService = new SocketService()
