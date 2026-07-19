package websocket

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// registerTestClient wires a client into the global hub and games map for a
// room, resetting both the game store and the cumulative match-score store so
// each test starts from a clean slate. It returns the client and a cleanup fn.
func registerTestClient(t *testing.T, roomID, playerID string, gs *entity.GameState) (*Client, func()) {
	t.Helper()

	gamesMu.Lock()
	games = make(map[string]*entity.GameState)
	games[roomID] = gs
	gamesMu.Unlock()

	matchScoresMu.Lock()
	matchScores = make(map[string]map[string]int)
	matchScoresMu.Unlock()

	client := &Client{
		ID:       "client-" + playerID,
		PlayerID: playerID,
		RoomID:   roomID,
		Send:     make(chan []byte, 100),
		Hub:      hub,
	}
	hub.mu.Lock()
	hub.Clients[client] = true
	hub.mu.Unlock()

	cleanup := func() {
		hub.mu.Lock()
		delete(hub.Clients, client)
		hub.mu.Unlock()
	}
	return client, cleanup
}

// drainForEvent reads the client's Send channel and returns the data payload of
// the first message whose event matches, or nil if none arrives promptly.
func drainForEvent(client *Client, event string) map[string]interface{} {
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
			if m.Event == event {
				return m.Data
			}
		case <-deadline:
			return nil
		}
	}
}

