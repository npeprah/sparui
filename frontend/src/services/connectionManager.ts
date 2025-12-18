/**
 * Connection state enum
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Configuration for reconnection behavior
 */
export interface ConnectionConfig {
  /** Maximum number of reconnection attempts (default: 5) */
  maxAttempts?: number
  /** Initial delay in milliseconds (default: 1000ms = 1s) */
  initialDelay?: number
  /** Backoff multiplier for exponential delay (default: 2) */
  backoffMultiplier?: number
  /** Maximum delay cap in milliseconds (default: 32000ms = 32s) */
  maxDelay?: number
}

/**
 * Listener callback for state changes
 */
export type ConnectionStateListener = (state: ConnectionState) => void

/**
 * ConnectionManager handles reconnection logic with exponential backoff
 *
 * Features:
 * - 5 reconnection attempts with exponential backoff (1s, 2s, 4s, 8s, 16s)
 * - State management (disconnected, connected, reconnecting, error)
 * - Event listeners for state changes
 * - Graceful cleanup
 *
 * @example
 * ```typescript
 * const manager = new ConnectionManager(
 *   () => socketService.connect(),
 *   () => socketService.disconnect()
 * )
 *
 * manager.addListener((state) => {
 *   console.log('Connection state:', state)
 * })
 *
 * // On disconnect
 * manager.reconnect()
 * ```
 */
export class ConnectionManager {
  private state: ConnectionState = ConnectionState.DISCONNECTED
  private attemptCount: number = 0
  private errorMessage: string | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private listeners: Set<ConnectionStateListener> = new Set()

  private readonly config: Required<ConnectionConfig>

  constructor(
    private readonly connectFn: () => void | Promise<void>,
    private readonly disconnectFn: () => void | Promise<void>,
    config: ConnectionConfig = {}
  ) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 5,
      initialDelay: config.initialDelay ?? 1000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      maxDelay: config.maxDelay ?? 32000,
    }
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.state
  }

  /**
   * Get current attempt number (0-indexed)
   */
  public getAttempt(): number {
    return this.attemptCount
  }

  /**
   * Get maximum allowed attempts
   */
  public getMaxAttempts(): number {
    return this.config.maxAttempts
  }

  /**
   * Get current error message
   */
  public getErrorMessage(): string | null {
    return this.errorMessage
  }

  /**
   * Check if currently connected
   */
  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED
  }

  /**
   * Check if currently reconnecting
   */
  public isReconnecting(): boolean {
    return this.state === ConnectionState.RECONNECTING
  }

  /**
   * Check if can retry reconnection
   */
  public canRetry(): boolean {
    return this.attemptCount < this.config.maxAttempts
  }

  /**
   * Calculate next delay with exponential backoff
   * Formula: initialDelay * (backoffMultiplier ^ (attemptCount - 1))
   *
   * Note: Uses (attemptCount - 1) because delay is calculated AFTER incrementing count
   *
   * @example
   * With defaults (initialDelay=1000, multiplier=2):
   * - Attempt 1 (attemptCount=1): 1000ms (1s) = 1000 * 2^0
   * - Attempt 2 (attemptCount=2): 2000ms (2s) = 1000 * 2^1
   * - Attempt 3 (attemptCount=3): 4000ms (4s) = 1000 * 2^2
   * - Attempt 4 (attemptCount=4): 8000ms (8s) = 1000 * 2^3
   * - Attempt 5 (attemptCount=5): 16000ms (16s) = 1000 * 2^4
   */
  public getNextDelay(): number {
    // Use (attemptCount - 1) since we calculate delay AFTER incrementing
    const exponent = Math.max(0, this.attemptCount - 1)
    const delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, exponent)
    return Math.min(delay, this.config.maxDelay)
  }

  /**
   * Set connected state
   * Resets attempt count and clears error
   */
  public setConnected(): void {
    this.state = ConnectionState.CONNECTED
    this.attemptCount = 0
    this.errorMessage = null
    this.cancelReconnectionTimer()
    this.notifyListeners()
  }

  /**
   * Set reconnecting state
   */
  public setReconnecting(): void {
    this.state = ConnectionState.RECONNECTING
    this.notifyListeners()
  }

  /**
   * Set error state with message
   */
  public setError(message: string | null | undefined): void {
    this.state = ConnectionState.ERROR
    this.errorMessage = message || 'Unknown connection error'
    this.cancelReconnectionTimer()
    this.notifyListeners()
  }

  /**
   * Attempt reconnection with exponential backoff
   *
   * - Increments attempt count
   * - Schedules connection attempt after calculated delay
   * - Transitions to ERROR state after max attempts
   */
  public reconnect(): void {
    // Check if we can retry BEFORE canceling (to preserve attempt count for subsequent calls)
    if (!this.canRetry()) {
      this.setError('Maximum reconnection attempts reached. Please refresh the page.')
      return
    }

    // Cancel any pending reconnection only if we're starting fresh
    if (this.reconnectTimer === null) {
      // First call in sequence - cancel any existing timers
      this.cancelReconnectionTimer()
    } else {
      // Already reconnecting - don't increment again
      return
    }

    // Increment attempt count
    this.attemptCount++

    // Set reconnecting state
    this.setReconnecting()

    // Calculate delay based on CURRENT attempt (after increment)
    const delay = this.getNextDelay()

    // Schedule reconnection attempt
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null // Clear before executing
      this.executeReconnection()
    }, delay)
  }

  /**
   * Execute the actual reconnection attempt
   */
  private async executeReconnection(): Promise<void> {
    try {
      await this.connectFn()
      // Note: setConnected() should be called externally on successful connection
    } catch (error) {
      // If connection fails, try again (will check max attempts)
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      if (this.canRetry()) {
        this.reconnect()
      } else {
        this.setError(errorMessage)
      }
    }
  }

  /**
   * Cancel pending reconnection
   */
  public cancelReconnection(): void {
    this.cancelReconnectionTimer()
    this.state = ConnectionState.DISCONNECTED
    this.attemptCount = 0
    this.notifyListeners()
  }

  /**
   * Cancel reconnection timer
   */
  private cancelReconnectionTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * Add state change listener
   *
   * @returns Unsubscribe function
   */
  public addListener(listener: ConnectionStateListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Error in connection state listener:', error)
      }
    })
  }

  /**
   * Clean up resources
   * - Cancels pending reconnection
   * - Clears all listeners
   * - Disconnects
   */
  public destroy(): void {
    this.cancelReconnectionTimer()
    this.listeners.clear()
    this.disconnectFn()
  }
}
