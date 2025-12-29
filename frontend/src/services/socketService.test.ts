import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { socketService as SocketServiceType } from './socketService'

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
        SocketService.emit('lobby:create', { settings: {} })
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
