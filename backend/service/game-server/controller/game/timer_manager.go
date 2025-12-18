package game

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand"
	"sync"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TimerCallback is called when the timer ticks or expires
type TimerCallback func(gameID string, playerID string, remaining int)

// TimerManager manages turn timers for active games
// It handles starting timers, broadcasting countdowns, and triggering auto-play on timeout
type TimerManager struct {
	// Active timers map: gameID -> timer context
	timers map[string]*timerContext
	mu     sync.RWMutex

	// Callbacks for timer events
	onTick    TimerCallback // Called every second with remaining time
	onExpire  TimerCallback // Called when timer expires (remaining = 0)
}

// timerContext holds the state of an active timer
type timerContext struct {
	gameID        string
	playerID      string
	duration      int           // Total duration in seconds
	started       time.Time     // When the timer started
	cancel        context.CancelFunc
	done          chan struct{} // Signals timer completion
}

// NewTimerManager creates a new timer manager
func NewTimerManager() *TimerManager {
	return &TimerManager{
		timers: make(map[string]*timerContext),
	}
}

// SetCallbacks sets the callback functions for timer events
func (tm *TimerManager) SetCallbacks(onTick, onExpire TimerCallback) {
	tm.mu.Lock()
	defer tm.mu.Unlock()
	tm.onTick = onTick
	tm.onExpire = onExpire
}

// StartTimer starts a turn timer for a player
// duration: timer duration in seconds (15 for leader, 8 for second player, 5 for others)
func (tm *TimerManager) StartTimer(ctx context.Context, gameID, playerID string, duration int) error {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	// Cancel existing timer for this game if any
	if existing, ok := tm.timers[gameID]; ok {
		existing.cancel()
		<-existing.done // Wait for cleanup
	}

	// Create timer context
	timerCtx, cancel := context.WithCancel(ctx)
	tc := &timerContext{
		gameID:   gameID,
		playerID: playerID,
		duration: duration,
		started:  time.Now(),
		cancel:   cancel,
		done:     make(chan struct{}),
	}

	tm.timers[gameID] = tc

	// Start timer goroutine
	go tm.runTimer(timerCtx, tc)

	slog.Info("Turn timer started",
		"gameId", gameID,
		"playerId", playerID,
		"duration", duration,
	)

	return nil
}

// CancelTimer cancels the active timer for a game
func (tm *TimerManager) CancelTimer(gameID string) {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	if tc, ok := tm.timers[gameID]; ok {
		tc.cancel()
		<-tc.done // Wait for cleanup
		delete(tm.timers, gameID)

		slog.Info("Turn timer cancelled",
			"gameId", gameID,
			"playerId", tc.playerID,
		)
	}
}

// GetRemaining returns the remaining time for a game's timer (in seconds)
// Returns -1 if no active timer
func (tm *TimerManager) GetRemaining(gameID string) int {
	tm.mu.RLock()
	defer tm.mu.RUnlock()

	tc, ok := tm.timers[gameID]
	if !ok {
		return -1
	}

	elapsed := time.Since(tc.started).Seconds()
	remaining := tc.duration - int(elapsed)
	if remaining < 0 {
		return 0
	}
	return remaining
}

// IsActive checks if a timer is active for a game
func (tm *TimerManager) IsActive(gameID string) bool {
	tm.mu.RLock()
	defer tm.mu.RUnlock()
	_, ok := tm.timers[gameID]
	return ok
}

// runTimer runs the timer countdown in a goroutine
func (tm *TimerManager) runTimer(ctx context.Context, tc *timerContext) {
	defer close(tc.done)

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			// Timer was cancelled
			slog.Debug("Timer cancelled",
				"gameId", tc.gameID,
				"playerId", tc.playerID,
			)
			return

		case <-ticker.C:
			elapsed := time.Since(tc.started).Seconds()
			remaining := tc.duration - int(elapsed)

			if remaining <= 0 {
				// Timer expired
				slog.Warn("Turn timer expired",
					"gameId", tc.gameID,
					"playerId", tc.playerID,
					"duration", tc.duration,
				)

				// Call expire callback
				if tm.onExpire != nil {
					tm.onExpire(tc.gameID, tc.playerID, 0)
				}

				// Clean up
				tm.mu.Lock()
				delete(tm.timers, tc.gameID)
				tm.mu.Unlock()

				return
			}

			// Call tick callback
			if tm.onTick != nil {
				tm.onTick(tc.gameID, tc.playerID, remaining)
			}

			// Log warnings at specific thresholds
			if remaining == 5 || remaining == 3 {
				slog.Info("Turn timer warning",
					"gameId", tc.gameID,
					"playerId", tc.playerID,
					"remaining", remaining,
				)
			}
		}
	}
}

// DetermineTimerDuration determines the appropriate timer duration based on turn order
// Leader gets 15s, second player gets 8s, others get 5s
func DetermineTimerDuration(isLeader bool, turnNumber int) int {
	if isLeader {
		return 15 // Leader gets 15 seconds
	}
	if turnNumber == 1 {
		return 8 // Second player (first non-leader) gets 8 seconds
	}
	return 5 // All other players get 5 seconds
}

// AutoPlayRandomCard selects a random valid card from a player's hand
// This is called when a timer expires
func AutoPlayRandomCard(player *entity.GamePlayer, ledSuit *entity.Suit) (*entity.Card, error) {
	if player == nil {
		return nil, fmt.Errorf("player is nil")
	}

	if len(player.Hand) == 0 {
		return nil, fmt.Errorf("player has no cards")
	}

	// If a suit has been led, prefer cards of that suit (but not required in Spar)
	var preferredCards []entity.Card
	var allCards []entity.Card

	for _, card := range player.Hand {
		allCards = append(allCards, card)
		if ledSuit != nil && card.Suit == *ledSuit {
			preferredCards = append(preferredCards, card)
		}
	}

	// If player has cards of the led suit, randomly pick one of those
	if len(preferredCards) > 0 {
		idx := rand.Intn(len(preferredCards))
		card := preferredCards[idx]
		slog.Info("Auto-play selected card from led suit",
			"playerId", player.ID,
			"card", card.String(),
			"ledSuit", *ledSuit,
		)
		return &card, nil
	}

	// Otherwise, pick any random card
	idx := rand.Intn(len(allCards))
	card := allCards[idx]
	slog.Info("Auto-play selected random card",
		"playerId", player.ID,
		"card", card.String(),
	)
	return &card, nil
}

// Cleanup stops all active timers (called on shutdown)
func (tm *TimerManager) Cleanup() {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	for gameID, tc := range tm.timers {
		tc.cancel()
		<-tc.done
		delete(tm.timers, gameID)
	}

	slog.Info("All turn timers cleaned up")
}
