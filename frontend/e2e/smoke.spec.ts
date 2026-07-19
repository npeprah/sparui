import { test, expect } from '@playwright/test'
import { Player, injectHands } from './support/harness'

// ---------------------------------------------------------------------------
// SMOKE: the whole loop, end to end, in two real browser contexts.
//
// Proves: two players connect over real WebSockets, create + join a room, the
// host starts a game with DETERMINISTIC injected hands, the leader plays a card,
// and the play propagates to BOTH clients (client -> WS -> backend -> clients).
//
// This is ticket 11's single acceptance smoke. The A-H acceptance runs are
// ticket 17's job, written against the rebuilt scene using the same
// window.__sparTest API + injectHands hook exercised here.
// ---------------------------------------------------------------------------

// Seat 0 (host) holds a hearts hand; seat 1 (joiner) holds clubs. leaderIndex 0
// makes the host the opening leader, so we know exactly who may open and with
// which card.
const HANDS = [
  [
    { suit: 'hearts', rank: 'A' },
    { suit: 'hearts', rank: 'K' },
    { suit: 'hearts', rank: 'Q' },
    { suit: 'hearts', rank: 'J' },
    { suit: 'hearts', value: '10' },
  ],
  [
    { suit: 'clubs', value: '6' },
    { suit: 'clubs', value: '7' },
    { suit: 'clubs', value: '8' },
    { suit: 'clubs', value: '9' },
    { suit: 'clubs', value: '10' },
  ],
]

test('two players: create, join, start with injected hands, play propagates to both', async ({
  browser,
  request,
}) => {
  // Two isolated browser contexts = two independent players.
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const host = new Player(await ctxA.newPage(), 'host')
  const guest = new Player(await ctxB.newPage(), 'guest')

  try {
    await host.open()
    await guest.open()

    const hostId = await host.connect('e2e-host-token')
    const guestId = await guest.connect('e2e-guest-token')
    expect(hostId).not.toBe(guestId)

    // Host creates the room; inject deterministic hands BEFORE starting.
    const roomCode = await host.createRoom()
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/)

    await injectHands(request, { roomCode, leaderIndex: 0, hands: HANDS })

    // Guest joins; both ready up; host waits until it can see both ready.
    await guest.joinRoom(roomCode)
    await host.setReady(true)
    await guest.setReady(true)
    await host.waitForState(s => s.roomReadyCount >= 2, 'host sees both players ready')

    // Host starts the game.
    await host.startGame()

    // Both clients receive game:started with the injected hands.
    await host.waitForState(s => s.phase === 'playing' && s.hand.length === 5, 'host in game')
    await guest.waitForState(s => s.phase === 'playing' && s.hand.length === 5, 'guest in game')

    const hostState = await host.state()
    const guestState = await guest.state()

    // Deterministic hands landed on the right seats.
    expect(hostState.hand.map(c => `${c.suit}-${c.rank}`).sort()).toEqual(
      ['hearts-10', 'hearts-A', 'hearts-J', 'hearts-K', 'hearts-Q'].sort()
    )
    expect(guestState.hand.every(c => c.suit === 'clubs')).toBe(true)

    // Host is the pinned opening leader.
    expect(hostState.leaderId).toBe(hostId)
    expect(guestState.leaderId).toBe(hostId)

    // Leader opens the round with the Ace of hearts.
    await host.playCard({ suit: 'hearts', rank: 'A' })

    // The play propagates to BOTH clients (the core assertion).
    const sawAceOfHearts = (s: Awaited<ReturnType<typeof host.state>>) =>
      s.playedCards.some(
        pc => pc.playerId === hostId && pc.card.suit === 'hearts' && pc.card.rank === 'A'
      )
    await host.waitForState(sawAceOfHearts, 'host sees its own played card')
    await guest.waitForState(sawAceOfHearts, 'guest sees the leader played card')

    // Led suit + turn advanced to the guest on both clients.
    await host.waitForState(s => s.ledSuit === 'hearts' && s.currentTurn === guestId)
    await guest.waitForState(s => s.ledSuit === 'hearts' && s.currentTurn === guestId)

    // Leader's hand shrank by the played card.
    await host.waitForState(s => s.hand.length === 4 && !s.hand.some(c => c.rank === 'A'))
  } finally {
    await ctxA.close()
    await ctxB.close()
  }
})
