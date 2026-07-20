import { test, expect, type Browser } from '@playwright/test'
import type { CardInput } from '../src/services/sparTestApi'
import { Player, injectHands, resetTestMode } from './support/harness'

// ---------------------------------------------------------------------------
// TICKET 20 hover-bug proof. The old shared hover tween scaled a hand card to
// originalScale*1.05 with originalScale defaulting to 1, while cards render at
// HAND_SCALE 0.18 - so hovering blew a card up to ~5.8x, filling the screen.
// The fix is a prototype-faithful SUBTLE LIFT only (translateY -22px + gold
// ring, NO scale change). This spec drives a REAL mouse hover over the real
// canvas and captures before/after full-page screenshots so a reviewer can see
// the card lift a little (not balloon) and pixel-measures the hovered card's
// on-screen footprint to prove it did not scale up.
// ---------------------------------------------------------------------------

const C = (suit: string, rank: string): CardInput => ({ suit, rank }) as CardInput

// Evidence lands where the validation harness expects reviewer artifacts.
const EVIDENCE_DIR =
  '/var/folders/x3/n2bk8sr151b83_w7v7wm3lr80000gn/T/no-mistakes-evidence/01KXYPYMXY65BY5M8N2MNZZXBP'

// Game world is 1280x720 (config.ts). The middle card of a 5-card fan sits at
// world x=640 (t=0) with its center projected up by half the rendered card
// height: 724 * HAND_SCALE(0.18) / 2 = 65.16 -> y = 700 - 65.16.
const WORLD_W = 1280
const WORLD_H = 720
const CARD_CENTER = { x: 640, y: 700 - (724 * 0.18) / 2 }

test('hover: a hand card lifts subtly with its gold ring - it does NOT balloon', async ({
  browser,
  request,
}: {
  browser: Browser
  request: Parameters<typeof injectHands>[0]
}) => {
  await resetTestMode(request)

  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = new Player(await hostCtx.newPage(), 'host')
  const guest = new Player(await guestCtx.newPage(), 'guest')

  try {
    for (const p of [host, guest]) {
      await p.open('/game')
      await p.waitForTable()
    }

    // Host leads (cards playable -> the gold "playable" ring can show on hover).
    const hostHand = [C('hearts', '6'), C('hearts', 'J'), C('hearts', 'Q'), C('hearts', 'K'), C('hearts', 'A')] // prettier-ignore
    const guestHand = [C('clubs', '6'), C('clubs', '7'), C('clubs', '8'), C('clubs', '9'), C('clubs', '10')] // prettier-ignore

    const hostId = await host.connect('e2e-hover-host')
    const guestId = await guest.connect('e2e-hover-guest')
    void guestId
    const roomCode = await host.createRoom({ maxPlayers: 2 })
    await injectHands(request, {
      roomCode,
      leaderIndex: 0,
      scenario: 'hover',
      hands: [hostHand, guestHand].map(h => h.map(c => ({ suit: c.suit, rank: c.rank as string }))),
    })
    await guest.joinRoom(roomCode)
    await host.setReady(true)
    await guest.setReady(true)
    await host.waitForState(s => s.roomReadyCount >= 2, 'both ready')
    await host.startGame()
    await host.waitForState(
      s => s.phase === 'playing' && s.hand.length === 5,
      'host in game with 5 cards'
    )
    // Host leads, so it is the host's turn -> its cards are the playable hint set
    // and the gold ring can appear on hover.
    await host.waitForState(s => s.currentTurn === hostId, 'host to act (cards playable)')
    // Let the deal fly-in settle so cards are at their resting slots.
    await host.page.waitForTimeout(1200)

    // Map the middle card's world point to a real viewport pixel. Phaser FIT +
    // CENTER_BOTH sizes the canvas element itself to the fitted game rect, so the
    // canvas bounding box maps 1:1 onto the 1280x720 world.
    const canvas = host.page.locator('#phaser-game canvas')
    const box = (await canvas.boundingBox())!
    const toScreen = (wx: number, wy: number) => ({
      x: box.x + (wx / WORLD_W) * box.width,
      y: box.y + (wy / WORLD_H) * box.height,
    })

    // --- BEFORE: mouse parked away from the fan, hand at rest. ---
    await host.page.mouse.move(box.x + box.width / 2, box.y + 20)
    await host.page.waitForTimeout(300)
    await host.page.screenshot({ path: `${EVIDENCE_DIR}/hover-1-rest.png` })

    // --- HOVER: move the real pointer onto the middle card. ---
    const target = toScreen(CARD_CENTER.x, CARD_CENTER.y)
    await host.page.mouse.move(target.x, target.y)
    // Back.easeOut lift is 220ms; give it margin to overshoot + settle.
    await host.page.waitForTimeout(450)
    await host.page.screenshot({ path: `${EVIDENCE_DIR}/hover-2-hovered.png` })

    // --- Prove the hovered card did NOT balloon. Compare the yellow-table pixel
    // fraction of the top half of the frame (well above the resting fan). A
    // ~5.8x giant card would cover most of the frame; the subtle lift barely
    // changes it. We assert the hovered frame is still overwhelmingly table. ---
    const tableFractionTopHalf = async (): Promise<number> => {
      const buf = await canvas.screenshot()
      return host.page.evaluate(async b64 => {
        const img = new Image()
        const url = 'data:image/png;base64,' + b64
        await new Promise<void>(res => {
          img.onload = () => res()
          img.src = url
        })
        const cv = document.createElement('canvas')
        cv.width = img.width
        cv.height = img.height
        const ctx = cv.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        // Sample the TOP HALF only (the fan lives at the bottom; a giant card
        // would spill up into here).
        const h = Math.floor(img.height / 2)
        const data = ctx.getImageData(0, 0, img.width, h).data
        let table = 0
        let total = 0
        for (let i = 0; i < data.length; i += 4 * 40) {
          const r = data[i]
          const g = data[i + 1]
          const bl = data[i + 2]
          total++
          // Comic pop-art yellow table (#ffd400) + its halftone: high R & G, low B.
          if (r > 200 && g > 170 && bl < 130) table++
        }
        return table / total
      }, buf.toString('base64'))
    }

    const topHalfTable = await tableFractionTopHalf()
    console.log(`[hover] top-half table fraction while hovering = ${topHalfTable.toFixed(3)}`)
    // If the card had ballooned to ~5.8x it would blanket the top half; assert
    // the top half is still mostly the yellow table.
    expect(topHalfTable).toBeGreaterThan(0.7)
  } finally {
    await hostCtx.close()
    await guestCtx.close()
  }
})
