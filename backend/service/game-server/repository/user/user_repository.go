package user

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/npeprah/sparui/backend/common/db"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// Repository handles user data operations
type Repository struct {
	db *db.DB
}

// NewRepository creates a new user repository
func NewRepository(database *db.DB) *Repository {
	return &Repository{db: database}
}

// Create creates a new user
func (r *Repository) Create(ctx context.Context, req entity.CreateUserRequest, passwordHash string) (*entity.User, error) {
	query := `
		INSERT INTO users (username, email, password_hash, avatar)
		VALUES ($1, $2, $3, $4)
		RETURNING id, username, email, avatar, created_at, updated_at
	`

	avatar := req.Avatar
	if avatar == "" {
		avatar = "default-avatar.png"
	}

	var user entity.User
	err := r.db.QueryRowContext(
		ctx,
		query,
		req.Username,
		req.Email,
		passwordHash,
		avatar,
	).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Avatar,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	slog.Info("User created", "userId", user.ID, "username", user.Username)

	// Create initial stats entry
	if err := r.createInitialStats(ctx, user.ID); err != nil {
		slog.Error("Failed to create initial stats", "userId", user.ID, "error", err)
		// Don't fail user creation if stats creation fails
	}

	return &user, nil
}

// FindByEmail finds a user by email
func (r *Repository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	query := `
		SELECT id, username, email, password_hash, avatar, created_at, updated_at, last_login
		FROM users
		WHERE email = $1
	`

	var user entity.User
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Avatar,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLogin,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find user by email: %w", err)
	}

	return &user, nil
}

// FindByID finds a user by ID
func (r *Repository) FindByID(ctx context.Context, id string) (*entity.User, error) {
	query := `
		SELECT id, username, email, password_hash, avatar, created_at, updated_at, last_login
		FROM users
		WHERE id = $1
	`

	var user entity.User
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Avatar,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLogin,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find user by id: %w", err)
	}

	return &user, nil
}

// FindByUsername finds a user by username
func (r *Repository) FindByUsername(ctx context.Context, username string) (*entity.User, error) {
	query := `
		SELECT id, username, email, password_hash, avatar, created_at, updated_at, last_login
		FROM users
		WHERE username = $1
	`

	var user entity.User
	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Avatar,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLogin,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find user by username: %w", err)
	}

	return &user, nil
}

// UpdateLastLogin updates the user's last login timestamp
func (r *Repository) UpdateLastLogin(ctx context.Context, userID string) error {
	query := `
		UPDATE users
		SET last_login = $1
		WHERE id = $2
	`

	_, err := r.db.ExecContext(ctx, query, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}

	return nil
}

// GetStats retrieves user statistics
func (r *Repository) GetStats(ctx context.Context, userID string) (*entity.UserStats, error) {
	query := `
		SELECT
			user_id, total_games, total_wins, total_losses, total_points, win_rate,
			highest_streak, games_with_fire, games_with_freeze, dry_wins, show_dry_wins,
			challenges_made, challenges_won, created_at, updated_at
		FROM user_stats
		WHERE user_id = $1
	`

	var stats entity.UserStats
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&stats.UserID,
		&stats.TotalGames,
		&stats.TotalWins,
		&stats.TotalLosses,
		&stats.TotalPoints,
		&stats.WinRate,
		&stats.HighestStreak,
		&stats.GamesWithFire,
		&stats.GamesWithFreeze,
		&stats.DryWins,
		&stats.ShowDryWins,
		&stats.ChallengesMade,
		&stats.ChallengesWon,
		&stats.CreatedAt,
		&stats.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("stats not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user stats: %w", err)
	}

	return &stats, nil
}

// createInitialStats creates an initial stats entry for a new user
func (r *Repository) createInitialStats(ctx context.Context, userID string) error {
	query := `
		INSERT INTO user_stats (user_id, total_games, total_wins, total_losses, total_points, win_rate)
		VALUES ($1, 0, 0, 0, 0, 0.00)
		ON CONFLICT (user_id) DO NOTHING
	`

	_, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to create initial stats: %w", err)
	}

	return nil
}

// EmailExists checks if an email is already registered
func (r *Repository) EmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check email existence: %w", err)
	}

	return exists, nil
}

// UsernameExists checks if a username is already taken
func (r *Repository) UsernameExists(ctx context.Context, username string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, username).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check username existence: %w", err)
	}

	return exists, nil
}
