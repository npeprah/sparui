/**
 * Card state-overlay slots (fire / freeze / dry).
 *
 * Ticket 12 provides the HOOKS and SLOTS for the fire, freeze and dry state
 * overlays; the rich particle/sprite effects themselves are rendered in ticket
 * 16 and plugged into these slots via `CardSprite.attachOverlay`.
 *
 * This module is the pure, unit-testable core of that mechanism: it tracks
 * which overlays are active on a card and reports whether a setter actually
 * changed state (so `CardSprite` can avoid redundant re-renders / sound emits).
 */

/** The three card state overlays that own a slot. */
export type OverlayKind = 'fire' | 'freeze' | 'dry'

/** Canonical ordered list of overlay kinds. */
export const OVERLAY_KINDS: readonly OverlayKind[] = ['fire', 'freeze', 'dry']

/** Active/inactive flag per overlay slot. */
export type OverlaySlotState = Record<OverlayKind, boolean>

/** Create a fresh, all-inactive overlay slot state. */
export function createOverlaySlotState(): OverlaySlotState {
  return { fire: false, freeze: false, dry: false }
}

/**
 * Toggle an overlay slot.
 * @returns `true` if the slot value actually changed, `false` if it was already
 *          in the requested state (allowing callers to skip redundant work).
 */
export function setOverlaySlot(
  state: OverlaySlotState,
  kind: OverlayKind,
  enabled: boolean
): boolean {
  if (state[kind] === enabled) {
    return false
  }
  state[kind] = enabled
  return true
}

/** True if the given overlay slot is active. */
export function isOverlayActive(state: OverlaySlotState, kind: OverlayKind): boolean {
  return state[kind]
}

/** True if any overlay slot is active. */
export function isAnyOverlayActive(state: OverlaySlotState): boolean {
  return OVERLAY_KINDS.some(kind => state[kind])
}
