package stats

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
	"github.com/npeprah/sparui/backend/service/game-server/repository/user"
)

// UserRepository defines the interface for user and stats database operations
// This interface allows for easier testing and mocking
type UserRepository interface {
	GetStats(ctx context.Context, userID string) (*entity.UserStats, error)
	UpdateStats(ctx context.Context, userID string, stats *entity.UserStats) error
	GetLeaderboard(ctx context.Context, limit, offset int, sortBy entity.LeaderboardSortBy) ([]*entity.LeaderboardEntry, error)
	GetLeaderboardTotal(ctx context.Context) (int, error)
	GetPlayerRank(ctx context.Context, userID string, sortBy entity.LeaderboardSortBy) (int, int, error)
	GetPlayerStatsWithUser(ctx context.Context, userID string) (*entity.PlayerStatsResponse, error)
	FindByID(ctx context.Context, userID string) (*entity.User, error)
}

// Service manages player statistics and leaderboard operations
// It provides thread-safe methods for retrieving and managing player stats
type Service struct {
	userRepo UserRepository
	mu       sync.RWMutex
}

// NewService creates a new stats service
func NewService(userRepo UserRepository) *Service {
	return &Service{
		userRepo: userRepo,
	}
}

// NewServiceWithRepository creates a new stats service with a concrete repository
// This is a convenience method for production code
func NewServiceWithRepository(repo *user.Repository) *Service {
	return NewService(repo)
}

// GetPlayerStats retrieves comprehensive statistics for a specific player
// This includes all stats fields along with user profile information
//
// Returns:
// - PlayerStatsResponse with complete stats or error if player not found
func (s *Service) GetPlayerStats(ctx context.Context, userID string) (*entity.PlayerStatsResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if userID == "" {
		return nil, fmt.Errorf("user ID is required")
	}

	stats, err := s.userRepo.GetPlayerStatsWithUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get player stats: %w", err)
	}

	slog.Info("Player stats retrieved",
		"userId", userID,
		"totalGames", stats.TotalGames,
		"wins", stats.TotalWins,
		"winRate", stats.WinRate,
	)

	return stats, nil
}

// GetLeaderboard retrieves the top players sorted by specified criteria
// Supports pagination and multiple sort options
//
// Parameters:
// - ctx: Context for cancellation and timeouts
// - limit: Maximum number of entries to return (1-100, default 10)
// - offset: Number of entries to skip for pagination (default 0)
// - sortBy: Sort criteria (wins, win_rate, points, streak, games)
//
// Returns:
// - LeaderboardResponse with entries, total count, and pagination info
func (s *Service) GetLeaderboard(ctx context.Context, limit, offset int, sortBy string) (*entity.LeaderboardResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Validate and set defaults
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100 // Cap at 100 to prevent excessive queries
	}
	if offset < 0 {
		offset = 0
	}

	// Validate sort criteria
	sortByCriteria := entity.ValidateSortBy(sortBy)

	// Get leaderboard entries
	entries, err := s.userRepo.GetLeaderboard(ctx, limit, offset, sortByCriteria)
	if err != nil {
		return nil, fmt.Errorf("failed to get leaderboard: %w", err)
	}

	// Get total count for pagination
	total, err := s.userRepo.GetLeaderboardTotal(ctx)
	if err != nil {
		slog.Warn("Failed to get leaderboard total", "error", err)
		total = len(entries) // Fallback to entries count
	}

	response := &entity.LeaderboardResponse{
		Leaderboard: entries,
		Total:       total,
		Limit:       limit,
		Offset:      offset,
		SortBy:      sortByCriteria.String(),
	}

	slog.Info("Leaderboard retrieved",
		"entries", len(entries),
		"total", total,
		"sortBy", sortByCriteria.String(),
		"limit", limit,
		"offset", offset,
	)

	return response, nil
}

// GetPlayerRank calculates a player's rank position on the leaderboard
// The rank is based on the specified sort criteria
//
// Parameters:
// - ctx: Context for cancellation and timeouts
// - userID: The player's user ID
// - sortBy: Sort criteria to calculate rank by
//
// Returns:
// - PlayerRankResponse with rank, username, and stat value
// - Returns rank 0 if player has no games played
func (s *Service) GetPlayerRank(ctx context.Context, userID string, sortBy string) (*entity.PlayerRankResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if userID == "" {
		return nil, fmt.Errorf("user ID is required")
	}

	// Validate sort criteria
	sortByCriteria := entity.ValidateSortBy(sortBy)

	// Get user info
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Calculate rank
	rank, value, err := s.userRepo.GetPlayerRank(ctx, userID, sortByCriteria)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate rank: %w", err)
	}

	response := &entity.PlayerRankResponse{
		UserID:   userID,
		Username: user.Username,
		Rank:     rank,
		SortBy:   sortByCriteria.String(),
		Value:    value,
	}

	slog.Info("Player rank calculated",
		"userId", userID,
		"username", user.Username,
		"rank", rank,
		"sortBy", sortByCriteria.String(),
		"value", value,
	)

	return response, nil
}

