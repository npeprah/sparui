package entity

import (
	"time"
)

// RoomStatus represents the current status of a game room
type RoomStatus string

const (
	StatusWaiting    RoomStatus = "waiting"
	StatusReady      RoomStatus = "ready"
	StatusInProgress RoomStatus = "in_progress"
	StatusCompleted  RoomStatus = "completed"
)

// Room represents a game room/lobby
type Room struct {
	ID          string       `json:"id"`
	RoomCode    string       `json:"roomCode"`
	HostID      string       `json:"hostId"`
	Players     []Player     `json:"players"`
	MaxPlayers  int          `json:"maxPlayers"`
	Settings    RoomSettings `json:"settings"`
	Status      RoomStatus   `json:"status"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
	StartedAt   *time.Time   `json:"startedAt,omitempty"`
	CompletedAt *time.Time   `json:"completedAt,omitempty"`
}

// RoomSettings represents configurable room settings
type RoomSettings struct {
	PointsToWin  int    `json:"pointsToWin"`
	SurfaceTheme string `json:"surfaceTheme"`
	AIDifficulty string `json:"aiDifficulty,omitempty"`
}

// Player represents a player in a room
type Player struct {
	ID       string    `json:"id"`
	Username string    `json:"username"`
	Avatar   string    `json:"avatar"`
	IsHost   bool      `json:"isHost"`
	IsReady  bool      `json:"isReady"`
	JoinedAt time.Time `json:"joinedAt"`
}

// CreateRoomRequest represents the data needed to create a new room
type CreateRoomRequest struct {
	HostID   string       `json:"hostId"`
	Settings RoomSettings `json:"settings,omitempty"`
}

// JoinRoomRequest represents the data needed to join a room
type JoinRoomRequest struct {
	RoomCode string `json:"roomCode"`
	PlayerID string `json:"playerId"`
}

// LeaveRoomRequest represents the data needed to leave a room
type LeaveRoomRequest struct {
	RoomCode string `json:"roomCode"`
	PlayerID string `json:"playerId"`
}

// UpdateRoomSettingsRequest represents the data needed to update room settings
type UpdateRoomSettingsRequest struct {
	RoomCode string       `json:"roomCode"`
	HostID   string       `json:"hostId"`
	Settings RoomSettings `json:"settings"`
}

// DefaultRoomSettings returns the default room settings
func DefaultRoomSettings() RoomSettings {
	return RoomSettings{
		PointsToWin:  10,
		SurfaceTheme: "poker-table",
		AIDifficulty: "",
	}
}

// IsHost checks if a player is the host of the room
func (r *Room) IsHost(playerID string) bool {
	return r.HostID == playerID
}

// IsFull checks if the room has reached maximum capacity
func (r *Room) IsFull() bool {
	return len(r.Players) >= r.MaxPlayers
}

// CanJoin checks if the room can accept new players
func (r *Room) CanJoin() bool {
	return r.Status == StatusWaiting && !r.IsFull()
}

// GetPlayer finds a player in the room by ID
func (r *Room) GetPlayer(playerID string) *Player {
	for i := range r.Players {
		if r.Players[i].ID == playerID {
			return &r.Players[i]
		}
	}
	return nil
}

// HasPlayer checks if a player is in the room
func (r *Room) HasPlayer(playerID string) bool {
	return r.GetPlayer(playerID) != nil
}

// RemovePlayer removes a player from the room
func (r *Room) RemovePlayer(playerID string) bool {
	for i, player := range r.Players {
		if player.ID == playerID {
			r.Players = append(r.Players[:i], r.Players[i+1:]...)
			return true
		}
	}
	return false
}

// IsEmpty checks if the room has no players
func (r *Room) IsEmpty() bool {
	return len(r.Players) == 0
}

// PlayerCount returns the number of players in the room
func (r *Room) PlayerCount() int {
	return len(r.Players)
}
