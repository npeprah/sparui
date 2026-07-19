// ---------------------------------------------------------------------------
// Table orchestration - PURE logic (ticket 14)
//
// This module holds the extractable, side-effect-free decisions that drive the
// new TableScene against the corrected backend rules. Everything here is unit
// tested; the imperative wiring (sockets, Zustand, Phaser) lives in
// TableGameController.ts and is proven end-to-end by the ticket-11 harness.
//
// Corrected Spar rules encoded here:
//   - The LEADER opens the round. A follower playing before the leader is
//     rejected server-side, so the affordance keeps a follower's hand disabled
//     until the leader has opened.
//   - After the leader opens, ANY follower who has not yet played may play
//     (there is no per-seat "wait your exact turn" gate for followers).
//   - Off-suit is LEGAL. Suit-following is a HINT only; it is NEVER used to
//     reject or disable a play. `hintCardIds` marks the follow-suit cards for
//     highlighting; the whole hand stays playable.
//   - The on-deck seat (whose timer is running) is tracked separately and only
//     drives the countdown ring / whose-timer UI - it does not gate play.
// ---------------------------------------------------------------------------

import type { Card, GamePhase, Player, Suit } from '../../store/types'
import { getPlayableCards } from '../utils/sparRules'

/** Why the local hand is (not) currently playable. `ok` means the player may play. */
export type AffordanceReason = 'ok' | 'not-playing' | 'already-played' | 'awaiting-leader'

export interface AffordanceInput {
  localPlayerId: string
  leaderId: string | null
  currentSuit: Suit | null
  hand: Card[]
  /** Number of cards on the pile this round (used to detect "leader has opened"). */
  playedCount: number
  /** True when the local player's card is already on the pile this round. */
  localHasPlayed: boolean
  gamePhase: GamePhase
}

export interface Affordance {
  isLeader: boolean
  leaderHasOpened: boolean
  /** True when the local player is allowed to play a card right now. */
  canPlay: boolean
  /**
   * Follow-suit HINT set - cards worth highlighting. Off-suit cards stay
   * playable; this list never gates a play. Empty when the player cannot play.
   */
  hintCardIds: string[]
  reason: AffordanceReason
}

/**
 * The turn-affordance state machine. Decides whether the local player may play
 * and which cards to hint, from authoritative store state. Off-suit is always
 * legal, so `hintCardIds` is advisory only.
 */
export function computeAffordance(input: AffordanceInput): Affordance {
  const isLeader = input.localPlayerId !== '' && input.localPlayerId === input.leaderId
  const leaderHasOpened = input.currentSuit !== null || input.playedCount > 0

  const base = { isLeader, leaderHasOpened, hintCardIds: [] as string[] }

  if (input.gamePhase !== 'playing') {
    return { ...base, canPlay: false, reason: 'not-playing' }
  }
  if (input.localHasPlayed) {
    return { ...base, canPlay: false, reason: 'already-played' }
  }
  if (!isLeader && !leaderHasOpened) {
    return { ...base, canPlay: false, reason: 'awaiting-leader' }
  }

  const hintCardIds = getPlayableCards(input.hand, input.currentSuit).map(c => c.id)
  return { ...base, canPlay: true, hintCardIds, reason: 'ok' }
}

/**
 * Derive the countdown-ring denominator (turn total) from a timerUpdate.
 *
 * The backend streams `turnDurationSeconds` for the on-deck seat (leader 15s,
 * first follower 8s, subsequent 5s). When present it is authoritative. When a
 * legacy emit omits it we fall back to the largest value observed this turn so
 * the ring never over-fills. Never returns < 1 to avoid a divide-by-zero ring.
 */
export function deriveTurnTotal(
  payload: { secondsRemaining: number; turnDurationSeconds?: number },
  prevTotal: number
): number {
  if (typeof payload.turnDurationSeconds === 'number' && payload.turnDurationSeconds > 0) {
    return payload.turnDurationSeconds
  }
  return Math.max(prevTotal, payload.secondsRemaining, 1)
}

/** Everyone at the table who is not the local player. */
export function deriveOpponents(players: Player[], localPlayerId: string): Player[] {
  return players.filter(p => p.id !== localPlayerId)
}

/** How many opponents are seated - drives the opponent-fan layout. */
export function deriveOpponentCount(players: Player[], localPlayerId: string): number {
  return deriveOpponents(players, localPlayerId).length
}

/**
 * Recompute win streaks after a round win WITHOUT reading stale player objects.
 *
 * This is the fix for the stale-streak bug: the old code incremented the store
 * then read `player.winStreak + 1` off a possibly-stale reference. Here we take
 * the pre-update players and return the NEW streak per id - winner + 1, everyone
 * else reset to 0 - so callers apply a value they can trust.
 */
export function computeStreaks(players: Player[], winnerId: string): Record<string, number> {
  const next: Record<string, number> = {}
  for (const p of players) {
    next[p.id] = p.id === winnerId ? p.winStreak + 1 : 0
  }
  return next
}

export interface RestartDerivation {
  localHand: Card[]
  onDeckId: string | null
  isMyTurn: boolean
}

/**
 * Derive the local player's fresh hand and opening turn for a clean play-again.
 * Operates on already-converted frontend players (post initializeFromBackend),
 * so it stays free of backend card-format concerns.
 */
export function deriveRestart(
  players: Player[],
  backend: { currentTurn?: string | null },
  localPlayerId: string
): RestartDerivation {
  const me = players.find(p => p.id === localPlayerId)
  const onDeckId = backend.currentTurn ?? null
  return {
    localHand: me?.hand ?? [],
    onDeckId,
    isMyTurn: onDeckId !== null && onDeckId === localPlayerId,
  }
}
