// ---------------------------------------------------------------------------
// TableGameController - turn/round/timer/dry/flag/play-again orchestration (t.14)
//
// The new TableScene is a pure renderer of store state; it owns NO game logic.
// This controller is the orchestration layer that sits between the WebSocket
// wire, the Zustand stores, and the scene's thin hooks. It:
//
//   - attaches every in-game socket handler DETERMINISTICALLY at construction,
//     regardless of connection state (fixing the listener-attach race - see
//     below), and detaches them all on destroy();
//   - wires the scene's onPlayCardRequested to a real play, gated by the
//     turn-affordance state machine (never by suit - off-suit stays legal);
//   - drives the countdown ring total from the server timer (timerUpdate);
//   - performs a clean, single-call play-again re-init from backend state;
//   - lands dry/show-dry and flag outcomes into the store + callouts.
//
// All non-trivial decisions are delegated to the pure helpers in
// tableOrchestration.ts (unit tested). This class is the imperative glue and is
// exercised end-to-end by the ticket-11 Playwright harness.
//
// LISTENER RACE FIX: the old GameScene called setupWebSocketListeners() inside
// create() and RETURNED EARLY when the socket was not yet connected, leaving the
// table permanently inert on a straight nav to /game or a reconnect-in-flight.
// socketService.on() merely registers a handler in a map and fires whenever the
// event later arrives, so we register unconditionally here - there is nothing to
// race against.
// ---------------------------------------------------------------------------

import type { Card, Suit } from '../../store/types'
import type { ServerToClientEvents } from '../../services/wireContract'
import { socketService } from '../../services/socketService'
import { useGameStore } from '../../store/gameStore'
import { usePlayerStore } from '../../store/playerStore'
import {
  computeAffordance,
  computeStreaks,
  deriveRestart,
  deriveTurnTotal,
} from './tableOrchestration'
import { resolveCallout, type CalloutEvent, type CalloutStyle } from '../config/callouts'
import type { SoundKey } from '../../services/audioManager'

/** The slice of the scene the controller drives. TableScene implements this. */
export interface TableSceneHooks {
  onPlayCardRequested?: (card: Card) => void
  showCallout(text: string, style?: CalloutStyle): void
  setTurnTotal(seconds: number): void
  playSound(key: SoundKey): void
}

/** How long the round-win beat holds before the pile clears and the next round starts. */
const ROUND_WIN_HOLD_MS = 2000

type SocketService = Pick<typeof socketService, 'on' | 'off' | 'emit' | 'isConnected'>

export class TableGameController {
  private readonly scene: TableSceneHooks
  private readonly socket: SocketService
  private readonly game: typeof useGameStore
  private readonly player: typeof usePlayerStore

  /** Registered socket handlers, kept so destroy() can detach exactly these. */
  private readonly handlers = new Map<string, (data: unknown) => void>()
  private readonly unsubscribers: Array<() => void> = []
  private roundWinTimer: ReturnType<typeof setTimeout> | null = null
  private destroyed = false

  constructor(
    scene: TableSceneHooks,
    deps: {
      socket?: SocketService
      gameStore?: typeof useGameStore
      playerStore?: typeof usePlayerStore
    } = {}
  ) {
    this.scene = scene
    this.socket = deps.socket ?? socketService
    this.game = deps.gameStore ?? useGameStore
    this.player = deps.playerStore ?? usePlayerStore

    this.scene.onPlayCardRequested = card => this.handlePlayIntent(card)

    this.registerSocketHandlers()
    this.subscribeToStores()
    this.refreshAffordance()
  }

  /**
   * Fire a comic callout for a game event. The word + style come from the
   * designer-authored config (`game/config/callouts.ts`); the scene renders the
   * style against the active palette. This is the single place events turn into
   * banners, so the words/timing stay data-driven and editable without code.
   */
  private fireCallout(event: CalloutEvent): void {
    const spec = resolveCallout(event)
    this.scene.showCallout(spec.word, spec.style)
  }

  // =========================================================================
  // local play intent (card click / drag-up from the scene)
  // =========================================================================

