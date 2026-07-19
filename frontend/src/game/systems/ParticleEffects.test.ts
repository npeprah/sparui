import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock Phaser module
vi.mock('phaser', () => ({
  BlendModes: {
    ADD: 1,
    NORMAL: 0,
  },
}))

import { ParticleEffects } from './ParticleEffects'

// Mock Phaser scene
class MockScene {
  add = {
    particles: vi.fn().mockReturnValue({
      stop: vi.fn(),
      destroy: vi.fn(),
      explode: vi.fn(),
    }),
  }

  time = {
    delayedCall: vi.fn((delay, callback) => {
      // Immediately call the callback for testing
      callback()
      return { remove: vi.fn() }
    }),
  }
}

describe('ParticleEffects', () => {
  let scene: MockScene
  let particleEffects: ParticleEffects

  beforeEach(() => {
    scene = new MockScene('test', {})
    particleEffects = new ParticleEffects(scene as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with the scene', () => {
      expect(particleEffects).toBeDefined()
      expect(particleEffects['scene']).toBe(scene)
    })

    it('should have empty active emitters on init', () => {
      expect(particleEffects['activeEmitters']).toEqual([])
    })
  })

  describe('playFireStreakEffect', () => {
    it('should create fire particle emitter at specified position', () => {
      const position = { x: 100, y: 200 }

      particleEffects.playFireStreakEffect(position)

      expect(scene.add.particles).toHaveBeenCalledWith(
        position.x,
        position.y,
        expect.any(String),
        expect.any(Object)
      )
    })

    it('should configure fire emitter with correct settings', () => {
      const position = { x: 100, y: 200 }

      particleEffects.playFireStreakEffect(position)

      expect(scene.add.particles).toHaveBeenCalledWith(
        position.x,
        position.y,
        'flame_01',
        expect.objectContaining({
          lifespan: 800,
          speed: { min: 100, max: 200 },
          scale: { start: 1, end: 0 },
          alpha: { start: 1, end: 0 },
          angle: { min: -110, max: -70 },
          frequency: 50,
          blendMode: 1, // ADD
        })
      )
    })

    it('should auto-stop effect after duration', () => {
      const position = { x: 100, y: 200 }

      particleEffects.playFireStreakEffect(position)

      expect(scene.time.delayedCall).toHaveBeenCalledWith(2000, expect.any(Function), [], scene)
    })

    it('should track active emitters', () => {
      const position = { x: 100, y: 200 }

      particleEffects.playFireStreakEffect(position)

      expect(particleEffects['activeEmitters'].length).toBe(1)
    })
  })

  describe('playFreezeEffect', () => {
    it('should create ice particle emitter at specified position', () => {
      const position = { x: 300, y: 400 }

      particleEffects.playFreezeEffect(position)

      expect(scene.add.particles).toHaveBeenCalledWith(
        position.x,
        position.y,
        'ice_01',
        expect.objectContaining({
          lifespan: 1200,
          frequency: 30,
        })
      )
    })

    it('should auto-stop effect after duration', () => {
      const position = { x: 300, y: 400 }

      particleEffects.playFreezeEffect(position)

      expect(scene.time.delayedCall).toHaveBeenCalledWith(1500, expect.any(Function), [], scene)
    })
  })

  describe('playVictoryExplosion', () => {
    it('should create explosion particle emitter at center', () => {
      particleEffects.playVictoryExplosion()

      expect(scene.add.particles).toHaveBeenCalledWith(
        640, // Center of 1280x720 screen
        360,
        'explosion_01',
        expect.objectContaining({
          lifespan: 1000,
          quantity: 50,
        })
      )
    })

    it('should trigger explosion burst', () => {
      particleEffects.playVictoryExplosion()

      const emitter = scene.add.particles()
      expect(emitter.explode).toHaveBeenCalledWith(50, 640, 360)
    })

    it('should accept custom position', () => {
      const position = { x: 500, y: 300 }

      particleEffects.playVictoryExplosion(position)

      expect(scene.add.particles).toHaveBeenCalledWith(
        position.x,
        position.y,
        'explosion_01',
        expect.any(Object)
      )

      const emitter = scene.add.particles()
      expect(emitter.explode).toHaveBeenCalledWith(50, position.x, position.y)
    })
  })

  describe('playConfettiCelebration', () => {
    it('should create confetti particle emitter at top of screen', () => {
      particleEffects.playConfettiCelebration()

      expect(scene.add.particles).toHaveBeenCalledWith(
        640, // Top center
        0,
        'confetti_01',
        expect.objectContaining({
          lifespan: 4000,
          gravityY: 100,
          frequency: 20,
        })
      )
    })

    it('should auto-stop effect after duration', () => {
      particleEffects.playConfettiCelebration()

      expect(scene.time.delayedCall).toHaveBeenCalledWith(5000, expect.any(Function), [], scene)
    })
  })

  describe('cleanup', () => {
    it('should stop and destroy all active emitters', () => {
      const position = { x: 100, y: 200 }

      // Create multiple effects
      particleEffects.playFireStreakEffect(position)
      particleEffects.playFreezeEffect(position)
      particleEffects.playConfettiCelebration()

      // Store references to emitters before cleanup
      const initialEmitters = [...particleEffects['activeEmitters']]
      expect(initialEmitters.length).toBe(3)

      particleEffects.cleanup()

      // Verify all emitters were stopped and destroyed
      const emitter = scene.add.particles()
      expect(emitter.stop).toHaveBeenCalled()
      expect(emitter.destroy).toHaveBeenCalled()

      expect(particleEffects['activeEmitters'].length).toBe(0)
    })
  })

  describe('stopEffect', () => {
    it('should stop specific emitter', () => {
      const position = { x: 100, y: 200 }

      particleEffects.playFireStreakEffect(position)
      const emitterData = particleEffects['activeEmitters'][0]

      particleEffects['stopEffect'](emitterData)

      expect(emitterData.emitter.stop).toHaveBeenCalled()
      expect(emitterData.emitter.destroy).toHaveBeenCalled()
      expect(particleEffects['activeEmitters'].length).toBe(0)
    })
  })

  describe('texture cycling', () => {
    it('should cycle through fire textures', () => {
      const textures = particleEffects['getFireTextures']()

      expect(textures).toEqual([
        'flame_01',
        'flame_02',
        'flame_03',
        'flame_04',
        'flame_05',
        'flame_06',
        'flame_07',
        'flame_08',
      ])
    })

    it('should cycle through ice textures', () => {
      const textures = particleEffects['getIceTextures']()

      expect(textures).toEqual([
        'ice_01',
        'ice_02',
        'ice_03',
        'ice_04',
        'ice_05',
        'ice_06',
        'ice_07',
        'ice_08',
      ])
    })

    it('should cycle through explosion textures', () => {
      const textures = particleEffects['getExplosionTextures']()

      expect(textures).toEqual([
        'explosion_01',
        'explosion_02',
        'explosion_03',
        'explosion_04',
        'explosion_05',
        'explosion_06',
        'explosion_07',
        'explosion_08',
        'explosion_09',
        'explosion_10',
      ])
    })

    it('should cycle through confetti textures', () => {
      const textures = particleEffects['getConfettiTextures']()

      expect(textures).toEqual([
        'confetti_01',
        'confetti_02',
        'confetti_03',
        'confetti_04',
        'confetti_05',
        'confetti_06',
        'confetti_07',
        'confetti_08',
      ])
    })
  })
})
