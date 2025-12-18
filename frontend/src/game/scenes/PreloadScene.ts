import Phaser from 'phaser'
import {
  ALL_SUITS,
  getValidRanksForSuit,
  getCardAssetKey,
  getCardAssetPath,
  CARD_BACK_KEY,
} from '../constants/cards'

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
    this.createCardBackTexture()
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
    this.load.on('progress', this.onLoadProgress, this)
    this.load.on('complete', this.onLoadComplete, this)
    this.load.on('loaderror', this.onLoadError, this)
  }

  /**
   * Load all 34 card assets
   */
  private loadCardAssets(): void {
    let loadedCount = 0
    const totalCards = 34

    // Load all valid cards from the Spar deck
    for (const suit of ALL_SUITS) {
      const validRanks = getValidRanksForSuit(suit)
      for (const rank of validRanks) {
        const key = getCardAssetKey(suit, rank)
        const path = getCardAssetPath(suit, rank)

        this.load.image(key, path)
        loadedCount++
      }
    }

    // Verify we're loading exactly 34 cards
    if (loadedCount !== totalCards) {
      console.warn(`Expected to load ${totalCards} cards, but loading ${loadedCount}`)
    }
  }

  /**
   * Create card back texture using Phaser graphics
   * Simple placeholder with Kente-inspired pattern
   */
  private createCardBackTexture(): void {
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
   * Load complete callback - transition to game scene
   */
  private onLoadComplete(): void {
    console.log('All assets loaded successfully (34 cards + card back)')

    // Clean up loading UI
    this.loadingText?.destroy()
    this.progressBar?.destroy()
    this.progressBox?.destroy()

    // Transition to game scene after a short delay
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene')
    })
  }

  /**
   * Error callback - log failed asset loads
   */
  private onLoadError(file: Phaser.Loader.File): void {
    console.error(`Failed to load asset: ${file.key} from ${file.url}`)
  }
}
