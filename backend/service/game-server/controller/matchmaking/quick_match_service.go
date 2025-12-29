package matchmaking

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/controller/room"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// QuickMatchService orchestrates the complete Quick Match flow
type QuickMatchService struct {
	queue          *QueueManager
	roomManager    *room.Manager
	activeMatches  map[string]*entity.QuickMatchResult // matchID -> result
	mu             sync.RWMutex
	onMatchCreated func(*entity.MatchResult) // Callback for match creation
}

// NewQuickMatchService creates a new Quick Match service
func NewQuickMatchService(queue *QueueManager, roomManager *room.Manager) *QuickMatchService {
	service := &QuickMatchService{
		queue:         queue,
		roomManager:   roomManager,
		activeMatches: make(map[string]*entity.QuickMatchResult),
	}

	// Set up callback for when matches are created
	service.onMatchCreated = service.handleMatchCreated

	return service
}

// StartQuickMatch initiates the Quick Match flow for a player
func (s *QuickMatchService) StartQuickMatch(ctx context.Context, playerID, username string, conn ClientConnection) error {
	if playerID == "" {
		return fmt.Errorf("playerID is required")
	}
	if username == "" {
		return fmt.Errorf("username is required")
	}

	// Validate player is not already in a game
	if s.IsPlayerInRoom(playerID) {
		return fmt.Errorf("player already in game")
	}

	// Join matchmaking queue
	err := s.queue.JoinQueue(playerID, username, conn)
	if err != nil {
		return fmt.Errorf("failed to join matchmaking queue: %w", err)
	}

	slog.Info("Player started Quick Match",
		"playerId", playerID,
		"username", username)

	return nil
}

// HandleDisconnect handles player disconnection during Quick Match
func (s *QuickMatchService) HandleDisconnect(ctx context.Context, playerID string) error {
	// Remove from matchmaking queue
	err := s.queue.LeaveQueue(playerID)
	if err != nil {
		// Player might not be in queue (already matched), that's okay
		slog.Debug("Player not in queue during disconnect", "playerId", playerID)
	}

	// Check if player is in any active Quick Match setup
	s.mu.RLock()
	var matchToCancel *entity.QuickMatchResult
	for _, match := range s.activeMatches {
		for _, pid := range match.PlayerIDs {
			if pid == playerID && !match.State.IsTerminal() {
				matchToCancel = match
				break
			}
		}
	}
	s.mu.RUnlock()

	if matchToCancel != nil {
		// Cancel the Quick Match setup
		s.mu.Lock()
		matchToCancel.State = entity.QuickMatchStateFailed
		matchToCancel.Error = "Player disconnected during setup"
		s.mu.Unlock()

		slog.Warn("Quick Match cancelled due to player disconnect",
			"matchId", matchToCancel.MatchID,
			"playerId", playerID)

		// TODO: In production, notify other players and potentially find replacement
	}

	return nil
}

// IsPlayerInRoom checks if a player is currently in any room
func (s *QuickMatchService) IsPlayerInRoom(playerID string) bool {
	rooms := s.roomManager.ListRooms()
	for _, r := range rooms {
		if r.HasPlayer(playerID) {
			return true
		}
	}
	return false
}

// handleMatchCreated is called when the queue manager creates a match
// This sets up the Quick Match room with all required configuration
func (s *QuickMatchService) handleMatchCreated(match *entity.MatchResult) {
	ctx := context.Background()

	slog.Info("Setting up Quick Match room",
		"matchId", match.MatchID,
		"roomCode", match.RoomCode,
		"numPlayers", len(match.PlayerIDs))

	// Create Quick Match result tracking
	quickMatch := &entity.QuickMatchResult{
		MatchID:       match.MatchID,
		RoomCode:      match.RoomCode,
		PlayerIDs:     match.PlayerIDs,
		State:         entity.QuickMatchStateJoining,
		CreatedAt:     time.Now(),
		CountdownTime: int(entity.QuickMatchCountdown.Seconds()),
	}

	// Store active match
	s.mu.Lock()
	s.activeMatches[match.MatchID] = quickMatch
	s.mu.Unlock()

	// Set all players to ready
	err := s.setAllPlayersReady(ctx, match.RoomCode, match.PlayerIDs)
	if err != nil {
		slog.Error("Failed to set players ready",
			"matchId", match.MatchID,
			"roomCode", match.RoomCode,
			"error", err)

		s.mu.Lock()
		quickMatch.State = entity.QuickMatchStateFailed
		quickMatch.Error = err.Error()
		s.mu.Unlock()
		return
	}

	// Update state to countdown
	s.mu.Lock()
	quickMatch.State = entity.QuickMatchStateCountdown
	s.mu.Unlock()

	// Start game countdown
	go s.startGameCountdown(ctx, match.RoomCode, match.MatchID, entity.QuickMatchCountdown)

	slog.Info("Quick Match room setup complete",
		"matchId", match.MatchID,
		"roomCode", match.RoomCode)
}

