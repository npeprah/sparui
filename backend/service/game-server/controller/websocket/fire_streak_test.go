package websocket

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// streakGameState builds a fresh 2-player game sitting at round 1 with the given
// leader, used to drive fire-streak / freeze scenarios across multiple rounds.
func streakGameState(roomCode, leaderID string) *entity.GameState {
	return &entity.GameState{
		GameID:      "game-" + roomCode,
		RoomCode:    roomCode,
		TotalRounds: 5,
		PointsToWin: 10,
		Phase:       entity.PhasePlaying,
		Players: []entity.GamePlayer{
			{ID: "player1", Username: "Alice"},
			{ID: "player2", Username: "Bob"},
		},
		LeaderID:     leaderID,
		CurrentTurn:  leaderID,
		CurrentRound: 1,
		StartedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}

// resolveRound wires the current round so winnerID takes the trick (high heart)
// against otherID (an off-suit club that cannot win the led suit), then runs
// round completion. It mirrors what the live play path produces for a
// two-player round.
func resolveRound(c *Client, gs *entity.GameState, winnerID, otherID string) {
	hearts := entity.Hearts
	gs.LedSuit = &hearts
	gs.PlayedCards = []entity.PlayedCard{
		{PlayerID: winnerID, Card: entity.Card{Suit: entity.Hearts, Value: entity.Ace}, PlayedAt: time.Now()},
		{PlayerID: otherID, Card: entity.Card{Suit: entity.Clubs, Value: entity.King}, PlayedAt: time.Now()},
	}
	for i := range gs.Players {
		gs.Players[i].HasPlayedCard = true
	}
	c.handleRoundCompletion(gs)
}

// TestFireStreak_IgnitesAtThreeConsecutiveLeaderWins verifies the corrected
// threshold: the streak ignites at exactly THREE consecutive wins as leader
// (not the old value of 2, and not 4), and that no points are ever awarded for
// the fire streak (state/visual only).
func TestFireStreak_IgnitesAtThreeConsecutiveLeaderWins(t *testing.T) {
	tests := []struct {
		name            string
		consecutiveWins int
		wantOnFire      bool
	}{
		{"one leader-win does not ignite", 1, false},
		{"two leader-wins does not ignite (not the old threshold of 2)", 2, false},
		{"three leader-wins ignite the streak", 3, true},
		{"four leader-wins stay on fire", 4, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			roomID := "FIRE"
			gs := streakGameState(roomID, "player1")
			client, cleanup := registerTestClient(t, roomID, "player1", gs)
			defer cleanup()

			for i := 0; i < tt.consecutiveWins; i++ {
				resolveRound(client, gs, "player1", "player2")
			}

			p1 := gs.GetPlayer("player1")
			if p1.WinStreak != tt.consecutiveWins {
				t.Errorf("WinStreak = %d, want %d", p1.WinStreak, tt.consecutiveWins)
			}
			if p1.IsOnFire != tt.wantOnFire {
				t.Errorf("IsOnFire = %v, want %v", p1.IsOnFire, tt.wantOnFire)
			}

			wantFireStreakPlayer := ""
			if tt.wantOnFire {
				wantFireStreakPlayer = "player1"
			}
			if gs.FireStreakPlayer != wantFireStreakPlayer {
				t.Errorf("FireStreakPlayer = %q, want %q", gs.FireStreakPlayer, wantFireStreakPlayer)
			}

			// Fire streaks are state/visual only: no points may be awarded.
			if p1.Score != 0 {
				t.Errorf("no points should be awarded for a fire streak, got Score = %d", p1.Score)
			}
			if got := getMatchScore(roomID, "player1"); got != 0 {
				t.Errorf("no match points for a fire streak, got %d", got)
			}
		})
	}
}

// TestFireStreak_FourthRoundCardIsOnFire proves the end-to-end intent: after
// three consecutive leader-wins ignite the streak, the card the leader opens the
// FOURTH round with is marked on fire when it is actually played.
func TestFireStreak_FourthRoundCardIsOnFire(t *testing.T) {
	roomID := "FIRE4"
	gs := streakGameState(roomID, "player1")
	client, cleanup := registerTestClient(t, roomID, "player1", gs)
	defer cleanup()

	for i := 0; i < 3; i++ {
		resolveRound(client, gs, "player1", "player2")
	}
	if !gs.GetPlayer("player1").IsOnFire {
		t.Fatal("precondition: player1 should be on fire after 3 leader-wins")
	}
	if gs.CurrentRound != 4 {
		t.Fatalf("precondition: expected to be on round 4, got %d", gs.CurrentRound)
	}

	// We are at the start of round 4 with player1 as leader. Give them a card
	// and open the round; the played card must be marked on fire.
	p1 := gs.GetPlayer("player1")
	p1.Hand = []entity.Card{{Suit: entity.Spades, Value: entity.King}}
	for i := range gs.Players {
		gs.Players[i].HasPlayedCard = false
	}

	msg, _ := json.Marshal(map[string]interface{}{
		"card": map[string]string{"suit": "spades", "value": "king"},
	})
	client.handlePlayCard(msg)

	if len(gs.PlayedCards) != 1 {
		t.Fatalf("expected 1 played card, got %d", len(gs.PlayedCards))
	}
	if !gs.PlayedCards[0].IsOnFire {
		t.Error("the 4th-round card played by the on-fire leader should be IsOnFire")
	}
}

