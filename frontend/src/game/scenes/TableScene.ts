import Phaser from 'phaser'
import type { Card, Suit } from '../../store/types'
import { useGameStore } from '../../store/gameStore'
import { usePlayerStore } from '../../store/playerStore'
import { useThemeStore } from '../../store/themeStore'
import { useUIStore } from '../../store/uiStore'
import { AudioManager, type SoundKey } from '../../services/audioManager'
import { CardSprite } from '../sprites/CardSprite'
import { ParticleEffects } from '../systems/ParticleEffects'
import { CardStateOverlayDriver } from '../overlays/CardStateOverlayDriver'
import type { OverlayStateSlice, DryZoneConfig } from '../overlays/overlayDecisions'
import { getPlayableCards } from '../utils/sparRules'
import { TableGameController } from '../orchestration/TableGameController'
import { CARD_BACK_KEY, CARD_SCALES } from '../constants/cards'
import {
  resolveEKTreatment,
  getEKBorderStyle,
  type EKBorderTreatment,
} from '../constants/cardTheme'
import { DEFAULT_CALLOUT_STYLE, type CalloutStyle, type CalloutSize } from '../config/callouts'
import { getBackdropSpec } from './tableBackdrop'
import {
  TABLE,
  handFanPositions,
  opponentSeatPositions,
  opponentFanOffsets,
  pileCardPlacement,
  timerProgress,
  ringEndAngle,
  isRingDanger,
  RING_START_ANGLE_RAD,
  type CardPlacement,
  type HandFanConfig,
  type SeatRowConfig,
  type OpponentFanConfig,
  type PileConfig,
} from './tableLayout'

/**
 * TableScene - the new, clean EK-style table (ticket 13).
 *
 * Replaces the 1477-line `GameScene` god-class with a thin composition that
 * RENDERS authoritative Zustand store state onto the agreed EK table
 * ("A's layout, B's chrome, C's ring"):
 *
 *  - A-layout   : local hand fanned in an arc along the bottom; opponents as
 *                 card-back fans with live counts across the top; a big central
 *                 play pile.
 *  - B-chrome   : comic-panel frame, halftone dots, ink-outlined cards (the
 *                 outline is drawn by `CardSprite` itself, ticket 12), and a
 *                 speech-bubble callout banner slot.
 *  - C-ring     : a circular countdown ring wrapping the drop zone.
 *
 * All geometry lives in the pure, unit-tested `tableLayout` helpers; this class
 * only turns those placements into Phaser objects and keeps them in sync with
 * the stores. It deliberately owns NO turn/round orchestration - see the "Seams"
 * section for the hook points later tickets plug into.
 *
 * Seams left for later tickets (all clearly marked in the code):
 *  - Ticket 14 (turn/round + play-again orchestration): set
 *    {@link onPlayCardRequested}; TableScene reports intent and re-renders from
 *    state but never mutates game state itself.
 *  - Ticket 15 (settings palette + data-driven callouts): the active treatment
 *    is read live from `themeStore`; call {@link showCallout} from a
 *    config-driven trigger to pop event banners (POW/BAM/BOOM).
 *  - Ticket 16 (fire/freeze/dry overlays): hand/pile cards are real
 *    `CardSprite`s, so ticket 16 drives `setFireState` / `setFreezeState` /
 *    `setDryState` and the `attachOverlay` / `getOverlayAnchor` hooks directly.
 */
export class TableScene extends Phaser.Scene {
  // --- composition: reused building blocks --------------------------------
  private particleEffects?: ParticleEffects
  // Ticket 16: drives fire / freeze / dry overlays from the store overlay state.
  private overlayDriver?: CardStateOverlayDriver

  // --- render layers ------------------------------------------------------
  private chromeLayer?: Phaser.GameObjects.Container
  private opponentLayer?: Phaser.GameObjects.Container
  private pileLayer?: Phaser.GameObjects.Container
  private handLayer?: Phaser.GameObjects.Container
  private hudLayer?: Phaser.GameObjects.Container
  private ringGraphics?: Phaser.GameObjects.Graphics
  private bannerContainer?: Phaser.GameObjects.Container
  private bannerBg?: Phaser.GameObjects.Graphics
  private bannerText?: Phaser.GameObjects.Text
  private scoreText?: Phaser.GameObjects.Text

