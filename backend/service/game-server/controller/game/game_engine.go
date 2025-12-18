package game

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// Engine is the core game logic engine for Spar
// It validates player actions, enforces game rules, and manages game state
type Engine struct {
	state *entity.GameState
	mu    sync.RWMutex
}

// NewEngine creates a new game engine
func NewEngine() *Engine {
	return &Engine{
		state: nil,
	}
}

// SetGameState sets the current game state
func (e *Engine) SetGameState(state *entity.GameState) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.state = state
}

// GetGameState returns the current game state (read-only copy)
func (e *Engine) GetGameState() *entity.GameState {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.state
}

// ValidateCardPlay validates if a player can play a specific card
// This is the main validation entry point for card plays
func (e *Engine) ValidateCardPlay(ctx context.Context, playerID string, card *entity.Card) error {
	e.mu.RLock()
	defer e.mu.RUnlock()

	if e.state == nil {
		return fmt.Errorf("game state not initialized")
	}

	// Validate card is not nil
	if card == nil {
		return fmt.Errorf("card cannot be nil")
	}

	// Validate card is valid
	if !card.IsValid() {
		return fmt.Errorf("invalid card: %s", card.String())
	}

	// Validate game phase
	if e.state.Phase != entity.PhasePlaying {
		return fmt.Errorf("game is not in playing phase: %s", e.state.Phase)
	}

	// Validate player exists
	player := e.state.GetPlayer(playerID)
	if player == nil {
		return fmt.Errorf("player not found: %s", playerID)
	}

	// Validate turn order
	if err := e.validateTurnOrderInternal(playerID); err != nil {
		return err
	}

	// Validate player hasn't already played this round
	if player.HasPlayedCard {
		return fmt.Errorf("player has already played this round")
	}

	// Validate card ownership
	if !player.HasCard(card) {
		return fmt.Errorf("player does not have card: %s", card.String())
	}

	// Validate timer hasn't expired
	if err := e.validateTimerInternal(); err != nil {
		return err
	}

	return nil
}

// ValidateSuitFollowing checks if a player is violating suit following rules
// Returns (violation, canChallenge)
// - violation: true if player has led suit but plays different suit
// - canChallenge: true if other players can challenge this play
func (e *Engine) ValidateSuitFollowing(ctx context.Context, playerID string, card *entity.Card) (bool, bool) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	if e.state == nil || card == nil {
		return false, false
	}

	// If no suit has been led yet (leader plays first), no violation possible
	if e.state.LedSuit == nil {
		return false, false
	}

	ledSuit := *e.state.LedSuit
	player := e.state.GetPlayer(playerID)
	if player == nil {
		return false, false
	}

	// If player plays the led suit, no violation
	if card.Suit == ledSuit {
		return false, false
	}

	// If player doesn't have any cards of the led suit, no violation
	if !player.HasSuit(ledSuit) {
		return false, false
	}

	// Player has led suit but played a different suit - this is a violation!
	// Other players can challenge this
	slog.Warn("Suit following violation detected",
		"playerId", playerID,
		"ledSuit", ledSuit,
		"playedSuit", card.Suit,
		"playedCard", card.String(),
	)

	return true, true
}

// ValidateTurnOrder validates if it's a player's turn
func (e *Engine) ValidateTurnOrder(ctx context.Context, playerID string) error {
	e.mu.RLock()
	defer e.mu.RUnlock()

	return e.validateTurnOrderInternal(playerID)
}

// validateTurnOrderInternal is the internal turn order validation (no locking)
func (e *Engine) validateTurnOrderInternal(playerID string) error {
	if e.state == nil {
		return fmt.Errorf("game state not initialized")
	}
	if e.state.CurrentTurn != playerID {
		return fmt.Errorf("not player's turn: current turn is %s", e.state.CurrentTurn)
	}
	return nil
}

// validateTimerInternal checks if the turn timer has expired (no locking)
func (e *Engine) validateTimerInternal() error {
	elapsed := time.Since(e.state.TurnStartTime)
	timeLimit := time.Duration(e.state.TurnTimeLimit) * time.Second

	if elapsed > timeLimit {
		return fmt.Errorf("turn timer expired: elapsed %v, limit %v", elapsed, timeLimit)
	}

	return nil
}

