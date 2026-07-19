package websocket

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestPickRandomLeaderIndex verifies the first-round leader is chosen at random.
// It must always land inside [0, numPlayers) and, across many draws, must not be
// pinned to a single seat (which would reproduce the old "player 0 always leads"
// bug).
func TestPickRandomLeaderIndex(t *testing.T) {
	t.Run("always within range", func(t *testing.T) {
		for _, n := range []int{2, 3, 4} {
			for i := 0; i < 500; i++ {
				idx := pickRandomLeaderIndex(n)
				if idx < 0 || idx >= n {
					t.Fatalf("index %d out of range for %d players", idx, n)
				}
			}
		}
	})

	t.Run("degenerate single player", func(t *testing.T) {
		if idx := pickRandomLeaderIndex(1); idx != 0 {
			t.Errorf("expected index 0 for a single player, got %d", idx)
		}
	})

	t.Run("distribution is not fixed to one seat", func(t *testing.T) {
		const numPlayers = 4
		seen := make(map[int]bool)
		for i := 0; i < 500; i++ {
			seen[pickRandomLeaderIndex(numPlayers)] = true
		}
		if len(seen) < 2 {
			t.Errorf("expected the random leader to vary across seats, only ever saw %v", seen)
		}
	})
}

// TestHandlePlayCard_LeaderOpensRound verifies the round-opening rule:
//   - only the leader may open a round (play the first card);
//   - a follower who tries to open before the leader is rejected harmlessly,
//     with no mutation to the game state;
//   - once the round is open, ANY player may play - there is NO strict
//     turn-order enforcement blocking a player who is not "on deck".
func TestHandlePlayCard_LeaderOpensRound(t *testing.T) {
	newState := func() *entity.GameState {
		return &entity.GameState{
			GameID:   "game-open",
			RoomCode: "OPENROOM",
			Phase:    entity.PhasePlaying,
			Players: []entity.GamePlayer{
				{ID: "leader", Username: "Leader", Hand: []entity.Card{
					{Suit: entity.Hearts, Value: entity.Ace},
				}, HasPlayedCard: false},
				{ID: "follower1", Username: "Follower1", Hand: []entity.Card{
					{Suit: entity.Clubs, Value: entity.King},
				}, HasPlayedCard: false},
				{ID: "follower2", Username: "Follower2", Hand: []entity.Card{
					{Suit: entity.Spades, Value: entity.Queen},
				}, HasPlayedCard: false},
			},
			LeaderID:    "leader",
			CurrentTurn: "leader",
			LedSuit:     nil,
			PlayedCards: []entity.PlayedCard{},
		}
	}

	play := func(t *testing.T, gs *entity.GameState, playerID string, card entity.Card) (string, string) {
		t.Helper()
		gamesMu.Lock()
		games = make(map[string]*entity.GameState)
		games["OPENROOM"] = gs
		gamesMu.Unlock()

		client := &Client{
			ID:       "client-" + playerID,
			PlayerID: playerID,
			RoomID:   "OPENROOM",
			Send:     make(chan []byte, 10),
			Hub:      hub,
		}
		hub.mu.Lock()
		hub.Clients[client] = true
		hub.mu.Unlock()
		defer func() {
			// Stop the room's turn timer so a background auto-play goroutine
			// from this play cannot leak into a later play that reuses the room.
			turnTimers.stop("OPENROOM")
			hub.mu.Lock()
			delete(hub.Clients, client)
			hub.mu.Unlock()
		}()

		payload := map[string]interface{}{
			"card": map[string]string{
				"suit":  string(card.Suit),
				"value": string(card.Value),
			},
		}
		jsonData, _ := json.Marshal(payload)
		client.handlePlayCard(json.RawMessage(jsonData))

		select {
		case msg := <-client.Send:
			var response Message
			_ = json.Unmarshal(msg, &response)
			if response.Event == "game:play_error" {
				var errData map[string]interface{}
				_ = json.Unmarshal(response.Data, &errData)
				errMsg, _ := errData["error"].(string)
				return response.Event, errMsg
			}
			return response.Event, ""
		case <-time.After(100 * time.Millisecond):
			t.Fatal("timeout waiting for response")
			return "", ""
		}
	}

	t.Run("follower cannot open the round and state is untouched", func(t *testing.T) {
		gs := newState()
		event, errMsg := play(t, gs, "follower1", entity.Card{Suit: entity.Clubs, Value: entity.King})

		if event != "game:play_error" {
			t.Fatalf("expected rejection event game:play_error, got %s", event)
		}
		if errMsg != "Only the leader can open the round" {
			t.Errorf("expected leader-open error, got %q", errMsg)
		}
		// Harmless rejection: nothing mutated.
		if len(gs.PlayedCards) != 0 {
			t.Errorf("expected no cards played after rejection, got %d", len(gs.PlayedCards))
		}
		if gs.LedSuit != nil {
			t.Errorf("expected led suit to remain unset after rejection, got %v", *gs.LedSuit)
		}
		if f := gs.GetPlayer("follower1"); len(f.Hand) != 1 || f.HasPlayedCard {
			t.Errorf("follower's hand/played-flag should be untouched after rejection")
		}
	})

	t.Run("leader opens the round successfully", func(t *testing.T) {
		gs := newState()
		event, errMsg := play(t, gs, "leader", entity.Card{Suit: entity.Hearts, Value: entity.Ace})

		if event != "cardPlayed" {
			t.Fatalf("expected leader open to be accepted (cardPlayed), got %s (%s)", event, errMsg)
		}
		if gs.LedSuit == nil || *gs.LedSuit != entity.Hearts {
			t.Errorf("expected led suit to be hearts after the leader opens")
		}
		if len(gs.PlayedCards) != 1 {
			t.Errorf("expected 1 played card after the leader opens, got %d", len(gs.PlayedCards))
		}
	})

	t.Run("after opening, a not-on-deck follower may still play", func(t *testing.T) {
		gs := newState()
		// Leader opens.
		if event, _ := play(t, gs, "leader", entity.Card{Suit: entity.Hearts, Value: entity.Ace}); event != "cardPlayed" {
			t.Fatalf("precondition failed: leader could not open, got %s", event)
		}
		// CurrentTurn now points at follower1, but follower2 (not on deck)
		// plays anyway. Strict turn order must NOT block this.
		if gs.CurrentTurn == "follower2" {
			t.Fatalf("test precondition: expected follower2 to not be the on-deck player")
		}
		event, errMsg := play(t, gs, "follower2", entity.Card{Suit: entity.Spades, Value: entity.Queen})
		if event != "cardPlayed" {
			t.Fatalf("expected out-of-order follower play to be accepted, got %s (%s)", event, errMsg)
		}
		if pc := gs.GetPlayedCard("follower2"); pc == nil {
			t.Error("expected follower2's card to be recorded despite not being on deck")
		}
	})
}

