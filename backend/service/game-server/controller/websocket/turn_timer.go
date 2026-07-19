package websocket

import (
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// ---------------------------------------------------------------------------
// Turn timer (ticket 04)
//
// The server runs an authoritative per-room turn timer that walks the clockwise
// sequence: it pressures ONLY the on-deck (next-in-clockwise) seat, streams a
// `timerUpdate` countdown to the whole room, and on expiry auto-plays that
// seat's lowest legal card so a game never stalls. "Turn" here means whose
// TIMER is running, not who is permitted to play (any player may play at any
// time once the leader has opened - see handlePlayCard).
//
// Concurrency model
// -----------------
// Game state is guarded by the package-global gamesMu. This manager has its own
// mutex (m.mu) that is ALWAYS the inner lock: code paths acquire gamesMu first
// (if at all) and then m.mu, never the reverse. The manager NEVER blocks waiting
// on a timer goroutine while a caller holds gamesMu; cancellation is done by
// closing a per-timer stop channel and bumping a generation counter, so a stale
// expiry that is already racing for gamesMu simply no-ops once it wins the lock.
// This keeps the walking hooks (which run under gamesMu inside applyPlay)
// deadlock-free.
// ---------------------------------------------------------------------------

// Turn durations, in seconds, keyed off how many cards have already landed this
// round. The leader opens (0 played) with the longest window; pressure tightens
// as the trick fills.
const (
	leaderTurnSeconds          = 15
	firstFollowerTurnSeconds   = 8
	subsequentFollowerTurnSecs = 5
)

// selectTurnDuration returns the countdown length for the seat that is now on
// deck, derived purely from the number of cards already played this round:
// 0 played -> leader (15s), 1 played -> first follower (8s), 2+ -> subsequent
// followers (5s).
func selectTurnDuration(playedCount int) int {
	switch playedCount {
	case 0:
		return leaderTurnSeconds
	case 1:
		return firstFollowerTurnSeconds
	default:
		return subsequentFollowerTurnSecs
	}
}

// selectAutoPlayCard picks the card to auto-play for a seat whose timer expired.
// If a suit is led and the player holds it, the lowest card of that suit is
// chosen (a safe, legal follow); otherwise the lowest card overall is chosen.
// When no suit is led (the leader opening), the lowest overall card is returned,
// which sets the led suit. Returns nil for an empty hand. The returned card is a
// copy, safe to use after the source hand is mutated.
func selectAutoPlayCard(hand []entity.Card, ledSuit *entity.Suit) *entity.Card {
	if len(hand) == 0 {
		return nil
	}

	// Prefer the lowest card of the led suit if the player holds any.
	if ledSuit != nil {
		var best *entity.Card
		for i := range hand {
			if hand[i].Suit != *ledSuit {
				continue
			}
			if best == nil || hand[i].Value.Rank() < best.Value.Rank() {
				c := hand[i]
				best = &c
			}
		}
		if best != nil {
			return best
		}
	}

	// No led suit, or player cannot follow: play the lowest card overall.
	var best *entity.Card
	for i := range hand {
		if best == nil || hand[i].Value.Rank() < best.Value.Rank() {
			c := hand[i]
			best = &c
		}
	}
	return best
}

// emitFunc streams a single timerUpdate to a room.
type emitFunc func(roomCode, playerID string, secondsRemaining, turnDuration int)

// expireFunc is invoked when a timer reaches zero, for the generation that was
// active when the timer was armed.
type expireFunc func(roomCode string, generation uint64)

// turnTimerManager owns one active turn timer per room. It is safe for
// concurrent use.
type turnTimerManager struct {
	mu         sync.Mutex
	generation map[string]uint64        // roomCode -> current timer generation
	stops      map[string]chan struct{} // roomCode -> stop channel of the active timer
	tick       time.Duration            // countdown granularity (1s in prod; tiny/huge in tests)

	emit     emitFunc   // streams timerUpdate (defaults to broadcasting to the room)
	onExpire expireFunc // handles expiry (defaults to auto-play)
}

// newTurnTimerManager builds a production manager that streams timerUpdate to
// the room every second. onExpire is bound separately (see the init below) to
// avoid a package initialization cycle: the auto-play path reaches back into the
// global turnTimers to walk the sequence.
func newTurnTimerManager() *turnTimerManager {
	m := &turnTimerManager{
		generation: make(map[string]uint64),
		stops:      make(map[string]chan struct{}),
		tick:       time.Second,
	}
	m.emit = emitTimerUpdate
	return m
}

// turnTimers is the package-global turn timer manager.
var turnTimers = newTurnTimerManager()

func init() {
	// Bind the auto-play expiry handler after turnTimers is constructed to break
	// the initialization cycle (autoPlayOnExpiry -> applyPlay -> turnTimers).
	turnTimers.onExpire = turnTimers.autoPlayOnExpiry
}

// reset re-arms the room's turn timer for whichever seat is currently on deck
// (gs.CurrentTurn), choosing the duration from the number of cards already
// played. It is a no-op when there is no on-deck seat (e.g. an empty
// CurrentTurn). Callers may hold gamesMu; reset never blocks on a goroutine.
func (m *turnTimerManager) reset(roomCode string, gs *entity.GameState) {
	if gs == nil || gs.CurrentTurn == "" {
		return
	}
	duration := selectTurnDuration(len(gs.PlayedCards))
	gs.TurnTimeLimit = duration
	gs.TurnStartTime = time.Now()
	gs.TurnExpired = false
	m.start(roomCode, gs.CurrentTurn, duration)
}

// start arms a fresh timer for a seat, cancelling any existing timer for the
// room without waiting for its goroutine to unwind.
func (m *turnTimerManager) start(roomCode, playerID string, duration int) {
	m.mu.Lock()
	m.generation[roomCode]++
	gen := m.generation[roomCode]
	if old, ok := m.stops[roomCode]; ok {
		close(old)
	}
	stop := make(chan struct{})
	m.stops[roomCode] = stop
	tick := m.tick
	emit := m.emit
	onExpire := m.onExpire
	m.mu.Unlock()

	// Stream the starting value synchronously so every client gets the full
	// duration immediately and in a deterministic order relative to the play
	// that armed the timer (the cardPlayed broadcast precedes this). Per-tick
	// updates and expiry are handled asynchronously by the goroutine.
	if emit != nil {
		emit(roomCode, playerID, duration, duration)
	}

	go m.run(roomCode, playerID, duration, gen, stop, tick, emit, onExpire)
}

// stop cancels the room's active timer (if any) and invalidates any in-flight
// expiry for it. Callers may hold gamesMu.
func (m *turnTimerManager) stop(roomCode string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.generation[roomCode]++ // invalidate any pending expiry
	if s, ok := m.stops[roomCode]; ok {
		close(s)
		delete(m.stops, roomCode)
	}
}

// isCurrent reports whether gen is still the room's active timer generation.
func (m *turnTimerManager) isCurrent(roomCode string, gen uint64) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.generation[roomCode] == gen
}

