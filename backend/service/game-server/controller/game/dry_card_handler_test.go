package game

import (
	"context"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestDeclareDry_ValidHiddenDeclaration tests declaring a dry card without showing it
func TestDeclareDry_ValidHiddenDeclaration(t *testing.T) {
	handler := NewDryCardHandler()

	// Setup game state with player having a 6 of hearts
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Hearts, Value: entity.Six}

	// Player should have this card in hand
	gameState.Players[0].Hand = []entity.Card{*card}

	// Declare dry (hidden)
	err := handler.DeclareDry(context.Background(), playerID, card, false)
	if err != nil {
		t.Fatalf("Expected successful dry declaration, got error: %v", err)
	}

	// Verify dry card was set
	player := gameState.GetPlayer(playerID)
	if player.DryCard == nil {
		t.Fatal("Expected dry card to be set")
	}

	if player.DryCard.Type != entity.DryHidden {
		t.Errorf("Expected dry type %s, got %s", entity.DryHidden, player.DryCard.Type)
	}

	if !player.DryCard.Card.Equals(card) {
		t.Errorf("Expected dry card %s, got %s", card.String(), player.DryCard.Card.String())
	}
}

// TestDeclareDry_ValidShownDeclaration tests declaring a dry card with showing it
func TestDeclareDry_ValidShownDeclaration(t *testing.T) {
	handler := NewDryCardHandler()

	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Clubs, Value: entity.Seven}

	// Player should have this card in hand
	gameState.Players[0].Hand = []entity.Card{*card}

	// Declare dry (shown)
	err := handler.DeclareDry(context.Background(), playerID, card, true)
	if err != nil {
		t.Fatalf("Expected successful dry declaration, got error: %v", err)
	}

	// Verify dry card was set
	player := gameState.GetPlayer(playerID)
	if player.DryCard == nil {
		t.Fatal("Expected dry card to be set")
	}

	if player.DryCard.Type != entity.DryShown {
		t.Errorf("Expected dry type %s, got %s", entity.DryShown, player.DryCard.Type)
	}
}

// TestDeclareDry_InvalidPhase tests declaring dry in wrong game phase
func TestDeclareDry_InvalidPhase(t *testing.T) {
	tests := []struct {
		name  string
		phase entity.GamePhase
	}{
		{"waiting phase", entity.PhaseWaiting},
		{"playing phase", entity.PhasePlaying},
		{"round end phase", entity.PhaseRoundEnd},
		{"game over phase", entity.PhaseGameOver},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := NewDryCardHandler()
			gameState := createTestGameStateForDry(t)
			gameState.Phase = tt.phase
			handler.SetGameState(gameState)

			playerID := gameState.Players[0].ID
			card := &entity.Card{Suit: entity.Hearts, Value: entity.Six}
			gameState.Players[0].Hand = []entity.Card{*card}

			err := handler.DeclareDry(context.Background(), playerID, card, false)
			if err == nil {
				t.Errorf("Expected error for phase %s, got nil", tt.phase)
			}
		})
	}
}

// TestDeclareDry_PlayerNotFound tests declaring dry for non-existent player
func TestDeclareDry_PlayerNotFound(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	nonExistentPlayerID := "non-existent-player"
	card := &entity.Card{Suit: entity.Hearts, Value: entity.Six}

	err := handler.DeclareDry(context.Background(), nonExistentPlayerID, card, false)
	if err == nil {
		t.Error("Expected error for non-existent player, got nil")
	}
}

// TestDeclareDry_InvalidCard tests declaring non-low cards as dry
func TestDeclareDry_InvalidCard(t *testing.T) {
	tests := []struct {
		name string
		card entity.Card
	}{
		{"Eight", entity.Card{Suit: entity.Hearts, Value: entity.Eight}},
		{"Nine", entity.Card{Suit: entity.Clubs, Value: entity.Nine}},
		{"Ten", entity.Card{Suit: entity.Diamonds, Value: entity.Ten}},
		{"Jack", entity.Card{Suit: entity.Spades, Value: entity.Jack}},
		{"Queen", entity.Card{Suit: entity.Hearts, Value: entity.Queen}},
		{"King", entity.Card{Suit: entity.Clubs, Value: entity.King}},
		{"Ace", entity.Card{Suit: entity.Diamonds, Value: entity.Ace}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := NewDryCardHandler()
			gameState := createTestGameStateForDry(t)
			handler.SetGameState(gameState)

			playerID := gameState.Players[0].ID
			gameState.Players[0].Hand = []entity.Card{tt.card}

			err := handler.DeclareDry(context.Background(), playerID, &tt.card, false)
			if err == nil {
				t.Errorf("Expected error for non-low card %s, got nil", tt.card.String())
			}
		})
	}
}