// TestCalculateRoundWinner covers trick resolution: the highest card of the led
// suit wins; a player who did not follow the led suit cannot win regardless of
// rank; and if nobody follows the led suit the leader wins by default.
func TestCalculateRoundWinner(t *testing.T) {
	hearts := entity.Hearts

	tests := []struct {
		name        string
		leaderID    string
		ledSuit     *entity.Suit
		playedCards []entity.PlayedCard
		wantWinner  string
	}{
		{
			name:     "highest card of the led suit wins",
			leaderID: "p1",
			ledSuit:  &hearts,
			playedCards: []entity.PlayedCard{
				{PlayerID: "p1", Card: entity.Card{Suit: entity.Hearts, Value: entity.Ten}},
				{PlayerID: "p2", Card: entity.Card{Suit: entity.Hearts, Value: entity.King}},
				{PlayerID: "p3", Card: entity.Card{Suit: entity.Hearts, Value: entity.Seven}},
			},
			wantWinner: "p2",
		},
		{
			name:     "off-suit high card cannot beat a low led-suit card",
			leaderID: "p1",
			ledSuit:  &hearts,
			playedCards: []entity.PlayedCard{
				{PlayerID: "p1", Card: entity.Card{Suit: entity.Hearts, Value: entity.Six}},
				// King of spades is a higher rank but off-suit, so it cannot win.
				{PlayerID: "p2", Card: entity.Card{Suit: entity.Spades, Value: entity.King}},
			},
			wantWinner: "p1",
		},
		{
			name:     "leader wins when no follower plays the led suit",
			leaderID: "p1",
			ledSuit:  &hearts,
			playedCards: []entity.PlayedCard{
				{PlayerID: "p1", Card: entity.Card{Suit: entity.Hearts, Value: entity.Nine}},
				{PlayerID: "p2", Card: entity.Card{Suit: entity.Clubs, Value: entity.Ace}},
				{PlayerID: "p3", Card: entity.Card{Suit: entity.Spades, Value: entity.King}},
			},
			wantWinner: "p1",
		},
		{
			// Defensive path: led suit is set but not a single played card
			// matches it. calculateRoundWinner must fall back to the leader
			// rather than panic or pick an off-suit card.
			name:     "no played card matches the led suit falls back to leader",
			leaderID: "p3",
			ledSuit:  &hearts,
			playedCards: []entity.PlayedCard{
				{PlayerID: "p1", Card: entity.Card{Suit: entity.Clubs, Value: entity.Ace}},
				{PlayerID: "p3", Card: entity.Card{Suit: entity.Spades, Value: entity.King}},
			},
			wantWinner: "p3",
		},
	}

	client := &Client{}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gs := &entity.GameState{
				GameID:      "game-winner",
				RoomCode:    "WINROOM",
				Phase:       entity.PhasePlaying,
				LeaderID:    tt.leaderID,
				LedSuit:     tt.ledSuit,
				PlayedCards: tt.playedCards,
			}

			got := client.calculateRoundWinner(gs)
			if got != tt.wantWinner {
				t.Errorf("expected winner %s, got %s", tt.wantWinner, got)
			}
		})
	}
}
