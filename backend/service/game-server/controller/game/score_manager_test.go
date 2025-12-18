package game

import (
	"sync"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// Helper function to create a test game state
func createTestGameState(playerCount int, pointsToWin int) *entity.GameState {
	players := make([]entity.GamePlayer, playerCount)
	for i := 0; i < playerCount; i++ {
		players[i] = entity.GamePlayer{
			ID:       stringID(i + 1),
			Username: stringUsername(i + 1),
			Avatar:   "avatar",
			Score:    0,
			RoundsWon: 0,
		}
	}

	return &entity.GameState{
		GameID:       "test-game",
		RoomCode:     "TEST01",
		TotalRounds:  5,
		PointsToWin:  pointsToWin,
		Phase:        entity.PhasePlaying,
		Players:      players,
		LeaderID:     players[0].ID,
		CurrentRound: 1,
		StartedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}

func stringID(n int) string {
	return []string{"", "player1", "player2", "player3", "player4"}[n]
}

func stringUsername(n int) string {
	return []string{"", "Alice", "Bob", "Charlie", "Dave"}[n]
}

// TestNewScoreManager tests the constructor
func TestNewScoreManager(t *testing.T) {
	tests := []struct {
		name      string
		gameState *entity.GameState
		wantNil   bool
	}{
		{
			name:      "valid game state",
			gameState: createTestGameState(2, 10),
			wantNil:   false,
		},
		{
			name:      "nil game state",
			gameState: nil,
			wantNil:   false, // Should still create manager
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sm := NewScoreManager(tt.gameState)
			if (sm == nil) != tt.wantNil {
				t.Errorf("NewScoreManager() = %v, wantNil %v", sm, tt.wantNil)
			}
			if sm != nil && sm.gameState != tt.gameState {
				t.Errorf("NewScoreManager() gameState = %v, want %v", sm.gameState, tt.gameState)
			}
		})
	}
}

// TestAwardRoundPoints tests awarding points for round wins
func TestAwardRoundPoints(t *testing.T) {
	tests := []struct {
		name          string
		setupState    func() *entity.GameState
		winnerID      string
		wantErr       bool
		expectedScore int
		expectedRounds int
	}{
		{
			name: "award first round point",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			winnerID:       "player1",
			wantErr:        false,
			expectedScore:  1,
			expectedRounds: 1,
		},
		{
			name: "award multiple round points",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 3
				state.Players[0].RoundsWon = 3
				return state
			},
			winnerID:       "player1",
			wantErr:        false,
			expectedScore:  4,
			expectedRounds: 4,
		},
		{
			name: "award to second player",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			winnerID:       "player2",
			wantErr:        false,
			expectedScore:  1,
			expectedRounds: 1,
		},
		{
			name: "nil game state",
			setupState: func() *entity.GameState {
				return nil
			},
			winnerID: "player1",
			wantErr:  true,
		},
		{
			name: "empty winner ID",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			winnerID: "",
			wantErr:  true,
		},
		{
			name: "player not found",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			winnerID: "nonexistent",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			state := tt.setupState()
			sm := NewScoreManager(state)

			err := sm.AwardRoundPoints(tt.winnerID)

			if (err != nil) != tt.wantErr {
				t.Errorf("AwardRoundPoints() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && state != nil {
				player := state.GetPlayer(tt.winnerID)
				if player == nil {
					t.Fatalf("Player not found after award")
				}
				if player.Score != tt.expectedScore {
					t.Errorf("Player score = %d, want %d", player.Score, tt.expectedScore)
				}
				if player.RoundsWon != tt.expectedRounds {
					t.Errorf("Player rounds won = %d, want %d", player.RoundsWon, tt.expectedRounds)
				}
			}
		})
	}
}

