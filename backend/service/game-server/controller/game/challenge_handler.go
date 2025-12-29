package game

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

const (
	// ChallengeWindowSeconds is the time window after round completion during which challenges are allowed
	ChallengeWindowSeconds = 5

	// ChallengeBonusPoints is the bonus points awarded to challenger for valid challenge
	ChallengeBonusPoints = 10

	// ChallengePenaltyPoints is the penalty points deducted from challenger for invalid challenge
	ChallengePenaltyPoints = 5
)

// ChallengeHandler manages challenge/flag operations for suit-following violations
// It provides thread-safe operations for validating and resolving challenges
type ChallengeHandler struct {
	gameState *entity.GameState
	mu        sync.RWMutex

	// Track challenges to prevent duplicates (key: "roundIndex:challengerID:targetID")
	challenges  map[string]bool
	challengeMu sync.RWMutex
}

// ChallengeResult represents the outcome of a challenge
type ChallengeResult struct {
	ChallengerID   string      `json:"challengerId"`
	TargetID       string      `json:"targetId"`
	RoundIndex     int         `json:"roundIndex"`
	CardIndex      int         `json:"cardIndex"`
	IsValid        bool        `json:"isValid"`
	ViolatorID     string      `json:"violatorId,omitempty"`
	RequiredSuit   entity.Suit `json:"requiredSuit"`
	PlayedCard     entity.Card `json:"playedCard"`
	PointsAwarded  int         `json:"pointsAwarded"`
	PointsDeducted int         `json:"pointsDeducted"`
	Timestamp      time.Time   `json:"timestamp"`
	Message        string      `json:"message"`
}

// NewChallengeHandler creates a new challenge handler for the given game state
func NewChallengeHandler(gameState *entity.GameState) *ChallengeHandler {
	return &ChallengeHandler{
		gameState:  gameState,
		challenges: make(map[string]bool),
	}
}

// HandleChallenge processes a challenge from one player against another
// Returns the challenge result or an error if the challenge is invalid
//
// Parameters:
// - challengerID: ID of the player initiating the challenge
// - targetID: ID of the player being challenged
// - roundIndex: The round number being challenged (0-4 for Spar)
// - cardIndex: The index of the played card being challenged (0-n)
//
// Validation Steps:
// 1. Validate timing window (during round or within 5s after completion)
// 2. Check for duplicate challenges
// 3. Validate player IDs and game state
// 4. Reconstruct target player's hand at the moment of card play
// 5. Check if target player violated suit-following rules
// 6. Apply appropriate point awards/penalties
// 7. Record challenge in game state
func (ch *ChallengeHandler) HandleChallenge(ctx context.Context, challengerID, targetID string, roundIndex, cardIndex int) (*ChallengeResult, error) {
	ch.mu.Lock()
	defer ch.mu.Unlock()

	if ch.gameState == nil {
		return nil, fmt.Errorf("game state not initialized")
	}

	// Step 1: Validate basic parameters
	if err := ch.validateBasicParameters(challengerID, targetID, roundIndex, cardIndex); err != nil {
		return nil, err
	}

	// Step 2: Validate timing window
	if err := ch.validateTimingWindow(); err != nil {
		return nil, err
	}

	// Step 3: Check for duplicate challenges
	if err := ch.checkDuplicateChallenge(challengerID, targetID, roundIndex); err != nil {
		return nil, err
	}

	// Step 4: Get the played card being challenged
	if cardIndex >= len(ch.gameState.PlayedCards) {
		return nil, fmt.Errorf("invalid card index: %d (only %d cards played)", cardIndex, len(ch.gameState.PlayedCards))
	}

	playedCard := ch.gameState.PlayedCards[cardIndex]

	// Verify the played card belongs to the target player
	if playedCard.PlayerID != targetID {
		return nil, fmt.Errorf("card at index %d was not played by target player %s", cardIndex, targetID)
	}

	// Step 5: Check if there's a led suit to validate against
	if ch.gameState.LedSuit == nil {
		return nil, fmt.Errorf("no led suit set for this round")
	}

	ledSuit := *ch.gameState.LedSuit

	// If the played card matches the led suit, it cannot be a violation
	if playedCard.Card.Suit == ledSuit {
		// Invalid challenge - player followed the led suit correctly
		result := ch.createInvalidChallengeResult(challengerID, targetID, roundIndex, cardIndex, playedCard, ledSuit)
		ch.applyInvalidChallengeOutcome(ch.gameState, challengerID, targetID)
		ch.recordChallenge(challengerID, targetID, roundIndex)

		slog.Info("Challenge resolved - invalid (player followed suit)",
			"challengerId", challengerID,
			"targetId", targetID,
			"roundIndex", roundIndex,
			"cardIndex", cardIndex,
		)

		return result, nil
	}

	// Step 6: Reconstruct target player's hand at the moment of the challenged card play
	targetPlayer := ch.gameState.GetPlayer(targetID)
	if targetPlayer == nil {
		return nil, fmt.Errorf("target player not found: %s", targetID)
	}

	// Get all cards played by target player up to (but not including) the challenged card
	playedByTarget := ch.getCardsPlayedByPlayerBeforeIndex(targetID, cardIndex)

	// Reconstruct the hand the player had when they played the challenged card
	reconstructedHand := ch.reconstructPlayerHand(targetPlayer.Hand, playedByTarget, len(playedByTarget))

	// Step 7: Check if reconstructed hand had the led suit
	hadLedSuit := ch.handHasSuit(reconstructedHand, ledSuit)

	// Step 8: Determine if this is a valid challenge
	if hadLedSuit {
		// Valid challenge - player had led suit but played different suit (violation!)
		result := ch.createValidChallengeResult(challengerID, targetID, roundIndex, cardIndex, playedCard, ledSuit)
		ch.applyValidChallengeOutcome(ch.gameState, challengerID, targetID)
		ch.recordChallenge(challengerID, targetID, roundIndex)

		slog.Info("Challenge resolved - valid (suit violation detected)",
			"challengerId", challengerID,
			"targetId", targetID,
			"roundIndex", roundIndex,
			"cardIndex", cardIndex,
			"ledSuit", ledSuit,
			"playedSuit", playedCard.Card.Suit,
		)

		return result, nil
	}

	// Invalid challenge - player didn't have led suit, so playing different suit is legal
	result := ch.createInvalidChallengeResult(challengerID, targetID, roundIndex, cardIndex, playedCard, ledSuit)
	ch.applyInvalidChallengeOutcome(ch.gameState, challengerID, targetID)
	ch.recordChallenge(challengerID, targetID, roundIndex)

	slog.Info("Challenge resolved - invalid (player didn't have led suit)",
		"challengerId", challengerID,
		"targetId", targetID,
		"roundIndex", roundIndex,
		"cardIndex", cardIndex,
	)

	return result, nil
}

