// The WebSocket event contract is the single source of truth in wireContract.ts
// (mirrored by backend contract.go). Re-exported here so existing importers
// (e.g. TableScene) keep working.
import type { ServerToClientEvents, ClientToServerEvents } from './wireContract'

export type { ServerToClientEvents, ClientToServerEvents } from './wireContract'

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

    this.ws.onmessage = event => {
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

    this.ws.onerror = error => {
      console.error('WebSocket error:', error)
      this.handleServerEvent('error', { error: 'WebSocket connection error', code: 'WS_ERROR' })
    }

    this.ws.onclose = event => {
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
      handlers.forEach(handler => {
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

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    )

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

    queue.forEach(message => {
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