  /**
   * The scene reports a play intent for a card. We consult the affordance state
   * machine: if the player may play, we emit the authoritative play_card and let
   * the server echo (cardPlayed) drive the store. Off-suit is never rejected
   * here - the only gate is turn/round legality. An illegal moment is a no-op
   * with a gentle callout (the backend also rejects harmlessly).
   */
  handlePlayIntent(card: Card): void {
    const affordance = this.currentAffordance()
    if (!affordance.canPlay) {
      if (affordance.reason === 'awaiting-leader') {
        this.fireCallout('wait')
        // Pre-leader rejection: a follower tried to open the trick early.
        this.scene.playSound('sound:invalid_move')
      }
      return
    }
    this.socket.emit('game:play_card', { card })
  }

  /** Declare a dry (face-down) or show-dry (face-up) low card. Round 1 only. */
  declareDry(card: Card, isShown: boolean): void {
    this.socket.emit('game:declare_dry', { card, isShown })
  }

  /** Flag a suspected illegal move by another player. */
  flagPlayer(targetPlayerId: string, roundIndex: number, cardIndex: number): void {
    this.socket.emit('game:flag_player', { targetPlayerId, roundIndex, cardIndex })
  }

  /** Ask the host/server for a clean fresh game. */
  restartGame(): void {
    this.socket.emit('game:restart', {})
  }

  // =========================================================================
  // affordance - keep playerStore.canPlay / isMyTurn in sync with the rules
  // =========================================================================

  private currentAffordance() {
    const g = this.game.getState()
    const localId = this.player.getState().playerId
    return computeAffordance({
      localPlayerId: localId,
      leaderId: g.leaderId,
      currentSuit: (g.currentSuit as Suit | null) ?? null,
      hand: this.player.getState().hand,
      playedCount: g.playedCards.size,
      localHasPlayed: g.playedCards.has(localId),
      gamePhase: g.gamePhase,
    })
  }

  private refreshAffordance(): void {
    const affordance = this.currentAffordance()
    const localId = this.player.getState().playerId
    const onDeck = this.game.getState().onDeckPlayerId
    this.player.getState().setCanPlay(affordance.canPlay)
    this.player.getState().setIsMyTurn(onDeck !== null && onDeck === localId)
  }

  // =========================================================================
  // socket handlers
  // =========================================================================

  private registerSocketHandlers(): void {
    this.register('cardPlayed', data => this.onCardPlayed(data))
    this.register('turnChanged', data => this.onTurnChanged(data))
    this.register('timerUpdate', data => this.onTimerUpdate(data))
    this.register('roundWon', data => this.onRoundWon(data))
    this.register('gameEnded', data => this.onGameEnded(data))
    this.register('game:restarted', data => this.onReinit(data.gameState))
    this.register('game:started', data => this.onReinit(data.gameState))
    this.register('game:player_declared_dry', data => this.onPlayerDeclaredDry(data))
    this.register('game:flag_resolved', data => this.onFlagResolved(data))
    this.register('game:flag_error', data => this.onFlagError(data))
    this.register('game:dry_error', data => this.onFlagError(data))
  }

