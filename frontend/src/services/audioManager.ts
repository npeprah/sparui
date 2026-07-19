import Phaser from 'phaser'
import { useUIStore } from '../store/uiStore'

/**
 * Sound mapping configuration
 * Maps sound event keys to file paths
 */
const SOUND_CONFIG = {
  // Card sounds (6)
  'sound:card_deal': 'assets/sounds/sfx/cards/card_deal.wav',
  'sound:card_flip': 'assets/sounds/sfx/cards/card_flip.wav',
  'sound:card_play': 'assets/sounds/sfx/cards/card_play.wav',
  'sound:card_hover': 'assets/sounds/sfx/cards/card_hover.wav',
  'sound:card_shuffle': 'assets/sounds/sfx/cards/card_shuffle.wav',
  'sound:card_collect': 'assets/sounds/sfx/cards/card_collect.wav',

  // Game event sounds (10)
  'sound:win_round': 'assets/sounds/sfx/game_events/round_win.wav',
  'sound:lose_round': 'assets/sounds/sfx/game_events/round_loss.wav',
  'sound:game_victory': 'assets/sounds/sfx/game_events/game_victory.wav',
  'sound:game_defeat': 'assets/sounds/sfx/game_events/game_defeat.wav',
  'sound:dry_declaration': 'assets/sounds/sfx/game_events/dry_declaration.wav',
  'sound:show_dry_declaration': 'assets/sounds/sfx/game_events/show_dry_declaration.wav',
  'sound:fire_streak': 'assets/sounds/sfx/game_events/fire_streak.wav',
  'sound:freeze_effect': 'assets/sounds/sfx/game_events/freeze_effect.wav',
  // Repurposed (Ticket 10): off-suit plays are legal now (flag-policed), so this
  // is NOT a "wrong suit" cue. Intended trigger: the pre-leader rejection - a
  // follower attempting to open a trick before the leader has led. Wire the
  // emit at that rejection site (trigger site not yet present in this branch).
  'sound:invalid_move': 'assets/sounds/sfx/game_events/invalid_move.wav',
  'sound:phase_transition': 'assets/sounds/sfx/game_events/phase_transition.wav',
} as const

type SoundKey = keyof typeof SOUND_CONFIG
type VolumeCategory = 'master' | 'sfx'

/**
 * Options for playing a sound
 */
interface PlaySoundOptions {
  volume?: number
}

/**
 * AudioManager - Singleton service for managing game audio
 *
 * Features:
 * - Singleton pattern for global access
 * - Loads all 16 game sounds
 * - Volume controls per category (master, sfx)
 * - Mute/unmute functionality
 * - Mobile audio unlock (iOS Safari compatibility)
 * - Integration with Zustand uiStore
 *
 * Usage:
 * ```typescript
 * const audioManager = AudioManager.getInstance()
 * audioManager.preload(scene)  // In PreloadScene
 * audioManager.init(scene)     // In GameScene.create()
 * audioManager.play('sound:card_deal')
 * ```
 */
export class AudioManager {
  private static instance: AudioManager | null = null

  private scene: Phaser.Scene | null = null
  private preloaded = false
  private initialized = false
  private audioUnlocked = false

  // Volume settings (0-1)
  private volumes: Record<VolumeCategory, number> = {
    master: 1.0,
    sfx: 1.0,
  }

  // Mute states
  private muted: Record<VolumeCategory | 'all', boolean> = {
    all: false,
    master: false,
    sfx: false,
  }

  // Event listener cleanup tracking
  private eventListeners: Array<{ event: string; handler: () => void }> = []

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {
    if (AudioManager.instance) {
      throw new Error('AudioManager: Use getInstance() instead of new')
    }

    // Initialize volumes from uiStore if available
    this.initFromStore()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    AudioManager.instance = null
  }

  /**
   * Initialize volumes from uiStore
   */
  private initFromStore(): void {
    try {
      const uiState = useUIStore.getState()
      this.volumes.master = uiState.masterVolume || 1.0
      this.volumes.sfx = uiState.sfxVolume || 1.0

      // Sync mute state with soundEnabled
      if (!uiState.soundEnabled) {
        this.muted.all = true
      }
    } catch (error) {
      // Store not available, use defaults
      console.warn('AudioManager: Could not initialize from uiStore', error)
    }
  }

