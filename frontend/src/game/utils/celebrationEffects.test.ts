import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  createRoundWinCelebration,
  createGameWinCelebration,
  stopAllCelebrations
} from './celebrationEffects'
import { getParticleManager } from './particleManager'

// Create shared mock particle manager
const createMockParticleManager = () => ({
  createConfettiEmitter: vi.fn(() => ({
    setDepth: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
    active: true
  })),
  createExplosionEmitter: vi.fn(() => ({
    setDepth: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
    active: true
  })),
  stopEmitter: vi.fn(),
  stopAllEmitters: vi.fn()
})

// Mock ParticleManager
vi.mock('./particleManager')

// Mock Phaser scene
const createMockScene = () => ({
  cameras: {
    main: {
      width: 1920,
      height: 1080,
      centerX: 960,
      centerY: 540
    }
  },
  time: {
    delayedCall: vi.fn((delay, callback) => {
      return { destroy: vi.fn() }
    })
  },
  sound: {
    play: vi.fn()
  }
})

describe('celebrationEffects', () => {
  let scene: any
  let mockParticleManager: any

  beforeEach(() => {
    scene = createMockScene()
    mockParticleManager = createMockParticleManager()

    // Mock getParticleManager to return our mock
    vi.mocked(getParticleManager).mockReturnValue(mockParticleManager as any)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createRoundWinCelebration', () => {
    it('should create confetti burst at winner position', () => {
      const winnerPosition = { x: 500, y: 400 }

      const emitters = createRoundWinCelebration(scene, winnerPosition)

      // Should create confetti emitter
      expect(mockParticleManager.createConfettiEmitter).toHaveBeenCalledWith(
        winnerPosition.x,
        winnerPosition.y - 50, // Slightly above winner
        expect.objectContaining({
          quantity: expect.any(Number), // 500-1000 particles
          duration: 2000,
          spread: expect.any(Number)
        })
      )

      // Should create at least one explosion
      expect(mockParticleManager.createExplosionEmitter).toHaveBeenCalledWith(
        winnerPosition.x,
        winnerPosition.y
      )

      expect(emitters.length).toBeGreaterThan(0)
    })

    it('should play round win sound', () => {
      const winnerPosition = { x: 500, y: 400 }

      createRoundWinCelebration(scene, winnerPosition)

      expect(scene.sound.play).toHaveBeenCalledWith('sound:win_round')
    })

    it('should adjust particle count for mobile', () => {
      scene.cameras.main.width = 375 // Mobile width
      const winnerPosition = { x: 200, y: 300 }

      createRoundWinCelebration(scene, winnerPosition)

      // Mobile should use reduced particle count
      expect(mockParticleManager.createConfettiEmitter).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({
          quantity: expect.any(Number) // Should be less than desktop
        })
      )
    })
  })

  describe('createGameWinCelebration', () => {
    it('should create multiple explosions and sustained confetti', () => {
      const winnerPosition = { x: 600, y: 500 }

      const emitters = createGameWinCelebration(scene, winnerPosition)

      // Should create sustained confetti
      expect(mockParticleManager.createConfettiEmitter).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({
          quantity: expect.any(Number), // 1500+ particles
          duration: 5000 // 5 seconds
        })
      )

      // Should schedule multiple explosions (staggered)
      const delayedCalls = scene.time.delayedCall.mock.calls
      expect(delayedCalls.length).toBeGreaterThanOrEqual(3) // At least 3 explosions

      expect(emitters.length).toBeGreaterThan(0)
    })

    it('should create screen-wide celebration', () => {
      const winnerPosition = { x: 600, y: 500 }

      createGameWinCelebration(scene, winnerPosition)

      // Should create confetti from multiple positions
      const confettiCalls = mockParticleManager.createConfettiEmitter.mock.calls

      // Should have confetti at winner position and screen edges
      expect(confettiCalls.length).toBeGreaterThanOrEqual(2)
    })

    it('should play game victory sound', () => {
      const winnerPosition = { x: 600, y: 500 }

      createGameWinCelebration(scene, winnerPosition)

      expect(scene.sound.play).toHaveBeenCalledWith('sound:game_victory')
    })

    it('should create fireworks effect pattern', () => {
      const winnerPosition = { x: 600, y: 500 }

      createGameWinCelebration(scene, winnerPosition)

      // Check for staggered explosion timing
      const delayedCalls = scene.time.delayedCall.mock.calls
      const delays = delayedCalls.map(call => call[0])

      // Should have increasing delays for staggered effect
      expect(delays.some(d => d > 0)).toBe(true)
      expect(delays.some(d => d >= 500)).toBe(true)
    })
  })

  describe('stopAllCelebrations', () => {
    it('should stop all active celebration emitters', () => {
      const winnerPosition = { x: 500, y: 400 }

      // Create some celebrations
      const roundEmitters = createRoundWinCelebration(scene, winnerPosition)
      const gameEmitters = createGameWinCelebration(scene, winnerPosition)

      // Stop all celebrations
      stopAllCelebrations()

      // Should stop all emitters
      roundEmitters.forEach(emitter => {
        expect(emitter.stop).toHaveBeenCalled()
      })
      gameEmitters.forEach(emitter => {
        expect(emitter.stop).toHaveBeenCalled()
      })
    })

    it('should clear tracked emitters', () => {
      const winnerPosition = { x: 500, y: 400 }

      createRoundWinCelebration(scene, winnerPosition)
      createGameWinCelebration(scene, winnerPosition)

      stopAllCelebrations()

      // Calling stop again should not throw
      expect(() => stopAllCelebrations()).not.toThrow()
    })
  })

  describe('celebration positioning', () => {
    it('should emit confetti from above winner for better visibility', () => {
      const winnerPosition = { x: 500, y: 400 }

      createRoundWinCelebration(scene, winnerPosition)

      expect(mockParticleManager.createConfettiEmitter).toHaveBeenCalledWith(
        winnerPosition.x,
        expect.any(Number), // y position
        expect.any(Object)
      )

      // Y position should be above winner
      const yPosition = mockParticleManager.createConfettiEmitter.mock.calls[0][1]
      expect(yPosition).toBeLessThan(winnerPosition.y)
    })

    it('should create explosions at varied positions for game win', () => {
      const winnerPosition = { x: 600, y: 500 }

      createGameWinCelebration(scene, winnerPosition)

      // Should trigger delayed explosions at different positions
      const delayedCalls = scene.time.delayedCall.mock.calls

      // Execute the callbacks to trigger explosions
      delayedCalls.forEach(call => {
        const callback = call[1]
        callback()
      })

      const explosionCalls = mockParticleManager.createExplosionEmitter.mock.calls
      const positions = explosionCalls.map(call => ({ x: call[0], y: call[1] }))

      // Should have varied positions
      const uniquePositions = new Set(positions.map(p => `${p.x},${p.y}`))
      expect(uniquePositions.size).toBeGreaterThan(1)
    })
  })

  describe('performance considerations', () => {
    it('should limit particle count on mobile for round win', () => {
      scene.cameras.main.width = 375 // Mobile
      const winnerPosition = { x: 200, y: 300 }

      createRoundWinCelebration(scene, winnerPosition)

      const confettiCall = mockParticleManager.createConfettiEmitter.mock.calls[0]
      const options = confettiCall[2]

      // Mobile should have reduced particles (total over duration)
      // Base is 50 * 10 = 500, mobile is 60% of that = 300
      expect(options.quantity).toBeLessThanOrEqual(500)
      expect(options.quantity).toBeLessThan(500) // Should be less than desktop
    })

    it('should reduce explosion count on mobile for game win', () => {
      scene.cameras.main.width = 375 // Mobile
      const winnerPosition = { x: 200, y: 300 }

      createGameWinCelebration(scene, winnerPosition)

      // Execute delayed callbacks
      const delayedCalls = scene.time.delayedCall.mock.calls
      delayedCalls.forEach(call => call[1]())

      const explosionCount = mockParticleManager.createExplosionEmitter.mock.calls.length

      // Mobile should have fewer explosions
      expect(explosionCount).toBeLessThanOrEqual(3)
    })
  })
})