package game

import (
	"context"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestChallengeHandler_ValidChallenge tests a valid challenge where the target player violated suit-following rules
func TestChallengeHandler_ValidChallenge(t *testing.T) {
	// Setup: Create a game where Player2 has hearts but plays spades
	gameState := createTestGameWithViolation(t)
	handler := NewChallengeHandler(gameState)

	ctx := context.Background()

	// Player1 challenges Player2's card play
	result, err := handler.HandleChallenge(ctx, "player1", "player2", 0, 1)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Verify challenge result
	if !result.IsValid {
		t.Error("Expected valid challenge, got invalid")
	}

	if result.ViolatorID != "player2" {
		t.Errorf("Expected violator player2, got: %s", result.ViolatorID)
	}

	// Verify points were adjusted
	player1 := gameState.GetPlayer("player1")
	player2 := gameState.GetPlayer("player2")

	if player1.Score != 10 { // Bonus points
		t.Errorf("Expected challenger score 10, got: %d", player1.Score)
	}

	if player2.Score != 0 { // Lost round points
		t.Errorf("Expected violator score 0, got: %d", player2.Score)
	}
}

// TestChallengeHandler_InvalidChallenge tests an invalid challenge where the target player followed rules correctly
func TestChallengeHandler_InvalidChallenge(t *testing.T) {
	// Setup: Create a game where Player2 correctly doesn't have the led suit
	gameState := createTestGameWithoutViolation(t)
	handler := NewChallengeHandler(gameState)

	ctx := context.Background()

	// Player1 incorrectly challenges Player2's card play
	result, err := handler.HandleChallenge(ctx, "player1", "player2", 0, 1)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	// Verify challenge result
	if result.IsValid {
		t.Error("Expected invalid challenge, got valid")
	}

	// Verify penalty was applied to challenger
	player1 := gameState.GetPlayer("player1")
	if player1.Score != -5 { // Penalty
		t.Errorf("Expected challenger score -5, got: %d", player1.Score)
	}

	// Verify target player unaffected
	player2 := gameState.GetPlayer("player2")
	if player2.Score != 1 { // Original round win points
		t.Errorf("Expected target score 1, got: %d", player2.Score)
	}
}

// TestChallengeHandler_TimingValidation tests the 5-second challenge window
func TestChallengeHandler_TimingValidation(t *testing.T) {
	tests := []struct {
		name          string
		roundComplete bool
		timeSince     time.Duration
		expectError   bool
		errorContains string
	}{
		{
			name:          "during round is valid",
			roundComplete: false,
			timeSince:     0,
			expectError:   false,
		},
		{
			name:          "within 5 seconds after round is valid",
			roundComplete: true,
			timeSince:     3 * time.Second,
			expectError:   false,
		},
		{
			name:          "just under 5 seconds after round is valid",
			roundComplete: true,
			timeSince:     4900 * time.Millisecond,
			expectError:   false,
		},
		{
			name:          "after 5 seconds is invalid",
			roundComplete: true,
			timeSince:     6 * time.Second,
			expectError:   true,
			errorContains: "challenge window expired",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gameState := createTestGameWithViolation(t)

			// Mark round as complete if needed
			if tt.roundComplete {
				gameState.Phase = entity.PhaseRoundEnd
				gameState.RoundWinner = "player2"
				// Simulate time passage by setting UpdatedAt to the past
				gameState.UpdatedAt = time.Now().Add(-tt.timeSince)
			}

			handler := NewChallengeHandler(gameState)
			ctx := context.Background()

			_, err := handler.HandleChallenge(ctx, "player1", "player2", 0, 1)

			if tt.expectError {
				if err == nil {
					t.Error("Expected error but got none")
				} else if tt.errorContains != "" && !contains(err.Error(), tt.errorContains) {
					t.Errorf("Expected error containing '%s', got: %v", tt.errorContains, err)
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got: %v", err)
				}
			}
		})
	}
}

// TestChallengeHandler_DuplicateChallengePrevention tests that only one challenge per player per round is allowed
func TestChallengeHandler_DuplicateChallengePrevention(t *testing.T) {
	gameState := createTestGameWithViolation(t)
	handler := NewChallengeHandler(gameState)

	ctx := context.Background()

	// First challenge should succeed
	_, err := handler.HandleChallenge(ctx, "player1", "player2", 0, 1)
	if err != nil {
		t.Fatalf("First challenge failed: %v", err)
	}

	// Second challenge from same player should fail
	_, err = handler.HandleChallenge(ctx, "player1", "player2", 0, 1)
	if err == nil {
		t.Error("Expected error for duplicate challenge, got none")
	}
	if !contains(err.Error(), "already challenged") {
		t.Errorf("Expected 'already challenged' error, got: %v", err)
	}
}

