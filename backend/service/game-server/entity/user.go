package entity

import (
	"time"
)

// User represents a user entity
type User struct {
	ID           string     `json:"id"`
	Username     string     `json:"username"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"` // Never expose in JSON
	Avatar       string     `json:"avatar"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	LastLogin    *time.Time `json:"lastLogin,omitempty"`
}

// UserStats represents user game statistics
type UserStats struct {
	UserID          string    `json:"userId"`
	TotalGames      int       `json:"totalGames"`
	TotalWins       int       `json:"totalWins"`
	TotalLosses     int       `json:"totalLosses"`
	TotalPoints     int       `json:"totalPoints"`
	WinRate         float64   `json:"winRate"`
	HighestStreak   int       `json:"highestStreak"`
	GamesWithFire   int       `json:"gamesWithFire"`
	GamesWithFreeze int       `json:"gamesWithFreeze"`
	DryWins         int       `json:"dryWins"`
	ShowDryWins     int       `json:"showDryWins"`
	ChallengesMade  int       `json:"challengesMade"`
	ChallengesWon   int       `json:"challengesWon"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// CreateUserRequest represents the data needed to create a new user
type CreateUserRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"` // Plain text, will be hashed
	Avatar   string `json:"avatar,omitempty"`
}

// UpdateUserRequest represents the data that can be updated
type UpdateUserRequest struct {
	Username *string `json:"username,omitempty"`
	Avatar   *string `json:"avatar,omitempty"`
}
