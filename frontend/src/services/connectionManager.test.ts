import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConnectionManager, ConnectionState, type ConnectionConfig } from './connectionManager'

describe('ConnectionManager', () => {
  let manager: ConnectionManager
  let mockConnect: ReturnType<typeof vi.fn>
  let mockDisconnect: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockConnect = vi.fn()
    mockDisconnect = vi.fn()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    manager?.destroy()
  })

  describe('Initialization', () => {
    it('should create with default config', () => {
      manager = new ConnectionManager(mockConnect, mockDisconnect)

      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED)
      expect(manager.getAttempt()).toBe(0)
      expect(manager.getMaxAttempts()).toBe(5)
    })

    it('should create with custom config', () => {
      const config: ConnectionConfig = {
        maxAttempts: 3,
        backoffMultiplier: 1.5,
        initialDelay: 500,
        maxDelay: 10000,
      }

      manager = new ConnectionManager(mockConnect, mockDisconnect, config)

      expect(manager.getMaxAttempts()).toBe(3)
    })

    it('should initialize in DISCONNECTED state', () => {
      manager = new ConnectionManager(mockConnect, mockDisconnect)

      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED)
      expect(manager.isConnected()).toBe(false)
      expect(manager.isReconnecting()).toBe(false)
    })
  })

  describe('State Management', () => {
    beforeEach(() => {
      manager = new ConnectionManager(mockConnect, mockDisconnect)
    })

    it('should transition to CONNECTED state', () => {
      manager.setConnected()

      expect(manager.getState()).toBe(ConnectionState.CONNECTED)
      expect(manager.isConnected()).toBe(true)
      expect(manager.getAttempt()).toBe(0) // Reset on successful connection
    })

    it('should transition to RECONNECTING state', () => {
      manager.setReconnecting()

      expect(manager.getState()).toBe(ConnectionState.RECONNECTING)
      expect(manager.isReconnecting()).toBe(true)
    })

    it('should transition to ERROR state', () => {
      manager.setError('Connection failed')

      expect(manager.getState()).toBe(ConnectionState.ERROR)
      expect(manager.getErrorMessage()).toBe('Connection failed')
    })

    it('should reset attempt count when connected', () => {
      manager.setReconnecting()
      manager['attemptCount'] = 3 // Simulate reconnection attempts

      manager.setConnected()

      expect(manager.getAttempt()).toBe(0)
    })
  })

  describe('Exponential Backoff', () => {
    beforeEach(() => {
      manager = new ConnectionManager(mockConnect, mockDisconnect, {
        maxAttempts: 5,
        initialDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 32000,
      })
    })

    it('should calculate correct delays for each attempt (1s, 2s, 4s, 8s, 16s)', () => {
      // Attempt 1: 1s (attemptCount=1, delay = 1000 * 2^0)
      manager['attemptCount'] = 1
      expect(manager.getNextDelay()).toBe(1000) // 1s

      // Attempt 2: 2s (attemptCount=2, delay = 1000 * 2^1)
      manager['attemptCount'] = 2
      expect(manager.getNextDelay()).toBe(2000) // 2s

      // Attempt 3: 4s (attemptCount=3, delay = 1000 * 2^2)
      manager['attemptCount'] = 3
      expect(manager.getNextDelay()).toBe(4000) // 4s

      // Attempt 4: 8s (attemptCount=4, delay = 1000 * 2^3)
      manager['attemptCount'] = 4
      expect(manager.getNextDelay()).toBe(8000) // 8s

      // Attempt 5: 16s (attemptCount=5, delay = 1000 * 2^4)
      manager['attemptCount'] = 5
      expect(manager.getNextDelay()).toBe(16000) // 16s
    })

    it('should cap delay at maxDelay', () => {
      manager['attemptCount'] = 10

      expect(manager.getNextDelay()).toBe(32000) // Capped at maxDelay
    })

    it('should not exceed max attempts', () => {
      manager['attemptCount'] = 5

      expect(manager.canRetry()).toBe(false)
    })

    it('should allow retry within max attempts', () => {
      manager['attemptCount'] = 3

      expect(manager.canRetry()).toBe(true)
    })
  })

  describe('Reconnection Flow', () => {
    beforeEach(() => {
      manager = new ConnectionManager(mockConnect, mockDisconnect, {
        maxAttempts: 5,
        initialDelay: 1000,
        backoffMultiplier: 2,
      })
    })

    it('should start reconnection on first attempt', async () => {
      manager.reconnect()

      expect(manager.getState()).toBe(ConnectionState.RECONNECTING)
      expect(manager.getAttempt()).toBe(1)

      // Should call connect after 1s delay
      await vi.advanceTimersByTimeAsync(1000)

      expect(mockConnect).toHaveBeenCalledTimes(1)
    })

    it('should attempt reconnection with exponential backoff', async () => {
      // Attempt 1: 1s delay
      manager.reconnect()
      expect(manager.getAttempt()).toBe(1)
      await vi.advanceTimersByTimeAsync(1000)
      expect(mockConnect).toHaveBeenCalledTimes(1)

      // Attempt 2: 2s delay
      manager.reconnect()
      expect(manager.getAttempt()).toBe(2)
      await vi.advanceTimersByTimeAsync(2000)
      expect(mockConnect).toHaveBeenCalledTimes(2)

      // Attempt 3: 4s delay
      manager.reconnect()
      expect(manager.getAttempt()).toBe(3)
      await vi.advanceTimersByTimeAsync(4000)
      expect(mockConnect).toHaveBeenCalledTimes(3)
    })

    it('should stop after max attempts', async () => {
      // Exhaust all 5 attempts (but only 4 calls happen because 5th call checks canRetry)
      for (let i = 0; i < 5; i++) {
        manager.reconnect()
        const delay = manager.getNextDelay()
        await vi.advanceTimersByTimeAsync(delay)
      }

      // Try to reconnect one more time - should set ERROR state
      manager.reconnect()

      expect(manager.getState()).toBe(ConnectionState.ERROR)
      expect(manager.canRetry()).toBe(false)
      expect(manager.getAttempt()).toBe(5)
      // All 5 connection attempts executed before failing
      expect(mockConnect).toHaveBeenCalledTimes(5)
    })

    it('should reset attempts on successful connection', async () => {
      manager.reconnect()
      expect(manager.getAttempt()).toBe(1)

      manager.setConnected()

      expect(manager.getAttempt()).toBe(0)
      expect(manager.getState()).toBe(ConnectionState.CONNECTED)
    })

    it('should cancel pending reconnection', () => {
      manager.reconnect()
      expect(manager.getAttempt()).toBe(1)

      manager.cancelReconnection()

      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED)
      expect(manager.getAttempt()).toBe(0)
    })
  })

  describe('Event Listeners', () => {
    beforeEach(() => {
      manager = new ConnectionManager(mockConnect, mockDisconnect)
    })

    it('should notify listeners on state change', () => {
      const listener = vi.fn()
      manager.addListener(listener)

      manager.setConnected()

      expect(listener).toHaveBeenCalledWith(ConnectionState.CONNECTED)
    })

    it('should notify multiple listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      manager.addListener(listener1)
      manager.addListener(listener2)

      manager.setReconnecting()

      expect(listener1).toHaveBeenCalledWith(ConnectionState.RECONNECTING)
      expect(listener2).toHaveBeenCalledWith(ConnectionState.RECONNECTING)
    })

    it('should remove listener', () => {
      const listener = vi.fn()
      const unsubscribe = manager.addListener(listener)

      unsubscribe()
      manager.setConnected()

      expect(listener).not.toHaveBeenCalled()
    })

    it('should not notify after destroy', () => {
      const listener = vi.fn()
      manager.addListener(listener)

      manager.destroy()
      manager.setConnected()

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    beforeEach(() => {
      manager = new ConnectionManager(mockConnect, mockDisconnect)
    })

    it('should cancel pending timers on destroy', () => {
      manager.reconnect()

      manager.destroy()

      // Advance timers and verify connect not called
      vi.advanceTimersByTime(10000)
      expect(mockConnect).not.toHaveBeenCalled()
    })

    it('should clear all listeners on destroy', () => {
      const listener = vi.fn()
      manager.addListener(listener)

      manager.destroy()
      manager.setConnected()

      expect(listener).not.toHaveBeenCalled()
    })

    it('should call disconnect on destroy', () => {
      manager.destroy()

      expect(mockDisconnect).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      manager = new ConnectionManager(mockConnect, mockDisconnect)
    })

    it('should handle connection failure', () => {
      manager.setError('Network timeout')

      expect(manager.getState()).toBe(ConnectionState.ERROR)
      expect(manager.getErrorMessage()).toBe('Network timeout')
    })

    it('should clear error on successful connection', () => {
      manager.setError('Network timeout')
      manager.setConnected()

      expect(manager.getState()).toBe(ConnectionState.CONNECTED)
      expect(manager.getErrorMessage()).toBeNull()
    })

    it('should provide user-friendly error messages', () => {
      manager.setError('WebSocket connection failed')

      const message = manager.getErrorMessage()
      expect(message).toBeTruthy()
      expect(message).toContain('connection')
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      manager = new ConnectionManager(mockConnect, mockDisconnect)
    })

    it('should handle rapid state changes', () => {
      manager.setConnected()
      manager.setReconnecting()
      manager.setConnected()

      expect(manager.getState()).toBe(ConnectionState.CONNECTED)
      expect(manager.getAttempt()).toBe(0)
    })

    it('should handle reconnection during pending reconnection', () => {
      manager.reconnect()
      manager.reconnect() // Call again before timer fires

      // Should only increment attempt once
      expect(manager.getAttempt()).toBe(1)
    })

    it('should handle null/undefined gracefully', () => {
      expect(() => manager.setError(null as any)).not.toThrow()
      expect(() => manager.setError(undefined as any)).not.toThrow()
    })
  })
})