// TestChallengeHandler_EdgeCases tests various edge cases
func TestChallengeHandler_EdgeCases(t *testing.T) {
	tests := []struct {
		name          string
		setupFunc     func() (*entity.GameState, string, string, int, int)
		expectError   bool
		errorContains string
	}{
		{
			name: "challenge own card",
			setupFunc: func() (*entity.GameState, string, string, int, int) {
				gs := createTestGameWithViolation(t)
				return gs, "player2", "player2", 0, 1
			},
			expectError:   true,
			errorContains: "cannot challenge own card",
		},
		{
			name: "challenge after game over",
			setupFunc: func() (*entity.GameState, string, string, int, int) {
				gs := createTestGameWithViolation(t)
				gs.Phase = entity.PhaseGameOver
				return gs, "player1", "player2", 0, 1
			},
			expectError:   true,
			errorContains: "game is over",
		},
		{
			name: "challenge non-existent player",
			setupFunc: func() (*entity.GameState, string, string, int, int) {
				gs := createTestGameWithViolation(t)
				return gs, "player1", "nonexistent", 0, 1
			},
			expectError:   true,
			errorContains: "player not found",
		},
		{
			name: "challenge invalid round index",
			setupFunc: func() (*entity.GameState, string, string, int, int) {
				gs := createTestGameWithViolation(t)
				return gs, "player1", "player2", 10, 1
			},
			expectError:   true,
			errorContains: "invalid round index",
		},
		{
			name: "challenge invalid card index",
			setupFunc: func() (*entity.GameState, string, string, int, int) {
				gs := createTestGameWithViolation(t)
				return gs, "player1", "player2", 0, 10
			},
			expectError:   true,
			errorContains: "invalid card index",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gs, challenger, target, roundIdx, cardIdx := tt.setupFunc()
			handler := NewChallengeHandler(gs)
			ctx := context.Background()

			_, err := handler.HandleChallenge(ctx, challenger, target, roundIdx, cardIdx)

			if tt.expectError {
				if err == nil {
					t.Error("Expected error but got none")
				} else if !contains(err.Error(), tt.errorContains) {
					t.Errorf("Expected error containing '%s', got: %v", tt.errorContains, err)
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got: %v", err)
				}
			}
		})
	}
}

// TestChallengeHandler_HandReconstruction tests the hand reconstruction logic
func TestChallengeHandler_HandReconstruction(t *testing.T) {
	tests := []struct {
		name         string
		currentHand  []entity.Card // Hand AFTER cards have been played
		playedCards  []entity.Card // Cards that were played
		atCardIndex  int           // Reconstruct hand at this point
		expectedHand []entity.Card // Expected reconstructed hand
	}{
		{
			name: "reconstruct when no cards played yet",
			currentHand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Ace},
				{Suit: entity.Spades, Value: entity.King},
				{Suit: entity.Clubs, Value: entity.Queen},
			},
			playedCards: []entity.Card{},
			atCardIndex: 0,
			expectedHand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Ace},
				{Suit: entity.Spades, Value: entity.King},
				{Suit: entity.Clubs, Value: entity.Queen},
			},
		},
		{
			name: "reconstruct hand before first card was played",
			currentHand: []entity.Card{
				// Current hand after playing Ace of Hearts
				{Suit: entity.Spades, Value: entity.King},
				{Suit: entity.Clubs, Value: entity.Queen},
			},
			playedCards: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Ace},
			},
			atCardIndex: 0, // Before first card was played
			expectedHand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Ace},
				{Suit: entity.Spades, Value: entity.King},
				{Suit: entity.Clubs, Value: entity.Queen},
			},
		},
		{
			name: "reconstruct hand after first card, before second card",
			currentHand: []entity.Card{
				// Current hand after playing Ace and King of Hearts
				{Suit: entity.Spades, Value: entity.Queen},
				{Suit: entity.Clubs, Value: entity.Jack},
			},
			playedCards: []entity.Card{
				{Suit: entity.Hearts, Value: entity.Ace},
				{Suit: entity.Hearts, Value: entity.King},
			},
			atCardIndex: 1, // After first card, before second card
			expectedHand: []entity.Card{
				{Suit: entity.Hearts, Value: entity.King},
				{Suit: entity.Spades, Value: entity.Queen},
				{Suit: entity.Clubs, Value: entity.Jack},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := NewChallengeHandler(nil)

			reconstructed := handler.reconstructPlayerHand(tt.currentHand, tt.playedCards, tt.atCardIndex)

			if len(reconstructed) != len(tt.expectedHand) {
				t.Errorf("Expected %d cards, got %d", len(tt.expectedHand), len(reconstructed))
			}

			for _, expectedCard := range tt.expectedHand {
				found := false
				for _, actualCard := range reconstructed {
					if actualCard.Equals(&expectedCard) {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("Expected card %s not found in reconstructed hand", expectedCard.String())
				}
			}
		})
	}
}

