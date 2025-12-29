package room

import (
	"context"
	"crypto/rand"
	"fmt"
	"log/slog"
	"math/big"
	"sync"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

const (
	// MinPlayers is the minimum number of players required for a game
	MinPlayers = 2
	// MaxPlayers is the maximum number of players allowed in a room
	MaxPlayers = 4
	// RoomCodeLength is the length of the room code
	RoomCodeLength = 6
	// RoomCodeChars are the characters used in room codes
	RoomCodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)

// Manager handles room/lobby management operations
type Manager struct {
	rooms      map[string]*entity.Room
	mu         sync.RWMutex
	repository Repository
}

// Repository defines the interface for room persistence
type Repository interface {
	Create(ctx context.Context, room *entity.Room) error
	Update(ctx context.Context, room *entity.Room) error
	Delete(ctx context.Context, roomID string) error
	FindByCode(ctx context.Context, roomCode string) (*entity.Room, error)
	FindByID(ctx context.Context, roomID string) (*entity.Room, error)
	List(ctx context.Context) ([]*entity.Room, error)
	RoomCodeExists(ctx context.Context, roomCode string) (bool, error)
}

// NewManager creates a new room manager
func NewManager() *Manager {
	return &Manager{
		rooms: make(map[string]*entity.Room),
	}
}

// NewManagerWithRepository creates a new room manager with a repository
func NewManagerWithRepository(repo Repository) *Manager {
	return &Manager{
		rooms:      make(map[string]*entity.Room),
		repository: repo,
	}
}

// CreateRoom creates a new game room
func (m *Manager) CreateRoom(ctx context.Context, req entity.CreateRoomRequest) (*entity.Room, error) {
	if req.HostID == "" {
		return nil, fmt.Errorf("hostID is required")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Generate unique room code
	roomCode, err := m.generateUniqueRoomCode(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to generate room code: %w", err)
	}

	// Use default settings if not provided
	settings := req.Settings
	if settings.PointsToWin == 0 {
		settings = entity.DefaultRoomSettings()
	}
	if req.Settings.PointsToWin != 0 {
		settings.PointsToWin = req.Settings.PointsToWin
	}
	if req.Settings.SurfaceTheme != "" {
		settings.SurfaceTheme = req.Settings.SurfaceTheme
	}

	now := time.Now()
	room := &entity.Room{
		ID:         generateUUID(),
		RoomCode:   roomCode,
		HostID:     req.HostID,
		Players:    []entity.Player{},
		MaxPlayers: MaxPlayers,
		Settings:   settings,
		Status:     entity.StatusWaiting,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	// Add host as first player
	// Note: In a real implementation, we would fetch user details from user repository
	hostPlayer := entity.Player{
		ID:       req.HostID,
		Username: "Host", // Placeholder - should be fetched from user service
		Avatar:   "default-avatar.png",
		IsHost:   true,
		IsReady:  false,
		JoinedAt: now,
	}
	room.Players = append(room.Players, hostPlayer)

	// Store in memory
	m.rooms[room.RoomCode] = room

	// Persist to database if repository is available
	if m.repository != nil {
		if err := m.repository.Create(ctx, room); err != nil {
			slog.Error("Failed to persist room to database", "roomCode", room.RoomCode, "error", err)
			// Don't fail the operation if database persistence fails
			// In-memory storage is sufficient for MVP
		}
	}

	slog.Info("Room created", "roomCode", room.RoomCode, "hostId", room.HostID)

	return room, nil
}

// JoinRoom adds a player to an existing room
func (m *Manager) JoinRoom(ctx context.Context, req entity.JoinRoomRequest, playerInfo entity.User) (*entity.Room, error) {
	if req.RoomCode == "" {
		return nil, fmt.Errorf("roomCode is required")
	}
	if req.PlayerID == "" {
		return nil, fmt.Errorf("playerId is required")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Get room
	room, exists := m.rooms[req.RoomCode]
	if !exists {
		return nil, fmt.Errorf("room not found: %s", req.RoomCode)
	}

	// Validate room can accept new players
	if !room.CanJoin() {
		if room.IsFull() {
			return nil, fmt.Errorf("room is full")
		}
		return nil, fmt.Errorf("cannot join room with status: %s", room.Status)
	}

	// Check if player is already in room
	if room.HasPlayer(req.PlayerID) {
		return nil, fmt.Errorf("player already in room")
	}

	// Add player to room
	player := entity.Player{
		ID:       playerInfo.ID,
		Username: playerInfo.Username,
		Avatar:   playerInfo.Avatar,
		IsHost:   false,
		IsReady:  false,
		JoinedAt: time.Now(),
	}
	room.Players = append(room.Players, player)
	room.UpdatedAt = time.Now()

	// Update in database if repository is available
	if m.repository != nil {
		if err := m.repository.Update(ctx, room); err != nil {
			slog.Error("Failed to update room in database", "roomCode", room.RoomCode, "error", err)
		}
	}

	slog.Info("Player joined room", "roomCode", room.RoomCode, "playerId", req.PlayerID, "playerCount", len(room.Players))

	return room, nil
}

// LeaveRoom removes a player from a room
func (m *Manager) LeaveRoom(ctx context.Context, req entity.LeaveRoomRequest) error {
	if req.RoomCode == "" {
		return fmt.Errorf("roomCode is required")
	}
	if req.PlayerID == "" {
		return fmt.Errorf("playerId is required")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Get room
	room, exists := m.rooms[req.RoomCode]
	if !exists {
		return fmt.Errorf("room not found: %s", req.RoomCode)
	}

	// Check if player is in room
	if !room.HasPlayer(req.PlayerID) {
		return fmt.Errorf("player not in room")
	}

	// Remove player
	wasHost := room.IsHost(req.PlayerID)
	room.RemovePlayer(req.PlayerID)
	room.UpdatedAt = time.Now()

	// Handle host migration if host left and room not empty
	if wasHost && !room.IsEmpty() {
		newHost := &room.Players[0]
		room.HostID = newHost.ID
		newHost.IsHost = true
		slog.Info("Host migrated", "roomCode", room.RoomCode, "newHostId", room.HostID)
	}

	// Clean up empty room
	if room.IsEmpty() {
		delete(m.rooms, req.RoomCode)
		if m.repository != nil {
			if err := m.repository.Delete(ctx, room.ID); err != nil {
				slog.Error("Failed to delete room from database", "roomCode", room.RoomCode, "error", err)
			}
		}
		slog.Info("Room deleted (empty)", "roomCode", room.RoomCode)
		return nil
	}

	// Update in database if repository is available
	if m.repository != nil {
		if err := m.repository.Update(ctx, room); err != nil {
			slog.Error("Failed to update room in database", "roomCode", room.RoomCode, "error", err)
		}
	}

	slog.Info("Player left room", "roomCode", room.RoomCode, "playerId", req.PlayerID, "playerCount", len(room.Players))

	return nil
}

// GetRoom retrieves a room by room code
func (m *Manager) GetRoom(roomCode string) (*entity.Room, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	room, exists := m.rooms[roomCode]
	if !exists {
		return nil, fmt.Errorf("room not found: %s", roomCode)
	}

	return room, nil
}

// GetRoomByID retrieves a room by room ID
func (m *Manager) GetRoomByID(roomID string) (*entity.Room, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, room := range m.rooms {
		if room.ID == roomID {
			return room, nil
		}
	}

	return nil, fmt.Errorf("room not found: %s", roomID)
}

// ListRooms returns all active rooms
func (m *Manager) ListRooms() []*entity.Room {
	m.mu.RLock()
	defer m.mu.RUnlock()

	rooms := make([]*entity.Room, 0, len(m.rooms))
	for _, room := range m.rooms {
		rooms = append(rooms, room)
	}

	return rooms
}

// UpdateRoomSettings updates room settings (host only)
func (m *Manager) UpdateRoomSettings(ctx context.Context, req entity.UpdateRoomSettingsRequest) (*entity.Room, error) {
	if req.RoomCode == "" {
		return nil, fmt.Errorf("roomCode is required")
	}
	if req.HostID == "" {
		return nil, fmt.Errorf("hostId is required")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	room, exists := m.rooms[req.RoomCode]
	if !exists {
		return nil, fmt.Errorf("room not found: %s", req.RoomCode)
	}

	// Verify requester is host
	if !room.IsHost(req.HostID) {
		return nil, fmt.Errorf("only host can update room settings")
	}

	// Update settings
	room.Settings = req.Settings
	room.UpdatedAt = time.Now()

	// Update in database if repository is available
	if m.repository != nil {
		if err := m.repository.Update(ctx, room); err != nil {
			slog.Error("Failed to update room in database", "roomCode", room.RoomCode, "error", err)
		}
	}

	slog.Info("Room settings updated", "roomCode", room.RoomCode, "hostId", req.HostID)

	return room, nil
}

// CleanupEmptyRooms removes all empty rooms from memory
func (m *Manager) CleanupEmptyRooms(ctx context.Context) int {
	m.mu.Lock()
	defer m.mu.Unlock()

	count := 0
	for code, room := range m.rooms {
		if room.IsEmpty() {
			delete(m.rooms, code)
			if m.repository != nil {
				if err := m.repository.Delete(ctx, room.ID); err != nil {
					slog.Error("Failed to delete room from database", "roomCode", code, "error", err)
				}
			}
			count++
		}
	}

	if count > 0 {
		slog.Info("Cleaned up empty rooms", "count", count)
	}

	return count
}

// generateUniqueRoomCode generates a unique 6-character room code
func (m *Manager) generateUniqueRoomCode(ctx context.Context) (string, error) {
	maxAttempts := 10
	for i := 0; i < maxAttempts; i++ {
		code := generateRoomCode()

		// Check in-memory storage
		if _, exists := m.rooms[code]; !exists {
			// Check database if repository is available
			if m.repository != nil {
				exists, err := m.repository.RoomCodeExists(ctx, code)
				if err != nil {
					slog.Warn("Failed to check room code in database", "code", code, "error", err)
					// Continue with in-memory check only
				} else if exists {
					continue
				}
			}
			return code, nil
		}
	}

	return "", fmt.Errorf("failed to generate unique room code after %d attempts", maxAttempts)
}

// generateRoomCode generates a random 6-character alphanumeric code
func generateRoomCode() string {
	code := make([]byte, RoomCodeLength)
	charsLen := big.NewInt(int64(len(RoomCodeChars)))

	for i := 0; i < RoomCodeLength; i++ {
		num, err := rand.Int(rand.Reader, charsLen)
		if err != nil {
			// Fallback to timestamp-based code if random fails
			return fmt.Sprintf("%06d", time.Now().UnixNano()%1000000)
		}
		code[i] = RoomCodeChars[num.Int64()]
	}

	return string(code)
}

// generateUUID generates a simple UUID-like string
// In production, use github.com/google/uuid or similar
func generateUUID() string {
	return fmt.Sprintf("%d-%d", time.Now().UnixNano(), randomInt(100000, 999999))
}

// randomInt generates a random integer between min and max
func randomInt(min, max int) int {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(max-min)))
	if err != nil {
		return min
	}
	return int(n.Int64()) + min
}

// SetPlayerReady sets a player's ready state in a room
func (m *Manager) SetPlayerReady(ctx context.Context, roomCode, playerID string, ready bool) error {
	if roomCode == "" {
		return fmt.Errorf("roomCode is required")
	}
	if playerID == "" {
		return fmt.Errorf("playerId is required")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	room, exists := m.rooms[roomCode]
	if !exists {
		return fmt.Errorf("room not found: %s", roomCode)
	}

	player := room.GetPlayer(playerID)
	if player == nil {
		return fmt.Errorf("player not in room: %s", playerID)
	}

	player.IsReady = ready
	room.UpdatedAt = time.Now()

	// Update room status if all players are ready
	if ready && m.allPlayersReadyUnsafe(room) && len(room.Players) >= MinPlayers {
		room.Status = entity.StatusReady
	}

	// Update in database if repository is available
	if m.repository != nil {
		if err := m.repository.Update(ctx, room); err != nil {
			slog.Error("Failed to update room in database", "roomCode", room.RoomCode, "error", err)
		}
	}

	slog.Info("Player ready state updated",
		"roomCode", roomCode,
		"playerId", playerID,
		"ready", ready)

	return nil
}

// AllPlayersReady checks if all players in a room are ready
func (m *Manager) AllPlayersReady(roomCode string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	room, exists := m.rooms[roomCode]
	if !exists {
		return false
	}

	return m.allPlayersReadyUnsafe(room)
}

// allPlayersReadyUnsafe checks if all players are ready (must be called with lock held)
func (m *Manager) allPlayersReadyUnsafe(room *entity.Room) bool {
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

// StartGame starts the game for a room
func (m *Manager) StartGame(ctx context.Context, roomCode string) error {
	if roomCode == "" {
		return fmt.Errorf("roomCode is required")
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	room, exists := m.rooms[roomCode]
	if !exists {
		return fmt.Errorf("room not found: %s", roomCode)
	}

	// Validate room can start
	if room.Status == entity.StatusInProgress {
		return fmt.Errorf("game already in progress")
	}

	if len(room.Players) < MinPlayers {
		return fmt.Errorf("not enough players to start game (min: %d)", MinPlayers)
	}

	if !m.allPlayersReadyUnsafe(room) {
		return fmt.Errorf("not all players are ready")
	}

	// Update room status
	room.Status = entity.StatusInProgress
	now := time.Now()
	room.StartedAt = &now
	room.UpdatedAt = now

	// Update in database if repository is available
	if m.repository != nil {
		if err := m.repository.Update(ctx, room); err != nil {
			slog.Error("Failed to update room in database", "roomCode", room.RoomCode, "error", err)
		}
	}

	slog.Info("Game started",
		"roomCode", roomCode,
		"numPlayers", len(room.Players))

	return nil
}

// IsPlayerInAnyRoom checks if a player is in any active room
func (m *Manager) IsPlayerInAnyRoom(playerID string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, room := range m.rooms {
		if room.HasPlayer(playerID) {
			return true
		}
	}

	return false
}

// GetPlayerRoom returns the room code that a player is currently in
func (m *Manager) GetPlayerRoom(playerID string) (string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, room := range m.rooms {
		if room.HasPlayer(playerID) {
			return room.RoomCode, nil
		}
	}

	return "", fmt.Errorf("player not in any room")
}