// finalRoundState builds a game state sitting on the final round where, given
// hearts is led, winnerHeartsCard wins the trick (the other player plays an
// off-suit club and therefore cannot win the led suit).
func finalRoundState(roomCode, leaderID string, winnerHeartsCard entity.Value) *entity.GameState {
	hearts := entity.Hearts
	return &entity.GameState{
		GameID:      "game-" + roomCode,
		RoomCode:    roomCode,
		TotalRounds: 5,
		PointsToWin: 10,
		Phase:       entity.PhasePlaying,
		Players: []entity.GamePlayer{
			{ID: "player1", Username: "Alice", HasPlayedCard: true},
			{ID: "player2", Username: "Bob", HasPlayedCard: true},
		},
		LeaderID:     leaderID,
		CurrentTurn:  leaderID,
		CurrentRound: 5,
		LedSuit:      &hearts,
		PlayedCards: []entity.PlayedCard{
			{PlayerID: "player1", Card: entity.Card{Suit: entity.Hearts, Value: winnerHeartsCard}, PlayedAt: time.Now()},
			{PlayerID: "player2", Card: entity.Card{Suit: entity.Clubs, Value: entity.King}, PlayedAt: time.Now()},
		},
		StartedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// TestHandleRoundCompletion_FinalRoundValueScoring verifies the final-round
// value scoring (6 -> 3, 7 -> 2, 8+ -> 1) is applied to both the per-game score
// and the cumulative match score, and that the game ends.
func TestHandleRoundCompletion_FinalRoundValueScoring(t *testing.T) {
	tests := []struct {
		name        string
		winningCard entity.Value
		wantPoints  int
	}{
		{"win with six scores three", entity.Six, 3},
		{"win with seven scores two", entity.Seven, 2},
		{"win with eight scores one", entity.Eight, 1},
		{"win with ten scores one", entity.Ten, 1},
		{"win with king scores one", entity.King, 1},
		{"win with ace scores one", entity.Ace, 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			roomID := "SCORE"
			gs := finalRoundState(roomID, "player1", tt.winningCard)
			client, cleanup := registerTestClient(t, roomID, "player1", gs)
			defer cleanup()

			client.handleRoundCompletion(gs)

			if gs.Phase != entity.PhaseGameOver {
				t.Errorf("expected phase %s, got %s", entity.PhaseGameOver, gs.Phase)
			}
			p1 := gs.GetPlayer("player1")
			if p1.Score != tt.wantPoints {
				t.Errorf("per-game Score = %d, want %d", p1.Score, tt.wantPoints)
			}
			if p1.MatchScore != tt.wantPoints {
				t.Errorf("MatchScore = %d, want %d", p1.MatchScore, tt.wantPoints)
			}
			if got := getMatchScore(roomID, "player1"); got != tt.wantPoints {
				t.Errorf("persisted match score = %d, want %d", got, tt.wantPoints)
			}
			// The non-winner never scores.
			if p2 := gs.GetPlayer("player2"); p2.Score != 0 {
				t.Errorf("loser Score = %d, want 0", p2.Score)
			}
			// GetWinningPlayer must return the highest scorer (the round-5 winner).
			if w := gs.GetWinningPlayer(); w == nil || w.ID != "player1" {
				t.Errorf("GetWinningPlayer() = %v, want player1", w)
			}

			data := drainForEvent(client, "gameEnded")
			if data == nil {
				t.Fatal("expected a gameEnded broadcast")
			}
			if data["winnerId"] != "player1" {
				t.Errorf("gameEnded winnerId = %v, want player1", data["winnerId"])
			}
			if got := int(data["winnerScore"].(float64)); got != tt.wantPoints {
				t.Errorf("gameEnded winnerScore = %d, want %d", got, tt.wantPoints)
			}
		})
	}
}

// TestHandleRoundCompletion_GameEndsOnRoundFiveWinner verifies the game ends on
// round 5 and the winner is the final-round trick winner, NOT the round leader.
func TestHandleRoundCompletion_GameEndsOnRoundFiveWinner(t *testing.T) {
	roomID := "R5"
	// player2 leads the final round with hearts-8; player1 overtakes with
	// hearts-king and wins the trick. The game winner must be player1, not the
	// leader player2.
	hearts := entity.Hearts
	gs := &entity.GameState{
		GameID:      "game-r5",
		RoomCode:    roomID,
		TotalRounds: 5,
		Phase:       entity.PhasePlaying,
		Players: []entity.GamePlayer{
			{ID: "player1", Username: "Alice", HasPlayedCard: true},
			{ID: "player2", Username: "Bob", HasPlayedCard: true, IsLeader: true},
		},
		LeaderID:     "player2",
		CurrentRound: 5,
		LedSuit:      &hearts,
		PlayedCards: []entity.PlayedCard{
			{PlayerID: "player2", Card: entity.Card{Suit: entity.Hearts, Value: entity.Eight}, PlayedAt: time.Now()},
			{PlayerID: "player1", Card: entity.Card{Suit: entity.Hearts, Value: entity.King}, PlayedAt: time.Now()},
		},
		StartedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	client, cleanup := registerTestClient(t, roomID, "player1", gs)
	defer cleanup()

	client.handleRoundCompletion(gs)

	if gs.Phase != entity.PhaseGameOver {
		t.Fatalf("expected game over, got phase %s", gs.Phase)
	}
	if gs.CompletedAt == nil {
		t.Error("expected CompletedAt to be set at game over")
	}
	if w := gs.GetWinningPlayer(); w == nil || w.ID != "player1" {
		t.Errorf("winner = %v, want player1 (final-round winner, not leader)", w)
	}
	// King is an 8+ card -> 1 point.
	if got := getMatchScore(roomID, "player1"); got != 1 {
		t.Errorf("match score = %d, want 1", got)
	}
	if got := getMatchScore(roomID, "player2"); got != 0 {
		t.Errorf("leader match score = %d, want 0", got)
	}
	data := drainForEvent(client, "gameEnded")
	if data == nil || data["winnerId"] != "player1" {
		t.Errorf("gameEnded winnerId = %v, want player1", data)
	}
}

// TestHandleRoundCompletion_DoesNotEndBeforeFinalRound verifies rounds 1-4 do
// not end the game or score any value points; they only advance the round.
func TestHandleRoundCompletion_DoesNotEndBeforeFinalRound(t *testing.T) {
	for round := 1; round <= 4; round++ {
		roomID := "MID"
		gs := finalRoundState(roomID, "player1", entity.Six)
		gs.CurrentRound = round
		client, cleanup := registerTestClient(t, roomID, "player1", gs)

		client.handleRoundCompletion(gs)

		if gs.Phase == entity.PhaseGameOver {
			t.Errorf("round %d: game should not be over", round)
		}
		if gs.CurrentRound != round+1 {
			t.Errorf("round %d: expected advance to %d, got %d", round, round+1, gs.CurrentRound)
		}
		if p1 := gs.GetPlayer("player1"); p1.Score != 0 {
			t.Errorf("round %d: no value points before final round, got Score %d", round, p1.Score)
		}
		if got := getMatchScore(roomID, "player1"); got != 0 {
			t.Errorf("round %d: no match points before final round, got %d", round, got)
		}
		cleanup()
	}
}

// TestMatchScorePersistsAcrossPlayAgain verifies the cumulative match score
// survives a play-again (a fresh initializeGameState for the same room) and
// keeps accumulating, while per-game state is reset cleanly.
func TestMatchScorePersistsAcrossPlayAgain(t *testing.T) {
	roomID := "PERSIST"

	// --- Game 1: player1 wins the final round with a 6 (3 points) ---
	gs1 := finalRoundState(roomID, "player1", entity.Six)
	client, cleanup := registerTestClient(t, roomID, "player1", gs1)
	defer cleanup()

	client.handleRoundCompletion(gs1)

	if got := getMatchScore(roomID, "player1"); got != 3 {
		t.Fatalf("after game 1, match score = %d, want 3", got)
	}

	// --- Play-again: initializeGameState rebuilds a fresh game for the room. ---
	room := &entity.Room{
		RoomCode: roomID,
		Players: []entity.Player{
			{ID: "player1", Username: "Alice"},
			{ID: "player2", Username: "Bob"},
		},
		Settings: entity.RoomSettings{PointsToWin: 10},
	}
	gs2, err := initializeGameState(room)
	if err != nil {
		t.Fatalf("initializeGameState: %v", err)
	}

	// Per-game state is reset cleanly...
	if gs2.CurrentRound != 1 {
		t.Errorf("fresh game CurrentRound = %d, want 1", gs2.CurrentRound)
	}
	if len(gs2.PlayedCards) != 0 {
		t.Errorf("fresh game PlayedCards = %d, want 0", len(gs2.PlayedCards))
	}
	if gs2.Phase != entity.PhasePlaying {
		t.Errorf("fresh game Phase = %s, want %s", gs2.Phase, entity.PhasePlaying)
	}
	p1 := gs2.GetPlayer("player1")
	if p1.Score != 0 || p1.RoundsWon != 0 {
		t.Errorf("fresh game per-game state not reset: Score=%d RoundsWon=%d", p1.Score, p1.RoundsWon)
	}
	if len(p1.Hand) != 5 {
		t.Errorf("fresh game hand size = %d, want 5", len(p1.Hand))
	}
	// ...but the cumulative match score persists onto the new game state.
	if p1.MatchScore != 3 {
		t.Errorf("carried-over MatchScore = %d, want 3", p1.MatchScore)
	}

	// --- Game 2: player1 wins the final round with a 7 (2 points). ---
	// Reuse the fresh game state but force it onto a resolved final round.
	hearts := entity.Hearts
	gs2.CurrentRound = 5
	gs2.LedSuit = &hearts
	gs2.PlayedCards = []entity.PlayedCard{
		{PlayerID: "player1", Card: entity.Card{Suit: entity.Hearts, Value: entity.Seven}, PlayedAt: time.Now()},
		{PlayerID: "player2", Card: entity.Card{Suit: entity.Clubs, Value: entity.King}, PlayedAt: time.Now()},
	}
	for i := range gs2.Players {
		gs2.Players[i].HasPlayedCard = true
	}
	gamesMu.Lock()
	games[roomID] = gs2
	gamesMu.Unlock()

	client.handleRoundCompletion(gs2)

	// Cumulative match score accumulates across the two games: 3 + 2 = 5.
	if got := getMatchScore(roomID, "player1"); got != 5 {
		t.Errorf("cumulative match score after game 2 = %d, want 5", got)
	}
	if p1b := gs2.GetPlayer("player1"); p1b.MatchScore != 5 {
		t.Errorf("game-2 state MatchScore = %d, want 5", p1b.MatchScore)
	}
	// The second game's per-game score reflects only that game (2 points).
	if p1b := gs2.GetPlayer("player1"); p1b.Score != 2 {
		t.Errorf("game-2 per-game Score = %d, want 2", p1b.Score)
	}
}
