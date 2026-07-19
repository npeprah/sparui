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

/**
 * A single browser player: a Playwright Page whose app has installed
 * window.__sparTest. Wraps the driver so specs read like game actions.
 */
export class Player {
  constructor(
    public readonly page: Page,
    public readonly label: string
  ) {}

  /** Load the app and wait for window.__sparTest to be installed. */
  async open(): Promise<void> {
    await this.page.goto('/')
    await this.page.waitForFunction(() => Boolean(window.__sparTest?.ready))
  }

  /** Connect + authenticate over a real WebSocket; resolves with the playerId. */
  async connect(token: string): Promise<string> {
    const { playerId } = await this.page.evaluate(
      t => window.__sparTest.connect({ token: t }),
      token
    )
    return playerId
  }

  async createRoom(): Promise<string> {
    const { roomCode } = await this.page.evaluate(() => window.__sparTest.createRoom())
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

  async state(): Promise<SparTestSnapshot> {
    return this.page.evaluate(() => window.__sparTest.getState())
  }

  async hand(): Promise<SparTestSnapshot['hand']> {
    return this.page.evaluate(() => window.__sparTest.getMyHand())
  }

  /**
   * Poll the harness snapshot until `predicate` holds. This is the anti-flake
   * primitive: assertions wait on real state, never on fixed sleeps.
   */
  async waitForState(predicate: (s: SparTestSnapshot) => boolean, message?: string): Promise<void> {
    await expect
      .poll(async () => predicate(await this.state()), {
        message: message ?? `${this.label}: state condition`,
        timeout: 15_000,
      })
      .toBe(true)
  }
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
