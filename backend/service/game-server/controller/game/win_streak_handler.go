package game

import (
	"log/slog"
	"sync"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// Streak bonus constants
const (
	// FireStreakBonus is the bonus points awarded per round when a player has a fire streak (2+ wins)
	FireStreakBonus = 5

	// FreezeBreakBonus is the one-time bonus awarded for breaking a 3+ win streak
	FreezeBreakBonus = 10

	// FireStreakThreshold is the minimum streak length to activate fire effect
	FireStreakThreshold = 2

	// FreezeBreakThreshold is the minimum streak length that triggers freeze bonus when broken
	FreezeBreakThreshold = 3
)

// Type aliases for cleaner code
type (
	StreakEvent     = entity.StreakEvent
	StreakEventType = entity.StreakEventType
)

// Re-export event type constants for convenience
const (
	StreakEventStreakStarted   = entity.StreakEventStreakStarted
	StreakEventFireActivated   = entity.StreakEventFireActivated
	StreakEventFireContinued   = entity.StreakEventFireContinued
	StreakEventFreezeTriggered = entity.StreakEventFreezeTriggered
	StreakEventStreakBroken    = entity.StreakEventStreakBroken
)

// WinStreakHandler manages win streak tracking and bonus calculations
// It provides thread-safe operations for updating streaks and generating events
type WinStreakHandler struct {
	gameState *entity.GameState
	mu        sync.RWMutex
}

// NewWinStreakHandler creates a new win streak handler
func NewWinStreakHandler(gameState *entity.GameState) *WinStreakHandler {
	return &WinStreakHandler{
		gameState: gameState,
	}
}

// UpdateWinStreaks updates win streaks for all players after a round winner is determined
// Returns a list of streak events that occurred (for broadcasting to players)
//
// Logic:
// 1. Increment winner's streak
// 2. Check if fire effect activates/continues (streak >= 2)
// 3. Reset all other players' streaks
// 4. Check if freeze effect triggers (breaking streak >= 3)
// 5. Generate events for all streak changes
//
// This method is thread-safe and can be called concurrently
func (wsh *WinStreakHandler) UpdateWinStreaks(roundWinnerID string) []StreakEvent {
	wsh.mu.Lock()
	defer wsh.mu.Unlock()

	// Validate inputs
	if wsh.gameState == nil {
		slog.Warn("Cannot update streaks: game state is nil")
		return []StreakEvent{}
	}

	if roundWinnerID == "" {
		slog.Warn("Cannot update streaks: winner ID is empty")
		return []StreakEvent{}
	}

	// Find the winning player
	winner := wsh.gameState.GetPlayer(roundWinnerID)
	if winner == nil {
		slog.Warn("Cannot update streaks: winner not found",
			"winnerId", roundWinnerID)
		return []StreakEvent{}
	}

	events := []StreakEvent{}

	// Track players whose streaks will be broken
	var brokenStreaks []struct {
		playerID string
		username string
		streak   int
	}

	// First pass: identify streaks that will be broken
	for i := range wsh.gameState.Players {
		player := &wsh.gameState.Players[i]
		if player.ID != roundWinnerID && player.WinStreak > 0 {
			brokenStreaks = append(brokenStreaks, struct {
				playerID string
				username string
				streak   int
			}{
				playerID: player.ID,
				username: player.Username,
				streak:   player.WinStreak,
			})
		}
	}

	// Check for freeze effect (winner breaking someone's 3+ streak)
	for _, broken := range brokenStreaks {
		if broken.streak >= FreezeBreakThreshold {
			freezeBonus := FreezeBreakBonus
			events = append(events, StreakEvent{
				Type:         StreakEventFreezeTriggered,
				PlayerID:     roundWinnerID,
				Username:     winner.Username,
				Streak:       winner.WinStreak + 1, // What it will be after increment
				Bonus:        freezeBonus,
				BrokenStreak: broken.streak,
			})

			slog.Info("Freeze effect triggered",
				"breakerID", roundWinnerID,
				"breakerUsername", winner.Username,
				"brokenPlayerID", broken.playerID,
				"brokenStreak", broken.streak,
				"freezeBonus", freezeBonus,
			)
		}
	}

	// Second pass: reset all losers' streaks and generate broken events
	for i := range wsh.gameState.Players {
		player := &wsh.gameState.Players[i]
		if player.ID != roundWinnerID {
			if player.WinStreak > 0 {
				slog.Info("Streak broken",
					"playerId", player.ID,
					"username", player.Username,
					"previousStreak", player.WinStreak,
				)

				events = append(events, StreakEvent{
					Type:     StreakEventStreakBroken,
					PlayerID: player.ID,
					Username: player.Username,
					Streak:   0,
					Bonus:    0,
				})

				player.WinStreak = 0
				player.IsOnFire = false
			}
		}
	}

	// Increment winner's streak
	previousStreak := winner.WinStreak
	winner.WinStreak++

	// Check for fire effect
	if winner.WinStreak >= FireStreakThreshold {
		winner.IsOnFire = true

		if previousStreak < FireStreakThreshold {
			// Fire just activated
			events = append(events, StreakEvent{
				Type:     StreakEventFireActivated,
				PlayerID: roundWinnerID,
				Username: winner.Username,
				Streak:   winner.WinStreak,
				Bonus:    FireStreakBonus,
			})

			slog.Info("Fire effect activated",
				"playerId", roundWinnerID,
				"username", winner.Username,
				"streak", winner.WinStreak,
				"fireBonus", FireStreakBonus,
			)
		} else {
			// Fire continues
			events = append(events, StreakEvent{
				Type:     StreakEventFireContinued,
				PlayerID: roundWinnerID,
				Username: winner.Username,
				Streak:   winner.WinStreak,
				Bonus:    FireStreakBonus,
			})

			slog.Info("Fire effect continues",
				"playerId", roundWinnerID,
				"username", winner.Username,
				"streak", winner.WinStreak,
				"fireBonus", FireStreakBonus,
			)
		}
	} else {
		// Streak started but not on fire yet
		events = append(events, StreakEvent{
			Type:     StreakEventStreakStarted,
			PlayerID: roundWinnerID,
			Username: winner.Username,
			Streak:   winner.WinStreak,
			Bonus:    0,
		})

		slog.Info("Win streak started",
			"playerId", roundWinnerID,
			"username", winner.Username,
			"streak", winner.WinStreak,
		)
	}

	return events
}

// CalculateFireBonus calculates the fire effect bonus for a given streak
// Returns FireStreakBonus if streak >= 2, otherwise 0
func (wsh *WinStreakHandler) CalculateFireBonus(streak int) int {
	if streak >= FireStreakThreshold {
		return FireStreakBonus
	}
	return 0
}

// CalculateFreezeBonus calculates the freeze effect bonus for breaking a streak
// Returns FreezeBreakBonus if broken streak >= 3, otherwise 0
func (wsh *WinStreakHandler) CalculateFreezeBonus(brokenStreak int) int {
	if brokenStreak >= FreezeBreakThreshold {
		return FreezeBreakBonus
	}
	return 0
}

// CheckFireEffect checks if a streak qualifies for fire effect
// Returns true if streak >= 2
func (wsh *WinStreakHandler) CheckFireEffect(streak int) bool {
	return streak >= FireStreakThreshold
}

// CheckFreezeEffect checks if breaking a streak qualifies for freeze effect
// Returns true if broken streak >= 3
func (wsh *WinStreakHandler) CheckFreezeEffect(brokenStreak int) bool {
	return brokenStreak >= FreezeBreakThreshold
}

// GetTotalStreakBonus calculates the total bonus points from streak events
// This is used by ScoreManager to add bonuses to player scores
func (wsh *WinStreakHandler) GetTotalStreakBonus(events []StreakEvent, playerID string) int {
	totalBonus := 0

	for _, event := range events {
		if event.PlayerID == playerID {
			totalBonus += event.Bonus
		}
	}

	return totalBonus
}
