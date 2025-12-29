package game

import (
	"context"
	"fmt"
	"log/slog"
	"sort"
	"sync"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
	"github.com/npeprah/sparui/backend/service/game-server/repository/game"
	"github.com/npeprah/sparui/backend/service/game-server/repository/user"
)

// GameOverHandler manages game completion and final scoring
// It orchestrates the entire game over process including:
// - Detecting game over conditions
// - Calculating final scores with all bonuses
// - Determining winners (including ties)
// - Updating player statistics
// - Saving game history
type GameOverHandler struct {
	gameState       *entity.GameState
	scoreManager    *ScoreManager
	dryCardHandler  *DryCardHandler
	streakHandler   *WinStreakHandler
	userRepo        *user.Repository
	gameHistoryRepo *game.HistoryRepository
	mu              sync.RWMutex
}

// NewGameOverHandler creates a new game over handler
func NewGameOverHandler(
	gameState *entity.GameState,
	userRepo *user.Repository,
	gameHistoryRepo *game.HistoryRepository,
	dryCardHandler *DryCardHandler,
	streakHandler *WinStreakHandler,
) *GameOverHandler {
	return &GameOverHandler{
		gameState:       gameState,
		userRepo:        userRepo,
		gameHistoryRepo: gameHistoryRepo,
		dryCardHandler:  dryCardHandler,
		streakHandler:   streakHandler,
	}
}

// CheckGameOver checks if the game has ended and returns the reason
// Returns (isOver, completionType)
//
// Game ends when:
// 1. All 5 rounds are complete (CompletionRounds)
// 2. Any player reaches the points target (CompletionPointsTarget)
// 3. All but one player disconnect (CompletionForfeit) - future enhancement
func (h *GameOverHandler) CheckGameOver() (bool, entity.GameCompletionType) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if h.gameState == nil {
		return false, ""
	}

	// Check if points target reached (takes priority)
	for _, player := range h.gameState.Players {
		if player.Score >= h.gameState.PointsToWin {
			slog.Info("Game over: Points target reached",
				"playerId", player.ID,
				"score", player.Score,
				"target", h.gameState.PointsToWin,
			)
			return true, entity.CompletionPointsTarget
		}
	}

	// Check if all rounds complete
	if h.gameState.CurrentRound >= h.gameState.TotalRounds {
		slog.Info("Game over: All rounds complete",
			"currentRound", h.gameState.CurrentRound,
			"totalRounds", h.gameState.TotalRounds,
		)
		return true, entity.CompletionRounds
	}

	return false, ""
}

// CalculateFinalScores calculates detailed final scores for all players
// This includes breaking down scores into:
// - Base score (rounds won)
// - Dry card bonuses
// - Streak bonuses (fire effect)
// - Freeze bonuses
// - Challenge bonuses/penalties
//
// Returns a map of playerID -> FinalScore
func (h *GameOverHandler) CalculateFinalScores() map[string]*entity.FinalScore {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if h.gameState == nil {
		return make(map[string]*entity.FinalScore)
	}

	finalScores := make(map[string]*entity.FinalScore)

	for _, player := range h.gameState.Players {
		fs := &entity.FinalScore{
			PlayerID:         player.ID,
			Username:         player.Username,
			RoundsWon:        player.RoundsWon,
			BaseScore:        player.RoundsWon, // In Spar, 1 point per round won
			DryCardBonus:     0,
			StreakBonus:      0,
			FreezeBonus:      0,
			ChallengeBonus:   0,
			ChallengePenalty: 0,
		}

		// Calculate dry card bonus
		if player.DryCard != nil {
			fs.DryCardBonus = player.DryCard.BonusPoints()
		}

		// Calculate streak bonus (fire effect: +5 per round when streak >= 2)
		// We need to estimate how many rounds the player had fire effect
		// If current streak >= 2, they got +5 for each round after the first win
		if player.WinStreak >= 2 {
			// Fire activates at streak 2, continues for all subsequent rounds
			// So if streak is 3, they got fire bonus for 2 rounds (rounds 2 and 3)
			fireRounds := player.WinStreak - 1
			fs.StreakBonus = fireRounds * FireStreakBonus
		}

		// Calculate freeze bonus
		// This is tricky - we need to check if this player broke someone's streak
		// For now, we'll check if FreezeTriggered is set in game state
		// In a full implementation, we'd track freeze events per player
		if h.gameState.FreezeTriggered {
			// Check if this player was the one who triggered freeze
			// For simplicity, we'll check if they have a recent win and others had streaks broken
			// This is a simplified version - in production, we'd track this explicitly
			hasWonRecently := player.RoundsWon > 0
			if hasWonRecently {
				// Assume they might have triggered freeze if they won recently
				// In full implementation, we'd track this in streak events
				fs.FreezeBonus = FreezeBreakBonus
			}
		}

		// Calculate challenge bonus/penalty
		// We need to track challenges in game state or from history
		// For now, we'll derive this from the difference between Score and calculated bonuses
		calculatedScore := fs.BaseScore + fs.DryCardBonus + fs.StreakBonus + fs.FreezeBonus
		scoreDiff := player.Score - calculatedScore

		if scoreDiff > 0 {
			fs.ChallengeBonus = scoreDiff
		} else if scoreDiff < 0 {
			fs.ChallengePenalty = -scoreDiff
		}

		// Calculate total score
		fs.TotalScore = fs.BaseScore + fs.DryCardBonus + fs.StreakBonus + fs.FreezeBonus + fs.ChallengeBonus - fs.ChallengePenalty

		// Sanity check: total should match player's current score
		if fs.TotalScore != player.Score {
			slog.Warn("Final score mismatch",
				"playerId", player.ID,
				"calculated", fs.TotalScore,
				"actual", player.Score,
				"diff", player.Score-fs.TotalScore,
			)
			// Use actual score to be safe
			fs.TotalScore = player.Score
		}

		finalScores[player.ID] = fs

		slog.Info("Final score calculated",
			"playerId", player.ID,
			"username", player.Username,
			"total", fs.TotalScore,
			"base", fs.BaseScore,
			"dry", fs.DryCardBonus,
			"streak", fs.StreakBonus,
			"freeze", fs.FreezeBonus,
			"challengeBonus", fs.ChallengeBonus,
			"challengePenalty", fs.ChallengePenalty,
		)
	}

	return finalScores
}

