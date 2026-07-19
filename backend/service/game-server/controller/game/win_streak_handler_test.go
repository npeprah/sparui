package game

import (
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestUpdateWinStreaks_FirstWin tests streak increment when player wins first round
func TestUpdateWinStreaks_FirstWin(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 2)
	handler := NewWinStreakHandler(gameState)

	// Player 1 wins first round
	events := handler.UpdateWinStreaks("player-1")

	// Verify streak incremented
	player := gameState.GetPlayer("player-1")
	if player.WinStreak != 1 {
		t.Errorf("Expected winner streak = 1, got %d", player.WinStreak)
	}

	// Verify no fire effect yet (needs 2+ streak)
	if player.IsOnFire {
		t.Error("Player should not be on fire with streak = 1")
	}

	// Verify events
	if len(events) != 1 {
		t.Fatalf("Expected 1 event, got %d", len(events))
	}
	if events[0].Type != StreakEventStreakStarted {
		t.Errorf("Expected event type %s, got %s", StreakEventStreakStarted, events[0].Type)
	}
	if events[0].PlayerID != "player-1" {
		t.Errorf("Expected event for player-1, got %s", events[0].PlayerID)
	}
	if events[0].Streak != 1 {
		t.Errorf("Expected streak = 1, got %d", events[0].Streak)
	}
	if events[0].Bonus != 0 {
		t.Errorf("Expected no bonus for streak = 1, got %d", events[0].Bonus)
	}
}

// TestUpdateWinStreaks_SecondWinActivatesFire tests fire effect activation
func TestUpdateWinStreaks_SecondWinActivatesFire(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 2)
	handler := NewWinStreakHandler(gameState)

	// Player 1 wins first round
	handler.UpdateWinStreaks("player-1")

	// Player 1 wins second round - fire should activate
	events := handler.UpdateWinStreaks("player-1")

	// Verify streak incremented
	player := gameState.GetPlayer("player-1")
	if player.WinStreak != 2 {
		t.Errorf("Expected winner streak = 2, got %d", player.WinStreak)
	}

	// Verify fire effect activated
	if !player.IsOnFire {
		t.Error("Player should be on fire with streak = 2")
	}

	// Verify events
	if len(events) != 1 {
		t.Fatalf("Expected 1 event, got %d", len(events))
	}
	if events[0].Type != StreakEventFireActivated {
		t.Errorf("Expected event type %s, got %s", StreakEventFireActivated, events[0].Type)
	}
	if events[0].Streak != 2 {
		t.Errorf("Expected streak = 2, got %d", events[0].Streak)
	}
	if events[0].Bonus != FireStreakBonus {
		t.Errorf("Expected fire bonus = %d, got %d", FireStreakBonus, events[0].Bonus)
	}
}

// TestUpdateWinStreaks_FireContinues tests fire effect continuing with higher streaks
func TestUpdateWinStreaks_FireContinues(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 2)
	handler := NewWinStreakHandler(gameState)

	// Build up to streak = 2 (fire activates)
	handler.UpdateWinStreaks("player-1")
	handler.UpdateWinStreaks("player-1")

	// Third win - fire continues
	events := handler.UpdateWinStreaks("player-1")

	// Verify streak incremented
	player := gameState.GetPlayer("player-1")
	if player.WinStreak != 3 {
		t.Errorf("Expected winner streak = 3, got %d", player.WinStreak)
	}

	// Verify fire still active
	if !player.IsOnFire {
		t.Error("Player should still be on fire with streak = 3")
	}

	// Verify events
	if len(events) != 1 {
		t.Fatalf("Expected 1 event, got %d", len(events))
	}
	if events[0].Type != StreakEventFireContinued {
		t.Errorf("Expected event type %s, got %s", StreakEventFireContinued, events[0].Type)
	}
	if events[0].Streak != 3 {
		t.Errorf("Expected streak = 3, got %d", events[0].Streak)
	}
	if events[0].Bonus != FireStreakBonus {
		t.Errorf("Expected fire bonus = %d, got %d", FireStreakBonus, events[0].Bonus)
	}
}