  // --- live sprites -------------------------------------------------------
  private handSprites: CardSprite[] = []
  private pileSprites = new Map<string, CardSprite>()

  // --- active theme treatment (gold / comic / neon) -----------------------
  private treatment: EKBorderTreatment = 'gold'

  // --- countdown ring bookkeeping -----------------------------------------
  /** The denominator for the ring. Seeded from the server turn total when known. */
  private ringTotalSeconds = 15
  /**
   * Once the server has told us this turn's total (via {@link setTurnTotal}) we
   * stop the max-observed heuristic and trust the authoritative value.
   */
  private ringTotalAuthoritative = false

  // --- store subscriptions ------------------------------------------------
  private unsubscribers: Array<() => void> = []

  // --- ticket 14: turn/round/play-again orchestration ---------------------
  private controller?: TableGameController

  // --- ticket 10 SFX: cartoon audio played at the same beats as the callouts -
  private audioManager?: AudioManager

  // --- SEAM (ticket 14): orchestration wires this to request a real play ---
  /** Called when the local player asks to play a card (click or drag-up). */
  public onPlayCardRequested?: (card: Card) => void

  constructor() {
    super({ key: 'TableScene' })
  }

  // =========================================================================
  // lifecycle
  // =========================================================================

  create(): void {
    this.treatment = resolveEKTreatment(useThemeStore.getState().selectedTheme)

    this.buildBackground()
    this.buildChrome()
    this.buildTimerRing()
    this.buildBanner()
    this.buildHud()

    this.particleEffects = new ParticleEffects(this)

    // Ticket 10 SFX: wire the preloaded cartoon sounds to this scene so the
    // orchestration layer can play them at the same beats as the callouts. init()
    // is a no-op-safe wrapper: if the sounds were not preloaded (e.g. a unit
    // scene), we simply stay silent rather than throw.
    try {
      this.audioManager = AudioManager.getInstance()
      this.audioManager.init(this)
    } catch (error) {
      console.warn('[TableScene] audio init skipped:', error)
      this.audioManager = undefined
    }

    // Ticket 16: fire / freeze / dry overlays composited on the reused faces.
    this.overlayDriver = new CardStateOverlayDriver(
      this,
      this.particleEffects,
      this.dryZoneConfig()
    )

    this.opponentLayer = this.add.container(0, 0).setDepth(200)
    this.pileLayer = this.add.container(0, 0).setDepth(100)
    this.handLayer = this.add.container(0, 0).setDepth(300)

    this.renderFromState()
    this.syncOverlays()
    this.subscribeToStores()

    // Ticket 14: the orchestration controller owns all turn/round/timer/dry/flag
    // and play-again logic. It attaches its socket handlers deterministically
    // (fixing the old listener-attach race) and wires onPlayCardRequested. The
    // scene stays a pure renderer - it provides hooks and re-renders from state.
    this.controller = new TableGameController(this)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.teardown, this)

