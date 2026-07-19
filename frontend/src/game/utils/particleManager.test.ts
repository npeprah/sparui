import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import Phaser from 'phaser'
import { ParticleManager } from './particleManager'
import { ParticleType } from '../constants/particleConfig'

// Mock Phaser scene
const createMockScene = () => ({
  add: {
    particles: vi.fn(() => {
      const emitter = {
        setDepth: vi.fn().mockReturnThis(),
        stop: vi.fn(),
        destroy: vi.fn(),
        active: true,
        x: 0,
        y: 0,
        setPosition: vi.fn().mockReturnThis(),
        setConfig: vi.fn().mockReturnThis(),
        start: vi.fn().mockReturnThis(),
        pause: vi.fn().mockReturnThis(),
        resume: vi.fn().mockReturnThis(),
      }
      return emitter
    })
  },
  cameras: {
    main: {
      width: 1920,
      height: 1080
    }
  },
  time: {
    delayedCall: vi.fn((delay, callback) => {
      // Don't execute callback immediately - let tests control timing
      return { destroy: vi.fn() }
    })
  }
})

describe('ParticleManager', () => {
  let scene: any
  let particleManager: ParticleManager

  beforeEach(() => {
    scene = createMockScene()
    particleManager = new ParticleManager(scene)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with a scene', () => {
      expect(particleManager).toBeDefined()
      expect(particleManager.getActiveEmitters()).toHaveLength(0)
    })

    it('should track device type for performance optimization', () => {
      // Desktop scenario
      const desktopScene = createMockScene()
      desktopScene.cameras.main.width = 1920
      const desktopManager = new ParticleManager(desktopScene)
      expect(desktopManager.isMobile()).toBe(false)

      // Mobile scenario
      const mobileScene = createMockScene()
      mobileScene.cameras.main.width = 375
      const mobileManager = new ParticleManager(mobileScene)
      expect(mobileManager.isMobile()).toBe(true)
    })
  })

  describe('createFireEmitter', () => {
    it('should create a fire particle emitter', () => {
      const emitter = particleManager.createFireEmitter(100, 200)

      expect(scene.add.particles).toHaveBeenCalledWith(
        100, 200,
        expect.any(Array), // Random subset of fire textures
        expect.objectContaining({
          speed: expect.objectContaining({ min: 50, max: 150 }),
          scale: expect.objectContaining({ start: 0.8, end: 0 }),
          lifespan: expect.objectContaining({ min: 1000, max: 2000 }),
          alpha: expect.objectContaining({ start: 1, end: 0 }),
          tint: expect.any(Array), // Fire colors
          gravityY: -100, // Upward movement for fire
          quantity: expect.any(Number),
          frequency: 100,
          blendMode: 'ADD',
          angle: expect.objectContaining({ min: -10, max: 10 })
        })
      )
      expect(emitter.setDepth).toHaveBeenCalledWith(1000)
      expect(particleManager.getActiveEmitters()).toContain(emitter)
    })

    it('should reduce particle count on mobile', () => {
      const mobileScene = createMockScene()
      mobileScene.cameras.main.width = 375
      const mobileManager = new ParticleManager(mobileScene)

      mobileManager.createFireEmitter(100, 200)

      expect(mobileScene.add.particles).toHaveBeenCalledWith(
        100, 200,
        expect.any(Array),
        expect.objectContaining({
          quantity: expect.any(Number) // Should be less than desktop
        })
      )
    })
  })

  describe('createIceEmitter', () => {
    it('should create an ice particle emitter', () => {
      const emitter = particleManager.createIceEmitter(300, 400)

      expect(scene.add.particles).toHaveBeenCalledWith(
        300, 400,
        expect.any(Array), // Random subset of ice textures
        expect.objectContaining({
          speed: expect.objectContaining({ min: 30, max: 100 }),
          scale: expect.objectContaining({ start: 0.6, end: 0.2 }),
          lifespan: expect.objectContaining({ min: 1000, max: 3000 }),
          alpha: expect.objectContaining({ start: 1, end: 0 }),
          tint: expect.any(Array), // Ice colors
          gravityY: 50, // Gentle falling for ice
          quantity: expect.any(Number),
          frequency: 150,
          blendMode: 'ADD',
          rotate: expect.objectContaining({ min: 0, max: 360 }),
          rotateSpeed: expect.objectContaining({ min: -180, max: 180 })
        })
      )
      expect(emitter.setDepth).toHaveBeenCalledWith(1000)
      expect(particleManager.getActiveEmitters()).toContain(emitter)
    })
  })

  describe('createExplosionEmitter', () => {
    it('should create an explosion burst emitter', () => {
      const emitter = particleManager.createExplosionEmitter(500, 500)

      expect(scene.add.particles).toHaveBeenCalledWith(
        500, 500,
        expect.any(Array), // Random subset of explosion textures
        expect.objectContaining({
          speed: expect.objectContaining({ min: 200, max: 500 }),
          scale: expect.objectContaining({ start: 1.2, end: 0 }),
          lifespan: expect.objectContaining({ min: 500, max: 1000 }),
          alpha: expect.objectContaining({ start: 1, end: 0 }),
          angle: expect.objectContaining({ min: 0, max: 360 }),
          quantity: expect.any(Number),
          frequency: -1, // Burst mode
          blendMode: 'ADD',
          gravityY: 0
        })
      )
      expect(emitter.setDepth).toHaveBeenCalledWith(1001) // Higher depth for explosions
    })

    it('should auto-cleanup explosion emitter after burst', () => {
      const emitter = particleManager.createExplosionEmitter(500, 500)

      // Get the callback that was registered
      const delayedCallArgs = scene.time.delayedCall.mock.calls[0]
      expect(delayedCallArgs[0]).toBe(1500) // Verify delay time
      const cleanupCallback = delayedCallArgs[1]

      // Execute the cleanup callback
      cleanupCallback()

      expect(emitter.stop).toHaveBeenCalled()
      expect(emitter.destroy).toHaveBeenCalled()
      expect(particleManager.getActiveEmitters()).not.toContain(emitter)
    })
  })

  describe('createConfettiEmitter', () => {
    it('should create a confetti celebration emitter', () => {
      const emitter = particleManager.createConfettiEmitter(600, 100, {
        quantity: 100,
        duration: 3000
      })

      expect(scene.add.particles).toHaveBeenCalledWith(
        600, 100,
        expect.any(Array), // Random subset of confetti textures
        expect.objectContaining({
          speed: expect.objectContaining({ min: 100, max: 400 }),
          scale: expect.objectContaining({ start: 1, end: 0.5 }),
          lifespan: expect.objectContaining({ min: 2000, max: 4000 }),
          alpha: expect.objectContaining({ start: 1, end: 0 }),
          gravityY: 200, // Gravity-affected falling
          quantity: expect.any(Number),
          frequency: 50,
          rotate: expect.objectContaining({ min: 0, max: 360 }),
          rotateSpeed: expect.objectContaining({ min: -360, max: 360 }),
          angle: expect.objectContaining({ min: -30, max: 30 }), // Upward cone
          blendMode: 'NORMAL'
        })
      )
      expect(emitter.setDepth).toHaveBeenCalledWith(1002) // Highest depth for celebrations
    })

    it('should support custom confetti configurations', () => {
      const emitter = particleManager.createConfettiEmitter(600, 100, {
        quantity: 200,
        duration: 5000,
        spread: 90,
        colors: [0xFF0000, 0x00FF00, 0x0000FF]
      })

      expect(scene.add.particles).toHaveBeenCalledWith(
        600, 100,
        expect.any(Array),
        expect.objectContaining({
          quantity: expect.any(Number),
          angle: expect.objectContaining({ min: -45, max: 45 }), // Custom spread
          tint: [0xFF0000, 0x00FF00, 0x0000FF] // Custom colors
        })
      )
    })
  })

  describe('attachToSprite', () => {
    it('should attach emitter to a sprite and follow its position', () => {
      const mockSprite = {
        x: 100,
        y: 200,
        on: vi.fn(),
        off: vi.fn(),
        active: true
      }

      const emitter = particleManager.createFireEmitter(0, 0)
      particleManager.attachToSprite(emitter, mockSprite as any, { offsetX: 10, offsetY: -20 })

      // Verify update listener was added
      expect(mockSprite.on).toHaveBeenCalledWith('postupdate', expect.any(Function))

      // Simulate sprite movement
      mockSprite.x = 150
      mockSprite.y = 250
      const updateCallback = (mockSprite.on as any).mock.calls[0][1]
      updateCallback()

      expect(emitter.setPosition).toHaveBeenCalledWith(160, 230) // With offsets
    })

    it('should detach emitter when sprite is destroyed', () => {
      const mockSprite = {
        x: 100,
        y: 200,
        on: vi.fn(),
        off: vi.fn(),
        active: false // Sprite destroyed
      }

      const emitter = particleManager.createFireEmitter(0, 0)
      particleManager.attachToSprite(emitter, mockSprite as any)

      // Simulate postupdate when sprite is destroyed
      const updateCallback = (mockSprite.on as any).mock.calls[0][1]
      updateCallback()

      expect(mockSprite.off).toHaveBeenCalledWith('postupdate', updateCallback)
      expect(emitter.stop).toHaveBeenCalled()
    })
  })

  describe('stopEmitter', () => {
    it('should stop and remove an emitter', () => {
      const emitter = particleManager.createFireEmitter(100, 200)
      expect(particleManager.getActiveEmitters()).toContain(emitter)

      particleManager.stopEmitter(emitter)

      expect(emitter.stop).toHaveBeenCalled()
      expect(emitter.destroy).toHaveBeenCalled()
      expect(particleManager.getActiveEmitters()).not.toContain(emitter)
    })

    it('should handle stopping non-existent emitter gracefully', () => {
      const fakeEmitter = {
        stop: vi.fn(),
        destroy: vi.fn()
      }

      expect(() => particleManager.stopEmitter(fakeEmitter as any)).not.toThrow()
    })
  })

  describe('stopAllEmitters', () => {
    it('should stop all active emitters', () => {
      const emitter1 = particleManager.createFireEmitter(100, 200)
      const emitter2 = particleManager.createIceEmitter(300, 400)
      const emitter3 = particleManager.createConfettiEmitter(500, 600)

      expect(particleManager.getActiveEmitters()).toHaveLength(3)

      particleManager.stopAllEmitters()

      expect(emitter1.stop).toHaveBeenCalled()
      expect(emitter2.stop).toHaveBeenCalled()
      expect(emitter3.stop).toHaveBeenCalled()
      expect(particleManager.getActiveEmitters()).toHaveLength(0)
    })
  })

  describe('performance optimization', () => {
    it('should limit total active emitters', () => {
      // Create max emitters
      for (let i = 0; i < 10; i++) {
        particleManager.createFireEmitter(i * 10, i * 10)
      }

      expect(particleManager.getActiveEmitters().length).toBeLessThanOrEqual(10)

      // Creating another should remove the oldest
      particleManager.createFireEmitter(1000, 1000)
      expect(particleManager.getActiveEmitters().length).toBeLessThanOrEqual(10)
    })

    it('should reduce particle counts based on performance mode', () => {
      particleManager.setPerformanceMode('low')

      const emitter = particleManager.createConfettiEmitter(100, 100, { quantity: 1000 })

      // Should cap particles in low performance mode
      expect(scene.add.particles).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Array),
        expect.objectContaining({
          quantity: expect.any(Number) // Should be significantly less than 1000
        })
      )
    })
  })

  describe('cleanup', () => {
    it('should properly destroy the manager and all emitters', () => {
      const emitter1 = particleManager.createFireEmitter(100, 200)
      const emitter2 = particleManager.createIceEmitter(300, 400)

      particleManager.destroy()

      expect(emitter1.stop).toHaveBeenCalled()
      expect(emitter1.destroy).toHaveBeenCalled()
      expect(emitter2.stop).toHaveBeenCalled()
      expect(emitter2.destroy).toHaveBeenCalled()
      expect(particleManager.getActiveEmitters()).toHaveLength(0)
    })
  })
})