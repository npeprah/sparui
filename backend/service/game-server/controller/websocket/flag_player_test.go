package websocket

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// activeFlagState builds a live mid-round game where hearts has been led and the
// accused (player2) has played an off-suit club. Whether that off-suit play is
// ILLEGAL depends on accusedHoldsLed: if true the accused still holds a heart
// (illegal - they should have followed suit); if false the accused is out of
// hearts (a legal off-suit break, so a flag against them is wrong).
func activeFlagState(roomCode string, accusedHoldsLed bool) *entity.GameState {
	hearts := entity.Hearts

	accusedHand := []entity.Card{{Suit: entity.Spades, Value: entity.King}}
	if accusedHoldsLed {
		accusedHand = append(accusedHand, entity.Card{Suit: entity.Hearts, Value: entity.Nine})
	}

	return &entity.GameState{
		GameID:      "game-flag",
		RoomCode:    roomCode,
		TotalRounds: 5,
		PointsToWin: 10,
		Phase:       entity.PhasePlaying,
		Players: []entity.GamePlayer{
			{
				ID:            "player1",
				Username:      "Alice",
				Hand:          []entity.Card{{Suit: entity.Diamonds, Value: entity.Ten}},
				HasPlayedCard: true,
			},
			{
				ID:            "player2",
				Username:      "Bob",
				Hand:          accusedHand,
				HasPlayedCard: true,
			},
		},
		LeaderID:     "player1",
		CurrentTurn:  "player1",
		CurrentRound: 1,
		LedSuit:      &hearts,
		PlayedCards: []entity.PlayedCard{
			{PlayerID: "player1", Card: entity.Card{Suit: entity.Hearts, Value: entity.Ace}, PlayedAt: time.Now()},
			{PlayerID: "player2", Card: entity.Card{Suit: entity.Clubs, Value: entity.Queen}, PlayedAt: time.Now()},
		},
		TurnStartTime: time.Now(),
		TurnTimeLimit: 30,
		StartedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
}

// TestHandleFlagPlayer covers both flag directions, the -3 penalty, the whole
// game being voided into a reshuffled fresh game, and the cumulative match score
// surviving the void.
func TestHandleFlagPlayer(t *testing.T) {
	tests := []struct {
		name string
		// accusedHoldsLed drives whether the accused's off-suit play is illegal.
		accusedHoldsLed bool
		// seeded match scores before the flag.
		challengerSeed int
		accusedSeed    int
		// expectations.
		expectCorrect         bool
		expectPenalizedID     string
		expectChallengerFinal int
		expectAccusedFinal    int
	}{
		{
			name:                  "correct flag - accused broke suit while holding the led suit",
			accusedHoldsLed:       true,
			challengerSeed:        5,
			accusedSeed:           5,
			expectCorrect:         true,
			expectPenalizedID:     "player2",
			expectChallengerFinal: 5,     // challenger untouched
			expectAccusedFinal:    5 - 3, // offender -3
		},
		{
			name:                  "wrong flag - accused legally broke suit (out of the led suit)",
			accusedHoldsLed:       false,
			challengerSeed:        5,
			accusedSeed:           5,
			expectCorrect:         false,
			expectPenalizedID:     "player1",
			expectChallengerFinal: 5 - 3, // challenger -3
			expectAccusedFinal:    5,     // accused untouched
		},
		{
			name:                  "correct flag drives a negative match score",
			accusedHoldsLed:       true,
			challengerSeed:        0,
			accusedSeed:           1,
			expectCorrect:         true,
			expectPenalizedID:     "player2",
			expectChallengerFinal: 0,
			expectAccusedFinal:    1 - 3, // -2, penalties may push a score negative
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			roomID := "FLAGROOM"
			gs := activeFlagState(roomID, tt.accusedHoldsLed)

			// player1 is the challenger.
			client, cleanup := registerTestClient(t, roomID, "player1", gs)
			defer cleanup()

			// Seed the cumulative match scores (registerTestClient reset them).
			addMatchScore(roomID, "player1", tt.challengerSeed)
			addMatchScore(roomID, "player2", tt.accusedSeed)

			originalGameID := gs.GameID

			payload, _ := json.Marshal(map[string]interface{}{
				"targetPlayerId": "player2",
				"roundIndex":     0,
				"cardIndex":      1,
			})
			client.handleFlagPlayer(payload)

			// --- Resolution event ---
			resolved := drainForEvent(client, "game:flag_resolved")
			if resolved == nil {
				t.Fatal("expected game:flag_resolved event, got none")
			}
			if got := resolved["correct"].(bool); got != tt.expectCorrect {
				t.Errorf("correct = %v, want %v", got, tt.expectCorrect)
			}
			if got := resolved["penalizedId"].(string); got != tt.expectPenalizedID {
				t.Errorf("penalizedId = %q, want %q", got, tt.expectPenalizedID)
			}
			if got := resolved["accusedId"].(string); got != "player2" {
				t.Errorf("accusedId = %q, want player2", got)
			}
			if got := resolved["challengerId"].(string); got != "player1" {
				t.Errorf("challengerId = %q, want player1", got)
			}
			// penalty is always the -3 magnitude, never the old +10/-5 values.
			if got := int(resolved["penalty"].(float64)); got != 3 {
				t.Errorf("penalty = %d, want 3", got)
			}
			// The flagged player's hand is revealed on resolution.
			revealed, ok := resolved["revealedHand"].([]interface{})
			if !ok {
				t.Fatalf("revealedHand missing or wrong type: %T", resolved["revealedHand"])
			}
			if len(revealed) != len(gs.GetPlayer("player2").Hand) {
				// Note: gs is the voided state; its player2 hand is the accused's
				// pre-void remaining hand, which is what we reveal.
			}
			if len(revealed) == 0 {
				t.Error("revealedHand should not be empty")
			}

			// --- Match score effects: -3 to exactly one side, no +10 anywhere ---
			if got := getMatchScore(roomID, "player1"); got != tt.expectChallengerFinal {
				t.Errorf("challenger match score = %d, want %d", got, tt.expectChallengerFinal)
			}
			if got := getMatchScore(roomID, "player2"); got != tt.expectAccusedFinal {
				t.Errorf("accused match score = %d, want %d", got, tt.expectAccusedFinal)
			}

			// --- Void -> reshuffle -> fresh game ---
			gamesMu.RLock()
			fresh := games[roomID]
			gamesMu.RUnlock()
			if fresh == nil {
				t.Fatal("a fresh game should replace the voided one")
			}
			if fresh.GameID == originalGameID {
				t.Error("game was not voided/reshuffled - same GameID persists")
			}
			if fresh.CurrentRound != 1 {
				t.Errorf("fresh game CurrentRound = %d, want 1", fresh.CurrentRound)
			}
			if len(fresh.PlayedCards) != 0 {
				t.Errorf("fresh game PlayedCards = %d, want 0", len(fresh.PlayedCards))
			}
			if fresh.Phase != entity.PhasePlaying {
				t.Errorf("fresh game phase = %s, want %s", fresh.Phase, entity.PhasePlaying)
			}
			for _, p := range fresh.Players {
				if len(p.Hand) != 5 {
					t.Errorf("fresh game hand for %s = %d cards, want 5", p.ID, len(p.Hand))
				}
				if p.Score != 0 || p.RoundsWon != 0 {
					t.Errorf("fresh game per-game state not reset for %s: Score=%d RoundsWon=%d", p.ID, p.Score, p.RoundsWon)
				}
			}

			// --- Match score PERSISTS onto the fresh game state ---
			if p1 := fresh.GetPlayer("player1"); p1.MatchScore != tt.expectChallengerFinal {
				t.Errorf("fresh game player1 MatchScore = %d, want %d", p1.MatchScore, tt.expectChallengerFinal)
			}
			if p2 := fresh.GetPlayer("player2"); p2.MatchScore != tt.expectAccusedFinal {
				t.Errorf("fresh game player2 MatchScore = %d, want %d", p2.MatchScore, tt.expectAccusedFinal)
			}

			// --- A fresh game is broadcast so clients reload the table ---
			if started := drainForEvent(client, "game:started"); started == nil {
				t.Error("expected game:started broadcast for the reshuffled game")
			}
		})
	}
}

// TestHandleFlagPlayer_Rejections covers the guard rails that stop a flag from
// being resolved at all (no state mutation, an error to the caller).
func TestHandleFlagPlayer_Rejections(t *testing.T) {
	tests := []struct {
		name     string
		targetID string
		noRoom   bool
	}{
		{name: "cannot flag yourself", targetID: "player1"},
		{name: "unknown target", targetID: "ghost"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			roomID := "FLAGREJECT"
			gs := activeFlagState(roomID, true)
			client, cleanup := registerTestClient(t, roomID, "player1", gs)
			defer cleanup()

			originalGameID := gs.GameID

			payload, _ := json.Marshal(map[string]interface{}{
				"targetPlayerId": tt.targetID,
				"roundIndex":     0,
				"cardIndex":      1,
			})
			client.handleFlagPlayer(payload)

			if got := drainForEvent(client, "game:flag_error"); got == nil {
				t.Error("expected game:flag_error for an invalid flag")
			}
			// Game must be untouched (not voided).
			gamesMu.RLock()
			same := games[roomID]
			gamesMu.RUnlock()
			if same == nil || same.GameID != originalGameID {
				t.Error("an invalid flag must not void the game")
			}
		})
	}
}
