package matchmaking

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/controller/room"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// mockClient simulates a WebSocket client for testing
type mockClient struct {
	id       string
	playerID string
	sentMessages []interface{}
	mu       sync.Mutex
}

func (m *mockClient) SendJSON(data interface{}) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sentMessages = append(m.sentMessages, data)
	return nil
}

func (m *mockClient) GetSentMessages() []interface{} {
	m.mu.Lock()
	defer m.mu.Unlock()
	return append([]interface{}{}, m.sentMessages...)
}

func newMockClient(playerID string) *mockClient {
	return &mockClient{
		id:       "client-" + playerID,
		playerID: playerID,
		sentMessages: []interface{}{},
	}
}

// TestQueueJoin tests joining the matchmaking queue
func TestQueueJoin(t *testing.T) {
	tests := []struct {
		name           string
		playerID       string
		username       string
		existingPlayers []string // Players already in queue
		expectError    bool
		errorContains  string
	}{
		{
			name:           "successful join",
			playerID:       "player1",
			username:       "Alice",
			existingPlayers: []string{},
			expectError:    false,
		},
		{
			name:           "duplicate prevention - same player cannot join twice",
			playerID:       "player1",
			username:       "Alice",
			existingPlayers: []string{"player1"},
			expectError:    true,
			errorContains:  "already in queue",
		},
		{
			name:           "empty player ID",
			playerID:       "",
			username:       "Alice",
			existingPlayers: []string{},
			expectError:    true,
			errorContains:  "playerID is required",
		},
		{
			name:           "empty username",
			playerID:       "player1",
			username:       "",
			existingPlayers: []string{},
			expectError:    true,
			errorContains:  "username is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create queue manager
			roomMgr := room.NewManager()
			queue := NewQueueManager(roomMgr)

			// Add existing players to queue
			for _, pid := range tt.existingPlayers {
				client := newMockClient(pid)
				_ = queue.JoinQueue(pid, "Existing-"+pid, client)
			}

			// Attempt to join queue
			client := newMockClient(tt.playerID)
			err := queue.JoinQueue(tt.playerID, tt.username, client)

			// Verify expectations
			if tt.expectError {
				if err == nil {
					t.Errorf("expected error containing '%s', got nil", tt.errorContains)
				} else if tt.errorContains != "" && !contains(err.Error(), tt.errorContains) {
					t.Errorf("expected error containing '%s', got '%s'", tt.errorContains, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("expected no error, got: %v", err)
				}

				// Verify player is in queue
				position, err := queue.GetQueuePosition(tt.playerID)
				if err != nil {
					t.Errorf("player should be in queue: %v", err)
				}
				expectedPosition := len(tt.existingPlayers) + 1
				if position != expectedPosition {
					t.Errorf("expected position %d, got %d", expectedPosition, position)
				}
			}
		})
	}
}

// TestQueueLeave tests leaving the matchmaking queue
func TestQueueLeave(t *testing.T) {
	tests := []struct {
		name           string
		playerID       string
		existingPlayers []string
		expectError    bool
		errorContains  string
	}{
		{
			name:           "successful leave",
			playerID:       "player1",
			existingPlayers: []string{"player1", "player2"},
			expectError:    false,
		},
		{
			name:           "leave when not in queue",
			playerID:       "player3",
			existingPlayers: []string{"player1", "player2"},
			expectError:    true,
			errorContains:  "not in queue",
		},
		{
			name:           "empty queue",
			playerID:       "player1",
			existingPlayers: []string{},
			expectError:    true,
			errorContains:  "not in queue",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			roomMgr := room.NewManager()
			queue := NewQueueManager(roomMgr)

			// Add existing players
			for _, pid := range tt.existingPlayers {
				client := newMockClient(pid)
				_ = queue.JoinQueue(pid, "User-"+pid, client)
			}

			// Attempt to leave
			err := queue.LeaveQueue(tt.playerID)

			// Verify expectations
			if tt.expectError {
				if err == nil {
					t.Errorf("expected error containing '%s', got nil", tt.errorContains)
				} else if !contains(err.Error(), tt.errorContains) {
					t.Errorf("expected error containing '%s', got '%s'", tt.errorContains, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("expected no error, got: %v", err)
				}

				// Verify player is no longer in queue
				_, err := queue.GetQueuePosition(tt.playerID)
				if err == nil {
					t.Error("player should not be in queue after leaving")
				}
			}
		})
	}
}

