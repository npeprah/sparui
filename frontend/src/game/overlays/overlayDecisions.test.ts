import { describe, it, expect } from 'vitest'
import type { Card } from '../../store/types'
import {
  HIDDEN_DRY_PLACEHOLDER,
  cardsMatch,
  drySetAsidePosition,
  reconcileSingleTarget,
  resolveDryRenderSpec,
  resolveDryRenderSpecs,
  resolveFireTarget,
  resolveFreezeTarget,
  type OverlayStateSlice,
} from './overlayDecisions'

const card = (suit: Card['suit'], rank: Card['rank'], id?: string): Card => ({
  suit,
  rank,
  id: id ?? `${suit}-${rank}`,
})

const slice = (over: Partial<OverlayStateSlice> = {}): OverlayStateSlice => ({
  fireStreakPlayerId: null,
  frozenCard: null,
  playedCards: new Map(),
  dryDeclarations: {},
  ...over,
})

describe('overlayDecisions', () => {
  describe('cardsMatch', () => {
    it('matches by id when both carry one', () => {
      expect(cardsMatch(card('hearts', 'K', 'x'), card('spades', '6', 'x'))).toBe(true)
      expect(cardsMatch(card('hearts', 'K', 'x'), card('hearts', 'K', 'y'))).toBe(false)
    })

    it('falls back to suit + rank when an id is missing', () => {
      const a = { suit: 'clubs', rank: '9' } as Card
      const b = { suit: 'clubs', rank: '9' } as Card
      expect(cardsMatch(a, b)).toBe(true)
      expect(cardsMatch(a, { suit: 'clubs', rank: '10' } as Card)).toBe(false)
    })
  })

  describe('resolveFireTarget', () => {
    it('returns the on-fire player pile card', () => {
      const played = new Map([['p1', card('hearts', 'K')]])
      const target = resolveFireTarget(slice({ fireStreakPlayerId: 'p1', playedCards: played }))
      expect(target).toEqual({ playerId: 'p1', card: card('hearts', 'K') })
    })

    it('is null when nobody is on fire', () => {
      const played = new Map([['p1', card('hearts', 'K')]])
      expect(resolveFireTarget(slice({ fireStreakPlayerId: null, playedCards: played }))).toBeNull()
    })

    it('is null when the on-fire player has not played this round', () => {
      expect(resolveFireTarget(slice({ fireStreakPlayerId: 'p9' }))).toBeNull()
    })
  })

  describe('resolveFreezeTarget', () => {
    it('locates the breaker pile card by identity', () => {
      const played = new Map([
        ['p1', card('hearts', 'K', 'a')],
        ['p2', card('spades', '6', 'b')],
      ])
      const target = resolveFreezeTarget(
        slice({ frozenCard: card('spades', '6', 'b'), playedCards: played })
      )
      expect(target?.playerId).toBe('p2')
    })

    it('is null when no freeze happened', () => {
      const played = new Map([['p1', card('hearts', 'K')]])
      expect(resolveFreezeTarget(slice({ frozenCard: null, playedCards: played }))).toBeNull()
    })

    it('is null when the frozen card is not on the pile', () => {
      const played = new Map([['p1', card('hearts', 'K', 'a')]])
      expect(
        resolveFreezeTarget(slice({ frozenCard: card('spades', '6', 'z'), playedCards: played }))
      ).toBeNull()
    })
  })

  describe('resolveDryRenderSpec - facing + identity', () => {
    it('show-dry renders FACE-UP and reveals the identity', () => {
      const spec = resolveDryRenderSpec('p1', { isShown: true, card: card('diamonds', '7') })
      expect(spec).toEqual({
        playerId: 'p1',
        faceDown: false,
        revealsIdentity: true,
        suit: 'diamonds',
        rank: '7',
      })
    })

    it('hidden dry renders FACE-DOWN with the identity withheld', () => {
      const spec = resolveDryRenderSpec('p2', { isShown: false, card: null })
      expect(spec.faceDown).toBe(true)
      expect(spec.revealsIdentity).toBe(false)
      expect(spec.suit).toBe(HIDDEN_DRY_PLACEHOLDER.suit)
      expect(spec.rank).toBe(HIDDEN_DRY_PLACEHOLDER.rank)
    })

    it('NEVER exposes a leaked hidden-dry card (isShown=false but card present)', () => {
      const secret = card('hearts', '6', 'secret')
      const spec = resolveDryRenderSpec('p3', { isShown: false, card: secret })
      expect(spec.faceDown).toBe(true)
      expect(spec.revealsIdentity).toBe(false)
      expect(spec.suit).toBe(HIDDEN_DRY_PLACEHOLDER.suit)
      expect(spec.rank).toBe(HIDDEN_DRY_PLACEHOLDER.rank)
    })

    it('a malformed show-dry with no card falls back to face-down/withheld', () => {
      const spec = resolveDryRenderSpec('p4', { isShown: true, card: null })
      expect(spec.faceDown).toBe(true)
      expect(spec.revealsIdentity).toBe(false)
    })
  })

  describe('resolveDryRenderSpecs', () => {
    it('maps every declaration', () => {
      const specs = resolveDryRenderSpecs({
        p1: { isShown: true, card: card('clubs', '6') },
        p2: { isShown: false, card: null },
      })
      expect(specs).toHaveLength(2)
      expect(specs.find(s => s.playerId === 'p1')?.revealsIdentity).toBe(true)
      expect(specs.find(s => s.playerId === 'p2')?.revealsIdentity).toBe(false)
    })
  })

  describe('reconcileSingleTarget', () => {
    it('activates a newly-targeted sprite', () => {
      const r = reconcileSingleTarget(['a', 'b'], [], 'a')
      expect(r.toActivate).toEqual(['a'])
      expect(r.toDeactivate).toEqual([])
    })

    it('deactivates a sprite that is no longer the target', () => {
      const r = reconcileSingleTarget(['a', 'b'], ['a'], null)
      expect(r.toActivate).toEqual([])
      expect(r.toDeactivate).toEqual(['a'])
    })

    it('moves the overlay from one sprite to another', () => {
      const r = reconcileSingleTarget(['a', 'b'], ['a'], 'b')
      expect(r.toActivate).toEqual(['b'])
      expect(r.toDeactivate).toEqual(['a'])
    })

    it('is a no-op when already in the desired state (idempotent)', () => {
      const r = reconcileSingleTarget(['a', 'b'], new Set(['a']), 'a')
      expect(r.toActivate).toEqual([])
      expect(r.toDeactivate).toEqual([])
    })
  })

  describe('drySetAsidePosition', () => {
    it('lays cards out in a row from the anchor', () => {
      const cfg = { x: 100, y: 400, spacing: 70 }
      expect(drySetAsidePosition(0, cfg)).toEqual({ x: 100, y: 400 })
      expect(drySetAsidePosition(2, cfg)).toEqual({ x: 240, y: 400 })
    })
  })
})
