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
// Variant B hand fan (pixel-exact port of the prototype `fanPos` + `layoutHand`)
// ---------------------------------------------------------------------------

/**
 * Configuration for the Variant B bottom hand fan. Mirrors the prototype's
 * `layoutHand` cfg B (`{ spread: 28, radius: 360 }`) plus the fixed anchor
 * (`left:50%; bottom:20px`) and the card's `transform-origin: bottom center`.
 */
export interface VariantBHandConfig {
  /** Horizontal center of the fan (canvas center). */
  centerX: number
  /** `y` of each card's BOTTOM edge before the arc dip (prototype `bottom:20px`). */
  baseY: number
  /** Total angular spread (degrees) across the whole fan. */
  spreadDeg: number
  /** Arc radius controlling horizontal spread + dip (`x = t*radius`). */
  radius: number
  /** Half the card's rendered height, used to project bottom-center -> card center. */
  halfCardHeight: number
}

/** Vertical arc-dip factor from the prototype (`y = |t| * radius * 0.18`). */
const VARIANT_B_DIP_FACTOR = 0.18

/**
 * Card CENTER placements for the Variant B hand, a faithful port of the
 * prototype's `fanPos(i,n,28,360)` + the `translateX(-50%) translateX(x)
 * translateY(-y) rotate(angle)` transform applied about each card's
 * bottom-center origin. Returns each card's center point and z-rotation.
 */
export function handFanPositionsVariantB(count: number, cfg: VariantBHandConfig): CardPlacement[] {
  const placements: CardPlacement[] = []
  for (let i = 0; i < count; i++) {
    const t = fanSlot(i, count)
    const angleDeg = t * cfg.spreadDeg
    const rad = degToRad(angleDeg)
    // Bottom-center anchor: outer cards shift out (x) and lift (dip) like the DOM.
    const bcx = cfg.centerX + t * cfg.radius
    const bcy = cfg.baseY - Math.abs(t) * cfg.radius * VARIANT_B_DIP_FACTOR
    // Project the bottom-center point up to the card center through the rotation.
    placements.push({
      x: bcx + cfg.halfCardHeight * Math.sin(rad),
      y: bcy - cfg.halfCardHeight * Math.cos(rad),
      rotationDeg: angleDeg,
    })
  }
  return placements
}

// ---------------------------------------------------------------------------
// Variant B side rails (opponents down the left + right edges, not the top)
// ---------------------------------------------------------------------------

/** Geometry of the Variant B side rails (prototype `.b-rail`). */
export interface SideRailConfig {
  /** Center X of the left rail (prototype `left:30`, rail width 190 => 125). */
  leftX: number
  /** Center X of the right rail (prototype `right:30` => 1155). */
  rightX: number
  /** Top Y of the rail span (prototype `top:60`). */
  topY: number
  /** Bottom Y of the rail span (prototype `bottom:190` => 720-190 = 530). */
  bottomY: number
}

/** The default Variant B rail geometry on the 1280x720 canvas. */
export const VARIANT_B_RAILS: SideRailConfig = {
  leftX: 125,
  rightX: 1155,
  topY: 60,
  bottomY: 530,
}

/**
 * Seat CENTER points for `count` opponents distributed across the two side rails,
 * matching the prototype (opponent index 1 goes to the RIGHT rail, all others to
 * the LEFT), each rail spacing its boxes `space-around` down its vertical span.
 * Returns one point per opponent index.
 */
export function sideRailSeatPositions(
  count: number,
  cfg: SideRailConfig = VARIANT_B_RAILS
): Vec2[] {
  if (count <= 0) return []
  const leftIdx: number[] = []
  const rightIdx: number[] = []
  for (let i = 0; i < count; i++) {
    if (i === 1) rightIdx.push(i)
    else leftIdx.push(i)
  }
  const seats: Vec2[] = new Array(count)
  const span = cfg.bottomY - cfg.topY
  const place = (indices: number[], x: number) => {
    const m = indices.length
    indices.forEach((idx, k) => {
      // space-around: each item centered in its equal slice of the rail span.
      const y = cfg.topY + (span * (k + 0.5)) / m
      seats[idx] = { x, y }
    })
  }
  place(leftIdx, cfg.leftX)
  place(rightIdx, cfg.rightX)
  return seats
}

// ---------------------------------------------------------------------------
// opponent card-back mini fans
// ---------------------------------------------------------------------------

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
// countdown timer (remaining-time fraction + arc math)
// ---------------------------------------------------------------------------

/**
 * Remaining-time fraction in [0, 1]. A full timer is `1`; an expired or invalid
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
