package matchmaking

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/controller/room"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestQuickMatchE2E tests the complete Quick Match flow end-to-end
func TestQuickMatchE2E(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Setup: Create room manager and queue with fast intervals for testing
	roomManager := room.NewManager()
	config := entity.MatchmakingConfig{
		MinPlayers:       2,
		MaxPlayers:       4,
		PreferredPlayers: 4,
		QueueTimeout:     60 * time.Second,
		RelaxedMatchTime: 2 * time.Second, // Fast matching for test
		TickInterval:     200 * time.Millisecond,
	}
	queueManager := NewQueueManagerWithConfig(roomManager, config)
	service := NewQuickMatchService(queueManager, roomManager)

	// Start background matchmaking worker
	go queueManager.Start(ctx)

	// Step 1: Create 4 mock clients
	players := []struct {
		id       string
		username string
		client   *mockClient
	}{
		{"player-1", "Alice", newMockClient("player-1")},
		{"player-2", "Bob", newMockClient("player-2")},
		{"player-3", "Charlie", newMockClient("player-3")},
		{"player-4", "Diana", newMockClient("player-4")},
	}

	// Step 2: All players join matchmaking queue
	t.Log("Step 1: Players joining Quick Match queue")
	for _, p := range players {
		err := service.StartQuickMatch(ctx, p.id, p.username, p.client)
		if err != nil {
			t.Fatalf("Player %s failed to join Quick Match: %v", p.username, err)
		}
		t.Logf("  - %s joined queue", p.username)
	}

	// Step 3: Wait for match to be created by background worker
	t.Log("Step 2: Waiting for matchmaking to create match...")
	time.Sleep(3 * time.Second)

	// Step 4: Verify match was created
	t.Log("Step 3: Verifying match was created")
	status := queueManager.GetQueueStatus("")
	if status.MatchesCreated == 0 {
		t.Fatal("Expected at least one match to be created")
	}
	t.Logf("  - Matches created: %d", status.MatchesCreated)

	// Step 5: Verify queue is now empty
	if status.TotalPlayers != 0 {
		t.Errorf("Expected queue to be empty after match, got %d players", status.TotalPlayers)
	}

	// Step 6: Verify room was created
	t.Log("Step 4: Verifying room exists with correct settings")
	rooms := roomManager.ListRooms()
	if len(rooms) == 0 {
		t.Fatal("Expected room to be created")
	}

	createdRoom := rooms[0]
	t.Logf("  - Room code: %s", createdRoom.RoomCode)

	// Step 7: Verify room has Quick Match settings
	if createdRoom.Settings.PointsToWin != entity.QuickMatchPointsToWin {
		t.Errorf("Expected points to win %d, got %d",
			entity.QuickMatchPointsToWin, createdRoom.Settings.PointsToWin)
	}
	if createdRoom.Settings.SurfaceTheme != entity.QuickMatchSurfaceTheme {
		t.Errorf("Expected surface theme %s, got %s",
			entity.QuickMatchSurfaceTheme, createdRoom.Settings.SurfaceTheme)
	}
	t.Logf("  - Points to win: %d", createdRoom.Settings.PointsToWin)
	t.Logf("  - Surface theme: %s", createdRoom.Settings.SurfaceTheme)

	// Step 8: Verify all 4 players are in room
	t.Log("Step 5: Verifying all players joined room")
	if len(createdRoom.Players) != 4 {
		t.Errorf("Expected 4 players in room, got %d", len(createdRoom.Players))
	}
	for _, player := range createdRoom.Players {
		t.Logf("  - Player: %s (ready: %v)", player.Username, player.IsReady)
	}

	// Step 9: Verify all players are ready
	t.Log("Step 6: Verifying all players are ready")
	allReady := true
	for _, player := range createdRoom.Players {
		if !player.IsReady {
			t.Errorf("Player %s should be ready but is not", player.Username)
			allReady = false
		}
	}
	if allReady {
		t.Log("  - All players are ready ✓")
	}

	// Step 10: Verify players received match notifications
	t.Log("Step 7: Verifying players received notifications")
	time.Sleep(500 * time.Millisecond) // Allow time for async notifications
	for _, p := range players {
		messages := p.client.GetSentMessages()
		if len(messages) < 2 {
			t.Errorf("Player %s expected at least 2 messages (joined + match_found), got %d",
				p.username, len(messages))
		} else {
			t.Logf("  - %s received %d messages", p.username, len(messages))
		}
	}

	// Step 11: Wait for countdown and verify game starts
	t.Log("Step 8: Waiting for game countdown...")
	time.Sleep(entity.QuickMatchCountdown + 1*time.Second)

	// Step 12: Verify game status is in_progress
	t.Log("Step 9: Verifying game started")
	updatedRoom, err := roomManager.GetRoom(createdRoom.RoomCode)
	if err != nil {
		t.Fatalf("Failed to get room: %v", err)
	}

	if updatedRoom.Status != entity.StatusInProgress {
		t.Errorf("Expected game status to be in_progress, got %s", updatedRoom.Status)
	} else {
		t.Log("  - Game started automatically ✓")
	}

	if updatedRoom.StartedAt == nil {
		t.Error("Expected StartedAt to be set")
	} else {
		t.Logf("  - Game started at: %v", updatedRoom.StartedAt)
	}

	t.Log("\n✓ End-to-end Quick Match test completed successfully!")
}

