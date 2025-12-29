package entity

import "time"

// LeaderboardEntry represents a single entry in the leaderboard
// This combines user information with their statistics for ranking
type LeaderboardEntry struct {
	Rank            int       `json:"rank"`
	UserID          string    `json:"userId"`
	Username        string    `json:"username"`
	Avatar          string    `json:"avatar"`
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
	UpdatedAt       time.Time `json:"updatedAt"`
}

// LeaderboardResponse represents the API response for leaderboard queries
type LeaderboardResponse struct {
	Leaderboard []*LeaderboardEntry `json:"leaderboard"`
	Total       int                 `json:"total"`
	Limit       int                 `json:"limit"`
	Offset      int                 `json:"offset"`
	SortBy      string              `json:"sortBy"`
}

// PlayerStatsResponse represents the API response for player stats queries
type PlayerStatsResponse struct {
	UserID          string    `json:"userId"`
	Username        string    `json:"username"`
	Avatar          string    `json:"avatar"`
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

// PlayerRankResponse represents the API response for player rank queries
type PlayerRankResponse struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	Rank     int    `json:"rank"`
	SortBy   string `json:"sortBy"`
	Value    int    `json:"value"` // The value being ranked by (wins, points, etc.)
}

// LeaderboardSortBy defines valid sort criteria for leaderboards
type LeaderboardSortBy string

const (
	// SortByWins sorts by total wins (default)
	SortByWins LeaderboardSortBy = "total_wins"
	// SortByWinRate sorts by win rate percentage
	SortByWinRate LeaderboardSortBy = "win_rate"
	// SortByPoints sorts by total points earned
	SortByPoints LeaderboardSortBy = "total_points"
	// SortByStreak sorts by highest win streak
	SortByStreak LeaderboardSortBy = "highest_streak"
	// SortByGames sorts by total games played
	SortByGames LeaderboardSortBy = "total_games"
)

// ValidateSortBy validates a sort criteria string and returns the corresponding LeaderboardSortBy
func ValidateSortBy(sortBy string) LeaderboardSortBy {
	switch sortBy {
	case "wins", "total_wins":
		return SortByWins
	case "win_rate", "winrate":
		return SortByWinRate
	case "points", "total_points":
		return SortByPoints
	case "streak", "highest_streak", "best_streak":
		return SortByStreak
	case "games", "total_games":
		return SortByGames
	default:
		// Default to wins
		return SortByWins
	}
}

// String returns the database column name for the sort criteria
func (s LeaderboardSortBy) String() string {
	return string(s)
}

// DisplayName returns a human-readable name for the sort criteria
func (s LeaderboardSortBy) DisplayName() string {
	switch s {
	case SortByWins:
		return "Wins"
	case SortByWinRate:
		return "Win Rate"
	case SortByPoints:
		return "Points"
	case SortByStreak:
		return "Best Streak"
	case SortByGames:
		return "Games Played"
	default:
		return "Wins"
	}
}