// TestCalculateDryBonus tests dry card bonus calculation
func TestCalculateDryBonus(t *testing.T) {
	tests := []struct {
		name        string
		setupState  func() *entity.GameState
		playerID    string
		dryCard     *entity.DryCard
		wantBonus   int
		wantErr     bool
	}{
		{
			name: "hidden dry with six - 6 points",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			playerID: "player1",
			dryCard: &entity.DryCard{
				Card:     entity.Card{Suit: entity.Hearts, Value: entity.Six},
				Type:     entity.DryHidden,
				PlayerID: "player1",
			},
			wantBonus: 6,
			wantErr:   false,
		},
		{
			name: "hidden dry with seven - 4 points",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			playerID: "player1",
			dryCard: &entity.DryCard{
				Card:     entity.Card{Suit: entity.Hearts, Value: entity.Seven},
				Type:     entity.DryHidden,
				PlayerID: "player1",
			},
			wantBonus: 4,
			wantErr:   false,
		},
		{
			name: "shown dry with six - 12 points",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			playerID: "player1",
			dryCard: &entity.DryCard{
				Card:     entity.Card{Suit: entity.Clubs, Value: entity.Six},
				Type:     entity.DryShown,
				PlayerID: "player1",
			},
			wantBonus: 12,
			wantErr:   false,
		},
		{
			name: "shown dry with seven - 8 points",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			playerID: "player1",
			dryCard: &entity.DryCard{
				Card:     entity.Card{Suit: entity.Diamonds, Value: entity.Seven},
				Type:     entity.DryShown,
				PlayerID: "player1",
			},
			wantBonus: 8,
			wantErr:   false,
		},
		{
			name: "apply bonus to existing score",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 5
				return state
			},
			playerID: "player1",
			dryCard: &entity.DryCard{
				Card:     entity.Card{Suit: entity.Hearts, Value: entity.Six},
				Type:     entity.DryShown,
				PlayerID: "player1",
			},
			wantBonus: 12, // 6 of shown dry
			wantErr:   false,
		},
		{
			name: "nil game state",
			setupState: func() *entity.GameState {
				return nil
			},
			playerID: "player1",
			dryCard: &entity.DryCard{
				Card:     entity.Card{Suit: entity.Hearts, Value: entity.Six},
				Type:     entity.DryHidden,
				PlayerID: "player1",
			},
			wantBonus: 0,
			wantErr:   true,
		},
		{
			name: "nil dry card",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			playerID:  "player1",
			dryCard:   nil,
			wantBonus: 0,
			wantErr:   true,
		},
		{
			name: "player not found",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			playerID: "nonexistent",
			dryCard: &entity.DryCard{
				Card:     entity.Card{Suit: entity.Hearts, Value: entity.Six},
				Type:     entity.DryHidden,
				PlayerID: "nonexistent",
			},
			wantBonus: 0,
			wantErr:   true,
		},
		{
			name: "empty player ID",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			playerID: "",
			dryCard: &entity.DryCard{
				Card:     entity.Card{Suit: entity.Hearts, Value: entity.Six},
				Type:     entity.DryHidden,
				PlayerID: "",
			},
			wantBonus: 0,
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			state := tt.setupState()
			sm := NewScoreManager(state)

			var initialScore int
			if state != nil && tt.playerID != "" {
				if player := state.GetPlayer(tt.playerID); player != nil {
					initialScore = player.Score
				}
			}

			bonus, err := sm.CalculateDryBonus(tt.playerID, tt.dryCard)

			if (err != nil) != tt.wantErr {
				t.Errorf("CalculateDryBonus() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if bonus != tt.wantBonus {
				t.Errorf("CalculateDryBonus() bonus = %d, want %d", bonus, tt.wantBonus)
			}

			if !tt.wantErr && state != nil && tt.playerID != "" {
				player := state.GetPlayer(tt.playerID)
				if player == nil {
					t.Fatalf("Player not found after bonus calculation")
				}
				expectedScore := initialScore + tt.wantBonus
				if player.Score != expectedScore {
					t.Errorf("Player score = %d, want %d", player.Score, expectedScore)
				}
			}
		})
	}
}

// TestGetPlayerScore tests retrieving a player's score
func TestGetPlayerScore(t *testing.T) {
	tests := []struct {
		name          string
		setupState    func() *entity.GameState
		playerID      string
		expectedScore int
		wantErr       bool
	}{
		{
			name: "get score for player with zero points",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			playerID:      "player1",
			expectedScore: 0,
			wantErr:       false,
		},
		{
			name: "get score for player with points",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 7
				return state
			},
			playerID:      "player1",
			expectedScore: 7,
			wantErr:       false,
		},
		{
			name: "get score for second player",
			setupState: func() *entity.GameState {
				state := createTestGameState(3, 10)
				state.Players[1].Score = 5
				return state
			},
			playerID:      "player2",
			expectedScore: 5,
			wantErr:       false,
		},
		{
			name: "nil game state",
			setupState: func() *entity.GameState {
				return nil
			},
			playerID:      "player1",
			expectedScore: 0,
			wantErr:       true,
		},
		{
			name: "empty player ID",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			playerID:      "",
			expectedScore: 0,
			wantErr:       true,
		},
		{
			name: "player not found",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			playerID:      "nonexistent",
			expectedScore: 0,
			wantErr:       true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			state := tt.setupState()
			sm := NewScoreManager(state)

			score, err := sm.GetPlayerScore(tt.playerID)

			if (err != nil) != tt.wantErr {
				t.Errorf("GetPlayerScore() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if score != tt.expectedScore {
				t.Errorf("GetPlayerScore() = %d, want %d", score, tt.expectedScore)
			}
		})
	}
}

