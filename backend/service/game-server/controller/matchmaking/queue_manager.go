package matchmaking

import (
	"context"
	"crypto/rand"
	"fmt"
	"log/slog"
	"math/big"
	"sync"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/controller/room"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// ClientConnection defines the interface for WebSocket client connections
type ClientConnection interface {
	SendJSON(data interface{}) error
}

// QueueManager manages the matchmaking queue
type QueueManager struct {
	entries      []*entity.QueueEntry
	mu           sync.RWMutex
	roomManager  *room.Manager
	config       entity.MatchmakingConfig
	matchCounter int // Statistics: total matches created
}

// NewQueueManager creates a new queue manager with default configuration
func NewQueueManager(roomManager *room.Manager) *QueueManager {
	return NewQueueManagerWithConfig(roomManager, entity.DefaultMatchmakingConfig())
}

// NewQueueManagerWithConfig creates a new queue manager with custom configuration
func NewQueueManagerWithConfig(roomManager *room.Manager, config entity.MatchmakingConfig) *QueueManager {
	return &QueueManager{
		entries:      make([]*entity.QueueEntry, 0),
		roomManager:  roomManager,
		config:       config,
		matchCounter: 0,
	}
}

// JoinQueue adds a player to the matchmaking queue
func (q *QueueManager) JoinQueue(playerID, username string, conn ClientConnection) error {
	if playerID == "" {
		return fmt.Errorf("playerID is required")
	}
	if username == "" {
		return fmt.Errorf("username is required")
	}

	q.mu.Lock()

	// Check if player is already in queue
	for _, entry := range q.entries {
		if entry.PlayerID == playerID {
			q.mu.Unlock()
			return fmt.Errorf("player %s is already in queue", playerID)
		}
	}

	// Create queue entry
	now := time.Now()
	entry := &entity.QueueEntry{
		PlayerID:   playerID,
		Username:   username,
		JoinedAt:   now,
		TimeoutAt:  now.Add(q.config.QueueTimeout),
		Connection: conn,
	}

	q.entries = append(q.entries, entry)

	queuePosition := len(q.entries)
	totalPlayers := len(q.entries)

	slog.Info("Player joined matchmaking queue",
		"playerId", playerID,
		"username", username,
		"queuePosition", queuePosition,
		"totalInQueue", totalPlayers)

	// Release lock before sending notification to avoid deadlock
	q.mu.Unlock()

	// Send confirmation to player
	if conn != nil {
		q.sendJoinConfirmationWithPosition(entry, queuePosition, totalPlayers)
	}

	return nil
}

// LeaveQueue removes a player from the matchmaking queue
func (q *QueueManager) LeaveQueue(playerID string) error {
	q.mu.Lock()

	// Find and remove player
	var removedEntry *entity.QueueEntry
	for i, entry := range q.entries {
		if entry.PlayerID == playerID {
			// Remove from queue
			removedEntry = entry
			q.entries = append(q.entries[:i], q.entries[i+1:]...)

			slog.Info("Player left matchmaking queue",
				"playerId", playerID,
				"remainingInQueue", len(q.entries))

			break
		}
	}

	q.mu.Unlock()

	if removedEntry == nil {
		return fmt.Errorf("player %s is not in queue", playerID)
	}

	// Send confirmation after releasing lock
	if removedEntry.Connection != nil {
		q.sendLeaveConfirmation(removedEntry)
	}

	return nil
}

// GetQueuePosition returns the position of a player in the queue (1-indexed)
func (q *QueueManager) GetQueuePosition(playerID string) (int, error) {
	q.mu.RLock()
	defer q.mu.RUnlock()

	for i, entry := range q.entries {
		if entry.PlayerID == playerID {
			return i + 1, nil
		}
	}

	return 0, fmt.Errorf("player %s is not in queue", playerID)
}

// GetQueueStatus returns the current queue status
// If playerID is provided, includes that player's position
func (q *QueueManager) GetQueueStatus(playerID string) entity.QueueStatus {
	q.mu.RLock()
	defer q.mu.RUnlock()

	status := entity.QueueStatus{
		TotalPlayers:      len(q.entries),
		EstimatedWaitTime: q.calculateEstimatedWaitTime(),
		YourPosition:      0,
		MatchesCreated:    q.matchCounter,
	}

	// Find player's position if specified
	if playerID != "" {
		for i, entry := range q.entries {
			if entry.PlayerID == playerID {
				status.YourPosition = i + 1
				break
			}
		}
	}

	return status
}

// CheckForMatches checks if there are enough players to create a match
// Returns a list of created matches
func (q *QueueManager) CheckForMatches(ctx context.Context) []*entity.MatchResult {
	q.mu.Lock()
	defer q.mu.Unlock()

	matches := make([]*entity.MatchResult, 0)

	// Continue creating matches while we have enough players
	for {
		match := q.tryCreateMatch(ctx)
		if match == nil {
			break
		}
		matches = append(matches, match)
	}

	return matches
}

// tryCreateMatch attempts to create a single match from the queue
// Must be called with lock held
func (q *QueueManager) tryCreateMatch(ctx context.Context) *entity.MatchResult {
	if len(q.entries) == 0 {
		return nil
	}

	// Check if we have preferred number of players (4)
	if len(q.entries) >= q.config.PreferredPlayers {
		return q.createMatchWithPlayers(ctx, q.config.PreferredPlayers)
	}

	// Relaxed matching: Check if oldest player has waited long enough
	// and we have at least minimum players
	if len(q.entries) >= q.config.MinPlayers {
		oldestEntry := q.entries[0]
		waitTime := time.Since(oldestEntry.JoinedAt)

		if waitTime >= q.config.RelaxedMatchTime {
			// Create match with available players (up to max)
			numPlayers := len(q.entries)
			if numPlayers > q.config.MaxPlayers {
				numPlayers = q.config.MaxPlayers
			}
			return q.createMatchWithPlayers(ctx, numPlayers)
		}
	}

	return nil
}

// createMatchWithPlayers creates a match with the specified number of players
// Must be called with lock held
func (q *QueueManager) createMatchWithPlayers(ctx context.Context, numPlayers int) *entity.MatchResult {
	if len(q.entries) < numPlayers {
		return nil
	}

	// Take first N players from queue
	matchedEntries := q.entries[:numPlayers]
	q.entries = q.entries[numPlayers:]

	// Create room for matched players
	match, err := q.createRoom(ctx, matchedEntries)
	if err != nil {
		slog.Error("Failed to create room for match", "error", err)
		// Re-add players to front of queue if room creation fails
		q.entries = append(matchedEntries, q.entries...)
		return nil
	}

	// Update statistics
	q.matchCounter++

	slog.Info("Match created",
		"matchId", match.MatchID,
		"roomCode", match.RoomCode,
		"numPlayers", len(match.PlayerIDs),
		"remainingInQueue", len(q.entries))

	// Send match notifications asynchronously to avoid blocking
	go q.notifyMatchedPlayers(match, matchedEntries)

	return match
}

// createRoom creates a game room for matched players with Quick Match settings
func (q *QueueManager) createRoom(ctx context.Context, entries []*entity.QueueEntry) (*entity.MatchResult, error) {
	if len(entries) == 0 {
		return nil, fmt.Errorf("no players to create room")
	}

	// Use first player as host
	hostEntry := entries[0]

	// Create room with Quick Match settings
	req := entity.CreateRoomRequest{
		HostID:   hostEntry.PlayerID,
		Settings: entity.QuickMatchSettings(),
	}

	room, err := q.roomManager.CreateRoom(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to create room: %w", err)
	}

	// Add remaining players to room
	for i := 1; i < len(entries); i++ {
		joinReq := entity.JoinRoomRequest{
			RoomCode: room.RoomCode,
			PlayerID: entries[i].PlayerID,
		}

		// Create minimal user info for joining room
		playerInfo := entity.User{
			ID:       entries[i].PlayerID,
			Username: entries[i].Username,
			Avatar:   "default-avatar.png", // Default avatar for matchmaking
		}

		_, err := q.roomManager.JoinRoom(ctx, joinReq, playerInfo)
		if err != nil {
			slog.Error("Failed to add player to room",
				"playerId", entries[i].PlayerID,
				"roomCode", room.RoomCode,
				"error", err)
			// Rollback: remove room if player join fails
			// This ensures atomic match creation
			q.rollbackRoom(ctx, room.RoomCode)
			return nil, fmt.Errorf("failed to add player to room: %w", err)
		}
	}

	// Set all players to ready (Quick Match auto-ready feature)
	for _, entry := range entries {
		err := q.roomManager.SetPlayerReady(ctx, room.RoomCode, entry.PlayerID, true)
		if err != nil {
			slog.Error("Failed to set player ready",
				"playerId", entry.PlayerID,
				"roomCode", room.RoomCode,
				"error", err)
			// Continue even if setting ready fails - not critical for MVP
		}
	}

	// Create match result
	playerIDs := make([]string, len(entries))
	for i, entry := range entries {
		playerIDs[i] = entry.PlayerID
	}

	match := &entity.MatchResult{
		MatchID:   generateMatchID(),
		RoomCode:  room.RoomCode,
		Room:      room,
		PlayerIDs: playerIDs,
		CreatedAt: time.Now(),
	}

	// Start game countdown asynchronously
	go q.startGameCountdown(ctx, room.RoomCode, entity.QuickMatchCountdown)

	return match, nil
}

// rollbackRoom removes a room if match creation fails
func (q *QueueManager) rollbackRoom(ctx context.Context, roomCode string) {
	room, err := q.roomManager.GetRoom(roomCode)
	if err != nil {
		return
	}

	// Remove all players
	for _, player := range room.Players {
		leaveReq := entity.LeaveRoomRequest{
			RoomCode: roomCode,
			PlayerID: player.ID,
		}
		q.roomManager.LeaveRoom(ctx, leaveReq)
	}

	slog.Info("Rolled back room creation", "roomCode", roomCode)
}

// startGameCountdown starts the countdown before automatically starting the game
func (q *QueueManager) startGameCountdown(ctx context.Context, roomCode string, duration time.Duration) {
	slog.Info("Starting Quick Match game countdown",
		"roomCode", roomCode,
		"duration", duration)

	// Wait for countdown
	select {
	case <-time.After(duration):
		// Countdown complete
	case <-ctx.Done():
		slog.Info("Game countdown cancelled", "roomCode", roomCode)
		return
	}

	// Verify room still exists and all players are ready
	if !q.roomManager.AllPlayersReady(roomCode) {
		slog.Warn("Not all players ready, cancelling game start", "roomCode", roomCode)
		return
	}

	// Start the game
	err := q.roomManager.StartGame(ctx, roomCode)
	if err != nil {
		slog.Error("Failed to start game after countdown",
			"roomCode", roomCode,
			"error", err)
		return
	}

	slog.Info("Quick Match game started automatically",
		"roomCode", roomCode)
}

// RemoveTimedOutPlayers removes players who have exceeded the queue timeout
// Returns the list of removed player IDs
func (q *QueueManager) RemoveTimedOutPlayers(ctx context.Context) []string {
	q.mu.Lock()
	defer q.mu.Unlock()

	now := time.Now()
	removed := make([]string, 0)
	remaining := make([]*entity.QueueEntry, 0, len(q.entries))

	for _, entry := range q.entries {
		if now.After(entry.TimeoutAt) {
			removed = append(removed, entry.PlayerID)
			// Send timeout notification
			if entry.Connection != nil {
				go q.sendTimeoutNotification(entry)
			}
			slog.Info("Player removed from queue due to timeout",
				"playerId", entry.PlayerID,
				"waitTime", now.Sub(entry.JoinedAt))
		} else {
			remaining = append(remaining, entry)
		}
	}

	q.entries = remaining

	return removed
}

// HandleDisconnect removes a player from the queue when they disconnect
func (q *QueueManager) HandleDisconnect(playerID string) error {
	slog.Info("Handling player disconnect from matchmaking queue", "playerId", playerID)
	return q.LeaveQueue(playerID)
}

// Start begins the background worker for matchmaking
func (q *QueueManager) Start(ctx context.Context) {
	ticker := time.NewTicker(q.config.TickInterval)
	defer ticker.Stop()

	slog.Info("Matchmaking queue manager started",
		"tickInterval", q.config.TickInterval,
		"queueTimeout", q.config.QueueTimeout,
		"minPlayers", q.config.MinPlayers,
		"maxPlayers", q.config.MaxPlayers,
		"preferredPlayers", q.config.PreferredPlayers)

	for {
		select {
		case <-ticker.C:
			// Check for matches
			matches := q.CheckForMatches(ctx)
			if len(matches) > 0 {
				slog.Info("Matches created in tick", "count", len(matches))
			}

			// Remove timed out players
			removed := q.RemoveTimedOutPlayers(ctx)
			if len(removed) > 0 {
				slog.Info("Players timed out and removed", "count", len(removed))
			}

			// Broadcast queue status to waiting players
			q.BroadcastQueueStatus()

		case <-ctx.Done():
			slog.Info("Matchmaking queue manager stopped")
			return
		}
	}
}

// BroadcastQueueStatus sends queue status updates to all waiting players
func (q *QueueManager) BroadcastQueueStatus() {
	q.mu.RLock()
	defer q.mu.RUnlock()

	for _, entry := range q.entries {
		if entry.Connection == nil {
			continue
		}

		status := entity.QueueStatus{
			TotalPlayers:      len(q.entries),
			EstimatedWaitTime: q.calculateEstimatedWaitTime(),
			YourPosition:      q.findPositionUnsafe(entry.PlayerID),
			MatchesCreated:    q.matchCounter,
		}

		conn, ok := entry.Connection.(ClientConnection)
		if ok {
			err := conn.SendJSON(map[string]interface{}{
				"event": "matchmaking:status_update",
				"data":  status,
			})
			if err != nil {
				slog.Error("Failed to send queue status update",
					"playerId", entry.PlayerID,
					"error", err)
			}
		}
	}
}

// calculateEstimatedWaitTime estimates wait time based on queue size
// Must be called with lock held (at least read lock)
func (q *QueueManager) calculateEstimatedWaitTime() int {
	if len(q.entries) == 0 {
		return 0
	}

	// Simple estimation: assume matches are created every 5 seconds on average
	// More sophisticated algorithms could use historical data
	matchesNeeded := (len(q.entries) + q.config.PreferredPlayers - 1) / q.config.PreferredPlayers
	return matchesNeeded * 5
}

// findPositionUnsafe finds player position without locking (unsafe - caller must hold lock)
func (q *QueueManager) findPositionUnsafe(playerID string) int {
	for i, entry := range q.entries {
		if entry.PlayerID == playerID {
			return i + 1
		}
	}
	return 0
}

// Notification helper methods

func (q *QueueManager) sendJoinConfirmation(entry *entity.QueueEntry) {
	conn, ok := entry.Connection.(ClientConnection)
	if !ok {
		return
	}

	status := q.GetQueueStatus(entry.PlayerID)
	err := conn.SendJSON(map[string]interface{}{
		"event": "matchmaking:joined",
		"data": map[string]interface{}{
			"playerId":          entry.PlayerID,
			"position":          status.YourPosition,
			"totalPlayers":      status.TotalPlayers,
			"estimatedWaitTime": status.EstimatedWaitTime,
			"message":           "Successfully joined matchmaking queue",
		},
	})
	if err != nil {
		slog.Error("Failed to send join confirmation", "playerId", entry.PlayerID, "error", err)
	}
}

func (q *QueueManager) sendJoinConfirmationWithPosition(entry *entity.QueueEntry, position, totalPlayers int) {
	conn, ok := entry.Connection.(ClientConnection)
	if !ok {
		return
	}

	// Simple estimation for wait time
	estimatedWaitTime := (totalPlayers + q.config.PreferredPlayers - 1) / q.config.PreferredPlayers * 5

	err := conn.SendJSON(map[string]interface{}{
		"event": "matchmaking:joined",
		"data": map[string]interface{}{
			"playerId":          entry.PlayerID,
			"position":          position,
			"totalPlayers":      totalPlayers,
			"estimatedWaitTime": estimatedWaitTime,
			"message":           "Successfully joined matchmaking queue",
		},
	})
	if err != nil {
		slog.Error("Failed to send join confirmation", "playerId", entry.PlayerID, "error", err)
	}
}

func (q *QueueManager) sendLeaveConfirmation(entry *entity.QueueEntry) {
	conn, ok := entry.Connection.(ClientConnection)
	if !ok {
		return
	}

	err := conn.SendJSON(map[string]interface{}{
		"event": "matchmaking:left",
		"data": map[string]interface{}{
			"playerId": entry.PlayerID,
			"message":  "Left matchmaking queue",
		},
	})
	if err != nil {
		slog.Error("Failed to send leave confirmation", "playerId", entry.PlayerID, "error", err)
	}
}

func (q *QueueManager) sendTimeoutNotification(entry *entity.QueueEntry) {
	conn, ok := entry.Connection.(ClientConnection)
	if !ok {
		return
	}

	err := conn.SendJSON(map[string]interface{}{
		"event": "matchmaking:timeout",
		"data": map[string]interface{}{
			"playerId": entry.PlayerID,
			"message":  "Matchmaking queue timeout - please try again",
			"waitTime": int(time.Since(entry.JoinedAt).Seconds()),
		},
	})
	if err != nil {
		slog.Error("Failed to send timeout notification", "playerId", entry.PlayerID, "error", err)
	}
}

func (q *QueueManager) notifyMatchedPlayers(match *entity.MatchResult, entries []*entity.QueueEntry) {
	for _, entry := range entries {
		conn, ok := entry.Connection.(ClientConnection)
		if !ok {
			continue
		}

		// Send match found notification
		err := conn.SendJSON(map[string]interface{}{
			"event": "matchmaking:match_found",
			"data": map[string]interface{}{
				"matchId":       match.MatchID,
				"roomCode":      match.RoomCode,
				"playerIds":     match.PlayerIDs,
				"numPlayers":    len(match.PlayerIDs),
				"countdownTime": int(entity.QuickMatchCountdown.Seconds()),
				"message":       "Match found! Joining game...",
			},
		})
		if err != nil {
			slog.Error("Failed to send match notification",
				"playerId", entry.PlayerID,
				"roomCode", match.RoomCode,
				"error", err)
			continue
		}

		// Send game redirect to move player to game room
		err = conn.SendJSON(map[string]interface{}{
			"event": "game:redirect",
			"data": map[string]interface{}{
				"roomCode":   match.RoomCode,
				"matchId":    match.MatchID,
				"autoStart":  true,
				"countdown":  int(entity.QuickMatchCountdown.Seconds()),
				"message":    "Redirecting to game room...",
				"redirectTo": "/game/" + match.RoomCode,
			},
		})
		if err != nil {
			slog.Error("Failed to send game redirect",
				"playerId", entry.PlayerID,
				"roomCode", match.RoomCode,
				"error", err)
		}
	}

	slog.Info("Notified all matched players",
		"matchId", match.MatchID,
		"roomCode", match.RoomCode,
		"numPlayers", len(entries))
}

// Utility functions

func generateMatchID() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const idLength = 12

	result := make([]byte, idLength)
	for i := range result {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		if err != nil {
			// Fallback to timestamp-based ID if random fails
			return fmt.Sprintf("MATCH-%d", time.Now().UnixNano())
		}
		result[i] = chars[n.Int64()]
	}

	return string(result)
}
