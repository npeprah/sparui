import { describe, it, expect } from 'vitest'
import { getBackdropSpec } from './tableBackdrop'
import type { EKBorderTreatment } from '../constants/cardTheme'

describe('getBackdropSpec', () => {
  it('gives the warm heritage palette a radial glow with halftone dots', () => {
    const spec = getBackdropSpec('gold')
    expect(spec.kind).toBe('radial')
    expect(spec.texture).toBe('halftone')
    expect(spec.stops[0].color).toBe('#ffe9c7')
  })

  it('gives the comic palette a flat linear wash with halftone dots', () => {
    const spec = getBackdropSpec('comic')
    expect(spec.kind).toBe('linear')
    expect(spec.texture).toBe('halftone')
    expect(spec.stops[0].color).toBe('#ffd400')
  })

  it('gives the neon palette a deep radial with scanlines', () => {
    const spec = getBackdropSpec('neon')
    expect(spec.kind).toBe('radial')
    expect(spec.texture).toBe('scanlines')
    expect(spec.stops[spec.stops.length - 1].color).toBe('#05010f')
  })

  it('produces monotonically increasing, in-range gradient stops for every treatment', () => {
    const treatments: EKBorderTreatment[] = ['gold', 'comic', 'neon']
    for (const t of treatments) {
      const spec = getBackdropSpec(t)
      expect(spec.stops.length).toBeGreaterThanOrEqual(2)
      let prev = -1
      for (const stop of spec.stops) {
        expect(stop.offset).toBeGreaterThanOrEqual(0)
        expect(stop.offset).toBeLessThanOrEqual(1)
        expect(stop.offset).toBeGreaterThan(prev)
        expect(stop.color).toMatch(/^#[0-9a-f]{6}$/i)
        prev = stop.offset
      }
      expect(spec.focusX).toBeGreaterThanOrEqual(0)
      expect(spec.focusX).toBeLessThanOrEqual(1)
      expect(spec.focusY).toBeGreaterThanOrEqual(0)
      expect(spec.focusY).toBeLessThanOrEqual(1)
    }
  })
})
