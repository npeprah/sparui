package stats

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// mockUserRepository is a mock implementation of user.Repository for testing
type mockUserRepository struct {
	mu    sync.RWMutex
	users map[string]*entity.User
	stats map[string]*entity.UserStats
}

func newMockUserRepository() *mockUserRepository {
	return &mockUserRepository{
		users: make(map[string]*entity.User),
		stats: make(map[string]*entity.UserStats),
	}
}

func (m *mockUserRepository) GetStats(ctx context.Context, userID string) (*entity.UserStats, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats, ok := m.stats[userID]
	if !ok {
		return nil, ErrStatsNotFound
	}
	return stats, nil
}

func (m *mockUserRepository) UpdateStats(ctx context.Context, userID string, stats *entity.UserStats) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.stats[userID] = stats
	return nil
}

func (m *mockUserRepository) GetLeaderboard(ctx context.Context, limit, offset int, sortBy entity.LeaderboardSortBy) ([]*entity.LeaderboardEntry, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Build leaderboard entries from mock data
	var entries []*entity.LeaderboardEntry
	rank := offset + 1

	// Sort stats by the requested criteria (simplified for mock)
	for userID, stats := range m.stats {
		if stats.TotalGames == 0 {
			continue // Skip players with no games
		}

		user := m.users[userID]
		entry := &entity.LeaderboardEntry{
			Rank:            rank,
			UserID:          userID,
			Username:        user.Username,
			Avatar:          user.Avatar,
			TotalGames:      stats.TotalGames,
			TotalWins:       stats.TotalWins,
			TotalLosses:     stats.TotalLosses,
			TotalPoints:     stats.TotalPoints,
			WinRate:         stats.WinRate,
			HighestStreak:   stats.HighestStreak,
			GamesWithFire:   stats.GamesWithFire,
			GamesWithFreeze: stats.GamesWithFreeze,
			DryWins:         stats.DryWins,
			ShowDryWins:     stats.ShowDryWins,
			ChallengesMade:  stats.ChallengesMade,
			ChallengesWon:   stats.ChallengesWon,
			UpdatedAt:       stats.UpdatedAt,
		}
		entries = append(entries, entry)
		rank++

		if len(entries) >= limit {
			break
		}
	}

	return entries, nil
}

func (m *mockUserRepository) GetLeaderboardTotal(ctx context.Context) (int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	count := 0
	for _, stats := range m.stats {
		if stats.TotalGames > 0 {
			count++
		}
	}
	return count, nil
}

func (m *mockUserRepository) GetPlayerRank(ctx context.Context, userID string, sortBy entity.LeaderboardSortBy) (int, int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats, ok := m.stats[userID]
	if !ok {
		return 0, 0, ErrStatsNotFound
	}

	if stats.TotalGames == 0 {
		return 0, 0, nil
	}

	// Simple mock: return rank 1 and the wins value
	value := stats.TotalWins
	switch sortBy {
	case entity.SortByPoints:
		value = stats.TotalPoints
	case entity.SortByStreak:
		value = stats.HighestStreak
	case entity.SortByGames:
		value = stats.TotalGames
	}

	return 1, value, nil
}

func (m *mockUserRepository) GetPlayerStatsWithUser(ctx context.Context, userID string) (*entity.PlayerStatsResponse, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	user, ok := m.users[userID]
	if !ok {
		return nil, ErrUserNotFound
	}

	stats, ok := m.stats[userID]
	if !ok {
		return nil, ErrStatsNotFound
	}

	return &entity.PlayerStatsResponse{
		UserID:          userID,
		Username:        user.Username,
		Avatar:          user.Avatar,
		TotalGames:      stats.TotalGames,
		TotalWins:       stats.TotalWins,
		TotalLosses:     stats.TotalLosses,
		TotalPoints:     stats.TotalPoints,
		WinRate:         stats.WinRate,
		HighestStreak:   stats.HighestStreak,
		GamesWithFire:   stats.GamesWithFire,
		GamesWithFreeze: stats.GamesWithFreeze,
		DryWins:         stats.DryWins,
		ShowDryWins:     stats.ShowDryWins,
		ChallengesMade:  stats.ChallengesMade,
		ChallengesWon:   stats.ChallengesWon,
		CreatedAt:       stats.CreatedAt,
		UpdatedAt:       stats.UpdatedAt,
	}, nil
}

