import { describe, it, expect } from 'vitest'
import {
  OVERLAY_KINDS,
  createOverlaySlotState,
  isAnyOverlayActive,
  isOverlayActive,
  setOverlaySlot,
} from './cardOverlays'

describe('cardOverlays - state-overlay slots', () => {
  it('exposes exactly the fire / freeze / dry kinds', () => {
    expect([...OVERLAY_KINDS]).toEqual(['fire', 'freeze', 'dry'])
  })

  it('creates an all-inactive slot state', () => {
    const state = createOverlaySlotState()
    expect(state).toEqual({ fire: false, freeze: false, dry: false })
    expect(isAnyOverlayActive(state)).toBe(false)
  })

  describe('setOverlaySlot', () => {
    it('activates a slot and reports the change', () => {
      const state = createOverlaySlotState()
      expect(setOverlaySlot(state, 'fire', true)).toBe(true)
      expect(isOverlayActive(state, 'fire')).toBe(true)
    })

    it('returns false when the slot is already in the requested state', () => {
      const state = createOverlaySlotState()
      setOverlaySlot(state, 'dry', true)
      expect(setOverlaySlot(state, 'dry', true)).toBe(false)
    })

    it('deactivates a slot and reports the change', () => {
      const state = createOverlaySlotState()
      setOverlaySlot(state, 'freeze', true)
      expect(setOverlaySlot(state, 'freeze', false)).toBe(true)
      expect(isOverlayActive(state, 'freeze')).toBe(false)
    })

    it('tracks slots independently', () => {
      const state = createOverlaySlotState()
      setOverlaySlot(state, 'fire', true)
      setOverlaySlot(state, 'dry', true)
      expect(state).toEqual({ fire: true, freeze: false, dry: true })
    })
  })

  describe('isAnyOverlayActive', () => {
    it('is true when at least one slot is active', () => {
      const state = createOverlaySlotState()
      setOverlaySlot(state, 'freeze', true)
      expect(isAnyOverlayActive(state)).toBe(true)
    })
  })
})
