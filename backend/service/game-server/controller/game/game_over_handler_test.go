package game

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// Helper function to create a test game state for game over tests
func createGameOverTestState(players int, currentRound int, pointsToWin int) *entity.GameState {
	gameState := &entity.GameState{
		GameID:       uuid.New().String(),
		RoomCode:     "TEST01",
		TotalRounds:  5,
		PointsToWin:  pointsToWin,
		Phase:        entity.PhasePlaying,
		CurrentRound: currentRound,
		StartedAt:    time.Now().Add(-10 * time.Minute),
		UpdatedAt:    time.Now(),
		Players:      make([]entity.GamePlayer, players),
	}

	// Create test players
	for i := 0; i < players; i++ {
		playerID := uuid.New().String()
		gameState.Players[i] = entity.GamePlayer{
			ID:        playerID,
			Username:  "Player" + string(rune('A'+i)),
			Score:     0,
			WinStreak: 0,
			RoundsWon: 0,
		}
	}

	return gameState
}

// TestCheckGameOver tests game over detection
func TestCheckGameOver(t *testing.T) {
	tests := []struct {
		name         string
		currentRound int
		playerScores []int
		pointsToWin  int
		wantGameOver bool
		wantReason   entity.GameCompletionType
	}{
		{
			name:         "Game not over - Round 3 of 5",
			currentRound: 3,
			playerScores: []int{5, 4, 3, 2},
			pointsToWin:  10,
			wantGameOver: false,
			wantReason:   "",
		},
		{
			name:         "Game over - 5 rounds complete",
			currentRound: 5,
			playerScores: []int{8, 7, 6, 5},
			pointsToWin:  10,
			wantGameOver: true,
			wantReason:   entity.CompletionRounds,
		},
		{
			name:         "Game over - Points target reached (10)",
			currentRound: 4,
			playerScores: []int{10, 5, 3, 2},
			pointsToWin:  10,
			wantGameOver: true,
			wantReason:   entity.CompletionPointsTarget,
		},
		{
			name:         "Game over - Points target reached (15)",
			currentRound: 5,
			playerScores: []int{16, 12, 8, 7},
			pointsToWin:  15,
			wantGameOver: true,
			wantReason:   entity.CompletionPointsTarget,
		},
		{
			name:         "Game over - Points target reached (21)",
			currentRound: 5,
			playerScores: []int{25, 18, 15, 12},
			pointsToWin:  21,
			wantGameOver: true,
			wantReason:   entity.CompletionPointsTarget,
		},
		{
			name:         "Game not over - Under points target",
			currentRound: 3,
			playerScores: []int{9, 8, 7, 6},
			pointsToWin:  10,
			wantGameOver: false,
			wantReason:   "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gameState := createGameOverTestState(len(tt.playerScores), tt.currentRound, tt.pointsToWin)

			// Set player scores
			for i, score := range tt.playerScores {
				gameState.Players[i].Score = score
			}

			handler := NewGameOverHandler(gameState, nil, nil, nil, nil)
			isOver, reason := handler.CheckGameOver()

			if isOver != tt.wantGameOver {
				t.Errorf("CheckGameOver() isOver = %v, want %v", isOver, tt.wantGameOver)
			}

			if reason != tt.wantReason {
				t.Errorf("CheckGameOver() reason = %v, want %v", reason, tt.wantReason)
			}
		})
	}
}