// TestUpdateWinStreaks_StreakBroken tests streak reset when player loses
func TestUpdateWinStreaks_StreakBroken(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 2)
	handler := NewWinStreakHandler(gameState)

	// Player 1 builds streak
	handler.UpdateWinStreaks("player-1")
	handler.UpdateWinStreaks("player-1")

	// Player 2 wins - Player 1's streak should break
	events := handler.UpdateWinStreaks("player-2")

	// Verify Player 1's streak reset
	player1 := gameState.GetPlayer("player-1")
	if player1.WinStreak != 0 {
		t.Errorf("Expected player-1 streak = 0, got %d", player1.WinStreak)
	}
	if player1.IsOnFire {
		t.Error("Player 1 should no longer be on fire")
	}

	// Verify Player 2's streak started
	player2 := gameState.GetPlayer("player-2")
	if player2.WinStreak != 1 {
		t.Errorf("Expected player-2 streak = 1, got %d", player2.WinStreak)
	}

	// Verify events (should include streak broken for player-1)
	if len(events) != 2 {
		t.Fatalf("Expected 2 events, got %d", len(events))
	}

	// Find streak broken event
	var brokenEvent *StreakEvent
	for i := range events {
		if events[i].Type == StreakEventStreakBroken {
			brokenEvent = &events[i]
			break
		}
	}
	if brokenEvent == nil {
		t.Fatal("Expected streak broken event not found")
	}
	if brokenEvent.PlayerID != "player-1" {
		t.Errorf("Expected broken event for player-1, got %s", brokenEvent.PlayerID)
	}
}

// TestUpdateWinStreaks_FreezeEffect tests freeze bonus when breaking 3+ streak
func TestUpdateWinStreaks_FreezeEffect(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 2)
	handler := NewWinStreakHandler(gameState)

	// Player 1 builds streak to 3
	handler.UpdateWinStreaks("player-1")
	handler.UpdateWinStreaks("player-1")
	handler.UpdateWinStreaks("player-1")

	// Player 2 wins and breaks the streak - freeze should trigger
	events := handler.UpdateWinStreaks("player-2")

	// Verify Player 1's streak reset
	player1 := gameState.GetPlayer("player-1")
	if player1.WinStreak != 0 {
		t.Errorf("Expected player-1 streak = 0, got %d", player1.WinStreak)
	}

	// Verify freeze event
	var freezeEvent *StreakEvent
	for i := range events {
		if events[i].Type == StreakEventFreezeTriggered {
			freezeEvent = &events[i]
			break
		}
	}
	if freezeEvent == nil {
		t.Fatal("Expected freeze triggered event not found")
	}
	if freezeEvent.PlayerID != "player-2" {
		t.Errorf("Expected freeze event for player-2, got %s", freezeEvent.PlayerID)
	}
	if freezeEvent.Bonus != FreezeBreakBonus {
		t.Errorf("Expected freeze bonus = %d, got %d", FreezeBreakBonus, freezeEvent.Bonus)
	}
	if freezeEvent.BrokenStreak != 3 {
		t.Errorf("Expected broken streak = 3, got %d", freezeEvent.BrokenStreak)
	}
}

// TestUpdateWinStreaks_NoFreezeForSmallStreaks tests no freeze for breaking streaks < 3
func TestUpdateWinStreaks_NoFreezeForSmallStreaks(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 2)
	handler := NewWinStreakHandler(gameState)

	// Player 1 builds streak to 2 (fire active but not freeze-worthy)
	handler.UpdateWinStreaks("player-1")
	handler.UpdateWinStreaks("player-1")

	// Player 2 wins - should NOT trigger freeze (streak was only 2)
	events := handler.UpdateWinStreaks("player-2")

	// Verify no freeze event
	for _, event := range events {
		if event.Type == StreakEventFreezeTriggered {
			t.Error("Should not trigger freeze when breaking streak < 3")
		}
	}
}

