package websocket

import (
	"encoding/json"
	"sync"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestSelectTurnDuration verifies the on-deck seat's countdown length is driven
// purely by how many cards have already landed this round: the leader (opening,
// 0 played) gets 15s, the first follower (1 played) gets 8s, and every
// subsequent follower (2+ played) gets 5s.
func TestSelectTurnDuration(t *testing.T) {
	tests := []struct {
		name        string
		playedCount int
		want        int
	}{
		{"leader opens with nothing played", 0, 15},
		{"first follower after one play", 1, 8},
		{"second follower after two plays", 2, 5},
		{"third follower after three plays", 3, 5},
		{"deep sequence stays at five", 7, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := selectTurnDuration(tt.playedCount); got != tt.want {
				t.Errorf("selectTurnDuration(%d) = %d, want %d", tt.playedCount, got, tt.want)
			}
		})
	}
}

// TestSelectAutoPlayCard covers expiry auto-play selection: if a suit is led and
// the player holds it, play the LOWEST card of the led suit (even when a lower
// off-suit card exists); otherwise play the lowest card overall. When no suit is
// led (the leader opening) the lowest overall card is chosen, which sets the
// led suit.
func TestSelectAutoPlayCard(t *testing.T) {
	hearts := entity.Hearts
	clubs := entity.Clubs

	tests := []struct {
		name    string
		hand    []entity.Card
		ledSuit *entity.Suit
		want    *entity.Card
	}{
		{
			name: "leader opening plays lowest overall (sets suit)",
			hand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.King},
				{Suit: entity.Clubs, Value: entity.Eight},
				{Suit: entity.Spades, Value: entity.Ten},
			},
			ledSuit: nil,
			want:    &entity.Card{Suit: entity.Clubs, Value: entity.Eight},
		},
		{
			name: "holds led suit plays lowest of led suit despite lower off-suit",
			hand: []entity.Card{
				{Suit: entity.Clubs, Value: entity.Six}, // lower rank but off-suit
				{Suit: entity.Hearts, Value: entity.Queen},
				{Suit: entity.Hearts, Value: entity.Nine}, // lowest of led suit
			},
			ledSuit: &hearts,
			want:    &entity.Card{Suit: entity.Hearts, Value: entity.Nine},
		},
		{
			name: "does not hold led suit plays lowest overall",
			hand: []entity.Card{
				{Suit: entity.Clubs, Value: entity.King},
				{Suit: entity.Spades, Value: entity.Seven}, // lowest overall
				{Suit: entity.Diamonds, Value: entity.Ten},
			},
			ledSuit: &hearts,
			want:    &entity.Card{Suit: entity.Spades, Value: entity.Seven},
		},
		{
			name: "single led-suit card is chosen",
			hand: []entity.Card{
				{Suit: entity.Clubs, Value: entity.Ace},
			},
			ledSuit: &clubs,
			want:    &entity.Card{Suit: entity.Clubs, Value: entity.Ace},
		},
		{
			name:    "empty hand yields no card",
			hand:    []entity.Card{},
			ledSuit: &hearts,
			want:    nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := selectAutoPlayCard(tt.hand, tt.ledSuit)
			switch {
			case tt.want == nil && got != nil:
				t.Fatalf("expected nil card, got %v", got)
			case tt.want == nil && got == nil:
				// ok
			case got == nil:
				t.Fatalf("expected %v, got nil", tt.want)
			case !got.Equals(tt.want):
				t.Errorf("expected %v, got %v", tt.want, got)
			}
		})
	}
}

