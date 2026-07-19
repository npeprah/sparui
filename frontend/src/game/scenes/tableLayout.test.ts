import { describe, it, expect } from 'vitest'
import {
  TABLE,
  clamp01,
  degToRad,
  fanSlot,
  handFanPositions,
  opponentSeatPositions,
  visibleOpponentCards,
  opponentFanOffsets,
  pileJitter01,
  pileCardPlacement,
  pileStackPositions,
  timerProgress,
  ringSweepRadians,
  ringEndAngle,
  ringCircumference,
  ringDashOffset,
  isRingDanger,
  RING_START_ANGLE_RAD,
  RING_DANGER_THRESHOLD,
  type HandFanConfig,
  type SeatRowConfig,
  type OpponentFanConfig,
  type PileConfig,
} from './tableLayout'

describe('tableLayout - math helpers', () => {
  it('clamp01 clamps to [0,1]', () => {
    expect(clamp01(-2)).toBe(0)
    expect(clamp01(0.42)).toBe(0.42)
    expect(clamp01(5)).toBe(1)
  })

  it('degToRad converts correctly', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10)
    expect(degToRad(0)).toBe(0)
  })

  it('fanSlot centers a single card and spreads N cards symmetrically', () => {
    expect(fanSlot(0, 1)).toBe(0)
    expect(fanSlot(0, 0)).toBe(0)
    // 5 cards: outer slots are -0.5 and 0.5, middle is 0
    expect(fanSlot(0, 5)).toBeCloseTo(-0.5, 10)
    expect(fanSlot(2, 5)).toBeCloseTo(0, 10)
    expect(fanSlot(4, 5)).toBeCloseTo(0.5, 10)
    // symmetry
    expect(fanSlot(1, 5)).toBeCloseTo(-fanSlot(3, 5), 10)
  })

  it('TABLE center is derived from dimensions', () => {
    expect(TABLE.centerX).toBe(TABLE.width / 2)
    expect(TABLE.centerY).toBe(TABLE.height / 2)
  })
})

describe('tableLayout - hand fan', () => {
  const cfg: HandFanConfig = { centerX: 640, baseY: 600, radius: 900, spreadDeg: 34 }

  it('returns one placement per card', () => {
    expect(handFanPositions(5, cfg)).toHaveLength(5)
    expect(handFanPositions(0, cfg)).toHaveLength(0)
  })

  it('peaks at the center card (highest = smallest y) and drops outward', () => {
    const p = handFanPositions(5, cfg)
    const centerY = p[2].y
    // center card sits at baseY (the arc peak)
    expect(centerY).toBeCloseTo(cfg.baseY, 6)
    // outer cards are lower on screen (larger y)
    expect(p[0].y).toBeGreaterThan(centerY)
    expect(p[4].y).toBeGreaterThan(centerY)
  })

  it('is horizontally symmetric around centerX and fans rotation outward', () => {
    const p = handFanPositions(5, cfg)
    expect(p[2].x).toBeCloseTo(cfg.centerX, 6)
    // mirror pairs
    expect(p[0].x - cfg.centerX).toBeCloseTo(-(p[4].x - cfg.centerX), 6)
    expect(p[0].rotationDeg).toBeCloseTo(-p[4].rotationDeg, 6)
    // spread endpoints span the configured angle
    expect(p[4].rotationDeg - p[0].rotationDeg).toBeCloseTo(cfg.spreadDeg, 6)
    // left card leans left (negative), right card leans right (positive)
    expect(p[0].rotationDeg).toBeLessThan(0)
    expect(p[4].rotationDeg).toBeGreaterThan(0)
  })

  it('single card sits centered, unrotated, at baseY', () => {
    const [only] = handFanPositions(1, cfg)
    expect(only.x).toBeCloseTo(cfg.centerX, 6)
    expect(only.y).toBeCloseTo(cfg.baseY, 6)
    expect(only.rotationDeg).toBe(0)
  })
})

describe('tableLayout - opponent seats', () => {
  const cfg: SeatRowConfig = { centerX: 640, topY: 90, seatWidth: 150, gap: 70 }

  it('returns nothing for no opponents', () => {
    expect(opponentSeatPositions(0, cfg)).toEqual([])
  })

  it('centers a single seat on centerX', () => {
    const [seat] = opponentSeatPositions(1, cfg)
    expect(seat.x).toBe(cfg.centerX)
    expect(seat.y).toBe(cfg.topY)
  })

  it('distributes and centers multiple seats evenly', () => {
    const seats = opponentSeatPositions(3, cfg)
    expect(seats).toHaveLength(3)
    // middle seat centered
    expect(seats[1].x).toBeCloseTo(cfg.centerX, 6)
    // symmetric around center
    expect(seats[0].x - cfg.centerX).toBeCloseTo(-(seats[2].x - cfg.centerX), 6)
    // equal spacing = seatWidth + gap
    expect(seats[1].x - seats[0].x).toBeCloseTo(cfg.seatWidth + cfg.gap, 6)
    expect(seats[2].x - seats[1].x).toBeCloseTo(cfg.seatWidth + cfg.gap, 6)
  })
})

