package game

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// BroadcastFunc is a function that broadcasts a message to clients in a game room
type BroadcastFunc func(roomCode string, event string, data interface{}) error

// StateBroadcaster manages periodic game state broadcasts to prevent desyncs
type StateBroadcaster struct {
	// Active broadcasters map: gameID -> broadcaster context
	broadcasters map[string]*broadcasterContext
	mu           sync.RWMutex

	// Broadcast function (injected dependency)
	broadcastFunc BroadcastFunc

	// Broadcast interval (default: 2 seconds)
	interval time.Duration
}

// broadcasterContext holds the state of an active broadcaster
type broadcasterContext struct {
	gameID   string
	roomCode string
	cancel   context.CancelFunc
	done     chan struct{}
}

// GameStateUpdate represents the full game state update message
type GameStateUpdate struct {
	GameID        string              `json:"gameId"`
	RoomCode      string              `json:"roomCode"`
	Phase         entity.GamePhase    `json:"phase"`
	CurrentRound  int                 `json:"currentRound"`
	TotalRounds   int                 `json:"totalRounds"`
	LeaderID      string              `json:"leaderId"`
	CurrentTurn   string              `json:"currentTurn"`
	LedSuit       *entity.Suit        `json:"ledSuit,omitempty"`
	Players       []PlayerStateUpdate `json:"players"`
	PlayedCards   []entity.PlayedCard `json:"playedCards"`
	TurnRemaining int                 `json:"turnRemaining"` // Seconds remaining in turn
	UpdatedAt     time.Time           `json:"updatedAt"`
}

// PlayerStateUpdate represents a player's state for broadcasting
type PlayerStateUpdate struct {
	ID            string          `json:"id"`
	Username      string          `json:"username"`
	Avatar        string          `json:"avatar"`
	HandCount     int             `json:"handCount"` // Don't reveal actual cards
	DryCard       *entity.DryCard `json:"dryCard,omitempty"`
	Score         int             `json:"score"`
	RoundsWon     int             `json:"roundsWon"`
	WinStreak     int             `json:"winStreak"`
	IsLeader      bool            `json:"isLeader"`
	IsOnFire      bool            `json:"isOnFire"`
	HasPlayedCard bool            `json:"hasPlayedCard"`
}

// NewStateBroadcaster creates a new state broadcaster
func NewStateBroadcaster(broadcastFunc BroadcastFunc, interval time.Duration) *StateBroadcaster {
	if interval == 0 {
		interval = 2 * time.Second // Default 2 seconds
	}

	return &StateBroadcaster{
		broadcasters:  make(map[string]*broadcasterContext),
		broadcastFunc: broadcastFunc,
		interval:      interval,
	}
}

// StartBroadcasting starts periodic game state broadcasts for a game
func (sb *StateBroadcaster) StartBroadcasting(ctx context.Context, gameID, roomCode string, getState func() *entity.GameState, getTurnRemaining func() int) error {
	sb.mu.Lock()
	defer sb.mu.Unlock()

	// Stop existing broadcaster if any
	if existing, ok := sb.broadcasters[gameID]; ok {
		existing.cancel()
		<-existing.done
	}

	// Create broadcaster context
	broadcastCtx, cancel := context.WithCancel(ctx)
	bc := &broadcasterContext{
		gameID:   gameID,
		roomCode: roomCode,
		cancel:   cancel,
		done:     make(chan struct{}),
	}

	sb.broadcasters[gameID] = bc

	// Start broadcaster goroutine
	go sb.runBroadcaster(broadcastCtx, bc, getState, getTurnRemaining)

	slog.Info("State broadcaster started",
		"gameId", gameID,
		"roomCode", roomCode,
		"interval", sb.interval,
	)

	return nil
}

// StopBroadcasting stops the broadcaster for a game
func (sb *StateBroadcaster) StopBroadcasting(gameID string) {
	sb.mu.Lock()
	defer sb.mu.Unlock()

	if bc, ok := sb.broadcasters[gameID]; ok {
		bc.cancel()
		<-bc.done
		delete(sb.broadcasters, gameID)

		slog.Info("State broadcaster stopped",
			"gameId", gameID,
			"roomCode", bc.roomCode,
		)
	}
}

// IsActive checks if a broadcaster is active for a game
func (sb *StateBroadcaster) IsActive(gameID string) bool {
	sb.mu.RLock()
	defer sb.mu.RUnlock()
	_, ok := sb.broadcasters[gameID]
	return ok
}

// BroadcastNow immediately broadcasts the current game state (for event-driven updates)
func (sb *StateBroadcaster) BroadcastNow(gameID, roomCode string, state *entity.GameState, turnRemaining int) error {
	if sb.broadcastFunc == nil {
		return fmt.Errorf("broadcast function not set")
	}

	update := sb.buildStateUpdate(state, turnRemaining)
	return sb.broadcastFunc(roomCode, "game:state_update", update)
}

