package websocket

import (
	"encoding/json"
	"testing"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestGameStateInitialization tests the initialization of game state
func TestGameStateInitialization(t *testing.T) {
	tests := []struct {
		name          string
		room          *entity.Room
		expectError   bool
		validateState func(t *testing.T, gs *entity.GameState)
	}{
		{
			name: "2 players - basic initialization",
			room: &entity.Room{
				RoomCode: "TEST2P",
				Players: []entity.Player{
					{ID: "player1", Username: "Alice", Avatar: "avatar1"},
					{ID: "player2", Username: "Bob", Avatar: "avatar2"},
				},
				Settings: entity.RoomSettings{
					PointsToWin: 10,
				},
			},
			expectError: false,
			validateState: func(t *testing.T, gs *entity.GameState) {
				if gs.RoomCode != "TEST2P" {
					t.Errorf("expected RoomCode TEST2P, got %s", gs.RoomCode)
				}
				if gs.TotalRounds != 5 {
					t.Errorf("expected TotalRounds 5, got %d", gs.TotalRounds)
				}
				if gs.PointsToWin != 10 {
					t.Errorf("expected PointsToWin 10, got %d", gs.PointsToWin)
				}
				if gs.Phase != entity.PhasePlaying {
					t.Errorf("expected Phase playing, got %s", gs.Phase)
				}
				if len(gs.Players) != 2 {
					t.Errorf("expected 2 players, got %d", len(gs.Players))
				}
				if gs.CurrentRound != 1 {
					t.Errorf("expected CurrentRound 1, got %d", gs.CurrentRound)
				}
				if gs.TurnTimeLimit != 30 {
					t.Errorf("expected TurnTimeLimit 30, got %d", gs.TurnTimeLimit)
				}
				if len(gs.PlayedCards) != 0 {
					t.Errorf("expected empty PlayedCards, got %d", len(gs.PlayedCards))
				}
			},
		},
		{
			name: "3 players - basic initialization",
			room: &entity.Room{
				RoomCode: "TEST3P",
				Players: []entity.Player{
					{ID: "player1", Username: "Alice", Avatar: "avatar1"},
					{ID: "player2", Username: "Bob", Avatar: "avatar2"},
					{ID: "player3", Username: "Charlie", Avatar: "avatar3"},
				},
				Settings: entity.RoomSettings{
					PointsToWin: 15,
				},
			},
			expectError: false,
			validateState: func(t *testing.T, gs *entity.GameState) {
				if len(gs.Players) != 3 {
					t.Errorf("expected 3 players, got %d", len(gs.Players))
				}
				if gs.PointsToWin != 15 {
					t.Errorf("expected PointsToWin 15, got %d", gs.PointsToWin)
				}
			},
		},
		{
			name: "4 players - maximum capacity",
			room: &entity.Room{
				RoomCode: "TEST4P",
				Players: []entity.Player{
					{ID: "player1", Username: "Alice", Avatar: "avatar1"},
					{ID: "player2", Username: "Bob", Avatar: "avatar2"},
					{ID: "player3", Username: "Charlie", Avatar: "avatar3"},
					{ID: "player4", Username: "Diana", Avatar: "avatar4"},
				},
				Settings: entity.RoomSettings{
					PointsToWin: 21,
				},
			},
			expectError: false,
			validateState: func(t *testing.T, gs *entity.GameState) {
				if len(gs.Players) != 4 {
					t.Errorf("expected 4 players, got %d", len(gs.Players))
				}
				if gs.PointsToWin != 21 {
					t.Errorf("expected PointsToWin 21, got %d", gs.PointsToWin)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Initialize game state
			gameState, err := initializeGameState(tt.room)

			// Check error expectation
			if tt.expectError && err == nil {
				t.Error("expected error but got none")
			}
			if !tt.expectError && err != nil {
				t.Errorf("unexpected error: %v", err)
			}

			// Skip validation if error was expected
			if tt.expectError {
				return
			}

			// Basic validation
			if gameState == nil {
				t.Fatal("gameState should not be nil")
			}

			// Validate GameID is set
			if gameState.GameID == "" {
				t.Error("GameID should not be empty")
			}

			// Validate timestamps
			if gameState.StartedAt.IsZero() {
				t.Error("StartedAt should be set")
			}
			if gameState.UpdatedAt.IsZero() {
				t.Error("UpdatedAt should be set")
			}
			if gameState.TurnStartTime.IsZero() {
				t.Error("TurnStartTime should be set")
			}

			// Validate leader and current turn.
			// Pinned owner rule: the first-round leader is chosen at RANDOM
			// (not always the first player). We therefore assert only that a
			// leader is seated, that exactly one player is flagged as leader,
			// and that LeaderID/CurrentTurn point at that same player.
			if gameState.LeaderID == "" {
				t.Error("LeaderID should be set")
			}
			if gameState.CurrentTurn == "" {
				t.Error("CurrentTurn should be set")
			}
			if gameState.CurrentTurn != gameState.LeaderID {
				t.Errorf("CurrentTurn (%s) should equal LeaderID (%s) at round start",
					gameState.CurrentTurn, gameState.LeaderID)
			}

			leaderCount := 0
			var flaggedLeaderID string
			for _, p := range gameState.Players {
				if p.IsLeader {
					leaderCount++
					flaggedLeaderID = p.ID
				}
			}
			if leaderCount != 1 {
				t.Errorf("exactly one player should be marked as leader, got %d", leaderCount)
			}
			if flaggedLeaderID != gameState.LeaderID {
				t.Errorf("the IsLeader-flagged player (%s) should match LeaderID (%s)",
					flaggedLeaderID, gameState.LeaderID)
			}

			// Run custom validation
			if tt.validateState != nil {
				tt.validateState(t, gameState)
			}
		})
	}
}

// TestCardDealing tests that cards are properly dealt to players
func TestCardDealing(t *testing.T) {
	tests := []struct {
		name        string
		numPlayers  int
		expectError bool
	}{
		{
			name:        "2 players - 5 cards each",
			numPlayers:  2,
			expectError: false,
		},
		{
			name:        "3 players - 5 cards each",
			numPlayers:  3,
			expectError: false,
		},
		{
			name:        "4 players - 5 cards each",
			numPlayers:  4,
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create room with specified number of players
			room := &entity.Room{
				RoomCode: "TESTDEAL",
				Players:  make([]entity.Player, tt.numPlayers),
				Settings: entity.RoomSettings{PointsToWin: 10},
			}
			for i := 0; i < tt.numPlayers; i++ {
				room.Players[i] = entity.Player{
					ID:       "player" + string(rune('1'+i)),
					Username: "Player" + string(rune('1'+i)),
					Avatar:   "avatar" + string(rune('1'+i)),
				}
			}

			// Initialize game state
			gameState, err := initializeGameState(room)

			if tt.expectError && err == nil {
				t.Error("expected error but got none")
			}
			if !tt.expectError && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
			if tt.expectError {
				return
			}

			// Each player should have exactly 5 cards
			for i, player := range gameState.Players {
				if len(player.Hand) != 5 {
					t.Errorf("player %d should have 5 cards, got %d", i, len(player.Hand))
				}

				// Validate no nil cards
				for j, card := range player.Hand {
					if !card.IsValid() {
						t.Errorf("player %d has invalid card at position %d: %+v", i, j, card)
					}
				}
			}

			// Verify all dealt cards are unique
			cardMap := make(map[string]bool)
			for _, player := range gameState.Players {
				for _, card := range player.Hand {
					key := string(card.Suit) + "-" + string(card.Value)
					if cardMap[key] {
						t.Errorf("duplicate card dealt: %s of %s", card.Value, card.Suit)
					}
					cardMap[key] = true
				}
			}

			// Verify correct total cards dealt
			expectedTotal := tt.numPlayers * 5
			if len(cardMap) != expectedTotal {
				t.Errorf("expected %d unique cards dealt, got %d", expectedTotal, len(cardMap))
			}
		})
	}
}

// TestGameStatePlayerConversion tests conversion from Room Players to GamePlayers
func TestGameStatePlayerConversion(t *testing.T) {
	room := &entity.Room{
		RoomCode: "TESTCONV",
		Players: []entity.Player{
			{ID: "p1", Username: "Alice", Avatar: "avatar1"},
			{ID: "p2", Username: "Bob", Avatar: "avatar2"},
		},
		Settings: entity.RoomSettings{PointsToWin: 10},
	}

	gameState, err := initializeGameState(room)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Validate player conversion
	for i, roomPlayer := range room.Players {
		gamePlayer := gameState.Players[i]

		if gamePlayer.ID != roomPlayer.ID {
			t.Errorf("player %d: expected ID %s, got %s", i, roomPlayer.ID, gamePlayer.ID)
		}
		if gamePlayer.Username != roomPlayer.Username {
			t.Errorf("player %d: expected Username %s, got %s", i, roomPlayer.Username, gamePlayer.Username)
		}
		if gamePlayer.Avatar != roomPlayer.Avatar {
			t.Errorf("player %d: expected Avatar %s, got %s", i, roomPlayer.Avatar, gamePlayer.Avatar)
		}

		// Validate initial game state
		if gamePlayer.Score != 0 {
			t.Errorf("player %d: expected Score 0, got %d", i, gamePlayer.Score)
		}
		if gamePlayer.RoundsWon != 0 {
			t.Errorf("player %d: expected RoundsWon 0, got %d", i, gamePlayer.RoundsWon)
		}
		if gamePlayer.WinStreak != 0 {
			t.Errorf("player %d: expected WinStreak 0, got %d", i, gamePlayer.WinStreak)
		}
		if gamePlayer.HasPlayedCard {
			t.Errorf("player %d: HasPlayedCard should be false", i)
		}
		if gamePlayer.IsOnFire {
			t.Errorf("player %d: IsOnFire should be false", i)
		}
	}

	// Pinned owner rule: the first-round leader is chosen at RANDOM, so we can
	// no longer assert the first player is leader. Instead assert exactly one
	// player is flagged as leader and that flag agrees with LeaderID.
	leaderCount := 0
	var flaggedLeaderID string
	for _, gamePlayer := range gameState.Players {
		if gamePlayer.IsLeader {
			leaderCount++
			flaggedLeaderID = gamePlayer.ID
		}
	}
	if leaderCount != 1 {
		t.Errorf("exactly one player should be marked as leader, got %d", leaderCount)
	}
	if flaggedLeaderID != gameState.LeaderID {
		t.Errorf("IsLeader-flagged player (%s) should match LeaderID (%s)", flaggedLeaderID, gameState.LeaderID)
	}
}

// TestThreadSafeGamesMap tests concurrent access to the games map
func TestThreadSafeGamesMap(t *testing.T) {
	// Reset games map for this test
	gamesMu.Lock()
	games = make(map[string]*entity.GameState)
	gamesMu.Unlock()

	const numGoroutines = 10
	const numOperations = 100

	// Create and store game states concurrently
	done := make(chan bool, numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		go func(id int) {
			for j := 0; j < numOperations; j++ {
				roomCode := "ROOM" + string(rune('A'+id))

				// Create a simple game state
				gs := &entity.GameState{
					GameID:   "game-" + string(rune('A'+id)),
					RoomCode: roomCode,
					Players:  []entity.GamePlayer{},
				}

				// Store
				gamesMu.Lock()
				games[roomCode] = gs
				gamesMu.Unlock()

				// Retrieve
				gamesMu.RLock()
				retrieved := games[roomCode]
				gamesMu.RUnlock()

				if retrieved == nil {
					t.Errorf("failed to retrieve game state for room %s", roomCode)
				}

				// Delete
				gamesMu.Lock()
				delete(games, roomCode)
				gamesMu.Unlock()
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines to complete
	for i := 0; i < numGoroutines; i++ {
		<-done
	}

	// Verify map is empty at the end
	gamesMu.RLock()
	mapSize := len(games)
	gamesMu.RUnlock()

	if mapSize != 0 {
		t.Errorf("expected games map to be empty, got %d entries", mapSize)
	}
}

// TestGameStateJSONSerialization tests that game state can be serialized to JSON
func TestGameStateJSONSerialization(t *testing.T) {
	room := &entity.Room{
		RoomCode: "TESTJSON",
		Players: []entity.Player{
			{ID: "p1", Username: "Alice", Avatar: "avatar1"},
			{ID: "p2", Username: "Bob", Avatar: "avatar2"},
		},
		Settings: entity.RoomSettings{PointsToWin: 10},
	}

	gameState, err := initializeGameState(room)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Serialize to JSON
	jsonData, err := json.Marshal(gameState)
	if err != nil {
		t.Fatalf("failed to marshal game state: %v", err)
	}

	// Deserialize back
	var deserializedState entity.GameState
	err = json.Unmarshal(jsonData, &deserializedState)
	if err != nil {
		t.Fatalf("failed to unmarshal game state: %v", err)
	}

	// Validate key fields
	if deserializedState.GameID != gameState.GameID {
		t.Errorf("GameID mismatch: expected %s, got %s", gameState.GameID, deserializedState.GameID)
	}
	if deserializedState.RoomCode != gameState.RoomCode {
		t.Errorf("RoomCode mismatch: expected %s, got %s", gameState.RoomCode, deserializedState.RoomCode)
	}
	if len(deserializedState.Players) != len(gameState.Players) {
		t.Errorf("Players count mismatch: expected %d, got %d", len(gameState.Players), len(deserializedState.Players))
	}

	// Validate player hands are preserved
	for i := range gameState.Players {
		if len(deserializedState.Players[i].Hand) != len(gameState.Players[i].Hand) {
			t.Errorf("player %d hand size mismatch: expected %d, got %d",
				i, len(gameState.Players[i].Hand), len(deserializedState.Players[i].Hand))
		}
	}
}
