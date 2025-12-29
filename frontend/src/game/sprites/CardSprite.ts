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
  public onCardDragPlay?: (card: CardSprite) => void

  // Drag state
  private isDragging: boolean = false
  private dragStartY: number = 0
  private dragStartX: number = 0
  private dragThreshold: number = 100 // pixels (upward drag to play)
  private clickThreshold: number = 10 // pixels (below this = click, not drag)
  private originalDepth: number = 1

  // Scene-level event handlers (for tracking pointer when card moves during drag)
  private sceneMoveHandler?: (pointer: Phaser.Input.Pointer) => void
  private sceneUpHandler?: (pointer: Phaser.Input.Pointer) => void

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    suit: Suit,
    rank: Rank,
    owner: string | null = null
  ) {
    const textureKey = getCardAssetKey(suit, rank)
    console.log(`[CardSprite] Creating card: ${suit} ${rank} with texture key: ${textureKey}`)

    // Check if texture exists
    const textureExists = scene.textures.exists(textureKey)
    console.log(`[CardSprite] Texture exists: ${textureExists}`)

    super(scene, x, y, textureKey)

    this.suit = suit
    this.rank = rank
    this.owner = owner
    this.cardId = `${suit}_${rank}_${Date.now()}`
    this.originalY = y

    console.log(`[CardSprite] Card created at (${x}, ${y}) with depth ${this.depth}`)

    // Setup sprite
    this.setOrigin(0.5, 0.5)
    this.setInteractive({ useHandCursor: true })

    // Add to scene
    scene.add.existing(this)

    console.log(`[CardSprite] Card added to scene, visible: ${this.visible}, active: ${this.active}`)

    // Setup interactions
    this.setupInteractions()
  }

  /**
   * Setup interactive behaviors (hover, click, touch, drag)
   */
  private setupInteractions(): void {
    // Hover enter - always allow hover effects
    this.on('pointerover', () => {
      if (this.isDragging) return
      this.onHoverEnter()
      this.onCardHover?.(this)
    })

    // Hover exit - always allow hover effects
    this.on('pointerout', () => {
      if (this.isDragging) return
      this.onHoverExit()
    })

    // Pointer down - always allow interaction, backend will reject invalid plays
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.onPointerDown(pointer)
    })

    // For drag tracking, we need to use scene-level events because when the card
    // moves during drag, it's no longer under the pointer and stops receiving events.
    // These will be registered/unregistered in onPointerDown/onPointerUp.
  }

  /**
   * Set whether the card is playable
   * @param playable - Whether the card can be played
   * @param _maintainVisibility - Deprecated: Cards are always fully visible now
   */
  public setPlayable(playable: boolean, _maintainVisibility: boolean = false): this {
    // Guard: check if card still exists before doing anything
    if (!this.scene || !this.active) return this

    this._playable = playable

    // Always keep cards fully visible - no greying/ghosting
    this.setAlpha(1)
    this.setTint(0xffffff)

    // Always keep cards interactive - backend will reject invalid plays
    // This allows players to attempt plays and receive feedback from server
    if (this.input) {
      this.setInteractive()
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
    // Guard: check if card still exists before doing anything
    if (!this.scene || !this.active) return this

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
        // Guard: check if card still exists before adding second tween
        if (!this.scene || !this.active) return
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
   * Pointer down - start tracking for potential click or drag
   */
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    // Store starting position
    this.dragStartY = pointer.y
    this.dragStartX = pointer.x
    this.originalDepth = this.depth

    // Don't set isDragging yet - wait for movement
    // This allows us to distinguish between click and drag

    // Register scene-level handlers to track pointer even when card moves
    this.sceneMoveHandler = (p: Phaser.Input.Pointer) => {
      this.onPointerMove(p)
    }

    this.sceneUpHandler = (p: Phaser.Input.Pointer) => {
      this.onPointerUp(p)
      // Unregister scene handlers after pointer up
      this.unregisterSceneHandlers()
    }

    this.scene.input.on('pointermove', this.sceneMoveHandler)
    this.scene.input.on('pointerup', this.sceneUpHandler)
  }

  /**
   * Unregister scene-level pointer handlers
   */
  private unregisterSceneHandlers(): void {
    if (this.sceneMoveHandler) {
      this.scene.input.off('pointermove', this.sceneMoveHandler)
      this.sceneMoveHandler = undefined
    }
    if (this.sceneUpHandler) {
      this.scene.input.off('pointerup', this.sceneUpHandler)
      this.sceneUpHandler = undefined
    }
  }

  /**
   * Pointer move - determine if this is a drag gesture
   */
  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    const deltaX = pointer.x - this.dragStartX
    const deltaY = pointer.y - this.dragStartY
    const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // If moved beyond click threshold, treat as drag
    if (!this.isDragging && totalDistance > this.clickThreshold) {
      // Start drag
      this.isDragging = true

      // Raise card above everything (played cards are at depth 1000+)
      // Use depth 2000 to ensure dragged card is always on top
      this.setDepth(2000)

      // Light haptic feedback
      triggerHaptic('LIGHT')

      // Scale up slightly
      this.scene.tweens.add({
        targets: this,
        scaleX: this.scaleX * 1.1,
        scaleY: this.scaleY * 1.1,
        duration: 100,
        ease: 'Cubic.easeOut',
      })
    }

    // If dragging, update position
    if (this.isDragging) {
      const dragDistance = Math.abs(deltaY)

      // Only allow upward drag
      if (deltaY < 0) {
        // Constrain drag to reasonable bounds
        const maxDrag = -150
        const clampedDelta = Math.max(deltaY, maxDrag)

        // Update position
        this.y = this.originalY + clampedDelta

        // Visual feedback when threshold reached
        if (dragDistance >= this.dragThreshold) {
          // Add glow to indicate ready to play
          if (!this.glowEffect) {
            this.showDragGlow()
          }
          // Medium haptic feedback (once)
          if (dragDistance === this.dragThreshold) {
            triggerHaptic('MEDIUM')
          }
        } else {
          // Remove glow if below threshold
          if (this.glowEffect) {
            this.hideDragGlow()
          }
        }
      }
    }
  }

  /**
   * Pointer up - determine if this was a click or drag gesture
   */
  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    const deltaX = pointer.x - this.dragStartX
    const deltaY = pointer.y - this.dragStartY
    const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // If never entered drag mode and distance is small, treat as click
    if (!this.isDragging && totalDistance <= this.clickThreshold) {
      // This is a click!
      triggerHaptic('LIGHT')
      this.onCardClick?.(this)
      return
    }

    // Otherwise, this was a drag gesture
    if (this.isDragging) {
      const dragDistanceY = Math.abs(this.y - this.originalY)

      if (dragDistanceY >= this.dragThreshold) {
        // Play the card via drag
        this.hideDragGlow()
        triggerHaptic('CARD_PLAY')
        this.onCardDragPlay?.(this)
      } else {
        // Return to original position
        this.returnToOriginalPosition()
      }

      this.isDragging = false
    }
  }

  /**
   * Cancel drag and return card to original position
   */
  private cancelDrag(): void {
    if (!this.isDragging) return

    this.isDragging = false
    this.hideDragGlow()
    this.returnToOriginalPosition()
  }

  /**
   * Animate card return to original position
   */
  private returnToOriginalPosition(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.originalY,
      scaleX: this.scaleX / 1.1,
      scaleY: this.scaleY / 1.1,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.setDepth(this.originalDepth)
      },
    })
  }

  /**
   * Show drag glow (threshold reached)
   */
  private showDragGlow(): void {
    if (this.glowEffect) {
      this.glowEffect.destroy()
    }

    this.glowEffect = this.scene.add.graphics()
    this.glowEffect.lineStyle(4, 0x00ff00, 1) // Green glow = ready to play
    this.glowEffect.strokeRoundedRect(
      this.x - this.displayWidth / 2 - 4,
      this.y - this.displayHeight / 2 - 4,
      this.displayWidth + 8,
      this.displayHeight + 8,
      12
    )
    this.glowEffect.setDepth(this.depth - 1)
  }

  /**
   * Hide drag glow
   */
  private hideDragGlow(): void {
    if (this.glowEffect) {
      this.glowEffect.destroy()
      this.glowEffect = undefined
    }
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
    // Clean up scene-level event handlers
    this.unregisterSceneHandlers()

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