// TestCalculateFinalScores tests final score calculation with all bonuses
func TestCalculateFinalScores(t *testing.T) {
	tests := []struct {
		name              string
		setupGame         func() *entity.GameState
		wantTotalScores   map[string]int
		wantBaseScores    map[string]int
		wantDryBonuses    map[string]int
		wantStreakBonuses map[string]int
		wantFreezeBonuses map[string]int
	}{
		{
			name: "Base scores only - no bonuses",
			setupGame: func() *entity.GameState {
				gs := createGameOverTestState(3, 5, 10)
				gs.Players[0].Score = 3
				gs.Players[0].RoundsWon = 3
				gs.Players[1].Score = 2
				gs.Players[1].RoundsWon = 2
				gs.Players[2].Score = 0
				gs.Players[2].RoundsWon = 0
				return gs
			},
			wantTotalScores: map[string]int{
				"PlayerA": 3,
				"PlayerB": 2,
				"PlayerC": 0,
			},
			wantBaseScores: map[string]int{
				"PlayerA": 3,
				"PlayerB": 2,
				"PlayerC": 0,
			},
			wantDryBonuses: map[string]int{
				"PlayerA": 0,
				"PlayerB": 0,
				"PlayerC": 0,
			},
			wantStreakBonuses: map[string]int{
				"PlayerA": 0,
				"PlayerB": 0,
				"PlayerC": 0,
			},
		},
		{
			name: "With dry card bonuses",
			setupGame: func() *entity.GameState {
				gs := createGameOverTestState(2, 5, 10)
				gs.Players[0].Score = 8 // 2 base + 6 dry bonus
				gs.Players[0].RoundsWon = 2
				gs.Players[0].DryCard = &entity.DryCard{
					Card: entity.Card{Suit: entity.Hearts, Value: entity.Six},
					Type: entity.DryHidden,
				}
				gs.Players[1].Score = 15 // 3 base + 12 show dry bonus
				gs.Players[1].RoundsWon = 3
				gs.Players[1].DryCard = &entity.DryCard{
					Card: entity.Card{Suit: entity.Clubs, Value: entity.Six},
					Type: entity.DryShown,
				}
				return gs
			},
			wantTotalScores: map[string]int{
				"PlayerA": 8,
				"PlayerB": 15,
			},
			wantBaseScores: map[string]int{
				"PlayerA": 2,
				"PlayerB": 3,
			},
			wantDryBonuses: map[string]int{
				"PlayerA": 6,
				"PlayerB": 12,
			},
		},
		{
			name: "With streak bonuses",
			setupGame: func() *entity.GameState {
				gs := createGameOverTestState(2, 5, 10)
				// PlayerA: 3 rounds won, had fire effect (2 rounds * 5 = 10 bonus)
				gs.Players[0].Score = 13 // 3 base + 10 fire bonus
				gs.Players[0].RoundsWon = 3
				gs.Players[0].WinStreak = 3
				gs.Players[0].IsOnFire = true

				// PlayerB: 2 rounds won, no bonuses
				gs.Players[1].Score = 2 // 2 base
				gs.Players[1].RoundsWon = 2
				return gs
			},
			wantTotalScores: map[string]int{
				"PlayerA": 13,
				"PlayerB": 2,
			},
			wantBaseScores: map[string]int{
				"PlayerA": 3,
				"PlayerB": 2,
			},
			wantStreakBonuses: map[string]int{
				"PlayerA": 10, // Fire bonus
				"PlayerB": 0,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gameState := tt.setupGame()
			handler := NewGameOverHandler(gameState, nil, nil, nil, nil)

			finalScores := handler.CalculateFinalScores()

			// Helper to get player by index
			getPlayer := func(username string) *entity.GamePlayer {
				for i := range gameState.Players {
					if gameState.Players[i].Username == username {
						return &gameState.Players[i]
					}
				}
				return nil
			}

			// Check total scores
			for username, wantTotal := range tt.wantTotalScores {
				player := getPlayer(username)
				if player == nil {
					t.Errorf("Player %s not found", username)
					continue
				}

				fs := finalScores[player.ID]
				if fs == nil {
					t.Errorf("Missing final score for %s", username)
					continue
				}

				if fs.TotalScore != wantTotal {
					t.Errorf("%s TotalScore = %d, want %d", username, fs.TotalScore, wantTotal)
				}
			}

			// Check base scores
			if tt.wantBaseScores != nil {
				for username, wantBase := range tt.wantBaseScores {
					player := getPlayer(username)
					if player == nil {
						continue
					}

					fs := finalScores[player.ID]
					if fs.BaseScore != wantBase {
						t.Errorf("%s BaseScore = %d, want %d", username, fs.BaseScore, wantBase)
					}
				}
			}

			// Check dry bonuses
			if tt.wantDryBonuses != nil {
				for username, wantDry := range tt.wantDryBonuses {
					player := getPlayer(username)
					if player == nil {
						continue
					}

					fs := finalScores[player.ID]
					if fs.DryCardBonus != wantDry {
						t.Errorf("%s DryCardBonus = %d, want %d", username, fs.DryCardBonus, wantDry)
					}
				}
			}

			// Check streak bonuses
			if tt.wantStreakBonuses != nil {
				for username, wantStreak := range tt.wantStreakBonuses {
					player := getPlayer(username)
					if player == nil {
						continue
					}

					fs := finalScores[player.ID]
					if fs.StreakBonus != wantStreak {
						t.Errorf("%s StreakBonus = %d, want %d", username, fs.StreakBonus, wantStreak)
					}
				}
			}

			// Check freeze bonuses
			if tt.wantFreezeBonuses != nil {
				for username, wantFreeze := range tt.wantFreezeBonuses {
					player := getPlayer(username)
					if player == nil {
						continue
					}

					fs := finalScores[player.ID]
					if fs.FreezeBonus != wantFreeze {
						t.Errorf("%s FreezeBonus = %d, want %d", username, fs.FreezeBonus, wantFreeze)
					}
				}
			}
		})
	}
}

