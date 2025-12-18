import Phaser from 'phaser'
import type { Suit, Rank } from '../../store/types'
import { getCardAssetKey } from '../constants/cards'

/**
 * CardSprite - Interactive card game object
 * Extends Phaser.GameObjects.Sprite with card-specific properties and behaviors
 */
export class CardSprite extends Phaser.GameObjects.Sprite {
  // Card properties
  public readonly suit: Suit
  public readonly rank: Rank
  public readonly cardId: string
  public owner: string | null = null

  // State properties
  private _playable: boolean = false
  private _selected: boolean = false
  private _faceDown: boolean = false

  // Visual effect properties
  private hoverTween?: Phaser.Tweens.Tween
  private glowEffect?: Phaser.GameObjects.Graphics
  private originalY: number

  // Event callbacks
  public onCardClick?: (card: CardSprite) => void
  public onCardHover?: (card: CardSprite) => void

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    suit: Suit,
    rank: Rank,
    owner: string | null = null
  ) {
    const textureKey = getCardAssetKey(suit, rank)
    super(scene, x, y, textureKey)

    this.suit = suit
    this.rank = rank
    this.owner = owner
    this.cardId = `${suit}_${rank}_${Date.now()}`
    this.originalY = y

    // Setup sprite
    this.setOrigin(0.5, 0.5)
    this.setInteractive({ useHandCursor: true })

    // Add to scene
    scene.add.existing(this)

    // Setup interactions
    this.setupInteractions()
  }

  /**
   * Setup interactive behaviors (hover, click, touch)
   */
  private setupInteractions(): void {
    // Hover enter
    this.on('pointerover', () => {
      if (!this._playable) return
      this.onHoverEnter()
      this.onCardHover?.(this)
    })

    // Hover exit
    this.on('pointerout', () => {
      if (!this._playable) return
      this.onHoverExit()
    })

    // Click/tap
    this.on('pointerdown', () => {
      if (!this._playable) return
      this.onCardClick?.(this)
    })
  }

  /**
   * Set whether the card is playable
   */
  public setPlayable(playable: boolean): this {
    this._playable = playable

    if (playable) {
      this.setAlpha(1)
      this.setTint(0xffffff) // Remove any tint
      this.setInteractive()
    } else {
      this.setAlpha(0.5)
      this.setTint(0x888888) // Gray tint
      this.disableInteractive()
    }

    return this
  }

  /**
   * Get playable state
   */
  public get playable(): boolean {
    return this._playable
  }

  /**
   * Set selected state
   */
  public setSelected(selected: boolean): this {
    this._selected = selected

    if (selected) {
      this.showSelectionGlow()
    } else {
      this.hideSelectionGlow()
    }

    return this
  }

  /**
   * Get selected state
   */
  public get selected(): boolean {
    return this._selected
  }

  /**
   * Flip card face down/up
   */
  public setFaceDown(faceDown: boolean): this {
    this._faceDown = faceDown

    // TODO: Flip animation (Phase 6)
    // For now, just change texture
    if (faceDown) {
      this.setTexture('card_back')
    } else {
      this.setTexture(getCardAssetKey(this.suit, this.rank))
    }

    return this
  }

  /**
   * Get face down state
   */
  public get faceDown(): boolean {
    return this._faceDown
  }

  /**
   * Hover enter effect - lift and scale card
   */
  private onHoverEnter(): void {
    // Stop any existing hover tween
    if (this.hoverTween) {
      this.hoverTween.stop()
    }

    // Lift and scale up
    this.hoverTween = this.scene.tweens.add({
      targets: this,
      y: this.originalY - 30, // Lift 30px
      scaleX: this.scaleX * 1.1,
      scaleY: this.scaleY * 1.1,
      duration: 200,
      ease: 'Cubic.easeOut',
    })

    // Add glow effect
    this.showHoverGlow()
  }

  /**
   * Hover exit effect - return to original position
   */
  private onHoverExit(): void {
    // Stop any existing hover tween
    if (this.hoverTween) {
      this.hoverTween.stop()
    }

    // Return to original position and scale
    this.hoverTween = this.scene.tweens.add({
      targets: this,
      y: this.originalY,
      scaleX: this.scaleX / 1.1,
      scaleY: this.scaleY / 1.1,
      duration: 200,
      ease: 'Cubic.easeOut',
    })

    // Remove glow
    this.hideHoverGlow()
  }

  /**
   * Show hover glow effect
   */
  private showHoverGlow(): void {
    if (this.glowEffect) {
      this.glowEffect.destroy()
    }

    this.glowEffect = this.scene.add.graphics()
    this.glowEffect.lineStyle(4, 0xffd700, 0.8) // Gold glow
    this.glowEffect.strokeRoundedRect(
      this.x - this.displayWidth / 2 - 4,
      this.y - this.displayHeight / 2 - 4,
      this.displayWidth + 8,
      this.displayHeight + 8,
      12
    )
    this.glowEffect.setDepth(this.depth - 1) // Behind card
  }

  /**
   * Hide hover glow effect
   */
  private hideHoverGlow(): void {
    if (this.glowEffect) {
      this.glowEffect.destroy()
      this.glowEffect = undefined
    }
  }

  /**
   * Show selection glow effect
   */
  private showSelectionGlow(): void {
    if (this.glowEffect) {
      this.glowEffect.destroy()
    }

    this.glowEffect = this.scene.add.graphics()
    this.glowEffect.lineStyle(4, 0x00bfff, 1) // Ice blue glow for selection
    this.glowEffect.strokeRoundedRect(
      this.x - this.displayWidth / 2 - 4,
      this.y - this.displayHeight / 2 - 4,
      this.displayWidth + 8,
      this.displayHeight + 8,
      12
    )
    this.glowEffect.setDepth(this.depth - 1)

    // Pulse animation
    this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  }

  /**
   * Hide selection glow effect
   */
  private hideSelectionGlow(): void {
    if (this.glowEffect) {
      this.glowEffect.destroy()
      this.glowEffect = undefined
    }
  }

  /**
   * Update original Y position (for animations)
   */
  public updateOriginalY(y: number): void {
    this.originalY = y
  }

  /**
   * Cleanup when card is destroyed
   */
  public destroy(fromScene?: boolean): void {
    if (this.hoverTween) {
      this.hoverTween.stop()
    }
    if (this.glowEffect) {
      this.glowEffect.destroy()
    }
    super.destroy(fromScene)
  }

  /**
   * Get card data as plain object
   */
  public toCardData(): { suit: Suit; rank: Rank; id: string } {
    return {
      suit: this.suit,
      rank: this.rank,
      id: this.cardId,
    }
  }
}
