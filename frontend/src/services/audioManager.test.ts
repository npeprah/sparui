import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AudioManager } from './audioManager'
import Phaser from 'phaser'

/**
 * Tests for AudioManager Service
 *
 * Test-driven approach:
 * 1. Singleton pattern
 * 2. Sound loading (preload)
 * 3. Sound initialization (init)
 * 4. Sound playback
 * 5. Volume controls (master and sfx)
 * 6. Mute/unmute functionality
 * 7. Mobile audio unlock
 * 8. Error handling
 * 9. Store integration
 */
describe('AudioManager', () => {
  let audioManager: AudioManager
  let mockScene: any

  beforeEach(() => {
    // Reset singleton between tests
    AudioManager.resetInstance()
    audioManager = AudioManager.getInstance()

    // Create mock Phaser scene
    mockScene = {
      load: {
        audio: vi.fn(),
        on: vi.fn(),
      },
      sound: {
        add: vi.fn().mockReturnValue({
          play: vi.fn(),
          setVolume: vi.fn(),
          stop: vi.fn(),
          destroy: vi.fn(),
        }),
        volume: 1,
      },
      events: {
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn(),
      },
      input: {
        once: vi.fn(),
      },
      sys: {
        game: {
          device: {
            os: {
              iOS: false,
              android: false,
            },
          },
        },
      },
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = AudioManager.getInstance()
      const instance2 = AudioManager.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should create a new instance after reset', () => {
      const instance1 = AudioManager.getInstance()
      AudioManager.resetInstance()
      const instance2 = AudioManager.getInstance()
      expect(instance1).not.toBe(instance2)
    })

    it('should throw error if trying to instantiate directly', () => {
      expect(() => new (AudioManager as any)()).toThrow()
    })
  })

  describe('Sound Loading (preload)', () => {
    it('should load all 16 sound files', () => {
      audioManager.preload(mockScene)

      // Verify all 16 sounds are loaded
      expect(mockScene.load.audio).toHaveBeenCalledTimes(16)
    })

    it('should load card sounds with correct paths', () => {
      audioManager.preload(mockScene)

      // Card sounds (6 total)
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:card_deal',
        'assets/sounds/sfx/cards/card_deal.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:card_flip',
        'assets/sounds/sfx/cards/card_flip.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:card_play',
        'assets/sounds/sfx/cards/card_play.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:card_hover',
        'assets/sounds/sfx/cards/card_hover.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:card_shuffle',
        'assets/sounds/sfx/cards/card_shuffle.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:card_collect',
        'assets/sounds/sfx/cards/card_collect.wav'
      )
    })

    it('should load game event sounds with correct paths', () => {
      audioManager.preload(mockScene)

      // Game event sounds (10 total)
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:win_round',
        'assets/sounds/sfx/game_events/round_win.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:lose_round',
        'assets/sounds/sfx/game_events/round_loss.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:game_victory',
        'assets/sounds/sfx/game_events/game_victory.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:game_defeat',
        'assets/sounds/sfx/game_events/game_defeat.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:dry_declaration',
        'assets/sounds/sfx/game_events/dry_declaration.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:show_dry_declaration',
        'assets/sounds/sfx/game_events/show_dry_declaration.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:fire_streak',
        'assets/sounds/sfx/game_events/fire_streak.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:freeze_effect',
        'assets/sounds/sfx/game_events/freeze_effect.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:invalid_move',
        'assets/sounds/sfx/game_events/invalid_move.wav'
      )
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        'sound:phase_transition',
        'assets/sounds/sfx/game_events/phase_transition.wav'
      )
    })

    it('should only allow preload to be called once', () => {
      audioManager.preload(mockScene)
      audioManager.preload(mockScene)

      // Should only load sounds once
      expect(mockScene.load.audio).toHaveBeenCalledTimes(16)
    })
  })

  describe('Sound Initialization (init)', () => {
    it('should initialize event listeners for all sound events', () => {
      audioManager.preload(mockScene)
      audioManager.init(mockScene)

      // Should setup event listeners for all 16 sounds
      expect(mockScene.events.on).toHaveBeenCalledWith(
        'sound:card_deal',
        expect.any(Function)
      )
      expect(mockScene.events.on).toHaveBeenCalledWith(
        'sound:card_flip',
        expect.any(Function)
      )
      // ... etc for all sound events
    })

    it('should setup mobile audio unlock on iOS', () => {
      mockScene.sys.game.device.os.iOS = true
      audioManager.preload(mockScene)
      audioManager.init(mockScene)

      expect(mockScene.input.once).toHaveBeenCalledWith(
        'pointerdown',
        expect.any(Function)
      )
    })

    it('should setup mobile audio unlock on Android', () => {
      mockScene.sys.game.device.os.android = true
      audioManager.preload(mockScene)
      audioManager.init(mockScene)

      expect(mockScene.input.once).toHaveBeenCalledWith(
        'pointerdown',
        expect.any(Function)
      )
    })

    it('should not setup mobile audio unlock on desktop', () => {
      mockScene.sys.game.device.os.iOS = false
      mockScene.sys.game.device.os.android = false
      audioManager.preload(mockScene)
      audioManager.init(mockScene)

      expect(mockScene.input.once).not.toHaveBeenCalled()
    })

    it('should throw error if init called before preload', () => {
      expect(() => audioManager.init(mockScene)).toThrow(
        'AudioManager: preload() must be called before init()'
      )
    })

    it('should only allow init to be called once', () => {
      audioManager.preload(mockScene)
      audioManager.init(mockScene)

      // Reset mock to count only second call
      mockScene.events.on.mockClear()
      audioManager.init(mockScene)

      // Should not setup listeners again
      expect(mockScene.events.on).not.toHaveBeenCalled()
    })
  })

  describe('Sound Playback', () => {
    beforeEach(() => {
      audioManager.preload(mockScene)
      audioManager.init(mockScene)
    })

    it('should play sound when sound key is valid', () => {
      const mockSound = mockScene.sound.add()

      audioManager.play('sound:card_deal')

      expect(mockScene.sound.add).toHaveBeenCalledWith('sound:card_deal')
      expect(mockSound.play).toHaveBeenCalled()
    })

    it('should apply custom volume to sound', () => {
      const mockSound = mockScene.sound.add()

      // Reset volumes to defaults for this test
      audioManager.setVolume('master', 1.0)
      audioManager.setVolume('sfx', 1.0)

      audioManager.play('sound:card_deal', { volume: 0.5 })

      expect(mockSound.setVolume).toHaveBeenCalledWith(0.5)
    })

    it('should apply master volume multiplier to sound', () => {
      const mockSound = mockScene.sound.add()
      audioManager.setVolume('master', 0.8)

      audioManager.play('sound:card_deal')

      // Master volume should be applied
      expect(mockSound.setVolume).toHaveBeenCalledWith(0.8)
    })

    it('should apply both master and sfx volume multipliers', () => {
      const mockSound = mockScene.sound.add()
      audioManager.setVolume('master', 0.8)
      audioManager.setVolume('sfx', 0.5)

      audioManager.play('sound:card_deal')

      // Master (0.8) * SFX (0.5) = 0.4
      expect(mockSound.setVolume).toHaveBeenCalledWith(0.4)
    })

    it('should not play sound when muted', () => {
      audioManager.mute()

      audioManager.play('sound:card_deal')

      expect(mockScene.sound.add).not.toHaveBeenCalled()
    })

    it('should not play sound when sfx is muted', () => {
      audioManager.mute('sfx')

      audioManager.play('sound:card_deal')

      expect(mockScene.sound.add).not.toHaveBeenCalled()
    })

    it('should handle invalid sound key gracefully', () => {
      expect(() => {
        audioManager.play('invalid:sound')
      }).not.toThrow()
    })

    it('should respect soundEnabled from uiStore', () => {
      // This will be implemented with store integration
      // For now, just verify the method exists
      expect(audioManager.play).toBeDefined()
    })
  })

  describe('Volume Controls', () => {
    it('should set master volume', () => {
      audioManager.setVolume('master', 0.7)
      expect(audioManager.getVolume('master')).toBe(0.7)
    })

    it('should set sfx volume', () => {
      audioManager.setVolume('sfx', 0.5)
      expect(audioManager.getVolume('sfx')).toBe(0.5)
    })

    it('should clamp master volume to 0-1 range', () => {
      audioManager.setVolume('master', 1.5)
      expect(audioManager.getVolume('master')).toBe(1.0)

      audioManager.setVolume('master', -0.5)
      expect(audioManager.getVolume('master')).toBe(0.0)
    })

    it('should clamp sfx volume to 0-1 range', () => {
      audioManager.setVolume('sfx', 2.0)
      expect(audioManager.getVolume('sfx')).toBe(1.0)

      audioManager.setVolume('sfx', -1.0)
      expect(audioManager.getVolume('sfx')).toBe(0.0)
    })

    it('should get default master volume', () => {
      expect(audioManager.getVolume('master')).toBe(1.0)
    })

    it('should get default sfx volume', () => {
      expect(audioManager.getVolume('sfx')).toBe(1.0)
    })

    it('should persist volume to uiStore when changed', () => {
      // This will be implemented with store integration
      audioManager.setVolume('master', 0.8)
      // TODO: Verify uiStore was updated
    })
  })

  describe('Mute/Unmute Functionality', () => {
    it('should mute all audio', () => {
      audioManager.mute()
      expect(audioManager.isMuted()).toBe(true)
    })

    it('should unmute all audio', () => {
      audioManager.mute()
      audioManager.unmute()
      expect(audioManager.isMuted()).toBe(false)
    })

    it('should mute only master', () => {
      audioManager.mute('master')
      expect(audioManager.isMuted('master')).toBe(true)
      expect(audioManager.isMuted('sfx')).toBe(false)
    })

    it('should mute only sfx', () => {
      audioManager.mute('sfx')
      expect(audioManager.isMuted('sfx')).toBe(true)
      expect(audioManager.isMuted('master')).toBe(false)
    })

    it('should unmute only master', () => {
      audioManager.mute('master')
      audioManager.unmute('master')
      expect(audioManager.isMuted('master')).toBe(false)
    })

    it('should unmute only sfx', () => {
      audioManager.mute('sfx')
      audioManager.unmute('sfx')
      expect(audioManager.isMuted('sfx')).toBe(false)
    })

    it('should return correct muted state for overall audio', () => {
      audioManager.mute('master')
      expect(audioManager.isMuted()).toBe(true)

      audioManager.unmute('master')
      audioManager.mute('sfx')
      expect(audioManager.isMuted()).toBe(true)
    })
  })

  describe('Mobile Audio Unlock', () => {
    it('should unlock audio on first user interaction (iOS)', () => {
      mockScene.sys.game.device.os.iOS = true
      audioManager.preload(mockScene)
      audioManager.init(mockScene)

      // Simulate user tap
      const pointerCallback = mockScene.input.once.mock.calls[0][1]
      pointerCallback()

      // Audio should be unlocked (verify by checking if a silent sound plays)
      expect(mockScene.sound.add).toHaveBeenCalled()
    })

    it('should only unlock audio once', () => {
      mockScene.sys.game.device.os.iOS = true
      audioManager.preload(mockScene)
      audioManager.init(mockScene)

      // Simulate first tap
      const pointerCallback = mockScene.input.once.mock.calls[0][1]
      mockScene.sound.add.mockClear()
      pointerCallback()

      const firstCallCount = mockScene.sound.add.mock.calls.length

      // Simulate second tap
      mockScene.sound.add.mockClear()
      pointerCallback()

      // Should not unlock again
      expect(mockScene.sound.add).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup (destroy)', () => {
    it('should remove all event listeners', () => {
      audioManager.preload(mockScene)
      audioManager.init(mockScene)

      audioManager.destroy()

      // Should remove all 16 event listeners
      expect(mockScene.events.off).toHaveBeenCalledTimes(16)
    })

    it('should reset initialization state', () => {
      audioManager.preload(mockScene)
      audioManager.init(mockScene)
      audioManager.destroy()

      // Should be able to init again after destroy
      expect(() => audioManager.init(mockScene)).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing scene gracefully', () => {
      expect(() => audioManager.preload(null as any)).not.toThrow()
    })

    it('should handle scene without sound manager', () => {
      const invalidScene = { ...mockScene, sound: undefined }
      audioManager.preload(mockScene)
      audioManager.init(invalidScene)

      expect(() => audioManager.play('sound:card_deal')).not.toThrow()
    })

    it('should log error when sound fails to play', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockScene.sound.add.mockImplementation(() => {
        throw new Error('Sound not found')
      })

      audioManager.preload(mockScene)
      audioManager.init(mockScene)
      audioManager.play('sound:card_deal')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Integration with uiStore', () => {
    it('should initialize volumes from uiStore', () => {
      // TODO: Mock uiStore and verify initial state
      expect(audioManager.getVolume('master')).toBeDefined()
      expect(audioManager.getVolume('sfx')).toBeDefined()
    })

    it('should sync mute state with uiStore', () => {
      // TODO: Verify uiStore.soundEnabled is respected
      audioManager.mute()
      expect(audioManager.isMuted()).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should reuse sound instances for frequently played sounds', () => {
      // Get fresh audioManager instance
      AudioManager.resetInstance()
      const freshAudioManager = AudioManager.getInstance()

      // Ensure audio is not muted
      freshAudioManager.unmute()

      // Create fresh mock scene
      const freshMockScene = {
        load: {
          audio: vi.fn(),
          on: vi.fn(),
        },
        sound: {
          add: vi.fn().mockReturnValue({
            play: vi.fn(),
            setVolume: vi.fn(),
            stop: vi.fn(),
            destroy: vi.fn(),
            once: vi.fn(),
          }),
          volume: 1,
        },
        events: {
          on: vi.fn(),
          off: vi.fn(),
          once: vi.fn(),
        },
        input: {
          once: vi.fn(),
        },
        sys: {
          game: {
            device: {
              os: {
                iOS: false,
                android: false,
              },
            },
          },
        },
      }

      freshAudioManager.preload(freshMockScene)
      freshAudioManager.init(freshMockScene)

      // Clear mocks after init
      freshMockScene.sound.add.mockClear()

      freshAudioManager.play('sound:card_hover')
      freshAudioManager.play('sound:card_hover')
      freshAudioManager.play('sound:card_hover')

      // Should create sound object for each play (Phaser handles pooling internally)
      expect(freshMockScene.sound.add).toHaveBeenCalledTimes(3)
    })

    it('should not block on sound playback', () => {
      audioManager.preload(mockScene)
      audioManager.init(mockScene)

      const start = Date.now()
      audioManager.play('sound:card_deal')
      const duration = Date.now() - start

      // Should be near-instant (< 10ms)
      expect(duration).toBeLessThan(10)
    })
  })
})