// TestChallengeHandler_PointCalculations tests challenge point awards and penalties
func TestChallengeHandler_PointCalculations(t *testing.T) {
	tests := []struct {
		name               string
		challengeValid     bool
		challengerScore    int
		violatorScore      int
		expectedChallenger int
		expectedViolator   int
	}{
		{
			name:               "valid challenge awards bonus",
			challengeValid:     true,
			challengerScore:    5,
			violatorScore:      3,
			expectedChallenger: 15, // 5 + 10 bonus
			expectedViolator:   0,  // Lost all round points
		},
		{
			name:               "invalid challenge applies penalty",
			challengeValid:     false,
			challengerScore:    10,
			violatorScore:      5,
			expectedChallenger: 5, // 10 - 5 penalty
			expectedViolator:   5, // Unchanged
		},
		{
			name:               "penalty can make score negative",
			challengeValid:     false,
			challengerScore:    2,
			violatorScore:      8,
			expectedChallenger: -3, // 2 - 5 penalty
			expectedViolator:   8,  // Unchanged
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gameState := createBasicTestGame(t)
			handler := NewChallengeHandler(gameState)

			player1 := gameState.GetPlayer("player1")
			player2 := gameState.GetPlayer("player2")
			player1.Score = tt.challengerScore
			player2.Score = tt.violatorScore

			if tt.challengeValid {
				handler.applyValidChallengeOutcome(gameState, "player1", "player2")
			} else {
				handler.applyInvalidChallengeOutcome(gameState, "player1", "player2")
			}

			if player1.Score != tt.expectedChallenger {
				t.Errorf("Expected challenger score %d, got %d", tt.expectedChallenger, player1.Score)
			}

			if player2.Score != tt.expectedViolator {
				t.Errorf("Expected violator score %d, got %d", tt.expectedViolator, player2.Score)
			}
		})
	}
}

// TestChallengeHandler_ConcurrentChallenges tests race conditions with multiple concurrent challenges
func TestChallengeHandler_ConcurrentChallenges(t *testing.T) {
	gameState := createTestGameWithMultiplePlayers(t)
	handler := NewChallengeHandler(gameState)

	ctx := context.Background()

	// Multiple players challenge the same card simultaneously
	done := make(chan error, 3)

	go func() {
		_, err := handler.HandleChallenge(ctx, "player1", "player4", 0, 3)
		done <- err
	}()

	go func() {
		_, err := handler.HandleChallenge(ctx, "player2", "player4", 0, 3)
		done <- err
	}()

	go func() {
		_, err := handler.HandleChallenge(ctx, "player3", "player4", 0, 3)
		done <- err
	}()

	// Collect results
	successCount := 0
	duplicateCount := 0

	for i := 0; i < 3; i++ {
		err := <-done
		if err == nil {
			successCount++
		} else if contains(err.Error(), "already challenged") {
			duplicateCount++
		}
	}

	// All three should succeed (different challengers)
	if successCount != 3 {
		t.Errorf("Expected 3 successful challenges, got %d", successCount)
	}
}

