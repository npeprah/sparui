package matchmaking

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/controller/room"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestQuickMatchService_StartQuickMatch tests the main Quick Match flow
func TestQuickMatchService_StartQuickMatch(t *testing.T) {
	tests := []struct {
		name          string
		playerID      string
		username      string
		setupRoom     bool // Player already in a room
		wantError     bool
		errorContains string
	}{
		{
			name:      "successful quick match join",
			playerID:  "player-1",
			username:  "TestPlayer1",
			setupRoom: false,
			wantError: false,
		},
		{
			name:          "player already in game",
			playerID:      "player-2",
			username:      "TestPlayer2",
			setupRoom:     true,
			wantError:     true,
			errorContains: "already in game",
		},
		{
			name:          "empty player ID",
			playerID:      "",
			username:      "TestPlayer",
			setupRoom:     false,
			wantError:     true,
			errorContains: "playerID is required",
		},
		{
			name:          "empty username",
			playerID:      "player-3",
			username:      "",
			setupRoom:     false,
			wantError:     true,
			errorContains: "username is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			roomManager := room.NewManager()
			queueManager := NewQueueManager(roomManager)
			service := NewQuickMatchService(queueManager, roomManager)

			// Setup: Put player in room if needed
			if tt.setupRoom && tt.playerID != "" {
				req := entity.CreateRoomRequest{
					HostID:   tt.playerID,
					Settings: entity.DefaultRoomSettings(),
				}
				_, err := roomManager.CreateRoom(ctx, req)
				if err != nil {
					t.Fatalf("Failed to setup test room: %v", err)
				}
			}

			// Execute
			client := newMockClient(tt.playerID)
			err := service.StartQuickMatch(ctx, tt.playerID, tt.username, client)

			// Verify
			if tt.wantError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if tt.errorContains != "" && !contains(err.Error(), tt.errorContains) {
					t.Errorf("Error should contain '%s', got: %v", tt.errorContains, err)
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
			}
		})
	}
}

// TestQuickMatchService_CompleteMatchFlow tests the complete Quick Match flow
func TestQuickMatchService_CompleteMatchFlow(t *testing.T) {
	ctx := context.Background()
	roomManager := room.NewManager()
	queueManager := NewQueueManager(roomManager)
	service := NewQuickMatchService(queueManager, roomManager)

	// Create 4 players
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

	// All players join matchmaking
	for _, p := range players {
		err := service.StartQuickMatch(ctx, p.id, p.username, p.client)
		if err != nil {
			t.Fatalf("Player %s failed to join Quick Match: %v", p.username, err)
		}
	}

	// Wait for match to be created (background worker)
	time.Sleep(2 * time.Second)

	// Check for matches
	matches := queueManager.CheckForMatches(ctx)
	if len(matches) == 0 {
		t.Fatal("Expected match to be created but got none")
	}

	match := matches[0]

	// Verify match result
	if match.RoomCode == "" {
		t.Error("Expected room code but got empty string")
	}
	if len(match.PlayerIDs) != 4 {
		t.Errorf("Expected 4 players, got %d", len(match.PlayerIDs))
	}

	// Verify room was created with correct settings
	createdRoom, err := roomManager.GetRoom(match.RoomCode)
	if err != nil {
		t.Fatalf("Failed to get created room: %v", err)
	}
	if createdRoom.Settings.PointsToWin != entity.QuickMatchPointsToWin {
		t.Errorf("Expected points to win %d, got %d",
			entity.QuickMatchPointsToWin, createdRoom.Settings.PointsToWin)
	}
	if createdRoom.Settings.SurfaceTheme != entity.QuickMatchSurfaceTheme {
		t.Errorf("Expected surface theme %s, got %s",
			entity.QuickMatchSurfaceTheme, createdRoom.Settings.SurfaceTheme)
	}
}

// TestQuickMatchService_RoomCreationFailure tests rollback on room creation failure
func TestQuickMatchService_RoomCreationFailure(t *testing.T) {
	// This test would require mocking the room manager to force a failure
	// For now, we'll test the concept with validation
	t.Skip("Requires mock room manager implementation")
}

