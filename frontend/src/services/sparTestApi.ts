// ---------------------------------------------------------------------------
// window.__sparTest - test-only game driver for the Playwright e2e harness.
//
// This module exposes a small, stable API on `window.__sparTest` that drives
// REAL game actions through the full client -> WebSocket -> backend -> clients
// loop and records the resulting server events into a serializable snapshot the
// test can poll. It is deliberately built at the SERVICE/STORE layer (it wraps
// socketService and mirrors into gameStore) and registers its OWN socket
// subscriptions, so it is completely INDEPENDENT of the Phaser GameScene. The
// game scene is being rebuilt in a separate ticket; this API must survive that,
// so it must never reach into GameScene internals.
//
// GATING: installSparTestApi() is only ever called from main.tsx, and only
// inside a branch guarded by `import.meta.env.VITE_SPAR_TEST === 'true'`. That
// env flag is statically false in a normal `npm run build`, so Rollup drops the
// dynamic import and this module never ships in a production bundle. See the
// dead-code guard + dist grep in the e2e README.
// ---------------------------------------------------------------------------

import { socketService } from './socketService'
import { useGameStore } from '../store/gameStore'
import { usePlayerStore } from '../store/playerStore'
import type { Suit, Rank, Card, BackendGameState, LobbySettings } from '../store/types'
import type { FlagResolvedResponse, GameEndedResponse } from './wireContract'

// A card the caller may hand to playCard/declareDry. Either a full {suit, rank}
// pair, or a "suit-rank" id string like "hearts-A".
export interface CardInput {
  suit: Suit
  rank?: Rank
  value?: string
}

interface RecordedEvent {
  event: string
  data: unknown
  at: number
}

interface SnapshotPlayer {
  id: string
  username: string
  handCount: number
  score: number
  roundsWon: number
  matchScore: number
  winStreak: number
  isLeader: boolean
  isOnFire: boolean
}

interface PlayedCardSnapshot {
  playerId: string
  card: Card
}

export interface SparTestSnapshot {
  connected: boolean
  playerId: string | null
  roomCode: string | null
  phase: 'lobby' | 'playing' | 'finished'
  players: SnapshotPlayer[]
  hand: Card[]
  leaderId: string | null
  currentTurn: string | null
  ledSuit: string | null
  currentRound: number
  playedCards: PlayedCardSnapshot[]
  roomReadyCount: number
  lastRoundWon: RoundWonData | null
  gameEnded: GameEndedResponse | null
  flagResolved: FlagResolvedResponse | null
  fireStreakPlayer: string | null
  freezeTriggered: boolean
  errors: Array<{ event: string; error: string }>
}

interface RoundWonData {
  winnerId: string
  isDry?: boolean
  isShowDry?: boolean
  currentRound?: number
  gameOver?: boolean
  fireStreakPlayer?: string
  freezeTriggered?: boolean
}

export interface SparTestApi {
  readonly ready: true
  // Connection / identity
  connect(opts?: { token?: string; timeoutMs?: number }): Promise<{ playerId: string }>
  disconnect(): void
  getPlayerId(): string | null
  // Lobby (exposed for deterministic e2e setup; lobby chrome can also be DOM-driven)
  createRoom(
    settings?: Partial<LobbySettings>,
    timeoutMs?: number
  ): Promise<{ roomCode: string; hostId: string }>
  joinRoom(roomCode: string, timeoutMs?: number): Promise<{ roomCode: string }>
  setReady(isReady?: boolean): void
  startGame(): void
  // Game actions (REAL loop)
  playCard(card: CardInput | string): void
  declareDry(card: CardInput | string, isShown?: boolean): void
  flag(targetPlayerId: string, roundIndex?: number, cardIndex?: number): void
  restart(): void
  // State access for anti-flake polling
  getState(): SparTestSnapshot
  getMyHand(): Card[]
  getEvents(event?: string): RecordedEvent[]
  clearEvents(): void
}

const DEFAULT_TIMEOUT = 10000