    // Test-only readiness beacon (VITE_SPAR_TEST): lets the Playwright harness
    // wait until the scene AND its controller are fully wired before it starts a
    // game, so the controller never misses the first game:started (which seeds
    // the local hand). Statically stripped from production builds.
    if (import.meta.env.VITE_SPAR_TEST === 'true') {
      ;(window as unknown as { __tableSceneReady?: boolean }).__tableSceneReady = true
    }
  }

  update(): void {
    this.updateTimerRing()
  }

  private teardown(): void {
    this.controller?.destroy()
    this.controller = undefined
    for (const unsub of this.unsubscribers) unsub()
    this.unsubscribers = []
    // Stop the local turn countdown so its interval does not leak past the scene.
    useGameStore.getState().stopTurnCountdown()
    this.audioManager?.destroy()
    this.audioManager = undefined
    this.overlayDriver?.destroy()
    this.overlayDriver = undefined
    this.particleEffects?.cleanup()
  }

  // =========================================================================
  // static chrome (background + comic panel + halftone)
  // =========================================================================

  private buildBackground(): void {
    // Backdrop drawn in-engine from the active treatment, faithfully reskinned
    // per palette the way the 06 prototype's variants differ (warm radial glow /
    // flat comic wash / deep neon radial). The table STRUCTURE is fixed; only
    // the backdrop colours + comic texture reskin, so there are no per-theme
    // surface image assets to load.
    const spec = getBackdropSpec(this.treatment)
    const key = `table_backdrop_${this.treatment}`

    // Rasterise the gradient into a canvas texture (Phaser Graphics cannot do a
    // radial fill). Idempotent across scene restarts.
    if (!this.textures.exists(key)) {
      const canvasTex = this.textures.createCanvas(key, TABLE.width, TABLE.height)
      const ctx = canvasTex?.getContext()
      if (canvasTex && ctx) {
        const grad =
          spec.kind === 'radial'
            ? ctx.createRadialGradient(
                TABLE.width * spec.focusX,
                TABLE.height * spec.focusY,
                20,
                TABLE.width * spec.focusX,
                TABLE.height * spec.focusY,
                Math.max(TABLE.width, TABLE.height) * 0.8
              )
            : ctx.createLinearGradient(0, 0, TABLE.width, TABLE.height)
        for (const stop of spec.stops) grad.addColorStop(stop.offset, stop.color)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, TABLE.width, TABLE.height)
        canvasTex.refresh()
      }
    }

    if (this.textures.exists(key)) {
      this.add.image(TABLE.centerX, TABLE.centerY, key).setDepth(-1000)
    } else {
      // Headless / unit fallback: flat gradient wash from the palette.
      const palette = this.chromePalette()
      const g = this.add.graphics().setDepth(-1000)
      g.fillGradientStyle(palette.bgTop, palette.bgTop, palette.bgBottom, palette.bgBottom, 1)
      g.fillRect(0, 0, TABLE.width, TABLE.height)
    }
  }

  private buildChrome(): void {
    const palette = this.chromePalette()
    const spec = getBackdropSpec(this.treatment)
    this.chromeLayer = this.add.container(0, 0).setDepth(40)

    // Comic texture over the backdrop: Ben-Day halftone dots (warm/comic) or a
    // neon scanline grid, matching how the prototype's palette variants differ.
    const texture = this.add.graphics().setDepth(-900)
    if (spec.texture === 'scanlines') {
      texture.lineStyle(2, palette.ink, 0.06)
      for (let y = 0; y < TABLE.height; y += 40) {
        texture.lineBetween(0, y, TABLE.width, y)
      }
      for (let x = 0; x < TABLE.width; x += 40) {
        texture.lineBetween(x, 0, x, TABLE.height)
      }
    } else {
      // Dense Ben-Day dots (prototype B: 2px dots on a 14px grid).
      texture.fillStyle(palette.ink, 0.1)
      const step = 14
      for (let y = step; y < TABLE.height; y += step) {
        for (let x = step; x < TABLE.width; x += step) {
          texture.fillCircle(x, y, 2)
        }
      }
    }

    // Comic-panel frame: chunky ink border, a white pop line, then an inner ink
    // line (the prototype's `border:6px ink; inset 4px #fff, inset 10px ink`).
    const frame = this.add.graphics()
    const inset = 14
    frame.lineStyle(10, palette.ink, 1)
    frame.strokeRect(inset, inset, TABLE.width - inset * 2, TABLE.height - inset * 2)
    frame.lineStyle(4, palette.pop, 1)
    frame.strokeRect(
      inset + 7,
      inset + 7,
      TABLE.width - (inset + 7) * 2,
      TABLE.height - (inset + 7) * 2
    )
    frame.lineStyle(3, palette.ink, 1)
    frame.strokeRect(
      inset + 11,
      inset + 11,
      TABLE.width - (inset + 11) * 2,
      TABLE.height - (inset + 11) * 2
    )
    this.chromeLayer.add(frame)

    // Play-pile label above the drop zone.
    const label = this.add
      .text(this.pileConfig().centerX, this.pileConfig().centerY - 150, 'THE PILE', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '22px',
        color: this.hex(palette.ink),
      })
      .setOrigin(0.5)
      .setDepth(45)
    this.chromeLayer.add(label)
  }

  // =========================================================================
  // countdown ring (C) - wraps the drop zone
  // =========================================================================

  private buildTimerRing(): void {
    this.ringGraphics = this.add.graphics().setDepth(160)
    this.updateTimerRing()
  }

  /**
   * SEAM (ticket 14): the orchestration layer sets the authoritative turn total
   * from the server timer (turnChanged / timerUpdate.turnDurationSeconds), so
   * the ring fills against the real per-seat budget (leader 15s / follower 8s /
   * subsequent 5s) instead of the largest value observed.
   */
  public setTurnTotal(seconds: number): void {
    if (seconds > 0) {
      this.ringTotalSeconds = seconds
      this.ringTotalAuthoritative = true
    }
  }

  private updateTimerRing(): void {
    const g = this.ringGraphics
    if (!g) return

    const remaining = useGameStore.getState().timeRemaining
    // Fall back to the max-observed heuristic only until the server total lands.
    if (!this.ringTotalAuthoritative && remaining > this.ringTotalSeconds) {
      this.ringTotalSeconds = remaining
    }
    const progress = timerProgress(remaining, this.ringTotalSeconds)

    const pile = this.pileConfig()
    const radius = 150
    const palette = this.chromePalette()

    g.clear()
    // Track.
    g.lineStyle(8, palette.ink, 0.18)
    g.strokeCircle(pile.centerX, pile.centerY, radius)
    // Remaining-time arc, sweeping clockwise from 12 o'clock.
    if (progress > 0) {
      const color = isRingDanger(progress) ? palette.danger : palette.accent
      g.lineStyle(8, color, 1)
      g.beginPath()
      g.arc(pile.centerX, pile.centerY, radius, RING_START_ANGLE_RAD, ringEndAngle(progress), false)
      g.strokePath()
    }
  }

  // =========================================================================
  // callout banner slot (B chrome) - SEAM for ticket 15 (data-driven callouts)
  // =========================================================================

  private buildBanner(): void {
    this.bannerContainer = this.add.container(TABLE.centerX, TABLE.height * 0.42).setDepth(900)
    this.bannerContainer.setScale(0)
    this.bannerContainer.setAlpha(0)

    // The banner background + text colours are (re)painted per callout style in
    // showCallout so each callout reskins with the active palette.
    this.bannerBg = this.add.graphics()

    this.bannerText = this.add
      .text(0, 0, '', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: this.calloutFontSize('big'),
      })
      .setOrigin(0.5)

    this.paintBanner(DEFAULT_CALLOUT_STYLE)
    this.bannerContainer.add([this.bannerBg, this.bannerText])
  }

  /** Banner font size per callout emphasis. */
  private calloutFontSize(size: CalloutSize): string {
    switch (size) {
      case 'huge':
        return '64px'
      case 'normal':
        return '40px'
      case 'big':
      default:
        return '54px'
    }
  }

  /**
   * Repaint the banner background + text for a callout style, resolved against
   * the ACTIVE palette. So the same authored style reskins per theme: e.g. an
   * `accent`-filled callout is gold on Warm Heritage and magenta on Neon.
   */
  private paintBanner(style: CalloutStyle): void {
    const palette = this.chromePalette()
    const fill = {
      accent: palette.accent,
      danger: palette.danger,
      pop: palette.pop,
      ink: palette.ink,
    }[style.fill]
    // Text stays legible against the fill: ink on light fills, pop on the ink fill.
    const textColor = style.fill === 'ink' ? palette.pop : palette.ink

    if (this.bannerBg) {
      this.bannerBg.clear()
      this.bannerBg.fillStyle(fill, 1)
      this.bannerBg.fillRoundedRect(-190, -52, 380, 104, 10)
      this.bannerBg.lineStyle(8, palette.ink, 1)
      this.bannerBg.strokeRoundedRect(-190, -52, 380, 104, 10)
    }
    if (this.bannerText) {
      this.bannerText.setColor(this.hex(textColor))
      this.bannerText.setFontSize(this.calloutFontSize(style.size))
    }
  }

  /**
   * Pop a comic callout banner (POW! / BOOM! / BUSTED! ...). Words + style come
   * from the designer-authored callout config (via TableGameController); this
   * owns only the renderer + motion (bouncy pop-in, hold, shrink-out) and
   * reskins the banner to the active palette for the given style.
   */
  public showCallout(text: string, style: CalloutStyle = DEFAULT_CALLOUT_STYLE): void {
    const banner = this.bannerContainer
    if (!banner || !this.bannerText) return
    this.paintBanner(style)
    this.bannerText.setText(text)
    this.tweens.killTweensOf(banner)
    const startAngle = style.shake ? -10 : -8
    banner.setScale(0).setAlpha(1).setAngle(startAngle)
    this.tweens.add({
      targets: banner,
      scale: 1,
      angle: style.shake ? 3 : -3,
      duration: 480,
      ease: style.shake ? 'Elastic.easeOut' : 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: banner,
          scale: 0.6,
          alpha: 0,
          delay: 900,
          duration: 260,
          ease: 'Cubic.easeIn',
        })
      },
    })
  }

  // =========================================================================
  // HUD (score + streak + you-badge)
  // =========================================================================

  private buildHud(): void {
    const palette = this.chromePalette()
    this.hudLayer = this.add.container(0, 0).setDepth(500)

    this.scoreText = this.add
      .text(TABLE.width - 40, TABLE.height - 60, '', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '20px',
        color: this.hex(palette.ink),
        align: 'right',
      })
      .setOrigin(1, 0.5)

    const youBadge = this.add
      .text(60, TABLE.height - 44, 'YOU', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '22px',
        color: this.hex(palette.pop),
        backgroundColor: this.hex(palette.ink),
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0, 0.5)

    this.hudLayer.add([this.scoreText, youBadge])
    this.updateHud()
  }

  private updateHud(): void {
    if (!this.scoreText) return
    const { players } = useGameStore.getState()
    const localId = usePlayerStore.getState().playerId
    const me = players.find(p => p.id === localId)
    const myScore = me?.score ?? 0
    const streak = me?.winStreak ?? 0
    const opponentTop = players
      .filter(p => p.id !== localId)
      .reduce((m, p) => Math.max(m, p.score), 0)
    this.scoreText.setText(`YOU ${myScore}   THEM ${opponentTop}\nSTREAK ${streak}/4`)
  }

  // =========================================================================
  // render-from-state (no orchestration - just draws current store state)
  // =========================================================================

  private renderFromState(): void {
    this.renderOpponents()
    this.renderHand()
    this.renderPile()
    this.updateHud()
  }

  private renderOpponents(): void {
    const layer = this.opponentLayer
    if (!layer) return
    layer.removeAll(true)

    const { players } = useGameStore.getState()
    const localId = usePlayerStore.getState().playerId
    const opponents = players.filter(p => p.id !== localId)
    if (opponents.length === 0) return

    const palette = this.chromePalette()
    const seats = opponentSeatPositions(opponents.length, this.seatConfig())
    const fanCfg = this.opponentFanConfig()
    const onDeckId = useGameStore.getState().onDeckPlayerId

    opponents.forEach((opp, i) => {
      const seat = seats[i]
      const group = this.add.container(seat.x, seat.y)
      const isOnDeck = opp.id === onDeckId

      // Card-back mini fan - shrinks naturally as the opponent plays, since the
      // count comes straight from their authoritative remaining hand length.
      const cardCount = opp.hand?.length ?? 0
      const offsets = opponentFanOffsets(cardCount, fanCfg)
      for (const off of offsets) {
        const back = this.add.image(off.x, off.y + 40, CARD_BACK_KEY)
        back.setScale(0.1)
        back.setAngle(off.rotationDeg)
        group.add(back)
      }

      // Name badge - lit up (accent fill) when this seat's timer is running.
      const name = this.add
        .text(0, 0, opp.name.toUpperCase(), {
          fontFamily: 'Impact, "Arial Black", sans-serif',
          fontSize: '16px',
          color: this.hex(isOnDeck ? palette.ink : palette.pop),
          backgroundColor: this.hex(isOnDeck ? palette.accent : palette.ink),
          padding: { x: 12, y: 3 },
        })
        .setOrigin(0.5)

      // Count badge (prefixed with a timer marker while on deck).
      const count = this.add
        .text(0, 92, `${isOnDeck ? '⏱ ' : ''}${cardCount} CARDS`, {
          fontFamily: 'Impact, "Arial Black", sans-serif',
          fontSize: '13px',
          color: this.hex(isOnDeck ? palette.danger : palette.accent),
        })
        .setOrigin(0.5)

      group.add([name, count])
      layer.add(group)
    })
  }

  private renderHand(): void {
    const layer = this.handLayer
    if (!layer) return

    // Rebuild the hand fan from the authoritative local hand.
    for (const sprite of this.handSprites) sprite.destroy()
    this.handSprites = []

    const hand = usePlayerStore.getState().hand
    const hintIds = this.handHintIds()

    const placements = handFanPositions(hand.length, this.handConfig())
    hand.forEach((card, i) => {
      const p = placements[i]
      const sprite = new CardSprite(
        this,
        p.x,
        p.y,
        card.suit,
        card.rank,
        usePlayerStore.getState().playerId
      )
      sprite.setScale(CARD_SCALES.HAND)
      sprite.setAngle(p.rotationDeg)
      sprite.setDepth(300 + i)
      sprite.updateOriginalY(p.y)
      sprite.setPlayable(hintIds.has(card.id))

      // SEAM (ticket 14): click / drag-up reports intent; state change is owned
      // by the orchestration layer, which then re-renders us from the store.
      sprite.onCardClick = () => this.requestPlay(card)
      sprite.onCardDragPlay = () => this.requestPlay(card)

      this.handSprites.push(sprite)
      layer.add(sprite)
      // Keep each card's EK chrome (drop-shadow/keyline + gold ring) in the SAME
      // container as the card so the fan depth-sorts as one unit - a card's
      // shadow/ring must never render in front of a neighbour's face.
      sprite.updateChromeDepth()
      layer.add(sprite.getChromeObjects())
    })
    // Order the container by depth: shadow/keyline (depth-1) behind each face,
    // gold ring (depth+0.5) just above it, all beneath the next fanned card.
    layer.sort('depth')
  }

  /**
   * The follow-suit HINT set to highlight - a HINT only. Off-suit cards stay
   * playable (the backend is the sole authority on legality); we never disable a
   * card for being off-suit. When the local player may not play right now
   * (not their moment per the corrected rules), nothing is highlighted.
   */
  private handHintIds(): Set<string> {
    if (!usePlayerStore.getState().canPlay) return new Set()
    const hand = usePlayerStore.getState().hand
    const currentSuit = useGameStore.getState().currentSuit as Suit | null
    return new Set(getPlayableCards(hand, currentSuit).map(c => c.id))
  }

  /**
   * Re-apply the follow-suit hint to the existing hand sprites without a full
   * rebuild - used when only the affordance (canPlay) changes, so we do not
   * thrash hover/drag or restart deal animations.
   */
  private applyHandAffordance(): void {
    const hand = usePlayerStore.getState().hand
    const hintIds = this.handHintIds()
    this.handSprites.forEach((sprite, i) => {
      const card = hand[i]
      if (card) sprite.setPlayable(hintIds.has(card.id))
    })
  }

  private renderPile(): void {
    const layer = this.pileLayer
    if (!layer) return

    const played = useGameStore.getState().playedCards
    const liveIds = new Set<string>()
    let index = this.pileSprites.size

    for (const [playerId, card] of played.entries()) {
      liveIds.add(playerId)
      if (this.pileSprites.has(playerId)) continue

      const placement = pileCardPlacement(index, this.pileConfig())
      const sprite = new CardSprite(this, placement.x, placement.y, card.suit, card.rank, playerId)
      sprite.setScale(CARD_SCALES.PLAYED)
      sprite.setPlayable(false)
      sprite.setDepth(100 + index)
      layer.add(sprite)
      // Chrome shares the card's container so its shadow/keyline depth-sorts with
      // the settled stack rather than rendering in front of it.
      sprite.updateChromeDepth()
      layer.add(sprite.getChromeObjects())
      this.pileSprites.set(playerId, sprite)
      this.landCardInPile(sprite, placement)
      index++
    }

    // Round reset: playedCards cleared -> drop the settled stack.
    for (const [playerId, sprite] of this.pileSprites.entries()) {
      if (!liveIds.has(playerId)) {
        sprite.destroy()
        this.pileSprites.delete(playerId)
      }
    }

    // Keep the pile container ordered by depth (shadow behind each face).
    layer.sort('depth')

    // Re-attach fire / freeze overlays to the (possibly new) pile sprites.
    this.syncPileOverlays()
  }

  // =========================================================================
  // state-overlay driver wiring (ticket 16): fire / freeze / dry
  // =========================================================================

  /** The overlay-relevant slice of the game store the driver reconciles against. */
  private overlaySlice(): OverlayStateSlice {
    const g = useGameStore.getState()
    return {
      fireStreakPlayerId: g.fireStreakPlayerId,
      frozenCard: g.frozenCard,
      playedCards: g.playedCards,
      dryDeclarations: g.dryDeclarations,
    }
  }

  private syncPileOverlays(): void {
    this.overlayDriver?.syncPileOverlays(this.pileSprites, this.overlaySlice())
  }

  private syncDryOverlays(): void {
    this.overlayDriver?.syncDryOverlays(useGameStore.getState().dryDeclarations)
  }

  /** Sync every overlay from the current store state (initial render + resync). */
  private syncOverlays(): void {
    this.syncPileOverlays()
    this.syncDryOverlays()
  }

  /** Where set-aside dry / show-dry cards are laid out (bottom-left strip). */
  private dryZoneConfig(): DryZoneConfig {
    return { x: 150, y: 470, spacing: 76 }
  }

  /**
   * Bouncy-overshoot landing: the card drops onto its settled placement with an
   * overshoot then settles. This is the agreed "play" motion beat; ticket 14
   * decides WHEN a card enters the pile, this owns HOW it lands.
   */
  private landCardInPile(sprite: CardSprite, placement: CardPlacement): void {
    sprite.setScale(CARD_SCALES.PLAYED * 1.25)
    sprite.setAngle(placement.rotationDeg + (placement.rotationDeg >= 0 ? 8 : -8))
    this.tweens.add({
      targets: sprite,
      scaleX: CARD_SCALES.PLAYED,
      scaleY: CARD_SCALES.PLAYED,
      angle: placement.rotationDeg,
      duration: 420,
      ease: 'Back.easeOut',
    })
  }

  private requestPlay(card: Card): void {
    this.onPlayCardRequested?.(card)
  }

  /**
   * SEAM (ticket 14/10): the orchestration layer plays a cartoon SFX at a game
   * beat (card play, round win/loss, dry, fire, freeze, invalid...). Mute-safe:
   * respects the live `soundEnabled` setting in uiStore, and no-ops if audio was
   * never initialised. The AudioManager itself also honours its mute state.
   */
  public playSound(key: SoundKey): void {
    if (!useUIStore.getState().soundEnabled) return
    this.audioManager?.play(key)
  }

  // =========================================================================
  // store subscriptions - re-render from state on change
  // =========================================================================

  private subscribeToStores(): void {
    // Re-render only the slices that actually changed. Crucially, the 1s turn
    // countdown mutates `timeRemaining` every tick - that drives the ring via
    // update() and must NOT rebuild the CardSprites (which would thrash hover /
    // drag and reset animations). So we diff by reference and skip otherwise.
    this.unsubscribers.push(
      useGameStore.subscribe((state, prev) => {
        // The on-deck seat changing re-lights the opponent timer highlight.
        if (state.players !== prev.players || state.onDeckPlayerId !== prev.onDeckPlayerId) {
          this.renderOpponents()
          this.updateHud()
        }
        if (state.playedCards !== prev.playedCards) {
          // renderPile() re-attaches the pile overlays after rebuilding sprites.
          this.renderPile()
        } else if (
          state.fireStreakPlayerId !== prev.fireStreakPlayerId ||
          state.frozenCard !== prev.frozenCard
        ) {
          // Overlay state landed (roundWon) or cleared (clearRoundEffects) with
          // the pile unchanged - reconcile fire / freeze on the existing sprites.
          this.syncPileOverlays()
        }
        if (state.dryDeclarations !== prev.dryDeclarations) {
          this.syncDryOverlays()
        }
        // The local hand is sourced from playerStore, NOT gameStore.players, so
        // opponent plays / score / streak updates must never rebuild it. Only the
        // led-suit changing shifts the follow-suit hint, and that is a
        // hint-only refresh - reapply it in place instead of destroying sprites
        // (which would kill in-progress hover/drag and re-run deal animations).
        if (state.currentSuit !== prev.currentSuit) {
          this.applyHandAffordance()
        }
      })
    )
    this.unsubscribers.push(
      usePlayerStore.subscribe((state, prev) => {
        if (state.hand !== prev.hand) {
          this.renderHand()
        } else if (state.canPlay !== prev.canPlay) {
          // Affordance-only change: re-hint the existing sprites without a
          // rebuild so hover/drag and deal animations are not thrashed.
          this.applyHandAffordance()
        }
      })
    )
    this.unsubscribers.push(
      useThemeStore.subscribe((state, prev) => {
        if (state.selectedTheme === prev.selectedTheme) return
        // CardSprite re-themes itself; the scene chrome is rebuilt on restart.
        this.treatment = resolveEKTreatment(state.selectedTheme)
      })
    )
  }

  // =========================================================================
  // layout configs (bind the pure helpers to this scene's canvas)
  // =========================================================================

  private handConfig(): HandFanConfig {
    return { centerX: TABLE.centerX, baseY: 640, radius: 900, spreadDeg: 30 }
  }

  private seatConfig(): SeatRowConfig {
    return { centerX: TABLE.centerX, topY: 110, seatWidth: 150, gap: 80 }
  }

  private opponentFanConfig(): OpponentFanConfig {
    return { maxVisible: 5, spreadDeg: 36, spacing: 70, drop: 8 }
  }

  private pileConfig(): PileConfig {
    return { centerX: TABLE.centerX, centerY: 320, positionJitter: 10, rotationJitterDeg: 12 }
  }

  // =========================================================================
  // per-treatment chrome palette (aligned with CardSprite's EK border, t.12)
  // =========================================================================

  private chromePalette(): {
    bgTop: number
    bgBottom: number
    ink: number
    pop: number
    accent: number
    danger: number
  } {
    const border = getEKBorderStyle(useThemeStore.getState().selectedTheme)
    switch (this.treatment) {
      case 'comic':
        return {
          bgTop: 0xffd400,
          bgBottom: 0xffb700,
          ink: border.inkColor,
          pop: 0xffffff,
          accent: border.accentColor,
          danger: 0xe4002b,
        }
      case 'neon':
        return {
          bgTop: 0x2a0a4a,
          bgBottom: 0x05010f,
          ink: 0x00f5ff,
          pop: 0x0d0221,
          accent: border.accentColor,
          danger: 0xff006e,
        }
      case 'gold':
      default:
        return {
          bgTop: 0xffe9c7,
          bgBottom: 0xe0964a,
          ink: border.inkColor,
          pop: 0xffd700,
          accent: border.accentColor,
          danger: 0xe4002b,
        }
    }
  }

  /** Phaser hex int -> `#rrggbb` string for Text style colours. */
  private hex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`
  }
}
