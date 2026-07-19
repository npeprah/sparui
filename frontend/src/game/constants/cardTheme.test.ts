import { describe, it, expect } from 'vitest'
import {
  EK_BORDER_STYLES,
  getEKBorderStyle,
  resolveEKTreatment,
  type EKBorderTreatment,
} from './cardTheme'

describe('cardTheme - EK border treatment mapping', () => {
  describe('resolveEKTreatment', () => {
    it('maps existing surface themes to a treatment', () => {
      expect(resolveEKTreatment('afro_heritage')).toBe('gold')
      expect(resolveEKTreatment('royal_gold')).toBe('gold')
      expect(resolveEKTreatment('neon_arcade')).toBe('neon')
      expect(resolveEKTreatment('ocean_breeze')).toBe('comic')
    })

    it('accepts forward-compatible canonical EK theme keys (ticket 15)', () => {
      expect(resolveEKTreatment('warm_heritage')).toBe('gold')
      expect(resolveEKTreatment('comic')).toBe('comic')
      expect(resolveEKTreatment('neon')).toBe('neon')
    })

    it('falls back to gold for unknown themes', () => {
      expect(resolveEKTreatment('does_not_exist')).toBe('gold')
      expect(resolveEKTreatment('')).toBe('gold')
    })

    it('reaches all three treatments across the current theme set', () => {
      const reached = new Set<EKBorderTreatment>(
        ['afro_heritage', 'royal_gold', 'neon_arcade', 'ocean_breeze'].map(resolveEKTreatment)
      )
      expect(reached).toEqual(new Set(['gold', 'comic', 'neon']))
    })
  })

  describe('getEKBorderStyle', () => {
    it('returns the style whose treatment matches the resolved treatment', () => {
      expect(getEKBorderStyle('afro_heritage').treatment).toBe('gold')
      expect(getEKBorderStyle('neon_arcade').treatment).toBe('neon')
      expect(getEKBorderStyle('ocean_breeze').treatment).toBe('comic')
    })

    it('returns the gold style for unknown themes', () => {
      expect(getEKBorderStyle('mystery').treatment).toBe('gold')
    })
  })

  describe('EK_BORDER_STYLES', () => {
    it('defines a complete, self-consistent style for every treatment', () => {
      ;(['gold', 'comic', 'neon'] as EKBorderTreatment[]).forEach(treatment => {
        const style = EK_BORDER_STYLES[treatment]
        expect(style.treatment).toBe(treatment)
        expect(style.inkWidth).toBeGreaterThan(0)
        expect(style.cornerRadius).toBeGreaterThan(0)
        expect(style.shadowAlpha).toBeGreaterThanOrEqual(0)
      })
    })

    it('only the neon treatment uses an additive glow', () => {
      expect(EK_BORDER_STYLES.gold.glow).toBe(false)
      expect(EK_BORDER_STYLES.comic.glow).toBe(false)
      expect(EK_BORDER_STYLES.neon.glow).toBe(true)
    })
  })
})
