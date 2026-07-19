package websocket

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestHandlePlayCard tests the handlePlayCard function
func TestHandlePlayCard(t *testing.T) {
	tests := []struct {
		name              string
		setupGameState    func() *entity.GameState
		playerID          string
		roomID            string
		cardPayload       map[string]interface{}
		expectError       bool
		expectedErrorType string
		validateResult    func(t *testing.T, gs *entity.GameState)
	}{
		{
			name: "valid card play - frontend format with rank field",
			setupGameState: func() *entity.GameState {
				return &entity.GameState{
					GameID:      "game-frontend",
					RoomCode:    "ROOMF",
					TotalRounds: 5,
					PointsToWin: 10,
					Phase:       entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{
							ID:       "player1",
							Username: "Alice",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.Ace},
								{Suit: entity.Clubs, Value: entity.King},
							},
							HasPlayedCard: false,
						},
						{
							ID:            "player2",
							Username:      "Bob",
							Hand:          []entity.Card{{Suit: entity.Hearts, Value: entity.Ten}},
							HasPlayedCard: false,
						},
					},
					LeaderID:      "player1",
					CurrentTurn:   "player1",
					CurrentRound:  1,
					LedSuit:       nil,
					PlayedCards:   []entity.PlayedCard{},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 30,
					StartedAt:     time.Now(),
					UpdatedAt:     time.Now(),
				}
			},
			playerID: "player1",
			roomID:   "ROOMF",
			cardPayload: map[string]interface{}{
				"card": map[string]string{
					"suit": "hearts",
					"rank": "A", // Frontend uses "rank": "A" instead of "value": "ace"
					"id":   "hearts-A",
				},
			},
			expectError: false,
			validateResult: func(t *testing.T, gs *entity.GameState) {
				player := gs.GetPlayer("player1")
				if len(player.Hand) != 1 {
					t.Errorf("expected 1 card in hand, got %d", len(player.Hand))
				}
				if !player.HasPlayedCard {
					t.Error("player should be marked as having played card")
				}
				if len(gs.PlayedCards) != 1 {
					t.Fatalf("expected 1 played card, got %d", len(gs.PlayedCards))
				}
				if gs.PlayedCards[0].Card.Value != entity.Ace {
					t.Errorf("expected ace, got %s", gs.PlayedCards[0].Card.Value)
				}
			},
		},
		{
			name: "valid card play - first player leads",
			setupGameState: func() *entity.GameState {
				return &entity.GameState{
					GameID:      "game-1",
					RoomCode:    "ROOM1",
					TotalRounds: 5,
					PointsToWin: 10,
					Phase:       entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{
							ID:       "player1",
							Username: "Alice",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.Ace},
								{Suit: entity.Clubs, Value: entity.King},
								{Suit: entity.Spades, Value: entity.Queen},
							},
							HasPlayedCard: false,
						},
						{
							ID:            "player2",
							Username:      "Bob",
							Hand:          []entity.Card{{Suit: entity.Hearts, Value: entity.Ten}},
							HasPlayedCard: false,
						},
					},
					LeaderID:      "player1",
					CurrentTurn:   "player1",
					CurrentRound:  1,
					LedSuit:       nil,
					PlayedCards:   []entity.PlayedCard{},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 30,
					StartedAt:     time.Now(),
					UpdatedAt:     time.Now(),
				}
			},
			playerID: "player1",
			roomID:   "ROOM1",
			cardPayload: map[string]interface{}{
				"card": map[string]string{
					"suit":  "hearts",
					"value": "ace",
				},
			},
			expectError: false,
			validateResult: func(t *testing.T, gs *entity.GameState) {
				// Player should have card removed from hand
				player := gs.GetPlayer("player1")
				if player == nil {
					t.Fatal("player1 not found")
				}
				if len(player.Hand) != 2 {
					t.Errorf("expected 2 cards in hand, got %d", len(player.Hand))
				}
				// Check card was removed
				for _, card := range player.Hand {
					if card.Suit == entity.Hearts && card.Value == entity.Ace {
						t.Error("ace of hearts should be removed from hand")
					}
				}
				// Player should be marked as played
				if !player.HasPlayedCard {
					t.Error("player should be marked as having played card")
				}
				// PlayedCards should contain the card
				if len(gs.PlayedCards) != 1 {
					t.Fatalf("expected 1 played card, got %d", len(gs.PlayedCards))
				}
				if gs.PlayedCards[0].PlayerID != "player1" {
					t.Errorf("expected playerID player1, got %s", gs.PlayedCards[0].PlayerID)
				}
				if gs.PlayedCards[0].Card.Suit != entity.Hearts {
					t.Errorf("expected suit hearts, got %s", gs.PlayedCards[0].Card.Suit)
				}
				if gs.PlayedCards[0].Card.Value != entity.Ace {
					t.Errorf("expected value ace, got %s", gs.PlayedCards[0].Card.Value)
				}
				// Led suit should be set
				if gs.LedSuit == nil || *gs.LedSuit != entity.Hearts {
					t.Error("led suit should be set to hearts")
				}
				// Turn should advance to next player
				if gs.CurrentTurn != "player2" {
					t.Errorf("expected current turn player2, got %s", gs.CurrentTurn)
				}
			},
		},
		{
			name: "valid card play - second player follows",
			setupGameState: func() *entity.GameState {
				ledSuit := entity.Hearts
				return &entity.GameState{
					GameID:      "game-2",
					RoomCode:    "ROOM2",
					TotalRounds: 5,
					PointsToWin: 10,
					Phase:       entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{
							ID:       "player1",
							Username: "Alice",
							Hand: []entity.Card{
								{Suit: entity.Clubs, Value: entity.King},
							},
							HasPlayedCard: true,
						},
						{
							ID:       "player2",
							Username: "Bob",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.Ten},
								{Suit: entity.Spades, Value: entity.Jack},
							},
							HasPlayedCard: false,
						},
					},
					LeaderID:     "player1",
					CurrentTurn:  "player2",
					CurrentRound: 1,
					LedSuit:      &ledSuit,
					PlayedCards: []entity.PlayedCard{
						{
							PlayerID: "player1",
							Card:     entity.Card{Suit: entity.Hearts, Value: entity.Ace},
							PlayedAt: time.Now(),
						},
					},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 30,
					StartedAt:     time.Now(),
					UpdatedAt:     time.Now(),
				}
			},
			playerID: "player2",
			roomID:   "ROOM2",
			cardPayload: map[string]interface{}{
				"card": map[string]string{
					"suit":  "hearts",
					"value": "10",
				},
			},
			expectError: false,
			validateResult: func(t *testing.T, gs *entity.GameState) {
				// Player2 should have the played card removed from hand.
				player := gs.GetPlayer("player2")
				if len(player.Hand) != 1 {
					t.Errorf("expected 1 card in hand, got %d", len(player.Hand))
				}
				// This was the final play of the round, so the round auto-completes:
				// the highest led-suit card (player1's Ace of hearts beats player2's
				// 10) wins the trick and the round state resets for the next round.
				if gs.CurrentRound != 2 {
					t.Errorf("expected round to advance to 2, got %d", gs.CurrentRound)
				}
				if len(gs.PlayedCards) != 0 {
					t.Errorf("expected played cards to reset to 0 after round completion, got %d", len(gs.PlayedCards))
				}
				if winner := gs.GetPlayer("player1"); winner.RoundsWon != 1 {
					t.Errorf("expected player1 to have won 1 round, got %d", winner.RoundsWon)
				}
				// Round winner leads the next round.
				if gs.LeaderID != "player1" {
					t.Errorf("expected round winner player1 to lead next round, got %s", gs.LeaderID)
				}
			},
		},
		{
			name: "three players - round completes when all play",
			setupGameState: func() *entity.GameState {
				ledSuit := entity.Clubs
				return &entity.GameState{
					GameID:      "game-3",
					RoomCode:    "ROOM3",
					TotalRounds: 5,
					PointsToWin: 10,
					Phase:       entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{
							ID:            "player1",
							Username:      "Alice",
							Hand:          []entity.Card{{Suit: entity.Hearts, Value: entity.King}},
							HasPlayedCard: true,
						},
						{
							ID:            "player2",
							Username:      "Bob",
							Hand:          []entity.Card{{Suit: entity.Spades, Value: entity.Queen}},
							HasPlayedCard: true,
						},
						{
							ID:       "player3",
							Username: "Charlie",
							Hand: []entity.Card{
								{Suit: entity.Clubs, Value: entity.Jack},
								{Suit: entity.Diamonds, Value: entity.Nine},
							},
							HasPlayedCard: false,
						},
					},
					LeaderID:     "player1",
					CurrentTurn:  "player3",
					CurrentRound: 1,
					LedSuit:      &ledSuit,
					PlayedCards: []entity.PlayedCard{
						{PlayerID: "player1", Card: entity.Card{Suit: entity.Clubs, Value: entity.Ace}, PlayedAt: time.Now()},
						{PlayerID: "player2", Card: entity.Card{Suit: entity.Clubs, Value: entity.King}, PlayedAt: time.Now()},
					},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 30,
					StartedAt:     time.Now(),
					UpdatedAt:     time.Now(),
				}
			},
			playerID: "player3",
			roomID:   "ROOM3",
			cardPayload: map[string]interface{}{
				"card": map[string]string{
					"suit":  "clubs",
					"value": "jack",
				},
			},
			expectError: false,
			validateResult: func(t *testing.T, gs *entity.GameState) {
				// The third play completes the round, which auto-resolves and
				// resets. player1's Ace of clubs is the highest led-suit card and
				// wins the trick.
				if gs.CurrentRound != 2 {
					t.Errorf("expected round to advance to 2, got %d", gs.CurrentRound)
				}
				if len(gs.PlayedCards) != 0 {
					t.Errorf("expected played cards to reset to 0 after round completion, got %d", len(gs.PlayedCards))
				}
				if winner := gs.GetPlayer("player1"); winner.RoundsWon != 1 {
					t.Errorf("expected player1 to have won 1 round, got %d", winner.RoundsWon)
				}
				if gs.LeaderID != "player1" {
					t.Errorf("expected round winner player1 to lead next round, got %s", gs.LeaderID)
				}
			},
		},
		{
			name:           "error - player not authenticated",
			setupGameState: func() *entity.GameState { return nil },
			playerID:       "", // Empty player ID
			roomID:         "ROOM1",
			cardPayload: map[string]interface{}{
				"card": map[string]string{"suit": "hearts", "value": "ace"},
			},
			expectError:       true,
			expectedErrorType: "game:play_error",
		},
		{
			name:           "error - player not in a room",
			setupGameState: func() *entity.GameState { return nil },
			playerID:       "player1",
			roomID:         "", // Empty room ID
			cardPayload: map[string]interface{}{
				"card": map[string]string{"suit": "hearts", "value": "ace"},
			},
			expectError:       true,
			expectedErrorType: "game:play_error",
		},
		{
			name:              "error - invalid JSON payload",
			setupGameState:    func() *entity.GameState { return nil },
			playerID:          "player1",
			roomID:            "ROOM1",
			cardPayload:       map[string]interface{}{}, // Missing card data
			expectError:       true,
			expectedErrorType: "game:play_error",
		},
		{
			name: "error - not player's turn",
			setupGameState: func() *entity.GameState {
				return &entity.GameState{
					GameID:   "game-4",
					RoomCode: "ROOM4",
					Phase:    entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{ID: "player1", Username: "Alice", Hand: []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}}},
						{ID: "player2", Username: "Bob", Hand: []entity.Card{{Suit: entity.Clubs, Value: entity.King}}},
					},
					LeaderID:    "player1",
					CurrentTurn: "player1", // Player1's turn, not player2
					PlayedCards: []entity.PlayedCard{},
				}
			},
			playerID: "player2", // Wrong player
			roomID:   "ROOM4",
			cardPayload: map[string]interface{}{
				"card": map[string]string{"suit": "clubs", "value": "king"},
			},
			expectError:       true,
			expectedErrorType: "game:play_error",
		},
		{
			name: "error - card not in player's hand",
			setupGameState: func() *entity.GameState {
				return &entity.GameState{
					GameID:   "game-5",
					RoomCode: "ROOM5",
					Phase:    entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{
							ID:       "player1",
							Username: "Alice",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.King}, // Only has King, not Ace
							},
						},
					},
					LeaderID:    "player1",
					CurrentTurn: "player1",
					PlayedCards: []entity.PlayedCard{},
				}
			},
			playerID: "player1",
			roomID:   "ROOM5",
			cardPayload: map[string]interface{}{
				"card": map[string]string{
					"suit":  "hearts",
					"value": "ace", // Trying to play Ace, but only has King
				},
			},
			expectError:       true,
			expectedErrorType: "game:play_error",
		},
		{
			name: "error - invalid card suit",
			setupGameState: func() *entity.GameState {
				return &entity.GameState{
					GameID:      "game-6",
					RoomCode:    "ROOM6",
					Phase:       entity.PhasePlaying,
					Players:     []entity.GamePlayer{{ID: "player1", Username: "Alice", Hand: []entity.Card{}}},
					LeaderID:    "player1",
					CurrentTurn: "player1",
					PlayedCards: []entity.PlayedCard{},
				}
			},
			playerID: "player1",
			roomID:   "ROOM6",
			cardPayload: map[string]interface{}{
				"card": map[string]string{
					"suit":  "invalid_suit",
					"value": "ace",
				},
			},
			expectError:       true,
			expectedErrorType: "game:play_error",
		},
		{
			name: "error - invalid card value",
			setupGameState: func() *entity.GameState {
				return &entity.GameState{
					GameID:      "game-7",
					RoomCode:    "ROOM7",
					Phase:       entity.PhasePlaying,
					Players:     []entity.GamePlayer{{ID: "player1", Username: "Alice", Hand: []entity.Card{}}},
					LeaderID:    "player1",
					CurrentTurn: "player1",
					PlayedCards: []entity.PlayedCard{},
				}
			},
			playerID: "player1",
			roomID:   "ROOM7",
			cardPayload: map[string]interface{}{
				"card": map[string]string{
					"suit":  "hearts",
					"value": "invalid_value",
				},
			},
			expectError:       true,
			expectedErrorType: "game:play_error",
		},
		{
			name: "error - game not in playing phase",
			setupGameState: func() *entity.GameState {
				return &entity.GameState{
					GameID:      "game-8",
					RoomCode:    "ROOM8",
					Phase:       entity.PhaseGameOver, // Game is over
					Players:     []entity.GamePlayer{{ID: "player1", Username: "Alice", Hand: []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}}}},
					LeaderID:    "player1",
					CurrentTurn: "player1",
					PlayedCards: []entity.PlayedCard{},
				}
			},
			playerID: "player1",
			roomID:   "ROOM8",
			cardPayload: map[string]interface{}{
				"card": map[string]string{"suit": "hearts", "value": "ace"},
			},
			expectError:       true,
			expectedErrorType: "game:play_error",
		},
		{
			name: "error - player already played this round",
			setupGameState: func() *entity.GameState {
				return &entity.GameState{
					GameID:   "game-9",
					RoomCode: "ROOM9",
					Phase:    entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{
							ID:            "player1",
							Username:      "Alice",
							Hand:          []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}},
							HasPlayedCard: true, // Already played
						},
					},
					LeaderID:    "player1",
					CurrentTurn: "player1",
					PlayedCards: []entity.PlayedCard{
						{PlayerID: "player1", Card: entity.Card{Suit: entity.Clubs, Value: entity.King}, PlayedAt: time.Now()},
					},
				}
			},
			playerID: "player1",
			roomID:   "ROOM9",
			cardPayload: map[string]interface{}{
				"card": map[string]string{"suit": "hearts", "value": "ace"},
			},
			expectError:       true,
			expectedErrorType: "game:play_error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup: Reset and prepare game state
			gamesMu.Lock()
			games = make(map[string]*entity.GameState)
			if tt.setupGameState != nil {
				gs := tt.setupGameState()
				if gs != nil {
					games[tt.roomID] = gs
				}
			}
			gamesMu.Unlock()

			// Create mock client and register with hub
			client := &Client{
				ID:       "client-1",
				PlayerID: tt.playerID,
				RoomID:   tt.roomID,
				Send:     make(chan []byte, 10),
				Hub:      hub,
			}

			// Register client with hub for broadcasts
			hub.mu.Lock()
			hub.Clients[client] = true
			hub.mu.Unlock()

			// Clean up after test
			defer func() {
				hub.mu.Lock()
				delete(hub.Clients, client)
				hub.mu.Unlock()
			}()

			// Marshal card payload to JSON
			jsonData, err := json.Marshal(tt.cardPayload)
			if err != nil {
				t.Fatalf("failed to marshal payload: %v", err)
			}

			// Execute: Call handlePlayCard
			client.handlePlayCard(json.RawMessage(jsonData))

			// Verify: Check for error response
			select {
			case msg := <-client.Send:
				var response Message
				if err := json.Unmarshal(msg, &response); err != nil {
					t.Fatalf("failed to unmarshal response: %v", err)
				}

				if tt.expectError {
					// Should receive error event
					if response.Event != tt.expectedErrorType {
						t.Errorf("expected error event %s, got %s", tt.expectedErrorType, response.Event)
					}
				} else {
					// Should receive the broadcast success event. The authoritative
					// runtime broadcasts "cardPlayed" (matching the frontend
					// contract) to every client in the room, including the sender.
					if response.Event != "cardPlayed" {
						t.Errorf("expected event cardPlayed, got %s", response.Event)
					}

					// Validate game state changes
					gamesMu.RLock()
					gs := games[tt.roomID]
					gamesMu.RUnlock()

					if gs == nil {
						t.Fatal("game state should exist")
					}

					if tt.validateResult != nil {
						tt.validateResult(t, gs)
					}
				}
			case <-time.After(100 * time.Millisecond):
				if !tt.expectError {
					t.Error("expected response but got timeout")
				}
			}
		})
	}
}