// TestDetermineWinner tests winner determination including tie scenarios
func TestDetermineWinner(t *testing.T) {
	tests := []struct {
		name        string
		finalScores map[string]*entity.FinalScore
		wantWinners []string
	}{
		{
			name: "Single winner - clear victory",
			finalScores: map[string]*entity.FinalScore{
				"player1": {PlayerID: "player1", Username: "Alice", TotalScore: 15, RoundsWon: 3},
				"player2": {PlayerID: "player2", Username: "Bob", TotalScore: 10, RoundsWon: 2},
				"player3": {PlayerID: "player3", Username: "Carol", TotalScore: 8, RoundsWon: 2},
			},
			wantWinners: []string{"player1"},
		},
		{
			name: "Tie - two players same score",
			finalScores: map[string]*entity.FinalScore{
				"player1": {PlayerID: "player1", Username: "Alice", TotalScore: 12, RoundsWon: 3},
				"player2": {PlayerID: "player2", Username: "Bob", TotalScore: 12, RoundsWon: 2},
				"player3": {PlayerID: "player3", Username: "Carol", TotalScore: 8, RoundsWon: 1},
			},
			wantWinners: []string{"player1", "player2"},
		},
		{
			name: "Three-way tie",
			finalScores: map[string]*entity.FinalScore{
				"player1": {PlayerID: "player1", Username: "Alice", TotalScore: 10, RoundsWon: 2},
				"player2": {PlayerID: "player2", Username: "Bob", TotalScore: 10, RoundsWon: 2},
				"player3": {PlayerID: "player3", Username: "Carol", TotalScore: 10, RoundsWon: 2},
			},
			wantWinners: []string{"player1", "player2", "player3"},
		},
		{
			name: "All players tied",
			finalScores: map[string]*entity.FinalScore{
				"player1": {PlayerID: "player1", Username: "Alice", TotalScore: 8, RoundsWon: 2},
				"player2": {PlayerID: "player2", Username: "Bob", TotalScore: 8, RoundsWon: 2},
				"player3": {PlayerID: "player3", Username: "Carol", TotalScore: 8, RoundsWon: 2},
				"player4": {PlayerID: "player4", Username: "Dave", TotalScore: 8, RoundsWon: 2},
			},
			wantWinners: []string{"player1", "player2", "player3", "player4"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := NewGameOverHandler(nil, nil, nil, nil, nil)
			winners := handler.DetermineWinner(tt.finalScores)

			if len(winners) != len(tt.wantWinners) {
				t.Errorf("DetermineWinner() returned %d winners, want %d", len(winners), len(tt.wantWinners))
				return
			}

			// Check that all expected winners are present
			winnerMap := make(map[string]bool)
			for _, w := range winners {
				winnerMap[w] = true
			}

			for _, expectedWinner := range tt.wantWinners {
				if !winnerMap[expectedWinner] {
					t.Errorf("Expected winner %s not found in results", expectedWinner)
				}
			}
		})
	}
}

