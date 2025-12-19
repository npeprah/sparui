import Phaser from 'phaser'
import {
  ALL_SUITS,
  getValidRanksForSuit,
  getCardAssetKey,
  getCardAssetPath,
  CARD_BACK_KEY,
} from '../constants/cards'
import { createParticleTextures } from '../utils/particles'
import { AudioManager } from '../../services/audioManager'

export class PreloadScene extends Phaser.Scene {
  private loadingText?: Phaser.GameObjects.Text
  private progressBar?: Phaser.GameObjects.Graphics
  private progressBox?: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    this.createLoadingUI()
    this.setupLoadingEvents()
    this.loadCardAssets()
    this.loadSoundAssets()
  }

  create() {
    console.log('[PreloadScene] create() called - creating programmatic textures')

    // Create programmatic textures after loading completes
    this.createCardBackTexture()
    this.createParticleTextures()

    console.log('[PreloadScene] Programmatic textures created')

    // Verify audio files in cache
    this.verifyAudioCache()

    // Verify card textures in cache
    this.verifyCardCache()

    // Clean up loading UI
    this.loadingText?.destroy()
    this.progressBar?.destroy()
    this.progressBox?.destroy()

    // Transition to game scene after a short delay
    this.time.delayedCall(500, () => {
      console.log('[PreloadScene] Starting GameScene...')
      this.scene.start('GameScene')
    })
  }

  /**
   * Create loading progress UI
   */
  private createLoadingUI(): void {
    const { width, height } = this.cameras.main

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Spar...', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '32px',
      color: '#FFD700',
    })
    this.loadingText.setOrigin(0.5)

    // Progress box (background)
    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0x222222, 0.8)
    this.progressBox.fillRect(width / 2 - 160, height / 2, 320, 30)

    // Progress bar
    this.progressBar = this.add.graphics()
  }

  /**
   * Setup loading progress event handlers
   */
  private setupLoadingEvents(): void {
    console.log('[PreloadScene] Setting up loader event handlers')
    this.load.on('progress', this.onLoadProgress, this)
    this.load.on('complete', this.onLoadComplete, this)
    this.load.on('loaderror', this.onLoadError, this)
    this.load.on('filecomplete', this.onFileComplete, this)
    this.load.on('start', this.onLoadStart, this)
  }

  /**
   * Callback when loader starts
   */
  private onLoadStart(): void {
    console.log('[PreloadScene] Loader started')
  }

  /**
   * Callback when individual file completes
   */
  private onFileComplete(key: string, type: string): void {
    if (type === 'audio') {
      console.log(`[PreloadScene] Audio file loaded: ${key}`)
    } else if (type === 'image') {
      console.log(`[PreloadScene] Image file loaded: ${key}`)
    }
  }

  /**
   * Load all 34 card assets
   */
  private loadCardAssets(): void {
    console.log('[PreloadScene] ===== LOADING CARD ASSETS =====')
    let loadedCount = 0
    const totalCards = 34

    // Load all valid cards from the Spar deck
    for (const suit of ALL_SUITS) {
      const validRanks = getValidRanksForSuit(suit)
      for (const rank of validRanks) {
        const key = getCardAssetKey(suit, rank)
        const path = getCardAssetPath(suit, rank)

        console.log(`[PreloadScene] Loading card: ${key} from ${path}`)
        this.load.image(key, path)
        loadedCount++
      }
    }

    console.log(`[PreloadScene] Queued ${loadedCount} cards for loading`)

    // Verify we're loading exactly 34 cards
    if (loadedCount !== totalCards) {
      console.warn(`[PreloadScene] Expected to load ${totalCards} cards, but loading ${loadedCount}`)
    }
  }

  /**
   * Load all sound assets using AudioManager
   */
  private loadSoundAssets(): void {
    console.log('[PreloadScene] ===== LOADING SOUND ASSETS =====')
    console.log('[PreloadScene] Scene:', this.scene.key)
    console.log('[PreloadScene] Loader exists:', !!this.load)
    console.log('[PreloadScene] Loader.isLoading():', this.load.isLoading())
    console.log('[PreloadScene] Loader.isReady():', this.load.isReady())

    try {
      const audioManager = AudioManager.getInstance()
      console.log('[PreloadScene] AudioManager instance obtained, calling preload()...')

      // Force reload in development to handle React StrictMode double-mounting
      const isDevelopment = import.meta.env.DEV
      console.log('[PreloadScene] Development mode:', isDevelopment)

      audioManager.preload(this, isDevelopment)
      console.log('[PreloadScene] AudioManager.preload() returned successfully')
    } catch (error) {
      console.error('[PreloadScene] ERROR calling AudioManager.preload():', error)
    }

    console.log('[PreloadScene] After AudioManager.preload():')
    console.log('[PreloadScene] - Loader files in queue:', this.load.list.size)
    console.log('[PreloadScene] - Loader total files:', this.load.totalToLoad)
    console.log('[PreloadScene] - Loader total complete:', this.load.totalComplete)
  }

  /**
   * Create card back texture using Phaser graphics
   * Simple placeholder with Kente-inspired pattern
   */
  private createCardBackTexture(): void {
    console.log('[PreloadScene] Creating card_back texture...')
    const width = 512
    const height = 768

    const graphics = this.add.graphics()

    // Background - Deep Purple
    graphics.fillStyle(0x4b0082, 1)
    graphics.fillRoundedRect(0, 0, width, height, 24)

    // Gold border
    graphics.lineStyle(8, 0xffd700, 1)
    graphics.strokeRoundedRect(4, 4, width - 8, height - 8, 20)

    // Kente pattern - vertical stripes
    graphics.lineStyle(4, 0xffd700, 0.3)
    for (let x = 60; x < width - 60; x += 40) {
      graphics.lineBetween(x, 60, x, height - 60)
    }

    // Kente pattern - horizontal stripes
    graphics.lineStyle(4, 0x00bfff, 0.3)
    for (let y = 100; y < height - 100; y += 40) {
      graphics.lineBetween(60, y, width - 60, y)
    }

    // Kente pattern - diagonal stripes
    graphics.lineStyle(3, 0xff4500, 0.2)
    for (let offset = -height; offset < width; offset += 60) {
      graphics.lineBetween(offset, 0, offset + height, height)
    }

    // Center logo placeholder - "SPAR" text
    const centerX = width / 2
    const centerY = height / 2

    graphics.fillStyle(0xffd700, 1)
    graphics.fillCircle(centerX, centerY, 80)

    // Generate texture
    graphics.generateTexture(CARD_BACK_KEY, width, height)
    graphics.destroy()

    // Verify texture was created
    const textureExists = this.textures.exists(CARD_BACK_KEY)
    console.log(`[PreloadScene] card_back texture created: ${textureExists}`)
  }

  /**
   * Progress callback - update progress bar
   */
  private onLoadProgress(value: number): void {
    if (!this.progressBar || !this.loadingText) return

    const { width, height } = this.cameras.main

    // Update progress bar
    this.progressBar.clear()
    this.progressBar.fillStyle(0xffd700, 1)
    this.progressBar.fillRect(width / 2 - 150, height / 2 + 5, 300 * value, 20)

    // Update loading text with percentage
    const percentage = Math.floor(value * 100)
    this.loadingText.setText(`Loading Spar... ${percentage}%`)
  }

  /**
   * Load complete callback - just log completion
   * NOTE: Scene transition happens in create() method
   */
  private onLoadComplete(): void {
    console.log('[PreloadScene] ===== ALL ASSETS LOADED =====')
    console.log('[PreloadScene] Total files loaded:', this.load.totalComplete)
    console.log('[PreloadScene] Expected: 34 cards + 16 sounds = 50 total (card_back created in create())')
  }

  /**
   * Verify that audio files are in Phaser's cache
   */
  private verifyAudioCache(): void {
    console.log('[PreloadScene] ===== VERIFYING AUDIO CACHE =====')

    const expectedSounds = [
      'sound:card_deal',
      'sound:card_flip',
      'sound:card_play',
      'sound:card_hover',
      'sound:card_shuffle',
      'sound:card_collect',
      'sound:win_round',
      'sound:lose_round',
      'sound:game_victory',
      'sound:game_defeat',
      'sound:dry_declaration',
      'sound:show_dry_declaration',
      'sound:fire_streak',
      'sound:freeze_effect',
      'sound:invalid_move',
      'sound:phase_transition',
    ]

    let foundCount = 0
    let missingCount = 0

    expectedSounds.forEach((key) => {
      const exists = this.cache.audio.exists(key)
      if (exists) {
        foundCount++
        console.log(`[PreloadScene] ✓ ${key} - IN CACHE`)
      } else {
        missingCount++
        console.error(`[PreloadScene] ✗ ${key} - NOT IN CACHE`)
      }
    })

    console.log(`[PreloadScene] Audio cache verification: ${foundCount}/${expectedSounds.length} found`)
    if (missingCount > 0) {
      console.error(`[PreloadScene] ERROR: ${missingCount} audio files missing from cache!`)
    }
  }

  /**
   * Verify that card textures are in Phaser's cache
   */
  private verifyCardCache(): void {
    console.log('[PreloadScene] ===== VERIFYING CARD TEXTURE CACHE =====')

    let foundCount = 0
    let missingCount = 0
    const missingCards: string[] = []

    // Check all 34 cards
    for (const suit of ALL_SUITS) {
      const validRanks = getValidRanksForSuit(suit)
      for (const rank of validRanks) {
        const key = getCardAssetKey(suit, rank)
        const exists = this.textures.exists(key)

        if (exists) {
          foundCount++
          console.log(`[PreloadScene] ✓ ${key} - IN TEXTURE CACHE`)
        } else {
          missingCount++
          missingCards.push(key)
          console.error(`[PreloadScene] ✗ ${key} - NOT IN TEXTURE CACHE`)
        }
      }
    }

    // Check card back
    const cardBackExists = this.textures.exists(CARD_BACK_KEY)
    if (cardBackExists) {
      foundCount++
      console.log(`[PreloadScene] ✓ ${CARD_BACK_KEY} - IN TEXTURE CACHE`)
    } else {
      missingCount++
      missingCards.push(CARD_BACK_KEY)
      console.error(`[PreloadScene] ✗ ${CARD_BACK_KEY} - NOT IN TEXTURE CACHE`)
    }

    console.log(`[PreloadScene] Card cache verification: ${foundCount}/35 found`)
    if (missingCount > 0) {
      console.error(`[PreloadScene] ERROR: ${missingCount} card textures missing from cache!`)
      console.error('[PreloadScene] Missing cards:', missingCards)
    }
  }

  /**
   * Create particle textures programmatically
   */
  private createParticleTextures(): void {
    createParticleTextures(this)
  }

  /**
   * Error callback - log failed asset loads
   */
  private onLoadError(file: Phaser.Loader.File): void {
    console.error('[PreloadScene] ===== LOAD ERROR =====')
    console.error('[PreloadScene] Failed to load asset:', {
      key: file.key,
      type: file.type,
      url: file.url,
      src: file.src,
      state: file.state,
    })
    console.error('[PreloadScene] File object:', file)
  }
}