  /**
   * Preload all sound assets
   * Must be called in PreloadScene.preload()
   *
   * @param scene - The Phaser scene with the loader
   * @param force - Force reload even if already preloaded (for hot reload)
   */
  public preload(scene: Phaser.Scene, force = false): void {
    console.log('[AudioManager] ===== PRELOAD CALLED =====')
    console.log('[AudioManager] Current state:', {
      preloaded: this.preloaded,
      initialized: this.initialized,
      hasScene: !!this.scene,
      force,
    })

    if (!scene?.load) {
      console.error('[AudioManager] ERROR: Invalid scene provided to preload()')
      console.error('[AudioManager] scene exists:', !!scene)
      console.error('[AudioManager] scene.load exists:', !!(scene && scene.load))
      return
    }

    if (this.preloaded && !force) {
      console.warn('[AudioManager] WARNING: preload() already called, skipping')
      console.warn('[AudioManager] Use force=true to reload, or call resetInstance() first')
      return
    }

    this.scene = scene

    console.log('[AudioManager] Scene key:', scene.scene.key)
    console.log('[AudioManager] Loader state:', {
      isLoading: scene.load.isLoading(),
      isReady: scene.load.isReady(),
      totalToLoad: scene.load.totalToLoad,
      listSize: scene.load.list.size,
    })
    console.log('[AudioManager] Loading 16 sounds from SOUND_CONFIG...')
    console.log('[AudioManager] SOUND_CONFIG keys:', Object.keys(SOUND_CONFIG))

    // Load all 16 sounds
    let loadCount = 0
    Object.entries(SOUND_CONFIG).forEach(([key, path]) => {
      console.log(`[AudioManager] Queueing audio: ${key} from path: ${path}`)
      try {
        scene.load.audio(key, path)
        loadCount++
        console.log(`[AudioManager] ✓ Successfully queued: ${key}`)
      } catch (error) {
        console.error(`[AudioManager] ✗ Failed to queue: ${key}`, error)
      }
    })

    console.log(`[AudioManager] Queued ${loadCount} audio files for loading`)
    console.log('[AudioManager] Loader state after queueing:', {
      totalToLoad: scene.load.totalToLoad,
      listSize: scene.load.list.size,
    })
    this.preloaded = true
  }

  /**
   * Initialize audio system and setup event listeners
   * Must be called after preload() in a scene's create()
   */
  public init(scene: Phaser.Scene): void {
    if (!this.preloaded) {
      throw new Error('AudioManager: preload() must be called before init()')
    }

    if (this.initialized) {
      console.warn('AudioManager: init() already called, skipping')
      return
    }

    this.scene = scene

    // Setup event listeners for all sound events
    this.setupEventListeners(scene)

    // Setup mobile audio unlock if needed
    this.setupMobileAudioUnlock(scene)

    this.initialized = true
  }

  /**
   * Setup event listeners for all sound events
   */
  private setupEventListeners(scene: Phaser.Scene): void {
    Object.keys(SOUND_CONFIG).forEach(soundKey => {
      const handler = () => this.play(soundKey as SoundKey)
      scene.events.on(soundKey, handler)

      // Track for cleanup
      this.eventListeners.push({ event: soundKey, handler })
    })
  }

  /**
   * Setup mobile audio unlock (iOS/Android)
   * Audio must be triggered by user interaction on mobile browsers
   */
  private setupMobileAudioUnlock(scene: Phaser.Scene): void {
    const isMobile = scene.sys.game.device.os.iOS || scene.sys.game.device.os.android

    if (!isMobile) {
      return
    }

    // Wait for first user interaction to unlock audio
    scene.input.once('pointerdown', () => {
      if (this.audioUnlocked) {
        return
      }

      try {
        // Play a silent sound to unlock audio context
        const silentSound = scene.sound.add(Object.keys(SOUND_CONFIG)[0] as SoundKey)
        silentSound.play({ volume: 0 })
        silentSound.stop()
        silentSound.destroy()

        this.audioUnlocked = true
        console.log('AudioManager: Mobile audio unlocked')
      } catch (error) {
        console.error('AudioManager: Failed to unlock mobile audio', error)
      }
    })
  }

