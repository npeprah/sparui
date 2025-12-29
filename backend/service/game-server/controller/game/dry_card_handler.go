package game

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// DryCardHandler manages dry card declarations and bonuses for Spar games
// It validates declarations, tracks dry cards, and calculates bonus points
// All operations are thread-safe for concurrent access
type DryCardHandler struct {
	gameState *entity.GameState
	mu        sync.RWMutex
}

// NewDryCardHandler creates a new dry card handler
func NewDryCardHandler() *DryCardHandler {
	return &DryCardHandler{}
}

// SetGameState sets the game state for the handler
func (h *DryCardHandler) SetGameState(state *entity.GameState) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.gameState = state
}

// GetGameState returns the current game state (read-only)
func (h *DryCardHandler) GetGameState() *entity.GameState {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.gameState
}

// DeclareDry declares a dry card for a player
// A dry card must be a low card (6 or 7) that the player has in their hand
// Can be declared as hidden (3x multiplier) or shown (6x multiplier)
//
// Validation:
// - Game must be in declaring phase
// - Player must exist
// - Card must be valid and a low card (6 or 7)
// - Player must have the card in their hand
// - Player cannot have already declared a dry card
//
// Parameters:
// - ctx: Context for cancellation
// - playerID: ID of the player declaring dry
// - card: The card being declared as dry
// - isShown: Whether to show the card (true = shown/6x, false = hidden/3x)
//
// Returns error if validation fails
func (h *DryCardHandler) DeclareDry(ctx context.Context, playerID string, card *entity.Card, isShown bool) error {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Validate game state
	if h.gameState == nil {
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

	// Validate game phase - must be in declaring phase
	if h.gameState.Phase != entity.PhaseDeclaring {
		return fmt.Errorf("dry cards can only be declared during declaring phase, current phase: %s", h.gameState.Phase)
	}

	// Validate player exists
	player := h.gameState.GetPlayer(playerID)
	if player == nil {
		return fmt.Errorf("player not found: %s", playerID)
	}

	// Validate card is a low card (6 or 7)
	if !card.IsLowCard() {
		return fmt.Errorf("only low cards (6 or 7) can be declared as dry, got: %s", card.String())
	}

	// Validate player has the card in their hand
	if !player.HasCard(card) {
		return fmt.Errorf("player does not have card in hand: %s", card.String())
	}

	// Validate player hasn't already declared a dry card
	if player.DryCard != nil {
		return fmt.Errorf("player has already declared a dry card: %s", player.DryCard.Card.String())
	}

	// Create dry card declaration
	dryType := entity.DryHidden
	if isShown {
		dryType = entity.DryShown
	}

	player.DryCard = &entity.DryCard{
		Card:     *card,
		Type:     dryType,
		PlayerID: playerID,
	}

	// Update game state timestamp
	h.gameState.UpdatedAt = h.gameState.UpdatedAt // Preserve existing time or set new

	slog.Info("Dry card declared",
		"playerId", playerID,
		"username", player.Username,
		"card", card.String(),
		"type", dryType,
		"isShown", isShown,
	)

	return nil
}

// CalculateDryBonus calculates and returns the bonus points for a player's dry card
// Does NOT apply the bonus to the player's score - that's done by ScoreManager
//
// Bonus Points:
// - Hidden 6: 6 points
// - Hidden 7: 4 points
// - Shown 6: 12 points
// - Shown 7: 8 points
//
// Returns (bonus points, error)
func (h *DryCardHandler) CalculateDryBonus(playerID string) (int, error) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if h.gameState == nil {
		return 0, fmt.Errorf("game state not initialized")
	}

	if playerID == "" {
		return 0, fmt.Errorf("player ID cannot be empty")
	}

	// Find the player
	player := h.gameState.GetPlayer(playerID)
	if player == nil {
		return 0, fmt.Errorf("player not found: %s", playerID)
	}

	// Validate player has a dry card
	if player.DryCard == nil {
		return 0, fmt.Errorf("player has no dry card declared")
	}

	// Calculate bonus using the DryCard's built-in method
	bonus := player.DryCard.BonusPoints()

	slog.Info("Dry card bonus calculated",
		"playerId", playerID,
		"username", player.Username,
		"dryCard", player.DryCard.Card.String(),
		"dryType", player.DryCard.Type,
		"bonusPoints", bonus,
	)

	return bonus, nil
}