// TestDeclareDry_CardNotInHand tests declaring a card player doesn't have
func TestDeclareDry_CardNotInHand(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Hearts, Value: entity.Six}

	// Player has different card
	gameState.Players[0].Hand = []entity.Card{
		{Suit: entity.Clubs, Value: entity.Seven},
	}

	err := handler.DeclareDry(context.Background(), playerID, card, false)
	if err == nil {
		t.Error("Expected error for card not in hand, got nil")
	}
}

// TestDeclareDry_DuplicateDeclaration tests declaring dry twice
func TestDeclareDry_DuplicateDeclaration(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Hearts, Value: entity.Six}
	gameState.Players[0].Hand = []entity.Card{*card}

	// First declaration should succeed
	err := handler.DeclareDry(context.Background(), playerID, card, false)
	if err != nil {
		t.Fatalf("First declaration should succeed, got: %v", err)
	}

	// Second declaration should fail
	err = handler.DeclareDry(context.Background(), playerID, card, false)
	if err == nil {
		t.Error("Expected error for duplicate declaration, got nil")
	}
}

// TestDeclareDry_NilCard tests declaring with nil card
func TestDeclareDry_NilCard(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID

	err := handler.DeclareDry(context.Background(), playerID, nil, false)
	if err == nil {
		t.Error("Expected error for nil card, got nil")
	}
}

// TestDeclareDry_InvalidSuit tests declaring card with invalid suit
func TestDeclareDry_InvalidSuit(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Suit("invalid"), Value: entity.Six}

	err := handler.DeclareDry(context.Background(), playerID, card, false)
	if err == nil {
		t.Error("Expected error for invalid suit, got nil")
	}
}

// TestCalculateDryBonus_HiddenSix tests bonus calculation for hidden 6
func TestCalculateDryBonus_HiddenSix(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Hearts, Value: entity.Six}
	gameState.Players[0].Hand = []entity.Card{*card}

	// Declare dry (hidden)
	err := handler.DeclareDry(context.Background(), playerID, card, false)
	if err != nil {
		t.Fatalf("Declaration failed: %v", err)
	}

	// Calculate bonus
	bonus, err := handler.CalculateDryBonus(playerID)
	if err != nil {
		t.Fatalf("Bonus calculation failed: %v", err)
	}

	// Hidden 6 should give 6 points
	expectedBonus := 6
	if bonus != expectedBonus {
		t.Errorf("Expected bonus %d, got %d", expectedBonus, bonus)
	}
}

// TestCalculateDryBonus_ShownSix tests bonus calculation for shown 6
func TestCalculateDryBonus_ShownSix(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Hearts, Value: entity.Six}
	gameState.Players[0].Hand = []entity.Card{*card}

	// Declare dry (shown)
	err := handler.DeclareDry(context.Background(), playerID, card, true)
	if err != nil {
		t.Fatalf("Declaration failed: %v", err)
	}

	// Calculate bonus
	bonus, err := handler.CalculateDryBonus(playerID)
	if err != nil {
		t.Fatalf("Bonus calculation failed: %v", err)
	}

	// Shown 6 should give 12 points
	expectedBonus := 12
	if bonus != expectedBonus {
		t.Errorf("Expected bonus %d, got %d", expectedBonus, bonus)
	}
}

// TestCalculateDryBonus_HiddenSeven tests bonus calculation for hidden 7
func TestCalculateDryBonus_HiddenSeven(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Clubs, Value: entity.Seven}
	gameState.Players[0].Hand = []entity.Card{*card}

	// Declare dry (hidden)
	err := handler.DeclareDry(context.Background(), playerID, card, false)
	if err != nil {
		t.Fatalf("Declaration failed: %v", err)
	}

	// Calculate bonus
	bonus, err := handler.CalculateDryBonus(playerID)
	if err != nil {
		t.Fatalf("Bonus calculation failed: %v", err)
	}

	// Hidden 7 should give 4 points
	expectedBonus := 4
	if bonus != expectedBonus {
		t.Errorf("Expected bonus %d, got %d", expectedBonus, bonus)
	}
}

// TestCalculateDryBonus_ShownSeven tests bonus calculation for shown 7
func TestCalculateDryBonus_ShownSeven(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Diamonds, Value: entity.Seven}
	gameState.Players[0].Hand = []entity.Card{*card}

	// Declare dry (shown)
	err := handler.DeclareDry(context.Background(), playerID, card, true)
	if err != nil {
		t.Fatalf("Declaration failed: %v", err)
	}

	// Calculate bonus
	bonus, err := handler.CalculateDryBonus(playerID)
	if err != nil {
		t.Fatalf("Bonus calculation failed: %v", err)
	}

	// Shown 7 should give 8 points
	expectedBonus := 8
	if bonus != expectedBonus {
		t.Errorf("Expected bonus %d, got %d", expectedBonus, bonus)
	}
}

