import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useGameStore } from './gameStore'

// Verifies the turn timer reads a server-provided value and ticks down locally
// between server updates (see timerUpdate / turnChanged in wireContract.ts).
describe('gameStore turn countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useGameStore.getState().resetGame()
    useGameStore.getState().stopTurnCountdown()
  })

  afterEach(() => {
    useGameStore.getState().stopTurnCountdown()
    vi.useRealTimers()
  })

  it('seeds timeRemaining from the server-provided seconds', () => {
    useGameStore.getState().startTurnCountdown(30)
    expect(useGameStore.getState().timeRemaining).toBe(30)
  })

  it('ticks down one second at a time between server updates', () => {
    useGameStore.getState().startTurnCountdown(10)
    vi.advanceTimersByTime(3000)
    expect(useGameStore.getState().timeRemaining).toBe(7)
  })

  it('re-seeds when a new server value arrives (does not accumulate intervals)', () => {
    useGameStore.getState().startTurnCountdown(10)
    vi.advanceTimersByTime(2000) // -> 8
    // A fresh server tick arrives with an authoritative value.
    useGameStore.getState().startTurnCountdown(15)
    expect(useGameStore.getState().timeRemaining).toBe(15)
    vi.advanceTimersByTime(1000)
    // Only one interval is running, so exactly one decrement.
    expect(useGameStore.getState().timeRemaining).toBe(14)
  })

  it('does not go below zero', () => {
    useGameStore.getState().startTurnCountdown(2)
    vi.advanceTimersByTime(5000)
    expect(useGameStore.getState().timeRemaining).toBe(0)
  })

  it('stopTurnCountdown halts further ticks', () => {
    useGameStore.getState().startTurnCountdown(10)
    vi.advanceTimersByTime(1000) // -> 9
    useGameStore.getState().stopTurnCountdown()
    vi.advanceTimersByTime(5000)
    expect(useGameStore.getState().timeRemaining).toBe(9)
  })
})
