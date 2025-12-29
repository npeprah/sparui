package entity

import "time"

// QueueEntry represents a player in the matchmaking queue
type QueueEntry struct {
	PlayerID   string
	Username   string
	JoinedAt   time.Time
	TimeoutAt  time.Time
	Connection interface{} // WebSocket client connection (stored as interface{} to avoid circular dependency)
}

// MatchResult represents the result of a successful match
type MatchResult struct {
	MatchID   string
	RoomCode  string
	Room      *Room
	PlayerIDs []string
	CreatedAt time.Time
}

// QueueStatus represents the current state of the matchmaking queue
type QueueStatus struct {
	TotalPlayers      int `json:"totalPlayers"`
	EstimatedWaitTime int `json:"estimatedWaitTime"` // seconds
	YourPosition      int `json:"yourPosition"`      // 0 if not in queue
	MatchesCreated    int `json:"matchesCreated"`    // statistics
}

// MatchmakingConfig represents configuration for the matchmaking system
type MatchmakingConfig struct {
	MinPlayers       int           // Minimum players for a match (default: 2)
	MaxPlayers       int           // Maximum players for a match (default: 4)
	PreferredPlayers int           // Preferred number of players (default: 4)
	QueueTimeout     time.Duration // Time before player is removed from queue (default: 60s)
	RelaxedMatchTime time.Duration // Time after which relaxed matching kicks in (default: 30s)
	TickInterval     time.Duration // How often to check for matches (default: 1s)
}

// DefaultMatchmakingConfig returns the default matchmaking configuration
func DefaultMatchmakingConfig() MatchmakingConfig {
	return MatchmakingConfig{
		MinPlayers:       2,
		MaxPlayers:       4,
		PreferredPlayers: 4,
		QueueTimeout:     60 * time.Second,
		RelaxedMatchTime: 30 * time.Second,
		TickInterval:     1 * time.Second,
	}
}

// JoinQueueRequest represents a request to join the matchmaking queue
type JoinQueueRequest struct {
	PlayerID string `json:"playerId"`
	Username string `json:"username"`
}

// LeaveQueueRequest represents a request to leave the matchmaking queue
type LeaveQueueRequest struct {
	PlayerID string `json:"playerId"`
}

// QueueStatusRequest represents a request for queue status
type QueueStatusRequest struct {
	PlayerID string `json:"playerId"`
}
