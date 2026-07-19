import { test, expect, type Browser } from '@playwright/test'
import type { CardInput } from '../src/services/sparTestApi'
import {
  Player,
  injectHands,
  resetTestMode,
  type RoundWonEvent,
  type SparTestSnapshot,
} from './support/harness'

// ---------------------------------------------------------------------------
// A-H ACCEPTANCE RUNS (ticket 17) - the real proof the rebuilt EK TableScene
// plays the FULL Spar ruleset in real browsers.
//
// Every run drives REAL actions through window.__sparTest (client -> WebSocket
// -> Go backend -> clients) against the REAL rebuilt scene mounted on /game,
// with DETERMINISTIC hands pinned via POST /test/inject-hands. Assertions poll
// authoritative state (never fixed sleeps). Key beats are screenshotted for the
// separate human EK-feel review.
//
// The corrected, owner-pinned rules under proof (see
// .scratch/spar-ek-playable/issues/04-e2e-acceptance-script.md):
//   - value scoring 6->3 / 7->2 / 8+->1, points only on the final (5th) round
//   - off-suit is legal; illegality is policed only by flagging
//   - a flag voids the whole game (offender OR challenger -3 match), reshuffles
//   - dry / show-dry bonus REPLACES the base score (6->6/7->4, 6->12/7->8)
//   - fire = 3 consecutive leader wins; an opponent break triggers freeze
//   - on turn-timer expiry the server auto-plays the lowest legal card
// ---------------------------------------------------------------------------

// A card the harness/backend both accept. Ranks are frontend form (6..10, JQKA).
const C = (suit: string, rank: string): CardInput => ({ suit, rank })

/** Is card (suit, rank) currently on the pile, played by player `id`? */
function cardIn(s: SparTestSnapshot, id: string, suit: string, rank: string): boolean {
  return s.playedCards.some(
    pc => pc.playerId === id && pc.card.suit === suit && pc.card.rank === rank
  )
}

/** Spin up `labels.length` real browser players, each on /game with the scene live. */
async function openPlayers(browser: Browser, labels: string[]): Promise<Player[]> {
  const players: Player[] = []
  for (const label of labels) {
    const ctx = await browser.newContext()
    const player = new Player(await ctx.newPage(), label)
    await player.open('/game')
    await player.waitForTable()
    players.push(player)
  }
  return players
}

async function closePlayers(players: Player[]): Promise<void> {
  for (const p of players) await p.page.context().close()
}

/**
 * Full deterministic room bring-up: connect every seat, inject the pinned hands,
 * join, ready up, start, and wait until every client is in the game with 5
 * cards. Returns the backend playerIds in seat order.
 */
async function startGame(
  players: Player[],
  request: Parameters<typeof injectHands>[0],
  hands: CardInput[][],
  leaderIndex: number,
  scenario: string
): Promise<string[]> {
  const [host, ...guests] = players
  const ids: string[] = []
  ids.push(await host.connect(`e2e-${scenario}-host`))
  for (let i = 0; i < guests.length; i++) {
    ids.push(await guests[i].connect(`e2e-${scenario}-g${i}`))
  }

  const roomCode = await host.createRoom({ maxPlayers: players.length })
  await injectHands(request, {
    roomCode,
    leaderIndex,
    scenario,
    hands: hands.map(h => h.map(c => ({ suit: c.suit, rank: c.rank as string }))),
  })

  for (const g of guests) await g.joinRoom(roomCode)
  for (const p of players) await p.setReady(true)
  await host.waitForState(
    s => s.roomReadyCount >= players.length,
    `host sees all ${players.length} ready`
  )

  await host.startGame()
  for (const p of players) {
    await p.waitForState(s => s.phase === 'playing' && s.hand.length === 5, `${p.label} in game`)
  }
  return ids
}

/** Play a card as `player` and wait until the backend echoes it onto the pile. */
async function play(player: Player, id: string, card: CardInput): Promise<void> {
  await player.playCard(card)
  await player.waitForState(
    s => cardIn(s, id, card.suit, card.rank as string),
    `${player.label} played ${card.suit}-${card.rank}`
  )
}

/** The recorded roundWon events for a player, newest last. */
async function roundWons(player: Player): Promise<RoundWonEvent[]> {
  return (await player.events('roundWon')).map(e => e.data as RoundWonEvent)
}

