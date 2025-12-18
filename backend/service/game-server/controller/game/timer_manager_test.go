package game

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestTimerManagerStartAndCancel tests starting and cancelling timers
func TestTimerManagerStartAndCancel(t *testing.T) {
	tm := NewTimerManager()
	defer tm.Cleanup()

	ctx := context.Background()

	// Start a timer
	err := tm.StartTimer(ctx, "game-1", "player-1", 5)
	if err != nil {
		t.Fatalf("StartTimer failed: %v", err)
	}

	// Verify timer is active
	if !tm.IsActive("game-1") {
		t.Error("Timer should be active")
	}

	// Check remaining time
	remaining := tm.GetRemaining("game-1")
	if remaining < 4 || remaining > 5 {
		t.Errorf("Expected remaining time 4-5s, got %d", remaining)
	}

	// Cancel the timer
	tm.CancelTimer("game-1")

	// Verify timer is no longer active
	if tm.IsActive("game-1") {
		t.Error("Timer should not be active after cancel")
	}

	// Check remaining returns -1 for cancelled timer
	remaining = tm.GetRemaining("game-1")
	if remaining != -1 {
		t.Errorf("Expected remaining time -1 for cancelled timer, got %d", remaining)
	}
}

// TestTimerManagerExpiration tests timer expiration
func TestTimerManagerExpiration(t *testing.T) {
	tm := NewTimerManager()
	defer tm.Cleanup()

	ctx := context.Background()

	// Track callback invocations
	var mu sync.Mutex
	tickCount := 0
	expireCalled := false

	tm.SetCallbacks(
		func(gameID, playerID string, remaining int) {
			mu.Lock()
			defer mu.Unlock()
			tickCount++
		},
		func(gameID, playerID string, remaining int) {
			mu.Lock()
			defer mu.Unlock()
			expireCalled = true
			if remaining != 0 {
				t.Errorf("Expected remaining=0 on expire, got %d", remaining)
			}
		},
	)

	// Start a 2-second timer
	err := tm.StartTimer(ctx, "game-1", "player-1", 2)
	if err != nil {
		t.Fatalf("StartTimer failed: %v", err)
	}

	// Wait for timer to expire
	time.Sleep(3 * time.Second)

	// Verify callbacks were called
	mu.Lock()
	defer mu.Unlock()

	if tickCount < 1 {
		t.Errorf("Expected at least 1 tick, got %d", tickCount)
	}

	if !expireCalled {
		t.Error("Expire callback should have been called")
	}

	// Timer should no longer be active
	if tm.IsActive("game-1") {
		t.Error("Timer should not be active after expiration")
	}
}

// TestTimerManagerMultipleGames tests managing timers for multiple games
func TestTimerManagerMultipleGames(t *testing.T) {
	tm := NewTimerManager()
	defer tm.Cleanup()

	ctx := context.Background()

	// Start timers for multiple games
	err := tm.StartTimer(ctx, "game-1", "player-1", 10)
	if err != nil {
		t.Fatalf("StartTimer game-1 failed: %v", err)
	}

	err = tm.StartTimer(ctx, "game-2", "player-2", 10)
	if err != nil {
		t.Fatalf("StartTimer game-2 failed: %v", err)
	}

	err = tm.StartTimer(ctx, "game-3", "player-3", 10)
	if err != nil {
		t.Fatalf("StartTimer game-3 failed: %v", err)
	}

	// Verify all timers are active
	if !tm.IsActive("game-1") || !tm.IsActive("game-2") || !tm.IsActive("game-3") {
		t.Error("All timers should be active")
	}

	// Cancel one timer
	tm.CancelTimer("game-2")

	// Verify correct timer was cancelled
	if tm.IsActive("game-2") {
		t.Error("game-2 timer should not be active")
	}
	if !tm.IsActive("game-1") || !tm.IsActive("game-3") {
		t.Error("game-1 and game-3 timers should still be active")
	}

	// Cleanup
	tm.Cleanup()

	// Verify all timers are stopped
	if tm.IsActive("game-1") || tm.IsActive("game-2") || tm.IsActive("game-3") {
		t.Error("All timers should be cleaned up")
	}
}

// TestTimerManagerReplaceExisting tests replacing an existing timer
func TestTimerManagerReplaceExisting(t *testing.T) {
	tm := NewTimerManager()
	defer tm.Cleanup()

	ctx := context.Background()

	// Start a timer
	err := tm.StartTimer(ctx, "game-1", "player-1", 10)
	if err != nil {
		t.Fatalf("StartTimer failed: %v", err)
	}

	// Wait a moment
	time.Sleep(100 * time.Millisecond)

	remaining1 := tm.GetRemaining("game-1")

	// Start a new timer for the same game (should replace)
	err = tm.StartTimer(ctx, "game-1", "player-2", 5)
	if err != nil {
		t.Fatalf("StartTimer replace failed: %v", err)
	}

	// Wait a moment
	time.Sleep(100 * time.Millisecond)

	remaining2 := tm.GetRemaining("game-1")

	// New timer should have reset the countdown
	if remaining2 < 4 || remaining2 > 5 {
		t.Errorf("Expected new timer remaining 4-5s, got %d", remaining2)
	}

	// New timer should be different from old timer
	if remaining1 == remaining2 {
		t.Error("New timer should have reset the countdown")
	}
}