  private register<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    this.socket.on(event, handler)
    this.handlers.set(event as string, handler as (data: unknown) => void)
  }

  private onCardPlayed(data: Parameters<ServerToClientEvents['cardPlayed']>[0]): void {
    const { playerId, card, currentTurn } = data
    this.game.getState().playCard(playerId, card)
    this.scene.playSound('sound:card_play')

    // Local player's own card is authoritative-removed from the hand on echo.
    if (playerId === this.player.getState().playerId) {
      this.player.getState().removeCardFromHand(card.id)
      // Big-play beat: pop the "POW!" callout when the local player slams a card.
      this.fireCallout('bigPlay')
    }

    // Shrink the player's stored hand so opponent card-back fans lose a card as
    // they play. Full state is only re-sent on start/restart; during a round the
    // only signal is this event, so we decrement here. Remove the exact card
    // when we hold it (unredacted hands), else drop one to keep the count right.
    const player = this.game.getState().players.find(p => p.id === playerId)
    if (player?.hand && player.hand.length > 0) {
      const nextHand = player.hand.some(c => c.id === card.id)
        ? player.hand.filter(c => c.id !== card.id)
        : player.hand.slice(0, -1)
      this.game.getState().updatePlayer(playerId, { hand: nextHand })
    }

    if (currentTurn) {
      this.game.getState().setOnDeckPlayer(currentTurn)
    }
    this.refreshAffordance()
  }

  private onTurnChanged(data: Parameters<ServerToClientEvents['turnChanged']>[0]): void {
    const { currentPlayerId, timeRemaining } = data
    this.game.getState().setOnDeckPlayer(currentPlayerId)
    // turnChanged carries only the opening value; treat it as this seat's total.
    if (timeRemaining > 0) {
      this.scene.setTurnTotal(timeRemaining)
    }
    this.game.getState().startTurnCountdown(timeRemaining)
    this.refreshAffordance()
  }

  private onTimerUpdate(data: Parameters<ServerToClientEvents['timerUpdate']>[0]): void {
    const prevTotal = this.game.getState().timeRemaining
    const total = deriveTurnTotal(data, prevTotal)
    this.scene.setTurnTotal(total)
    this.game.getState().setOnDeckPlayer(data.playerId)
    this.game.getState().startTurnCountdown(data.secondsRemaining)
    this.refreshAffordance()
  }

  private onRoundWon(data: Parameters<ServerToClientEvents['roundWon']>[0]): void {
    const { winnerId, roundsWon, isDry, isShowDry, fireStreakPlayer, frozenCard } = data
    const g = this.game.getState()

    // Sync scores authoritatively from roundsWon (set, not increment).
    if (roundsWon) {
      for (const [id, rounds] of Object.entries(roundsWon)) {
        const p = g.players.find(pl => pl.id === id)
        if (p && p.score !== rounds) {
          g.updateScore(id, rounds - p.score)
        }
      }
    }

    // Stale-streak fix: derive NEW streaks from the pre-update players, then
    // apply the trusted values (no re-reads of mutated objects).
    const streaks = computeStreaks(g.players, winnerId)
    for (const [id, streak] of Object.entries(streaks)) {
      g.updatePlayer(id, { winStreak: streak })
    }

    // Fire streak is decided by the AUTHORITATIVE backend flag, not a local
    // threshold (the source of the old 2/3/4 mismatch). Expose it + the frozen
    // card as state for ticket 16's overlays.
    g.setFireStreakPlayer(fireStreakPlayer ?? null)
    g.setFrozenCard(frozenCard ?? null)

    // SFX beats: the round outcome (win/loss from the local player's view) plus
    // the distinct fire/freeze cues layered over it.
    const localId = this.player.getState().playerId
    this.scene.playSound(winnerId === localId ? 'sound:win_round' : 'sound:lose_round')
    if (fireStreakPlayer) {
      this.scene.playSound('sound:fire_streak')
    }
    if (data.freezeTriggered) {
      this.scene.playSound('sound:freeze_effect')
    }

    // Callout words + style come from the designer-authored config by event.
    if (data.freezeTriggered) {
      this.fireCallout('freeze')
    } else if (isShowDry) {
      this.fireCallout('showDry')
    } else if (isDry) {
      this.fireCallout('dry')
    } else if (fireStreakPlayer) {
      this.fireCallout('fireStreak')
    } else {
      this.fireCallout('roundWin')
    }

    this.refreshAffordance()

    // Hold the win beat, then clear the pile and advance to the next round.
    this.clearRoundWinTimer()
    this.roundWinTimer = setTimeout(() => {
      this.roundWinTimer = null
      if (this.destroyed) return
      this.game.getState().nextRound()
      this.game.getState().clearRoundEffects()
      this.refreshAffordance()
    }, ROUND_WIN_HOLD_MS)
  }

  private onGameEnded(data: Parameters<ServerToClientEvents['gameEnded']>[0]): void {
    // A pending round-win beat must not fire nextRound() against the finished
    // game (or a fresh one that follows).
    this.clearRoundWinTimer()
    const { winnerId, winnerName, winnerScore, finalRoundsWon } = data
    this.game.getState().setGameWinner({
      id: winnerId,
      name: winnerName || 'Unknown',
      score: winnerScore ?? finalRoundsWon?.[winnerId] ?? 0,
    })
    this.game.getState().setGamePhase('finished')
    this.game.getState().stopTurnCountdown()
    this.fireCallout('gameWin')
    this.scene.playSound(
      winnerId === this.player.getState().playerId ? 'sound:game_victory' : 'sound:game_defeat'
    )
    this.refreshAffordance()
  }

  /**
   * Clean play-again / restart / flag-void reshuffle. A SINGLE authoritative
   * re-init from backend state replaces the old ~15-step manual teardown.
   * `initializeFromBackend` rebuilds players + clears pile/suit/winner/effects;
   * we then seed the local hand and opening turn from the derived values and let
   * the scene re-render from the store subscriptions.
   */
  private onReinit(
    gameState: Parameters<ServerToClientEvents['game:restarted']>[0]['gameState']
  ): void {
    // A restart / flag-void reshuffle can arrive inside the 2s round-win hold;
    // cancel any pending beat so it cannot fire nextRound() against the fresh game.
    this.clearRoundWinTimer()
    if (!gameState) return
    const localId = this.player.getState().playerId

    this.game.getState().stopTurnCountdown()
    this.game.getState().initializeFromBackend(gameState)

    const players = this.game.getState().players
    const { localHand, onDeckId } = deriveRestart(players, gameState, localId)

    this.player.getState().resetGameState()
    this.player.getState().setHand(localHand)
    this.game.getState().setOnDeckPlayer(onDeckId)
    // Fresh hand dealt on game start / restart.
    this.scene.playSound('sound:card_deal')
    this.refreshAffordance()
  }

  private onPlayerDeclaredDry(
    data: Parameters<ServerToClientEvents['game:player_declared_dry']>[0]
  ): void {
    this.game.getState().recordDryDeclaration(data.playerId, {
      isShown: data.isShown,
      card: data.card ?? null,
    })
    this.scene.playSound(data.isShown ? 'sound:show_dry_declaration' : 'sound:dry_declaration')
    this.fireCallout(data.isShown ? 'showDry' : 'dry')
  }

  private onFlagResolved(data: Parameters<ServerToClientEvents['game:flag_resolved']>[0]): void {
    // The game is voided; a fresh game:started reshuffle follows. Reflect the
    // penalized match scores now and pop the outcome callout.
    if (data.matchScores) {
      const g = this.game.getState()
      for (const [id, score] of Object.entries(data.matchScores)) {
        const p = g.players.find(pl => pl.id === id)
        if (p && p.score !== score) {
          g.updateScore(id, score - p.score)
        }
      }
    }
    this.fireCallout(data.correct ? 'flagBusted' : 'flagSafe')
  }

  private onFlagError(data: { error: string; code?: string }): void {
    // Non-fatal: a bad flag / dry attempt. Surface a light callout; the backend
    // stays authoritative.
    console.warn('[TableGameController] action rejected:', data.error)
    this.scene.playSound('sound:invalid_move')
    this.fireCallout('invalid')
  }

  // =========================================================================
  // store subscriptions - keep affordance fresh as state changes
  // =========================================================================

  private subscribeToStores(): void {
    this.unsubscribers.push(
      this.game.subscribe((state, prev) => {
        if (
          state.playedCards !== prev.playedCards ||
          state.currentSuit !== prev.currentSuit ||
          state.leaderId !== prev.leaderId ||
          state.gamePhase !== prev.gamePhase ||
          state.onDeckPlayerId !== prev.onDeckPlayerId
        ) {
          this.refreshAffordance()
        }
      })
    )
    this.unsubscribers.push(
      this.player.subscribe((state, prev) => {
        if (state.hand !== prev.hand) {
          this.refreshAffordance()
        }
      })
    )
  }

  // =========================================================================
  // teardown
  // =========================================================================

  private clearRoundWinTimer(): void {
    if (this.roundWinTimer !== null) {
      clearTimeout(this.roundWinTimer)
      this.roundWinTimer = null
    }
  }

  destroy(): void {
    this.destroyed = true
    this.clearRoundWinTimer()
    for (const [event, handler] of this.handlers.entries()) {
      this.socket.off(event as keyof ServerToClientEvents, handler as never)
    }
    this.handlers.clear()
    for (const unsub of this.unsubscribers) unsub()
    this.unsubscribers.length = 0
    if (this.scene.onPlayCardRequested) {
      this.scene.onPlayCardRequested = undefined
    }
  }
}