// ===========================================================================
// RUN A - clean full 2-player game to game-over (the spine)
// ===========================================================================
test('A: clean 2-player game plays five rounds to a scored game-over', async ({
  browser,
  request,
}) => {
  await resetTestMode(request)
  const players = await openPlayers(browser, ['host', 'guest'])
  const [host, guest] = players
  try {
    // Host holds all hearts (wins every round); guest holds clubs (never follows
    // suit). Host opens each round; round 5 is won with the 6 of hearts -> 3 pts.
    const hostHand = [C('hearts', '6'), C('hearts', 'J'), C('hearts', 'Q'), C('hearts', 'K'), C('hearts', 'A')] // prettier-ignore
    const guestHand = [C('clubs', '6'), C('clubs', '7'), C('clubs', '8'), C('clubs', '9'), C('clubs', '10')] // prettier-ignore
    const [hostId, guestId] = await startGame(
      players,
      request,
      [hostHand, guestHand],
      0,
      'clean-2p'
    )

    expect((await host.state()).leaderId).toBe(hostId)
    await host.shot('A1-deal')

    // Host opens each round with a descending hearts card; round 5 uses the 6.
    const hostByRound = ['A', 'K', 'Q', 'J', '6']
    const guestByRound = ['10', '9', '8', '7', '6']
    for (let round = 0; round < 5; round++) {
      await play(host, hostId, C('hearts', hostByRound[round]))
      if (round === 0) await host.shot('A2-play-to-pile')
      await play(guest, guestId, C('clubs', guestByRound[round]))
      await host.waitForEventCount('roundWon', round + 1)
      if (round === 0) await host.shot('A3-round-win')
    }

    // Every round went to the host on the led (hearts) suit.
    const wons = await roundWons(host)
    expect(wons).toHaveLength(5)
    expect(wons.every(w => w.winnerId === hostId)).toBe(true)

    // Game over: value scoring on the final round (6 of hearts -> 3), host wins.
    await host.waitForState(s => s.gameEnded !== null, 'host sees game over')
    await guest.waitForState(s => s.gameEnded !== null, 'guest sees game over')
    await host.shot('A4-game-over')

    const ended = (await host.state()).gameEnded!
    expect(ended.winnerId).toBe(hostId)
    expect(ended.finalRoundsWon[hostId]).toBe(5)
    expect(ended.finalRoundsWon[guestId]).toBe(0)
    expect(ended.winnerScore).toBe(3) // 6 -> 3 value scoring
  } finally {
    await closePlayers(players)
  }
})

// ===========================================================================
// RUN B - correct flag: an illegal off-suit-while-holding play is flagged
// ===========================================================================
test('B: a correct flag penalizes the offender -3 and voids the game', async ({
  browser,
  request,
}) => {
  await resetTestMode(request)
  const players = await openPlayers(browser, ['host', 'guest'])
  const [host, guest] = players
  try {
    // Guest HOLDS the led suit (hearts 6) but breaks it with a club -> illegal.
    const hostHand = [C('hearts', 'A'), C('hearts', 'K'), C('hearts', 'Q'), C('hearts', 'J'), C('hearts', '10')] // prettier-ignore
    const guestHand = [C('hearts', '6'), C('clubs', '6'), C('clubs', '7'), C('clubs', '8'), C('clubs', '9')] // prettier-ignore
    const [hostId, guestId] = await startGame(
      players,
      request,
      [hostHand, guestHand],
      0,
      'flag-correct'
    )

    await play(host, hostId, C('hearts', 'A')) // led suit = hearts
    await play(guest, guestId, C('clubs', '6')) // off-suit while holding hearts 6

    // Host flags the guest's illegal break.
    await host.flag(guestId)
    await host.waitForState(s => s.flagResolved !== null, 'host sees flag resolved')
    const resolved = (await host.state()).flagResolved!
    await host.shot('B1-flag-reveal')

    expect(resolved.correct).toBe(true)
    expect(resolved.accusedId).toBe(guestId)
    expect(resolved.penalizedId).toBe(guestId)
    expect(resolved.penalty).toBe(3)
    expect(resolved.matchScores[guestId]).toBe(-3)
    expect(resolved.voided).toBe(true)
    // The accused's remaining hand is revealed on resolution.
    expect(resolved.revealedHand.length).toBeGreaterThan(0)

    // A fresh reshuffled game auto-starts; the match penalty persists.
    await host.waitForEventCount('game:started', 2)
    await host.waitForState(
      s => s.phase === 'playing' && s.hand.length === 5,
      'host in the fresh voided-flag game'
    )
    const guestSeat = (await host.state()).players.find(p => p.id === guestId)!
    expect(guestSeat.matchScore).toBe(-3)
  } finally {
    await closePlayers(players)
  }
})