// ClearDryCard removes a player's dry card declaration
// Used when resetting game state or handling invalid declarations
func (h *DryCardHandler) ClearDryCard(playerID string) error {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.gameState == nil {
		return fmt.Errorf("game state not initialized")
	}

	if playerID == "" {
		return fmt.Errorf("player ID cannot be empty")
	}

	// Find the player
	player := h.gameState.GetPlayer(playerID)
	if player == nil {
		return fmt.Errorf("player not found: %s", playerID)
	}

	// Clear dry card
	player.DryCard = nil

	slog.Info("Dry card cleared",
		"playerId", playerID,
		"username", player.Username,
	)

	return nil
}

// HasDryCard checks if a player has declared a dry card
func (h *DryCardHandler) HasDryCard(playerID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if h.gameState == nil {
		return false
	}

	player := h.gameState.GetPlayer(playerID)
	if player == nil {
		return false
	}

	return player.DryCard != nil
}

// GetDryCard returns a player's dry card declaration (read-only copy)
// Returns nil if player has no dry card
func (h *DryCardHandler) GetDryCard(playerID string) *entity.DryCard {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if h.gameState == nil {
		return nil
	}

	player := h.gameState.GetPlayer(playerID)
	if player == nil {
		return nil
	}

	if player.DryCard == nil {
		return nil
	}

	// Return a copy to prevent external modification
	dryCopy := *player.DryCard
	return &dryCopy
}

// ValidateDryDeclaration validates if a player can declare a specific card as dry
// This is a read-only check that doesn't modify state
// Useful for UI validation before actual declaration
func (h *DryCardHandler) ValidateDryDeclaration(ctx context.Context, playerID string, card *entity.Card) error {
	h.mu.RLock()
	defer h.mu.RUnlock()

	// Validate game state
	if h.gameState == nil {
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
	if h.gameState.Phase != entity.PhaseDeclaring {
		return fmt.Errorf("dry cards can only be declared during declaring phase, current phase: %s", h.gameState.Phase)
	}

	// Validate player exists
	player := h.gameState.GetPlayer(playerID)
	if player == nil {
		return fmt.Errorf("player not found: %s", playerID)
	}

	// Validate card is a low card
	if !card.IsLowCard() {
		return fmt.Errorf("only low cards (6 or 7) can be declared as dry, got: %s", card.String())
	}

	// Validate player has the card
	if !player.HasCard(card) {
		return fmt.Errorf("player does not have card in hand: %s", card.String())
	}

	// Validate player hasn't already declared
	if player.DryCard != nil {
		return fmt.Errorf("player has already declared a dry card: %s", player.DryCard.Card.String())
	}

	return nil
}

// GetAllDryCards returns all dry card declarations for the game
// Useful for broadcasting state to all players
func (h *DryCardHandler) GetAllDryCards() map[string]*entity.DryCard {
	h.mu.RLock()
	defer h.mu.RUnlock()

	result := make(map[string]*entity.DryCard)

	if h.gameState == nil {
		return result
	}

	for _, player := range h.gameState.Players {
		if player.DryCard != nil {
			// Return copy to prevent external modification
			dryCopy := *player.DryCard
			result[player.ID] = &dryCopy
		}
	}

	return result
}

// ClearAllDryCards clears all dry card declarations
// Used when starting a new game or resetting state
func (h *DryCardHandler) ClearAllDryCards() {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.gameState == nil {
		return
	}

	count := 0
	for i := range h.gameState.Players {
		if h.gameState.Players[i].DryCard != nil {
			h.gameState.Players[i].DryCard = nil
			count++
		}
	}

	if count > 0 {
		slog.Info("All dry cards cleared",
			"gameId", h.gameState.GameID,
			"count", count,
		)
	}
}