// InitializeStats creates initial stats entry for a new player
// This should be called when a new user is created
// Note: This is already called automatically in user.Repository.Create()
//
// Returns error if stats already exist or creation fails
func (s *Service) InitializeStats(ctx context.Context, userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if userID == "" {
		return fmt.Errorf("user ID is required")
	}

	// Check if stats already exist
	_, err := s.userRepo.GetStats(ctx, userID)
	if err == nil {
		return fmt.Errorf("stats already exist for user %s", userID)
	}

	// Create initial stats using the repository's internal method
	// This is a bit of a workaround since createInitialStats is private
	// In practice, stats are created automatically when a user is created
	stats := &entity.UserStats{
		UserID:          userID,
		TotalGames:      0,
		TotalWins:       0,
		TotalLosses:     0,
		TotalPoints:     0,
		WinRate:         0.0,
		HighestStreak:   0,
		GamesWithFire:   0,
		GamesWithFreeze: 0,
		DryWins:         0,
		ShowDryWins:     0,
		ChallengesMade:  0,
		ChallengesWon:   0,
	}

	if err := s.userRepo.UpdateStats(ctx, userID, stats); err != nil {
		return fmt.Errorf("failed to initialize stats: %w", err)
	}

	slog.Info("Player stats initialized", "userId", userID)

	return nil
}

// ResetStats resets all statistics for a player to zero
// This is useful for testing or implementing seasonal resets
// WARNING: This permanently deletes all stats history
//
// Returns error if player not found or reset fails
func (s *Service) ResetStats(ctx context.Context, userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if userID == "" {
		return fmt.Errorf("user ID is required")
	}

	// Verify player exists
	_, err := s.userRepo.GetStats(ctx, userID)
	if err != nil {
		return fmt.Errorf("player not found: %w", err)
	}

	// Create zeroed stats
	resetStats := &entity.UserStats{
		UserID:          userID,
		TotalGames:      0,
		TotalWins:       0,
		TotalLosses:     0,
		TotalPoints:     0,
		WinRate:         0.0,
		HighestStreak:   0,
		GamesWithFire:   0,
		GamesWithFreeze: 0,
		DryWins:         0,
		ShowDryWins:     0,
		ChallengesMade:  0,
		ChallengesWon:   0,
	}

	if err := s.userRepo.UpdateStats(ctx, userID, resetStats); err != nil {
		return fmt.Errorf("failed to reset stats: %w", err)
	}

	slog.Warn("Player stats reset",
		"userId", userID,
		"note", "All statistics have been reset to zero",
	)

	return nil
}

// GetTopPlayers is a convenience method to get the top N players
// It returns the leaderboard sorted by total wins
//
// Parameters:
// - ctx: Context for cancellation and timeouts
// - limit: Number of top players to return (default 10, max 100)
//
// Returns:
// - Array of LeaderboardEntry with top players
func (s *Service) GetTopPlayers(ctx context.Context, limit int) ([]*entity.LeaderboardEntry, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	response, err := s.GetLeaderboard(ctx, limit, 0, "wins")
	if err != nil {
		return nil, err
	}

	return response.Leaderboard, nil
}

// ValidateStatsConsistency checks if player stats are mathematically consistent
// This is useful for debugging and data integrity verification
//
// Checks:
// - total_games = total_wins + total_losses
// - win_rate = (total_wins / total_games) * 100 (within 0.01% tolerance)
// - all counts are non-negative
//
// Returns error if inconsistencies are found
func (s *Service) ValidateStatsConsistency(ctx context.Context, userID string) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	stats, err := s.userRepo.GetStats(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get stats: %w", err)
	}

	// Check games consistency
	if stats.TotalGames != stats.TotalWins+stats.TotalLosses {
		return fmt.Errorf(
			"inconsistent games: total=%d, wins=%d, losses=%d, expected=%d",
			stats.TotalGames,
			stats.TotalWins,
			stats.TotalLosses,
			stats.TotalWins+stats.TotalLosses,
		)
	}

	// Check win rate consistency (with tolerance for floating point)
	if stats.TotalGames > 0 {
		expectedWinRate := (float64(stats.TotalWins) / float64(stats.TotalGames)) * 100
		diff := stats.WinRate - expectedWinRate
		if diff < 0 {
			diff = -diff
		}
		if diff > 0.01 { // Allow 0.01% tolerance
			return fmt.Errorf(
				"inconsistent win rate: stored=%.2f, calculated=%.2f, diff=%.4f",
				stats.WinRate,
				expectedWinRate,
				diff,
			)
		}
	}

	// Check non-negative values
	if stats.TotalGames < 0 || stats.TotalWins < 0 || stats.TotalLosses < 0 ||
		stats.TotalPoints < 0 || stats.HighestStreak < 0 {
		return fmt.Errorf("negative stat values found")
	}

	slog.Info("Stats consistency validated", "userId", userID)

	return nil
}

// GetStatsSnapshot returns a snapshot of current statistics for a player
// This is useful for displaying player profiles without full user details
func (s *Service) GetStatsSnapshot(ctx context.Context, userID string) (*entity.UserStats, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	stats, err := s.userRepo.GetStats(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get stats snapshot: %w", err)
	}

	return stats, nil
}