// TestTurnTimerWalksSequence drives the full walking sequence deterministically
// (without waiting on real ticks): each expiry auto-plays the on-deck seat's
// lowest legal card, advances to the next clockwise seat, and re-arms the timer
// with the correct duration (15 leader -> 8 first follower -> 5 subsequent),
// looping back to 15 for the new leader once the round completes.
func TestTurnTimerWalksSequence(t *testing.T) {
	// Use a manager whose ticker never fires during the test; we drive expiry
	// by hand so the sequence is fully deterministic.
	mgr := newTurnTimerManagerForTest()

	room := "WALKROOM"
	gs := &entity.GameState{
		GameID:       "game-walk",
		RoomCode:     room,
		Phase:        entity.PhasePlaying,
		TotalRounds:  5,
		CurrentRound: 1,
		Players: []entity.GamePlayer{
			{ID: "leader", Username: "Leader", Hand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Nine},
				{Suit: entity.Hearts, Value: entity.King},
			}},
			{ID: "f1", Username: "F1", Hand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Seven},
				{Suit: entity.Clubs, Value: entity.Ace},
			}},
			{ID: "f2", Username: "F2", Hand: []entity.Card{
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
	t.Cleanup(func() {
		gamesMu.Lock()
		delete(games, room)
		gamesMu.Unlock()
		mgr.stop(room)
		// applyPlay re-arms the global manager (production has a single manager);
		// stop it too so no background goroutine lingers past the test.
		turnTimers.stop(room)
	})

	// Arm the timer for the leader (on deck).
	gamesMu.Lock()
	mgr.reset(room, gs)
	gamesMu.Unlock()
	if gs.TurnTimeLimit != 15 {
		t.Fatalf("leader turn should arm 15s, got %d", gs.TurnTimeLimit)
	}

	// Expiry 1: leader auto-plays lowest overall (9 of hearts), setting hearts.
	mgr.driveExpiry(t, room)
	assertOnDeck(t, gs, "f1", 8, 1)
	if gs.LedSuit == nil || *gs.LedSuit != entity.Hearts {
		t.Fatalf("leader auto-play should set led suit to hearts")
	}
	if pc := gs.GetPlayedCard("leader"); pc == nil || pc.Card.Value != entity.Nine {
		t.Fatalf("leader should have auto-played the 9 of hearts")
	}

	// Expiry 2: first follower holds hearts, plays lowest led-suit (7 of hearts).
	mgr.driveExpiry(t, room)
	assertOnDeck(t, gs, "f2", 5, 2)
	if pc := gs.GetPlayedCard("f1"); pc == nil || pc.Card.Value != entity.Seven || pc.Card.Suit != entity.Hearts {
		t.Fatalf("f1 should have auto-played the 7 of hearts (lowest led suit)")
	}

	// Expiry 3: second follower completes the round; the winner leads round 2 at 15s.
	// f2 holds hearts (10) so must follow with it over the lower off-suit 6 of
	// spades; playing the 10 wins the trick, so f2 becomes the new leader. (The
	// round reset clears PlayedCards, so we verify the outcome via the winner.)
	mgr.driveExpiry(t, room)
	if gs.LeaderID != "f2" || gs.CurrentTurn != "f2" {
		t.Fatalf("f2 should have won the trick with the 10 of hearts and now lead, got leader %q turn %q", gs.LeaderID, gs.CurrentTurn)
	}
	if h := gs.GetPlayer("f2").Hand; len(h) != 1 || h[0].Value != entity.Six {
		t.Fatalf("f2 should have shed the 10 of hearts, leaving only the 6 of spades, got %v", h)
	}
	if gs.CurrentRound != 2 {
		t.Fatalf("round should have advanced to 2 after all three auto-plays, got %d", gs.CurrentRound)
	}
	if gs.TurnTimeLimit != 15 {
		t.Fatalf("new leader of round 2 should arm 15s, got %d", gs.TurnTimeLimit)
	}
	if len(gs.PlayedCards) != 0 {
		t.Fatalf("round 2 should start with no played cards, got %d", len(gs.PlayedCards))
	}
}

// TestTurnTimerStreamsCountdown verifies the running timer streams a decrementing
// countdown to the room via the emit hook, starting at the full duration, and
// that each emission carries the on-deck player id and full turn duration.
func TestTurnTimerStreamsCountdown(t *testing.T) {
	mgr := &turnTimerManager{
		generation: map[string]uint64{},
		stops:      map[string]chan struct{}{},
		tick:       2 * time.Millisecond,
	}

	var mu sync.Mutex
	var got []TimerUpdatePayload
	mgr.emit = func(roomCode, playerID string, secondsRemaining, turnDuration int) {
		mu.Lock()
		got = append(got, TimerUpdatePayload{
			PlayerID:            playerID,
			SecondsRemaining:    secondsRemaining,
			TurnDurationSeconds: turnDuration,
		})
		mu.Unlock()
	}
	expired := make(chan struct{})
	mgr.onExpire = func(roomCode string, gen uint64) { close(expired) }

	mgr.start("STREAMROOM", "leader", 3)

	select {
	case <-expired:
	case <-time.After(2 * time.Second):
		t.Fatal("timer did not expire in time")
	}
	mgr.stop("STREAMROOM")

	mu.Lock()
	defer mu.Unlock()
	// Expect emissions for 3 (initial), 2, 1.
	wantSeconds := []int{3, 2, 1}
	if len(got) != len(wantSeconds) {
		t.Fatalf("expected %d emissions %v, got %d: %+v", len(wantSeconds), wantSeconds, len(got), got)
	}
	for i, want := range wantSeconds {
		if got[i].SecondsRemaining != want {
			t.Errorf("emission %d: secondsRemaining = %d, want %d", i, got[i].SecondsRemaining, want)
		}
		if got[i].PlayerID != "leader" {
			t.Errorf("emission %d: playerId = %q, want leader", i, got[i].PlayerID)
		}
		if got[i].TurnDurationSeconds != 3 {
			t.Errorf("emission %d: turnDuration = %d, want 3", i, got[i].TurnDurationSeconds)
		}
	}
}

// TestTimerUpdatePayloadWireShape locks the JSON shape emitted for the
// timerUpdate event to the ticket-02 contract the frontend consumes.
func TestTimerUpdatePayloadWireShape(t *testing.T) {
	b, err := json.Marshal(TimerUpdatePayload{
		PlayerID:            "player-1",
		SecondsRemaining:    5,
		TurnDurationSeconds: 8,
	})
	if err != nil {
		t.Fatalf("marshal failed: %v", err)
	}
	var decoded map[string]interface{}
	if err := json.Unmarshal(b, &decoded); err != nil {
		t.Fatalf("unmarshal failed: %v", err)
	}
	if _, ok := decoded["playerId"]; !ok {
		t.Errorf("payload missing playerId: %s", b)
	}
	if _, ok := decoded["secondsRemaining"]; !ok {
		t.Errorf("payload missing secondsRemaining: %s", b)
	}
	if _, ok := decoded["turnDurationSeconds"]; !ok {
		t.Errorf("payload missing turnDurationSeconds: %s", b)
	}
}

// --- test helpers -------------------------------------------------------------

// newTurnTimerManagerForTest builds a manager whose real ticker effectively never
// fires (huge tick), so tests can drive expiry manually and deterministically
// while still exercising the real auto-play/walk wiring.
func newTurnTimerManagerForTest() *turnTimerManager {
	m := &turnTimerManager{
		generation: map[string]uint64{},
		stops:      map[string]chan struct{}{},
		tick:       time.Hour,
	}
	m.emit = func(string, string, int, int) {}
	m.onExpire = m.autoPlayOnExpiry
	return m
}

// driveExpiry synchronously invokes the auto-play expiry path for the room's
// current timer generation, mimicking what the timer goroutine does on timeout.
func (m *turnTimerManager) driveExpiry(t *testing.T, roomCode string) {
	t.Helper()
	m.mu.Lock()
	gen := m.generation[roomCode]
	m.mu.Unlock()
	m.autoPlayOnExpiry(roomCode, gen)
}

func assertOnDeck(t *testing.T, gs *entity.GameState, wantPlayer string, wantDuration, wantPlayed int) {
	t.Helper()
	if gs.CurrentTurn != wantPlayer {
		t.Fatalf("expected on-deck %q, got %q", wantPlayer, gs.CurrentTurn)
	}
	if gs.TurnTimeLimit != wantDuration {
		t.Fatalf("expected turn duration %d for %q, got %d", wantDuration, wantPlayer, gs.TurnTimeLimit)
	}
	if len(gs.PlayedCards) != wantPlayed {
		t.Fatalf("expected %d played cards, got %d", wantPlayed, len(gs.PlayedCards))
	}
}