// TestGetLeaderboard tests retrieving sorted player scores
func TestGetLeaderboard(t *testing.T) {
	tests := []struct {
		name           string
		setupState     func() *entity.GameState
		expectedOrder  []string
		expectedScores []int
	}{
		{
			name: "all players with zero scores",
			setupState: func() *entity.GameState {
				return createTestGameState(2, 10)
			},
			expectedOrder:  []string{"player1", "player2"},
			expectedScores: []int{0, 0},
		},
		{
			name: "players with different scores",
			setupState: func() *entity.GameState {
				state := createTestGameState(3, 10)
				state.Players[0].Score = 3
				state.Players[1].Score = 7
				state.Players[2].Score = 5
				return state
			},
			expectedOrder:  []string{"player2", "player3", "player1"},
			expectedScores: []int{7, 5, 3},
		},
		{
			name: "players with tied scores - sort by rounds won",
			setupState: func() *entity.GameState {
				state := createTestGameState(3, 10)
				state.Players[0].Score = 5
				state.Players[0].RoundsWon = 2
				state.Players[1].Score = 5
				state.Players[1].RoundsWon = 3
				state.Players[2].Score = 3
				state.Players[2].RoundsWon = 1
				return state
			},
			expectedOrder:  []string{"player2", "player1", "player3"},
			expectedScores: []int{5, 5, 3},
		},
		{
			name: "four players with mixed scores",
			setupState: func() *entity.GameState {
				state := createTestGameState(4, 10)
				state.Players[0].Score = 8
				state.Players[0].RoundsWon = 3
				state.Players[1].Score = 10
				state.Players[1].RoundsWon = 4
				state.Players[2].Score = 10
				state.Players[2].RoundsWon = 3
				state.Players[3].Score = 6
				state.Players[3].RoundsWon = 2
				return state
			},
			expectedOrder:  []string{"player2", "player3", "player1", "player4"},
			expectedScores: []int{10, 10, 8, 6},
		},
		{
			name: "nil game state",
			setupState: func() *entity.GameState {
				return nil
			},
			expectedOrder:  []string{},
			expectedScores: []int{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			state := tt.setupState()
			sm := NewScoreManager(state)

			leaderboard := sm.GetLeaderboard()

			if len(leaderboard) != len(tt.expectedOrder) {
				t.Errorf("GetLeaderboard() length = %d, want %d", len(leaderboard), len(tt.expectedOrder))
				return
			}

			for i, entry := range leaderboard {
				if entry.PlayerID != tt.expectedOrder[i] {
					t.Errorf("GetLeaderboard()[%d].PlayerID = %s, want %s", i, entry.PlayerID, tt.expectedOrder[i])
				}
				if entry.Score != tt.expectedScores[i] {
					t.Errorf("GetLeaderboard()[%d].Score = %d, want %d", i, entry.Score, tt.expectedScores[i])
				}
			}
		})
	}
}

