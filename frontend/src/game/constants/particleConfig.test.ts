import { describe, it, expect } from 'vitest'
import {
  ParticleType,
  PARTICLE_TEXTURES,
  PARTICLE_COLORS,
  PARTICLE_LIMITS,
  FIRE_EMITTER_CONFIG,
  ICE_EMITTER_CONFIG,
  EXPLOSION_EMITTER_CONFIG,
  CONFETTI_EMITTER_CONFIG,
  getParticleConfig,
  getPerformanceAdjustedQuantity
} from './particleConfig'

describe('particleConfig', () => {
  describe('PARTICLE_TEXTURES', () => {
    it('should define texture keys for all particle types', () => {
      expect(PARTICLE_TEXTURES.FIRE).toBeDefined()
      expect(PARTICLE_TEXTURES.FIRE.length).toBeGreaterThan(0)
      expect(PARTICLE_TEXTURES.FIRE).toContain('flame_large')
      expect(PARTICLE_TEXTURES.FIRE).toContain('flame_small')

      expect(PARTICLE_TEXTURES.ICE).toBeDefined()
      expect(PARTICLE_TEXTURES.ICE.length).toBeGreaterThan(0)
      expect(PARTICLE_TEXTURES.ICE).toContain('snowflake_large')
      expect(PARTICLE_TEXTURES.ICE).toContain('ice_shard')

      expect(PARTICLE_TEXTURES.EXPLOSION).toBeDefined()
      expect(PARTICLE_TEXTURES.EXPLOSION.length).toBeGreaterThan(0)
      expect(PARTICLE_TEXTURES.EXPLOSION).toContain('burst_large')
      expect(PARTICLE_TEXTURES.EXPLOSION).toContain('spark_shower')

      expect(PARTICLE_TEXTURES.CONFETTI).toBeDefined()
      expect(PARTICLE_TEXTURES.CONFETTI.length).toBeGreaterThan(0)
      expect(PARTICLE_TEXTURES.CONFETTI).toContain('confetti_multi')
      expect(PARTICLE_TEXTURES.CONFETTI).toContain('streamers')
    })

    it('should have unique texture keys across categories', () => {
      const allTextures = [
        ...PARTICLE_TEXTURES.FIRE,
        ...PARTICLE_TEXTURES.ICE,
        ...PARTICLE_TEXTURES.EXPLOSION,
        ...PARTICLE_TEXTURES.CONFETTI
      ]
      const uniqueTextures = new Set(allTextures)
      expect(uniqueTextures.size).toBe(allTextures.length)
    })
  })

  describe('PARTICLE_COLORS', () => {
    it('should define color palettes for each particle type', () => {
      expect(PARTICLE_COLORS.FIRE).toEqual(
        expect.arrayContaining([0xFF4500, 0xFF8C00, 0xFFD700])
      )

      expect(PARTICLE_COLORS.ICE).toEqual(
        expect.arrayContaining([0x00BFFF, 0x87CEEB, 0xFFFFFF])
      )

      expect(PARTICLE_COLORS.EXPLOSION).toEqual(
        expect.arrayContaining([0xFFD700, 0xFF4500, 0xFFFFFF])
      )

      expect(PARTICLE_COLORS.CONFETTI).toEqual(
        expect.arrayContaining([0xFFD700, 0xFF4500, 0x00BFFF, 0x8B00FF, 0xFF1493])
      )
    })
  })

  describe('PARTICLE_LIMITS', () => {
    it('should define performance limits for desktop and mobile', () => {
      expect(PARTICLE_LIMITS.DESKTOP.FIRE).toBeGreaterThan(PARTICLE_LIMITS.MOBILE.FIRE)
      expect(PARTICLE_LIMITS.DESKTOP.ICE).toBeGreaterThan(PARTICLE_LIMITS.MOBILE.ICE)
      expect(PARTICLE_LIMITS.DESKTOP.EXPLOSION).toBeGreaterThan(PARTICLE_LIMITS.MOBILE.EXPLOSION)
      expect(PARTICLE_LIMITS.DESKTOP.CONFETTI).toBeGreaterThan(PARTICLE_LIMITS.MOBILE.CONFETTI)
    })

    it('should have reasonable limits for mobile performance', () => {
      expect(PARTICLE_LIMITS.MOBILE.FIRE).toBeLessThanOrEqual(60)
      expect(PARTICLE_LIMITS.MOBILE.ICE).toBeLessThanOrEqual(60)
      expect(PARTICLE_LIMITS.MOBILE.EXPLOSION).toBeLessThanOrEqual(100)
      expect(PARTICLE_LIMITS.MOBILE.CONFETTI).toBeLessThanOrEqual(100)
    })

    it('should define max emitter limits', () => {
      expect(PARTICLE_LIMITS.MAX_EMITTERS.DESKTOP).toBeGreaterThan(PARTICLE_LIMITS.MAX_EMITTERS.MOBILE)
      expect(PARTICLE_LIMITS.MAX_EMITTERS.MOBILE).toBeGreaterThanOrEqual(3)
    })
  })

  describe('FIRE_EMITTER_CONFIG', () => {
    it('should configure fire particles with upward movement', () => {
      expect(FIRE_EMITTER_CONFIG.gravityY).toBeLessThan(0) // Negative for upward
      expect(FIRE_EMITTER_CONFIG.speed.min).toBeGreaterThan(0)
      expect(FIRE_EMITTER_CONFIG.speed.max).toBeGreaterThan(FIRE_EMITTER_CONFIG.speed.min)
    })

    it('should have appropriate lifespan for fire effects', () => {
      expect(FIRE_EMITTER_CONFIG.lifespan.min).toBeGreaterThanOrEqual(1000)
      expect(FIRE_EMITTER_CONFIG.lifespan.max).toBeLessThanOrEqual(2000)
    })

    it('should use additive blend mode for glow effect', () => {
      expect(FIRE_EMITTER_CONFIG.blendMode).toBe('ADD')
    })

    it('should fade out over time', () => {
      expect(FIRE_EMITTER_CONFIG.alpha.start).toBe(1)
      expect(FIRE_EMITTER_CONFIG.alpha.end).toBe(0)
      expect(FIRE_EMITTER_CONFIG.scale.end).toBe(0)
    })
  })

  describe('ICE_EMITTER_CONFIG', () => {
    it('should configure ice particles with gentle falling', () => {
      expect(ICE_EMITTER_CONFIG.gravityY).toBeGreaterThan(0) // Positive for falling
      expect(ICE_EMITTER_CONFIG.gravityY).toBeLessThan(100) // Gentle fall
    })

    it('should have longer lifespan than fire', () => {
      expect(ICE_EMITTER_CONFIG.lifespan.min).toBeGreaterThanOrEqual(1000)
      expect(ICE_EMITTER_CONFIG.lifespan.max).toBeGreaterThanOrEqual(3000)
    })

    it('should include rotation for sparkle effect', () => {
      expect(ICE_EMITTER_CONFIG.rotate).toBeDefined()
      expect(ICE_EMITTER_CONFIG.rotate.min).toBe(0)
      expect(ICE_EMITTER_CONFIG.rotate.max).toBe(360)
    })
  })

  describe('EXPLOSION_EMITTER_CONFIG', () => {
    it('should configure explosion as burst effect', () => {
      expect(EXPLOSION_EMITTER_CONFIG.frequency).toBe(-1) // Burst mode
      expect(EXPLOSION_EMITTER_CONFIG.speed.min).toBeGreaterThanOrEqual(200)
      expect(EXPLOSION_EMITTER_CONFIG.speed.max).toBeGreaterThanOrEqual(400)
    })

    it('should have short lifespan for quick burst', () => {
      expect(EXPLOSION_EMITTER_CONFIG.lifespan.min).toBeGreaterThanOrEqual(500)
      expect(EXPLOSION_EMITTER_CONFIG.lifespan.max).toBeLessThanOrEqual(1000)
    })

    it('should emit in all directions', () => {
      expect(EXPLOSION_EMITTER_CONFIG.angle.min).toBe(0)
      expect(EXPLOSION_EMITTER_CONFIG.angle.max).toBe(360)
    })
  })

  describe('CONFETTI_EMITTER_CONFIG', () => {
    it('should configure confetti with gravity', () => {
      expect(CONFETTI_EMITTER_CONFIG.gravityY).toBeGreaterThan(150) // Strong gravity for falling confetti
    })

    it('should have long lifespan for celebration', () => {
      expect(CONFETTI_EMITTER_CONFIG.lifespan.min).toBeGreaterThanOrEqual(2000)
      expect(CONFETTI_EMITTER_CONFIG.lifespan.max).toBeLessThanOrEqual(4000)
    })

    it('should emit in upward cone', () => {
      expect(CONFETTI_EMITTER_CONFIG.angle.min).toBeLessThan(0)
      expect(CONFETTI_EMITTER_CONFIG.angle.max).toBeGreaterThan(0)
      // Should create an upward cone, not full 360
      const angleRange = CONFETTI_EMITTER_CONFIG.angle.max - CONFETTI_EMITTER_CONFIG.angle.min
      expect(angleRange).toBeLessThan(180)
    })

    it('should include rotation for tumbling effect', () => {
      expect(CONFETTI_EMITTER_CONFIG.rotate).toBeDefined()
      expect(CONFETTI_EMITTER_CONFIG.rotateSpeed).toBeDefined()
    })
  })

  describe('getParticleConfig', () => {
    it('should return correct config for each particle type', () => {
      expect(getParticleConfig('fire')).toBe(FIRE_EMITTER_CONFIG)
      expect(getParticleConfig('ice')).toBe(ICE_EMITTER_CONFIG)
      expect(getParticleConfig('explosion')).toBe(EXPLOSION_EMITTER_CONFIG)
      expect(getParticleConfig('confetti')).toBe(CONFETTI_EMITTER_CONFIG)
    })

    it('should handle invalid particle type gracefully', () => {
      // @ts-expect-error Testing invalid input
      expect(() => getParticleConfig('invalid')).toThrow()
    })
  })

  describe('getPerformanceAdjustedQuantity', () => {
    it('should return full quantity for desktop', () => {
      expect(getPerformanceAdjustedQuantity('fire', 100, false)).toBeLessThanOrEqual(100)
      expect(getPerformanceAdjustedQuantity('ice', 80, false)).toBeLessThanOrEqual(80)
    })

    it('should reduce quantity for mobile', () => {
      const desktopQuantity = getPerformanceAdjustedQuantity('fire', 100, false)
      const mobileQuantity = getPerformanceAdjustedQuantity('fire', 100, true)
      expect(mobileQuantity).toBeLessThan(desktopQuantity)
    })

    it('should respect particle type limits', () => {
      // Even with high requested quantity, should cap at limits
      const fireDesktop = getPerformanceAdjustedQuantity('fire', 1000, false)
      expect(fireDesktop).toBeLessThanOrEqual(PARTICLE_LIMITS.DESKTOP.FIRE)

      const fireMobile = getPerformanceAdjustedQuantity('fire', 1000, true)
      expect(fireMobile).toBeLessThanOrEqual(PARTICLE_LIMITS.MOBILE.FIRE)
    })

    it('should handle low performance mode', () => {
      const normalQuantity = getPerformanceAdjustedQuantity('confetti', 100, false, 'normal')
      const lowQuantity = getPerformanceAdjustedQuantity('confetti', 100, false, 'low')
      expect(lowQuantity).toBeLessThan(normalQuantity)
    })

    it('should handle high performance mode', () => {
      const normalQuantity = getPerformanceAdjustedQuantity('explosion', 50, false, 'normal')
      const highQuantity = getPerformanceAdjustedQuantity('explosion', 50, false, 'high')
      expect(highQuantity).toBeGreaterThanOrEqual(normalQuantity)
    })
  })
})