import type { Page, APIRequestContext } from '@playwright/test'
import { expect } from '@playwright/test'
import type { SparTestApi, SparTestSnapshot, CardInput } from '../../src/services/sparTestApi'

// Typed access to the test-only driver installed on window by the app when
// VITE_SPAR_TEST=true. Every helper below runs inside the page context.
declare global {
  interface Window {
    __sparTest: SparTestApi
  }
}

export const BACKEND_URL = 'http://localhost:8080'

// Key-beat screenshots for the SEPARATE human EK-feel review land here.
export const SHOT_DIR = 'e2e/artifacts/screenshots'

/** Reset the backend's injected-hand scenarios (call in beforeEach). */
export async function resetTestMode(request: APIRequestContext): Promise<void> {
  await request.post(`${BACKEND_URL}/test/reset`)
}

/**
 * A single browser player: a Playwright Page whose app has installed
 * window.__sparTest. Wraps the driver so specs read like game actions.
 */
export class Player {
  constructor(
    public readonly page: Page,
    public readonly label: string
  ) {}

  /**
   * Load the app at `path` and wait for window.__sparTest to be installed.
   *
   * The A-H acceptance runs open directly on `/game` so the REAL rebuilt
   * TableScene + TableGameController mount and render (the menu chrome is
   * bypassed; the harness establishes identity on auth). The ticket-11 smoke
   * uses the default `/` since it only exercises wire propagation.
   */
  async open(path = '/'): Promise<void> {
    await this.page.goto(path)
    await this.page.waitForFunction(() => Boolean(window.__sparTest?.ready))
  }

  /**
   * Wait until the real TableScene AND its TableGameController are fully wired
   * (the scene sets window.__tableSceneReady at the end of create() under
   * VITE_SPAR_TEST). Callers MUST await this before starting a game so the
   * controller cannot miss the first game:started that seeds the local hand.
   */
  async waitForTable(): Promise<void> {
    await this.page.waitForSelector('#phaser-game canvas', { timeout: 25_000 })
    await this.page.waitForFunction(
      () => (window as unknown as { __tableSceneReady?: boolean }).__tableSceneReady === true,
      undefined,
      { timeout: 25_000 }
    )
  }

  /** Capture a full-page screenshot into the acceptance artifacts directory. */
  async shot(name: string): Promise<void> {
    await this.page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: false })
  }

  /** Connect + authenticate over a real WebSocket; resolves with the playerId. */
  async connect(token: string): Promise<string> {
    const { playerId } = await this.page.evaluate(
      t => window.__sparTest.connect({ token: t }),
      token
    )
    return playerId
  }

  async createRoom(settings?: { maxPlayers?: 2 | 3 | 4 }): Promise<string> {
    const { roomCode } = await this.page.evaluate(
      s => window.__sparTest.createRoom(s ?? undefined),
      settings
    )
    return roomCode
  }

  async joinRoom(roomCode: string): Promise<void> {
    await this.page.evaluate(code => window.__sparTest.joinRoom(code), roomCode)
  }

  async setReady(isReady = true): Promise<void> {
    await this.page.evaluate(v => window.__sparTest.setReady(v), isReady)
  }

  async startGame(): Promise<void> {
    await this.page.evaluate(() => window.__sparTest.startGame())
  }

  async playCard(card: CardInput | string): Promise<void> {
    await this.page.evaluate(c => window.__sparTest.playCard(c), card)
  }

  async declareDry(card: CardInput | string, isShown = false): Promise<void> {
    await this.page.evaluate(
      ([c, s]) => window.__sparTest.declareDry(c as CardInput | string, s as boolean),
      [card, isShown] as const
    )
  }

  async flag(targetPlayerId: string): Promise<void> {
    await this.page.evaluate(t => window.__sparTest.flag(t), targetPlayerId)
  }

  async restart(): Promise<void> {
    await this.page.evaluate(() => window.__sparTest.restart())
  }

  async state(): Promise<SparTestSnapshot> {
    return this.page.evaluate(() => window.__sparTest.getState())
  }

  async hand(): Promise<SparTestSnapshot['hand']> {
    return this.page.evaluate(() => window.__sparTest.getMyHand())
  }

  /**
   * Raw recorded server events (optionally filtered by name), in arrival order.
   * Used for beat-precise assertions (e.g. the round-3 roundWon that ignites a
   * fire streak) that the coarse snapshot flattens.
   */
  async events(name?: string): Promise<Array<{ event: string; data: unknown; at: number }>> {
    return this.page.evaluate(n => window.__sparTest.getEvents(n), name)
  }

  /** Count how many times a server event has arrived (round tracking). */
  async eventCount(name: string): Promise<number> {
    return (await this.events(name)).length
  }

  /**
   * Poll the harness snapshot until `predicate` holds. This is the anti-flake
   * primitive: assertions wait on real state, never on fixed sleeps.
   */
  async waitForState(
    predicate: (s: SparTestSnapshot) => boolean,
    message?: string,
    timeout = 15_000
  ): Promise<void> {
    await expect
      .poll(async () => predicate(await this.state()), {
        message: message ?? `${this.label}: state condition`,
        timeout,
      })
      .toBe(true)
  }

  /** Poll until at least `n` events named `name` have arrived. */
  async waitForEventCount(name: string, n: number, timeout = 20_000): Promise<void> {
    await expect
      .poll(async () => this.eventCount(name), {
        message: `${this.label}: >=${n} "${name}" events`,
        timeout,
      })
      .toBeGreaterThanOrEqual(n)
  }
}

/** The recorded roundWon payload (superset of the harness snapshot's slice). */
export interface RoundWonEvent {
  winnerId: string
  roundsWon?: Record<string, number>
  isDry?: boolean
  isShowDry?: boolean
  currentRound?: number
  gameOver?: boolean
  fireStreakPlayer?: string
  freezeTriggered?: boolean
  frozenCard?: { suit: string; rank: string; id: string } | null
}

/**
 * Pin exact hands + opening leader for a room via the SPAR_TEST_MODE backend
 * hook. `hands` is one 5-card hand per seat (seat 0 = host). Cards accept either
 * backend value ("6", "jack") or frontend rank ("J").
 */
export async function injectHands(
  request: APIRequestContext,
  params: {
    roomCode: string
    leaderIndex?: number
    scenario?: string
    hands: Array<Array<{ suit: string; value?: string; rank?: string }>>
  }
): Promise<void> {
  const res = await request.post(`${BACKEND_URL}/test/inject-hands`, {
    data: {
      roomCode: params.roomCode,
      scenario: params.scenario ?? 'smoke',
      leaderIndex: params.leaderIndex ?? -1,
      hands: params.hands,
    },
  })
  if (!res.ok()) {
    throw new Error(`inject-hands failed: ${res.status()} ${await res.text()}`)
  }
}
