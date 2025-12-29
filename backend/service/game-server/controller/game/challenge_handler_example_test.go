package game_test

import (
	"context"
	"fmt"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/controller/game"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// ExampleChallengeHandler_HandleChallenge demonstrates how to use the challenge handler
// to validate suit-following violations
func ExampleChallengeHandler_HandleChallenge() {
	// Step 1: Create a game state with a suit-following violation
	gameState := &entity.GameState{
		GameID:       "game-123",
		RoomCode:     "ABC123",
		TotalRounds:  5,
		PointsToWin:  10,
		Phase:        entity.PhasePlaying,
		CurrentRound: 0,
		Players: []entity.GamePlayer{
			{
				ID:       "player1",
				Username: "Alice",
				Hand: []entity.Card{
					{Suit: entity.Spades, Value: entity.Ace},
				},
				Score: 0,
			},
			{
				ID:       "player2",
				Username: "Bob",
				Hand: []entity.Card{
					// Bob has a heart but played a spade (violation!)
					{Suit: entity.Hearts, Value: entity.Queen},
				},
				Score: 1,
			},
		},
		LeaderID:  "player1",
		UpdatedAt: time.Now(),
	}

	// Step 2: Simulate the round - Alice leads with hearts, Bob plays spades
	ledSuit := entity.Hearts
	gameState.LedSuit = &ledSuit
	gameState.PlayedCards = []entity.PlayedCard{
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

	// Step 3: Create challenge handler and process Alice's challenge against Bob
	handler := game.NewChallengeHandler(gameState)
	ctx := context.Background()

	result, err := handler.HandleChallenge(ctx, "player1", "player2", 0, 1)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Step 4: Display the result
	fmt.Printf("Challenge Valid: %v\n", result.IsValid)
	fmt.Printf("Challenger Points Awarded: %d\n", result.PointsAwarded)
	fmt.Printf("Message: %s\n", result.Message)

	// Output:
	// Challenge Valid: true
	// Challenger Points Awarded: 10
	// Message: Valid challenge! Player player2 violated suit-following rules
}

// ExampleChallengeHandler_HandleChallenge_invalidChallenge demonstrates an invalid challenge
func ExampleChallengeHandler_HandleChallenge_invalidChallenge() {
	// Create a game state where the player followed rules correctly
	gameState := &entity.GameState{
		GameID:       "game-456",
		RoomCode:     "XYZ789",
		TotalRounds:  5,
		PointsToWin:  10,
		Phase:        entity.PhasePlaying,
		CurrentRound: 0,
		Players: []entity.GamePlayer{
			{
				ID:       "player1",
				Username: "Alice",
				Hand:     []entity.Card{},
				Score:    5,
			},
			{
				ID:       "player2",
				Username: "Bob",
				Hand: []entity.Card{
					// Bob doesn't have hearts, so playing spades is legal
					{Suit: entity.Clubs, Value: entity.Queen},
				},
				Score: 1,
			},
		},
		LeaderID:  "player1",
		UpdatedAt: time.Now(),
	}

	// Alice leads with hearts, Bob legally plays spades (has no hearts)
	ledSuit := entity.Hearts
	gameState.LedSuit = &ledSuit
	gameState.PlayedCards = []entity.PlayedCard{
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

	// Alice incorrectly challenges Bob
	handler := game.NewChallengeHandler(gameState)
	ctx := context.Background()

	result, err := handler.HandleChallenge(ctx, "player1", "player2", 0, 1)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Invalid challenge results in penalty for Alice
	fmt.Printf("Challenge Valid: %v\n", result.IsValid)
	fmt.Printf("Challenger Points Deducted: %d\n", result.PointsDeducted)
	fmt.Printf("Message: %s\n", result.Message)

	// Output:
	// Challenge Valid: false
	// Challenger Points Deducted: 5
	// Message: Invalid challenge! Player player2 followed rules correctly
}

// ExampleChallengeHandler_ResetChallengesForRound demonstrates challenge reset between rounds
func ExampleChallengeHandler_ResetChallengesForRound() {
	gameState := &entity.GameState{
		GameID:       "game-789",
		CurrentRound: 0,
	}

	handler := game.NewChallengeHandler(gameState)

	// Simulate a challenge in round 0
	// (setup code omitted for brevity)

	// When advancing to round 1, reset challenges
	handler.ResetChallengesForRound(1)

	// Now players can challenge again in the new round
	history := handler.GetChallengeHistory()
	fmt.Printf("Challenges after reset: %d\n", len(history))

	// Output:
	// Challenges after reset: 0
}