// TestMatchCreation tests automatic match creation
func TestMatchCreation(t *testing.T) {
	tests := []struct {
		name                string
		numPlayers          int
		waitTime            time.Duration
		expectedMatchCount  int
		expectedRemainingInQueue int
	}{
		{
			name:                "4 players available - immediate match",
			numPlayers:          4,
			waitTime:            0,
			expectedMatchCount:  1,
			expectedRemainingInQueue: 0,
		},
		{
			name:                "5 players - match 4, leave 1",
			numPlayers:          5,
			waitTime:            0,
			expectedMatchCount:  1,
			expectedRemainingInQueue: 1,
		},
		{
			name:                "8 players - match 4 twice, leaving 0",
			numPlayers:          8,
			waitTime:            0,
			expectedMatchCount:  2,
			expectedRemainingInQueue: 0,
		},
		{
			name:                "2 players, no wait - no match",
			numPlayers:          2,
			waitTime:            0,
			expectedMatchCount:  0,
			expectedRemainingInQueue: 2,
		},
		{
			name:                "2 players, 30s wait - relaxed match",
			numPlayers:          2,
			waitTime:            31 * time.Second,
			expectedMatchCount:  1,
			expectedRemainingInQueue: 0,
		},
		{
			name:                "3 players, 30s wait - relaxed match",
			numPlayers:          3,
			waitTime:            31 * time.Second,
			expectedMatchCount:  1,
			expectedRemainingInQueue: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			roomMgr := room.NewManager()
			queue := NewQueueManager(roomMgr)

			// Add players to queue with time offset
			baseTime := time.Now()
			for i := 0; i < tt.numPlayers; i++ {
				playerID := generateTestPlayerID(i)
				client := newMockClient(playerID)
				_ = queue.JoinQueue(playerID, "User"+playerID, client)

				// Manually adjust join time for wait time tests
				if tt.waitTime > 0 {
					queue.mu.Lock()
					if i < len(queue.entries) {
						queue.entries[i].JoinedAt = baseTime.Add(-tt.waitTime)
					}
					queue.mu.Unlock()
				}
			}

			// Check for matches
			ctx := context.Background()
			matches := queue.CheckForMatches(ctx)

			// Verify match count
			if len(matches) != tt.expectedMatchCount {
				t.Errorf("expected %d matches, got %d", tt.expectedMatchCount, len(matches))
			}

			// Verify remaining players in queue
			status := queue.GetQueueStatus("")
			if status.TotalPlayers != tt.expectedRemainingInQueue {
				t.Errorf("expected %d players remaining in queue, got %d",
					tt.expectedRemainingInQueue, status.TotalPlayers)
			}

			// Verify match details if match was created
			if len(matches) > 0 {
				match := matches[0]
				if match.RoomCode == "" {
					t.Error("match should have a room code")
				}
				if len(match.PlayerIDs) < 2 || len(match.PlayerIDs) > 4 {
					t.Errorf("match should have 2-4 players, got %d", len(match.PlayerIDs))
				}
			}
		})
	}
}

// TestQueueTimeout tests player timeout after 60 seconds
func TestQueueTimeout(t *testing.T) {
	roomMgr := room.NewManager()
	config := entity.DefaultMatchmakingConfig()
	config.QueueTimeout = 100 * time.Millisecond // Short timeout for testing
	queue := NewQueueManagerWithConfig(roomMgr, config)

	// Add player to queue
	client := newMockClient("player1")
	err := queue.JoinQueue("player1", "Alice", client)
	if err != nil {
		t.Fatalf("failed to join queue: %v", err)
	}

	// Wait for timeout + buffer
	time.Sleep(200 * time.Millisecond)

	// Check that player was removed
	ctx := context.Background()
	removed := queue.RemoveTimedOutPlayers(ctx)
	if len(removed) != 1 {
		t.Errorf("expected 1 player removed, got %d", len(removed))
	}

	// Verify player is no longer in queue
	_, err = queue.GetQueuePosition("player1")
	if err == nil {
		t.Error("player should not be in queue after timeout")
	}

	// Verify timeout notification was sent
	messages := client.GetSentMessages()
	if len(messages) == 0 {
		t.Error("expected timeout notification to be sent")
	}
}

