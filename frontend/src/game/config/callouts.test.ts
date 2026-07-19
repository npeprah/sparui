import { describe, it, expect } from 'vitest'
import {
  CALLOUTS,
  DEFAULT_CALLOUT_STYLE,
  resolveCallout,
  type CalloutEvent,
  type CalloutFill,
} from './callouts'

const ALL_EVENTS: CalloutEvent[] = [
  'bigPlay',
  'wait',
  'roundWin',
  'fireStreak',
  'freeze',
  'dry',
  'showDry',
  'flagBusted',
  'flagSafe',
  'gameWin',
  'invalid',
]

const VALID_FILLS: CalloutFill[] = ['accent', 'danger', 'pop', 'ink']

describe('callout config (ticket 15)', () => {
  describe('resolveCallout', () => {
    it('resolves the ticket example callouts (big play / flag / win)', () => {
      expect(resolveCallout('bigPlay').word).toBe('POW!')
      expect(resolveCallout('flagBusted').word).toBe('BUSTED!')
      expect(resolveCallout('roundWin').word).toBe('BOOM!')
      expect(resolveCallout('gameWin').word).toBe('GAME OVER!')
    })

    it('keeps the wired ticket-14 words the controller/tests rely on', () => {
      expect(resolveCallout('wait').word).toBe('WAIT')
      expect(resolveCallout('showDry').word).toBe('SHOW DRY!')
      expect(resolveCallout('dry').word).toBe('DRY!')
    })

    it('returns a word + style + self-consistent trigger for every event', () => {
      for (const event of ALL_EVENTS) {
        const spec = resolveCallout(event)
        expect(spec.word.length).toBeGreaterThan(0)
        expect(spec.trigger).toBe(event)
        expect(VALID_FILLS).toContain(spec.style.fill)
        expect(['normal', 'big', 'huge']).toContain(spec.style.size)
      }
    })
  })

  describe('CALLOUTS table', () => {
    it('covers exactly the known callout events', () => {
      expect(Object.keys(CALLOUTS).sort()).toEqual([...ALL_EVENTS].sort())
    })

    it('is designer-editable data (plain object, no functions)', () => {
      for (const event of ALL_EVENTS) {
        const spec = CALLOUTS[event]
        expect(typeof spec.word).toBe('string')
        expect(typeof spec.style).toBe('object')
      }
    })
  })

  describe('DEFAULT_CALLOUT_STYLE', () => {
    it('is a valid style so showCallout has a safe fallback', () => {
      expect(VALID_FILLS).toContain(DEFAULT_CALLOUT_STYLE.fill)
      expect(['normal', 'big', 'huge']).toContain(DEFAULT_CALLOUT_STYLE.size)
    })
  })
})