// mapRankInput normalizes a rank/value string to the frontend Rank the backend
// also accepts on game:play_card (it maps rank->value server-side).
function toRank(value: string): Rank {
  const upper = value.toUpperCase()
  const known: Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  if ((known as string[]).includes(upper)) return upper as Rank
  // Accept backend words too.
  const map: Record<string, Rank> = { JACK: 'J', QUEEN: 'Q', KING: 'K', ACE: 'A' }
  return map[upper] ?? ('6' as Rank)
}

function parseCardInput(input: CardInput | string): { suit: Suit; rank: Rank } {
  if (typeof input === 'string') {
    // "hearts-A" or "hearts-10"
    const idx = input.indexOf('-')
    const suit = input.slice(0, idx) as Suit
    const rank = toRank(input.slice(idx + 1))
    return { suit, rank }
  }
  const rankSource = input.rank ?? input.value ?? '6'
  return { suit: input.suit, rank: toRank(String(rankSource)) }
}

class SparTestHarness implements SparTestApi {
  readonly ready = true as const

  private playerId: string | null = null
  private roomCode: string | null = null
  private hand: Card[] = []
  private players: SnapshotPlayer[] = []
  private leaderId: string | null = null
  private currentTurn: string | null = null
  private ledSuit: string | null = null
  private currentRound = 0
  private playedCards: PlayedCardSnapshot[] = []
  private roomReadyCount = 0
  private lastRoundWon: RoundWonData | null = null
  private gameEnded: GameEndedResponse | null = null
  private flagResolved: FlagResolvedResponse | null = null
  private fireStreakPlayer: string | null = null
  private freezeTriggered = false
  private errors: Array<{ event: string; error: string }> = []
  private events: RecordedEvent[] = []
  private subscribed = false

  install(): void {
    if (this.subscribed) return
    this.subscribed = true

    socketService.on('auth:success', data => {
      this.playerId = data.playerId
      // Establish the SAME local identity the menu chrome (HomePage) sets on
      // auth. The e2e harness drives the game directly on /game, bypassing the
      // menu, so without this the TableScene/TableGameController cannot identify
      // the local seat (empty playerId => no local hand, everyone an opponent).
      usePlayerStore.getState().setPlayerId(data.playerId)
      this.record('auth:success', data)
    })

    socketService.on('room:created', data => {
      this.roomCode = data.roomCode
      this.record('room:created', data)
    })

    socketService.on('room:player_joined', data => {
      this.roomCode = data.roomCode
      this.record('room:player_joined', data)
    })

    socketService.on('room:player_ready', data => {
      if (typeof data.players !== 'undefined') {
        this.roomReadyCount = data.players.filter(p => p.isReady).length
      }
      this.record('room:player_ready', data)
    })

    socketService.on('game:started', data => {
      this.applyGameStarted(data.gameState)
      this.record('game:started', data)
    })

    socketService.on('game:restarted', data => {
      this.applyGameStarted(data.gameState)
      this.record('game:restarted', data)
    })

    socketService.on('cardPlayed', data => {
      this.applyCardPlayed(data)
      this.record('cardPlayed', data)
    })

    socketService.on('roundWon', data => {
      this.lastRoundWon = data as RoundWonData
      if (data.fireStreakPlayer) this.fireStreakPlayer = data.fireStreakPlayer
      if (typeof data.freezeTriggered === 'boolean') this.freezeTriggered = data.freezeTriggered
      this.record('roundWon', data)
    })

    socketService.on('turnChanged', data => {
      this.currentTurn = data.currentPlayerId
      this.record('turnChanged', data)
    })

    socketService.on('timerUpdate', data => {
      this.record('timerUpdate', data)
    })

    socketService.on('gameEnded', data => {
      this.gameEnded = data
      this.record('gameEnded', data)
    })

    socketService.on('game:flag_resolved', data => {
      this.flagResolved = data
      this.record('game:flag_resolved', data)
    })

    socketService.on('game:flag_error', data => {
      this.errors.push({ event: 'game:flag_error', error: data.error })
      this.record('game:flag_error', data)
    })

    socketService.on('lobby:error', data => {
      this.errors.push({ event: 'lobby:error', error: data.error })
      this.record('lobby:error', data)
    })

    socketService.on('error', data => {
      this.errors.push({ event: 'error', error: data.error })
      this.record('error', data)
    })
  }