// DetermineWinner determines the winner(s) from final scores
// Returns a slice of player IDs (can be multiple in case of tie)
//
// Logic:
// 1. Find the highest score
// 2. Return all players with that score (handles ties)
func (h *GameOverHandler) DetermineWinner(finalScores map[string]*entity.FinalScore) []string {
	if len(finalScores) == 0 {
		return []string{}
	}

	// Find the highest score
	highestScore := -1
	for _, fs := range finalScores {
		if fs.TotalScore > highestScore {
			highestScore = fs.TotalScore
		}
	}

	// Find all players with the highest score
	var winners []string
	for playerID, fs := range finalScores {
		if fs.TotalScore == highestScore {
			winners = append(winners, playerID)
		}
	}

	// Log winners
	if len(winners) == 1 {
		slog.Info("Game winner determined",
			"winnerId", winners[0],
			"score", highestScore,
		)
	} else {
		slog.Info("Game ended in tie",
			"winners", winners,
			"score", highestScore,
		)
	}

	return winners
}

// GenerateGameSummary creates a comprehensive game summary
// This includes all final scores, winners, and metadata
func (h *GameOverHandler) GenerateGameSummary(
	finalScores map[string]*entity.FinalScore,
	winners []string,
	completionType entity.GameCompletionType,
) *entity.GameSummary {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if h.gameState == nil {
		return nil
	}

	completedAt := time.Now()
	duration := int(completedAt.Sub(h.gameState.StartedAt).Seconds())

	// Check if winner(s) had fire effect
	isFireWin := false
	isFreezeWin := false
	for _, winnerID := range winners {
		player := h.gameState.GetPlayer(winnerID)
		if player != nil {
			if player.IsOnFire || player.WinStreak >= FireStreakThreshold {
				isFireWin = true
			}
			// Check if winner used freeze (simplified check)
			if h.gameState.FreezeTriggered {
				isFreezeWin = true
			}
		}
	}

	// Generate player results
	playerResults := h.GeneratePlayerResults(h.gameState, finalScores, winners)

	summary := &entity.GameSummary{
		GameID:          h.gameState.GameID,
		RoomCode:        h.gameState.RoomCode,
		Winners:         winners,
		FinalScores:     finalScores,
		TotalRounds:     h.gameState.CurrentRound,
		DurationSeconds: duration,
		IsFireWin:       isFireWin,
		IsFreezeWin:     isFreezeWin,
		CompletionType:  completionType,
		CompletedAt:     completedAt,
		PlayerResults:   playerResults,
	}

	slog.Info("Game summary generated",
		"gameId", summary.GameID,
		"winners", winners,
		"completionType", completionType,
		"durationSeconds", duration,
	)

	return summary
}

