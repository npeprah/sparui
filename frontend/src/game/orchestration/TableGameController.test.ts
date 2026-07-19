import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TableGameController, type TableSceneHooks } from './TableGameController'
import { useGameStore } from '../../store/gameStore'
import { usePlayerStore } from '../../store/playerStore'
import type { BackendGameState } from '../../store/types'

// A minimal fake socket: records emits and captures registered handlers so the
// test can fire "server" events. isConnected() reports false to prove the
// controller attaches handlers regardless of connection (the listener-race fix).
class FakeSocket {
  connected = false
  emitted: Array<{ event: string; data: unknown }> = []
  private handlers = new Map<string, Set<(data: unknown) => void>>()

  isConnected(): boolean {
    return this.connected
  }
  on(event: string, handler: unknown): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler as (data: unknown) => void)
  }
  off(event: string, handler?: unknown): void {
    if (handler) this.handlers.get(event)?.delete(handler as (data: unknown) => void)
    else this.handlers.delete(event)
  }
  emit(event: string, data: unknown): void {
    this.emitted.push({ event, data })
  }
  fire(event: string, data: unknown): void {
    this.handlers.get(event)?.forEach(h => h(data))
  }
  handlerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0
  }
}

const backendState = (overrides: Partial<BackendGameState> = {}): BackendGameState => ({
  gameId: 'g1',
  roomCode: 'ROOM',
  totalRounds: 5,
  pointsToWin: 10,
  phase: 'playing',
  leaderId: 'me',
  currentTurn: 'me',
  currentRound: 1,
  turnStartTime: '',
  turnTimeLimit: 15,
  startedAt: '',
  updatedAt: '',
  players: [
    {
      id: 'me',
      username: 'Me',
      avatar: 'a',
      score: 0,
      roundsWon: 0,
      winStreak: 0,
      isLeader: true,
      isOnFire: false,
      hasPlayedCard: false,
      dryCardInfo: null,
      hand: [
        { suit: 'hearts', rank: '7', id: 'hearts-7' },
        { suit: 'spades', rank: '9', id: 'spades-9' },
      ],
    },
    {
      id: 'opp',
      username: 'Opp',
      avatar: 'b',
      score: 0,
      roundsWon: 0,
      winStreak: 0,
      isLeader: false,
      isOnFire: false,
      hasPlayedCard: false,
      dryCardInfo: null,
      hand: [{ suit: 'clubs', rank: 'K', id: 'clubs-K' }],
    },
  ],
  playedCards: [],
  ...overrides,
})

function makeScene(): TableSceneHooks & {
  callouts: string[]
  turnTotals: number[]
  sounds: string[]
} {
  return {
    onPlayCardRequested: undefined,
    callouts: [],
    turnTotals: [],
    sounds: [],
    showCallout(text: string) {
      this.callouts.push(text)
    },
    setTurnTotal(seconds: number) {
      this.turnTotals.push(seconds)
    },
    playSound(key: string) {
      this.sounds.push(key)
    },
  }
}

function makeController(socket: FakeSocket, scene: TableSceneHooks) {
  return new TableGameController(scene, {
    socket: socket as never,
    gameStore: useGameStore,
    playerStore: usePlayerStore,
  })
}