// runBroadcaster runs the periodic broadcast loop
func (sb *StateBroadcaster) runBroadcaster(ctx context.Context, bc *broadcasterContext, getState func() *entity.GameState, getTurnRemaining func() int) {
	defer close(bc.done)

	ticker := time.NewTicker(sb.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			// Broadcaster was stopped
			slog.Debug("State broadcaster cancelled",
				"gameId", bc.gameID,
				"roomCode", bc.roomCode,
			)
			return

		case <-ticker.C:
			// Get current state
			state := getState()
			if state == nil {
				slog.Warn("Game state is nil, skipping broadcast",
					"gameId", bc.gameID,
				)
				continue
			}

			// Get turn remaining time
			turnRemaining := getTurnRemaining()

			// Build and broadcast update
			update := sb.buildStateUpdate(state, turnRemaining)

			err := sb.broadcastFunc(bc.roomCode, "game:state_update", update)
			if err != nil {
				slog.Error("Failed to broadcast game state",
					"gameId", bc.gameID,
					"roomCode", bc.roomCode,
					"error", err,
				)
			} else {
				slog.Debug("Game state broadcasted",
					"gameId", bc.gameID,
					"roomCode", bc.roomCode,
					"phase", state.Phase,
					"round", state.CurrentRound,
				)
			}
		}
	}
}

// buildStateUpdate builds a GameStateUpdate from the full game state
// This optimizes the payload by not sending complete player hands (only card counts)
func (sb *StateBroadcaster) buildStateUpdate(state *entity.GameState, turnRemaining int) *GameStateUpdate {
	players := make([]PlayerStateUpdate, len(state.Players))
	for i, p := range state.Players {
		players[i] = PlayerStateUpdate{
			ID:            p.ID,
			Username:      p.Username,
			Avatar:        p.Avatar,
			HandCount:     len(p.Hand), // Only send card count, not actual cards
			DryCard:       p.DryCard,
			Score:         p.Score,
			RoundsWon:     p.RoundsWon,
			WinStreak:     p.WinStreak,
			IsLeader:      p.IsLeader,
			IsOnFire:      p.IsOnFire,
			HasPlayedCard: p.HasPlayedCard,
		}
	}

	return &GameStateUpdate{
		GameID:        state.GameID,
		RoomCode:      state.RoomCode,
		Phase:         state.Phase,
		CurrentRound:  state.CurrentRound,
		TotalRounds:   state.TotalRounds,
		LeaderID:      state.LeaderID,
		CurrentTurn:   state.CurrentTurn,
		LedSuit:       state.LedSuit,
		Players:       players,
		PlayedCards:   state.PlayedCards,
		TurnRemaining: turnRemaining,
		UpdatedAt:     time.Now(),
	}
}

// Cleanup stops all active broadcasters (called on shutdown)
func (sb *StateBroadcaster) Cleanup() {
	sb.mu.Lock()
	defer sb.mu.Unlock()

	for gameID, bc := range sb.broadcasters {
		bc.cancel()
		<-bc.done
		delete(sb.broadcasters, gameID)
	}

	slog.Info("All state broadcasters cleaned up")
}

// BroadcastCardPlayed broadcasts a targeted update when a card is played
func BroadcastCardPlayed(broadcastFunc BroadcastFunc, roomCode string, playedCard *entity.PlayedCard) error {
	if broadcastFunc == nil {
		return fmt.Errorf("broadcast function not set")
	}

	if playedCard == nil {
		return fmt.Errorf("played card is nil")
	}

	slog.Info("Broadcasting card played event",
		"roomCode", roomCode,
		"playerId", playedCard.PlayerID,
		"card", playedCard.Card.String(),
	)

	return broadcastFunc(roomCode, "game:card_played", playedCard)
}

// BroadcastRoundWinner broadcasts a targeted update when a round ends
func BroadcastRoundWinner(broadcastFunc BroadcastFunc, roomCode string, data map[string]interface{}) error {
	if broadcastFunc == nil {
		return fmt.Errorf("broadcast function not set")
	}

	slog.Info("Broadcasting round winner event",
		"roomCode", roomCode,
		"winnerId", data["winnerId"],
	)

	return broadcastFunc(roomCode, "game:round_winner", data)
}

// BroadcastGameOver broadcasts a targeted update when the game ends
func BroadcastGameOver(broadcastFunc BroadcastFunc, roomCode string, data map[string]interface{}) error {
	if broadcastFunc == nil {
		return fmt.Errorf("broadcast function not set")
	}

	slog.Info("Broadcasting game over event",
		"roomCode", roomCode,
		"winnerId", data["winnerId"],
	)

	return broadcastFunc(roomCode, "game:over", data)
}

// MarshalJSON custom marshaller for GameStateUpdate to ensure proper JSON output
func (gsu *GameStateUpdate) MarshalJSON() ([]byte, error) {
	type Alias GameStateUpdate
	return json.Marshal(&struct {
		*Alias
	}{
		Alias: (*Alias)(gsu),
	})
}
