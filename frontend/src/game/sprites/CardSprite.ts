import Phaser from 'phaser'
import type { Suit, Rank } from '../../store/types'
import type { CardState } from '../constants/cardStates'
import { getCardAssetKey } from '../constants/cards'
import {
  createFlipAnimation,
  createWinPulseAnimation,
  createLoseFadeAnimation,
  createCollectAnimation,
  calculateCollectStagger,
} from '../utils/animations'
import { emitSoundEvent, triggerHaptic, GLOW_CONFIG } from '../constants/animations'
import {
  createCardDealAnimation,
  createCardPlayAnimation,
  createSuitSymbolPulseAnimation,
  createHoverFloatAnimation,
  createHoverExitAnimation,
  createFireStateAnimation,
  createFrozenStateAnimation,
  applyDisabledState,
  removeDisabledState,
  createGlowEffect,
} from '../utils/cardAnimations'
import { applyCardVisualState, transitionToState } from '../utils/cardVisuals'
import {
  type EKBorderStyle,
  type EKBorderTreatment,
  getEKBorderStyle,
  resolveEKTreatment,
} from '../constants/cardTheme'
import {
  type OverlayKind,
  type OverlaySlotState,
  createOverlaySlotState,
  isOverlayActive,
  setOverlaySlot,
} from '../constants/cardOverlays'
import { useThemeStore } from '../../store/themeStore'

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
  private _hovered: boolean = false
  private _visualState: CardState = 'default'

  // Visual effect properties
  private hoverTween?: Phaser.Tweens.Tween
  private glowEffect?: Phaser.GameObjects.Graphics
  private originalY: number
  private originalScale: number = 1
  private suitPulseTween?: Phaser.Tweens.Tween
  private stateTween?: Phaser.Tweens.Tween

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

  // ---------------------------------------------------------------------------
  // EK look: chunky ink-outline border + per-theme comic framing (ticket 12)
  // ---------------------------------------------------------------------------
  /** Graphics that renders the drop shadow + thin keyline BEHIND the card face. */
  private ekBorder?: Phaser.GameObjects.Graphics
  /** Graphics that renders the gold playable-affordance ring ABOVE the card face. */
  private ekRing?: Phaser.GameObjects.Graphics
  /**
   * Active EK border treatment (gold / comic / neon). Normally resolved from
   * themeStore; the pixel-exact Variant B table (ticket 19) pins it to `comic`
   * via the constructor's `forcedTreatment` so the look never depends on the
   * user's palette selection.
   */
  private ekTreatment: EKBorderTreatment
  /** Set when the border geometry must be redrawn on the next frame. */
  private ekBorderDirty: boolean = true
  /** Last drawn display size, so the border only redraws when it actually changes. */
  private ekLastDrawnWidth: number = -1
  private ekLastDrawnHeight: number = -1
  /** Unsubscribe handle for the themeStore subscription. */
  private themeUnsub?: () => void

  // ---------------------------------------------------------------------------
  // State-overlay hooks/slots for fire / freeze / dry (ticket 12; effects: 16)
  // ---------------------------------------------------------------------------
  /** Active/inactive flags for the fire / freeze / dry overlay slots. */
  private overlaySlots: OverlaySlotState = createOverlaySlotState()
  /** Display objects ticket 16 attaches to each overlay slot; kept in sync with the card. */
  private overlayObjects: Partial<Record<OverlayKind, Phaser.GameObjects.GameObject>> = {}

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    suit: Suit,
    rank: Rank,
    owner: string | null = null,
    forcedTreatment?: EKBorderTreatment
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

    // Setup sprite
    this.setOrigin(0.5, 0.5)
    this.setInteractive({ useHandCursor: true })

    // Set initial depth to ensure card is visible (will be adjusted by TableScene)
    this.setDepth(200)

    // Add to scene
    scene.add.existing(this)

    console.log(`[CardSprite] Card created at (${x}, ${y}) with depth ${this.depth}`)

    console.log(
      `[CardSprite] Card added to scene, visible: ${this.visible}, active: ${this.active}`
    )

    // Resolve the EK border treatment from the active theme and render the
    // chunky ink-outline border / comic frame behind the card.
    this.ekTreatment = forcedTreatment ?? resolveEKTreatment(useThemeStore.getState().selectedTheme)
    this.renderEKBorder()
    // A pinned treatment never reacts to theme changes.
    if (!forcedTreatment) this.subscribeToTheme()

    // Setup interactions
    this.setupInteractions()

    // Apply default visual state
    applyCardVisualState(this, 'default')
  }

  /**
   * Set the visual state of the card
   * @param state - The visual state to apply
   */
  public setState(state: CardState): this {
    // Don't transition if already in the target state
    if (this._visualState === state) {
      return this
    }

    // Special handling for playable state
    if (!this._playable && (state === 'hover' || state === 'active')) {
      // Can't hover or activate if not playable
      state = 'disabled'
    }

    const previousState = this._visualState
    this._visualState = state
    transitionToState(this, previousState, state)

    return this
  }

  /**
   * Get the current visual state
   */
  public getVisualState(): CardState {
    return this._visualState
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

    const wasPlayable = this._playable
    this._playable = playable

    // Update visual state based on playable status
    if (!wasPlayable && playable) {
      // Becoming playable - restore default state
      this.setState('default')
    } else if (wasPlayable && !playable) {
      // Becoming unplayable - apply disabled state
      this.setState('disabled')
    }

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
   * Hover enter effect - using exact specifications from design doc
   * Duration: 600ms, translateY: -30px, scale: 1.05
   */
  private onHoverEnter(): void {
    // Don't hover if in disabled state
    if (this._visualState === 'disabled') return

    // Reveal the gold playable-affordance ring while hovered (prototype
    // `.card.playable:hover::after`). syncEKVisuals reads this flag each frame.
    this._hovered = true

    // Stop any existing hover tween
    if (this.hoverTween) {
      this.hoverTween.stop()
    }

    // Use exact hover animation from design spec
    const hoverConfig = createHoverFloatAnimation(this, this.originalY, this.originalScale)
    this.hoverTween = this.scene.tweens.add(hoverConfig)

    // Add glow effect
    this.showHoverGlow()
  }

  /**
   * Hover exit effect - return to original position
   */
  private onHoverExit(): void {
    // Hide the gold playable ring again once the pointer leaves.
    this._hovered = false

    // Stop any existing hover tween
    if (this.hoverTween) {
      this.hoverTween.stop()
    }

    // Use exact exit animation from design spec
    const exitConfig = createHoverExitAnimation(this, this.originalY, this.originalScale)
    this.hoverTween = this.scene.tweens.add(exitConfig)

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

    // Stop all tweens
    if (this.hoverTween) {
      this.hoverTween.stop()
    }
    if (this.suitPulseTween) {
      this.suitPulseTween.stop()
    }
    if (this.stateTween) {
      this.stateTween.stop()
    }

    // Clean up glow effect
    if (this.glowEffect) {
      this.glowEffect.destroy()
    }

    // Clear state effects
    this.clearStateEffects()

    // Tear down EK border, theme subscription and any attached state overlays.
    if (this.themeUnsub) {
      this.themeUnsub()
      this.themeUnsub = undefined
    }
    if (this.ekBorder) {
      this.ekBorder.destroy()
      this.ekBorder = undefined
    }
    if (this.ekRing) {
      this.ekRing.destroy()
      this.ekRing = undefined
    }
    for (const kind of Object.keys(this.overlayObjects) as OverlayKind[]) {
      this.detachOverlay(kind)
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

  // ===========================================================================
  // EK border / comic framing (ticket 12)
  // ===========================================================================

  /**
   * Create (once) and draw the EK chunky ink-outline border + comic framing for
   * the current treatment. Drawn as a Graphics object BEHIND the card so an
   * ink "sticker" margin peeks out around every edge. Safe to call repeatedly;
   * a no-op if the scene cannot create graphics (e.g. in unit-test mocks).
   */
  private renderEKBorder(): void {
    if (!this.scene?.add?.graphics) return

    const style = getEKBorderStyle(this.ekTreatment)

    // Shadow + thin keyline, drawn BEHIND the face so they never cover it (nor a
    // neighbour's face in the overlapping hand fan).
    if (!this.ekBorder) {
      const g = this.scene.add.graphics()
      if (!g) return
      this.ekBorder = g
    }
    this.drawEKBorder(this.ekBorder, style)
    this.ekBorder.setPosition(this.x, this.y)
    this.ekBorder.setDepth(this.depth - 1)
    this.ekBorder.setVisible(this.visible)

    // Gold playable-affordance ring, drawn ABOVE the face (just below the next
    // fanned card + the state overlays) and shown only while playable & face-up.
    if (!this.ekRing) {
      const ring = this.scene.add.graphics()
      if (ring) this.ekRing = ring
    }
    if (this.ekRing) {
      this.drawEKRing(this.ekRing, style)
      this.ekRing.setPosition(this.x, this.y)
      this.ekRing.setDepth(this.depth + 0.5)
      this.ekRing.setVisible(this.visible && this._playable && this._hovered && !this._faceDown)
    }

    this.ekBorderDirty = false
    this.ekLastDrawnWidth = this.displayWidth
    this.ekLastDrawnHeight = this.displayHeight
  }

  /**
   * Draw the card's chunky drop shadow + thin edge keyline, centred on the
   * graphics object's own origin (0,0) and sized to the card's current display
   * bounds. Screen-space pixel widths (not the card's render scale) keep the
   * shadow/keyline crisp; positioned onto the card via `setPosition` in
   * {@link syncEKVisuals} so it follows the card cheaply as it moves.
   *
   * Crucially there is NO opaque fill: the cream face (drawn in-engine) is never
   * covered, so every card in the overlapping hand fan shows its face and corner
   * ranks - only shadow + a thin keyline sit behind it.
   */
  private drawEKBorder(g: Phaser.GameObjects.Graphics, style: EKBorderStyle): void {
    const dw = this.displayWidth
    const dh = this.displayHeight
    const r = style.cornerRadius
    const left = -dw / 2
    const top = -dh / 2

    g.clear()

    // Chunky drop shadow (prototype: a softer lower shadow + a tighter offset
    // one). Gives the cream card its lift with no face-covering fill.
    if (style.shadowAlpha > 0) {
      g.fillStyle(style.shadowColor, style.shadowAlpha * 0.55)
      g.fillRoundedRect(left - 2, top + style.shadowOffsetY + 6, dw + 4, dh + 6, r + 3)
      g.fillStyle(style.shadowColor, style.shadowAlpha)
      g.fillRoundedRect(left, top + style.shadowOffsetY, dw, dh, r)
    }

    // Neon additive outer glow ring (cyan), behind the face.
    if (style.glow) {
      const glowColor = style.keylineColor ?? style.accentColor
      g.lineStyle(style.inkWidth + 6, glowColor, 0.35)
      g.strokeRoundedRect(left - 3, top - 3, dw + 6, dh + 6, r + 3)
    }

    // Thin edge keyline hugging the card edge (comic ink / neon cyan). The warm
    // "gold" treatment has NO keyline - cream + shadow only, per prototype A.
    if (style.keylineColor !== null) {
      const kw = style.inkWidth
      g.lineStyle(kw, style.keylineColor, 1)
      g.strokeRoundedRect(left - kw / 2, top - kw / 2, dw + kw, dh + kw, r + kw / 2)
    }
  }

  /**
   * Draw the gold playable-affordance ring - the ONLY gold on the card. Mirrors
   * the prototype `.card.playable::after { box-shadow: inset 0 0 0 4px #FFD700 }`:
   * a 4px gold ring hugging the inner edge of the cream face. Rendered on its own
   * graphics ABOVE the face so it reads as an inset highlight, never a fill, and
   * is only made visible while the card is playable (see {@link renderEKBorder}).
   */
  private drawEKRing(g: Phaser.GameObjects.Graphics, style: EKBorderStyle): void {
    const dw = this.displayWidth
    const dh = this.displayHeight
    const r = style.cornerRadius
    const ringWidth = 4
    const inset = ringWidth / 2

    g.clear()
    g.lineStyle(ringWidth, style.ringColor, 1)
    g.strokeRoundedRect(
      -dw / 2 + inset,
      -dh / 2 + inset,
      dw - ringWidth,
      dh - ringWidth,
      Math.max(1, r - inset)
    )
  }

  /**
   * Subscribe to themeStore so the border/chrome switches live when the player
   * changes the active theme (the settings palette picker lands in ticket 15).
   */
  private subscribeToTheme(): void {
    this.themeUnsub = useThemeStore.subscribe((state, prevState) => {
      if (state.selectedTheme === prevState.selectedTheme) return
      if (!this.scene || !this.active) return
      const next = resolveEKTreatment(state.selectedTheme)
      if (next === this.ekTreatment) return
      this.ekTreatment = next
      this.ekBorderDirty = true
    })
  }

  /** Current EK border treatment (gold / comic / neon). */
  public getEKTreatment(): EKBorderTreatment {
    return this.ekTreatment
  }

  /**
   * The EK chrome graphics: the drop-shadow/keyline (behind the face) and the
   * gold playable ring (above it). TableScene adds these into the SAME container
   * as the card and depth-sorts, so in the overlapping hand fan a card's shadow
   * or ring never renders in front of a neighbouring card's face.
   */
  public getChromeObjects(): Phaser.GameObjects.Graphics[] {
    const out: Phaser.GameObjects.Graphics[] = []
    if (this.ekBorder) out.push(this.ekBorder)
    if (this.ekRing) out.push(this.ekRing)
    return out
  }

  /**
   * Force the EK chrome onto the card's current depth band - shadow/keyline just
   * behind the face (depth-1), gold ring just above it (depth+0.5) - and refresh
   * the ring's visibility. TableScene calls this right before depth-sorting a
   * card's container, because the per-frame sync in {@link preUpdate} has not run
   * yet at build time (so the chrome would otherwise sort using a stale depth).
   */
  public updateChromeDepth(): void {
    if (this.ekBorder) this.ekBorder.setDepth(this.depth - 1)
    if (this.ekRing) {
      this.ekRing.setDepth(this.depth + 0.5)
      this.ekRing.setVisible(this.visible && this._playable && this._hovered && !this._faceDown)
    }
  }

  /**
   * Per-frame sync: keep the EK border (and any attached state overlays) locked
   * to the card as it moves/scales during deals, plays, hovers and drags.
   */
  public preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta)
    this.syncEKVisuals()
  }

  /**
   * Reposition/redraw the EK border and reposition attached overlay objects to
   * follow the card. Redraws the border only when its size or treatment changed.
   */
  private syncEKVisuals(): void {
    if (this.ekBorder) {
      const sizeChanged =
        this.displayWidth !== this.ekLastDrawnWidth || this.displayHeight !== this.ekLastDrawnHeight
      // Redraw the geometry only when the treatment or display size changed;
      // otherwise just reposition (cheap) so the border tracks the moving card.
      if (this.ekBorderDirty || sizeChanged) {
        this.renderEKBorder()
      }
      this.ekBorder.setPosition(this.x, this.y)
      this.ekBorder.setDepth(this.depth - 1)
      this.ekBorder.setVisible(this.visible)
    }

    // Keep the gold playable ring locked to the card; its visibility tracks the
    // playable/face-up state (which can flip without a size change).
    if (this.ekRing) {
      this.ekRing.setPosition(this.x, this.y)
      this.ekRing.setDepth(this.depth + 0.5)
      this.ekRing.setVisible(this.visible && this._playable && this._hovered && !this._faceDown)
    }

    // Keep attached overlay display objects anchored to the card.
    const anchor = this.getOverlayAnchor()
    for (const kind of Object.keys(this.overlayObjects) as OverlayKind[]) {
      const obj = this.overlayObjects[kind] as
        | (Phaser.GameObjects.GameObject &
            Partial<Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Depth>)
        | undefined
      if (!obj) continue
      obj.setPosition?.(anchor.x, anchor.y)
      obj.setDepth?.(anchor.depth)
    }
  }

  // ===========================================================================
  // State-overlay hooks/slots for ticket 16 (fire / freeze / dry)
  // ===========================================================================

  /**
   * Anchor describing where a state overlay should render, relative to the
   * card's live position/size and depth. Ticket 16 uses this to place its
   * particle emitters / sprites; anything attached via {@link attachOverlay} is
   * kept on this anchor automatically.
   */
  public getOverlayAnchor(): {
    x: number
    y: number
    width: number
    height: number
    depth: number
  } {
    return {
      x: this.x,
      y: this.y,
      width: this.displayWidth,
      height: this.displayHeight,
      depth: this.depth + 1,
    }
  }

  /**
   * Attach a display object (particle emitter, sprite, container) to an overlay
   * slot. The object is depth-sorted above the card and repositioned to the
   * card each frame. Attaching also marks the slot active. Ticket 16 calls this
   * with effects built from `ParticleEffects`.
   */
  public attachOverlay(kind: OverlayKind, object: Phaser.GameObjects.GameObject): this {
    this.detachOverlay(kind)
    this.overlayObjects[kind] = object
    setOverlaySlot(this.overlaySlots, kind, true)
    return this
  }

  /**
   * Detach and destroy the display object in an overlay slot (if any). Does not
   * change the slot's active flag - use the `set*State` setters for that.
   */
  public detachOverlay(kind: OverlayKind): this {
    const existing = this.overlayObjects[kind]
    if (existing) {
      existing.destroy()
      delete this.overlayObjects[kind]
    }
    return this
  }

  /** Current active/inactive flag for an overlay slot. */
  public isOverlayActive(kind: OverlayKind): boolean {
    return isOverlayActive(this.overlaySlots, kind)
  }

  /** Snapshot of all overlay slot flags (fire / freeze / dry). */
  public getOverlayState(): OverlaySlotState {
    return { ...this.overlaySlots }
  }

  /**
   * Set card to "dry" state - a declared low card (6/7) awaiting challenge.
   * Ticket 12 owns the slot/flag only; ticket 16 renders the dry marker overlay
   * via {@link attachOverlay}. On disable the attached overlay is torn down.
   */
  public setDryState(enabled: boolean): this {
    const changed = setOverlaySlot(this.overlaySlots, 'dry', enabled)
    if (!changed) return this
    if (!enabled) {
      this.detachOverlay('dry')
    }
    return this
  }

  /**
   * Set card to freeze state (frozen border/aura). Alias-style hook that keeps
   * the freeze overlay slot in sync and drives the built-in frozen visual; the
   * richer freeze effect plugs into the slot in ticket 16.
   */
  public setFreezeState(enabled: boolean): this {
    setOverlaySlot(this.overlaySlots, 'freeze', enabled)
    if (!enabled) {
      this.detachOverlay('freeze')
    }
    this.setFrozenState(enabled)
    return this
  }

  /**
   * Set card to fire state - animated gradient border and glow
   * Used when player is on a fire streak
   */
  public setFireState(enabled: boolean): this {
    setOverlaySlot(this.overlaySlots, 'fire', enabled)
    if (!enabled) {
      this.detachOverlay('fire')
    }
    if (enabled && this._visualState !== 'fire') {
      this.setState('fire')
      this.clearStateEffects()

      // Create fire glow effect
      this.glowEffect = createGlowEffect(this.scene, this, 'fire')

      // Animate the fire glow
      const fireConfig = createFireStateAnimation(this.glowEffect)
      this.stateTween = this.scene.tweens.add(fireConfig)

      // Emit fire sound
      emitSoundEvent(this.scene, 'FIRE_STREAK')
    } else if (!enabled && this._visualState === 'fire') {
      this.setState('default')
      this.clearStateEffects()
    }

    return this
  }

  /**
   * Set card to frozen state - ice blue crystalline border
   * Used when card is affected by freeze counter
   */
  public setFrozenState(enabled: boolean): this {
    if (enabled && this._visualState !== 'frozen') {
      this.setState('frozen')
      this.clearStateEffects()

      // Create frozen glow effect
      this.glowEffect = createGlowEffect(this.scene, this, 'frozen')

      // Animate the frozen glow
      const frozenConfig = createFrozenStateAnimation(this.glowEffect)
      this.stateTween = this.scene.tweens.add(frozenConfig)

      // Apply blue tint to card
      this.setTint(0xccddff)

      // Emit freeze sound
      emitSoundEvent(this.scene, 'FREEZE_EFFECT')
    } else if (!enabled && this._visualState === 'frozen') {
      this.setState('default')
      this.clearStateEffects()
      this.clearTint()
    }

    return this
  }

  /**
   * Set card to disabled state - not playable
   * Opacity: 0.5, grayscale filter, no interaction
   */
  public setDisabledState(disabled: boolean): this {
    if (disabled && this._visualState !== 'disabled') {
      this.setState('disabled')
      this.clearStateEffects()
      applyDisabledState(this)
    } else if (!disabled && this._visualState === 'disabled') {
      this.setState('default')
      removeDisabledState(this)
    }

    return this
  }

  /**
   * Clear all state effects (glow, tweens)
   */
  private clearStateEffects(): void {
    if (this.stateTween) {
      this.stateTween.stop()
      this.stateTween = undefined
    }

    if (this.glowEffect) {
      this.glowEffect.destroy()
      this.glowEffect = undefined
    }
  }

  /**
   * Start continuous suit symbol pulse animation
   * 2s cycle as specified in design doc
   */
  public startSuitPulse(): this {
    if (this.suitPulseTween) {
      this.suitPulseTween.stop()
    }

    const pulseConfig = createSuitSymbolPulseAnimation(this)
    this.suitPulseTween = this.scene.tweens.add(pulseConfig)

    return this
  }

  /**
   * Stop suit symbol pulse animation
   */
  public stopSuitPulse(): this {
    if (this.suitPulseTween) {
      this.suitPulseTween.stop()
      this.suitPulseTween = undefined

      // Reset to original scale
      this.setScale(this.originalScale)
    }

    return this
  }

  /**
   * Animate card deal with exact design specifications
   * @param targetX - Destination X coordinate
   * @param targetY - Destination Y coordinate
   * @param cardIndex - Index for stagger delay (150ms per card)
   */
  public animateDeal(targetX: number, targetY: number, cardIndex: number = 0): this {
    const dealConfig = createCardDealAnimation(this, targetX, targetY, cardIndex)

    // Store the current depth before animation to preserve it
    const currentDepth = this.depth
    console.log(
      `[CardSprite] animateDeal - Starting with depth ${currentDepth} for ${this.suit} ${this.rank}`
    )

    this.scene.tweens.add({
      ...dealConfig,
      onStart: () => {
        // Aggressively set depth to ensure it's maintained
        this.setDepth(currentDepth)
        console.log(
          `[CardSprite] animateDeal onStart - Set depth to ${currentDepth}, actual depth: ${this.depth}`
        )
      },
      onUpdate: () => {
        // Force depth on every frame to ensure it never gets reset
        this.setDepth(currentDepth)
        // Also force to top of display list on every frame
        this.scene.children.bringToTop(this)
      },
      onComplete: () => {
        // Final depth set after animation completes
        this.setDepth(currentDepth)
        console.log(
          `[CardSprite] animateDeal onComplete - Final depth: ${this.depth} for ${this.suit} ${this.rank}`
        )

        // Store final position
        this.originalY = targetY
        this.originalScale = this.scaleX

        // Start suit pulse after deal
        this.startSuitPulse()

        // Emit deal sound with stagger
        setTimeout(() => {
          emitSoundEvent(this.scene, 'CARD_DEAL')
        }, cardIndex * 50) // Slight sound stagger
      },
    })

    return this
  }

  /**
   * Animate card play with exact design specifications
   * Duration: 400ms, includes squash effect and random rotation
   * @param tableCenterX - Table center X coordinate
   * @param tableCenterY - Table center Y coordinate
   */
  public animatePlay(tableCenterX: number, tableCenterY: number): this {
    // Stop suit pulse when playing
    this.stopSuitPulse()

    const playConfig = createCardPlayAnimation(this, tableCenterX, tableCenterY)

    this.scene.tweens.add({
      ...playConfig,
      onComplete: () => {
        // Emit play sound
        emitSoundEvent(this.scene, 'CARD_PLAY')
        triggerHaptic('CARD_PLAY')
      },
    })

    return this
  }

  /**
   * Get current card state
   */
  public get cardState(): string {
    return this._visualState
  }
}