// TestDetermineGameWinner tests game winner determination
func TestDetermineGameWinner(t *testing.T) {
	tests := []struct {
		name         string
		setupState   func() *entity.GameState
		expectedWinner string
		wantErr      bool
	}{
		{
			name: "single player reaches points to win",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 10
				state.Players[1].Score = 7
				return state
			},
			expectedWinner: "player1",
			wantErr:        false,
		},
		{
			name: "player exceeds points to win",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 8
				state.Players[1].Score = 15
				return state
			},
			expectedWinner: "player2",
			wantErr:        false,
		},
		{
			name: "tie broken by rounds won",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 10
				state.Players[0].RoundsWon = 3
				state.Players[1].Score = 10
				state.Players[1].RoundsWon = 5
				return state
			},
			expectedWinner: "player2",
			wantErr:        false,
		},
		{
			name: "three players - highest score wins",
			setupState: func() *entity.GameState {
				state := createTestGameState(3, 10)
				state.Players[0].Score = 9
				state.Players[1].Score = 12
				state.Players[2].Score = 8
				return state
			},
			expectedWinner: "player2",
			wantErr:        false,
		},
		{
			name: "no player reaches points to win",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 7
				state.Players[1].Score = 8
				return state
			},
			expectedWinner: "",
			wantErr:        true,
		},
		{
			name: "nil game state",
			setupState: func() *entity.GameState {
				return nil
			},
			expectedWinner: "",
			wantErr:        true,
		},
		{
			name: "no players",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players = []entity.GamePlayer{}
				return state
			},
			expectedWinner: "",
			wantErr:        true,
		},
		{
			name: "custom points to win - 15",
			setupState: func() *entity.GameState {
				state := createTestGameState(3, 15)
				state.Players[0].Score = 14
				state.Players[1].Score = 15
				state.Players[2].Score = 12
				return state
			},
			expectedWinner: "player2",
			wantErr:        false,
		},
		{
			name: "custom points to win - 21",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 21)
				state.Players[0].Score = 21
				state.Players[1].Score = 19
				return state
			},
			expectedWinner: "player1",
			wantErr:        false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			state := tt.setupState()
			sm := NewScoreManager(state)

			winner, err := sm.DetermineGameWinner()

			if (err != nil) != tt.wantErr {
				t.Errorf("DetermineGameWinner() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if winner != tt.expectedWinner {
				t.Errorf("DetermineGameWinner() = %s, want %s", winner, tt.expectedWinner)
			}
		})
	}
}

// TestIsGameOver tests game completion detection
func TestIsGameOver(t *testing.T) {
	tests := []struct {
		name       string
		setupState func() *entity.GameState
		expected   bool
	}{
		{
			name: "game not over - no winner",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 7
				state.Players[1].Score = 8
				return state
			},
			expected: false,
		},
		{
			name: "game over - player reached points to win",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 10
				state.Players[1].Score = 7
				return state
			},
			expected: true,
		},
		{
			name: "game over - player exceeded points to win",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 8
				state.Players[1].Score = 15
				return state
			},
			expected: true,
		},
		{
			name: "game over - tie at points to win",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 10
				state.Players[1].Score = 10
				return state
			},
			expected: true,
		},
		{
			name: "game not over - close but not reached",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 10)
				state.Players[0].Score = 9
				state.Players[1].Score = 9
				return state
			},
			expected: false,
		},
		{
			name: "nil game state",
			setupState: func() *entity.GameState {
				return nil
			},
			expected: false,
		},
		{
			name: "custom points to win - 15",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 15)
				state.Players[0].Score = 15
				state.Players[1].Score = 12
				return state
			},
			expected: true,
		},
		{
			name: "custom points to win - 21",
			setupState: func() *entity.GameState {
				state := createTestGameState(2, 21)
				state.Players[0].Score = 20
				state.Players[1].Score = 21
				return state
			},
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			state := tt.setupState()
			sm := NewScoreManager(state)

			result := sm.IsGameOver()

			if result != tt.expected {
				t.Errorf("IsGameOver() = %v, want %v", result, tt.expected)
			}
		})
	}
}

// TestScoreManagerConcurrency tests thread safety
func TestScoreManagerConcurrency(t *testing.T) {
	state := createTestGameState(4, 100)
	sm := NewScoreManager(state)

	// Number of concurrent operations
	numOps := 100
	var wg sync.WaitGroup

	// Concurrently award points to different players
	for i := 0; i < numOps; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			playerID := stringID((idx % 4) + 1)
			_ = sm.AwardRoundPoints(playerID)
		}(i)
	}

	// Concurrently read scores
	for i := 0; i < numOps; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			playerID := stringID((idx % 4) + 1)
			_, _ = sm.GetPlayerScore(playerID)
		}(i)
	}

	// Concurrently check leaderboard
	for i := 0; i < numOps; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = sm.GetLeaderboard()
		}()
	}

	// Concurrently check game over
	for i := 0; i < numOps; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = sm.IsGameOver()
		}()
	}

	wg.Wait()

	// Verify total points awarded = numOps (25 to each of 4 players)
	totalScore := 0
	for _, player := range state.Players {
		totalScore += player.Score
	}

	if totalScore != numOps {
		t.Errorf("Total score = %d, want %d (concurrency issue detected)", totalScore, numOps)
	}
}