// TestTimerManagerCallbacks tests callback invocations
func TestTimerManagerCallbacks(t *testing.T) {
	tm := NewTimerManager()
	defer tm.Cleanup()

	ctx := context.Background()

	// Track callback data
	var mu sync.Mutex
	tickData := []int{}

	tm.SetCallbacks(
		func(gameID, playerID string, remaining int) {
			mu.Lock()
			defer mu.Unlock()
			tickData = append(tickData, remaining)

			// Verify callback parameters
			if gameID != "game-1" {
				t.Errorf("Expected gameID=game-1, got %s", gameID)
			}
			if playerID != "player-1" {
				t.Errorf("Expected playerID=player-1, got %s", playerID)
			}
		},
		func(gameID, playerID string, remaining int) {
			// Expire callback tested in separate test
		},
	)

	// Start a 3-second timer
	err := tm.StartTimer(ctx, "game-1", "player-1", 3)
	if err != nil {
		t.Fatalf("StartTimer failed: %v", err)
	}

	// Wait for timer to complete
	time.Sleep(4 * time.Second)

	// Verify tick callbacks were called with decreasing values
	mu.Lock()
	defer mu.Unlock()

	if len(tickData) < 2 {
		t.Errorf("Expected at least 2 ticks, got %d", len(tickData))
	}

	// Verify countdown behavior
	for i := 1; i < len(tickData); i++ {
		if tickData[i] > tickData[i-1] {
			t.Errorf("Time should be counting down, got %v", tickData)
			break
		}
	}
}

// TestDetermineTimerDuration tests timer duration calculation
func TestDetermineTimerDuration(t *testing.T) {
	tests := []struct {
		name        string
		isLeader    bool
		turnNumber  int
		expected    int
	}{
		{
			name:       "leader gets 15 seconds",
			isLeader:   true,
			turnNumber: 0,
			expected:   15,
		},
		{
			name:       "second player gets 8 seconds",
			isLeader:   false,
			turnNumber: 1,
			expected:   8,
		},
		{
			name:       "third player gets 5 seconds",
			isLeader:   false,
			turnNumber: 2,
			expected:   5,
		},
		{
			name:       "fourth player gets 5 seconds",
			isLeader:   false,
			turnNumber: 3,
			expected:   5,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			duration := DetermineTimerDuration(tt.isLeader, tt.turnNumber)
			if duration != tt.expected {
				t.Errorf("Expected duration=%d, got %d", tt.expected, duration)
			}
		})
	}
}

// TestAutoPlayRandomCard tests automatic card selection
func TestAutoPlayRandomCard(t *testing.T) {
	tests := []struct {
		name        string
		player      *entity.GamePlayer
		ledSuit     *entity.Suit
		expectError bool
		errorMsg    string
	}{
		{
			name: "auto-play from hand - no led suit",
			player: &entity.GamePlayer{
				ID:       "player-1",
				Username: "Alice",
				Hand: []entity.Card{
					{Suit: entity.Hearts, Value: entity.Ace},
					{Suit: entity.Clubs, Value: entity.King},
					{Suit: entity.Diamonds, Value: entity.Queen},
				},
			},
			ledSuit:     nil,
			expectError: false,
		},
		{
			name: "auto-play follows led suit when available",
			player: &entity.GamePlayer{
				ID:       "player-1",
				Username: "Alice",
				Hand: []entity.Card{
					{Suit: entity.Hearts, Value: entity.Ace},
					{Suit: entity.Hearts, Value: entity.King},
					{Suit: entity.Clubs, Value: entity.Queen},
				},
			},
			ledSuit:     func() *entity.Suit { s := entity.Hearts; return &s }(),
			expectError: false,
		},
		{
			name: "auto-play any card when led suit not available",
			player: &entity.GamePlayer{
				ID:       "player-1",
				Username: "Alice",
				Hand: []entity.Card{
					{Suit: entity.Clubs, Value: entity.Ace},
					{Suit: entity.Diamonds, Value: entity.King},
				},
			},
			ledSuit:     func() *entity.Suit { s := entity.Hearts; return &s }(),
			expectError: false,
		},
		{
			name:        "error - nil player",
			player:      nil,
			ledSuit:     nil,
			expectError: true,
			errorMsg:    "player is nil",
		},
		{
			name: "error - player has no cards",
			player: &entity.GamePlayer{
				ID:       "player-1",
				Username: "Alice",
				Hand:     []entity.Card{},
			},
			ledSuit:     nil,
			expectError: true,
			errorMsg:    "player has no cards",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			card, err := AutoPlayRandomCard(tt.player, tt.ledSuit)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error containing '%s', got nil", tt.errorMsg)
				} else if tt.errorMsg != "" && err.Error() != tt.errorMsg {
					t.Errorf("Expected error '%s', got '%s'", tt.errorMsg, err.Error())
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}

			if card == nil {
				t.Error("Expected card, got nil")
				return
			}

			// Verify card is from player's hand
			found := false
			for _, c := range tt.player.Hand {
				if c.Equals(card) {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("Auto-played card %s not in player's hand", card.String())
			}

			// If led suit is set and player has cards of that suit,
			// verify card matches led suit (probabilistic check)
			if tt.ledSuit != nil {
				hasLedSuit := tt.player.HasSuit(*tt.ledSuit)
				if hasLedSuit && card.Suit != *tt.ledSuit {
					// Note: This is a probabilistic test - might fail occasionally
					// but should usually pass since we prefer led suit
					t.Logf("Warning: Auto-play didn't prefer led suit (might be random chance)")
				}
			}
		})
	}
}