// TestQuickMatchE2E_MultipleMatches tests creating multiple matches simultaneously
func TestQuickMatchE2E_MultipleMatches(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Setup
	roomManager := room.NewManager()
	config := entity.MatchmakingConfig{
		MinPlayers:       2,
		MaxPlayers:       4,
		PreferredPlayers: 4,
		QueueTimeout:     60 * time.Second,
		RelaxedMatchTime: 1 * time.Second,
		TickInterval:     200 * time.Millisecond,
	}
	queueManager := NewQueueManagerWithConfig(roomManager, config)
	service := NewQuickMatchService(queueManager, roomManager)

	// Start background worker
	go queueManager.Start(ctx)

	// Create 8 players (should create 2 matches)
	numPlayers := 8
	players := make([]struct {
		id       string
		username string
		client   *mockClient
	}, numPlayers)

	for i := 0; i < numPlayers; i++ {
		playerID := "player-" + string(rune('A'+i))
		username := "Player" + string(rune('A'+i))
		players[i].id = playerID
		players[i].username = username
		players[i].client = newMockClient(playerID)
	}

	// All join simultaneously
	t.Log("Players joining Quick Match...")
	for _, p := range players {
		err := service.StartQuickMatch(ctx, p.id, p.username, p.client)
		if err != nil {
			t.Fatalf("Failed to join: %v", err)
		}
	}

	// Wait for matches
	time.Sleep(3 * time.Second)

	// Verify 2 matches created
	status := queueManager.GetQueueStatus("")
	if status.MatchesCreated < 2 {
		t.Errorf("Expected at least 2 matches, got %d", status.MatchesCreated)
	}

	// Verify 2 rooms created
	rooms := roomManager.ListRooms()
	if len(rooms) != 2 {
		t.Errorf("Expected 2 rooms, got %d", len(rooms))
	}

	// Verify each room has 4 players
	for i, room := range rooms {
		if len(room.Players) != 4 {
			t.Errorf("Room %d: Expected 4 players, got %d", i+1, len(room.Players))
		}
	}

	t.Log("✓ Multiple matches test completed successfully!")
}

// TestQuickMatchE2E_RelaxedMatching tests matching with fewer than preferred players
func TestQuickMatchE2E_RelaxedMatching(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Setup with fast relaxed matching
	roomManager := room.NewManager()
	config := entity.MatchmakingConfig{
		MinPlayers:       2,
		MaxPlayers:       4,
		PreferredPlayers: 4,
		QueueTimeout:     60 * time.Second,
		RelaxedMatchTime: 1 * time.Second, // Fast relaxed matching
		TickInterval:     200 * time.Millisecond,
	}
	queueManager := NewQueueManagerWithConfig(roomManager, config)
	service := NewQuickMatchService(queueManager, roomManager)

	// Start background worker
	go queueManager.Start(ctx)

	// Only 2 players join (less than preferred 4)
	players := []struct {
		id       string
		username string
		client   *mockClient
	}{
		{"player-1", "Alice", newMockClient("player-1")},
		{"player-2", "Bob", newMockClient("player-2")},
	}

	t.Log("2 players joining Quick Match (relaxed matching test)...")
	for _, p := range players {
		err := service.StartQuickMatch(ctx, p.id, p.username, p.client)
		if err != nil {
			t.Fatalf("Failed to join: %v", err)
		}
	}

	// Wait for relaxed matching to kick in
	time.Sleep(3 * time.Second)

	// Verify match was created despite having fewer than preferred players
	status := queueManager.GetQueueStatus("")
	if status.MatchesCreated == 0 {
		t.Fatal("Expected match to be created via relaxed matching")
	}

	// Verify room has 2 players
	rooms := roomManager.ListRooms()
	if len(rooms) == 0 {
		t.Fatal("Expected room to be created")
	}

	if len(rooms[0].Players) != 2 {
		t.Errorf("Expected 2 players in room, got %d", len(rooms[0].Players))
	}

	t.Log("✓ Relaxed matching test completed successfully!")
}

