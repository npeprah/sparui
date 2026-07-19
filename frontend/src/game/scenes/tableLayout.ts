/**
 * Pure, framework-free layout math for the EK table scene (ticket 13).
 *
 * The new table scene (`TableScene`) is a thin Phaser composition; all of its
 * geometry - the bottom hand fan, opponent seats across the top, the central
 * play pile stack, and the countdown ring around the drop zone - is computed
 * by the pure functions in this module so the math can be unit-tested without a
 * Phaser/canvas runtime.
 *
 * Coordinate system: Phaser screen space. Origin is top-left, `x` grows right,
 * `y` grows DOWN. The design canvas is {@link TABLE} (1280x720).
 *
 * Visual targets are the agreed EK prototype
 * (`.scratch/spar-ek-playable/prototypes/06-ek-table/index.html`, "A's layout,
 * B's chrome, C's ring").
 */

/** A 2D point in table (screen) space. */
export interface Vec2 {
  x: number
  y: number
}

/** Placement of a single card: position plus its z-rotation in degrees. */
export interface CardPlacement {
  x: number
  y: number
  /** Clockwise rotation in degrees (screen space). */
  rotationDeg: number
}

/** Fixed design-canvas dimensions and derived center. */
export interface TableDimensions {
  width: number
  height: number
  centerX: number
  centerY: number
}

/** The design canvas (matches `gameConfig` width/height). */
export const TABLE: TableDimensions = {
  width: 1280,
  height: 720,
  centerX: 640,
  centerY: 360,
}

// ---------------------------------------------------------------------------
// small math helpers
// ---------------------------------------------------------------------------

/** Clamp a value to the inclusive [0, 1] range. */
export function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/** Degrees -> radians. */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Normalised fan slot for card `i` of `n`, in the range [-0.5, 0.5].
 * The center of the fan is 0; a single card (or fewer) sits at the center.
 */
export function fanSlot(i: number, n: number): number {
  if (n <= 1) return 0
  return i / (n - 1) - 0.5
}

// ---------------------------------------------------------------------------
// bottom hand fan (A-layout: wide arc along the bottom)
// ---------------------------------------------------------------------------

/** Configuration for the local player's bottom hand fan. */
export interface HandFanConfig {
  /** Horizontal center of the fan. */
  centerX: number
  /** `y` of the peak (center) card - the highest point of the arc. */
  baseY: number
  /** Arc radius: larger = flatter, wider fan. */
  radius: number
  /** Total angular spread (degrees) across the whole fan. */
  spreadDeg: number
}

/**
 * Positions for the local player's hand, fanned along an upward arc at the
 * bottom of the table. Cards sit on a circle of radius `radius` whose center is
 * `radius` below `baseY`, so the middle card peaks at `baseY` and the outer
 * cards drop away and rotate outward - the classic held-hand fan.
 */
export function handFanPositions(count: number, cfg: HandFanConfig): CardPlacement[] {
  const placements: CardPlacement[] = []
  const pivotY = cfg.baseY + cfg.radius
  for (let i = 0; i < count; i++) {
    const t = fanSlot(i, count)
    const angleDeg = t * cfg.spreadDeg
    const rad = degToRad(angleDeg)
    placements.push({
      x: cfg.centerX + cfg.radius * Math.sin(rad),
      y: pivotY - cfg.radius * Math.cos(rad),
      rotationDeg: angleDeg,
    })
  }
  return placements
}

// ---------------------------------------------------------------------------
// opponent seats across the top + their card-back mini fans
// ---------------------------------------------------------------------------

/** Configuration for the row of opponent seats across the top. */
export interface SeatRowConfig {
  /** Horizontal center the row is balanced around. */
  centerX: number
  /** `y` of each seat's anchor. */
  topY: number
  /** Width reserved per seat. */
  seatWidth: number
  /** Horizontal gap between adjacent seats. */
  gap: number
}

/**
 * Seat anchor points for `count` opponents, evenly distributed and centered
 * horizontally across the top of the table.
 */
export function opponentSeatPositions(count: number, cfg: SeatRowConfig): Vec2[] {
  if (count <= 0) return []
  const totalWidth = count * cfg.seatWidth + (count - 1) * cfg.gap
  const startX = cfg.centerX - totalWidth / 2 + cfg.seatWidth / 2
  const seats: Vec2[] = []
  for (let i = 0; i < count; i++) {
    seats.push({ x: startX + i * (cfg.seatWidth + cfg.gap), y: cfg.topY })
  }
  return seats
}

/** Configuration for an opponent's card-back mini fan (opens downward). */
export interface OpponentFanConfig {
  /** Cap on how many card-backs are drawn regardless of hand size. */
  maxVisible: number
  /** Total angular spread (degrees) across the mini fan. */
  spreadDeg: number
  /** Horizontal spacing between the outermost cards (peak-to-peak). */
  spacing: number
  /** Vertical drop of the outer cards relative to the center card. */
  drop: number
}

