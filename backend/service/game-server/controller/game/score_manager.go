package game

import (
	"fmt"
	"log/slog"
	"sort"
	"sync"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// ScoreManager manages scoring and win conditions for a Spar game
// It provides thread-safe operations for awarding points, calculating bonuses,
// and determining game winners
type ScoreManager struct {
	gameState *entity.GameState
	mu        sync.RWMutex
}

// PlayerScore represents a player's score information for leaderboard display
type PlayerScore struct {
	PlayerID  string `json:"playerId"`
	Username  string `json:"username"`
	Score     int    `json:"score"`
	RoundsWon int    `json:"roundsWon"`
}

// NewScoreManager creates a new score manager for the given game state
func NewScoreManager(gameState *entity.GameState) *ScoreManager {
	return &ScoreManager{
		gameState: gameState,
	}
}

// AwardRoundPoints awards 1 point to the round winner
// Also increments the player's rounds won count
// This method is thread-safe and can be called concurrently
func (sm *ScoreManager) AwardRoundPoints(winnerID string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.gameState == nil {
		return fmt.Errorf("game state not initialized")
	}

	if winnerID == "" {
		return fmt.Errorf("winner ID cannot be empty")
	}

	// Find the winning player
	player := sm.gameState.GetPlayer(winnerID)
	if player == nil {
		return fmt.Errorf("player not found: %s", winnerID)
	}

	// Award 1 point for round win
	player.Score++
	player.RoundsWon++

	slog.Info("Round points awarded",
		"playerId", winnerID,
		"username", player.Username,
		"newScore", player.Score,
		"roundsWon", player.RoundsWon,
	)

	return nil
}

// CalculateDryBonus calculates and applies the dry card bonus to a player's score
// Returns the bonus points awarded
//
// Dry Card Bonuses:
// - Hidden Dry (not shown): 6 points for 6, 4 points for 7
// - Shown Dry (visible): 12 points for 6, 8 points for 7
// - Hidden Dry (never revealed at end): Would be 12x base but handled differently
//
// This method is thread-safe and can be called concurrently
func (sm *ScoreManager) CalculateDryBonus(playerID string, dryCard *entity.DryCard) (int, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.gameState == nil {
		return 0, fmt.Errorf("game state not initialized")
	}

	if playerID == "" {
		return 0, fmt.Errorf("player ID cannot be empty")
	}

	if dryCard == nil {
		return 0, fmt.Errorf("dry card cannot be nil")
	}

	// Find the player
	player := sm.gameState.GetPlayer(playerID)
	if player == nil {
		return 0, fmt.Errorf("player not found: %s", playerID)
	}

	// Calculate bonus using the DryCard's built-in method
	bonus := dryCard.BonusPoints()

	// Apply bonus to player's score
	player.Score += bonus

	slog.Info("Dry card bonus applied",
		"playerId", playerID,
		"username", player.Username,
		"dryCard", dryCard.Card.String(),
		"dryType", dryCard.Type,
		"bonusPoints", bonus,
		"newScore", player.Score,
	)

	return bonus, nil
}

// GetPlayerScore returns the current score for a player
// This method is thread-safe and can be called concurrently
func (sm *ScoreManager) GetPlayerScore(playerID string) (int, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if sm.gameState == nil {
		return 0, fmt.Errorf("game state not initialized")
	}

	if playerID == "" {
		return 0, fmt.Errorf("player ID cannot be empty")
	}

	// Find the player
	player := sm.gameState.GetPlayer(playerID)
	if player == nil {
		return 0, fmt.Errorf("player not found: %s", playerID)
	}

	return player.Score, nil
}

// GetLeaderboard returns all players sorted by score (highest first)
// Tie-breaking: Higher rounds won comes first
// Further ties maintain player order from game state
// This method is thread-safe and can be called concurrently
func (sm *ScoreManager) GetLeaderboard() []PlayerScore {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if sm.gameState == nil {
		return []PlayerScore{}
	}

	// Create leaderboard entries
	leaderboard := make([]PlayerScore, len(sm.gameState.Players))
	for i, player := range sm.gameState.Players {
		leaderboard[i] = PlayerScore{
			PlayerID:  player.ID,
			Username:  player.Username,
			Score:     player.Score,
			RoundsWon: player.RoundsWon,
		}
	}

	// Sort by score (descending), then by rounds won (descending)
	sort.Slice(leaderboard, func(i, j int) bool {
		if leaderboard[i].Score != leaderboard[j].Score {
			return leaderboard[i].Score > leaderboard[j].Score
		}
		// Tie-breaker: more rounds won comes first
		return leaderboard[i].RoundsWon > leaderboard[j].RoundsWon
	})

	return leaderboard
}

// DetermineGameWinner determines the winner of the game
// Returns the player ID of the winner
//
// Win Conditions:
// 1. Player must have reached or exceeded points_to_win
// 2. If multiple players reach points_to_win simultaneously:
//    - Player with most round wins breaks the tie
//    - If still tied, first player in leaderboard order wins
//
// Returns error if no player has reached points_to_win
// This method is thread-safe and can be called concurrently
func (sm *ScoreManager) DetermineGameWinner() (string, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if sm.gameState == nil {
		return "", fmt.Errorf("game state not initialized")
	}

	if len(sm.gameState.Players) == 0 {
		return "", fmt.Errorf("no players in game")
	}

	// Find all players who have reached points_to_win
	var winners []entity.GamePlayer
	for _, player := range sm.gameState.Players {
		if player.Score >= sm.gameState.PointsToWin {
			winners = append(winners, player)
		}
	}

	// No winner yet
	if len(winners) == 0 {
		return "", fmt.Errorf("no player has reached points to win (%d)", sm.gameState.PointsToWin)
	}

	// Single winner
	if len(winners) == 1 {
		winner := winners[0]
		slog.Info("Game winner determined",
			"winnerId", winner.ID,
			"username", winner.Username,
			"score", winner.Score,
			"roundsWon", winner.RoundsWon,
		)
		return winner.ID, nil
	}

	// Multiple players reached points_to_win - use tie-breakers
	// Sort by score (desc), then by rounds won (desc)
	sort.Slice(winners, func(i, j int) bool {
		if winners[i].Score != winners[j].Score {
			return winners[i].Score > winners[j].Score
		}
		// Tie-breaker: most rounds won
		return winners[i].RoundsWon > winners[j].RoundsWon
	})

	winner := winners[0]
	slog.Info("Game winner determined (tie-broken)",
		"winnerId", winner.ID,
		"username", winner.Username,
		"score", winner.Score,
		"roundsWon", winner.RoundsWon,
		"tieBreaker", "rounds_won",
	)

	return winner.ID, nil
}

// IsGameOver checks if the game has ended
// Game is over when at least one player has reached or exceeded points_to_win
// This method is thread-safe and can be called concurrently
func (sm *ScoreManager) IsGameOver() bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if sm.gameState == nil {
		return false
	}

	// Check if any player has reached points_to_win
	for _, player := range sm.gameState.Players {
		if player.Score >= sm.gameState.PointsToWin {
			return true
		}
	}

	return false
}
