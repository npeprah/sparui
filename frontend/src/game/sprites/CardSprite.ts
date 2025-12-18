import Phaser from 'phaser'
import type { Suit, Rank } from '../../store/types'
import { getCardAssetKey } from '../constants/cards'
import {
  createFlipAnimation,
  createWinPulseAnimation,
  createLoseFadeAnimation,
  createCollectAnimation,
  calculateCollectStagger,
} from '../utils/animations'
import { emitSoundEvent, triggerHaptic, GLOW_CONFIG } from '../constants/animations'

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
   * @param playable - Whether the card can be played
   * @param maintainVisibility - If true, keeps alpha at 1.0 even when not playable (for played cards)
   */
  public setPlayable(playable: boolean, maintainVisibility: boolean = false): this {
    this._playable = playable

    if (playable) {
      this.setAlpha(1)
      this.setTint(0xffffff) // Remove any tint
      this.setInteractive()
    } else {
      // If maintainVisibility is true, keep card fully visible
      // This is used for played cards in the center area
      this.setAlpha(maintainVisibility ? 1.0 : 0.5)
      this.setTint(maintainVisibility ? 0xffffff : 0x888888)
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
   * Flip card face down/up with animated 3D-like rotation
   * @param faceDown - Whether to flip the card face down
   * @param animated - Whether to animate the flip (default: true)
   */
  public setFaceDown(faceDown: boolean, animated: boolean = true): this {
    this._faceDown = faceDown

    // If no animation, just swap texture immediately
    if (!animated) {
      if (faceDown) {
        this.setTexture('card_back')
      } else {
        this.setTexture(getCardAssetKey(this.suit, this.rank))
      }
      return this
    }

    // Create flip animation (two-part: scale down, then scale up)
    const [scaleDownConfig, scaleUpConfig] = createFlipAnimation(this, () => {
      // Midpoint callback: swap texture when card is "sideways"
      if (faceDown) {
        this.setTexture('card_back')
      } else {
        this.setTexture(getCardAssetKey(this.suit, this.rank))
      }

      // Emit sound event for flip
      emitSoundEvent(this.scene, 'CARD_FLIP')
    })

    // Chain the animations: scale down, then scale up
    this.scene.tweens.add({
      ...scaleDownConfig,
      onComplete: () => {
        // After scale down completes, scale back up
        this.scene.tweens.add(scaleUpConfig)
      },
    })

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
   * Animate card as winning card
   * Pulse animation with intensified gold glow
   */
  public animateWin(): this {
    // Remove any existing glow
    if (this.glowEffect) {
      this.glowEffect.destroy()
      this.glowEffect = undefined
    }

    // Create intense win glow
    this.glowEffect = this.scene.add.graphics()
    this.glowEffect.lineStyle(
      GLOW_CONFIG.WIN.thickness,
      GLOW_CONFIG.WIN.color,
      GLOW_CONFIG.WIN.alpha
    )
    this.glowEffect.strokeRoundedRect(
      this.x - this.displayWidth / 2 - GLOW_CONFIG.WIN.padding,
      this.y - this.displayHeight / 2 - GLOW_CONFIG.WIN.padding,
      this.displayWidth + GLOW_CONFIG.WIN.padding * 2,
      this.displayHeight + GLOW_CONFIG.WIN.padding * 2,
      12
    )
    this.glowEffect.setDepth(this.depth - 1)

    // Pulse glow
    this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: { from: 1, to: 0.6 },
      duration: 400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })

    // Pulse card scale
    const pulseConfig = createWinPulseAnimation(this)
    this.scene.tweens.add(pulseConfig)

    // Emit sound and haptic
    emitSoundEvent(this.scene, 'WIN_ROUND')
    triggerHaptic('WIN')

    return this
  }

  /**
   * Animate card as losing card
   * Fade and shrink animation
   */
  public animateLose(): this {
    // Remove any glow effects
    if (this.glowEffect) {
      this.glowEffect.destroy()
      this.glowEffect = undefined
    }

    // Create lose fade/shrink animation
    const loseConfig = createLoseFadeAnimation(this)
    this.scene.tweens.add(loseConfig)

    // Emit sound and haptic
    emitSoundEvent(this.scene, 'LOSE_ROUND')
    triggerHaptic('LOSE')

    return this
  }

  /**
   * Animate card collection to winner's position
   * @param targetX - Destination X coordinate
   * @param targetY - Destination Y coordinate
   * @param cardIndex - Index for stagger delay
   */
  public animateCollect(targetX: number, targetY: number, cardIndex: number = 0): this {
    // Calculate stagger delay
    const delay = calculateCollectStagger(cardIndex)

    // Create collection animation
    const collectConfig = createCollectAnimation(this, targetX, targetY, delay)
    this.scene.tweens.add({
      ...collectConfig,
      onComplete: () => {
        // Destroy card after collection
        this.destroy()
      },
    })

    return this
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