/**
 * Number of card-backs actually drawn for an opponent, given the real hand size
 * and the visible cap. Never negative.
 */
export function visibleOpponentCards(cardCount: number, maxVisible: number): number {
  if (cardCount <= 0) return 0
  return Math.min(cardCount, Math.max(0, maxVisible))
}

/**
 * Placements (relative to the seat anchor) for an opponent's card-back fan.
 * The fan opens downward: the center card sits highest and outer cards drop and
 * rotate outward. Returns at most `cfg.maxVisible` placements.
 */
export function opponentFanOffsets(cardCount: number, cfg: OpponentFanConfig): CardPlacement[] {
  const n = visibleOpponentCards(cardCount, cfg.maxVisible)
  const placements: CardPlacement[] = []
  for (let i = 0; i < n; i++) {
    const t = fanSlot(i, n)
    placements.push({
      x: t * cfg.spacing,
      y: Math.abs(t) * cfg.drop,
      rotationDeg: t * cfg.spreadDeg,
    })
  }
  return placements
}

// ---------------------------------------------------------------------------
// central play pile (bouncy-overshoot landing target + settled stack)
// ---------------------------------------------------------------------------

/** Configuration for the central play-pile stack. */
export interface PileConfig {
  /** Pile center X. */
  centerX: number
  /** Pile center Y. */
  centerY: number
  /** Max +/- position jitter (px) applied to each settled card. */
  positionJitter: number
  /** Max +/- rotation jitter (degrees) applied to each settled card. */
  rotationJitterDeg: number
}

/**
 * Deterministic pseudo-random value in [0, 1) for a given integer seed. Used so
 * the pile's "scattered" look is stable per card index (repeatable renders and
 * unit-testable), instead of `Math.random`.
 */
export function pileJitter01(seed: number): number {
  const x = Math.sin(seed * 127.1 + 0.5) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Placement for the card at `index` in the settled pile stack. The scatter is
 * deterministic in `index`, so the same card always lands the same way.
 */
export function pileCardPlacement(index: number, cfg: PileConfig): CardPlacement {
  const jx = pileJitter01(index * 2 + 1) * 2 - 1
  const jy = pileJitter01(index * 2 + 7) * 2 - 1
  const jr = pileJitter01(index * 3 + 3) * 2 - 1
  return {
    x: cfg.centerX + jx * cfg.positionJitter,
    y: cfg.centerY + jy * cfg.positionJitter,
    rotationDeg: jr * cfg.rotationJitterDeg,
  }
}

/** Placements for a settled pile of `count` cards (index 0 at the bottom). */
export function pileStackPositions(count: number, cfg: PileConfig): CardPlacement[] {
  const placements: CardPlacement[] = []
  for (let i = 0; i < count; i++) {
    placements.push(pileCardPlacement(i, cfg))
  }
  return placements
}

// ---------------------------------------------------------------------------
// countdown timer ring (C: circular ring wrapping the drop zone)
// ---------------------------------------------------------------------------

/** Below this remaining fraction the ring switches to its danger colour. */
export const RING_DANGER_THRESHOLD = 0.3

/** Ring sweeps clockwise from 12 o'clock (top). */
export const RING_START_ANGLE_RAD = -Math.PI / 2

/**
 * Remaining-time fraction in [0, 1]. A full ring is `1`; an expired or invalid
 * timer is `0`. `total <= 0` (or non-finite inputs) yields `0`.
 */
export function timerProgress(remaining: number, total: number): number {
  if (!Number.isFinite(remaining) || !Number.isFinite(total) || total <= 0) {
    return 0
  }
  return clamp01(remaining / total)
}

/** Sweep angle (radians) of the remaining-time arc for a given progress. */
export function ringSweepRadians(progress: number): number {
  return clamp01(progress) * Math.PI * 2
}

/**
 * End angle (radians) of the remaining-time arc, sweeping clockwise from
 * `startAngle` (default: 12 o'clock). Feed `startAngle` and this into a Phaser
 * arc to draw the countdown.
 */
export function ringEndAngle(progress: number, startAngle: number = RING_START_ANGLE_RAD): number {
  return startAngle + ringSweepRadians(progress)
}

/** Circumference of the ring for a given radius (for stroke-dash approaches). */
export function ringCircumference(radius: number): number {
  return 2 * Math.PI * radius
}

/**
 * Stroke dash offset for the remaining-time arc (SVG-style), i.e. the hidden
 * portion of the ring. Mirrors the prototype's `CIRC * (1 - remaining)`.
 */
export function ringDashOffset(progress: number, circumference: number): number {
  return circumference * (1 - clamp01(progress))
}

/** True when the remaining fraction is in the danger band (< threshold). */
export function isRingDanger(progress: number): boolean {
  return clamp01(progress) < RING_DANGER_THRESHOLD
}