// TestUpdateWinStreaks_MultiplePlayersWithStreaks tests simultaneous streaks
func TestUpdateWinStreaks_MultiplePlayersWithStreaks(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 3)
	handler := NewWinStreakHandler(gameState)

	// Player 1 builds streak
	handler.UpdateWinStreaks("player-1")
	handler.UpdateWinStreaks("player-1")

	// Player 2 wins once
	handler.UpdateWinStreaks("player-2")

	// Player 3 wins once
	handler.UpdateWinStreaks("player-3")

	// Verify all streaks maintained correctly
	player1 := gameState.GetPlayer("player-1")
	if player1.WinStreak != 0 { // Lost after player-2 won
		t.Errorf("Expected player-1 streak = 0, got %d", player1.WinStreak)
	}

	player2 := gameState.GetPlayer("player-2")
	if player2.WinStreak != 0 { // Lost after player-3 won
		t.Errorf("Expected player-2 streak = 0, got %d", player2.WinStreak)
	}

	player3 := gameState.GetPlayer("player-3")
	if player3.WinStreak != 1 {
		t.Errorf("Expected player-3 streak = 1, got %d", player3.WinStreak)
	}
}

// TestCalculateFireBonus tests fire bonus calculation
func TestCalculateFireBonus(t *testing.T) {
	tests := []struct {
		name     string
		streak   int
		expected int
	}{
		{"No streak", 0, 0},
		{"Streak 1", 1, 0},
		{"Streak 2 - fire activates", 2, FireStreakBonus},
		{"Streak 3", 3, FireStreakBonus},
		{"Streak 5", 5, FireStreakBonus},
		{"Streak 10", 10, FireStreakBonus},
	}

	handler := NewWinStreakHandler(nil)
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bonus := handler.CalculateFireBonus(tt.streak)
			if bonus != tt.expected {
				t.Errorf("Expected bonus %d, got %d", tt.expected, bonus)
			}
		})
	}
}

// TestCalculateFreezeBonus tests freeze bonus calculation
func TestCalculateFreezeBonus(t *testing.T) {
	tests := []struct {
		name         string
		brokenStreak int
		expected     int
	}{
		{"No streak broken", 0, 0},
		{"Streak 1 broken", 1, 0},
		{"Streak 2 broken", 2, 0},
		{"Streak 3 broken", 3, FreezeBreakBonus},
		{"Streak 5 broken", 5, FreezeBreakBonus},
		{"Streak 10 broken", 10, FreezeBreakBonus},
	}

	handler := NewWinStreakHandler(nil)
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bonus := handler.CalculateFreezeBonus(tt.brokenStreak)
			if bonus != tt.expected {
				t.Errorf("Expected bonus %d, got %d", tt.expected, bonus)
			}
		})
	}
}

// TestCheckFireEffect tests fire effect detection
func TestCheckFireEffect(t *testing.T) {
	tests := []struct {
		name     string
		streak   int
		expected bool
	}{
		{"No streak", 0, false},
		{"Streak 1", 1, false},
		{"Streak 2", 2, true},
		{"Streak 3", 3, true},
		{"Streak 10", 10, true},
	}

	handler := NewWinStreakHandler(nil)
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hasFire := handler.CheckFireEffect(tt.streak)
			if hasFire != tt.expected {
				t.Errorf("Expected fire effect %v, got %v", tt.expected, hasFire)
			}
		})
	}
}

