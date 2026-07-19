package entity

import "time"

// Quick Match configuration constants
const (
	// QuickMatchPointsToWin is the default points to win for Quick Match games
	QuickMatchPointsToWin = 21

	// QuickMatchSurfaceTheme is the default surface theme for Quick Match games
	QuickMatchSurfaceTheme = "afro-heritage"

	// QuickMatchMaxPlayers is the maximum number of players in a Quick Match game
	QuickMatchMaxPlayers = 4

	// QuickMatchMinPlayers is the minimum number of players in a Quick Match game
	QuickMatchMinPlayers = 2

	// QuickMatchCountdown is the countdown duration before game starts
	QuickMatchCountdown = 5 * time.Second

	// QuickMatchSetupTimeout is the maximum time allowed for room setup
	QuickMatchSetupTimeout = 10 * time.Second
)

// QuickMatchState represents the state of a Quick Match in progress
type QuickMatchState string

const (
	// QuickMatchStateCreating indicates room is being created
	QuickMatchStateCreating QuickMatchState = "creating"

	// QuickMatchStateJoining indicates players are joining the room
	QuickMatchStateJoining QuickMatchState = "joining"

	// QuickMatchStateCountdown indicates countdown before game start
	QuickMatchStateCountdown QuickMatchState = "countdown"

	// QuickMatchStateStarting indicates game is starting
	QuickMatchStateStarting QuickMatchState = "starting"

	// QuickMatchStateCompleted indicates Quick Match setup completed successfully
	QuickMatchStateCompleted QuickMatchState = "completed"

	// QuickMatchStateFailed indicates Quick Match setup failed
	QuickMatchStateFailed QuickMatchState = "failed"
)

// QuickMatchRequest represents a request to start a Quick Match
type QuickMatchRequest struct {
	PlayerID string `json:"playerId"`
	Username string `json:"username"`
}

// QuickMatchResult represents the result of a Quick Match setup
type QuickMatchResult struct {
	MatchID       string          `json:"matchId"`
	RoomCode      string          `json:"roomCode"`
	PlayerIDs     []string        `json:"playerIds"`
	State         QuickMatchState `json:"state"`
	CreatedAt     time.Time       `json:"createdAt"`
	CountdownTime int             `json:"countdownTime"` // seconds
	Error         string          `json:"error,omitempty"`
}

// QuickMatchSettings returns the default settings for Quick Match games
func QuickMatchSettings() RoomSettings {
	return RoomSettings{
		PointsToWin:  QuickMatchPointsToWin,
		SurfaceTheme: QuickMatchSurfaceTheme,
	}
}

// IsTerminal checks if the Quick Match state is terminal (completed or failed)
func (s QuickMatchState) IsTerminal() bool {
	return s == QuickMatchStateCompleted || s == QuickMatchStateFailed
}