// TestQueuePosition tests queue position calculation
func TestQueuePosition(t *testing.T) {
	roomMgr := room.NewManager()
	queue := NewQueueManager(roomMgr)

	// Add multiple players
	players := []string{"player1", "player2", "player3"}
	for _, pid := range players {
		client := newMockClient(pid)
		_ = queue.JoinQueue(pid, "User-"+pid, client)
	}

	// Test positions
	for i, pid := range players {
		position, err := queue.GetQueuePosition(pid)
		if err != nil {
			t.Errorf("failed to get position for %s: %v", pid, err)
		}
		expectedPosition := i + 1
		if position != expectedPosition {
			t.Errorf("expected position %d for %s, got %d", expectedPosition, pid, position)
		}
	}

	// Test non-existent player
	_, err := queue.GetQueuePosition("nonexistent")
	if err == nil {
		t.Error("expected error for non-existent player")
	}
}

// TestConcurrentQueueOperations tests thread safety
func TestConcurrentQueueOperations(t *testing.T) {
	roomMgr := room.NewManager()
	queue := NewQueueManager(roomMgr)

	numGoroutines := 50
	var wg sync.WaitGroup
	wg.Add(numGoroutines)

	// Concurrent joins
	for i := 0; i < numGoroutines; i++ {
		go func(idx int) {
			defer wg.Done()
			playerID := generateTestPlayerID(idx)
			client := newMockClient(playerID)
			_ = queue.JoinQueue(playerID, "User"+playerID, client)
		}(i)
	}

	wg.Wait()

	// Verify all players were added
	status := queue.GetQueueStatus("")
	if status.TotalPlayers != numGoroutines {
		t.Errorf("expected %d players in queue, got %d", numGoroutines, status.TotalPlayers)
	}

	// Concurrent leaves
	wg.Add(numGoroutines / 2)
	for i := 0; i < numGoroutines/2; i++ {
		go func(idx int) {
			defer wg.Done()
			playerID := generateTestPlayerID(idx)
			_ = queue.LeaveQueue(playerID)
		}(i)
	}

	wg.Wait()

	// Verify correct number remaining
	status = queue.GetQueueStatus("")
	expected := numGoroutines - (numGoroutines / 2)
	if status.TotalPlayers != expected {
		t.Errorf("expected %d players remaining, got %d", expected, status.TotalPlayers)
	}
}

// TestDisconnectHandling tests player disconnect while in queue
func TestDisconnectHandling(t *testing.T) {
	roomMgr := room.NewManager()
	queue := NewQueueManager(roomMgr)

	// Add players
	players := []string{"player1", "player2", "player3"}
	for _, pid := range players {
		client := newMockClient(pid)
		_ = queue.JoinQueue(pid, "User-"+pid, client)
	}

	// Simulate disconnect of player2
	err := queue.HandleDisconnect("player2")
	if err != nil {
		t.Errorf("failed to handle disconnect: %v", err)
	}

	// Verify player2 was removed
	_, err = queue.GetQueuePosition("player2")
	if err == nil {
		t.Error("disconnected player should be removed from queue")
	}

	// Verify other players remain
	status := queue.GetQueueStatus("")
	if status.TotalPlayers != 2 {
		t.Errorf("expected 2 players remaining, got %d", status.TotalPlayers)
	}
}

// TestQueueStatus tests queue status information
func TestQueueStatus(t *testing.T) {
	roomMgr := room.NewManager()
	queue := NewQueueManager(roomMgr)

	// Empty queue
	status := queue.GetQueueStatus("")
	if status.TotalPlayers != 0 {
		t.Errorf("empty queue should have 0 players, got %d", status.TotalPlayers)
	}
	if status.YourPosition != 0 {
		t.Errorf("non-queued player should have position 0, got %d", status.YourPosition)
	}

	// Add players
	for i := 0; i < 5; i++ {
		playerID := generateTestPlayerID(i)
		client := newMockClient(playerID)
		_ = queue.JoinQueue(playerID, "User"+playerID, client)
	}

	// Check status for specific player
	status = queue.GetQueueStatus(generateTestPlayerID(2))
	if status.TotalPlayers != 5 {
		t.Errorf("expected 5 total players, got %d", status.TotalPlayers)
	}
	if status.YourPosition != 3 {
		t.Errorf("expected position 3, got %d", status.YourPosition)
	}

	// Estimated wait time should be calculated
	if status.EstimatedWaitTime < 0 {
		t.Errorf("estimated wait time should be non-negative, got %d", status.EstimatedWaitTime)
	}
}