// run drives one timer's countdown. It emits the full duration immediately, then
// decrements once per tick, streaming each value, and fires onExpire at zero.
// The stop channel unblocks it immediately when the timer is cancelled/replaced.
func (m *turnTimerManager) run(roomCode, playerID string, duration int, gen uint64, stop chan struct{}, tick time.Duration, emit emitFunc, onExpire expireFunc) {
	remaining := duration
	ticker := time.NewTicker(tick)
	defer ticker.Stop()

	for {
		select {
		case <-stop:
			return
		case <-ticker.C:
			remaining--
			if remaining <= 0 {
				if onExpire != nil {
					onExpire(roomCode, gen)
				}
				return
			}
			if emit != nil && m.isCurrent(roomCode, gen) {
				emit(roomCode, playerID, remaining, duration)
			}
		}
	}
}

// autoPlayOnExpiry auto-plays the on-deck seat's lowest legal card when its timer
// expires, then lets applyPlay walk the timer to the next seat. It acquires
// gamesMu and verifies the timer generation is still current, so a play that
// already landed (a human beating the clock, or a newer timer) is honoured and
// the stale expiry no-ops.
func (m *turnTimerManager) autoPlayOnExpiry(roomCode string, gen uint64) {
	gamesMu.Lock()
	defer gamesMu.Unlock()

	if !m.isCurrent(roomCode, gen) {
		return // a newer play/timer superseded this expiry
	}

	gameState, ok := games[roomCode]
	if !ok || gameState.Phase != entity.PhasePlaying {
		return
	}

	onDeckID := gameState.CurrentTurn
	player := gameState.GetPlayer(onDeckID)
	if player == nil || player.HasPlayedCard {
		return
	}

	card := selectAutoPlayCard(player.Hand, gameState.LedSuit)
	if card == nil {
		return
	}

	slog.Info("Turn timer expired - auto-playing lowest legal card",
		"roomCode", roomCode,
		"playerId", onDeckID,
		"card", card.String(),
	)

	// Commit the auto-play through the same path a human play uses. A
	// room-bound client is sufficient: applyPlay/broadcast only need the hub
	// and room code, not a real connection.
	client := &Client{Hub: hub, RoomID: roomCode, PlayerID: onDeckID}
	client.applyPlay(gameState, player, card)
}

// emitTimerUpdate broadcasts a single timerUpdate event to every client in the
// room. The payload matches TimerUpdatePayload (ticket 02 wire contract).
func emitTimerUpdate(roomCode, playerID string, secondsRemaining, turnDuration int) {
	payload := map[string]interface{}{
		"event": "timerUpdate",
		"data": TimerUpdatePayload{
			PlayerID:            playerID,
			SecondsRemaining:    secondsRemaining,
			TurnDurationSeconds: turnDuration,
		},
	}
	broadcastRoom(roomCode, payload)
}

// broadcastRoom marshals and sends data to every client currently in roomCode.
// Unlike the Client broadcast helpers it is not tied to a sender, so background
// goroutines (the turn timer) can push to a room without a connection.
func broadcastRoom(roomCode string, data interface{}) {
	message, err := json.Marshal(data)
	if err != nil {
		slog.Error("Failed to marshal room broadcast message", "error", err)
		return
	}

	hub.mu.RLock()
	defer hub.mu.RUnlock()

	for client := range hub.Clients {
		if client.RoomID == roomCode {
			select {
			case client.Send <- message:
			default:
				slog.Warn("Dropped timer broadcast to slow client",
					"clientId", client.ID, "roomCode", roomCode)
			}
		}
	}
}