// setAllPlayersReady sets all players in the room to ready state
func (s *QuickMatchService) setAllPlayersReady(ctx context.Context, roomCode string, playerIDs []string) error {
	room, err := s.roomManager.GetRoom(roomCode)
	if err != nil {
		return fmt.Errorf("failed to get room: %w", err)
	}

	// Set all players to ready
	for _, playerID := range playerIDs {
		player := room.GetPlayer(playerID)
		if player != nil {
			player.IsReady = true
		}
	}

	slog.Info("All players set to ready",
		"roomCode", roomCode,
		"numPlayers", len(playerIDs))

	return nil
}

// startGameCountdown starts the countdown before game begins
func (s *QuickMatchService) startGameCountdown(ctx context.Context, roomCode, matchID string, duration time.Duration) {
	slog.Info("Starting game countdown",
		"roomCode", roomCode,
		"matchId", matchID,
		"duration", duration)

	// Wait for countdown
	select {
	case <-time.After(duration):
		// Countdown complete, start game
	case <-ctx.Done():
		slog.Info("Countdown cancelled", "roomCode", roomCode)
		return
	}

	// Verify all players still connected and ready
	room, err := s.roomManager.GetRoom(roomCode)
	if err != nil {
		slog.Error("Failed to get room for game start",
			"roomCode", roomCode,
			"error", err)

		s.mu.Lock()
		if qm, exists := s.activeMatches[matchID]; exists {
			qm.State = entity.QuickMatchStateFailed
			qm.Error = "Room not found"
		}
		s.mu.Unlock()
		return
	}

	// Check if all players are still ready
	if !s.allPlayersReady(room) {
		slog.Warn("Not all players ready, cancelling game start",
			"roomCode", roomCode)

		s.mu.Lock()
		if qm, exists := s.activeMatches[matchID]; exists {
			qm.State = entity.QuickMatchStateFailed
			qm.Error = "Not all players ready"
		}
		s.mu.Unlock()
		return
	}

	// Start the game
	err = s.startGame(ctx, roomCode, matchID)
	if err != nil {
		slog.Error("Failed to start game",
			"roomCode", roomCode,
			"matchId", matchID,
			"error", err)

		s.mu.Lock()
		if qm, exists := s.activeMatches[matchID]; exists {
			qm.State = entity.QuickMatchStateFailed
			qm.Error = err.Error()
		}
		s.mu.Unlock()
		return
	}

	// Mark Quick Match as completed
	s.mu.Lock()
	if qm, exists := s.activeMatches[matchID]; exists {
		qm.State = entity.QuickMatchStateCompleted
	}
	s.mu.Unlock()

	slog.Info("Quick Match game started successfully",
		"roomCode", roomCode,
		"matchId", matchID)
}

// allPlayersReady checks if all players in a room are ready
func (s *QuickMatchService) allPlayersReady(room *entity.Room) bool {
	if len(room.Players) == 0 {
		return false
	}

	for _, player := range room.Players {
		if !player.IsReady {
			return false
		}
	}

	return true
}

// startGame transitions the room to in-progress state
func (s *QuickMatchService) startGame(ctx context.Context, roomCode, matchID string) error {
	room, err := s.roomManager.GetRoom(roomCode)
	if err != nil {
		return fmt.Errorf("failed to get room: %w", err)
	}

	// Update room status
	room.Status = entity.StatusInProgress
	now := time.Now()
	room.StartedAt = &now
	room.UpdatedAt = now

	slog.Info("Game started",
		"roomCode", roomCode,
		"matchId", matchID,
		"numPlayers", len(room.Players))

	// TODO: Initialize game state (TASK-040)
	// This will be implemented when integrating with game state management
	// For now, just update room status

	return nil
}

// GetActiveMatch retrieves an active Quick Match by match ID
func (s *QuickMatchService) GetActiveMatch(matchID string) (*entity.QuickMatchResult, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	match, exists := s.activeMatches[matchID]
	return match, exists
}

// CleanupCompletedMatches removes completed/failed matches from active tracking
func (s *QuickMatchService) CleanupCompletedMatches() int {
	s.mu.Lock()
	defer s.mu.Unlock()

	count := 0
	cutoff := time.Now().Add(-5 * time.Minute) // Keep matches for 5 minutes

	for matchID, match := range s.activeMatches {
		if match.State.IsTerminal() && match.CreatedAt.Before(cutoff) {
			delete(s.activeMatches, matchID)
			count++
		}
	}

	if count > 0 {
		slog.Info("Cleaned up completed Quick Matches", "count", count)
	}

	return count
}

// GetActiveMatchCount returns the number of active Quick Matches
func (s *QuickMatchService) GetActiveMatchCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.activeMatches)
}

// CancelMatch cancels an active Quick Match
func (s *QuickMatchService) CancelMatch(matchID string, reason string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	match, exists := s.activeMatches[matchID]
	if !exists {
		return fmt.Errorf("match not found: %s", matchID)
	}

	if match.State.IsTerminal() {
		return fmt.Errorf("match already in terminal state: %s", match.State)
	}

	match.State = entity.QuickMatchStateFailed
	match.Error = reason

	slog.Info("Quick Match cancelled",
		"matchId", matchID,
		"reason", reason)

	return nil
}