// validateBasicParameters validates the basic challenge parameters
func (ch *ChallengeHandler) validateBasicParameters(challengerID, targetID string, roundIndex, cardIndex int) error {
	// Validate game phase
	if ch.gameState.Phase == entity.PhaseGameOver {
		return fmt.Errorf("game is over, challenges not allowed")
	}

	if ch.gameState.Phase == entity.PhaseWaiting || ch.gameState.Phase == entity.PhaseDeclaring {
		return fmt.Errorf("cannot challenge during %s phase", ch.gameState.Phase)
	}

	// Validate player IDs
	if challengerID == "" {
		return fmt.Errorf("challenger ID cannot be empty")
	}

	if targetID == "" {
		return fmt.Errorf("target ID cannot be empty")
	}

	if challengerID == targetID {
		return fmt.Errorf("cannot challenge own card")
	}

	// Validate players exist
	challenger := ch.gameState.GetPlayer(challengerID)
	if challenger == nil {
		return fmt.Errorf("challenger player not found: %s", challengerID)
	}

	target := ch.gameState.GetPlayer(targetID)
	if target == nil {
		return fmt.Errorf("target player not found: %s", targetID)
	}

	// Validate round index
	if roundIndex < 0 || roundIndex >= ch.gameState.TotalRounds {
		return fmt.Errorf("invalid round index: %d (must be 0-%d)", roundIndex, ch.gameState.TotalRounds-1)
	}

	// Can only challenge current or just-completed round
	if roundIndex > ch.gameState.CurrentRound {
		return fmt.Errorf("cannot challenge future round: %d (current round: %d)", roundIndex, ch.gameState.CurrentRound)
	}

	// Validate card index
	if cardIndex < 0 {
		return fmt.Errorf("invalid card index: %d", cardIndex)
	}

	return nil
}