// TestScoreManagerIntegration tests a complete game scenario
func TestScoreManagerIntegration(t *testing.T) {
	// Create a game with 3 players, points to win = 10
	state := createTestGameState(3, 10)
	sm := NewScoreManager(state)

	// Round 1: Player 1 wins
	err := sm.AwardRoundPoints("player1")
	if err != nil {
		t.Fatalf("Round 1 failed: %v", err)
	}

	// Round 2: Player 2 wins
	err = sm.AwardRoundPoints("player2")
	if err != nil {
		t.Fatalf("Round 2 failed: %v", err)
	}

	// Round 3: Player 1 wins with dry card bonus
	err = sm.AwardRoundPoints("player1")
	if err != nil {
		t.Fatalf("Round 3 failed: %v", err)
	}
	dryCard := &entity.DryCard{
		Card:     entity.Card{Suit: entity.Hearts, Value: entity.Six},
		Type:     entity.DryHidden,
		PlayerID: "player1",
	}
	_, err = sm.CalculateDryBonus("player1", dryCard)
	if err != nil {
		t.Fatalf("Dry bonus failed: %v", err)
	}

	// Verify scores
	p1Score, _ := sm.GetPlayerScore("player1")
	p2Score, _ := sm.GetPlayerScore("player2")
	p3Score, _ := sm.GetPlayerScore("player3")

	if p1Score != 8 { // 2 rounds + 6 bonus
		t.Errorf("Player 1 score = %d, want 8", p1Score)
	}
	if p2Score != 1 {
		t.Errorf("Player 2 score = %d, want 1", p2Score)
	}
	if p3Score != 0 {
		t.Errorf("Player 3 score = %d, want 0", p3Score)
	}

	// Game should not be over yet
	if sm.IsGameOver() {
		t.Error("Game should not be over yet")
	}

	// Round 4: Player 1 wins again with shown dry
	err = sm.AwardRoundPoints("player1")
	if err != nil {
		t.Fatalf("Round 4 failed: %v", err)
	}
	shownDryCard := &entity.DryCard{
		Card:     entity.Card{Suit: entity.Clubs, Value: entity.Six},
		Type:     entity.DryShown,
		PlayerID: "player1",
	}
	_, err = sm.CalculateDryBonus("player1", shownDryCard)
	if err != nil {
		t.Fatalf("Shown dry bonus failed: %v", err)
	}

	// Now game should be over (9 + 12 = 21 > 10)
	if !sm.IsGameOver() {
		t.Error("Game should be over")
	}

	// Determine winner
	winner, err := sm.DetermineGameWinner()
	if err != nil {
		t.Fatalf("DetermineGameWinner() failed: %v", err)
	}
	if winner != "player1" {
		t.Errorf("Winner = %s, want player1", winner)
	}

	// Verify leaderboard order
	leaderboard := sm.GetLeaderboard()
	if len(leaderboard) != 3 {
		t.Fatalf("Leaderboard length = %d, want 3", len(leaderboard))
	}
	if leaderboard[0].PlayerID != "player1" {
		t.Errorf("Leaderboard[0] = %s, want player1", leaderboard[0].PlayerID)
	}
	if leaderboard[1].PlayerID != "player2" {
		t.Errorf("Leaderboard[1] = %s, want player2", leaderboard[1].PlayerID)
	}
	if leaderboard[2].PlayerID != "player3" {
		t.Errorf("Leaderboard[2] = %s, want player3", leaderboard[2].PlayerID)
	}
}

// TestDryBonusEdgeCases tests edge cases for dry bonus calculation
func TestDryBonusEdgeCases(t *testing.T) {
	tests := []struct {
		name      string
		dryCard   *entity.DryCard
		wantBonus int
	}{
		{
			name: "invalid card value for dry",
			dryCard: &entity.DryCard{
				Card:     entity.Card{Suit: entity.Hearts, Value: entity.Ace},
				Type:     entity.DryHidden,
				PlayerID: "player1",
			},
			wantBonus: 0,
		},
		{
			name: "invalid card value for shown dry",
			dryCard: &entity.DryCard{
				Card:     entity.Card{Suit: entity.Hearts, Value: entity.King},
				Type:     entity.DryShown,
				PlayerID: "player1",
			},
			wantBonus: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			state := createTestGameState(2, 10)
			sm := NewScoreManager(state)

			bonus, err := sm.CalculateDryBonus("player1", tt.dryCard)
			if err != nil {
				t.Errorf("CalculateDryBonus() unexpected error: %v", err)
			}

			if bonus != tt.wantBonus {
				t.Errorf("CalculateDryBonus() bonus = %d, want %d", bonus, tt.wantBonus)
			}
		})
	}
}