// TestHandlePlayCard_OffSuitFreedom verifies the pinned owner rule that forced
// follow-suit is REMOVED: a player may break suit even while holding the led
// suit, and the engine ACCEPTS it (illegal off-suit plays are policed later by
// the flag/challenge mechanic, not rejected inline).
//
// This replaces the former TestHandlePlayCard_FollowSuitValidation, whose
// "error - player doesn't follow suit when they have it" case asserted the now
// overruled forced-follow-suit behavior (rejecting off-suit with "Must follow
// suit"). That case has been rewritten to assert acceptance.
func TestHandlePlayCard_OffSuitFreedom(t *testing.T) {
	tests := []struct {
		name        string
		playerHand  []entity.Card
		ledSuit     entity.Suit
		cardToPlay  entity.Card
		expectError bool
		errorMsg    string
	}{
		{
			name: "accepted - player follows suit when they have it",
			playerHand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Ten},
				{Suit: entity.Clubs, Value: entity.King},
			},
			ledSuit:     entity.Hearts,
			cardToPlay:  entity.Card{Suit: entity.Hearts, Value: entity.Ten},
			expectError: false,
		},
		{
			name: "accepted - player plays different suit when they don't have led suit",
			playerHand: []entity.Card{
				{Suit: entity.Clubs, Value: entity.King},
				{Suit: entity.Spades, Value: entity.Queen},
			},
			ledSuit:     entity.Hearts,
			cardToPlay:  entity.Card{Suit: entity.Clubs, Value: entity.King},
			expectError: false,
		},
		{
			// Pinned-rule change: off-suit is ACCEPTED even while holding the
			// led suit. Previously this asserted a "Must follow suit" rejection.
			name: "accepted - player breaks suit while holding the led suit (off-suit freedom)",
			playerHand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Ten},
				{Suit: entity.Clubs, Value: entity.King},
			},
			ledSuit:     entity.Hearts,
			cardToPlay:  entity.Card{Suit: entity.Clubs, Value: entity.King},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup game state
			gamesMu.Lock()
			games = make(map[string]*entity.GameState)
			games["TESTROOM"] = &entity.GameState{
				GameID:   "game-test",
				RoomCode: "TESTROOM",
				Phase:    entity.PhasePlaying,
				Players: []entity.GamePlayer{
					{ID: "leader", Username: "Leader", Hand: []entity.Card{}, HasPlayedCard: true},
					{ID: "player1", Username: "Player1", Hand: tt.playerHand, HasPlayedCard: false},
				},
				LeaderID:    "leader",
				CurrentTurn: "player1",
				LedSuit:     &tt.ledSuit,
				PlayedCards: []entity.PlayedCard{
					{PlayerID: "leader", Card: entity.Card{Suit: tt.ledSuit, Value: entity.Ace}, PlayedAt: time.Now()},
				},
			}
			gamesMu.Unlock()

			// Create client and register with hub
			client := &Client{
				ID:       "client-1",
				PlayerID: "player1",
				RoomID:   "TESTROOM",
				Send:     make(chan []byte, 10),
				Hub:      hub,
			}

			// Register client with hub for broadcasts
			hub.mu.Lock()
			hub.Clients[client] = true
			hub.mu.Unlock()

			// Clean up after test
			defer func() {
				hub.mu.Lock()
				delete(hub.Clients, client)
				hub.mu.Unlock()
			}()

			// Prepare payload
			payload := map[string]interface{}{
				"card": map[string]string{
					"suit":  string(tt.cardToPlay.Suit),
					"value": string(tt.cardToPlay.Value),
				},
			}
			jsonData, _ := json.Marshal(payload)

			// Execute
			client.handlePlayCard(json.RawMessage(jsonData))

			// Verify
			select {
			case msg := <-client.Send:
				var response Message
				json.Unmarshal(msg, &response)

				if tt.expectError {
					if response.Event != "game:play_error" {
						t.Errorf("expected error event, got %s", response.Event)
					}
					// Check error message contains expected text
					var errData map[string]interface{}
					json.Unmarshal(response.Data, &errData)
					if errMsg, ok := errData["error"].(string); ok {
						if tt.errorMsg != "" && errMsg != tt.errorMsg {
							t.Errorf("expected error message '%s', got '%s'", tt.errorMsg, errMsg)
						}
					}
				} else {
					if response.Event != "cardPlayed" {
						t.Errorf("expected success event cardPlayed, got %s", response.Event)
					}
				}
			case <-time.After(100 * time.Millisecond):
				t.Error("timeout waiting for response")
			}
		})
	}
}