// ===========================================================================
// RUN C - wrong flag: a legal off-suit play (accused held no led suit) flagged
// ===========================================================================
test('C: a wrong flag penalizes the challenger -3 and voids the game', async ({
  browser,
  request,
}) => {
  await resetTestMode(request)
  const players = await openPlayers(browser, ['host', 'guest'])
  const [host, guest] = players
  try {
    // Guest has NO hearts, so playing a club off the hearts lead is fully legal.
    const hostHand = [C('hearts', 'A'), C('hearts', 'K'), C('hearts', 'Q'), C('hearts', 'J'), C('hearts', '10')] // prettier-ignore
    const guestHand = [C('clubs', '6'), C('clubs', '7'), C('clubs', '8'), C('clubs', '9'), C('clubs', '10')] // prettier-ignore
    const [hostId, guestId] = await startGame(
      players,
      request,
      [hostHand, guestHand],
      0,
      'flag-wrong'
    )

    await play(host, hostId, C('hearts', 'A'))
    await play(guest, guestId, C('clubs', '6')) // legal: guest holds no hearts

    await host.flag(guestId) // a bad accusation
    await host.waitForState(s => s.flagResolved !== null, 'host sees flag resolved')
    const resolved = (await host.state()).flagResolved!

    expect(resolved.correct).toBe(false)
    expect(resolved.penalizedId).toBe(hostId) // the challenger eats the penalty
    expect(resolved.penalty).toBe(3)
    expect(resolved.matchScores[hostId]).toBe(-3)
    expect(resolved.voided).toBe(true)

    await host.waitForEventCount('game:started', 2)
    const hostSeat = (await host.state()).players.find(p => p.id === hostId)!
    expect(hostSeat.matchScore).toBe(-3)
  } finally {
    await closePlayers(players)
  }
})

// ===========================================================================
// RUN D - timer-expiry auto-play: idle seats are auto-played the lowest legal
// ===========================================================================
test('D: idle seats auto-play their lowest legal card and play continues', async ({
  browser,
  request,
}) => {
  test.setTimeout(90_000) // waits out the real 15s leader + 8s follower timers
  await resetTestMode(request)
  const players = await openPlayers(browser, ['host', 'guest'])
  const [host, guest] = players
  try {
    const hostHand = [C('hearts', '6'), C('hearts', 'J'), C('hearts', 'Q'), C('hearts', 'K'), C('hearts', 'A')] // prettier-ignore
    const guestHand = [C('clubs', '6'), C('clubs', '7'), C('clubs', '8'), C('clubs', '9'), C('clubs', '10')] // prettier-ignore
    const [hostId, guestId] = await startGame(
      players,
      request,
      [hostHand, guestHand],
      0,
      'timer-expiry'
    )

    // Leader idles: the server must auto-OPEN with the lowest card (hearts 6) to
    // set the suit. Nobody calls playCard here.
    await host.waitForState(
      s => cardIn(s, hostId, 'hearts', '6') && s.ledSuit === 'hearts',
      'server auto-opened for the idle leader',
      30_000
    )

    // On-deck follower idles: server auto-plays its lowest card (no hearts held
    // -> clubs 6). Again nobody calls playCard.
    await guest.waitForState(
      s => cardIn(s, guestId, 'clubs', '6'),
      'server auto-played for the idle follower',
      20_000
    )

    // Play continued: the round resolved to a winner on its own.
    await host.waitForEventCount('roundWon', 1)
    const wons = await roundWons(host)
    expect(wons[0].winnerId).toBe(hostId) // hearts 6 was the only led-suit card
  } finally {
    await closePlayers(players)
  }
})

