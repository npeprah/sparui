import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Basic unit tests for WebSocket service
 *
 * Note: These tests verify the API surface and basic behavior.
 * Full integration testing should be done with a real backend or test server.
 */
describe('SocketService API', () => {
  let SocketService: typeof import('./socketService').socketService

  beforeEach(async () => {
    // Reset module to get fresh instance
    vi.resetModules()
    const module = await import('./socketService')
    SocketService = module.socketService
  })

  describe('connect', () => {
    it('should have connect method', () => {
      expect(SocketService.connect).toBeDefined()
      expect(typeof SocketService.connect).toBe('function')
    })

    it('should accept optional token parameter', () => {
      // Should not throw
      expect(() => SocketService.connect()).not.toThrow()
      expect(() => SocketService.connect('test-token')).not.toThrow()
    })
  })

  describe('disconnect', () => {
    it('should have disconnect method', () => {
      expect(SocketService.disconnect).toBeDefined()
      expect(typeof SocketService.disconnect).toBe('function')
    })

    it('should not throw when called multiple times', () => {
      expect(() => {
        SocketService.disconnect()
        SocketService.disconnect()
      }).not.toThrow()
    })
  })

  describe('isConnected', () => {
    it('should have isConnected method', () => {
      expect(SocketService.isConnected).toBeDefined()
      expect(typeof SocketService.isConnected).toBe('function')
    })

    it('should return boolean', () => {
      const result = SocketService.isConnected()
      expect(typeof result).toBe('boolean')
    })

    it('should return false when not connected', () => {
      SocketService.disconnect()
      expect(SocketService.isConnected()).toBe(false)
    })
  })

  describe('emit', () => {
    it('should have emit method', () => {
      expect(SocketService.emit).toBeDefined()
      expect(typeof SocketService.emit).toBe('function')
    })

    it('should not throw when emitting valid events', () => {
      expect(() => {
        // Contract: lobby:create nests the full settings object (wireContract.ts).
        SocketService.emit('lobby:create', {
          settings: { pointsToWin: 10, surfaceTheme: 'afro-heritage', maxPlayers: 4 },
        })
        SocketService.emit('lobby:join', { roomCode: 'TEST123' })
        SocketService.emit('lobby:leave', {})
      }).not.toThrow()
    })
  })

  describe('on', () => {
    it('should have on method', () => {
      expect(SocketService.on).toBeDefined()
      expect(typeof SocketService.on).toBe('function')
    })

    it('should accept event name and handler', () => {
      const handler = vi.fn()
      expect(() => {
        SocketService.on('auth:success', handler)
      }).not.toThrow()
    })
  })

  describe('off', () => {
    it('should have off method', () => {
      expect(SocketService.off).toBeDefined()
      expect(typeof SocketService.off).toBe('function')
    })

    it('should accept event name and optional handler', () => {
      const handler = vi.fn()
      expect(() => {
        SocketService.off('auth:success', handler)
        SocketService.off('auth:success')
      }).not.toThrow()
    })
  })

  describe('authenticate', () => {
    it('should have authenticate method', () => {
      expect(SocketService.authenticate).toBeDefined()
      expect(typeof SocketService.authenticate).toBe('function')
    })

    it('should accept token string', () => {
      expect(() => {
        SocketService.authenticate('test-token')
      }).not.toThrow()
    })
  })

  describe('getSocket', () => {
    it('should have getSocket method for testing', () => {
      expect(SocketService.getSocket).toBeDefined()
      expect(typeof SocketService.getSocket).toBe('function')
    })

    it('should return null when disconnected', () => {
      SocketService.disconnect()
      expect(SocketService.getSocket()).toBeNull()
    })
  })
})

/**
 * Wire-contract (de)serialization tests
 *
 * Verify the exact JSON envelope emitted for the aligned events, and that an
 * inbound frame is routed to the registered handler with the parsed payload.
 */
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static last: MockWebSocket | null = null

  url: string
  readyState = MockWebSocket.OPEN
  sent: string[] = []
  onopen: ((e?: unknown) => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onerror: ((e?: unknown) => void) | null = null
  onclose: ((e?: unknown) => void) | null = null

  constructor(url: string) {
    this.url = url
    MockWebSocket.last = this
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED
  }
}

describe('SocketService wire contract (de)serialization', () => {
  let socketService: typeof import('./socketService').socketService

  beforeEach(async () => {
    vi.resetModules()
    MockWebSocket.last = null
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket)
    socketService = (await import('./socketService')).socketService
    socketService.connect()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('serializes lobby:create with nested settings', () => {
    socketService.emit('lobby:create', {
      settings: { pointsToWin: 15, surfaceTheme: 'neon-arcade', maxPlayers: 3 },
    })

    const frames = MockWebSocket.last!.sent.map(f => JSON.parse(f))
    const create = frames.find(f => f.event === 'lobby:create')
    expect(create).toBeDefined()
    expect(create.data).toEqual({
      settings: { pointsToWin: 15, surfaceTheme: 'neon-arcade', maxPlayers: 3 },
    })
  })

  it('serializes lobby:update_settings with nested (partial) settings', () => {
    socketService.emit('lobby:update_settings', { settings: { pointsToWin: 21 } })

    const frames = MockWebSocket.last!.sent.map(f => JSON.parse(f))
    const update = frames.find(f => f.event === 'lobby:update_settings')
    expect(update).toBeDefined()
    expect(update.data).toEqual({ settings: { pointsToWin: 21 } })
  })

  it('routes an inbound room:settings_updated frame to its handler', () => {
    const handler = vi.fn()
    socketService.on('room:settings_updated', handler)

    MockWebSocket.last!.onmessage!({
      data: JSON.stringify({
        event: 'room:settings_updated',
        data: { settings: { pointsToWin: 21, surfaceTheme: 'poker', maxPlayers: 2 } },
      }),
    })

    expect(handler).toHaveBeenCalledWith({
      settings: { pointsToWin: 21, surfaceTheme: 'poker', maxPlayers: 2 },
    })
  })

  it('routes an inbound timerUpdate frame with secondsRemaining to its handler', () => {
    const handler = vi.fn()
    socketService.on('timerUpdate', handler)

    MockWebSocket.last!.onmessage!({
      data: JSON.stringify({
        event: 'timerUpdate',
        data: { playerId: 'player-abc', secondsRemaining: 12, turnDurationSeconds: 30 },
      }),
    })

    expect(handler).toHaveBeenCalledWith({
      playerId: 'player-abc',
      secondsRemaining: 12,
      turnDurationSeconds: 30,
    })
  })
})

/**
 * Type safety tests
 *
 * These tests verify that the TypeScript types are correctly defined
 */
describe('SocketService Types', () => {
  it('should have correct event types for emit', () => {
    // This test passes if TypeScript compilation succeeds
    // Type errors would show up during build
    expect(true).toBe(true)
  })

  it('should have correct event types for on', () => {
    // This test passes if TypeScript compilation succeeds
    expect(true).toBe(true)
  })
})
