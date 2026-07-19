import { describe, it, expect } from 'vitest'
import type { Card, Player } from '../../store/types'
import {
  computeAffordance,
  computeStreaks,
  deriveOpponentCount,
  deriveOpponents,
  deriveRestart,
  deriveTurnTotal,
} from './tableOrchestration'

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({
  suit,
  rank,
  id: `${suit}-${rank}`,
})

const player = (id: string, overrides: Partial<Player> = {}): Player => ({
  id,
  name: id,
  score: 0,
  isReady: true,
  isConnected: true,
  winStreak: 0,
  hand: [],
  ...overrides,
})

const HAND: Card[] = [card('hearts', '7'), card('hearts', 'K'), card('spades', '9')]

describe('computeAffordance (turn-affordance state machine)', () => {
  const base = {
    localPlayerId: 'me',
    leaderId: 'me',
    currentSuit: null,
    hand: HAND,
    playedCount: 0,
    localHasPlayed: false,
    gamePhase: 'playing' as const,
  }

  it('lets the leader open the round with every card playable/hinted', () => {
    const a = computeAffordance({ ...base })
    expect(a.canPlay).toBe(true)
    expect(a.isLeader).toBe(true)
    expect(a.reason).toBe('ok')
    // No led suit yet -> all cards are hints (leader is free to lead anything).
    expect(a.hintCardIds).toEqual(HAND.map(c => c.id))
  })

  it('blocks a follower before the leader has opened', () => {
    const a = computeAffordance({
      ...base,
      localPlayerId: 'me',
      leaderId: 'other',
      currentSuit: null,
      playedCount: 0,
    })
    expect(a.canPlay).toBe(false)
    expect(a.reason).toBe('awaiting-leader')
    expect(a.hintCardIds).toEqual([])
  })

  it('lets a follower play once the leader has opened (led-suit set)', () => {
    const a = computeAffordance({
      ...base,
      leaderId: 'other',
      currentSuit: 'hearts',
      playedCount: 1,
    })
    expect(a.canPlay).toBe(true)
    expect(a.reason).toBe('ok')
    // Follow-suit HINT: only the hearts are hinted...
    expect(a.hintCardIds).toEqual(['hearts-7', 'hearts-K'])
  })

  it('treats off-suit as legal - hints are advisory, canPlay stays true', () => {
    // Holding hearts while spades is led: getPlayableCards would say "no spades,
    // play anything" -> all cards hinted, and canPlay is true regardless.
    const a = computeAffordance({
      ...base,
      leaderId: 'other',
      currentSuit: 'clubs', // player holds no clubs
      playedCount: 1,
    })
    expect(a.canPlay).toBe(true)
    expect(a.hintCardIds).toEqual(HAND.map(c => c.id))
  })

  it('blocks a player who already played this round', () => {
    const a = computeAffordance({
      ...base,
      leaderId: 'other',
      currentSuit: 'hearts',
      playedCount: 2,
      localHasPlayed: true,
    })
    expect(a.canPlay).toBe(false)
    expect(a.reason).toBe('already-played')
  })

  it('blocks play when the game is not in the playing phase', () => {
    const a = computeAffordance({ ...base, gamePhase: 'finished' })
    expect(a.canPlay).toBe(false)
    expect(a.reason).toBe('not-playing')
  })

  it('does not treat an empty local id as the leader', () => {
    const a = computeAffordance({ ...base, localPlayerId: '', leaderId: '' })
    expect(a.isLeader).toBe(false)
    expect(a.reason).toBe('awaiting-leader')
  })
})

describe('deriveTurnTotal', () => {
  it('trusts the server turnDurationSeconds when present', () => {
    expect(deriveTurnTotal({ secondsRemaining: 3, turnDurationSeconds: 8 }, 15)).toBe(8)
  })

  it('falls back to the max observed value when duration is absent', () => {
    expect(deriveTurnTotal({ secondsRemaining: 12 }, 5)).toBe(12)
    expect(deriveTurnTotal({ secondsRemaining: 4 }, 15)).toBe(15)
  })

  it('never returns less than 1 (no divide-by-zero ring)', () => {
    expect(deriveTurnTotal({ secondsRemaining: 0 }, 0)).toBe(1)
  })

  it('ignores a non-positive duration and uses the fallback', () => {
    expect(deriveTurnTotal({ secondsRemaining: 6, turnDurationSeconds: 0 }, 5)).toBe(6)
  })
})

describe('opponent derivation', () => {
  const players = [player('me'), player('a'), player('b')]

  it('derives opponents excluding the local player', () => {
    expect(deriveOpponents(players, 'me').map(p => p.id)).toEqual(['a', 'b'])
  })

  it('derives the opponent count', () => {
    expect(deriveOpponentCount(players, 'me')).toBe(2)
    expect(deriveOpponentCount(players, 'a')).toBe(2)
    expect(deriveOpponentCount([player('solo')], 'solo')).toBe(0)
  })
})

describe('computeStreaks (stale-streak fix)', () => {
  it('increments the winner from its CURRENT streak and resets the rest', () => {
    const players = [
      player('me', { winStreak: 2 }),
      player('a', { winStreak: 5 }),
      player('b', { winStreak: 0 }),
    ]
    const next = computeStreaks(players, 'me')
    expect(next).toEqual({ me: 3, a: 0, b: 0 })
  })

  it('returns values derived from the passed players, not a mutated reference', () => {
    const players = [player('w', { winStreak: 0 })]
    const next = computeStreaks(players, 'w')
    // Reading a trusted value: 0 + 1, independent of any later store mutation.
    expect(next.w).toBe(1)
  })
})

describe('deriveRestart (clean play-again)', () => {
  const players = [
    player('me', { hand: [card('hearts', '6'), card('clubs', 'A')] }),
    player('a', { hand: [card('spades', 'K')] }),
  ]

  it("extracts the local player's fresh hand and opening turn", () => {
    const d = deriveRestart(players, { currentTurn: 'me' }, 'me')
    expect(d.localHand.map(c => c.id)).toEqual(['hearts-6', 'clubs-A'])
    expect(d.onDeckId).toBe('me')
    expect(d.isMyTurn).toBe(true)
  })

  it('reports not-my-turn when another seat opens', () => {
    const d = deriveRestart(players, { currentTurn: 'a' }, 'me')
    expect(d.onDeckId).toBe('a')
    expect(d.isMyTurn).toBe(false)
  })

  it('handles a missing local player and absent turn safely', () => {
    const d = deriveRestart(players, {}, 'ghost')
    expect(d.localHand).toEqual([])
    expect(d.onDeckId).toBeNull()
    expect(d.isMyTurn).toBe(false)
  })
})