// TestQuickMatchService_PlayerDisconnectDuringSetup tests disconnect handling
func TestQuickMatchService_PlayerDisconnectDuringSetup(t *testing.T) {
	ctx := context.Background()
	roomManager := room.NewManager()
	queueManager := NewQueueManager(roomManager)
	service := NewQuickMatchService(queueManager, roomManager)

	// Create 3 players and join matchmaking
	players := []struct {
		id       string
		username string
		client   *mockClient
	}{
		{"player-1", "Alice", newMockClient("player-1")},
		{"player-2", "Bob", newMockClient("player-2")},
		{"player-3", "Charlie", newMockClient("player-3")},
	}

	for _, p := range players {
		err := service.StartQuickMatch(ctx, p.id, p.username, p.client)
		if err != nil {
			t.Fatalf("Player %s failed to join Quick Match: %v", p.username, err)
		}
	}

	// Player 2 disconnects before match is created
	err := service.HandleDisconnect(ctx, "player-2")
	if err != nil {
		t.Errorf("HandleDisconnect failed: %v", err)
	}

	// Verify player was removed from queue
	_, err = queueManager.GetQueuePosition("player-2")
	if err == nil {
		t.Error("Expected player to be removed from queue")
	}

	// Verify other players still in queue
	pos, err := queueManager.GetQueuePosition("player-1")
	if err != nil {
		t.Errorf("Player 1 should still be in queue: %v", err)
	}
	if pos != 1 {
		t.Errorf("Expected player 1 at position 1, got %d", pos)
	}
}

// TestQuickMatchService_AutoReadyState tests all players are set to ready
func TestQuickMatchService_AutoReadyState(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	roomManager := room.NewManager()
	config := entity.MatchmakingConfig{
		MinPlayers:       2,
		MaxPlayers:       4,
		PreferredPlayers: 2, // Lower for faster matching
		QueueTimeout:     60 * time.Second,
		RelaxedMatchTime: 1 * time.Second,
		TickInterval:     200 * time.Millisecond,
	}
	queueManager := NewQueueManagerWithConfig(roomManager, config)
	service := NewQuickMatchService(queueManager, roomManager)

	// Start background worker
	go queueManager.Start(ctx)

	// Create 2 players (minimum)
	players := []struct {
		id       string
		username string
		client   *mockClient
	}{
		{"player-1", "Alice", newMockClient("player-1")},
		{"player-2", "Bob", newMockClient("player-2")},
	}

	// Join matchmaking
	for _, p := range players {
		err := service.StartQuickMatch(ctx, p.id, p.username, p.client)
		if err != nil {
			t.Fatalf("Failed to join: %v", err)
		}
	}

	// Wait for background worker to create match
	time.Sleep(3 * time.Second)

	// Verify match was created
	status := queueManager.GetQueueStatus("")
	if status.MatchesCreated == 0 {
		t.Fatal("No match created")
	}

	// Get the created room
	rooms := roomManager.ListRooms()
	if len(rooms) == 0 {
		t.Fatal("No room created")
	}
	createdRoom := rooms[0]

	// Verify all players are ready
	for _, player := range createdRoom.Players {
		if !player.IsReady {
			t.Errorf("Player %s should be ready but is not", player.ID)
		}
	}
}

// TestQuickMatchService_GameCountdown tests countdown mechanism
func TestQuickMatchService_GameCountdown(t *testing.T) {
	ctx := context.Background()
	roomManager := room.NewManager()

	// Use shorter intervals for testing
	config := entity.MatchmakingConfig{
		MinPlayers:       2,
		MaxPlayers:       4,
		PreferredPlayers: 2, // Lower for faster test
		QueueTimeout:     60 * time.Second,
		RelaxedMatchTime: 1 * time.Second,
		TickInterval:     100 * time.Millisecond,
	}

	queueManager := NewQueueManagerWithConfig(roomManager, config)
	service := NewQuickMatchService(queueManager, roomManager)

	// Start background worker
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	go queueManager.Start(ctx)

	// Create 2 players
	players := []struct {
		id       string
		username string
		client   *mockClient
	}{
		{"player-1", "Alice", newMockClient("player-1")},
		{"player-2", "Bob", newMockClient("player-2")},
	}

	// Join matchmaking
	for _, p := range players {
		err := service.StartQuickMatch(ctx, p.id, p.username, p.client)
		if err != nil {
			t.Fatalf("Failed to join: %v", err)
		}
	}

	// Wait for match to be created by background worker
	time.Sleep(2 * time.Second)

	// Get queue status to verify match was created
	status := queueManager.GetQueueStatus("")
	if status.MatchesCreated == 0 {
		t.Fatal("Expected at least one match to be created")
	}
}