// TestChallengeHandler_MultipleRounds tests challenges across multiple rounds
func TestChallengeHandler_MultipleRounds(t *testing.T) {
	gameState := createTestGameWithViolation(t)
	handler := NewChallengeHandler(gameState)

	ctx := context.Background()

	// Challenge in round 0
	_, err := handler.HandleChallenge(ctx, "player1", "player2", 0, 1)
	if err != nil {
		t.Fatalf("Round 0 challenge failed: %v", err)
	}

	// Advance to next round
	gameState.CurrentRound = 1
	gameState.PlayedCards = []entity.PlayedCard{}
	gameState.UpdatedAt = time.Now()

	// Setup violation in round 1
	gameState.PlayedCards = append(gameState.PlayedCards, entity.PlayedCard{
		Card:     entity.Card{Suit: entity.Hearts, Value: entity.Ace},
		PlayerID: "player1",
		PlayedAt: time.Now(),
	})
	gameState.PlayedCards = append(gameState.PlayedCards, entity.PlayedCard{
		Card:     entity.Card{Suit: entity.Spades, Value: entity.King},
		PlayerID: "player2",
		PlayedAt: time.Now(),
	})

	// Same player should be able to challenge again in new round
	_, err = handler.HandleChallenge(ctx, "player1", "player2", 1, 1)
	if err != nil {
		t.Errorf("Round 1 challenge failed: %v", err)
	}
}

// TestChallengeHandler_GetChallengeHistory tests the challenge history retrieval
func TestChallengeHandler_GetChallengeHistory(t *testing.T) {
	gameState := createTestGameWithViolation(t)
	handler := NewChallengeHandler(gameState)

	ctx := context.Background()

	// No challenges initially
	history := handler.GetChallengeHistory()
	if len(history) != 0 {
		t.Errorf("Expected empty history, got %d entries", len(history))
	}

	// Make a challenge
	_, err := handler.HandleChallenge(ctx, "player1", "player2", 0, 1)
	if err != nil {
		t.Fatalf("Challenge failed: %v", err)
	}

	// History should have one entry
	history = handler.GetChallengeHistory()
	if len(history) != 1 {
		t.Errorf("Expected 1 history entry, got %d", len(history))
	}

	// Make another challenge in a different round
	gameState.CurrentRound = 1
	gameState.UpdatedAt = time.Now()
	_, err = handler.HandleChallenge(ctx, "player1", "player2", 1, 1)
	if err != nil {
		t.Fatalf("Second challenge failed: %v", err)
	}

	// History should have two entries
	history = handler.GetChallengeHistory()
	if len(history) != 2 {
		t.Errorf("Expected 2 history entries, got %d", len(history))
	}
}

// TestChallengeHandler_ResetChallengesForRound tests round challenge reset
func TestChallengeHandler_ResetChallengesForRound(t *testing.T) {
	gameState := createTestGameWithViolation(t)
	handler := NewChallengeHandler(gameState)

	ctx := context.Background()

	// Make challenges in round 0
	_, err := handler.HandleChallenge(ctx, "player1", "player2", 0, 1)
	if err != nil {
		t.Fatalf("Challenge failed: %v", err)
	}

	// Verify challenge is recorded
	history := handler.GetChallengeHistory()
	if len(history) != 1 {
		t.Errorf("Expected 1 challenge, got %d", len(history))
	}

	// Reset challenges for round 1
	handler.ResetChallengesForRound(1)

	// History should be empty (round 0 challenges cleared)
	history = handler.GetChallengeHistory()
	if len(history) != 0 {
		t.Errorf("Expected 0 challenges after reset, got %d", len(history))
	}

	// Player should be able to challenge again in new round
	gameState.CurrentRound = 1
	gameState.UpdatedAt = time.Now()
	_, err = handler.HandleChallenge(ctx, "player1", "player2", 1, 1)
	if err != nil {
		t.Errorf("Challenge in new round failed: %v", err)
	}
}

// Helper functions

func createTestGameWithViolation(t *testing.T) *entity.GameState {
	t.Helper()

	gs := &entity.GameState{
		GameID:       "test-game",
		RoomCode:     "TEST01",
		TotalRounds:  5,
		PointsToWin:  10,
		Phase:        entity.PhasePlaying,
		CurrentRound: 0,
		Players: []entity.GamePlayer{
			{
				ID:       "player1",
				Username: "Player 1",
				Hand: []entity.Card{
					{Suit: entity.Spades, Value: entity.Ace},
					{Suit: entity.Spades, Value: entity.King},
				},
				Score: 0,
			},
			{
				ID:       "player2",
				Username: "Player 2",
				Hand: []entity.Card{
					// Had hearts but played spades - violation!
					{Suit: entity.Hearts, Value: entity.Queen},
					{Suit: entity.Clubs, Value: entity.Jack},
				},
				Score: 1,
			},
		},
		LeaderID:  "player1",
		UpdatedAt: time.Now(),
	}

	// Simulate played cards - Player1 leads with hearts, Player2 plays spades
	ledSuit := entity.Hearts
	gs.LedSuit = &ledSuit
	gs.PlayedCards = []entity.PlayedCard{
		{
			Card:     entity.Card{Suit: entity.Hearts, Value: entity.Ace},
			PlayerID: "player1",
			PlayedAt: time.Now(),
		},
		{
			Card:     entity.Card{Suit: entity.Spades, Value: entity.King}, // Violation!
			PlayerID: "player2",
			PlayedAt: time.Now(),
		},
	}

	return gs
}