// TestCheckFreezeEffect tests freeze effect detection
func TestCheckFreezeEffect(t *testing.T) {
	tests := []struct {
		name         string
		brokenStreak int
		expected     bool
	}{
		{"No streak broken", 0, false},
		{"Streak 1 broken", 1, false},
		{"Streak 2 broken", 2, false},
		{"Streak 3 broken", 3, true},
		{"Streak 5 broken", 5, true},
	}

	handler := NewWinStreakHandler(nil)
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hasFreeze := handler.CheckFreezeEffect(tt.brokenStreak)
			if hasFreeze != tt.expected {
				t.Errorf("Expected freeze effect %v, got %v", tt.expected, hasFreeze)
			}
		})
	}
}

// TestUpdateWinStreaks_EmptyWinnerID tests error handling for empty winner
func TestUpdateWinStreaks_EmptyWinnerID(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 2)
	handler := NewWinStreakHandler(gameState)

	// Empty winner should return empty events (no crash)
	events := handler.UpdateWinStreaks("")

	if len(events) != 0 {
		t.Errorf("Expected no events for empty winner, got %d", len(events))
	}
}

// TestUpdateWinStreaks_InvalidPlayerID tests error handling for invalid player
func TestUpdateWinStreaks_InvalidPlayerID(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 2)
	handler := NewWinStreakHandler(gameState)

	// Invalid player should return empty events (no crash)
	events := handler.UpdateWinStreaks("invalid-player")

	if len(events) != 0 {
		t.Errorf("Expected no events for invalid player, got %d", len(events))
	}
}

// TestUpdateWinStreaks_NilGameState tests handling of nil game state
func TestUpdateWinStreaks_NilGameState(t *testing.T) {
	handler := NewWinStreakHandler(nil)

	// Should handle gracefully without panic
	events := handler.UpdateWinStreaks("player-1")

	if len(events) != 0 {
		t.Errorf("Expected no events for nil game state, got %d", len(events))
	}
}

// TestUpdateWinStreaks_Concurrent tests thread safety
func TestUpdateWinStreaks_Concurrent(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 3)
	handler := NewWinStreakHandler(gameState)

	// Run concurrent streak updates
	var wg sync.WaitGroup
	iterations := 100

	// Player 1 wins repeatedly (build streak)
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < iterations/2; i++ {
			handler.UpdateWinStreaks("player-1")
			time.Sleep(time.Microsecond)
		}
	}()

	// Player 2 wins occasionally (break streaks)
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < iterations/4; i++ {
			handler.UpdateWinStreaks("player-2")
			time.Sleep(time.Microsecond * 2)
		}
	}()

	// Player 3 reads streak data
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < iterations; i++ {
			_ = gameState.GetPlayer("player-1")
			_ = gameState.GetPlayer("player-2")
			time.Sleep(time.Microsecond / 2)
		}
	}()

	wg.Wait()

	// Verify data integrity - streaks should be valid
	for _, player := range gameState.Players {
		if player.WinStreak < 0 {
			t.Errorf("Player %s has invalid negative streak: %d", player.ID, player.WinStreak)
		}
		if player.WinStreak > iterations {
			t.Errorf("Player %s has impossible streak: %d", player.ID, player.WinStreak)
		}
		if player.IsOnFire && player.WinStreak < 2 {
			t.Errorf("Player %s is on fire but streak < 2: %d", player.ID, player.WinStreak)
		}
	}
}