// TestGenerateGameSummary tests game summary generation
func TestGenerateGameSummary(t *testing.T) {
	gameState := createGameOverTestState(3, 5, 10)
	gameState.Players[0].Score = 12
	gameState.Players[0].RoundsWon = 3
	gameState.Players[0].IsOnFire = true
	gameState.Players[1].Score = 8
	gameState.Players[1].RoundsWon = 2
	gameState.Players[2].Score = 5
	gameState.Players[2].RoundsWon = 0

	handler := NewGameOverHandler(gameState, nil, nil, nil, nil)
	finalScores := handler.CalculateFinalScores()
	winners := handler.DetermineWinner(finalScores)

	summary := handler.GenerateGameSummary(finalScores, winners, entity.CompletionRounds)

	// Check basic fields
	if summary.GameID != gameState.GameID {
		t.Errorf("GameID = %s, want %s", summary.GameID, gameState.GameID)
	}

	if summary.RoomCode != gameState.RoomCode {
		t.Errorf("RoomCode = %s, want %s", summary.RoomCode, gameState.RoomCode)
	}

	if summary.TotalRounds != 5 {
		t.Errorf("TotalRounds = %d, want 5", summary.TotalRounds)
	}

	if summary.CompletionType != entity.CompletionRounds {
		t.Errorf("CompletionType = %s, want %s", summary.CompletionType, entity.CompletionRounds)
	}

	// Check winners
	if len(summary.Winners) != len(winners) {
		t.Errorf("Winners count = %d, want %d", len(summary.Winners), len(winners))
	}

	// Check IsFireWin (winner has fire effect)
	if !summary.IsFireWin {
		t.Error("Expected IsFireWin to be true")
	}

	// Check final scores are present
	if len(summary.FinalScores) != 3 {
		t.Errorf("FinalScores count = %d, want 3", len(summary.FinalScores))
	}

	// Check player results are generated
	if len(summary.PlayerResults) != 3 {
		t.Errorf("PlayerResults count = %d, want 3", len(summary.PlayerResults))
	}

	// Check placements
	placements := make(map[int]int) // placement -> count
	for _, pr := range summary.PlayerResults {
		placements[pr.Placement]++
	}

	if placements[1] != 1 || placements[2] != 1 || placements[3] != 1 {
		t.Errorf("Invalid placements: %v", placements)
	}
}

// TestGeneratePlayerResults tests player result generation
func TestGeneratePlayerResults(t *testing.T) {
	gameState := createGameOverTestState(2, 5, 10)
	gameState.Players[0].Score = 15
	gameState.Players[0].RoundsWon = 3
	gameState.Players[0].DryCard = &entity.DryCard{
		Card: entity.Card{Suit: entity.Hearts, Value: entity.Six},
		Type: entity.DryShown,
	}
	gameState.Players[1].Score = 10
	gameState.Players[1].RoundsWon = 2

	handler := NewGameOverHandler(gameState, nil, nil, nil, nil)
	finalScores := handler.CalculateFinalScores()
	winners := handler.DetermineWinner(finalScores)

	results := handler.GeneratePlayerResults(gameState, finalScores, winners)

	if len(results) != 2 {
		t.Fatalf("Expected 2 results, got %d", len(results))
	}

	// Find results by player ID
	var player0Result, player1Result *entity.PlayerGameResult
	for _, r := range results {
		if r.UserID == gameState.Players[0].ID {
			player0Result = r
		} else if r.UserID == gameState.Players[1].ID {
			player1Result = r
		}
	}

	// Check player 0 (winner with dry card)
	if player0Result == nil {
		t.Fatal("Player 0 result not found")
	}
	if player0Result.Placement != 1 {
		t.Errorf("Player 0 placement = %d, want 1", player0Result.Placement)
	}
	if !player0Result.IsWinner {
		t.Error("Player 0 should be marked as winner")
	}
	if !player0Result.DeclaredDry {
		t.Error("Player 0 should have declared dry")
	}
	if player0Result.DryCardValue != 6 {
		t.Errorf("Player 0 dry card value = %d, want 6", player0Result.DryCardValue)
	}
	if player0Result.DryType != string(entity.DryShown) {
		t.Errorf("Player 0 dry type = %s, want %s", player0Result.DryType, entity.DryShown)
	}

	// Check player 1
	if player1Result == nil {
		t.Fatal("Player 1 result not found")
	}
	if player1Result.Placement != 2 {
		t.Errorf("Player 1 placement = %d, want 2", player1Result.Placement)
	}
	if player1Result.IsWinner {
		t.Error("Player 1 should not be marked as winner")
	}
	if player1Result.DeclaredDry {
		t.Error("Player 1 should not have declared dry")
	}
}