// drainLastRoundWon reads all currently buffered messages on the client's Send
// channel and returns the data payload of the LAST "roundWon" event seen. This
// is how the client learns of the momentary freeze counter, which is delivered
// on the roundWon broadcast and then cleared from the persisted state.
func drainLastRoundWon(client *Client) map[string]interface{} {
	var last map[string]interface{}
	deadline := time.After(200 * time.Millisecond)
	for {
		select {
		case msg := <-client.Send:
			var m struct {
				Event string                 `json:"event"`
				Data  map[string]interface{} `json:"data"`
			}
			if err := json.Unmarshal(msg, &m); err != nil {
				continue
			}
			if m.Event == "roundWon" {
				last = m.Data
			}
		case <-deadline:
			return last
		}
	}
}

// TestFireStreak_FreezeTriggersWhenOpponentBreaksStreak verifies the freeze
// counter fires when an opponent breaks an active fire streak, that the broken
// player's streak resets, and that no points are awarded for the freeze.
func TestFireStreak_FreezeTriggersWhenOpponentBreaksStreak(t *testing.T) {
	roomID := "FREEZE"
	gs := streakGameState(roomID, "player1")
	client, cleanup := registerTestClient(t, roomID, "player1", gs)
	defer cleanup()

	// player1 wins three rounds as leader -> on fire.
	for i := 0; i < 3; i++ {
		resolveRound(client, gs, "player1", "player2")
	}
	if !gs.GetPlayer("player1").IsOnFire {
		t.Fatal("precondition: player1 should be on fire")
	}

	// Round 4: opponent player2 breaks the fire streak by winning.
	resolveRound(client, gs, "player2", "player1")

	// The freeze counter is delivered to the client on the roundWon broadcast.
	roundWon := drainLastRoundWon(client)
	if roundWon == nil {
		t.Fatal("expected a roundWon broadcast for the breaking round")
	}
	if freeze, _ := roundWon["freezeTriggered"].(bool); !freeze {
		t.Error("roundWon broadcast should report freezeTriggered=true when a fire streak is broken")
	}

	if gs.GetPlayer("player1").IsOnFire {
		t.Error("the broken player should no longer be on fire")
	}
	if got := gs.GetPlayer("player1").WinStreak; got != 0 {
		t.Errorf("broken player streak should reset to 0, got %d", got)
	}
	if got := gs.GetPlayer("player2").WinStreak; got != 1 {
		t.Errorf("breaker streak should be 1, got %d", got)
	}
	if gs.FireStreakPlayer != "" {
		t.Errorf("FireStreakPlayer should be cleared on break, got %q", gs.FireStreakPlayer)
	}

	// Freeze is state/visual only: no points awarded to the breaker.
	if got := gs.GetPlayer("player2").Score; got != 0 {
		t.Errorf("no points should be awarded for a freeze, got Score = %d", got)
	}
	if got := getMatchScore(roomID, "player2"); got != 0 {
		t.Errorf("no match points for a freeze, got %d", got)
	}
}

// TestConvertPlayedCards_ExposesFireAndFreezeState verifies the per-card fire
// and freeze flags are serialized for the client to render.
func TestConvertPlayedCards_ExposesFireAndFreezeState(t *testing.T) {
	played := []entity.PlayedCard{
		{PlayerID: "onfire", Card: entity.Card{Suit: entity.Hearts, Value: entity.Ace}, IsOnFire: true},
		{PlayerID: "frozen", Card: entity.Card{Suit: entity.Clubs, Value: entity.King}, IsFrozen: true},
		{PlayerID: "plain", Card: entity.Card{Suit: entity.Spades, Value: entity.Six}},
	}

	result := convertPlayedCardsToFrontendFormat(played)
	if len(result) != 3 {
		t.Fatalf("expected 3 serialized cards, got %d", len(result))
	}

	cases := []struct {
		idx          int
		wantOnFire   bool
		wantFrozen   bool
		wantPlayerID string
	}{
		{0, true, false, "onfire"},
		{1, false, true, "frozen"},
		{2, false, false, "plain"},
	}
	for _, tc := range cases {
		card := result[tc.idx].(map[string]interface{})
		if card["playerId"] != tc.wantPlayerID {
			t.Errorf("card %d playerId = %v, want %v", tc.idx, card["playerId"], tc.wantPlayerID)
		}
		if got, _ := card["isOnFire"].(bool); got != tc.wantOnFire {
			t.Errorf("card %d isOnFire = %v, want %v", tc.idx, got, tc.wantOnFire)
		}
		if got, _ := card["isFrozen"].(bool); got != tc.wantFrozen {
			t.Errorf("card %d isFrozen = %v, want %v", tc.idx, got, tc.wantFrozen)
		}
	}
}

// TestFireStreak_NoFreezeWhenBreakingSubThresholdStreak verifies that breaking a
// streak that never reached the fire threshold does NOT trigger the freeze, and
// that a non-leader win resets rather than extends a streak.
func TestFireStreak_NoFreezeWhenBreakingSubThresholdStreak(t *testing.T) {
	roomID := "NOFREEZE"
	gs := streakGameState(roomID, "player1")
	client, cleanup := registerTestClient(t, roomID, "player1", gs)
	defer cleanup()

	// player1 wins two rounds as leader (streak 2, not on fire).
	resolveRound(client, gs, "player1", "player2")
	resolveRound(client, gs, "player1", "player2")
	if gs.GetPlayer("player1").IsOnFire {
		t.Fatal("precondition: streak of 2 must not be on fire")
	}

	// player2 breaks the sub-threshold streak.
	resolveRound(client, gs, "player2", "player1")

	if gs.FreezeTriggered {
		t.Error("freeze must not trigger when the broken streak was never on fire")
	}
	if got := gs.GetPlayer("player1").WinStreak; got != 0 {
		t.Errorf("broken player streak should reset to 0, got %d", got)
	}
	if got := gs.GetPlayer("player2").WinStreak; got != 1 {
		t.Errorf("breaker streak should reset to 1, got %d", got)
	}
}