  private record(event: string, data: unknown): void {
    this.events.push({ event, data, at: Date.now() })
    if (this.events.length > 500) this.events.shift()
  }

  // applyGameStarted mirrors the authoritative backend snapshot into both the
  // harness state and the real gameStore, so assertions can read either.
  private applyGameStarted(gameState: BackendGameState): void {
    useGameStore.getState().initializeFromBackend(gameState)

    this.roomCode = gameState.roomCode
    this.leaderId = gameState.leaderId
    this.currentTurn = gameState.currentTurn
    this.currentRound = gameState.currentRound
    this.ledSuit = null
    this.playedCards = []
    this.lastRoundWon = null
    this.gameEnded = null
    this.flagResolved = null
    this.fireStreakPlayer =
      (gameState as unknown as { fireStreakPlayer?: string }).fireStreakPlayer || null
    this.freezeTriggered = false

    this.players = gameState.players.map(p => ({
      id: p.id,
      username: p.username,
      handCount: p.hand.length,
      score: p.score,
      roundsWon: p.roundsWon,
      matchScore: (p as unknown as { matchScore?: number }).matchScore ?? 0,
      winStreak: p.winStreak,
      isLeader: p.isLeader,
      isOnFire: p.isOnFire,
    }))

    const me = gameState.players.find(p => p.id === this.playerId)
    this.hand = me ? me.hand.map(normalizeCard) : []
  }

  private applyCardPlayed(data: {
    playerId: string
    card: Card
    ledSuit?: string | null
    currentTurn?: string
    playedCards?: Array<{ playerId: string; card: Card }>
  }): void {
    if (typeof data.currentTurn !== 'undefined') this.currentTurn = data.currentTurn
    if (typeof data.ledSuit !== 'undefined' && data.ledSuit !== null) {
      this.ledSuit = typeof data.ledSuit === 'string' ? data.ledSuit : this.ledSuit
    }

    if (Array.isArray(data.playedCards)) {
      this.playedCards = data.playedCards.map(pc => ({
        playerId: pc.playerId,
        card: normalizeCard(pc.card),
      }))
    } else {
      this.playedCards.push({ playerId: data.playerId, card: normalizeCard(data.card) })
    }

    // Keep the local hand in sync when it was our own card.
    if (data.playerId === this.playerId) {
      const played = normalizeCard(data.card)
      this.hand = this.hand.filter(c => !(c.suit === played.suit && c.rank === played.rank))
    }

    // Reflect the reduced hand count on the player snapshot too.
    this.players = this.players.map(p =>
      p.id === data.playerId ? { ...p, handCount: Math.max(0, p.handCount - 1) } : p
    )
  }

  // ---- API surface ----

  connect(opts?: { token?: string; timeoutMs?: number }): Promise<{ playerId: string }> {
    const token = opts?.token ?? `e2e-${Math.random().toString(36).slice(2)}`
    const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT
    const done = this.waitForEvent<{ playerId: string }>('auth:success', undefined, timeoutMs)
    socketService.connect(token)
    return done
  }

  disconnect(): void {
    socketService.disconnect()
  }

  getPlayerId(): string | null {
    return this.playerId
  }

  createRoom(
    settings?: Partial<LobbySettings>,
    timeoutMs = DEFAULT_TIMEOUT
  ): Promise<{ roomCode: string; hostId: string }> {
    const merged: LobbySettings = {
      pointsToWin: 10,
      surfaceTheme: 'poker',
      maxPlayers: 2,
      ...settings,
    }
    const done = this.waitForEvent<{ roomCode: string; hostId: string }>(
      'room:created',
      undefined,
      timeoutMs
    )
    socketService.emit('lobby:create', { settings: merged })
    return done
  }