// TestUpdateWinStreaks_LongGameScenario tests complete game scenario
func TestUpdateWinStreaks_LongGameScenario(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 3)
	handler := NewWinStreakHandler(gameState)

	// Simulate a complete 5-round game with interesting streak patterns
	rounds := []struct {
		winnerID      string
		expectedFire  string // Player who should be on fire after this round
		expectFreeze  bool
		freezeBreaker string // Player who triggered freeze
	}{
		{"player-1", "", false, ""},         // Round 1: P1 streak = 1
		{"player-1", "player-1", false, ""}, // Round 2: P1 streak = 2, fire!
		{"player-1", "player-1", false, ""}, // Round 3: P1 streak = 3, fire continues
		{"player-2", "", true, "player-2"},  // Round 4: P2 wins, breaks P1's 3-streak, freeze!
		{"player-2", "player-2", false, ""}, // Round 5: P2 streak = 2, fire!
	}

	for i, round := range rounds {
		t.Logf("Round %d: winner = %s", i+1, round.winnerID)

		events := handler.UpdateWinStreaks(round.winnerID)

		// Check if expected player is on fire
		for _, player := range gameState.Players {
			expectedFire := player.ID == round.expectedFire
			if player.IsOnFire != expectedFire {
				t.Errorf("Round %d: Player %s fire status = %v, expected %v",
					i+1, player.ID, player.IsOnFire, expectedFire)
			}
		}

		// Check for freeze event
		freezeFound := false
		for _, event := range events {
			if event.Type == StreakEventFreezeTriggered {
				freezeFound = true
				if event.PlayerID != round.freezeBreaker {
					t.Errorf("Round %d: Freeze triggered by %s, expected %s",
						i+1, event.PlayerID, round.freezeBreaker)
				}
			}
		}
		if freezeFound != round.expectFreeze {
			t.Errorf("Round %d: Freeze triggered = %v, expected %v",
				i+1, freezeFound, round.expectFreeze)
		}
	}
}

// TestUpdateWinStreaks_MaxStreak tests very high streak numbers
func TestUpdateWinStreaks_MaxStreak(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 2)
	handler := NewWinStreakHandler(gameState)

	// Build extreme streak (shouldn't happen in real game, but test boundary)
	for i := 0; i < 100; i++ {
		handler.UpdateWinStreaks("player-1")
	}

	player := gameState.GetPlayer("player-1")
	if player.WinStreak != 100 {
		t.Errorf("Expected streak = 100, got %d", player.WinStreak)
	}
	if !player.IsOnFire {
		t.Error("Player should be on fire with extreme streak")
	}

	// Break the streak
	events := handler.UpdateWinStreaks("player-2")

	// Should trigger freeze
	var freezeEvent *StreakEvent
	for i := range events {
		if events[i].Type == StreakEventFreezeTriggered {
			freezeEvent = &events[i]
			break
		}
	}
	if freezeEvent == nil {
		t.Fatal("Expected freeze event for breaking 100-streak")
	}
	if freezeEvent.BrokenStreak != 100 {
		t.Errorf("Expected broken streak = 100, got %d", freezeEvent.BrokenStreak)
	}
}

// TestGetStreakEvents tests retrieving streak events from game state
func TestGetStreakEvents(t *testing.T) {
	gameState := createTestGameStateForStreaks(t, 2)
	handler := NewWinStreakHandler(gameState)

	// Generate some events
	events1 := handler.UpdateWinStreaks("player-1")
	events2 := handler.UpdateWinStreaks("player-1")

	// Verify events are tracked
	if len(events1) == 0 {
		t.Error("Expected events from first update")
	}
	if len(events2) == 0 {
		t.Error("Expected events from second update")
	}
}