// validateTimingWindow validates that the challenge is within the allowed time window
func (ch *ChallengeHandler) validateTimingWindow() error {
	// If round is still in progress (PhasePlaying), challenge is valid
	if ch.gameState.Phase == entity.PhasePlaying {
		return nil
	}

	// If round just ended (PhaseRoundEnd), check if within 5-second window
	if ch.gameState.Phase == entity.PhaseRoundEnd {
		elapsed := time.Since(ch.gameState.UpdatedAt)
		if elapsed >= ChallengeWindowSeconds*time.Second {
			return fmt.Errorf("challenge window expired: %v since round end (limit: %ds)", elapsed, ChallengeWindowSeconds)
		}
		return nil
	}

	return nil
}

// checkDuplicateChallenge checks if this challenge has already been made
func (ch *ChallengeHandler) checkDuplicateChallenge(challengerID, targetID string, roundIndex int) error {
	ch.challengeMu.Lock()
	defer ch.challengeMu.Unlock()

	key := fmt.Sprintf("%d:%s:%s", roundIndex, challengerID, targetID)
	if ch.challenges[key] {
		return fmt.Errorf("player %s already challenged player %s in round %d", challengerID, targetID, roundIndex)
	}

	return nil
}

// recordChallenge records that a challenge has been made
func (ch *ChallengeHandler) recordChallenge(challengerID, targetID string, roundIndex int) {
	ch.challengeMu.Lock()
	defer ch.challengeMu.Unlock()

	key := fmt.Sprintf("%d:%s:%s", roundIndex, challengerID, targetID)
	ch.challenges[key] = true
}

// getCardsPlayedByPlayerBeforeIndex gets all cards played by a specific player before a given card index
func (ch *ChallengeHandler) getCardsPlayedByPlayerBeforeIndex(playerID string, beforeIndex int) []entity.Card {
	var cards []entity.Card

	for i := 0; i < beforeIndex && i < len(ch.gameState.PlayedCards); i++ {
		playedCard := ch.gameState.PlayedCards[i]
		if playedCard.PlayerID == playerID {
			cards = append(cards, playedCard.Card)
		}
	}

	return cards
}

// reconstructPlayerHand reconstructs what cards a player had at a specific point in time
// This is critical for challenge validation - we need to know what cards the player had
// when they made the play being challenged.
//
// Algorithm:
// 1. Start with current hand
// 2. Add back all cards the player has played in this round (including the challenged card)
// 3. Remove cards played BEFORE the challenged card
// 4. This gives us the hand the player had when they played the challenged card
//
// Parameters:
// - currentHand: The player's current hand (after cards have been removed)
// - playedCards: Cards the player played in the round (including challenged card)
// - atCardIndex: The position in the played cards we're reconstructing to
//
// Returns: The reconstructed hand the player had at that moment
func (ch *ChallengeHandler) reconstructPlayerHand(currentHand []entity.Card, playedCards []entity.Card, atCardIndex int) []entity.Card {
	// Start with a copy of the current hand
	reconstructed := make([]entity.Card, len(currentHand))
	copy(reconstructed, currentHand)

	// Add back ALL cards the player played in this round (including the challenged card)
	reconstructed = append(reconstructed, playedCards...)

	// Now remove cards played BEFORE the challenged card (but keep the challenged card itself)
	// atCardIndex represents how many cards were played before the one we're checking
	// We want the hand at the moment just BEFORE playing the challenged card
	// So we need to add back cards from atCardIndex onwards
	// Actually, the simpler approach: start with current hand + all played cards,
	// then remove the cards we want to exclude

	// Let's reconsider: if atCardIndex is 0, we want the initial hand (current + all played)
	// if atCardIndex is 1, we want initial hand minus first played card
	// if atCardIndex is 2, we want initial hand minus first two played cards

	// Clearer implementation:
	// 1. Reconstruct initial hand by adding back all played cards
	// 2. Remove the cards played before atCardIndex

	initialHand := make([]entity.Card, len(currentHand))
	copy(initialHand, currentHand)
	initialHand = append(initialHand, playedCards...)

	// Now remove cards played before atCardIndex
	for i := 0; i < atCardIndex && i < len(playedCards); i++ {
		// Find and remove this card from initialHand
		for j, card := range initialHand {
			if card.Equals(&playedCards[i]) {
				initialHand = append(initialHand[:j], initialHand[j+1:]...)
				break
			}
		}
	}

	return initialHand
}

// handHasSuit checks if a hand contains any card of the specified suit
func (ch *ChallengeHandler) handHasSuit(hand []entity.Card, suit entity.Suit) bool {
	for _, card := range hand {
		if card.Suit == suit {
			return true
		}
	}
	return false
}