// TestEdgeCases tests various edge cases
func TestEdgeCases(t *testing.T) {
	t.Run("empty queue operations", func(t *testing.T) {
		roomMgr := room.NewManager()
		queue := NewQueueManager(roomMgr)

		// Leave empty queue
		err := queue.LeaveQueue("player1")
		if err == nil {
			t.Error("leaving empty queue should return error")
		}

		// Check matches on empty queue
		ctx := context.Background()
		matches := queue.CheckForMatches(ctx)
		if len(matches) != 0 {
			t.Error("empty queue should produce no matches")
		}

		// Get status of empty queue
		status := queue.GetQueueStatus("")
		if status.TotalPlayers != 0 {
			t.Error("empty queue should have 0 players")
		}
	})

	t.Run("single player", func(t *testing.T) {
		roomMgr := room.NewManager()
		queue := NewQueueManager(roomMgr)

		client := newMockClient("player1")
		_ = queue.JoinQueue("player1", "Alice", client)

		// Single player should not create a match
		ctx := context.Background()
		matches := queue.CheckForMatches(ctx)
		if len(matches) != 0 {
			t.Error("single player should not create a match")
		}
	})

	t.Run("exact 4 players multiple times", func(t *testing.T) {
		roomMgr := room.NewManager()
		queue := NewQueueManager(roomMgr)
		ctx := context.Background()

		// First batch of 4 players
		for i := 0; i < 4; i++ {
			playerID := generateTestPlayerID(i)
			client := newMockClient(playerID)
			_ = queue.JoinQueue(playerID, "User"+playerID, client)
		}

		matches := queue.CheckForMatches(ctx)
		if len(matches) != 1 {
			t.Errorf("expected 1 match, got %d", len(matches))
		}

		// Second batch of 4 players
		for i := 4; i < 8; i++ {
			playerID := generateTestPlayerID(i)
			client := newMockClient(playerID)
			_ = queue.JoinQueue(playerID, "User"+playerID, client)
		}

		matches = queue.CheckForMatches(ctx)
		if len(matches) != 1 {
			t.Errorf("expected 1 match for second batch, got %d", len(matches))
		}
	})
}

// TestRoomCreationIntegration tests integration with room manager
func TestRoomCreationIntegration(t *testing.T) {
	roomMgr := room.NewManager()
	queue := NewQueueManager(roomMgr)

	// Add 4 players
	for i := 0; i < 4; i++ {
		playerID := generateTestPlayerID(i)
		client := newMockClient(playerID)
		_ = queue.JoinQueue(playerID, "User"+playerID, client)
	}

	// Create match
	ctx := context.Background()
	matches := queue.CheckForMatches(ctx)

	if len(matches) != 1 {
		t.Fatalf("expected 1 match, got %d", len(matches))
	}

	match := matches[0]

	// Verify room was created
	if match.RoomCode == "" {
		t.Error("match should have a room code")
	}

	// Verify room exists in room manager
	room, err := roomMgr.GetRoom(match.RoomCode)
	if err != nil {
		t.Fatalf("room should exist in room manager: %v", err)
	}

	// Verify all players are in the room
	if len(room.Players) != 4 {
		t.Errorf("expected 4 players in room, got %d", len(room.Players))
	}

	// Verify room settings - with Quick Match all players are auto-set to ready
	// so status will be StatusReady when all players are ready
	if room.Status != entity.StatusReady && room.Status != entity.StatusWaiting {
		t.Errorf("expected room status 'waiting' or 'ready', got '%s'", room.Status)
	}
}

// TestMatchNotifications tests that matched players receive notifications
func TestMatchNotifications(t *testing.T) {
	roomMgr := room.NewManager()
	queue := NewQueueManager(roomMgr)

	// Add 4 players with mock clients
	clients := make([]*mockClient, 4)
	for i := 0; i < 4; i++ {
		playerID := generateTestPlayerID(i)
		clients[i] = newMockClient(playerID)
		_ = queue.JoinQueue(playerID, "User"+playerID, clients[i])
	}

	// Create match
	ctx := context.Background()
	matches := queue.CheckForMatches(ctx)

	if len(matches) != 1 {
		t.Fatalf("expected 1 match, got %d", len(matches))
	}

	// Give time for notifications to be sent
	time.Sleep(50 * time.Millisecond)

	// Verify all clients received match notification
	for i, client := range clients {
		messages := client.GetSentMessages()
		if len(messages) == 0 {
			t.Errorf("client %d should have received match notification", i)
		}
	}
}

// Helper functions

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 ||
		(len(s) > 0 && len(substr) > 0 && findSubstring(s, substr)))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func generateTestPlayerID(index int) string {
	return "test-player-" + string(rune('A'+index))
}
