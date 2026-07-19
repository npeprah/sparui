// ---------------------------------------------------------------------------
// Card state-overlay DECISIONS - PURE logic (ticket 16)
//
// This module holds the extractable, side-effect-free decisions that map the
// authoritative overlay STATE (landed by ticket 14 in gameStore:
// `fireStreakPlayerId`, `frozenCard`, `dryDeclarations`, plus the live
// `playedCards` pile) onto WHICH card gets which overlay, and HOW a dry card is
// faced. Everything here is unit tested; the imperative Phaser wiring (creating
// emitters, attaching them to CardSprites) lives in CardStateOverlayDriver.ts.
//
// Rules encoded here (see PRD section 2 / backend semantics):
//   - Fire: the on-fire player's played (4th-round) card on the pile burns.
//   - Freeze: the breaker's winning card (delivered as `frozenCard`) frosts.
//     It is located on the pile by identity.
//   - Dry: a declared 6/7 is set aside. Hidden dry is FACE-DOWN with its
//     identity WITHHELD (never revealed here, even if the payload leaked a
//     card); show-dry is FACE-UP with its identity revealed.
// ---------------------------------------------------------------------------

import type { Card, Rank, Suit } from '../../store/types'

/** A single dry / show-dry declaration as stored by ticket 14. */
export interface DryDeclarationInfo {
  isShown: boolean
  card: Card | null
}

/** The overlay-relevant slice of gameStore the driver reads each sync. */
export interface OverlayStateSlice {
  fireStreakPlayerId: string | null
  frozenCard: Card | null
  playedCards: Map<string, Card>
  dryDeclarations: Record<string, DryDeclarationInfo>
}

/** A pile card selected to receive a fire or freeze overlay. */
export interface PileOverlayTarget {
  playerId: string
  card: Card
}

/**
 * Two cards are "the same" when their ids match (the normal case - the pile
 * card and the frozen card originate from the same authoritative play). We fall
 * back to suit+rank so a payload that omits the id still resolves.
 */
export function cardsMatch(a: Card, b: Card): boolean {
  if (a.id && b.id) return a.id === b.id
  return a.suit === b.suit && a.rank === b.rank
}

/**
 * The pile card that should BURN: the on-fire player's played card. Null when
 * nobody is on fire, or the on-fire player has no card on the pile yet.
 */
export function resolveFireTarget(slice: OverlayStateSlice): PileOverlayTarget | null {
  const playerId = slice.fireStreakPlayerId
  if (!playerId) return null
  const card = slice.playedCards.get(playerId)
  return card ? { playerId, card } : null
}

/**
 * The pile card that should FROST: the entry matching the breaker's winning
 * `frozenCard`. Null when no freeze happened this round, or the frozen card is
 * not (yet) on the pile.
 */
export function resolveFreezeTarget(slice: OverlayStateSlice): PileOverlayTarget | null {
  const frozen = slice.frozenCard
  if (!frozen) return null
  for (const [playerId, card] of slice.playedCards) {
    if (cardsMatch(card, frozen)) return { playerId, card }
  }
  return null
}

/**
 * How a single set-aside dry card should render. `faceDown`/`revealsIdentity`
 * are the safety-critical bits: a hidden dry is ALWAYS face-down with its
 * identity withheld, so `suit`/`rank` fall back to a placeholder that is never
 * shown (the card renders as a card-back).
 */
export interface DryRenderSpec {
  playerId: string
  faceDown: boolean
  revealsIdentity: boolean
  suit: Suit
  rank: Rank
}

/**
 * Placeholder identity used only to construct a FACE-DOWN dry CardSprite (whose
 * face is never shown). Keeps the hidden-dry card's true identity secret even
 * from the constructed sprite. 7 of clubs is a valid Spar card.
 */
export const HIDDEN_DRY_PLACEHOLDER: { suit: Suit; rank: Rank } = { suit: 'clubs', rank: '7' }

/**
 * Decide the render spec for one declaration. The identity is revealed only for
 * a show-dry that actually carries a card; every other case (hidden dry, or a
 * malformed show-dry missing its card) renders face-down with the identity
 * withheld. We deliberately ignore `info.card` unless `isShown` is true so a
 * leaked hidden-dry card can never be exposed.
 */
export function resolveDryRenderSpec(playerId: string, info: DryDeclarationInfo): DryRenderSpec {
  const canReveal = info.isShown && info.card != null
  if (canReveal && info.card) {
    return {
      playerId,
      faceDown: false,
      revealsIdentity: true,
      suit: info.card.suit,
      rank: info.card.rank,
    }
  }
  return {
    playerId,
    faceDown: true,
    revealsIdentity: false,
    suit: HIDDEN_DRY_PLACEHOLDER.suit,
    rank: HIDDEN_DRY_PLACEHOLDER.rank,
  }
}

/** Render specs for every current dry declaration, in a stable key order. */
export function resolveDryRenderSpecs(
  dryDeclarations: Record<string, DryDeclarationInfo>
): DryRenderSpec[] {
  return Object.entries(dryDeclarations).map(([playerId, info]) =>
    resolveDryRenderSpec(playerId, info)
  )
}

/** The attach/detach decision for a single-target pile overlay (fire / freeze). */
export interface OverlayReconcile {
  toActivate: string[]
  toDeactivate: string[]
}

/**
 * Given every pile sprite id, the ids that currently show an overlay, and the
 * single id that SHOULD show it (or null), decide which to switch on and which
 * to switch off. Idempotent: a sprite already in the desired state appears in
 * neither list.
 */
export function reconcileSingleTarget(
  spriteIds: readonly string[],
  activeIds: readonly string[] | Set<string>,
  targetId: string | null
): OverlayReconcile {
  const active = activeIds instanceof Set ? activeIds : new Set(activeIds)
  const toActivate: string[] = []
  const toDeactivate: string[] = []
  for (const id of spriteIds) {
    const isActive = active.has(id)
    const shouldBeActive = targetId !== null && id === targetId
    if (shouldBeActive && !isActive) {
      toActivate.push(id)
    } else if (!shouldBeActive && isActive) {
      toDeactivate.push(id)
    }
  }
  return { toActivate, toDeactivate }
}

/** Where the set-aside dry cards are laid out. */
export interface DryZoneConfig {
  x: number
  y: number
  spacing: number
}

/** Position of the n-th set-aside dry card, laid out in a row from the anchor. */
export function drySetAsidePosition(index: number, cfg: DryZoneConfig): { x: number; y: number } {
  return { x: cfg.x + index * cfg.spacing, y: cfg.y }
}