func createTestGameWithoutViolation(t *testing.T) *entity.GameState {
	t.Helper()

	gs := &entity.GameState{
		GameID:       "test-game",
		RoomCode:     "TEST01",
		TotalRounds:  5,
		PointsToWin:  10,
		Phase:        entity.PhasePlaying,
		CurrentRound: 0,
		Players: []entity.GamePlayer{
			{
				ID:       "player1",
				Username: "Player 1",
				Hand: []entity.Card{
					{Suit: entity.Spades, Value: entity.Ace},
				},
				Score: 0,
			},
			{
				ID:       "player2",
				Username: "Player 2",
				Hand: []entity.Card{
					// Doesn't have hearts, so playing spades is legal
					{Suit: entity.Clubs, Value: entity.Queen},
					{Suit: entity.Diamonds, Value: entity.Jack},
				},
				Score: 1,
			},
		},
		LeaderID:  "player1",
		UpdatedAt: time.Now(),
	}

	// Simulate played cards - Player1 leads with hearts, Player2 legally plays spades (no hearts)
	ledSuit := entity.Hearts
	gs.LedSuit = &ledSuit
	gs.PlayedCards = []entity.PlayedCard{
		{
			Card:     entity.Card{Suit: entity.Hearts, Value: entity.Ace},
			PlayerID: "player1",
			PlayedAt: time.Now(),
		},
		{
			Card:     entity.Card{Suit: entity.Spades, Value: entity.King},
			PlayerID: "player2",
			PlayedAt: time.Now(),
		},
	}

	return gs
}

func createBasicTestGame(t *testing.T) *entity.GameState {
	t.Helper()

	return &entity.GameState{
		GameID:       "test-game",
		RoomCode:     "TEST01",
		TotalRounds:  5,
		PointsToWin:  10,
		Phase:        entity.PhasePlaying,
		CurrentRound: 0,
		Players: []entity.GamePlayer{
			{
				ID:       "player1",
				Username: "Player 1",
				Hand:     []entity.Card{},
				Score:    0,
			},
			{
				ID:       "player2",
				Username: "Player 2",
				Hand:     []entity.Card{},
				Score:    0,
			},
		},
		LeaderID:  "player1",
		UpdatedAt: time.Now(),
	}
}

func createTestGameWithMultiplePlayers(t *testing.T) *entity.GameState {
	t.Helper()

	gs := &entity.GameState{
		GameID:       "test-game",
		RoomCode:     "TEST01",
		TotalRounds:  5,
		PointsToWin:  10,
		Phase:        entity.PhasePlaying,
		CurrentRound: 0,
		Players: []entity.GamePlayer{
			{ID: "player1", Username: "Player 1", Score: 0},
			{ID: "player2", Username: "Player 2", Score: 0},
			{ID: "player3", Username: "Player 3", Score: 0},
			{
				ID:       "player4",
				Username: "Player 4",
				Hand: []entity.Card{
					{Suit: entity.Hearts, Value: entity.Queen}, // Has hearts but plays spades
				},
				Score: 0,
			},
		},
		LeaderID:  "player1",
		UpdatedAt: time.Now(),
	}

	// Setup violation
	ledSuit := entity.Hearts
	gs.LedSuit = &ledSuit
	gs.PlayedCards = []entity.PlayedCard{
		{Card: entity.Card{Suit: entity.Hearts, Value: entity.Ace}, PlayerID: "player1", PlayedAt: time.Now()},
		{Card: entity.Card{Suit: entity.Hearts, Value: entity.King}, PlayerID: "player2", PlayedAt: time.Now()},
		{Card: entity.Card{Suit: entity.Hearts, Value: entity.Jack}, PlayerID: "player3", PlayedAt: time.Now()},
		{Card: entity.Card{Suit: entity.Spades, Value: entity.Queen}, PlayerID: "player4", PlayedAt: time.Now()}, // Violation!
	}

	return gs
}