// ===========================================================================
// RUN E - dry: a hidden 6/7 declared at start, won on the final round
// ===========================================================================
test('E: a dry declaration replaces the final-round base score with its bonus', async ({
  browser,
  request,
}) => {
  await resetTestMode(request)
  const players = await openPlayers(browser, ['host', 'guest'])
  const [host, guest] = players
  try {
    const hostHand = [C('hearts', '6'), C('hearts', 'J'), C('hearts', 'Q'), C('hearts', 'K'), C('hearts', 'A')] // prettier-ignore
    const guestHand = [C('clubs', '6'), C('clubs', '7'), C('clubs', '8'), C('clubs', '9'), C('clubs', '10')] // prettier-ignore
    const [hostId, guestId] = await startGame(players, request, [hostHand, guestHand], 0, 'dry')

    // Declare the 6 of hearts DRY (face-down) before opening round 1.
    await host.declareDry(C('hearts', '6'), false)
    await guest.waitForState(
      s => s.playedCards.length === 0, // still pre-play; declaration is separate
      'guest observed pre-play state'
    )
    await host.shot('E1-dry-declared')

    // Host wins every round; the declared 6 is played (and wins) on round 5.
    const hostByRound = ['A', 'K', 'Q', 'J', '6']
    const guestByRound = ['10', '9', '8', '7', '6']
    for (let round = 0; round < 5; round++) {
      await play(host, hostId, C('hearts', hostByRound[round]))
      await play(guest, guestId, C('clubs', guestByRound[round]))
      await host.waitForEventCount('roundWon', round + 1)
    }

    const wons = await roundWons(host)
    expect(wons[4].winnerId).toBe(hostId)
    expect(wons[4].isDry).toBe(true) // the final round was won by the dry card

    await host.waitForState(s => s.gameEnded !== null, 'host sees game over')
    const ended = (await host.state()).gameEnded!
    expect(ended.winnerId).toBe(hostId)
    expect(ended.winnerScore).toBe(6) // dry 6 -> 6 REPLACES the base 3
    void guestId
  } finally {
    await closePlayers(players)
  }
})

// ===========================================================================
// RUN F - show-dry: a face-up 6/7 declared at start, won on the final round
// ===========================================================================
test('F: a show-dry declaration applies the doubled bonus on the final round', async ({
  browser,
  request,
}) => {
  await resetTestMode(request)
  const players = await openPlayers(browser, ['host', 'guest'])
  const [host, guest] = players
  try {
    const hostHand = [C('hearts', '6'), C('hearts', 'J'), C('hearts', 'Q'), C('hearts', 'K'), C('hearts', 'A')] // prettier-ignore
    const guestHand = [C('clubs', '6'), C('clubs', '7'), C('clubs', '8'), C('clubs', '9'), C('clubs', '10')] // prettier-ignore
    const [hostId, guestId] = await startGame(
      players,
      request,
      [hostHand, guestHand],
      0,
      'show-dry'
    )

    // Declare the 6 of hearts SHOW-DRY (face-up) before opening round 1.
    await host.declareDry(C('hearts', '6'), true)
    await host.shot('F1-show-dry-declared')

    const hostByRound = ['A', 'K', 'Q', 'J', '6']
    const guestByRound = ['10', '9', '8', '7', '6']
    for (let round = 0; round < 5; round++) {
      await play(host, hostId, C('hearts', hostByRound[round]))
      await play(guest, guestId, C('clubs', guestByRound[round]))
      await host.waitForEventCount('roundWon', round + 1)
    }

    const wons = await roundWons(host)
    expect(wons[4].winnerId).toBe(hostId)
    expect(wons[4].isShowDry).toBe(true)

    await host.waitForState(s => s.gameEnded !== null, 'host sees game over')
    const ended = (await host.state()).gameEnded!
    expect(ended.winnerScore).toBe(12) // show-dry 6 -> 12 REPLACES the base 3
    void guestId
  } finally {
    await closePlayers(players)
  }
})