func (m *mockUserRepository) FindByID(ctx context.Context, userID string) (*entity.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	user, ok := m.users[userID]
	if !ok {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// Test helper to create test user and stats
func createTestUser(userID, username string, wins, losses, points int) (*entity.User, *entity.UserStats) {
	user := &entity.User{
		ID:       userID,
		Username: username,
		Email:    username + "@test.com",
		Avatar:   "avatar.png",
	}

	totalGames := wins + losses
	winRate := 0.0
	if totalGames > 0 {
		winRate = (float64(wins) / float64(totalGames)) * 100
	}

	stats := &entity.UserStats{
		UserID:          userID,
		TotalGames:      totalGames,
		TotalWins:       wins,
		TotalLosses:     losses,
		TotalPoints:     points,
		WinRate:         winRate,
		HighestStreak:   3,
		GamesWithFire:   2,
		GamesWithFreeze: 1,
		DryWins:         1,
		ShowDryWins:     0,
		ChallengesMade:  5,
		ChallengesWon:   3,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	return user, stats
}

var (
	ErrStatsNotFound = fmt.Errorf("stats not found")
	ErrUserNotFound  = fmt.Errorf("user not found")
)

// TestGetPlayerStats tests retrieving player statistics
func TestGetPlayerStats(t *testing.T) {
	tests := []struct {
		name      string
		userID    string
		setupMock func(*mockUserRepository)
		wantErr   bool
		validate  func(*testing.T, *entity.PlayerStatsResponse)
	}{
		{
			name:   "Success - Player with games",
			userID: "user1",
			setupMock: func(m *mockUserRepository) {
				user, stats := createTestUser("user1", "Alice", 10, 5, 150)
				m.users["user1"] = user
				m.stats["user1"] = stats
			},
			wantErr: false,
			validate: func(t *testing.T, resp *entity.PlayerStatsResponse) {
				if resp.Username != "Alice" {
					t.Errorf("Username = %s, want Alice", resp.Username)
				}
				if resp.TotalWins != 10 {
					t.Errorf("TotalWins = %d, want 10", resp.TotalWins)
				}
				if resp.TotalGames != 15 {
					t.Errorf("TotalGames = %d, want 15", resp.TotalGames)
				}
			},
		},
		{
			name:   "Success - Player with no games",
			userID: "user2",
			setupMock: func(m *mockUserRepository) {
				user, stats := createTestUser("user2", "Bob", 0, 0, 0)
				m.users["user2"] = user
				m.stats["user2"] = stats
			},
			wantErr: false,
			validate: func(t *testing.T, resp *entity.PlayerStatsResponse) {
				if resp.TotalGames != 0 {
					t.Errorf("TotalGames = %d, want 0", resp.TotalGames)
				}
				if resp.WinRate != 0 {
					t.Errorf("WinRate = %.2f, want 0", resp.WinRate)
				}
			},
		},
		{
			name:      "Error - Empty user ID",
			userID:    "",
			setupMock: func(m *mockUserRepository) {},
			wantErr:   true,
		},
		{
			name:      "Error - User not found",
			userID:    "nonexistent",
			setupMock: func(m *mockUserRepository) {},
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := newMockUserRepository()
			tt.setupMock(mockRepo)

			service := NewService(mockRepo)
			ctx := context.Background()

			resp, err := service.GetPlayerStats(ctx, tt.userID)

			if (err != nil) != tt.wantErr {
				t.Errorf("GetPlayerStats() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && tt.validate != nil {
				tt.validate(t, resp)
			}
		})
	}
}

// TestGetLeaderboard tests leaderboard retrieval with pagination
func TestGetLeaderboard(t *testing.T) {
	tests := []struct {
		name      string
		limit     int
		offset    int
		sortBy    string
		setupMock func(*mockUserRepository)
		validate  func(*testing.T, *entity.LeaderboardResponse)
	}{
		{
			name:   "Default parameters",
			limit:  0, // Should default to 10
			offset: 0,
			sortBy: "",
			setupMock: func(m *mockUserRepository) {
				for i := 0; i < 5; i++ {
					userID := uuid.New().String()
					user, stats := createTestUser(userID, "Player"+string(rune('A'+i)), 5+i, 2, 100+i*10)
					m.users[userID] = user
					m.stats[userID] = stats
				}
			},
			validate: func(t *testing.T, resp *entity.LeaderboardResponse) {
				if resp.Limit != 10 {
					t.Errorf("Limit = %d, want 10", resp.Limit)
				}
				if resp.Offset != 0 {
					t.Errorf("Offset = %d, want 0", resp.Offset)
				}
				if len(resp.Leaderboard) != 5 {
					t.Errorf("Leaderboard length = %d, want 5", len(resp.Leaderboard))
				}
			},
		},
		{
			name:   "Custom limit and offset",
			limit:  3,
			offset: 2,
			sortBy: "wins",
			setupMock: func(m *mockUserRepository) {
				for i := 0; i < 10; i++ {
					userID := uuid.New().String()
					user, stats := createTestUser(userID, "Player"+string(rune('A'+i)), 10-i, 2, 100)
					m.users[userID] = user
					m.stats[userID] = stats
				}
			},
			validate: func(t *testing.T, resp *entity.LeaderboardResponse) {
				if resp.Limit != 3 {
					t.Errorf("Limit = %d, want 3", resp.Limit)
				}
				if resp.Offset != 2 {
					t.Errorf("Offset = %d, want 2", resp.Offset)
				}
				if len(resp.Leaderboard) > 3 {
					t.Errorf("Leaderboard length = %d, want <= 3", len(resp.Leaderboard))
				}
			},
		},
		{
			name:   "Limit exceeds max (should cap at 100)",
			limit:  200,
			offset: 0,
			sortBy: "points",
			setupMock: func(m *mockUserRepository) {
				userID := uuid.New().String()
				user, stats := createTestUser(userID, "Player", 5, 2, 100)
				m.users[userID] = user
				m.stats[userID] = stats
			},
			validate: func(t *testing.T, resp *entity.LeaderboardResponse) {
				if resp.Limit != 100 {
					t.Errorf("Limit = %d, want 100 (capped)", resp.Limit)
				}
			},
		},
		{
			name:   "Sort by win_rate",
			limit:  10,
			offset: 0,
			sortBy: "win_rate",
			setupMock: func(m *mockUserRepository) {
				userID := uuid.New().String()
				user, stats := createTestUser(userID, "TopPlayer", 50, 10, 500)
				m.users[userID] = user
				m.stats[userID] = stats
			},
			validate: func(t *testing.T, resp *entity.LeaderboardResponse) {
				if resp.SortBy != "win_rate" {
					t.Errorf("SortBy = %s, want win_rate", resp.SortBy)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := newMockUserRepository()
			tt.setupMock(mockRepo)

			service := NewService(mockRepo)
			ctx := context.Background()

			resp, err := service.GetLeaderboard(ctx, tt.limit, tt.offset, tt.sortBy)

			if err != nil {
				t.Errorf("GetLeaderboard() error = %v", err)
				return
			}

			if tt.validate != nil {
				tt.validate(t, resp)
			}
		})
	}
}

// TestGetPlayerRank tests player rank calculation
func TestGetPlayerRank(t *testing.T) {
	tests := []struct {
		name      string
		userID    string
		sortBy    string
		setupMock func(*mockUserRepository)
		wantErr   bool
		validate  func(*testing.T, *entity.PlayerRankResponse)
	}{
		{
			name:   "Success - Player with rank",
			userID: "user1",
			sortBy: "wins",
			setupMock: func(m *mockUserRepository) {
				user, stats := createTestUser("user1", "Alice", 20, 5, 300)
				m.users["user1"] = user
				m.stats["user1"] = stats
			},
			wantErr: false,
			validate: func(t *testing.T, resp *entity.PlayerRankResponse) {
				if resp.Username != "Alice" {
					t.Errorf("Username = %s, want Alice", resp.Username)
				}
				if resp.Rank <= 0 {
					t.Errorf("Rank = %d, want > 0", resp.Rank)
				}
				if resp.SortBy != "total_wins" {
					t.Errorf("SortBy = %s, want total_wins", resp.SortBy)
				}
			},
		},
		{
			name:   "Different sort criteria",
			userID: "user2",
			sortBy: "points",
			setupMock: func(m *mockUserRepository) {
				user, stats := createTestUser("user2", "Bob", 10, 5, 500)
				m.users["user2"] = user
				m.stats["user2"] = stats
			},
			wantErr: false,
			validate: func(t *testing.T, resp *entity.PlayerRankResponse) {
				if resp.SortBy != "total_points" {
					t.Errorf("SortBy = %s, want total_points", resp.SortBy)
				}
			},
		},
		{
			name:      "Error - Empty user ID",
			userID:    "",
			sortBy:    "wins",
			setupMock: func(m *mockUserRepository) {},
			wantErr:   true,
		},
		{
			name:      "Error - User not found",
			userID:    "nonexistent",
			sortBy:    "wins",
			setupMock: func(m *mockUserRepository) {},
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := newMockUserRepository()
			tt.setupMock(mockRepo)

			service := NewService(mockRepo)
			ctx := context.Background()

			resp, err := service.GetPlayerRank(ctx, tt.userID, tt.sortBy)

			if (err != nil) != tt.wantErr {
				t.Errorf("GetPlayerRank() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && tt.validate != nil {
				tt.validate(t, resp)
			}
		})
	}
}

// TestResetStats tests stats reset functionality
func TestResetStats(t *testing.T) {
	mockRepo := newMockUserRepository()
	userID := "user1"
	user, stats := createTestUser(userID, "TestUser", 10, 5, 200)
	mockRepo.users[userID] = user
	mockRepo.stats[userID] = stats

	service := NewService(mockRepo)
	ctx := context.Background()

	// Reset stats
	err := service.ResetStats(ctx, userID)
	if err != nil {
		t.Fatalf("ResetStats() error = %v", err)
	}

	// Verify stats are zeroed
	resetStats := mockRepo.stats[userID]
	if resetStats.TotalGames != 0 {
		t.Errorf("TotalGames = %d after reset, want 0", resetStats.TotalGames)
	}
	if resetStats.TotalWins != 0 {
		t.Errorf("TotalWins = %d after reset, want 0", resetStats.TotalWins)
	}
	if resetStats.TotalPoints != 0 {
		t.Errorf("TotalPoints = %d after reset, want 0", resetStats.TotalPoints)
	}
	if resetStats.WinRate != 0 {
		t.Errorf("WinRate = %.2f after reset, want 0", resetStats.WinRate)
	}
}

// TestValidateStatsConsistency tests stats validation
func TestValidateStatsConsistency(t *testing.T) {
	tests := []struct {
		name      string
		setupMock func(*mockUserRepository) string
		wantErr   bool
	}{
		{
			name: "Consistent stats",
			setupMock: func(m *mockUserRepository) string {
				userID := uuid.New().String()
				user, stats := createTestUser(userID, "GoodPlayer", 10, 5, 200)
				m.users[userID] = user
				m.stats[userID] = stats
				return userID
			},
			wantErr: false,
		},
		{
			name: "Inconsistent games count",
			setupMock: func(m *mockUserRepository) string {
				userID := uuid.New().String()
				user, stats := createTestUser(userID, "BadPlayer", 10, 5, 200)
				stats.TotalGames = 20 // Should be 15
				m.users[userID] = user
				m.stats[userID] = stats
				return userID
			},
			wantErr: true,
		},
		{
			name: "Inconsistent win rate",
			setupMock: func(m *mockUserRepository) string {
				userID := uuid.New().String()
				user, stats := createTestUser(userID, "BadPlayer", 10, 5, 200)
				stats.WinRate = 50.0 // Should be ~66.67
				m.users[userID] = user
				m.stats[userID] = stats
				return userID
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := newMockUserRepository()
			userID := tt.setupMock(mockRepo)

			service := NewService(mockRepo)
			ctx := context.Background()

			err := service.ValidateStatsConsistency(ctx, userID)

			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateStatsConsistency() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

// TestGetTopPlayers tests the convenience method
func TestGetTopPlayers(t *testing.T) {
	mockRepo := newMockUserRepository()

	// Create 20 test players
	for i := 0; i < 20; i++ {
		userID := uuid.New().String()
		user, stats := createTestUser(userID, "Player"+string(rune('A'+i)), 20-i, 5, 200)
		mockRepo.users[userID] = user
		mockRepo.stats[userID] = stats
	}

	service := NewService(mockRepo)
	ctx := context.Background()

	// Test default limit
	players, err := service.GetTopPlayers(ctx, 0)
	if err != nil {
		t.Fatalf("GetTopPlayers() error = %v", err)
	}
	if len(players) > 10 {
		t.Errorf("GetTopPlayers(0) returned %d players, want <= 10", len(players))
	}

	// Test custom limit
	players, err = service.GetTopPlayers(ctx, 5)
	if err != nil {
		t.Fatalf("GetTopPlayers() error = %v", err)
	}
	if len(players) > 5 {
		t.Errorf("GetTopPlayers(5) returned %d players, want <= 5", len(players))
	}
}

// TestConcurrentAccess tests thread safety
func TestConcurrentAccess(t *testing.T) {
	mockRepo := newMockUserRepository()

	// Setup test data
	for i := 0; i < 10; i++ {
		userID := uuid.New().String()
		user, stats := createTestUser(userID, "Player"+string(rune('A'+i)), 5+i, 2, 100)
		mockRepo.users[userID] = user
		mockRepo.stats[userID] = stats
	}

	service := NewService(mockRepo)
	ctx := context.Background()

	// Run concurrent operations
	done := make(chan bool)
	for i := 0; i < 50; i++ {
		go func() {
			defer func() { done <- true }()

			// Get leaderboard
			_, _ = service.GetLeaderboard(ctx, 10, 0, "wins")

			// Get top players
			_, _ = service.GetTopPlayers(ctx, 5)
		}()
	}

	// Wait for all goroutines
	for i := 0; i < 50; i++ {
		<-done
	}
}

// TestEdgeCases tests edge cases and boundary conditions
func TestEdgeCases(t *testing.T) {
	t.Run("Leaderboard with no players", func(t *testing.T) {
		mockRepo := newMockUserRepository()
		service := NewService(mockRepo)
		ctx := context.Background()

		resp, err := service.GetLeaderboard(ctx, 10, 0, "wins")
		if err != nil {
			t.Fatalf("GetLeaderboard() error = %v", err)
		}
		if len(resp.Leaderboard) != 0 {
			t.Errorf("Expected empty leaderboard, got %d entries", len(resp.Leaderboard))
		}
		if resp.Total != 0 {
			t.Errorf("Total = %d, want 0", resp.Total)
		}
	})

	t.Run("Negative limit defaults to 10", func(t *testing.T) {
		mockRepo := newMockUserRepository()
		service := NewService(mockRepo)
		ctx := context.Background()

		resp, err := service.GetLeaderboard(ctx, -5, 0, "wins")
		if err != nil {
			t.Fatalf("GetLeaderboard() error = %v", err)
		}
		if resp.Limit != 10 {
			t.Errorf("Limit = %d, want 10 (default)", resp.Limit)
		}
	})

	t.Run("Negative offset defaults to 0", func(t *testing.T) {
		mockRepo := newMockUserRepository()
		service := NewService(mockRepo)
		ctx := context.Background()

		resp, err := service.GetLeaderboard(ctx, 10, -5, "wins")
		if err != nil {
			t.Fatalf("GetLeaderboard() error = %v", err)
		}
		if resp.Offset != 0 {
			t.Errorf("Offset = %d, want 0 (default)", resp.Offset)
		}
	})

	t.Run("Invalid sort criteria defaults to wins", func(t *testing.T) {
		mockRepo := newMockUserRepository()
		service := NewService(mockRepo)
		ctx := context.Background()

		resp, err := service.GetLeaderboard(ctx, 10, 0, "invalid_sort")
		if err != nil {
			t.Fatalf("GetLeaderboard() error = %v", err)
		}
		if resp.SortBy != "total_wins" {
			t.Errorf("SortBy = %s, want total_wins (default)", resp.SortBy)
		}
	})
}