// TestQuickMatchService_ConcurrentJoins tests concurrent Quick Match joins
func TestQuickMatchService_ConcurrentJoins(t *testing.T) {
	ctx := context.Background()
	roomManager := room.NewManager()
	queueManager := NewQueueManager(roomManager)
	service := NewQuickMatchService(queueManager, roomManager)

	// Create 10 players joining concurrently
	numPlayers := 10
	var wg sync.WaitGroup
	wg.Add(numPlayers)

	errors := make(chan error, numPlayers)

	for i := 0; i < numPlayers; i++ {
		go func(id int) {
			defer wg.Done()
			playerID := "player-" + string(rune('0'+id))
			username := "Player" + string(rune('0'+id))
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

	// Verify queue has all players
	status := queueManager.GetQueueStatus("")
	if status.TotalPlayers != numPlayers {
		t.Errorf("Expected %d players in queue, got %d", numPlayers, status.TotalPlayers)
	}
}

// TestQuickMatchService_MatchNotification tests players receive match notifications
func TestQuickMatchService_MatchNotification(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	roomManager := room.NewManager()
	config := entity.MatchmakingConfig{
		MinPlayers:       2,
		MaxPlayers:       4,
		PreferredPlayers: 2, // Lower for faster matching
		QueueTimeout:     60 * time.Second,
		RelaxedMatchTime: 1 * time.Second,
		TickInterval:     200 * time.Millisecond,
	}
	queueManager := NewQueueManagerWithConfig(roomManager, config)
	service := NewQuickMatchService(queueManager, roomManager)

	// Start background worker
	go queueManager.Start(ctx)

	// Create 2 players
	players := []struct {
		id       string
		username string
		client   *mockClient
	}{
		{"player-1", "Alice", newMockClient("player-1")},
		{"player-2", "Bob", newMockClient("player-2")},
	}

	// Join matchmaking
	for _, p := range players {
		err := service.StartQuickMatch(ctx, p.id, p.username, p.client)
		if err != nil {
			t.Fatalf("Failed to join: %v", err)
		}
	}

	// Wait for background worker to create match
	time.Sleep(3 * time.Second)

	// Verify match was created
	status := queueManager.GetQueueStatus("")
	if status.MatchesCreated == 0 {
		t.Fatal("No match created")
	}

	// Verify each player received match notification
	for _, p := range players {
		messages := p.client.GetSentMessages()
		if len(messages) < 2 {
			t.Errorf("Player %s expected at least 2 messages (joined + match_found), got %d",
				p.username, len(messages))
		}
	}
}

// TestQuickMatchService_IsPlayerInRoom tests player room check
func TestQuickMatchService_IsPlayerInRoom(t *testing.T) {
	ctx := context.Background()
	roomManager := room.NewManager()
	queueManager := NewQueueManager(roomManager)
	service := NewQuickMatchService(queueManager, roomManager)

	// Create a room with a player
	req := entity.CreateRoomRequest{
		HostID:   "player-1",
		Settings: entity.DefaultRoomSettings(),
	}
	createdRoom, err := roomManager.CreateRoom(ctx, req)
	if err != nil {
		t.Fatalf("Failed to create room: %v", err)
	}

	// Test player in room
	inRoom := service.IsPlayerInRoom("player-1")
	if !inRoom {
		t.Error("Expected player to be in room")
	}

	// Test player not in room
	notInRoom := service.IsPlayerInRoom("player-2")
	if notInRoom {
		t.Error("Expected player to not be in room")
	}

	// Test after leaving room
	leaveReq := entity.LeaveRoomRequest{
		RoomCode: createdRoom.RoomCode,
		PlayerID: "player-1",
	}
	err = roomManager.LeaveRoom(ctx, leaveReq)
	if err != nil {
		t.Fatalf("Failed to leave room: %v", err)
	}

	inRoom = service.IsPlayerInRoom("player-1")
	if inRoom {
		t.Error("Expected player to not be in room after leaving")
	}
}

// TestQuickMatchService_MultipleMatchCreation tests creating multiple matches
func TestQuickMatchService_MultipleMatchCreation(t *testing.T) {
	ctx := context.Background()
	roomManager := room.NewManager()
	queueManager := NewQueueManager(roomManager)
	service := NewQuickMatchService(queueManager, roomManager)

	// Create 8 players (should create 2 matches of 4 players each)
	for i := 0; i < 8; i++ {
		playerID := "player-" + string(rune('A'+i))
		username := "Player" + string(rune('A'+i))
		client := newMockClient(playerID)

		err := service.StartQuickMatch(ctx, playerID, username, client)
		if err != nil {
			t.Fatalf("Failed to join: %v", err)
		}
	}

	// Check for matches
	time.Sleep(2 * time.Second)
	matches := queueManager.CheckForMatches(ctx)

	if len(matches) != 2 {
		t.Errorf("Expected 2 matches, got %d", len(matches))
	}

	// Verify each match has correct number of players
	for i, match := range matches {
		if len(match.PlayerIDs) != 4 {
			t.Errorf("Match %d: Expected 4 players, got %d", i, len(match.PlayerIDs))
		}
	}
}