// TestQuickMatchE2E_ConcurrentJoins tests thread safety with concurrent joins
func TestQuickMatchE2E_ConcurrentJoins(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Setup
	roomManager := room.NewManager()
	config := entity.MatchmakingConfig{
		MinPlayers:       2,
		MaxPlayers:       4,
		PreferredPlayers: 4,
		QueueTimeout:     60 * time.Second,
		RelaxedMatchTime: 2 * time.Second,
		TickInterval:     200 * time.Millisecond,
	}
	queueManager := NewQueueManagerWithConfig(roomManager, config)
	service := NewQuickMatchService(queueManager, roomManager)

	// Start background worker
	go queueManager.Start(ctx)

	// Create 20 players joining concurrently
	numPlayers := 20
	var wg sync.WaitGroup
	wg.Add(numPlayers)

	errors := make(chan error, numPlayers)

	t.Log("20 players joining concurrently...")
	for i := 0; i < numPlayers; i++ {
		go func(id int) {
			defer wg.Done()
			playerID := "player-" + string(rune('A'+id))
			username := "Player" + string(rune('A'+id))
			client := newMockClient(playerID)
			err := service.StartQuickMatch(ctx, playerID, username, client)
			if err != nil {
				errors <- err
			}
		}(i)
	}

	wg.Wait()
	close(errors)

	// Check for errors
	for err := range errors {
		t.Errorf("Concurrent join failed: %v", err)
	}

	// Wait for matches to be created
	time.Sleep(5 * time.Second)

	// Verify multiple matches created
	status := queueManager.GetQueueStatus("")
	if status.MatchesCreated == 0 {
		t.Fatal("Expected matches to be created")
	}

	t.Logf("Created %d matches from 20 concurrent joins", status.MatchesCreated)
	t.Log("✓ Concurrent joins test completed successfully!")
}

// TestQuickMatchE2E_Disconnect tests handling player disconnect
func TestQuickMatchE2E_Disconnect(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Setup
	roomManager := room.NewManager()
	queueManager := NewQueueManager(roomManager)
	service := NewQuickMatchService(queueManager, roomManager)

	// 3 players join
	players := []struct {
		id       string
		username string
		client   *mockClient
	}{
		{"player-1", "Alice", newMockClient("player-1")},
		{"player-2", "Bob", newMockClient("player-2")},
		{"player-3", "Charlie", newMockClient("player-3")},
	}

	t.Log("3 players joining Quick Match...")
	for _, p := range players {
		err := service.StartQuickMatch(ctx, p.id, p.username, p.client)
		if err != nil {
			t.Fatalf("Failed to join: %v", err)
		}
	}

	// Player 2 disconnects before match is created
	t.Log("Player Bob disconnects...")
	err := service.HandleDisconnect(ctx, "player-2")
	if err != nil {
		t.Errorf("HandleDisconnect failed: %v", err)
	}

	// Verify player 2 was removed
	_, err = queueManager.GetQueuePosition("player-2")
	if err == nil {
		t.Error("Expected player-2 to be removed from queue")
	}

	// Verify other players still in queue
	pos, err := queueManager.GetQueuePosition("player-1")
	if err != nil {
		t.Errorf("Player-1 should still be in queue: %v", err)
	}
	if pos != 1 {
		t.Errorf("Expected player-1 at position 1, got %d", pos)
	}

	pos, err = queueManager.GetQueuePosition("player-3")
	if err != nil {
		t.Errorf("Player-3 should still be in queue: %v", err)
	}
	if pos != 2 {
		t.Errorf("Expected player-3 at position 2, got %d", pos)
	}

	t.Log("✓ Disconnect handling test completed successfully!")
}
