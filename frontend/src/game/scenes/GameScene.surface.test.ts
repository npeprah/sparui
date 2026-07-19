import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameScene } from './GameScene'
import { useThemeStore } from '../../store/themeStore'

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    GameObjects: {
      Sprite: class {
        setPosition = vi.fn().mockReturnThis()
        setScale = vi.fn().mockReturnThis()
        setInteractive = vi.fn().mockReturnThis()
        on = vi.fn().mockReturnThis()
        off = vi.fn().mockReturnThis()
        destroy = vi.fn()
      },
    },
    Scene: class {
      cameras = { main: { width: 1920, height: 1080 } }
      add = {
        image: vi.fn().mockReturnValue({
          setScale: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          width: 1920,
          height: 1080,
        }),
        rectangle: vi.fn().mockReturnValue({
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        }),
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn(),
          fillCircle: vi.fn(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        }),
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
        }),
        container: vi.fn().mockReturnValue({
          add: vi.fn(),
          setDepth: vi.fn().mockReturnThis(),
        }),
      }
      textures = {
        exists: vi.fn(),
      }
      tweens = {
        add: vi.fn(),
      }
      time = {
        delayedCall: vi.fn(),
      }
      events = {
        on: vi.fn(),
        off: vi.fn(),
      }
      scene = {
        key: 'GameScene',
      }
    },
  },
}))

// Mock CardSprite
vi.mock('../sprites/CardSprite', () => ({
  CardSprite: vi.fn().mockImplementation(() => ({
    setPosition: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    suit: 'hearts',
    rank: '7',
  })),
}))

// Mock stores
vi.mock('../../store/themeStore', () => ({
  useThemeStore: {
    getState: vi.fn(),
    subscribe: vi.fn(),
  },
}))

// Mock other dependencies
vi.mock('../../store/gameStore', () => ({
  useGameStore: {
    getState: vi.fn().mockReturnValue({
      roomCode: 'TEST',
      players: [],
      gameState: null,
      currentTurn: null,
    }),
    subscribe: vi.fn(),
  },
}))

vi.mock('../../store/playerStore', () => ({
  usePlayerStore: {
    getState: vi.fn().mockReturnValue({
      playerId: 'player1',
      playerName: 'TestPlayer',
    }),
    subscribe: vi.fn(),
  },
}))

vi.mock('../../store/uiStore', () => ({
  useUIStore: {
    getState: vi.fn().mockReturnValue({
      soundEnabled: true,
      musicEnabled: true,
    }),
    subscribe: vi.fn(),
  },
}))

vi.mock('../../services/socketService', () => ({
  socketService: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}))

vi.mock('../../services/audioManager', () => ({
  AudioManager: {
    getInstance: vi.fn().mockReturnValue({
      initialize: vi.fn(),
      play: vi.fn(),
      destroy: vi.fn(),
    }),
  },
}))

vi.mock('../systems/ParticleEffects', () => ({
  ParticleEffects: vi.fn().mockImplementation(() => ({
    cleanup: vi.fn(),
  })),
}))

vi.mock('../utils/fpsCounter', () => ({
  createFPSCounter: vi.fn().mockReturnValue({
    update: vi.fn(),
    destroy: vi.fn(),
  }),
}))

