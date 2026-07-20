import Phaser from 'phaser'
import type { Card, Suit } from '../../store/types'
import { useGameStore } from '../../store/gameStore'
import { usePlayerStore } from '../../store/playerStore'
import { useUIStore } from '../../store/uiStore'
import { AudioManager, type SoundKey } from '../../services/audioManager'
import { CardSprite } from '../sprites/CardSprite'
import { ParticleEffects } from '../systems/ParticleEffects'
import { CardStateOverlayDriver } from '../overlays/CardStateOverlayDriver'
import type { OverlayStateSlice, DryZoneConfig } from '../overlays/overlayDecisions'
import { getPlayableCards } from '../utils/sparRules'
import { TableGameController } from '../orchestration/TableGameController'
import { CARD_BACK_KEY, getCardAssetKey } from '../constants/cards'
import { CARD_TEXTURE_HEIGHT } from '../utils/cardFace'
import { type EKBorderTreatment } from '../constants/cardTheme'
import { DEFAULT_CALLOUT_STYLE, type CalloutStyle, type CalloutSize } from '../config/callouts'
import { getBackdropSpec, type BackdropSpec } from './tableBackdrop'
import {
  TABLE,
  opponentFanOffsets,
  pileCardPlacement,
  timerProgress,
  handFanPositionsVariantB,
  sideRailSeatPositions,
  type CardPlacement,
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
  // Horizontal countdown timer BAR (Variant B), above the hand. The server-streamed
  // timer drives its fill width; there is no circular ring in Variant B.
  private timerBarFill?: Phaser.GameObjects.Graphics
  private bannerContainer?: Phaser.GameObjects.Container
  private bannerBg?: Phaser.GameObjects.Graphics
  private bannerText?: Phaser.GameObjects.Text
  private scoreText?: Phaser.GameObjects.Text
  /** Second HUD line: the fire-streak count, drawn in crimson (prototype `.fire`). */
  private streakText?: Phaser.GameObjects.Text

  // --- live sprites -------------------------------------------------------
  private handSprites: CardSprite[] = []
  private pileSprites = new Map<string, CardSprite>()

  // --- active theme treatment (pinned to comic for Variant B) -------------
  private treatment: EKBorderTreatment = 'comic'

  // --- Variant B card sizing (prototype: 92x130 hand cards, 40x56 backs) ---
  /** Face texture is 512x724 (ticket 19); 92/512 -> the prototype's 92x130 card. */
  private readonly HAND_SCALE = 0.18
  /** Pile cards render at the same full size as hand cards in Variant B. */
  private readonly PILE_SCALE = 0.18
  /** Opponent card-backs render small (~40px) inside the rail boxes. */
  private readonly OPP_BACK_SCALE = 0.078

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
    // Ticket 19: the table is a pixel-exact duplicate of prototype Variant B
    // (Comic Panel). The look is pinned to `comic` regardless of the user's
    // palette selection - the whole scene chrome and every card render Variant B.
    this.treatment = 'comic'

    this.buildBackground()
    this.buildChrome()
    this.buildTimerBar()
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
    this.updateTimerBar()
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
    const palette = this.chromePalette()
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
        this.bakeBackdropTexture(ctx, spec, palette)
        canvasTex.refresh()
      }
    }

    if (this.textures.exists(key)) {
      this.add.image(TABLE.centerX, TABLE.centerY, key).setDepth(-1000)
    } else {
      // Headless / unit fallback: flat gradient wash from the palette.
      const g = this.add.graphics().setDepth(-1000)
      g.fillGradientStyle(palette.bgTop, palette.bgTop, palette.bgBottom, palette.bgBottom, 1)
      g.fillRect(0, 0, TABLE.width, TABLE.height)
    }
  }

  /**
   * Bake the comic overlay texture (Ben-Day halftone dots or neon scanline grid)
   * straight onto the cached backdrop canvas, over the gradient. Same dot-grid
   * spacing / alpha and per-palette treatment as the prototype - drawn once into
   * the static backdrop image instead of a retained per-frame Graphics.
   */
  private bakeBackdropTexture(
    ctx: CanvasRenderingContext2D,
    spec: BackdropSpec,
    palette: { ink: number }
  ): void {
    const ink = this.hex(palette.ink)
    if (spec.texture === 'scanlines') {
      ctx.save()
      ctx.strokeStyle = ink
      ctx.globalAlpha = 0.06
      ctx.lineWidth = 2
      for (let y = 0; y < TABLE.height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(TABLE.width, y)
        ctx.stroke()
      }
      for (let x = 0; x < TABLE.width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, TABLE.height)
        ctx.stroke()
      }
      ctx.restore()
    } else {
      // Dense Ben-Day dots (prototype B: 2px dots on a 14px grid, rgba(0,0,0,.14)).
      ctx.save()
      ctx.fillStyle = ink
      ctx.globalAlpha = 0.14
      const step = 14
      for (let y = 0; y < TABLE.height; y += step) {
        for (let x = 0; x < TABLE.width; x += step) {
          ctx.beginPath()
          ctx.arc(x, y, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()
    }
  }

  private buildChrome(): void {
    const palette = this.chromePalette()
    this.chromeLayer = this.add.container(0, 0).setDepth(40)

    // The Ben-Day halftone comic texture is baked once into the cached backdrop
    // canvas (see bakeBackdropTexture) rather than drawn per-frame, so the whole
    // backdrop is a single static image.

    // Comic-panel double frame, inset 14px from the canvas edge. The prototype
    // draws `border:6px ink` with `inset 0 0 0 4px #fff, inset 0 0 0 10px ink`,
    // which reads, from the outer edge inward, as: 6px ink, 4px white, 6px ink.
    // Phaser strokes are centred on the path, so each band's path sits at the
    // middle of its width.
    const frame = this.add.graphics()
    const inset = 14
    const drawBand = (outer: number, width: number, color: number) => {
      const p = outer + width / 2
      frame.lineStyle(width, color, 1)
      frame.strokeRect(p, p, TABLE.width - p * 2, TABLE.height - p * 2)
    }
    drawBand(inset, 6, palette.ink) // outer ink border
    drawBand(inset + 6, 4, palette.pop) // white pop gap
    drawBand(inset + 10, 6, palette.ink) // inner ink line
    this.chromeLayer.add(frame)

    // "THE PILE!" label: a white box with a 3px ink border, Impact, rotated -3deg,
    // sitting just above the offset drop zone (prototype `.pilelabel`).
    const pile = this.pileConfig()
    // Ticket 19 delta 4: two stacked lines ("THE" / "PILE!") in a slightly larger
    // Impact box, matching the prototype `.pilelabel`. The white box hugs the text
    // with the prototype's 2px/12px padding so it grows with the bigger type.
    const labelText = this.add
      .text(0, 0, 'THE\nPILE!', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '26px',
        color: this.hex(palette.ink),
        align: 'center',
        lineSpacing: 3,
      })
      .setOrigin(0.5)
    const lw = Math.ceil(labelText.width) + 24
    const lh = Math.ceil(labelText.height) + 12
    const labelBox = this.add.graphics()
    labelBox.fillStyle(palette.pop, 1)
    labelBox.fillRect(-lw / 2, -lh / 2, lw, lh)
    labelBox.lineStyle(3, palette.ink, 1)
    labelBox.strokeRect(-lw / 2, -lh / 2, lw, lh)
    const label = this.add
      .container(pile.centerX, pile.centerY - 138, [labelBox, labelText])
      .setAngle(-3)
      .setDepth(45)
    this.chromeLayer.add(label)
  }

  // =========================================================================
  // countdown timer BAR (Variant B) - horizontal gradient bar above the hand
  // =========================================================================

  /**
   * Geometry of the timer bar (prototype `#timer-generic`: width 260, height 16).
   * Ticket 19 delta 2: the bar is floated ~30px higher than the prototype's tight
   * `bottom:150` so it clears the top edge of the hand fan with a visible gap and
   * never crosses the middle cards' rank/pip.
   */
  private timerBarGeom(): { x: number; y: number; width: number; height: number } {
    return { x: TABLE.centerX, y: TABLE.height - 190, width: 260, height: 16 }
  }

  private buildTimerBar(): void {
    const palette = this.chromePalette()
    const geom = this.timerBarGeom()
    // Prototype DOM-orders `#timer-generic` AFTER `#hand`, so the bar draws ON TOP
    // of the hand fan - depth above the hand (300) but below banners/POW.
    const layer = this.add.container(0, 0).setDepth(520)

    // Label above the bar (Impact, ink, letter-spacing). The prototype's ⏱ glyph
    // is dropped - a colour-emoji does not render in the canvas text pipeline.
    const label = this.add
      .text(geom.x, geom.y - 18, 'TICK TICK...', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '12px',
        color: this.hex(palette.ink),
      })
      .setOrigin(0.5)
      .setLetterSpacing(2)

    // Track: dark translucent well with a 3px ink border (pill).
    const track = this.add.graphics()
    const left = geom.x - geom.width / 2
    const top = geom.y - geom.height / 2
    const r = geom.height / 2
    track.fillStyle(0x000000, 0.25)
    track.fillRoundedRect(left, top, geom.width, geom.height, r)
    track.lineStyle(3, palette.ink, 1)
    track.strokeRoundedRect(left, top, geom.width, geom.height, r)

    // Fill: green -> yellow -> red gradient, redrawn each frame to the remaining %.
    this.timerBarFill = this.add.graphics()

    layer.add([track, this.timerBarFill, label])
    this.updateTimerBar()
  }

  /**
   * SEAM (ticket 14): the orchestration layer sets the authoritative turn total
   * from the server timer (turnChanged / timerUpdate.turnDurationSeconds), so the
   * bar fills against the real per-seat budget (leader 15s / follower 8s /
   * subsequent 5s) instead of the largest value observed.
   */
  public setTurnTotal(seconds: number): void {
    if (seconds > 0) {
      this.ringTotalSeconds = seconds
      this.ringTotalAuthoritative = true
    }
  }

  private updateTimerBar(): void {
    const g = this.timerBarFill
    if (!g) return

    const remaining = useGameStore.getState().timeRemaining
    // Fall back to the max-observed heuristic only until the server total lands.
    if (!this.ringTotalAuthoritative && remaining > this.ringTotalSeconds) {
      this.ringTotalSeconds = remaining
    }
    const progress = timerProgress(remaining, this.ringTotalSeconds)

    const geom = this.timerBarGeom()
    const left = geom.x - geom.width / 2
    const top = geom.y - geom.height / 2
    const fillW = Math.max(0, geom.width * progress)

    g.clear()
    if (fillW <= 0) return
    // Horizontal green -> yellow -> red gradient, sampled in vertical slices so
    // the bar reads the same left-to-right regardless of how much remains.
    const stops: Array<[number, [number, number, number]]> = [
      [0, [0x37, 0xe0, 0x7a]],
      [0.5, [0xff, 0xd7, 0x00]],
      [1, [0xe4, 0x00, 0x2b]],
    ]
    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)
    const sample = (t: number): number => {
      let lo = stops[0]
      let hi = stops[stops.length - 1]
      for (let i = 0; i < stops.length - 1; i++) {
        if (t >= stops[i][0] && t <= stops[i + 1][0]) {
          lo = stops[i]
          hi = stops[i + 1]
          break
        }
      }
      const span = hi[0] - lo[0] || 1
      const k = (t - lo[0]) / span
      return (
        (lerp(lo[1][0], hi[1][0], k) << 16) |
        (lerp(lo[1][1], hi[1][1], k) << 8) |
        lerp(lo[1][2], hi[1][2], k)
      )
    }
    const slice = 6
    for (let x = 0; x < fillW; x += slice) {
      const t = geom.width <= slice ? 0 : x / geom.width
      const w = Math.min(slice, fillW - x)
      g.fillStyle(sample(t), 1)
      g.fillRect(left + x, top, w, geom.height)
    }
  }

  // =========================================================================
  // callout banner slot (B chrome) - SEAM for ticket 15 (data-driven callouts)
  // =========================================================================

  private buildBanner(): void {
    // Prototype `#banner` anchor: left:50%, top:42% -> (640, 302).
    this.bannerContainer = this.add.container(TABLE.centerX, TABLE.height * 0.42).setDepth(900)
    this.bannerContainer.setScale(0)
    this.bannerContainer.setAlpha(0)

    // The speech bubble (bg + border + tail) is (re)sized per callout in
    // showCallout, since it hugs the text.
    this.bannerBg = this.add.graphics()

    this.bannerText = this.add
      .text(0, 0, '', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: this.calloutFontSize('big'),
      })
      .setOrigin(0.5)

    this.bannerContainer.add([this.bannerBg, this.bannerText])
  }

  /** Banner font size per callout emphasis (prototype variant-B `.msg` ~60px). */
  private calloutFontSize(size: CalloutSize): string {
    switch (size) {
      case 'huge':
        return '60px'
      case 'normal':
        return '44px'
      case 'big':
      default:
        return '52px'
    }
  }

  /**
   * Repaint the Variant B speech bubble to hug the given text: comic-yellow fill,
   * 8px ink border, 12/12 ink offset shadow, and a triangle tail bottom-left
   * (prototype `body[data-variant="B"] #banner .msg` + its `::before`).
   */
  private paintBanner(): void {
    const palette = this.chromePalette()
    if (!this.bannerBg || !this.bannerText) return

    // Size the bubble to the text plus the prototype's 26/54 padding.
    const padX = 54
    const padY = 26
    const w = Math.ceil(this.bannerText.width) + padX * 2
    const h = Math.ceil(this.bannerText.height) + padY * 2
    const left = -w / 2
    const top = -h / 2

    const g = this.bannerBg
    g.clear()
    // Chunky ink offset shadow (12/12).
    g.fillStyle(palette.ink, 1)
    g.fillRoundedRect(left + 12, top + 12, w, h, 8)
    // Comic-yellow bubble body with an 8px ink border.
    g.fillStyle(palette.accent, 1)
    g.fillRoundedRect(left, top, w, h, 8)
    g.lineStyle(8, palette.ink, 1)
    g.strokeRoundedRect(left, top, w, h, 8)
    // Tail: an ink triangle hanging off the bottom-left (prototype `::before`).
    const tailX = left + 40
    const tailW = 36
    const tailDrop = 34
    g.fillStyle(palette.ink, 1)
    g.fillTriangle(tailX, top + h - 2, tailX + tailW, top + h - 2, tailX, top + h + tailDrop)

    this.bannerText.setColor(this.hex(palette.ink))
  }

  /**
   * Pop the Variant B comic banner. Words + emphasis come from the authored
   * callout config; the bubble always renders as the pop-art speech bubble
   * (`bannerpop` overshoot -> hold -> shrink-out).
   */
  public showCallout(text: string, style: CalloutStyle = DEFAULT_CALLOUT_STYLE): void {
    const banner = this.bannerContainer
    if (!banner || !this.bannerText) return
    this.bannerText.setFontSize(this.calloutFontSize(style.size))
    this.bannerText.setText(text.toUpperCase())
    this.bannerText.setLetterSpacing(2)
    this.paintBanner()
    this.tweens.killTweensOf(banner)
    // bannerpop: scale 0 rotate(-12) -> scale 1 rotate(-4) with a strong overshoot.
    banner.setScale(0).setAlpha(1).setAngle(-12)
    this.tweens.add({
      targets: banner,
      scale: 1,
      angle: -4,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: banner,
          scale: 0.6,
          alpha: 0,
          delay: 900,
          duration: 300,
          ease: 'Cubic.easeIn',
        })
      },
    })
  }

  /**
   * Confetti burst (prototype `confetti`): colourful chips fly out from the pile
   * center and fall away. Fired on a round win.
   */
  public burstConfetti(): void {
    const colors = [0xe4002b, 0xffd700, 0x37e07a, 0x00bfff, 0x8b00ff]
    const originX = TABLE.centerX
    const originY = TABLE.height * 0.4
    for (let i = 0; i < 40; i++) {
      const chip = this.add.rectangle(originX, originY, 12, 12, colors[i % colors.length])
      chip.setDepth(830)
      chip.setAngle(Math.random() * 360)
      const ang = Math.random() * Math.PI * 2
      const dist = 120 + Math.random() * 260
      this.tweens.add({
        targets: chip,
        x: originX + Math.cos(ang) * dist,
        y: originY + Math.sin(ang) * dist + 300,
        angle: Math.random() * 720,
        alpha: 0,
        duration: 1100 + Math.random() * 500,
        ease: 'Cubic.easeIn',
        onComplete: () => chip.destroy(),
      })
    }
  }

  /**
   * Rising fire sparks (prototype `fireSparks`): glowing embers rise off the pile.
   * Fired when a player lights a fire streak.
   */
  public burstFireSparks(): void {
    const colors = [0xff3d00, 0xff8a00, 0xffd700]
    const originX = TABLE.centerX
    const originY = TABLE.height * 0.4
    for (let i = 0; i < 30; i++) {
      const spark = this.add.circle(originX, originY, 6, colors[i % colors.length])
      spark.setDepth(830)
      const dx = (Math.random() * 2 - 1) * 120
      const dy = -100 - Math.random() * 180
      this.tweens.add({
        targets: spark,
        x: originX + dx,
        y: originY + dy,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      })
    }
  }

  /**
   * FLAG beat (prototype `beatFlag`): an opponent's card-backs flip (scaleX -> 0)
   * to revealed faces with a per-card stagger. The rail is rebuilt back to backs
   * shortly after (renderOpponents runs on the next opponents change anyway).
   */
  public flagReveal(): void {
    const layer = this.opponentLayer
    if (!layer) return
    const reveal: Array<[Suit, string]> = [
      ['diamonds', '6'],
      ['spades', '7'],
      ['clubs', '6'],
      ['hearts', '8'],
      ['diamonds', 'K'],
    ]
    let flipped = false
    for (const child of layer.getAll()) {
      const group = child as Phaser.GameObjects.Container
      if (!group.getAll) continue
      const backs = group
        .getAll()
        .filter(
          (o): o is Phaser.GameObjects.Image =>
            o instanceof Phaser.GameObjects.Image && o.texture.key === CARD_BACK_KEY
        )
      backs.forEach((back, i) => {
        flipped = true
        const [suit, rank] = reveal[i % reveal.length]
        this.tweens.add({
          targets: back,
          scaleX: 0,
          duration: 150,
          delay: i * 90,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            back.setTexture(getCardAssetKey(suit, rank as never))
            this.tweens.add({
              targets: back,
              scaleX: this.OPP_BACK_SCALE,
              duration: 150,
              ease: 'Back.easeOut',
            })
          },
        })
      })
    }
    // Restore the real backs after the reveal beat.
    if (flipped) {
      this.time.delayedCall(2600, () => this.renderOpponents())
    }
  }

  // =========================================================================
  // HUD (score + streak + you-badge)
  // =========================================================================

  /** Score box geometry (prototype `#hud-score`: bottom:14, right:40). */
  private readonly SCORE_BOX = { right: TABLE.width - 40, bottom: TABLE.height - 14, w: 130, h: 58 }

  private buildHud(): void {
    const palette = this.chromePalette()
    this.hudLayer = this.add.container(0, 0).setDepth(500)

    // YOU badge (prototype `.you-badge`): ink box, yellow Impact text, rotated -3.
    const youBadge = this.add
      .text(66, TABLE.height - 24, 'YOU', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '20px',
        color: this.hex(palette.accent),
        backgroundColor: this.hex(palette.ink),
        padding: { x: 16, y: 6 },
      })
      .setOrigin(0.5)
      .setLetterSpacing(2)
      .setAngle(-3)

    // Score box (prototype `#hud-score`): white box, 5px ink border, 6/6 ink shadow.
    const box = this.SCORE_BOX
    const left = box.right - box.w
    const top = box.bottom - box.h
    const g = this.add.graphics()
    g.fillStyle(palette.ink, 1)
    g.fillRoundedRect(left + 6, top + 6, box.w, box.h, 4)
    g.fillStyle(palette.pop, 1)
    g.fillRoundedRect(left, top, box.w, box.h, 4)
    g.lineStyle(5, palette.ink, 1)
    g.strokeRoundedRect(left, top, box.w, box.h, 4)

    // Line 1: "YOU n | THEM n" in ink. Line 2: "STREAK n/4" in crimson (the
    // prototype's `.fire` line); the 🔥 emoji is dropped as it cannot render in
    // the canvas text pipeline.
    this.scoreText = this.add
      .text(box.right - 14, top + box.h * 0.34, '', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '16px',
        color: this.hex(palette.ink),
        align: 'right',
      })
      .setOrigin(1, 0.5)
      .setLetterSpacing(1)

    this.streakText = this.add
      .text(box.right - 14, top + box.h * 0.7, '', {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '13px',
        color: this.hex(palette.danger),
        align: 'right',
      })
      .setOrigin(1, 0.5)
      .setLetterSpacing(1)

    this.hudLayer.add([g, this.scoreText, this.streakText, youBadge])
    this.updateHud()
  }

  private updateHud(): void {
    if (!this.scoreText || !this.streakText) return
    const { players } = useGameStore.getState()
    const localId = usePlayerStore.getState().playerId
    const me = players.find(p => p.id === localId)
    const myScore = me?.score ?? 0
    const streak = me?.winStreak ?? 0
    const opponentTop = players
      .filter(p => p.id !== localId)
      .reduce((m, p) => Math.max(m, p.score), 0)
    this.scoreText.setText(`YOU ${myScore}  |  THEM ${opponentTop}`)
    this.streakText.setText(`STREAK ${streak}/4`)
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
    const seats = sideRailSeatPositions(opponents.length)
    const fanCfg = this.opponentFanConfig()
    const onDeckId = useGameStore.getState().onDeckPlayerId

    // Prototype `.b-opp` box: white bg (pink when active), 5px ink border, 8px
    // radius, 150 wide, with a 6px/6px ink offset shadow.
    const BOX_W = 150
    const BOX_H = 128

    opponents.forEach((opp, i) => {
      const seat = seats[i]
      const group = this.add.container(seat.x, seat.y)
      const isOnDeck = opp.id === onDeckId

      const left = -BOX_W / 2
      const top = -BOX_H / 2

      // Chunky ink offset shadow (drawn first, behind the box).
      const shadow = this.add.graphics()
      shadow.fillStyle(palette.ink, 1)
      shadow.fillRoundedRect(left + 6, top + 6, BOX_W, BOX_H, 8)

      // Box body: white, or pink `#ff4d6d` when this opponent is on deck.
      const box = this.add.graphics()
      box.fillStyle(isOnDeck ? 0xff4d6d : palette.pop, 1)
      box.fillRoundedRect(left, top, BOX_W, BOX_H, 8)
      box.lineStyle(5, palette.ink, 1)
      box.strokeRoundedRect(left, top, BOX_W, BOX_H, 8)
      group.add([shadow, box])

      // Name (Impact, uppercase, ink) near the top of the box.
      const name = this.add
        .text(0, top + 18, opp.name.toUpperCase(), {
          fontFamily: 'Impact, "Arial Black", sans-serif',
          fontSize: '18px',
          color: this.hex(palette.ink),
        })
        .setOrigin(0.5)
        .setLetterSpacing(1)
      group.add(name)

      // Card-back mini fan (shrinks as they play - count is their live hand size).
      const cardCount = opp.hand?.length ?? 0
      const offsets = opponentFanOffsets(cardCount, fanCfg)
      const fanY = top + 56
      for (const off of offsets) {
        const back = this.add.image(off.x, fanY + off.y, CARD_BACK_KEY)
        back.setScale(this.OPP_BACK_SCALE)
        back.setAngle(off.rotationDeg)
        group.add(back)
      }

      // Count badge: ink bg / yellow text pill, "♠ N CARDS", near the bottom.
      const badgeY = top + BOX_H - 20
      const countText = `♠ ${cardCount} CARDS`
      const badge = this.add
        .text(0, badgeY, countText, {
          fontFamily: 'Impact, "Arial Black", sans-serif',
          fontSize: '13px',
          color: this.hex(palette.accent),
          backgroundColor: this.hex(palette.ink),
          padding: { x: 8, y: 2 },
        })
        .setOrigin(0.5)
      group.add(badge)

      // Stash the back sprites + seat so a FLAG can flip them to faces.
      group.setData('opponentId', opp.id)
      layer.add(group)
    })
  }

  private renderHand(): void {
    const layer = this.handLayer
    if (!layer) return

    // A full (re)deal is a hand appearing where there was none (initial deal /
    // restart). Incremental changes (a card leaving the hand as it's played)
    // keep sprites and must NOT re-run the deal fly-in.
    const isFreshDeal = this.handSprites.length === 0

    // Rebuild the hand fan from the authoritative local hand.
    for (const sprite of this.handSprites) sprite.destroy()
    this.handSprites = []

    const hand = usePlayerStore.getState().hand
    const hintIds = this.handHintIds()

    const placements = handFanPositionsVariantB(hand.length, this.handConfig())
    hand.forEach((card, i) => {
      const p = placements[i]
      const sprite = new CardSprite(
        this,
        p.x,
        p.y,
        card.suit,
        card.rank,
        usePlayerStore.getState().playerId,
        'comic'
      )
      sprite.setScale(this.HAND_SCALE)
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

    if (isFreshDeal && hand.length > 0) this.dealHandIn(placements)
  }

  /**
   * DEAL beat (prototype `beatDeal`): each card starts on the deck at top-center
   * (offscreen up, spun ~320deg, scaled down, transparent) and springs into its
   * fan slot with a 90ms per-card stagger and an overshoot bounce.
   */
  private dealHandIn(placements: CardPlacement[]): void {
    this.handSprites.forEach((sprite, i) => {
      const rest = placements[i]
      if (!rest) return
      // Pre-position on the deck.
      sprite.setPosition(TABLE.centerX, -140)
      sprite.setAngle(320)
      sprite.setScale(this.HAND_SCALE * 0.5)
      sprite.setAlpha(0)
      this.tweens.add({
        targets: sprite,
        x: rest.x,
        y: rest.y,
        angle: rest.rotationDeg,
        scaleX: this.HAND_SCALE,
        scaleY: this.HAND_SCALE,
        alpha: 1,
        delay: 90 * i,
        duration: 600,
        // --bounce: cubic-bezier(0.34,1.56,0.64,1) -> Back.easeOut overshoot.
        ease: 'Back.easeOut',
        onComplete: () => sprite.updateOriginalY(rest.y),
      })
    })
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
      const from = this.playSourcePosition(playerId)
      const sprite = new CardSprite(this, from.x, from.y, card.suit, card.rank, playerId, 'comic')
      sprite.setScale(this.PILE_SCALE)
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

  /** Where a played card flies FROM: the local hand region, or the player's rail. */
  private playSourcePosition(playerId: string): { x: number; y: number } {
    const localId = usePlayerStore.getState().playerId
    if (playerId === localId) return { x: TABLE.centerX, y: 620 }
    const players = useGameStore.getState().players
    const opponents = players.filter(p => p.id !== localId)
    const idx = opponents.findIndex(p => p.id === playerId)
    if (idx >= 0) {
      const seats = sideRailSeatPositions(opponents.length)
      const seat = seats[idx]
      if (seat) return { x: seat.x, y: seat.y }
    }
    return { x: TABLE.centerX, y: 288 }
  }

  /**
   * PLAY beat (prototype `beatPlay`): the card flies from its source to the pile
   * with a bouncy overshoot and a small random spin, punches to scale 1.06 then
   * settles to 1, and a POW!/BAM!/WHAP! burst pops at the pile.
   */
  private landCardInPile(sprite: CardSprite, placement: CardPlacement): void {
    const spin = placement.rotationDeg
    sprite.setAngle(spin + (spin >= 0 ? 12 : -12))
    this.tweens.add({
      targets: sprite,
      x: placement.x,
      y: placement.y,
      angle: spin,
      scaleX: this.PILE_SCALE * 1.06,
      scaleY: this.PILE_SCALE * 1.06,
      duration: 500,
      // --bounce-hard: cubic-bezier(0.18,1.9,0.5,1) -> a strong overshoot.
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: sprite,
          scaleX: this.PILE_SCALE,
          scaleY: this.PILE_SCALE,
          duration: 180,
          ease: 'Back.easeOut',
        })
        this.showPow(placement.x, placement.y)
      },
    })
  }

  /**
   * POW burst (prototype `.pow` + `powBurst`): a big Impact word in comic yellow
   * with an ink drop shadow, popping above the pile and cycling POW!/BAM!/WHAP!.
   */
  private powWords = ['POW!', 'BAM!', 'WHAP!']
  private powIndex = 0
  public showPow(x: number, y: number): void {
    const palette = this.chromePalette()
    const word = this.powWords[this.powIndex % this.powWords.length]
    this.powIndex++
    const shadow = this.add
      .text(x - 40 + 3, y - 90 + 3, word, {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '54px',
        color: this.hex(palette.ink),
      })
      .setOrigin(0.5)
      .setDepth(849)
    const text = this.add
      .text(x - 40, y - 90, word, {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: '54px',
        color: this.hex(palette.accent),
      })
      .setOrigin(0.5)
      .setDepth(850)
    const group = [shadow, text]
    for (const t of group) {
      t.setScale(0).setAngle(-20).setAlpha(0)
    }
    this.tweens.add({
      targets: group,
      scale: 1.25,
      angle: 6,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: group,
          scale: 1,
          angle: -4,
          alpha: 0,
          duration: 300,
          ease: 'Cubic.easeIn',
          onComplete: () => group.forEach(t => t.destroy()),
        })
      },
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
    // Variant B is pinned to the comic look, so the table never subscribes to
    // theme changes - the chrome and every card stay Variant B regardless of the
    // user's palette selection.
  }

  // =========================================================================
  // layout configs (bind the pure helpers to this scene's canvas)
  // =========================================================================

  private handConfig() {
    // Prototype cfg B: spread 28deg, radius 360, anchored at bottom:20 (card
    // bottom at y=700), projected to card centers via half the rendered height.
    return {
      centerX: TABLE.centerX,
      baseY: 700,
      spreadDeg: 28,
      radius: 360,
      halfCardHeight: (CARD_TEXTURE_HEIGHT * this.HAND_SCALE) / 2,
    }
  }

  private opponentFanConfig(): OpponentFanConfig {
    // Prototype `oppFan`: fanPos(i, n, 40, 60) -> spacing 60, spread 40, small dip.
    return { maxVisible: 5, spreadDeg: 40, spacing: 60, drop: 6 }
  }

  private pileConfig(): PileConfig {
    // Prototype B pile: left:50%, top:40% -> center (640, 288).
    return { centerX: TABLE.centerX, centerY: 288, positionJitter: 10, rotationJitterDeg: 12 }
  }

  // =========================================================================
  // Variant B chrome palette (pop-art yellow / ink black; pinned, not per-theme)
  // =========================================================================

  private chromePalette(): {
    bgTop: number
    bgBottom: number
    ink: number
    pop: number
    accent: number
    danger: number
  } {
    // Prototype Variant B pop-art palette: halftone yellow bg, ink black, comic
    // yellow accent, crimson danger. Pinned - the table never reskins per theme.
    return {
      bgTop: 0xffd400,
      bgBottom: 0xffb700,
      ink: 0x14100c,
      pop: 0xffffff,
      accent: 0xffd400,
      danger: 0xe4002b,
    }
  }

  /** Phaser hex int -> `#rrggbb` string for Text style colours. */
  private hex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`
  }
}
