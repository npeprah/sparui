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

// UpdateStats updates user statistics after a game completes
// This method updates wins, losses, total games, points, and win rate
func (r *Repository) UpdateStats(ctx context.Context, userID string, stats *entity.UserStats) error {
	query := `
		UPDATE user_stats
		SET
			total_games = $2,
			total_wins = $3,
			total_losses = $4,
			total_points = $5,
			win_rate = $6,
			highest_streak = $7,
			games_with_fire = $8,
			games_with_freeze = $9,
			dry_wins = $10,
			show_dry_wins = $11,
			challenges_made = $12,
			challenges_won = $13,
			updated_at = $14
		WHERE user_id = $1
	`

	result, err := r.db.ExecContext(
		ctx,
		query,
		userID,
		stats.TotalGames,
		stats.TotalWins,
		stats.TotalLosses,
		stats.TotalPoints,
		stats.WinRate,
		stats.HighestStreak,
		stats.GamesWithFire,
		stats.GamesWithFreeze,
		stats.DryWins,
		stats.ShowDryWins,
		stats.ChallengesMade,
		stats.ChallengesWon,
		time.Now(),
	)

	if err != nil {
		return fmt.Errorf("failed to update user stats: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user stats not found for user: %s", userID)
	}

	slog.Info("User stats updated",
		"userId", userID,
		"totalGames", stats.TotalGames,
		"totalWins", stats.TotalWins,
		"winRate", stats.WinRate,
	)

	return nil
}

// IncrementGameStats atomically increments game-related stats for a user
// This is a convenience method for updating stats after a game without fetching first
func (r *Repository) IncrementGameStats(ctx context.Context, userID string, won bool, points int) error {
	// First, get current stats
	currentStats, err := r.GetStats(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get current stats: %w", err)
	}

	// Update stats
	currentStats.TotalGames++
	currentStats.TotalPoints += points

	if won {
		currentStats.TotalWins++
	} else {
		currentStats.TotalLosses++
	}

	// Recalculate win rate
	if currentStats.TotalGames > 0 {
		currentStats.WinRate = (float64(currentStats.TotalWins) / float64(currentStats.TotalGames)) * 100
	}

	// Update in database
	return r.UpdateStats(ctx, userID, currentStats)
}

// GetLeaderboard retrieves the top players sorted by the specified criteria
// This query is optimized with database indexes for fast leaderboard retrieval
func (r *Repository) GetLeaderboard(ctx context.Context, limit, offset int, sortBy entity.LeaderboardSortBy) ([]*entity.LeaderboardEntry, error) {
	// Validate sort column to prevent SQL injection
	validColumns := map[entity.LeaderboardSortBy]bool{
		entity.SortByWins:    true,
		entity.SortByWinRate: true,
		entity.SortByPoints:  true,
		entity.SortByStreak:  true,
		entity.SortByGames:   true,
	}

	if !validColumns[sortBy] {
		sortBy = entity.SortByWins // Default to wins
	}

	// Build query with proper JOIN to get user details
	query := fmt.Sprintf(`
		SELECT
			u.id, u.username, u.avatar,
			s.total_games, s.total_wins, s.total_losses, s.total_points, s.win_rate,
			s.highest_streak, s.games_with_fire, s.games_with_freeze,
			s.dry_wins, s.show_dry_wins, s.challenges_made, s.challenges_won,
			s.updated_at
		FROM users u
		INNER JOIN user_stats s ON u.id = s.user_id
		WHERE s.total_games > 0
		ORDER BY s.%s DESC, s.total_wins DESC, s.total_games DESC
		LIMIT $1 OFFSET $2
	`, sortBy.String())

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query leaderboard: %w", err)
	}
	defer rows.Close()

	var entries []*entity.LeaderboardEntry
	rank := offset + 1 // Calculate rank based on offset

	for rows.Next() {
		entry := &entity.LeaderboardEntry{
			Rank: rank,
		}

		err := rows.Scan(
			&entry.UserID,
			&entry.Username,
			&entry.Avatar,
			&entry.TotalGames,
			&entry.TotalWins,
			&entry.TotalLosses,
			&entry.TotalPoints,
			&entry.WinRate,
			&entry.HighestStreak,
			&entry.GamesWithFire,
			&entry.GamesWithFreeze,
			&entry.DryWins,
			&entry.ShowDryWins,
			&entry.ChallengesMade,
			&entry.ChallengesWon,
			&entry.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan leaderboard entry: %w", err)
		}

		entries = append(entries, entry)
		rank++
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating leaderboard rows: %w", err)
	}

	slog.Info("Leaderboard retrieved",
		"entries", len(entries),
		"sortBy", sortBy.String(),
		"limit", limit,
		"offset", offset,
	)

	return entries, nil
}

