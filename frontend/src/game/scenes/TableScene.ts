import Phaser from 'phaser'
import type { Card, Suit } from '../../store/types'
import { useGameStore } from '../../store/gameStore'
import { usePlayerStore } from '../../store/playerStore'
import { useThemeStore } from '../../store/themeStore'
import { CardSprite } from '../sprites/CardSprite'
import { ParticleEffects } from '../systems/ParticleEffects'
import { getPlayableCards } from '../utils/sparRules'
import { CARD_BACK_KEY, CARD_SCALES } from '../constants/cards'
import {
  resolveEKTreatment,
  getEKBorderStyle,
  type EKBorderTreatment,
} from '../constants/cardTheme'
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

  // --- render layers ------------------------------------------------------
  private chromeLayer?: Phaser.GameObjects.Container
  private opponentLayer?: Phaser.GameObjects.Container
  private pileLayer?: Phaser.GameObjects.Container
  private handLayer?: Phaser.GameObjects.Container
  private hudLayer?: Phaser.GameObjects.Container
  private ringGraphics?: Phaser.GameObjects.Graphics
  private bannerContainer?: Phaser.GameObjects.Container
  private bannerText?: Phaser.GameObjects.Text
  private scoreText?: Phaser.GameObjects.Text

  // --- live sprites -------------------------------------------------------
  private handSprites: CardSprite[] = []
  private pileSprites = new Map<string, CardSprite>()

  // --- active theme treatment (gold / comic / neon) -----------------------
  private treatment: EKBorderTreatment = 'gold'

  // --- countdown ring bookkeeping -----------------------------------------
  /** Largest timeRemaining seen this turn - the denominator for the ring. */
  private ringTotalSeconds = 15

  // --- store subscriptions ------------------------------------------------
  private unsubscribers: Array<() => void> = []

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

    this.opponentLayer = this.add.container(0, 0).setDepth(200)
    this.pileLayer = this.add.container(0, 0).setDepth(100)
    this.handLayer = this.add.container(0, 0).setDepth(300)

    this.renderFromState()
    this.subscribeToStores()

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.teardown, this)
  }

  update(): void {
    this.updateTimerRing()
  }

  private teardown(): void {
    for (const unsub of this.unsubscribers) unsub()
    this.unsubscribers = []
    this.particleEffects?.cleanup()
  }

  // =========================================================================
  // static chrome (background + comic panel + halftone)
  // =========================================================================

  private buildBackground(): void {
    const themeKey = `surface_${useThemeStore.getState().selectedTheme}`
    if (this.textures.exists(themeKey)) {
      const bg = this.add.image(TABLE.centerX, TABLE.centerY, themeKey)
      const scale = Math.max(TABLE.width / bg.width, TABLE.height / bg.height)
      bg.setScale(scale).setDepth(-1000)
      return
    }
    // Fallback gradient wash in the treatment's palette.
    const palette = this.chromePalette()
    const g = this.add.graphics().setDepth(-1000)
    g.fillGradientStyle(palette.bgTop, palette.bgTop, palette.bgBottom, palette.bgBottom, 1)
    g.fillRect(0, 0, TABLE.width, TABLE.height)
  }

  private buildChrome(): void {
    const palette = this.chromePalette()
    this.chromeLayer = this.add.container(0, 0).setDepth(40)

    // Halftone / Ben-Day dots wash (comic chrome), kept faint and behind cards.
    const dots = this.add.graphics().setDepth(-900)
    dots.fillStyle(palette.ink, 0.06)
    const step = 26
    for (let y = step; y < TABLE.height; y += step) {
      for (let x = step; x < TABLE.width; x += step) {
        dots.fillCircle(x, y, 2)
      }
    }

    // Comic-panel frame: chunky ink border with an inner pop line.
    const frame = this.add.graphics()
    const inset = 14
    frame.lineStyle(10, palette.ink, 1)
    frame.strokeRect(inset, inset, TABLE.width - inset * 2, TABLE.height - inset * 2)
    frame.lineStyle(3, palette.pop, 1)
    frame.strokeRect(
      inset + 7,
      inset + 7,
      TABLE.width - (inset + 7) * 2,
      TABLE.height - (inset + 7) * 2
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

  private updateTimerRing(): void {
    const g = this.ringGraphics
    if (!g) return

    const remaining = useGameStore.getState().timeRemaining
    if (remaining > this.ringTotalSeconds) this.ringTotalSeconds = remaining
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
    const palette = this.chromePalette()
    this.bannerContainer = this.add.container(TABLE.centerX, TABLE.height * 0.42).setDepth(900)
    this.bannerContainer.setScale(0)
    this.bannerContainer.setAlpha(0)

    const bg = this.add.graphics()
    bg.fillStyle(palette.pop, 1)
    bg.fillRoundedRect(-190, -52, 380, 104, 10)
    bg.lineStyle(8, palette.ink, 1)
    bg.strokeRoundedRect(-190, -52, 380, 104, 10)

    this.bannerText = this.add
      .text(0, 0, '', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '54px',
        color: this.hex(palette.ink),
      })
      .setOrigin(0.5)

    this.bannerContainer.add([bg, this.bannerText])
  }

  /**
   * Pop a comic callout banner (POW! / BOOM! / BUSTED! ...). Ticket 15 drives
   * this from its designer-authored callout config; ticket 13 provides only the
   * renderer + motion (bouncy pop-in, hold, shrink-out).
   */
  public showCallout(text: string): void {
    const banner = this.bannerContainer
    if (!banner || !this.bannerText) return
    this.bannerText.setText(text)
    this.tweens.killTweensOf(banner)
    banner.setScale(0).setAlpha(1).setAngle(-8)
    this.tweens.add({
      targets: banner,
      scale: 1,
      angle: -3,
      duration: 480,
      ease: 'Back.easeOut',
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

    opponents.forEach((opp, i) => {
      const seat = seats[i]
      const group = this.add.container(seat.x, seat.y)

      // Card-back mini fan.
      const cardCount = opp.hand?.length ?? 0
      const offsets = opponentFanOffsets(cardCount, fanCfg)
      for (const off of offsets) {
        const back = this.add.image(off.x, off.y + 40, CARD_BACK_KEY)
        back.setScale(0.1)
        back.setAngle(off.rotationDeg)
        group.add(back)
      }

      // Name badge.
      const name = this.add
        .text(0, 0, opp.name.toUpperCase(), {
          fontFamily: 'Impact, "Arial Black", sans-serif',
          fontSize: '16px',
          color: this.hex(palette.pop),
          backgroundColor: this.hex(palette.ink),
          padding: { x: 12, y: 3 },
        })
        .setOrigin(0.5)

      // Count badge.
      const count = this.add
        .text(0, 92, `${cardCount} CARDS`, {
          fontFamily: 'Impact, "Arial Black", sans-serif',
          fontSize: '13px',
          color: this.hex(palette.accent),
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
    const currentSuit = useGameStore.getState().currentSuit as Suit | null
    const playableCards = new Set(getPlayableCards(hand, currentSuit).map(c => c.id))

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
      sprite.setPlayable(playableCards.has(card.id))

      // SEAM (ticket 14): click / drag-up reports intent; state change is owned
      // by the orchestration layer, which then re-renders us from the store.
      sprite.onCardClick = () => this.requestPlay(card)
      sprite.onCardDragPlay = () => this.requestPlay(card)

      this.handSprites.push(sprite)
      layer.add(sprite)
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
        if (state.players !== prev.players) {
          this.renderOpponents()
          this.updateHud()
        }
        if (state.playedCards !== prev.playedCards) {
          this.renderPile()
        }
        if (state.players !== prev.players || state.currentSuit !== prev.currentSuit) {
          this.renderHand()
        }
      })
    )
    this.unsubscribers.push(
      usePlayerStore.subscribe((state, prev) => {
        if (state.hand !== prev.hand) {
          this.renderHand()
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