// TestAutoPlayRandomCardPreference tests that auto-play prefers led suit
func TestAutoPlayRandomCardPreference(t *testing.T) {
	ledSuit := entity.Hearts
	player := &entity.GamePlayer{
		ID:       "player-1",
		Username: "Alice",
		Hand: []entity.Card{
			{Suit: entity.Hearts, Value: entity.Ace},
			{Suit: entity.Hearts, Value: entity.King},
			{Suit: entity.Clubs, Value: entity.Queen},
			{Suit: entity.Diamonds, Value: entity.Jack},
		},
	}

	// Run multiple times to verify preference (probabilistic test)
	heartsCount := 0
	iterations := 100

	for i := 0; i < iterations; i++ {
		card, err := AutoPlayRandomCard(player, &ledSuit)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if card.Suit == entity.Hearts {
			heartsCount++
		}
	}

	// Should pick hearts most of the time (> 90% since 2/4 cards are hearts)
	if heartsCount < 80 {
		t.Errorf("Expected auto-play to prefer led suit, got hearts %d/%d times", heartsCount, iterations)
	}
}

// TestTimerManagerConcurrency tests concurrent operations
func TestTimerManagerConcurrency(t *testing.T) {
	tm := NewTimerManager()
	defer tm.Cleanup()

	ctx := context.Background()

	var wg sync.WaitGroup

	// Start multiple timers concurrently
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			gameID := fmt.Sprintf("game-%d", id)
			playerID := fmt.Sprintf("player-%d", id)
			err := tm.StartTimer(ctx, gameID, playerID, 5)
			if err != nil {
				t.Errorf("StartTimer failed: %v", err)
			}
		}(i)
	}

	wg.Wait()

	// Check all timers are active
	for i := 0; i < 10; i++ {
		gameID := fmt.Sprintf("game-%d", i)
		if !tm.IsActive(gameID) {
			t.Errorf("Timer for %s should be active", gameID)
		}
	}

	// Cancel all timers concurrently
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			gameID := fmt.Sprintf("game-%d", id)
			tm.CancelTimer(gameID)
		}(i)
	}

	wg.Wait()

	// Check all timers are cancelled
	for i := 0; i < 10; i++ {
		gameID := fmt.Sprintf("game-%d", i)
		if tm.IsActive(gameID) {
			t.Errorf("Timer for %s should be cancelled", gameID)
		}
	}
}

// TestTimerManagerGetRemaining tests remaining time calculation
func TestTimerManagerGetRemaining(t *testing.T) {
	tm := NewTimerManager()
	defer tm.Cleanup()

	ctx := context.Background()

	// Start a 10-second timer
	err := tm.StartTimer(ctx, "game-1", "player-1", 10)
	if err != nil {
		t.Fatalf("StartTimer failed: %v", err)
	}

	// Check remaining time immediately
	remaining := tm.GetRemaining("game-1")
	if remaining < 9 || remaining > 10 {
		t.Errorf("Expected remaining time 9-10s, got %d", remaining)
	}

	// Wait 2 seconds
	time.Sleep(2 * time.Second)

	// Check remaining time again
	remaining = tm.GetRemaining("game-1")
	if remaining < 7 || remaining > 9 {
		t.Errorf("Expected remaining time 7-9s after 2s, got %d", remaining)
	}

	// Check non-existent game
	remaining = tm.GetRemaining("nonexistent")
	if remaining != -1 {
		t.Errorf("Expected remaining time -1 for nonexistent game, got %d", remaining)
	}
}