describe('tableLayout - opponent card-back fan', () => {
  const cfg: OpponentFanConfig = { maxVisible: 5, spreadDeg: 40, spacing: 60, drop: 10 }

  it('caps the number of visible cards', () => {
    expect(visibleOpponentCards(9, 5)).toBe(5)
    expect(visibleOpponentCards(3, 5)).toBe(3)
    expect(visibleOpponentCards(0, 5)).toBe(0)
    expect(visibleOpponentCards(-4, 5)).toBe(0)
  })

  it('emits at most maxVisible placements, symmetric around the seat', () => {
    const many = opponentFanOffsets(9, cfg)
    expect(many).toHaveLength(5)
    // symmetric x offsets and rotations
    expect(many[0].x).toBeCloseTo(-many[4].x, 6)
    expect(many[0].rotationDeg).toBeCloseTo(-many[4].rotationDeg, 6)
    // outer cards drop below center (positive y down), center card at 0
    expect(many[2].y).toBeCloseTo(0, 6)
    expect(many[0].y).toBeGreaterThan(0)
  })

  it('handles empty hands', () => {
    expect(opponentFanOffsets(0, cfg)).toEqual([])
  })
})

describe('tableLayout - play pile stack', () => {
  const cfg: PileConfig = {
    centerX: 640,
    centerY: 330,
    positionJitter: 12,
    rotationJitterDeg: 15,
  }

  it('pileJitter01 is deterministic and within [0,1)', () => {
    for (let seed = 0; seed < 20; seed++) {
      const v = pileJitter01(seed)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      expect(pileJitter01(seed)).toBe(v) // stable
    }
  })

  it('keeps each card within the configured jitter bounds of center', () => {
    const p = pileCardPlacement(3, cfg)
    expect(Math.abs(p.x - cfg.centerX)).toBeLessThanOrEqual(cfg.positionJitter)
    expect(Math.abs(p.y - cfg.centerY)).toBeLessThanOrEqual(cfg.positionJitter)
    expect(Math.abs(p.rotationDeg)).toBeLessThanOrEqual(cfg.rotationJitterDeg)
  })

  it('is deterministic per index and returns one placement per card', () => {
    const stack = pileStackPositions(4, cfg)
    expect(stack).toHaveLength(4)
    expect(stack[2]).toEqual(pileCardPlacement(2, cfg))
    // different indices generally scatter to different spots
    expect(stack[0]).not.toEqual(stack[1])
  })
})

describe('tableLayout - countdown ring', () => {
  it('timerProgress is remaining/total, clamped, guarded', () => {
    expect(timerProgress(15, 15)).toBe(1)
    expect(timerProgress(0, 15)).toBe(0)
    expect(timerProgress(7.5, 15)).toBeCloseTo(0.5, 6)
    // guards
    expect(timerProgress(5, 0)).toBe(0)
    expect(timerProgress(5, -1)).toBe(0)
    expect(timerProgress(NaN, 15)).toBe(0)
    expect(timerProgress(20, 15)).toBe(1) // clamp overflow
    expect(timerProgress(-3, 15)).toBe(0)
  })

  it('ringSweepRadians maps full progress to a full circle', () => {
    expect(ringSweepRadians(1)).toBeCloseTo(Math.PI * 2, 6)
    expect(ringSweepRadians(0)).toBe(0)
    expect(ringSweepRadians(0.25)).toBeCloseTo(Math.PI / 2, 6)
  })

  it('ringEndAngle sweeps clockwise from the top by default', () => {
    expect(ringEndAngle(0)).toBeCloseTo(RING_START_ANGLE_RAD, 6)
    expect(ringEndAngle(1)).toBeCloseTo(RING_START_ANGLE_RAD + Math.PI * 2, 6)
    expect(ringEndAngle(0.5, 0)).toBeCloseTo(Math.PI, 6)
  })

  it('ringCircumference and dash offset agree at the extremes', () => {
    const c = ringCircumference(54)
    expect(c).toBeCloseTo(2 * Math.PI * 54, 6)
    expect(ringDashOffset(1, c)).toBeCloseTo(0, 6) // full ring shown
    expect(ringDashOffset(0, c)).toBeCloseTo(c, 6) // ring hidden
    expect(ringDashOffset(0.5, c)).toBeCloseTo(c / 2, 6)
  })

  it('isRingDanger trips below the threshold', () => {
    expect(isRingDanger(RING_DANGER_THRESHOLD - 0.01)).toBe(true)
    expect(isRingDanger(RING_DANGER_THRESHOLD + 0.01)).toBe(false)
    expect(isRingDanger(1)).toBe(false)
    expect(isRingDanger(0)).toBe(true)
  })
})