describe('TableGameController', () => {
  let socket: FakeSocket
  let scene: ReturnType<typeof makeScene>

  beforeEach(() => {
    useGameStore.getState().resetGame()
    usePlayerStore.getState().setPlayerId('me')
    usePlayerStore.getState().setHand([])
    usePlayerStore.getState().resetGameState()
    socket = new FakeSocket()
    scene = makeScene()
  })

  it('attaches socket handlers even when the socket is NOT connected (race fix)', () => {
    expect(socket.isConnected()).toBe(false)
    const controller = makeController(socket, scene)
    // The core in-game events are all live regardless of connection timing.
    for (const ev of ['cardPlayed', 'turnChanged', 'timerUpdate', 'roundWon', 'game:restarted']) {
      expect(socket.handlerCount(ev)).toBeGreaterThan(0)
    }
    controller.destroy()
  })

  it('wires onPlayCardRequested to emit game:play_card when it is a legal moment', () => {
    useGameStore.getState().initializeFromBackend(backendState())
    usePlayerStore.getState().setHand([
      { suit: 'hearts', rank: '7', id: 'hearts-7' },
      { suit: 'spades', rank: '9', id: 'spades-9' },
    ])
    const controller = makeController(socket, scene)

    // Leader may open: play an off-suit card is fine (no led suit yet).
    scene.onPlayCardRequested!({ suit: 'spades', rank: '9', id: 'spades-9' })
    expect(socket.emitted).toContainEqual({
      event: 'game:play_card',
      data: { card: { suit: 'spades', rank: '9', id: 'spades-9' } },
    })
    controller.destroy()
  })

  it('does NOT reject an off-suit play once the leader has opened', () => {
    useGameStore
      .getState()
      .initializeFromBackend(backendState({ leaderId: 'opp', currentTurn: 'opp' }))
    usePlayerStore.getState().setHand([
      { suit: 'hearts', rank: '7', id: 'hearts-7' },
      { suit: 'spades', rank: '9', id: 'spades-9' },
    ])
    const controller = makeController(socket, scene)

    // Opponent (leader) opens with clubs; local player holds no clubs.
    socket.fire('cardPlayed', {
      playerId: 'opp',
      card: { suit: 'clubs', rank: 'K', id: 'clubs-K' },
      currentTurn: 'me',
      ledSuit: 'clubs',
    })

    // Off-suit spades is legal and MUST emit (no client-side suit rejection).
    scene.onPlayCardRequested!({ suit: 'spades', rank: '9', id: 'spades-9' })
    expect(socket.emitted.some(e => e.event === 'game:play_card')).toBe(true)
    controller.destroy()
  })

  it('gates a follower play before the leader opens (turn affordance, not suit)', () => {
    useGameStore
      .getState()
      .initializeFromBackend(backendState({ leaderId: 'opp', currentTurn: 'opp' }))
    usePlayerStore.getState().setHand([{ suit: 'hearts', rank: '7', id: 'hearts-7' }])
    const controller = makeController(socket, scene)

    scene.onPlayCardRequested!({ suit: 'hearts', rank: '7', id: 'hearts-7' })
    expect(socket.emitted.some(e => e.event === 'game:play_card')).toBe(false)
    expect(scene.callouts).toContain('WAIT')
    controller.destroy()
  })

  it('drives the ring turn-total from the server timer', () => {
    const controller = makeController(socket, scene)
    socket.fire('timerUpdate', { playerId: 'me', secondsRemaining: 6, turnDurationSeconds: 8 })
    expect(scene.turnTotals).toContain(8)
    expect(useGameStore.getState().onDeckPlayerId).toBe('me')
    controller.destroy()
  })

  it('removes the local card from hand on the cardPlayed echo', () => {
    useGameStore.getState().initializeFromBackend(backendState())
    usePlayerStore.getState().setHand([
      { suit: 'hearts', rank: '7', id: 'hearts-7' },
      { suit: 'spades', rank: '9', id: 'spades-9' },
    ])
    const controller = makeController(socket, scene)

    socket.fire('cardPlayed', {
      playerId: 'me',
      card: { suit: 'hearts', rank: '7', id: 'hearts-7' },
      currentTurn: 'opp',
    })
    expect(usePlayerStore.getState().hand.map(c => c.id)).toEqual(['spades-9'])
    controller.destroy()
  })

  it("shrinks an opponent's stored hand as they play (card-back fan shrinks)", () => {
    useGameStore.getState().initializeFromBackend(backendState())
    const controller = makeController(socket, scene)
    const oppBefore = useGameStore.getState().players.find(p => p.id === 'opp')!
    expect(oppBefore.hand!.length).toBe(1)

    socket.fire('cardPlayed', {
      playerId: 'opp',
      card: { suit: 'clubs', rank: 'K', id: 'clubs-K' },
      currentTurn: 'me',
    })
    const oppAfter = useGameStore.getState().players.find(p => p.id === 'opp')!
    expect(oppAfter.hand!.length).toBe(0)
    controller.destroy()
  })

  it('applies authoritative streaks on roundWon without stale reads', () => {
    useGameStore.getState().initializeFromBackend(backendState())
    useGameStore.getState().updatePlayer('me', { winStreak: 2 })
    const controller = makeController(socket, scene)

    socket.fire('roundWon', {
      winnerId: 'me',
      roundsWon: { me: 1, opp: 0 },
      isDry: false,
      isShowDry: false,
      fireStreakPlayer: 'me',
    })
    const me = useGameStore.getState().players.find(p => p.id === 'me')!
    const opp = useGameStore.getState().players.find(p => p.id === 'opp')!
    expect(me.winStreak).toBe(3)
    expect(opp.winStreak).toBe(0)
    // Fire streak comes from the backend flag, exposed as state for ticket 16.
    expect(useGameStore.getState().fireStreakPlayerId).toBe('me')
    controller.destroy()
  })

  it('performs a clean single-call play-again re-init from backend state', () => {
    // Dirty prior game state.
    useGameStore.getState().initializeFromBackend(backendState())
    useGameStore.getState().playCard('me', { suit: 'hearts', rank: '7', id: 'hearts-7' })
    useGameStore.getState().setGameWinner({ id: 'me', name: 'Me', score: 3 })
    const controller = makeController(socket, scene)

    socket.fire('game:restarted', {
      roomCode: 'ROOM',
      gameState: backendState({ currentRound: 1, currentTurn: 'opp', leaderId: 'opp' }),
    })

    const g = useGameStore.getState()
    expect(g.playedCards.size).toBe(0)
    expect(g.currentSuit).toBeNull()
    expect(g.gameWinner).toBeNull()
    expect(g.gamePhase).toBe('playing')
    expect(g.onDeckPlayerId).toBe('opp')
    // Local hand reseeded from the fresh deal.
    expect(usePlayerStore.getState().hand.map(c => c.id)).toEqual(['hearts-7', 'spades-9'])
    controller.destroy()
  })

  it('records dry declarations as state for ticket 16 + pops a callout', () => {
    const controller = makeController(socket, scene)
    socket.fire('game:player_declared_dry', {
      playerId: 'opp',
      type: 'shown',
      isShown: true,
      card: { suit: 'hearts', rank: '6', id: 'hearts-6' },
    })
    expect(useGameStore.getState().dryDeclarations.opp).toEqual({
      isShown: true,
      card: { suit: 'hearts', rank: '6', id: 'hearts-6' },
    })
    expect(scene.callouts).toContain('SHOW DRY!')
    controller.destroy()
  })

  it('fires the configured comic callouts from the callout config (ticket 15)', () => {
    useGameStore.getState().initializeFromBackend(backendState())
    usePlayerStore.getState().setHand([{ suit: 'hearts', rank: '7', id: 'hearts-7' }])
    const controller = makeController(socket, scene)

    // Big-play beat on the local player's own card -> POW!
    socket.fire('cardPlayed', {
      playerId: 'me',
      card: { suit: 'hearts', rank: '7', id: 'hearts-7' },
      currentTurn: 'opp',
    })
    expect(scene.callouts).toContain('POW!')

    // Round win (no special effect) -> BOOM!
    socket.fire('roundWon', {
      winnerId: 'me',
      roundsWon: { me: 1, opp: 0 },
      isDry: false,
      isShowDry: false,
    })
    expect(scene.callouts).toContain('BOOM!')

    // A landed flag/challenge -> BUSTED!
    socket.fire('game:flag_resolved', { correct: true })
    expect(scene.callouts).toContain('BUSTED!')

    controller.destroy()
  })

  it('passes the authored callout STYLE through to the scene', () => {
    const styled: Array<{ text: string; fill?: string }> = []
    const styleScene = {
      ...makeScene(),
      showCallout(text: string, style?: { fill: string }) {
        styled.push({ text, fill: style?.fill })
      },
    }
    const controller = makeController(socket, styleScene)

    socket.fire('game:flag_resolved', { correct: true })
    // flagBusted is authored as a danger-filled callout.
    expect(styled).toContainEqual({ text: 'BUSTED!', fill: 'danger' })

    controller.destroy()
  })

  it('detaches all handlers and clears the play hook on destroy', () => {
    const controller = makeController(socket, scene)
    expect(socket.handlerCount('cardPlayed')).toBe(1)
    controller.destroy()
    expect(socket.handlerCount('cardPlayed')).toBe(0)
    expect(scene.onPlayCardRequested).toBeUndefined()
  })

  it('emits declare_dry / flag / restart through the contract', () => {
    const controller = makeController(socket, scene)
    controller.declareDry({ suit: 'hearts', rank: '6', id: 'hearts-6' }, false)
    controller.flagPlayer('opp', 0, 1)
    controller.restartGame()
    expect(socket.emitted).toEqual([
      {
        event: 'game:declare_dry',
        data: { card: { suit: 'hearts', rank: '6', id: 'hearts-6' }, isShown: false },
      },
      { event: 'game:flag_player', data: { targetPlayerId: 'opp', roundIndex: 0, cardIndex: 1 } },
      { event: 'game:restart', data: {} },
    ])
    controller.destroy()
  })
})

// Silence the intentional console.warn in onFlagError during the suite.
vi.spyOn(console, 'warn').mockImplementation(() => {})