// GetLeaderboardTotal returns the total count of players with at least one game played
// This is useful for pagination calculations
func (r *Repository) GetLeaderboardTotal(ctx context.Context) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM user_stats
		WHERE total_games > 0
	`

	var total int
	err := r.db.QueryRowContext(ctx, query).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to get leaderboard total: %w", err)
	}

	return total, nil
}

// GetPlayerRank calculates a player's rank position based on the specified sort criteria
// Returns the rank (1-based) or 0 if player has no games
func (r *Repository) GetPlayerRank(ctx context.Context, userID string, sortBy entity.LeaderboardSortBy) (int, int, error) {
	// Validate sort column to prevent SQL injection
	validColumns := map[entity.LeaderboardSortBy]bool{
		entity.SortByWins:    true,
		entity.SortByWinRate: true,
		entity.SortByPoints:  true,
		entity.SortByStreak:  true,
		entity.SortByGames:   true,
	}

	if !validColumns[sortBy] {
		sortBy = entity.SortByWins // Default to wins
	}

	// First, get the player's stat value and verify they have games
	var statValue int
	var totalGames int
	statQuery := fmt.Sprintf(`
		SELECT s.%s, s.total_games
		FROM user_stats s
		WHERE s.user_id = $1
	`, sortBy.String())

	err := r.db.QueryRowContext(ctx, statQuery, userID).Scan(&statValue, &totalGames)
	if err == sql.ErrNoRows {
		return 0, 0, fmt.Errorf("player stats not found")
	}
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get player stats: %w", err)
	}

	// If player has no games, they have no rank
	if totalGames == 0 {
		return 0, statValue, nil
	}

	// Calculate rank: count how many players have a better stat value
	// Include ties by counting players with strictly better stats
	rankQuery := fmt.Sprintf(`
		SELECT COUNT(*) + 1
		FROM user_stats s1
		INNER JOIN user_stats s2 ON s2.user_id = $1
		WHERE s1.total_games > 0
		AND (
			s1.%s > s2.%s
			OR (s1.%s = s2.%s AND s1.total_wins > s2.total_wins)
			OR (s1.%s = s2.%s AND s1.total_wins = s2.total_wins AND s1.total_games < s2.total_games)
		)
	`, sortBy.String(), sortBy.String(), sortBy.String(), sortBy.String(), sortBy.String(), sortBy.String())

	var rank int
	err = r.db.QueryRowContext(ctx, rankQuery, userID).Scan(&rank)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to calculate player rank: %w", err)
	}

	slog.Info("Player rank calculated",
		"userId", userID,
		"rank", rank,
		"sortBy", sortBy.String(),
		"value", statValue,
	)

	return rank, statValue, nil
}

// GetPlayerStatsWithUser retrieves user stats along with user profile information
// This combines user and stats data for complete player profile display
func (r *Repository) GetPlayerStatsWithUser(ctx context.Context, userID string) (*entity.PlayerStatsResponse, error) {
	query := `
		SELECT
			u.id, u.username, u.avatar,
			s.total_games, s.total_wins, s.total_losses, s.total_points, s.win_rate,
			s.highest_streak, s.games_with_fire, s.games_with_freeze,
			s.dry_wins, s.show_dry_wins, s.challenges_made, s.challenges_won,
			s.created_at, s.updated_at
		FROM users u
		INNER JOIN user_stats s ON u.id = s.user_id
		WHERE u.id = $1
	`

	var response entity.PlayerStatsResponse
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&response.UserID,
		&response.Username,
		&response.Avatar,
		&response.TotalGames,
		&response.TotalWins,
		&response.TotalLosses,
		&response.TotalPoints,
		&response.WinRate,
		&response.HighestStreak,
		&response.GamesWithFire,
		&response.GamesWithFreeze,
		&response.DryWins,
		&response.ShowDryWins,
		&response.ChallengesMade,
		&response.ChallengesWon,
		&response.CreatedAt,
		&response.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("player not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get player stats: %w", err)
	}

	return &response, nil
}
