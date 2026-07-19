package websocket

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestTurnTimerEndToEndWirePath drives ticket 04 through the REAL production wire
// path - real hub-registered clients, the real emitTimerUpdate -> broadcastRoom
// broadcast, and the real autoPlayOnExpiry auto-play - so the exact JSON messages
// a connected WebSocket client would receive are captured. The manager's tick is
// accelerated (20ms) so the countdown streams quickly, but every duration, wire
// field, and auto-play decision is exactly what an end user experiences.
//
// When SPAR_EVIDENCE_DIR is set it also writes a human-readable transcript of the
// captured client messages there for reviewer-visible evidence.
func TestTurnTimerEndToEndWirePath(t *testing.T) {
	// Drive the REAL package-global manager (applyPlay re-arms it directly when
	// walking the sequence), just with an accelerated tick so the countdown
	// streams fast. Everything else - emit, auto-play, walk - is production code.
	mgr := turnTimers
	origTick := mgr.tick
	mgr.tick = 20 * time.Millisecond
	t.Cleanup(func() { mgr.tick = origTick })

	room := "E2EROOM"
	gs := &entity.GameState{
		GameID:       "game-e2e",
		RoomCode:     room,
		Phase:        entity.PhasePlaying,
		TotalRounds:  5,
		CurrentRound: 1,
		Players: []entity.GamePlayer{
			{ID: "leader", Username: "Ama", Hand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Nine},
				{Suit: entity.Hearts, Value: entity.King},
			}},
			{ID: "f1", Username: "Kofi", Hand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Seven},
				{Suit: entity.Clubs, Value: entity.Ace},
			}},
			{ID: "f2", Username: "Esi", Hand: []entity.Card{
				{Suit: entity.Spades, Value: entity.Six},
				{Suit: entity.Hearts, Value: entity.Ten},
			}},
		},
		LeaderID:    "leader",
		CurrentTurn: "leader",
		LedSuit:     nil,
		PlayedCards: []entity.PlayedCard{},
	}

	gamesMu.Lock()
	games = make(map[string]*entity.GameState)
	games[room] = gs
	gamesMu.Unlock()

	// A real hub client per seat, as if three browsers were connected.
	leaderC := &Client{ID: "c-leader", PlayerID: "leader", RoomID: room, Send: make(chan []byte, 256), Hub: hub}
	f1C := &Client{ID: "c-f1", PlayerID: "f1", RoomID: room, Send: make(chan []byte, 256), Hub: hub}
	f2C := &Client{ID: "c-f2", PlayerID: "f2", RoomID: room, Send: make(chan []byte, 256), Hub: hub}
	cleanupL := registerClient(t, leaderC)
	cleanupF1 := registerClient(t, f1C)
	cleanupF2 := registerClient(t, f2C)

	t.Cleanup(func() {
		mgr.stop(room)
		cleanupL()
		cleanupF1()
		cleanupF2()
		gamesMu.Lock()
		delete(games, room)
		gamesMu.Unlock()
	})

	// Capture every message the leader's client receives, in order, on a
	// background reader (mirrors the browser's WebSocket onmessage handler).
	type wireMsg struct {
		Event string          `json:"event"`
		Data  json.RawMessage `json:"data"`
	}
	var mu sync.Mutex
	var received []wireMsg
	done := make(chan struct{})
	go func() {
		defer close(done)
		timeout := time.After(5 * time.Second)
		var gameOverSeen bool
		for {
			select {
			case raw := <-leaderC.Send:
				var m wireMsg
				if err := json.Unmarshal(raw, &m); err != nil {
					continue
				}
				mu.Lock()
				received = append(received, m)
				mu.Unlock()
				if m.Event == "gameEnded" || m.Event == "gameOver" {
					gameOverSeen = true
				}
				_ = gameOverSeen
			case <-timeout:
				return
			}
		}
	}()

	// Arm the leader's timer via the production reset path (15s ladder start).
	gamesMu.Lock()
	mgr.reset(room, gs)
	gamesMu.Unlock()

	// Let the accelerated countdown + full auto-play walk complete. Three seats
	// auto-play (15 + 8 + 5 = 28 ticks * 20ms ~= 0.6s); allow generous slack.
	deadline := time.Now().Add(4 * time.Second)
	for time.Now().Before(deadline) {
		gamesMu.Lock()
		round := gs.CurrentRound
		gamesMu.Unlock()
		if round >= 2 {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}

	mgr.stop(room)

	// Give the reader a moment to drain, then snapshot.
	time.Sleep(50 * time.Millisecond)
	mu.Lock()
	snap := make([]wireMsg, len(received))
	copy(snap, received)
	mu.Unlock()

	// ---- Assertions on the real wire stream --------------------------------

	// Collect timerUpdate payloads and cardPlayed events in arrival order.
	var timerUpdates []TimerUpdatePayload
	var cardPlays []struct {
		PlayerID string `json:"playerId"`
		Card     struct {
			Suit string `json:"suit"`
			Rank string `json:"rank"`
		} `json:"card"`
	}
	for _, m := range snap {
		switch m.Event {
		case "timerUpdate":
			var p TimerUpdatePayload
			if err := json.Unmarshal(m.Data, &p); err != nil {
				t.Fatalf("bad timerUpdate payload: %v", err)
			}
			timerUpdates = append(timerUpdates, p)
		case "cardPlayed":
			var p struct {
				PlayerID string `json:"playerId"`
				Card     struct {
					Suit string `json:"suit"`
					Rank string `json:"rank"`
				} `json:"card"`
			}
			if err := json.Unmarshal(m.Data, &p); err != nil {
				t.Fatalf("bad cardPlayed payload: %v", err)
			}
			cardPlays = append(cardPlays, p)
		}
	}

	if len(timerUpdates) == 0 {
		t.Fatal("no timerUpdate messages streamed to the client")
	}
	// The very first timerUpdate must be the leader at the full 15s window.
	first := timerUpdates[0]
	if first.PlayerID != "leader" || first.SecondsRemaining != 15 || first.TurnDurationSeconds != 15 {
		t.Fatalf("first timerUpdate = %+v, want {leader 15 15}", first)
	}
	// The countdown for the leader must strictly decrease from 15 with a stable
	// 15s duration - exactly what the on-deck seat's clock shows.
	var leaderSeconds []int
	for _, u := range timerUpdates {
		if u.PlayerID == "leader" && u.TurnDurationSeconds == 15 {
			leaderSeconds = append(leaderSeconds, u.SecondsRemaining)
		}
	}
	for i := 1; i < len(leaderSeconds); i++ {
		if leaderSeconds[i] != leaderSeconds[i-1]-1 {
			t.Fatalf("leader countdown not monotonic by 1s: %v", leaderSeconds)
		}
	}
	// The ladder must appear across seats: leader=15, f1=8, f2=5.
	durByPlayer := map[string]int{}
	for _, u := range timerUpdates {
		if _, ok := durByPlayer[u.PlayerID]; !ok {
			durByPlayer[u.PlayerID] = u.TurnDurationSeconds
		}
	}
	if durByPlayer["leader"] != 15 || durByPlayer["f1"] != 8 || durByPlayer["f2"] != 5 {
		t.Fatalf("duration ladder over wire = %+v, want leader15/f1-8/f2-5", durByPlayer)
	}

	// Auto-play walk: leader opens with lowest overall (9 hearts, sets suit),
	// f1 follows led suit with 7 hearts, f2 follows with 10 hearts.
	if len(cardPlays) < 3 {
		t.Fatalf("expected 3 auto-plays broadcast, got %d: %+v", len(cardPlays), cardPlays)
	}
	wantPlays := []struct{ player, suit, rank string }{
		{"leader", "hearts", "9"},
		{"f1", "hearts", "7"},
		{"f2", "hearts", "10"},
	}
	for i, w := range wantPlays {
		got := cardPlays[i]
		if got.PlayerID != w.player || got.Card.Suit != w.suit || got.Card.Rank != w.rank {
			t.Fatalf("auto-play %d = {%s %s %s}, want {%s %s %s}",
				i, got.PlayerID, got.Card.Suit, got.Card.Rank, w.player, w.suit, w.rank)
		}
	}

	// f2 wins the trick with the 10 of hearts and leads round 2 at 15s.
	gamesMu.Lock()
	newLeader, newTurn, round, limit := gs.LeaderID, gs.CurrentTurn, gs.CurrentRound, gs.TurnTimeLimit
	gamesMu.Unlock()
	if newLeader != "f2" || newTurn != "f2" || round != 2 || limit != 15 {
		t.Fatalf("after round 1 auto-play walk: leader=%q turn=%q round=%d limit=%d, want f2/f2/2/15",
			newLeader, newTurn, round, limit)
	}

	// ---- Reviewer-visible transcript ---------------------------------------
	if dir := os.Getenv("SPAR_EVIDENCE_DIR"); dir != "" {
		var b strings.Builder
		fmt.Fprintf(&b, "Ticket 04 - turn timers, countdown streaming & expiry auto-play\n")
		fmt.Fprintf(&b, "End-to-end over the real hub broadcast path. Messages below are the\n")
		fmt.Fprintf(&b, "exact JSON envelopes the leader's WebSocket client received, in order.\n")
		fmt.Fprintf(&b, "(Timer tick accelerated to 20ms so the countdown streams fast; all\n")
		fmt.Fprintf(&b, "durations/values are production-accurate.)\n\n")
		fmt.Fprintf(&b, "Seats: leader=Ama  f1=Kofi  f2=Esi\n")
		fmt.Fprintf(&b, "Hands: Ama[9H,KH]  Kofi[7H,AC]  Esi[6S,10H]\n\n")
		fmt.Fprintf(&b, "%-4s  %-12s  %s\n", "#", "event", "payload")
		fmt.Fprintf(&b, "%s\n", strings.Repeat("-", 78))
		for i, m := range snap {
			var pretty string
			switch m.Event {
			case "timerUpdate":
				var p TimerUpdatePayload
				_ = json.Unmarshal(m.Data, &p)
				pretty = fmt.Sprintf("playerId=%-7s secondsRemaining=%-2d turnDurationSeconds=%d",
					p.PlayerID, p.SecondsRemaining, p.TurnDurationSeconds)
			case "cardPlayed":
				var p struct {
					PlayerID string `json:"playerId"`
					Card     struct {
						Suit string `json:"suit"`
						Rank string `json:"rank"`
					} `json:"card"`
					CurrentTurn string `json:"currentTurn"`
				}
				_ = json.Unmarshal(m.Data, &p)
				pretty = fmt.Sprintf("AUTO-PLAY playerId=%-7s card=%s of %s  -> currentTurn=%s",
					p.PlayerID, p.Card.Rank, p.Card.Suit, p.CurrentTurn)
			default:
				pretty = string(m.Data)
				if len(pretty) > 60 {
					pretty = pretty[:57] + "..."
				}
			}
			fmt.Fprintf(&b, "%-4d  %-12s  %s\n", i+1, m.Event, pretty)
		}
		fmt.Fprintf(&b, "\nResult: round advanced to 2; Esi (f2) won trick with 10H and now leads at 15s.\n")
		fmt.Fprintf(&b, "Duration ladder observed over the wire: leader=15s, first follower=8s, subsequent=5s.\n")
		out := dir + "/turn_timer_e2e_transcript.txt"
		if err := os.WriteFile(out, []byte(b.String()), 0o644); err != nil {
			t.Logf("could not write evidence transcript: %v", err)
		} else {
			t.Logf("wrote evidence transcript to %s", out)
		}
	}
}