// TestGetTotalStreakBonus tests calculating total bonus from events
func TestGetTotalStreakBonus(t *testing.T) {
	handler := NewWinStreakHandler(nil)

	tests := []struct {
		name     string
		events   []StreakEvent
		playerID string
		expected int
	}{
		{
			name:     "No events",
			events:   []StreakEvent{},
			playerID: "player-1",
			expected: 0,
		},
		{
			name: "Single fire bonus",
			events: []StreakEvent{
				{
					Type:     StreakEventFireActivated,
					PlayerID: "player-1",
					Bonus:    FireStreakBonus,
				},
			},
			playerID: "player-1",
			expected: FireStreakBonus,
		},
		{
			name: "Single freeze bonus",
			events: []StreakEvent{
				{
					Type:     StreakEventFreezeTriggered,
					PlayerID: "player-2",
					Bonus:    FreezeBreakBonus,
				},
			},
			playerID: "player-2",
			expected: FreezeBreakBonus,
		},
		{
			name: "Multiple bonuses same player",
			events: []StreakEvent{
				{
					Type:     StreakEventFireActivated,
					PlayerID: "player-1",
					Bonus:    FireStreakBonus,
				},
				{
					Type:     StreakEventFreezeTriggered,
					PlayerID: "player-1",
					Bonus:    FreezeBreakBonus,
				},
			},
			playerID: "player-1",
			expected: FireStreakBonus + FreezeBreakBonus,
		},
		{
			name: "Events for different players",
			events: []StreakEvent{
				{
					Type:     StreakEventFireActivated,
					PlayerID: "player-1",
					Bonus:    FireStreakBonus,
				},
				{
					Type:     StreakEventFreezeTriggered,
					PlayerID: "player-2",
					Bonus:    FreezeBreakBonus,
				},
				{
					Type:     StreakEventStreakBroken,
					PlayerID: "player-1",
					Bonus:    0,
				},
			},
			playerID: "player-1",
			expected: FireStreakBonus,
		},
		{
			name: "Player not in events",
			events: []StreakEvent{
				{
					Type:     StreakEventFireActivated,
					PlayerID: "player-1",
					Bonus:    FireStreakBonus,
				},
			},
			playerID: "player-3",
			expected: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			total := handler.GetTotalStreakBonus(tt.events, tt.playerID)
			if total != tt.expected {
				t.Errorf("Expected total bonus %d, got %d", tt.expected, total)
			}
		})
	}
}

// Helper function to create test game state for streak tests
func createTestGameStateForStreaks(t *testing.T, numPlayers int) *entity.GameState {
	t.Helper()

	if numPlayers < 2 || numPlayers > 4 {
		t.Fatalf("Invalid number of players: %d (must be 2-4)", numPlayers)
	}

	players := make([]entity.GamePlayer, numPlayers)
	for i := 0; i < numPlayers; i++ {
		players[i] = entity.GamePlayer{
			ID:        fmt.Sprintf("player-%d", i+1),
			Username:  fmt.Sprintf("Player %d", i+1),
			Avatar:    fmt.Sprintf("avatar-%d", i+1),
			Hand:      []entity.Card{},
			Score:     0,
			RoundsWon: 0,
			WinStreak: 0,
			IsOnFire:  false,
		}
	}

	return &entity.GameState{
		GameID:       "test-game-123",
		RoomCode:     "TEST",
		TotalRounds:  5,
		PointsToWin:  15,
		Phase:        entity.PhasePlaying,
		Players:      players,
		LeaderID:     "player-1",
		CurrentRound: 1,
		StartedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}

// Benchmark for UpdateWinStreaks to ensure performance
func BenchmarkUpdateWinStreaks(b *testing.B) {
	gameState := &entity.GameState{
		GameID:   "bench-game",
		RoomCode: "BENCH",
		Players: []entity.GamePlayer{
			{ID: "player-1", Username: "Player 1"},
			{ID: "player-2", Username: "Player 2"},
			{ID: "player-3", Username: "Player 3"},
			{ID: "player-4", Username: "Player 4"},
		},
	}
	handler := NewWinStreakHandler(gameState)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		playerID := fmt.Sprintf("player-%d", (i%4)+1)
		handler.UpdateWinStreaks(playerID)
	}
}

// Benchmark for concurrent streak updates
func BenchmarkUpdateWinStreaksConcurrent(b *testing.B) {
	gameState := &entity.GameState{
		GameID:   "bench-game",
		RoomCode: "BENCH",
		Players: []entity.GamePlayer{
			{ID: "player-1", Username: "Player 1"},
			{ID: "player-2", Username: "Player 2"},
			{ID: "player-3", Username: "Player 3"},
			{ID: "player-4", Username: "Player 4"},
		},
	}
	handler := NewWinStreakHandler(gameState)

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			playerID := fmt.Sprintf("player-%d", (i%4)+1)
			handler.UpdateWinStreaks(playerID)
			i++
		}
	})
}