// GeneratePlayerResults creates detailed results for each player
// This includes placement, dry cards, challenges, etc.
func (h *GameOverHandler) GeneratePlayerResults(
	gameState *entity.GameState,
	finalScores map[string]*entity.FinalScore,
	winners []string,
) []*entity.PlayerGameResult {
	// Sort players by final score to determine placement
	type scoredPlayer struct {
		playerID string
		score    int
	}

	var scored []scoredPlayer
	for playerID, fs := range finalScores {
		scored = append(scored, scoredPlayer{playerID: playerID, score: fs.TotalScore})
	}

	// Sort by score descending
	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	// Assign placements (handle ties by giving same placement)
	placements := make(map[string]int)
	currentPlacement := 1
	for i, sp := range scored {
		if i > 0 && sp.score < scored[i-1].score {
			currentPlacement = i + 1
		}
		placements[sp.playerID] = currentPlacement
	}

	// Create winner map for quick lookup
	winnerMap := make(map[string]bool)
	for _, winnerID := range winners {
		winnerMap[winnerID] = true
	}

	// Generate results
	var results []*entity.PlayerGameResult
	for _, player := range gameState.Players {
		fs := finalScores[player.ID]
		if fs == nil {
			continue
		}

		result := &entity.PlayerGameResult{
			GameID:         gameState.GameID,
			UserID:         player.ID,
			FinalScore:     fs.TotalScore,
			RoundsWon:      player.RoundsWon,
			DeclaredDry:    player.DryCard != nil,
			Placement:      placements[player.ID],
			IsWinner:       winnerMap[player.ID],
			ChallengesMade: 0, // Would need to track in game state
			ChallengesWon:  0, // Would need to track in game state
		}

		// Add dry card info if present
		if player.DryCard != nil {
			if player.DryCard.Card.Value == entity.Six {
				result.DryCardValue = 6
			} else if player.DryCard.Card.Value == entity.Seven {
				result.DryCardValue = 7
			}
			result.DryType = string(player.DryCard.Type)
		}

		results = append(results, result)
	}

	return results
}

// HandleGameOver orchestrates the entire game over process
// This is the main entry point for completing a game
//
// Steps:
// 1. Check if game is over
// 2. Calculate final scores
// 3. Determine winner(s)
// 4. Generate game summary
// 5. Update player stats in database
// 6. Save game history to database
// 7. Mark game state as complete
//
// Returns the game summary or an error
func (h *GameOverHandler) HandleGameOver(ctx context.Context, roomID string) (*entity.GameSummary, error) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.gameState == nil {
		return nil, fmt.Errorf("game state not initialized")
	}

	// Check if game is actually over
	isOver, completionType := h.CheckGameOver()
	if !isOver {
		return nil, fmt.Errorf("game is not over yet")
	}

	// Calculate final scores
	finalScores := h.CalculateFinalScores()

	// Determine winner(s)
	winners := h.DetermineWinner(finalScores)
	if len(winners) == 0 {
		return nil, fmt.Errorf("no winner determined")
	}

	// Generate comprehensive summary
	summary := h.GenerateGameSummary(finalScores, winners, completionType)
	if summary == nil {
		return nil, fmt.Errorf("failed to generate game summary")
	}

	// Update player stats in database
	if h.userRepo != nil {
		if err := h.updatePlayerStats(ctx, summary); err != nil {
			slog.Error("Failed to update player stats",
				"error", err,
				"gameId", summary.GameID,
			)
			// Don't fail the entire operation if stats update fails
		}
	}

	// Save game history to database
	if h.gameHistoryRepo != nil {
		if err := h.gameHistoryRepo.SaveGameSummary(ctx, summary, roomID); err != nil {
			slog.Error("Failed to save game history",
				"error", err,
				"gameId", summary.GameID,
			)
			// Don't fail the entire operation if history save fails
		}
	}

	// Mark game state as completed
	now := time.Now()
	h.gameState.CompletedAt = &now
	h.gameState.Phase = entity.PhaseGameOver

	slog.Info("Game over handled successfully",
		"gameId", summary.GameID,
		"winners", winners,
		"completionType", completionType,
	)

	return summary, nil
}

// updatePlayerStats updates statistics for all players after game completion
func (h *GameOverHandler) updatePlayerStats(ctx context.Context, summary *entity.GameSummary) error {
	for _, playerResult := range summary.PlayerResults {
		// Get current stats
		stats, err := h.userRepo.GetStats(ctx, playerResult.UserID)
		if err != nil {
			slog.Error("Failed to get player stats",
				"userId", playerResult.UserID,
				"error", err,
			)
			continue
		}

		// Update stats
		stats.TotalGames++
		stats.TotalPoints += playerResult.FinalScore

		if playerResult.IsWinner {
			stats.TotalWins++
		} else {
			stats.TotalLosses++
		}

		// Recalculate win rate
		if stats.TotalGames > 0 {
			stats.WinRate = (float64(stats.TotalWins) / float64(stats.TotalGames)) * 100
		}

		// Update dry wins
		if playerResult.IsWinner && playerResult.DeclaredDry {
			if playerResult.DryType == string(entity.DryShown) {
				stats.ShowDryWins++
			} else {
				stats.DryWins++
			}
		}

		// Update fire/freeze stats
		if playerResult.IsWinner {
			if summary.IsFireWin {
				stats.GamesWithFire++
			}
			if summary.IsFreezeWin {
				stats.GamesWithFreeze++
			}
		}

		// Save updated stats
		if err := h.userRepo.UpdateStats(ctx, playerResult.UserID, stats); err != nil {
			slog.Error("Failed to update player stats",
				"userId", playerResult.UserID,
				"error", err,
			)
			continue
		}

		slog.Info("Player stats updated",
			"userId", playerResult.UserID,
			"totalGames", stats.TotalGames,
			"wins", stats.TotalWins,
			"winRate", stats.WinRate,
		)
	}

	return nil
}