// TestEdgeCases tests edge cases and error conditions
func TestEdgeCases(t *testing.T) {
	t.Run("Empty game state", func(t *testing.T) {
		handler := NewGameOverHandler(nil, nil, nil, nil, nil)
		isOver, reason := handler.CheckGameOver()
		if isOver {
			t.Error("Empty game state should not be game over")
		}
		if reason != "" {
			t.Error("Empty game state should have empty reason")
		}
	})

	t.Run("No players", func(t *testing.T) {
		gameState := &entity.GameState{
			GameID:       uuid.New().String(),
			TotalRounds:  5,
			CurrentRound: 5,
			Players:      []entity.GamePlayer{},
		}

		handler := NewGameOverHandler(gameState, nil, nil, nil, nil)
		finalScores := handler.CalculateFinalScores()

		if len(finalScores) != 0 {
			t.Errorf("Expected empty final scores, got %d", len(finalScores))
		}
	})

	t.Run("Negative scores", func(t *testing.T) {
		gameState := createGameOverTestState(2, 5, 10)
		gameState.Players[0].Score = -5 // From challenge penalties
		gameState.Players[1].Score = 10

		handler := NewGameOverHandler(gameState, nil, nil, nil, nil)
		finalScores := handler.CalculateFinalScores()

		fs := finalScores[gameState.Players[0].ID]
		if fs.TotalScore >= 0 {
			t.Errorf("Expected negative total score, got %d", fs.TotalScore)
		}
	})
}

// TestConcurrency tests concurrent access to game over handler
func TestConcurrency(t *testing.T) {
	gameState := createGameOverTestState(4, 5, 10)
	for i := range gameState.Players {
		gameState.Players[i].Score = 5 + i
		gameState.Players[i].RoundsWon = 2 + i
	}

	handler := NewGameOverHandler(gameState, nil, nil, nil, nil)

	// Run multiple goroutines accessing the handler concurrently
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func() {
			defer func() { done <- true }()

			// Check game over
			handler.CheckGameOver()

			// Calculate final scores
			finalScores := handler.CalculateFinalScores()

			// Determine winner
			handler.DetermineWinner(finalScores)

			// Generate summary
			handler.GenerateGameSummary(finalScores, []string{gameState.Players[0].ID}, entity.CompletionRounds)
		}()
	}

	// Wait for all goroutines to complete
	for i := 0; i < 10; i++ {
		<-done
	}
}

// TestHandleGameOverIntegration tests the full game over flow
func TestHandleGameOverIntegration(t *testing.T) {
	// Create a game state that's ready for game over
	gameState := createGameOverTestState(3, 5, 15)
	gameState.Players[0].Score = 18
	gameState.Players[0].RoundsWon = 3
	gameState.Players[0].IsOnFire = true
	gameState.Players[0].DryCard = &entity.DryCard{
		Card: entity.Card{Suit: entity.Hearts, Value: entity.Six},
		Type: entity.DryHidden,
	}
	gameState.Players[1].Score = 12
	gameState.Players[1].RoundsWon = 2
	gameState.Players[2].Score = 8
	gameState.Players[2].RoundsWon = 0

	handler := NewGameOverHandler(gameState, nil, nil, nil, nil)

	// Check game is over
	isOver, reason := handler.CheckGameOver()
	if !isOver {
		t.Fatal("Game should be over (points target reached)")
	}
	if reason != entity.CompletionPointsTarget {
		t.Errorf("Expected completion reason %s, got %s", entity.CompletionPointsTarget, reason)
	}

	// Calculate final scores
	finalScores := handler.CalculateFinalScores()
	if len(finalScores) != 3 {
		t.Fatalf("Expected 3 final scores, got %d", len(finalScores))
	}

	// Determine winner
	winners := handler.DetermineWinner(finalScores)
	if len(winners) != 1 {
		t.Fatalf("Expected 1 winner, got %d", len(winners))
	}
	if winners[0] != gameState.Players[0].ID {
		t.Error("Wrong player won")
	}

	// Generate summary
	summary := handler.GenerateGameSummary(finalScores, winners, reason)
	if summary == nil {
		t.Fatal("Summary should not be nil")
	}

	// Verify summary
	if summary.GameID != gameState.GameID {
		t.Error("Summary has wrong game ID")
	}
	if len(summary.Winners) != 1 {
		t.Error("Summary has wrong number of winners")
	}
	if !summary.IsFireWin {
		t.Error("Summary should indicate fire win")
	}
	if len(summary.PlayerResults) != 3 {
		t.Error("Summary should have 3 player results")
	}
}