// ===========================================================================
// RUN G - fire streak + freeze
// ===========================================================================
test('G: three leader wins ignite a fire streak that an opponent then freezes', async ({
  browser,
  request,
}) => {
  await resetTestMode(request)
  const players = await openPlayers(browser, ['host', 'guest'])
  const [host, guest] = players
  try {
    // Host wins rounds 1-3 as leader (fire ignites on the 3rd). On round 4 the
    // on-fire host OPENS with a low club and the guest beats it -> freeze.
    const hostHand = [C('hearts', 'A'), C('hearts', 'K'), C('hearts', 'Q'), C('hearts', 'J'), C('clubs', '6')] // prettier-ignore
    const guestHand = [C('clubs', '9'), C('clubs', '10'), C('clubs', 'J'), C('clubs', 'K'), C('clubs', 'Q')] // prettier-ignore
    const [hostId, guestId] = await startGame(
      players,
      request,
      [hostHand, guestHand],
      0,
      'fire-freeze'
    )

    // Rounds 1-3: host leads hearts, guest can't follow -> host wins each.
    const hostR = ['A', 'K', 'Q']
    const guestR = ['9', '10', 'J']
    for (let round = 0; round < 3; round++) {
      await play(host, hostId, C('hearts', hostR[round]))
      await play(guest, guestId, C('clubs', guestR[round]))
      await host.waitForEventCount('roundWon', round + 1)
    }
    let wons = await roundWons(host)
    expect(wons[2].fireStreakPlayer).toBe(hostId) // fire ignites on the 3rd win
    await host.waitForState(s => s.fireStreakPlayer === hostId, 'host is on fire')
    await host.shot('G1-fire')

    // Round 4: on-fire host opens the low club; guest's higher club wins ->
    // breaks the streak -> freeze.
    await play(host, hostId, C('clubs', '6'))
    await play(guest, guestId, C('clubs', 'K'))
    await host.waitForEventCount('roundWon', 4)

    wons = await roundWons(host)
    expect(wons[3].winnerId).toBe(guestId) // opponent broke the streak
    expect(wons[3].freezeTriggered).toBe(true)
    await host.waitForState(s => s.freezeTriggered === true, 'freeze triggered')
    await host.shot('G2-freeze')
  } finally {
    await closePlayers(players)
  }
})

// ===========================================================================
// RUN H - 3-player smoke: a room of three plays cleanly to game-over
// ===========================================================================
test('H: a 3-player room deals, plays five rounds and reaches game-over', async ({
  browser,
  request,
}) => {
  await resetTestMode(request)
  const players = await openPlayers(browser, ['host', 'p2', 'p3'])
  const [host, p2, p3] = players
  try {
    // Host holds hearts (wins every round); the two followers hold clubs and
    // diamonds. This exercises the subsequent-follower 5s tier + two opponent
    // fans rendering for every seat.
    const hostHand = [C('hearts', '6'), C('hearts', 'J'), C('hearts', 'Q'), C('hearts', 'K'), C('hearts', 'A')] // prettier-ignore
    const p2Hand = [C('clubs', '6'), C('clubs', '7'), C('clubs', '8'), C('clubs', '9'), C('clubs', '10')] // prettier-ignore
    const p3Hand = [C('diamonds', '6'), C('diamonds', '7'), C('diamonds', '8'), C('diamonds', '9'), C('diamonds', '10')] // prettier-ignore
    const [hostId, p2Id, p3Id] = await startGame(
      players,
      request,
      [hostHand, p2Hand, p3Hand],
      0,
      '3p-smoke'
    )
    await host.shot('H1-three-player-deal')

    const hostByRound = ['A', 'K', 'Q', 'J', '6']
    const p2ByRound = ['10', '9', '8', '7', '6']
    const p3ByRound = ['10', '9', '8', '7', '6']
    for (let round = 0; round < 5; round++) {
      await play(host, hostId, C('hearts', hostByRound[round]))
      await play(p2, p2Id, C('clubs', p2ByRound[round]))
      await play(p3, p3Id, C('diamonds', p3ByRound[round]))
      await host.waitForEventCount('roundWon', round + 1)
    }

    await host.waitForState(s => s.gameEnded !== null, 'host sees 3p game over')
    await p3.waitForState(s => s.gameEnded !== null, 'p3 sees 3p game over')
    const ended = (await host.state()).gameEnded!
    expect(ended.winnerId).toBe(hostId)
    expect(ended.finalRoundsWon[hostId]).toBe(5)
    expect(ended.finalRoundsWon[p2Id]).toBe(0)
    expect(ended.finalRoundsWon[p3Id]).toBe(0)
    expect(ended.winnerScore).toBe(3)
  } finally {
    await closePlayers(players)
  }
})