  joinRoom(roomCode: string, timeoutMs = DEFAULT_TIMEOUT): Promise<{ roomCode: string }> {
    const done = this.waitForEvent<{ roomCode: string }>(
      'room:player_joined',
      data => (data as { roomCode: string }).roomCode === roomCode,
      timeoutMs
    )
    socketService.emit('lobby:join', { roomCode })
    return done
  }

  setReady(isReady = true): void {
    socketService.emit('lobby:ready', { isReady })
  }

  startGame(): void {
    socketService.emit('lobby:start_game', {})
  }

  playCard(card: CardInput | string): void {
    const { suit, rank } = parseCardInput(card)
    socketService.emit('game:play_card', { card: { suit, rank, id: `${suit}-${rank}` } })
  }

  declareDry(card: CardInput | string, isShown = false): void {
    const { suit, rank } = parseCardInput(card)
    socketService.emit('game:declare_dry', { card: { suit, rank, id: `${suit}-${rank}` }, isShown })
  }

  flag(targetPlayerId: string, roundIndex = 0, cardIndex = 0): void {
    socketService.emit('game:flag_player', { targetPlayerId, roundIndex, cardIndex })
  }

  restart(): void {
    socketService.emit('game:restart', {})
  }

  getMyHand(): Card[] {
    return [...this.hand]
  }

  getState(): SparTestSnapshot {
    const store = useGameStore.getState()
    let phase: SparTestSnapshot['phase'] = 'lobby'
    if (store.gamePhase === 'playing') phase = 'playing'
    else if (store.gamePhase === 'finished') phase = 'finished'

    return {
      connected: socketService.isConnected(),
      playerId: this.playerId,
      roomCode: this.roomCode,
      phase,
      players: this.players.map(p => ({ ...p })),
      hand: [...this.hand],
      leaderId: this.leaderId,
      currentTurn: this.currentTurn,
      ledSuit: this.ledSuit,
      currentRound: this.currentRound,
      playedCards: this.playedCards.map(pc => ({ ...pc })),
      roomReadyCount: this.roomReadyCount,
      lastRoundWon: this.lastRoundWon,
      gameEnded: this.gameEnded,
      flagResolved: this.flagResolved,
      fireStreakPlayer: this.fireStreakPlayer,
      freezeTriggered: this.freezeTriggered,
      errors: [...this.errors],
    }
  }

  getEvents(event?: string): RecordedEvent[] {
    if (!event) return [...this.events]
    return this.events.filter(e => e.event === event)
  }

  clearEvents(): void {
    this.events = []
    this.errors = []
  }

  private waitForEvent<T>(
    event: string,
    predicate: ((data: unknown) => boolean) | undefined,
    timeoutMs: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        socketService.off(event as never, handler as never)
        reject(new Error(`__sparTest: timed out waiting for "${event}"`))
      }, timeoutMs)

      const handler = (data: unknown) => {
        if (predicate && !predicate(data)) return
        clearTimeout(timer)
        socketService.off(event as never, handler as never)
        resolve(data as T)
      }

      socketService.on(event as never, handler as never)
    })
  }
}

function normalizeCard(card: { suit: Suit; rank?: Rank; value?: string; id?: string }): Card {
  const rank = card.rank ?? (card.value ? toRank(card.value) : ('6' as Rank))
  return { suit: card.suit, rank, id: card.id ?? `${card.suit}-${rank}` }
}

/**
 * Install the window.__sparTest driver. Idempotent. Called ONLY from a
 * test-mode-gated branch in main.tsx; never in a production build.
 */
export function installSparTestApi(): SparTestApi {
  const harness = new SparTestHarness()
  harness.install()
  ;(window as unknown as { __sparTest: SparTestApi }).__sparTest = harness
  console.info('[sparTest] window.__sparTest installed (SPAR_TEST_MODE)')
  return harness
}