describe('GameScene - Surface Background System', () => {
  let scene: GameScene
  let mockThemeStore: any

  beforeEach(() => {
    scene = new GameScene()

    // Setup mock theme store
    mockThemeStore = {
      selectedTheme: 'afro_heritage',
      availableThemes: ['afro_heritage', 'neon_arcade', 'royal_gold', 'ocean_breeze'],
    }

    ;(useThemeStore.getState as any).mockReturnValue(mockThemeStore)

    // Setup textures mock
    ;(scene as any).textures = {
      exists: vi.fn().mockImplementation((key: string) => {
        return key.startsWith('surface_')
      }),
    }

    // Setup other scene properties
    ;(scene as any).cameras = { main: { width: 1920, height: 1080 } }
    ;(scene as any).add = {
      image: vi.fn().mockReturnValue({
        setScale: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        width: 1920,
        height: 1080,
      }),
      rectangle: vi.fn().mockReturnValue({
        setDepth: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      }),
      graphics: vi.fn().mockReturnValue({
        fillStyle: vi.fn(),
        fillCircle: vi.fn(),
        setDepth: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      }),
      text: vi.fn().mockReturnValue({
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
      }),
      container: vi.fn().mockReturnValue({
        add: vi.fn(),
        setDepth: vi.fn().mockReturnThis(),
      }),
    }

    ;(scene as any).tweens = {
      add: vi.fn(),
    }

    ;(scene as any).time = {
      delayedCall: vi.fn(),
    }

    ;(scene as any).events = {
      on: vi.fn(),
      off: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Surface Loading', () => {
    it('should load the default surface (afro_heritage) on create', () => {
      scene.create()

      expect(scene.add.image).toHaveBeenCalledWith(
        960, // width / 2
        540, // height / 2
        'surface_afro_heritage'
      )
    })

    it('should scale surface to cover entire screen', () => {
      const mockImage = {
        setScale: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        width: 1920,
        height: 1080,
      }

      ;(scene.add.image as any).mockReturnValue(mockImage)

      scene.create()

      // Should calculate scale to cover screen
      const scaleX = 1920 / 1920 // 1
      const scaleY = 1080 / 1080 // 1
      const scale = Math.max(scaleX, scaleY) // 1

      expect(mockImage.setScale).toHaveBeenCalledWith(scale)
    })

    it('should set surface background at depth -10', () => {
      const mockImage = {
        setScale: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        width: 1920,
        height: 1080,
      }

      ;(scene.add.image as any).mockReturnValue(mockImage)

      scene.create()

      expect(mockImage.setDepth).toHaveBeenCalledWith(-10)
    })

    it('should fall back to default green felt if surface texture not found', () => {
      ;(scene.textures.exists as any).mockReturnValue(false)

      scene.create()

      expect(scene.add.rectangle).toHaveBeenCalledWith(
        960,
        540,
        1920,
        1080,
        0x0a5f38
      )
    })

    it('should store background reference for later updates', () => {
      scene.create()

      expect((scene as any).backgroundImage).toBeDefined()
    })
  })

  describe('Surface Theme Changes', () => {
    it('should setup theme change listener on create', () => {
      const mockSubscribe = vi.fn()
      ;(useThemeStore as any).subscribe = mockSubscribe

      scene.create()

      expect(mockSubscribe).toHaveBeenCalled()
    })

    it('should update surface when theme changes', () => {
      scene.create()

      // Get the theme change handler
      const subscribeCall = (useThemeStore as any).subscribe.mock.calls[0]
      const themeChangeHandler = subscribeCall[0]

      // Clear previous calls
      vi.clearAllMocks()

      // Simulate theme change
      mockThemeStore.selectedTheme = 'neon_arcade'
      themeChangeHandler({ selectedTheme: 'neon_arcade' })

      // Should create new background with new theme
      expect(scene.add.image).toHaveBeenCalledWith(
        960,
        540,
        'surface_neon_arcade'
      )
    })

    it('should destroy old background before creating new one', () => {
      scene.create()

      const oldBackground = (scene as any).backgroundImage
      const destroySpy = vi.spyOn(oldBackground, 'destroy')

      // Get the theme change handler
      const subscribeCall = (useThemeStore as any).subscribe.mock.calls[0]
      const themeChangeHandler = subscribeCall[0]

      // Simulate theme change
      mockThemeStore.selectedTheme = 'royal_gold'
      themeChangeHandler({ selectedTheme: 'royal_gold' })

      expect(destroySpy).toHaveBeenCalled()
    })

    it('should not update if theme has not changed', () => {
      scene.create()

      // Clear previous calls
      vi.clearAllMocks()

      // Get the theme change handler
      const subscribeCall = (useThemeStore as any).subscribe.mock.calls[0]
      const themeChangeHandler = subscribeCall[0]

      // Simulate same theme
      themeChangeHandler({ selectedTheme: 'afro_heritage' })

      // Should not create new image
      expect(scene.add.image).not.toHaveBeenCalled()
    })
  })

  describe('Smooth Fade Transition', () => {
    it('should fade out old background when changing surfaces', () => {
      scene.create()

      const oldBackground = (scene as any).backgroundImage

      // Get the theme change handler
      const subscribeCall = (useThemeStore as any).subscribe.mock.calls[0]
      const themeChangeHandler = subscribeCall[0]

      // Simulate theme change
      mockThemeStore.selectedTheme = 'ocean_breeze'
      themeChangeHandler({ selectedTheme: 'ocean_breeze' })

      // Should add fade out tween for old background
      expect(scene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: oldBackground,
          alpha: 0,
          duration: 300,
          ease: 'Power2',
        })
      )
    })

    it('should fade in new background when changing surfaces', () => {
      const newBackground = {
        setScale: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        width: 1920,
        height: 1080,
      }

      scene.create()

      vi.clearAllMocks()
      ;(scene.add.image as any).mockReturnValue(newBackground)

      // Get the theme change handler
      const subscribeCall = (useThemeStore as any).subscribe.mock.calls[0]
      const themeChangeHandler = subscribeCall[0]

      // Simulate theme change
      mockThemeStore.selectedTheme = 'neon_arcade'
      themeChangeHandler({ selectedTheme: 'neon_arcade' })

      // New background should start transparent
      expect(newBackground.setAlpha).toHaveBeenCalledWith(0)

      // Should add fade in tween for new background
      expect(scene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: newBackground,
          alpha: 1,
          duration: 300,
          ease: 'Power2',
        })
      )
    })

    it('should have 300ms transition duration', () => {
      scene.create()

      // Get the theme change handler
      const subscribeCall = (useThemeStore as any).subscribe.mock.calls[0]
      const themeChangeHandler = subscribeCall[0]

      // Simulate theme change
      mockThemeStore.selectedTheme = 'royal_gold'
      themeChangeHandler({ selectedTheme: 'royal_gold' })

      // Check both fade out and fade in tweens have 300ms duration
      const fadeOutCall = scene.tweens.add.mock.calls.find(
        (call: any) => call[0].alpha === 0
      )
      const fadeInCall = scene.tweens.add.mock.calls.find(
        (call: any) => call[0].alpha === 1
      )

      expect(fadeOutCall[0].duration).toBe(300)
      expect(fadeInCall[0].duration).toBe(300)
    })

    it('should destroy old background after fade out completes', () => {
      scene.create()

      const oldBackground = (scene as any).backgroundImage
      const destroySpy = vi.spyOn(oldBackground, 'destroy')

      // Get the theme change handler
      const subscribeCall = (useThemeStore as any).subscribe.mock.calls[0]
      const themeChangeHandler = subscribeCall[0]

      // Simulate theme change
      mockThemeStore.selectedTheme = 'ocean_breeze'
      themeChangeHandler({ selectedTheme: 'ocean_breeze' })

      // Get the fade out tween config
      const fadeOutCall = scene.tweens.add.mock.calls.find(
        (call: any) => call[0].alpha === 0
      )

      // Simulate tween complete
      if (fadeOutCall[0].onComplete) {
        fadeOutCall[0].onComplete()
      }

      expect(destroySpy).toHaveBeenCalled()
    })
  })

  describe('Surface Persistence', () => {
    it('should load persisted theme from themeStore', () => {
      mockThemeStore.selectedTheme = 'royal_gold'

      scene.create()

      expect(scene.add.image).toHaveBeenCalledWith(
        960,
        540,
        'surface_royal_gold'
      )
    })

    it('should maintain surface across scene restarts', () => {
      mockThemeStore.selectedTheme = 'neon_arcade'

      // First create
      scene.create()
      scene.shutdown()

      vi.clearAllMocks()

      // Second create
      scene.create()

      expect(scene.add.image).toHaveBeenCalledWith(
        960,
        540,
        'surface_neon_arcade'
      )
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe from theme changes on shutdown', () => {
      const mockUnsubscribe = vi.fn()
      ;(useThemeStore as any).subscribe = vi.fn().mockReturnValue(mockUnsubscribe)

      scene.create()
      scene.shutdown()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should destroy background image on shutdown', () => {
      scene.create()

      const background = (scene as any).backgroundImage
      const destroySpy = vi.spyOn(background, 'destroy')

      scene.shutdown()

      expect(destroySpy).toHaveBeenCalled()
    })
  })
})