// createValidChallengeResult creates a result object for a valid challenge
func (ch *ChallengeHandler) createValidChallengeResult(challengerID, targetID string, roundIndex, cardIndex int, playedCard entity.PlayedCard, ledSuit entity.Suit) *ChallengeResult {
	return &ChallengeResult{
		ChallengerID:   challengerID,
		TargetID:       targetID,
		RoundIndex:     roundIndex,
		CardIndex:      cardIndex,
		IsValid:        true,
		ViolatorID:     targetID,
		RequiredSuit:   ledSuit,
		PlayedCard:     playedCard.Card,
		PointsAwarded:  ChallengeBonusPoints,
		PointsDeducted: 0,
		Timestamp:      time.Now(),
		Message:        fmt.Sprintf("Valid challenge! Player %s violated suit-following rules", targetID),
	}
}

// createInvalidChallengeResult creates a result object for an invalid challenge
func (ch *ChallengeHandler) createInvalidChallengeResult(challengerID, targetID string, roundIndex, cardIndex int, playedCard entity.PlayedCard, ledSuit entity.Suit) *ChallengeResult {
	return &ChallengeResult{
		ChallengerID:   challengerID,
		TargetID:       targetID,
		RoundIndex:     roundIndex,
		CardIndex:      cardIndex,
		IsValid:        false,
		ViolatorID:     "",
		RequiredSuit:   ledSuit,
		PlayedCard:     playedCard.Card,
		PointsAwarded:  0,
		PointsDeducted: ChallengePenaltyPoints,
		Timestamp:      time.Now(),
		Message:        fmt.Sprintf("Invalid challenge! Player %s followed rules correctly", targetID),
	}
}

// applyValidChallengeOutcome applies point adjustments for a valid challenge
// - Challenger receives bonus points
// - Violator loses all points earned in that round (for now, we just deduct points)
func (ch *ChallengeHandler) applyValidChallengeOutcome(gameState *entity.GameState, challengerID, violatorID string) {
	challenger := gameState.GetPlayer(challengerID)
	violator := gameState.GetPlayer(violatorID)

	if challenger != nil {
		challenger.Score += ChallengeBonusPoints
		slog.Info("Challenge bonus awarded",
			"playerId", challengerID,
			"username", challenger.Username,
			"bonusPoints", ChallengeBonusPoints,
			"newScore", challenger.Score,
		)
	}

	if violator != nil {
		// Violator loses all points for that round
		// In Spar, rounds award 1 point, so we deduct the round win points
		// For simplicity, we set their score to 0 for this round's contribution
		oldScore := violator.Score
		violator.Score = 0
		slog.Info("Challenge penalty applied to violator",
			"playerId", violatorID,
			"username", violator.Username,
			"oldScore", oldScore,
			"newScore", violator.Score,
		)
	}
}

// applyInvalidChallengeOutcome applies point penalties for an invalid challenge
// - Challenger receives penalty points (deducted from score)
// - Target player is unaffected
func (ch *ChallengeHandler) applyInvalidChallengeOutcome(gameState *entity.GameState, challengerID, targetID string) {
	challenger := gameState.GetPlayer(challengerID)

	if challenger != nil {
		challenger.Score -= ChallengePenaltyPoints
		slog.Info("Challenge penalty applied to challenger",
			"playerId", challengerID,
			"username", challenger.Username,
			"penaltyPoints", ChallengePenaltyPoints,
			"newScore", challenger.Score,
		)
	}
}

// GetChallengeHistory returns all challenges made in the game (for analytics/dispute resolution)
func (ch *ChallengeHandler) GetChallengeHistory() []string {
	ch.challengeMu.RLock()
	defer ch.challengeMu.RUnlock()

	history := make([]string, 0, len(ch.challenges))
	for key := range ch.challenges {
		history = append(history, key)
	}

	return history
}

// ResetChallengesForRound resets challenges when a new round starts
// This allows players to make new challenges in the new round
func (ch *ChallengeHandler) ResetChallengesForRound(roundIndex int) {
	ch.challengeMu.Lock()
	defer ch.challengeMu.Unlock()

	// Remove challenges from previous rounds to save memory
	// Keep challenges from current round for duplicate detection
	newChallenges := make(map[string]bool)
	currentRoundPrefix := fmt.Sprintf("%d:", roundIndex)

	for key, value := range ch.challenges {
		if len(key) > 0 && key[0:len(currentRoundPrefix)] == currentRoundPrefix {
			newChallenges[key] = value
		}
	}

	ch.challenges = newChallenges

	slog.Info("Challenges reset for new round", "roundIndex", roundIndex)
}
