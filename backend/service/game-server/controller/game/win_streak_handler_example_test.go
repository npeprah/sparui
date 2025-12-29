package game

import (
	"fmt"
	"log"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// ExampleWinStreakHandler demonstrates the complete workflow for tracking win streaks
// and applying bonuses in a Spar game round.
func ExampleWinStreakHandler() {
	// Create a game state with 2 players
	gameState := &entity.GameState{
		GameID:       "game-123",
		RoomCode:     "DEMO",
		TotalRounds:  5,
		PointsToWin:  15,
		Phase:        entity.PhasePlaying,
		CurrentRound: 1,
		Players: []entity.GamePlayer{
			{
				ID:        "player-1",
				Username:  "Alice",
				Score:     0,
				WinStreak: 0,
				IsOnFire:  false,
			},
			{
				ID:        "player-2",
				Username:  "Bob",
				Score:     0,
				WinStreak: 0,
				IsOnFire:  false,
			},
		},
		StartedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Create handlers
	streakHandler := NewWinStreakHandler(gameState)
	scoreManager := NewScoreManager(gameState)

	// Simulate a 5-round game with interesting streak patterns
	rounds := []struct {
		roundNum int
		winner   string
	}{
		{1, "player-1"}, // Alice wins: streak = 1
		{2, "player-1"}, // Alice wins: streak = 2, FIRE! (+5 bonus)
		{3, "player-1"}, // Alice wins: streak = 3, FIRE continues (+5 bonus)
		{4, "player-2"}, // Bob wins: Alice's streak broken, FREEZE! (+10 bonus to Bob)
		{5, "player-2"}, // Bob wins: streak = 2, FIRE! (+5 bonus)
	}

	for _, round := range rounds {
		fmt.Printf("\n--- Round %d ---\n", round.roundNum)

		// Step 1: Award round point to winner
		if err := scoreManager.AwardRoundPoints(round.winner); err != nil {
			log.Fatalf("Failed to award points: %v", err)
		}

		// Step 2: Update win streaks and get events
		streakEvents := streakHandler.UpdateWinStreaks(round.winner)

		// Step 3: Apply streak bonuses
		bonuses, err := scoreManager.ApplyStreakBonuses(streakEvents)
		if err != nil {
			log.Fatalf("Failed to apply bonuses: %v", err)
		}

		// Step 4: Display events
		for _, event := range streakEvents {
			switch event.Type {
			case StreakEventStreakStarted:
				fmt.Printf("  %s started a win streak!\n", event.Username)

			case StreakEventFireActivated:
				fmt.Printf("  %s is ON FIRE! (streak: %d, bonus: +%d)\n",
					event.Username, event.Streak, event.Bonus)

			case StreakEventFireContinued:
				fmt.Printf("  %s's fire continues! (streak: %d, bonus: +%d)\n",
					event.Username, event.Streak, event.Bonus)

			case StreakEventFreezeTriggered:
				fmt.Printf("  %s broke a %d-streak! FREEZE bonus: +%d\n",
					event.Username, event.BrokenStreak, event.Bonus)

			case StreakEventStreakBroken:
				fmt.Printf("  %s's streak was broken\n", event.Username)
			}
		}

		// Step 5: Display current scores
		fmt.Printf("\n  Current Scores:\n")
		for _, player := range gameState.Players {
			fireStatus := ""
			if player.IsOnFire {
				fireStatus = " [ON FIRE]"
			}
			totalBonus := bonuses[player.ID]
			fmt.Printf("    %s: %d points (streak: %d)%s",
				player.Username, player.Score, player.WinStreak, fireStatus)
			if totalBonus > 0 {
				fmt.Printf(" +%d bonus this round", totalBonus)
			}
			fmt.Println()
		}
	}

	// Output:
	// --- Round 1 ---
	//   Alice started a win streak!
	//
	//   Current Scores:
	//     Alice: 1 points (streak: 1)
	//     Bob: 0 points (streak: 0)
	//
	// --- Round 2 ---
	//   Alice is ON FIRE! (streak: 2, bonus: +5)
	//
	//   Current Scores:
	//     Alice: 7 points (streak: 2) [ON FIRE] +5 bonus this round
	//     Bob: 0 points (streak: 0)
	//
	// --- Round 3 ---
	//   Alice's fire continues! (streak: 3, bonus: +5)
	//
	//   Current Scores:
	//     Alice: 13 points (streak: 3) [ON FIRE] +5 bonus this round
	//     Bob: 0 points (streak: 0)
	//
	// --- Round 4 ---
	//   Bob broke a 3-streak! FREEZE bonus: +10
	//   Alice's streak was broken
	//   Bob started a win streak!
	//
	//   Current Scores:
	//     Alice: 13 points (streak: 0)
	//     Bob: 11 points (streak: 1) +10 bonus this round
	//
	// --- Round 5 ---
	//   Bob is ON FIRE! (streak: 2, bonus: +5)
	//
	//   Current Scores:
	//     Alice: 13 points (streak: 0)
	//     Bob: 17 points (streak: 2) [ON FIRE] +5 bonus this round
}

// ExampleWinStreakHandler_integration demonstrates integration with game engine
// This shows how streak tracking fits into the broader game flow.
func ExampleWinStreakHandler_integration() {
	// This example shows the typical integration point in your game controller

	// 1. After a round completes and winner is determined:
	//    roundWinner := engine.CalculateRoundWinner(ctx)
	//
	// 2. Award round points:
	//    scoreManager.AwardRoundPoints(roundWinner)
	//
	// 3. Update win streaks and get events:
	//    streakEvents := streakHandler.UpdateWinStreaks(roundWinner)
	//
	// 4. Apply streak bonuses:
	//    bonuses, err := scoreManager.ApplyStreakBonuses(streakEvents)
	//
	// 5. Broadcast events to players:
	//    broadcaster.BroadcastStreakEvents(streakEvents)
	//
	// 6. Check if game is over:
	//    if scoreManager.IsGameOver() {
	//        winner := scoreManager.DetermineGameWinner()
	//        // Handle game end
	//    }

	fmt.Println("See game controller for complete integration")
	// Output: See game controller for complete integration
}

// ExampleWinStreakHandler_calculateBonuses demonstrates bonus calculation utilities
func ExampleWinStreakHandler_calculateBonuses() {
	handler := NewWinStreakHandler(nil)

	// Calculate fire bonus (streak >= 2)
	fireBonus := handler.CalculateFireBonus(2)
	fmt.Printf("Fire bonus for streak 2: +%d\n", fireBonus)

	// Calculate freeze bonus (breaking streak >= 3)
	freezeBonus := handler.CalculateFreezeBonus(3)
	fmt.Printf("Freeze bonus for breaking streak 3: +%d\n", freezeBonus)

	// Check if fire effect is active
	hasFire := handler.CheckFireEffect(2)
	fmt.Printf("Fire effect active at streak 2: %v\n", hasFire)

	// Check if freeze effect applies
	hasFreeze := handler.CheckFreezeEffect(3)
	fmt.Printf("Freeze effect applies when breaking streak 3: %v\n", hasFreeze)

	// Output:
	// Fire bonus for streak 2: +5
	// Freeze bonus for breaking streak 3: +10
	// Fire effect active at streak 2: true
	// Freeze effect applies when breaking streak 3: true
}