// TestCalculateDryBonus_NoDryCard tests bonus calculation when no dry card declared
func TestCalculateDryBonus_NoDryCard(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID

	// No dry card declared
	_, err := handler.CalculateDryBonus(playerID)
	if err == nil {
		t.Error("Expected error for no dry card, got nil")
	}
}

// TestClearDryCard tests clearing a player's dry card declaration
func TestClearDryCard(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Hearts, Value: entity.Six}
	gameState.Players[0].Hand = []entity.Card{*card}

	// Declare dry
	err := handler.DeclareDry(context.Background(), playerID, card, false)
	if err != nil {
		t.Fatalf("Declaration failed: %v", err)
	}

	// Verify dry card is set
	player := gameState.GetPlayer(playerID)
	if player.DryCard == nil {
		t.Fatal("Expected dry card to be set")
	}

	// Clear dry card
	err = handler.ClearDryCard(playerID)
	if err != nil {
		t.Fatalf("Clear failed: %v", err)
	}

	// Verify dry card is cleared
	if player.DryCard != nil {
		t.Error("Expected dry card to be cleared")
	}
}

// TestHasDryCard tests checking if player has dry card
func TestHasDryCard(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDry(t)
	handler.SetGameState(gameState)

	playerID := gameState.Players[0].ID
	card := &entity.Card{Suit: entity.Hearts, Value: entity.Six}
	gameState.Players[0].Hand = []entity.Card{*card}

	// Initially no dry card
	if handler.HasDryCard(playerID) {
		t.Error("Expected no dry card initially")
	}

	// Declare dry
	err := handler.DeclareDry(context.Background(), playerID, card, false)
	if err != nil {
		t.Fatalf("Declaration failed: %v", err)
	}

	// Now should have dry card
	if !handler.HasDryCard(playerID) {
		t.Error("Expected to have dry card after declaration")
	}
}

// TestDeclareDry_ConcurrentDeclarations tests thread safety with concurrent declarations
func TestDeclareDry_ConcurrentDeclarations(t *testing.T) {
	handler := NewDryCardHandler()
	gameState := createTestGameStateForDryMulti(t, 4)
	handler.SetGameState(gameState)

	// Setup each player with a low card
	for i := range gameState.Players {
		card := entity.Card{
			Suit:  []entity.Suit{entity.Hearts, entity.Clubs, entity.Diamonds, entity.Spades}[i%4],
			Value: entity.Six,
		}
		gameState.Players[i].Hand = []entity.Card{card}
	}

	// Declare dry concurrently from all players
	done := make(chan bool, len(gameState.Players))
	for i := range gameState.Players {
		go func(idx int) {
			playerID := gameState.Players[idx].ID
			card := &gameState.Players[idx].Hand[0]
			err := handler.DeclareDry(context.Background(), playerID, card, false)
			if err != nil {
				t.Logf("Player %d declaration error: %v", idx, err)
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < len(gameState.Players); i++ {
		<-done
	}

	// Verify all players have dry cards
	for i := range gameState.Players {
		if gameState.Players[i].DryCard == nil {
			t.Errorf("Player %d should have dry card", i)
		}
	}
}

// Helper functions

func createTestGameStateForDry(t *testing.T) *entity.GameState {
	t.Helper()

	return &entity.GameState{
		GameID:       "test-game-dry-1",
		RoomCode:     "TEST01",
		TotalRounds:  5,
		PointsToWin:  10,
		Phase:        entity.PhaseDeclaring,
		CurrentRound: 1,
		Players: []entity.GamePlayer{
			{
				ID:       "player-1",
				Username: "Player One",
				Avatar:   "avatar1.png",
				Hand:     []entity.Card{},
				Score:    0,
			},
			{
				ID:       "player-2",
				Username: "Player Two",
				Avatar:   "avatar2.png",
				Hand:     []entity.Card{},
				Score:    0,
			},
		},
		LeaderID:      "player-1",
		CurrentTurn:   "player-1",
		StartedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		TurnStartTime: time.Now(),
		TurnTimeLimit: 15,
	}
}

func createTestGameStateForDryMulti(t *testing.T, playerCount int) *entity.GameState {
	t.Helper()

	gameState := &entity.GameState{
		GameID:        "test-game-dry-multi",
		RoomCode:      "TEST02",
		TotalRounds:   5,
		PointsToWin:   10,
		Phase:         entity.PhaseDeclaring,
		CurrentRound:  1,
		Players:       []entity.GamePlayer{},
		LeaderID:      "player-1",
		CurrentTurn:   "player-1",
		StartedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		TurnStartTime: time.Now(),
		TurnTimeLimit: 15,
	}

	for i := 1; i <= playerCount; i++ {
		player := entity.GamePlayer{
			ID:       "player-" + string(rune('0'+i)),
			Username: "Player " + string(rune('0'+i)),
			Avatar:   "avatar.png",
			Hand:     []entity.Card{},
			Score:    0,
		}
		gameState.Players = append(gameState.Players, player)
	}

	return gameState
}