  /**
   * Play a sound
   */
  public play(soundKey: string, options?: PlaySoundOptions): void {
    // Check if sound is muted
    if (this.muted.all || this.muted.sfx) {
      return
    }

    // Check if soundKey is valid
    if (!SOUND_CONFIG[soundKey as SoundKey]) {
      console.warn(`[AudioManager] Unknown sound key "${soundKey}"`)
      return
    }

    // Check if scene is available
    if (!this.scene?.sound) {
      console.error('[AudioManager] Scene or sound manager not available')
      return
    }

    // Check if sound is in cache
    if (!this.scene.cache.audio.exists(soundKey)) {
      console.error(`[AudioManager] Audio key "${soundKey}" not found in cache`)
      console.error('[AudioManager] Sound must be preloaded in PreloadScene before playing')
      return
    }

    try {
      // Create sound instance
      const sound = this.scene.sound.add(soundKey)

      if (!sound) {
        console.error(`[AudioManager] Failed to create sound instance for "${soundKey}"`)
        return
      }

      // Calculate final volume (master * sfx * custom)
      const customVolume = options?.volume ?? 1.0
      const finalVolume = this.volumes.master * this.volumes.sfx * customVolume

      // Apply volume and play
      sound.setVolume(finalVolume)
      sound.play()

      // Cleanup after playing (Phaser doesn't auto-cleanup one-shot sounds)
      if (typeof sound.once === 'function') {
        sound.once('complete', () => {
          sound.destroy()
        })
      }
    } catch (error) {
      console.error(`[AudioManager] Failed to play sound "${soundKey}"`, error)
    }
  }

  /**
   * Set volume for a category
   */
  public setVolume(category: VolumeCategory, volume: number): void {
    // Clamp volume to 0-1 range
    const clampedVolume = Math.max(0, Math.min(1, volume))
    this.volumes[category] = clampedVolume

    // Sync with uiStore
    try {
      if (category === 'master') {
        useUIStore.getState().setMasterVolume(clampedVolume)
      } else if (category === 'sfx') {
        useUIStore.getState().setSfxVolume(clampedVolume)
      }
    } catch (error) {
      console.warn('AudioManager: Could not sync volume to uiStore', error)
    }
  }

  /**
   * Get volume for a category
   */
  public getVolume(category: VolumeCategory): number {
    return this.volumes[category]
  }

  /**
   * Mute audio
   */
  public mute(category?: VolumeCategory): void {
    if (category) {
      this.muted[category] = true
    } else {
      this.muted.all = true
    }

    // Sync with uiStore if muting all or master
    if (!category || category === 'master') {
      try {
        const currentState = useUIStore.getState()
        if (currentState.soundEnabled) {
          currentState.toggleSound()
        }
      } catch (error) {
        console.warn('AudioManager: Could not sync mute to uiStore', error)
      }
    }
  }

  /**
   * Unmute audio
   */
  public unmute(category?: VolumeCategory): void {
    if (category) {
      this.muted[category] = false
    } else {
      this.muted.all = false
    }

    // Sync with uiStore if unmuting all or master
    if (!category || category === 'master') {
      try {
        const currentState = useUIStore.getState()
        if (!currentState.soundEnabled) {
          currentState.toggleSound()
        }
      } catch (error) {
        console.warn('AudioManager: Could not sync unmute to uiStore', error)
      }
    }
  }

  /**
   * Check if audio is muted
   */
  public isMuted(category?: VolumeCategory): boolean {
    if (!category) {
      // Return true if any category is muted
      return this.muted.all || this.muted.master || this.muted.sfx
    }
    return this.muted[category]
  }

  /**
   * Cleanup and destroy
   */
  public destroy(): void {
    if (!this.scene) {
      return
    }

    // Remove all event listeners
    this.eventListeners.forEach(({ event, handler }) => {
      this.scene?.events.off(event, handler)
    })

    this.eventListeners = []
    this.initialized = false
    this.scene = null
  }
}