// PlayCard executes a card play action
// This is the main action method that modifies game state
func (e *Engine) PlayCard(ctx context.Context, playerID string, card *entity.Card) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.state == nil {
		return fmt.Errorf("game state not initialized")
	}

	// Validate the card play (without lock since we already have it)
	if card == nil {
		return fmt.Errorf("card cannot be nil")
	}

	if !card.IsValid() {
		return fmt.Errorf("invalid card: %s", card.String())
	}

	if e.state.Phase != entity.PhasePlaying {
		return fmt.Errorf("game is not in playing phase: %s", e.state.Phase)
	}

	player := e.state.GetPlayer(playerID)
	if player == nil {
		return fmt.Errorf("player not found: %s", playerID)
	}

	if err := e.validateTurnOrderInternal(playerID); err != nil {
		return err
	}

	if player.HasPlayedCard {
		return fmt.Errorf("player has already played this round")
	}

	if !player.HasCard(card) {
		return fmt.Errorf("player does not have card: %s", card.String())
	}

	if err := e.validateTimerInternal(); err != nil {
		return err
	}

	// Execute the card play
	// 1. Set led suit if this is the first card played
	if e.state.LedSuit == nil {
		e.state.LedSuit = &card.Suit
		slog.Info("Led suit set", "suit", card.Suit, "playerId", playerID)
	}

	// 2. Remove card from player's hand
	if !player.RemoveCard(card) {
		return fmt.Errorf("failed to remove card from player's hand")
	}

	// 3. Mark player as having played
	player.HasPlayedCard = true
	player.LastPlayedCard = card
	player.PlayedAt = time.Now()

	// 4. Add card to played cards
	playedCard := entity.PlayedCard{
		Card:     *card,
		PlayerID: playerID,
		PlayedAt: time.Now(),
		IsOnFire: player.IsOnFire,
		IsFrozen: false, // Will be set if this breaks a fire streak
	}
	e.state.PlayedCards = append(e.state.PlayedCards, playedCard)

	// 5. Update game state timestamp
	e.state.UpdatedAt = time.Now()

	// 6. Advance to next player's turn
	e.advanceTurnInternal()

	slog.Info("Card played successfully",
		"playerId", playerID,
		"card", card.String(),
		"playedCardsCount", len(e.state.PlayedCards),
		"nextTurn", e.state.CurrentTurn,
	)

	return nil
}

// AdvanceTurn moves to the next player's turn
func (e *Engine) AdvanceTurn(ctx context.Context) {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.advanceTurnInternal()
}

// advanceTurnInternal advances the turn to the next player (no locking)
func (e *Engine) advanceTurnInternal() {
	if e.state == nil {
		return
	}

	// Get next player
	nextPlayer := e.state.GetNextPlayer()
	if nextPlayer == nil {
		// No next player (all have played or round is over)
		e.state.CurrentTurn = ""
		return
	}

	// Update current turn
	e.state.CurrentTurn = nextPlayer.ID

	// Reset turn timer
	e.state.TurnStartTime = time.Now()

	// Set time limit based on position
	if nextPlayer.IsLeader {
		e.state.TurnTimeLimit = 15 // Leader gets 15 seconds
	} else if len(e.state.PlayedCards) == 1 {
		e.state.TurnTimeLimit = 8 // Second player gets 8 seconds
	} else {
		e.state.TurnTimeLimit = 5 // Remaining players get 5 seconds
	}

	slog.Info("Turn advanced",
		"nextPlayer", nextPlayer.ID,
		"username", nextPlayer.Username,
		"timeLimit", e.state.TurnTimeLimit,
	)
}

// ValidateGamePhase checks if the game is in a valid phase for actions
func (e *Engine) ValidateGamePhase(ctx context.Context, requiredPhase entity.GamePhase) error {
	e.mu.RLock()
	defer e.mu.RUnlock()

	if e.state == nil {
		return fmt.Errorf("game state not initialized")
	}

	if e.state.Phase != requiredPhase {
		return fmt.Errorf("invalid game phase: expected %s, got %s", requiredPhase, e.state.Phase)
	}

	return nil
}

// IsRoundComplete checks if all players have played their cards
func (e *Engine) IsRoundComplete() bool {
	e.mu.RLock()
	defer e.mu.RUnlock()

	if e.state == nil {
		return false
	}

	return e.state.AllPlayersPlayed()
}

// GetCurrentTurn returns the player ID whose turn it is
func (e *Engine) GetCurrentTurn() string {
	e.mu.RLock()
	defer e.mu.RUnlock()

	if e.state == nil {
		return ""
	}

	return e.state.CurrentTurn
}

// GetLedSuit returns the suit that was led this round
func (e *Engine) GetLedSuit() *entity.Suit {
	e.mu.RLock()
	defer e.mu.RUnlock()

	if e.state == nil {
		return nil
	}

	return e.state.LedSuit
}

// GetPlayedCards returns all cards played this round
func (e *Engine) GetPlayedCards() []entity.PlayedCard {
	e.mu.RLock()
	defer e.mu.RUnlock()

	if e.state == nil {
		return nil
	}

	// Return a copy to prevent external modification
	cards := make([]entity.PlayedCard, len(e.state.PlayedCards))
	copy(cards, e.state.PlayedCards)
	return cards
}

// UpdateGameState updates the game state with a new state
// This should be used carefully as it replaces the entire state
func (e *Engine) UpdateGameState(ctx context.Context, state *entity.GameState) {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.state = state
	slog.Info("Game state updated",
		"gameId", state.GameID,
		"phase", state.Phase,
		"round", state.CurrentRound,
	)
}
