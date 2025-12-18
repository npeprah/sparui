import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  ANIMATION_SCALE,
  ANIMATION_ALPHA,
  ANIMATION_ROTATION,
  GLOW_CONFIG,
  PARTICLE_CONFIG,
  SOUND_EVENTS,
  HAPTIC_PATTERNS,
  getRandomDealRotation,
  getRandomPlayRotation,
  triggerHaptic,
  emitSoundEvent,
} from './animations'

describe('Animation Constants', () => {
  describe('ANIMATION_DURATION', () => {
    it('should have valid duration values in milliseconds', () => {
      expect(ANIMATION_DURATION.DEAL).toBeGreaterThan(0)
      expect(ANIMATION_DURATION.FLIP).toBeGreaterThan(0)
      expect(ANIMATION_DURATION.PLAY).toBeGreaterThan(0)
      expect(ANIMATION_DURATION.WIN_PULSE).toBeGreaterThan(0)
    })

    it('should have deal stagger shorter than deal duration', () => {
      expect(ANIMATION_DURATION.DEAL_STAGGER).toBeLessThan(ANIMATION_DURATION.DEAL)
    })

    it('should have flip halfway as half of flip duration', () => {
      expect(ANIMATION_DURATION.FLIP_HALFWAY).toBe(ANIMATION_DURATION.FLIP / 2)
    })
  })

  describe('ANIMATION_EASING', () => {
    it('should have valid Phaser easing names', () => {
      const validEasings = [
        'Linear',
        'Quad',
        'Cubic',
        'Quart',
        'Quint',
        'Sine',
        'Expo',
        'Circ',
        'Back',
        'Bounce',
        'Elastic',
      ]

      Object.values(ANIMATION_EASING).forEach((easing) => {
        const hasValidPrefix = validEasings.some((valid) => easing.startsWith(valid))
        expect(hasValidPrefix).toBe(true)
      })
    })
  })

  describe('ANIMATION_SCALE', () => {
    it('should have flip midpoint near zero', () => {
      expect(ANIMATION_SCALE.FLIP_MIDPOINT).toBeLessThan(0.1)
      expect(ANIMATION_SCALE.FLIP_MIDPOINT).toBeGreaterThan(0)
    })

    it('should have hover scale greater than 1', () => {
      expect(ANIMATION_SCALE.HOVER_SCALE).toBeGreaterThan(1.0)
    })

    it('should have lose scale less than 1', () => {
      expect(ANIMATION_SCALE.LOSE_SCALE).toBeLessThan(1.0)
    })

    it('should have win pulse range valid', () => {
      expect(ANIMATION_SCALE.WIN_PULSE_MIN).toBe(1.0)
      expect(ANIMATION_SCALE.WIN_PULSE_MAX).toBeGreaterThan(ANIMATION_SCALE.WIN_PULSE_MIN)
    })
  })

  describe('ANIMATION_ALPHA', () => {
    it('should have alpha values between 0 and 1', () => {
      Object.values(ANIMATION_ALPHA).forEach((alpha) => {
        expect(alpha).toBeGreaterThanOrEqual(0)
        expect(alpha).toBeLessThanOrEqual(1)
      })
    })

    it('should have visible alpha at 1.0', () => {
      expect(ANIMATION_ALPHA.VISIBLE).toBe(1.0)
    })

    it('should have lose alpha less than visible', () => {
      expect(ANIMATION_ALPHA.LOSE_ALPHA).toBeLessThan(ANIMATION_ALPHA.VISIBLE)
    })
  })

  describe('ANIMATION_ROTATION', () => {
    it('should have symmetric rotation ranges', () => {
      expect(ANIMATION_ROTATION.DEAL_MIN).toBe(-ANIMATION_ROTATION.DEAL_MAX)
      expect(ANIMATION_ROTATION.PLAY_MIN).toBe(-ANIMATION_ROTATION.PLAY_MAX)
    })

    it('should have flip rotation as PI', () => {
      expect(ANIMATION_ROTATION.FLIP_Y_AXIS).toBe(Math.PI)
    })
  })

  describe('GLOW_CONFIG', () => {
    it('should have valid color values', () => {
      Object.values(GLOW_CONFIG).forEach((config) => {
        expect(config.color).toBeGreaterThanOrEqual(0)
        expect(config.color).toBeLessThanOrEqual(0xffffff)
      })
    })

    it('should have valid thickness values', () => {
      Object.values(GLOW_CONFIG).forEach((config) => {
        expect(config.thickness).toBeGreaterThan(0)
      })
    })

    it('should have alpha values between 0 and 1', () => {
      Object.values(GLOW_CONFIG).forEach((config) => {
        expect(config.alpha).toBeGreaterThanOrEqual(0)
        expect(config.alpha).toBeLessThanOrEqual(1)
      })
    })

    it('should have win glow thicker than hover glow', () => {
      expect(GLOW_CONFIG.WIN.thickness).toBeGreaterThan(GLOW_CONFIG.HOVER.thickness)
    })
  })

  describe('PARTICLE_CONFIG', () => {
    it('should have valid win confetti configuration', () => {
      const config = PARTICLE_CONFIG.WIN_CONFETTI
      expect(config.speed.max).toBeGreaterThan(config.speed.min)
      expect(config.lifespan).toBeGreaterThan(0)
      expect(config.gravityY).toBeGreaterThan(0)
    })

    it('should have valid ambient sparkles configuration', () => {
      const config = PARTICLE_CONFIG.AMBIENT_SPARKLES
      expect(config.speed.max).toBeGreaterThan(config.speed.min)
      expect(config.lifespan).toBeGreaterThan(0)
    })
  })

  describe('SOUND_EVENTS', () => {
    it('should have sound event names prefixed with "sound:"', () => {
      Object.values(SOUND_EVENTS).forEach((event) => {
        expect(event).toMatch(/^sound:/)
      })
    })

    it('should have unique event names', () => {
      const events = Object.values(SOUND_EVENTS)
      const uniqueEvents = new Set(events)
      expect(uniqueEvents.size).toBe(events.length)
    })
  })

  describe('HAPTIC_PATTERNS', () => {
    it('should have valid haptic duration values', () => {
      expect(HAPTIC_PATTERNS.LIGHT).toBeGreaterThan(0)
      expect(HAPTIC_PATTERNS.MEDIUM).toBeGreaterThan(HAPTIC_PATTERNS.LIGHT)
      expect(HAPTIC_PATTERNS.HEAVY).toBeGreaterThan(HAPTIC_PATTERNS.MEDIUM)
    })

    it('should have valid pattern arrays', () => {
      expect(Array.isArray(HAPTIC_PATTERNS.CARD_PLAY)).toBe(true)
      expect(Array.isArray(HAPTIC_PATTERNS.WIN)).toBe(true)
      expect(HAPTIC_PATTERNS.WIN.length).toBeGreaterThan(1) // Multiple vibrations
    })
  })

  describe('getRandomDealRotation()', () => {
    it('should return rotation within deal range', () => {
      for (let i = 0; i < 100; i++) {
        const rotation = getRandomDealRotation()
        expect(rotation).toBeGreaterThanOrEqual(ANIMATION_ROTATION.DEAL_MIN)
        expect(rotation).toBeLessThanOrEqual(ANIMATION_ROTATION.DEAL_MAX)
      }
    })

    it('should return different values on multiple calls', () => {
      const rotations = new Set()
      for (let i = 0; i < 10; i++) {
        rotations.add(getRandomDealRotation())
      }
      // Should have at least a few different values
      expect(rotations.size).toBeGreaterThan(1)
    })
  })

  describe('getRandomPlayRotation()', () => {
    it('should return rotation within play range', () => {
      for (let i = 0; i < 100; i++) {
        const rotation = getRandomPlayRotation()
        expect(rotation).toBeGreaterThanOrEqual(ANIMATION_ROTATION.PLAY_MIN)
        expect(rotation).toBeLessThanOrEqual(ANIMATION_ROTATION.PLAY_MAX)
      }
    })

    it('should return different values on multiple calls', () => {
      const rotations = new Set()
      for (let i = 0; i < 10; i++) {
        rotations.add(getRandomPlayRotation())
      }
      expect(rotations.size).toBeGreaterThan(1)
    })
  })

  describe('triggerHaptic()', () => {
    beforeEach(() => {
      // Reset navigator.vibrate mock
      if (navigator.vibrate) {
        vi.clearAllMocks()
      }
    })

    it('should call navigator.vibrate with single value for simple patterns', () => {
      const vibrateMock = vi.fn()
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
      })

      triggerHaptic('LIGHT')

      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.LIGHT)
    })

    it('should call navigator.vibrate with array for complex patterns', () => {
      const vibrateMock = vi.fn()
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
      })

      triggerHaptic('CARD_PLAY')

      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.CARD_PLAY)
    })

    it('should not throw if navigator.vibrate is not available', () => {
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
      })

      expect(() => triggerHaptic('LIGHT')).not.toThrow()
    })
  })

  describe('emitSoundEvent()', () => {
    it('should emit event on scene', () => {
      const mockScene = {
        events: {
          emit: vi.fn(),
        },
      } as unknown as Phaser.Scene

      emitSoundEvent(mockScene, 'CARD_DEAL')

      expect(mockScene.events.emit).toHaveBeenCalledWith(SOUND_EVENTS.CARD_DEAL)
    })

    it('should emit correct event for each sound type', () => {
      const mockScene = {
        events: {
          emit: vi.fn(),
        },
      } as unknown as Phaser.Scene

      emitSoundEvent(mockScene, 'CARD_FLIP')
      expect(mockScene.events.emit).toHaveBeenCalledWith(SOUND_EVENTS.CARD_FLIP)

      emitSoundEvent(mockScene, 'WIN_ROUND')
      expect(mockScene.events.emit).toHaveBeenCalledWith(SOUND_EVENTS.WIN_ROUND)
    })
  })
})