// TestHandlePlayCard_ThreadSafety tests concurrent card plays
func TestHandlePlayCard_ThreadSafety(t *testing.T) {
	// Setup game with 4 players
	gamesMu.Lock()
	games = make(map[string]*entity.GameState)
	games["RACET"] = &entity.GameState{
		GameID:   "race-test",
		RoomCode: "RACET",
		Phase:    entity.PhasePlaying,
		Players: []entity.GamePlayer{
			{ID: "p1", Username: "P1", Hand: []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}}, HasPlayedCard: false},
			{ID: "p2", Username: "P2", Hand: []entity.Card{{Suit: entity.Hearts, Value: entity.King}}, HasPlayedCard: false},
			{ID: "p3", Username: "P3", Hand: []entity.Card{{Suit: entity.Hearts, Value: entity.Queen}}, HasPlayedCard: false},
			{ID: "p4", Username: "P4", Hand: []entity.Card{{Suit: entity.Hearts, Value: entity.Jack}}, HasPlayedCard: false},
		},
		LeaderID:    "p1",
		CurrentTurn: "p1",
		LedSuit:     nil,
		PlayedCards: []entity.PlayedCard{},
	}
	gamesMu.Unlock()

	// Create clients for each player
	clients := make([]*Client, 4)
	for i := 0; i < 4; i++ {
		clients[i] = &Client{
			ID:       "client-" + string(rune('1'+i)),
			PlayerID: "p" + string(rune('1'+i)),
			RoomID:   "RACET",
			Send:     make(chan []byte, 10),
			Hub:      hub,
		}
	}

	// Try to have all players play simultaneously (only current turn player should succeed)
	done := make(chan bool, 4)
	for i := 0; i < 4; i++ {
		go func(idx int) {
			payload := map[string]interface{}{
				"card": map[string]string{
					"suit":  "hearts",
					"value": []string{"ace", "king", "queen", "jack"}[idx],
				},
			}
			jsonData, _ := json.Marshal(payload)
			clients[idx].handlePlayCard(json.RawMessage(jsonData))
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 4; i++ {
		<-done
	}

	// Only the first player should have succeeded
	gamesMu.RLock()
	gs := games["RACET"]
	playedCount := len(gs.PlayedCards)
	gamesMu.RUnlock()

	// Due to race conditions, at least player1 should have played
	// Other players might have gotten turn validation errors
	if playedCount < 1 {
		t.Error("expected at least 1 card to be played")
	}
}
