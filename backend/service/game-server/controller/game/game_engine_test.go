package game

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestValidateCardPlay tests card play validation
func TestValidateCardPlay(t *testing.T) {
	tests := []struct {
		name        string
		setupState  func() *entity.GameState
		playerID    string
		card        *entity.Card
		expectError bool
		errorMsg    string
	}{
		{
			name: "valid card play - leader plays first",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhasePlaying,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					Players: []entity.GamePlayer{
						{
							ID:       "player-1",
							Username: "Alice",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.Ace},
								{Suit: entity.Clubs, Value: entity.King},
							},
							IsLeader:      true,
							HasPlayedCard: false,
						},
					},
					PlayedCards:   []entity.PlayedCard{},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 15,
				}
			},
			playerID:    "player-1",
			card:        &entity.Card{Suit: entity.Hearts, Value: entity.Ace},
			expectError: false,
		},
		{
			name: "invalid - player doesn't have card",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhasePlaying,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					Players: []entity.GamePlayer{
						{
							ID:       "player-1",
							Username: "Alice",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.Ace},
							},
							IsLeader:      true,
							HasPlayedCard: false,
						},
					},
					PlayedCards:   []entity.PlayedCard{},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 15,
				}
			},
			playerID:    "player-1",
			card:        &entity.Card{Suit: entity.Spades, Value: entity.King},
			expectError: true,
			errorMsg:    "player does not have card",
		},
		{
			name: "invalid - not player's turn",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhasePlaying,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					Players: []entity.GamePlayer{
						{
							ID:            "player-1",
							Username:      "Alice",
							Hand:          []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}},
							IsLeader:      true,
							HasPlayedCard: false,
						},
						{
							ID:            "player-2",
							Username:      "Bob",
							Hand:          []entity.Card{{Suit: entity.Clubs, Value: entity.King}},
							IsLeader:      false,
							HasPlayedCard: false,
						},
					},
					PlayedCards:   []entity.PlayedCard{},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 15,
				}
			},
			playerID:    "player-2",
			card:        &entity.Card{Suit: entity.Clubs, Value: entity.King},
			expectError: true,
			errorMsg:    "not player's turn",
		},
		{
			name: "invalid - player already played this round",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhasePlaying,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					Players: []entity.GamePlayer{
						{
							ID:            "player-1",
							Username:      "Alice",
							Hand:          []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}},
							IsLeader:      true,
							HasPlayedCard: true, // Already played
						},
					},
					PlayedCards: []entity.PlayedCard{
						{
							PlayerID: "player-1",
							Card:     entity.Card{Suit: entity.Hearts, Value: entity.King},
							PlayedAt: time.Now(),
						},
					},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 15,
				}
			},
			playerID:    "player-1",
			card:        &entity.Card{Suit: entity.Hearts, Value: entity.Ace},
			expectError: true,
			errorMsg:    "player has already played this round",
		},
		{
			name: "invalid - game not in playing phase",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhaseWaiting,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					Players: []entity.GamePlayer{
						{
							ID:       "player-1",
							Username: "Alice",
							Hand:     []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}},
							IsLeader: true,
						},
					},
					PlayedCards:   []entity.PlayedCard{},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 15,
				}
			},
			playerID:    "player-1",
			card:        &entity.Card{Suit: entity.Hearts, Value: entity.Ace},
			expectError: true,
			errorMsg:    "game is not in playing phase",
		},
		{
			name: "invalid - turn timer expired",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhasePlaying,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					Players: []entity.GamePlayer{
						{
							ID:       "player-1",
							Username: "Alice",
							Hand:     []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}},
							IsLeader: true,
						},
					},
					PlayedCards:   []entity.PlayedCard{},
					TurnStartTime: time.Now().Add(-20 * time.Second), // 20 seconds ago
					TurnTimeLimit: 15,                                 // 15 second limit
				}
			},
			playerID:    "player-1",
			card:        &entity.Card{Suit: entity.Hearts, Value: entity.Ace},
			expectError: true,
			errorMsg:    "turn timer expired",
		},
		{
			name: "invalid - nil card",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhasePlaying,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					Players: []entity.GamePlayer{
						{
							ID:       "player-1",
							Username: "Alice",
							Hand:     []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}},
							IsLeader: true,
						},
					},
					PlayedCards:   []entity.PlayedCard{},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 15,
				}
			},
			playerID:    "player-1",
			card:        nil,
			expectError: true,
			errorMsg:    "card cannot be nil",
		},
		{
			name: "invalid - player not found",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhasePlaying,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					Players: []entity.GamePlayer{
						{
							ID:       "player-1",
							Username: "Alice",
							Hand:     []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}},
							IsLeader: true,
						},
					},
					PlayedCards:   []entity.PlayedCard{},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 15,
				}
			},
			playerID:    "player-999",
			card:        &entity.Card{Suit: entity.Hearts, Value: entity.Ace},
			expectError: true,
			errorMsg:    "player not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			engine := NewEngine()
			state := tt.setupState()
			engine.SetGameState(state)

			err := engine.ValidateCardPlay(context.Background(), tt.playerID, tt.card)

			if tt.expectError {
				if err == nil {
					t.Errorf("expected error containing '%s', got nil", tt.errorMsg)
				} else if tt.errorMsg != "" && !contains(err.Error(), tt.errorMsg) {
					t.Errorf("expected error containing '%s', got '%s'", tt.errorMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("expected no error, got: %v", err)
				}
			}
		})
	}
}

// TestValidateSuitFollowing tests suit following validation
func TestValidateSuitFollowing(t *testing.T) {
	tests := []struct {
		name               string
		setupState         func() *entity.GameState
		playerID           string
		card               *entity.Card
		expectViolation    bool
		expectCanChallenge bool
	}{
		{
			name: "no violation - leader plays first (sets led suit)",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					CurrentRound: 1,
					Phase:        entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{
							ID:       "player-1",
							Username: "Alice",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.Ace},
								{Suit: entity.Clubs, Value: entity.King},
							},
							IsLeader: true,
						},
					},
					PlayedCards: []entity.PlayedCard{},
					LedSuit:     nil, // No suit led yet
				}
			},
			playerID:           "player-1",
			card:               &entity.Card{Suit: entity.Hearts, Value: entity.Ace},
			expectViolation:    false,
			expectCanChallenge: false,
		},
		{
			name: "no violation - player follows led suit",
			setupState: func() *entity.GameState {
				ledSuit := entity.Hearts
				return &entity.GameState{
					LeaderID:     "player-1",
					CurrentTurn:  "player-2",
					CurrentRound: 1,
					Phase:        entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{
							ID:            "player-1",
							Username:      "Alice",
							Hand:          []entity.Card{},
							IsLeader:      true,
							HasPlayedCard: true,
						},
						{
							ID:       "player-2",
							Username: "Bob",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.King},
								{Suit: entity.Clubs, Value: entity.Queen},
							},
							IsLeader:      false,
							HasPlayedCard: false,
						},
					},
					PlayedCards: []entity.PlayedCard{
						{
							PlayerID: "player-1",
							Card:     entity.Card{Suit: entity.Hearts, Value: entity.Ace},
							PlayedAt: time.Now(),
						},
					},
					LedSuit: &ledSuit,
				}
			},
			playerID:           "player-2",
			card:               &entity.Card{Suit: entity.Hearts, Value: entity.King},
			expectViolation:    false,
			expectCanChallenge: false,
		},
		{
			name: "violation detected - player has led suit but plays different suit",
			setupState: func() *entity.GameState {
				ledSuit := entity.Hearts
				return &entity.GameState{
					LeaderID:     "player-1",
					CurrentTurn:  "player-2",
					CurrentRound: 1,
					Phase:        entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{
							ID:            "player-1",
							Username:      "Alice",
							Hand:          []entity.Card{},
							IsLeader:      true,
							HasPlayedCard: true,
						},
						{
							ID:       "player-2",
							Username: "Bob",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.King}, // Has hearts!
								{Suit: entity.Clubs, Value: entity.Queen},
							},
							IsLeader:      false,
							HasPlayedCard: false,
						},
					},
					PlayedCards: []entity.PlayedCard{
						{
							PlayerID: "player-1",
							Card:     entity.Card{Suit: entity.Hearts, Value: entity.Ace},
							PlayedAt: time.Now(),
						},
					},
					LedSuit: &ledSuit,
				}
			},
			playerID:           "player-2",
			card:               &entity.Card{Suit: entity.Clubs, Value: entity.Queen},
			expectViolation:    true,
			expectCanChallenge: true,
		},
		{
			name: "no violation - player doesn't have led suit",
			setupState: func() *entity.GameState {
				ledSuit := entity.Hearts
				return &entity.GameState{
					LeaderID:     "player-1",
					CurrentTurn:  "player-2",
					CurrentRound: 1,
					Phase:        entity.PhasePlaying,
					Players: []entity.GamePlayer{
						{
							ID:            "player-1",
							Username:      "Alice",
							Hand:          []entity.Card{},
							IsLeader:      true,
							HasPlayedCard: true,
						},
						{
							ID:       "player-2",
							Username: "Bob",
							Hand: []entity.Card{
								{Suit: entity.Clubs, Value: entity.King},
								{Suit: entity.Clubs, Value: entity.Queen},
							},
							IsLeader:      false,
							HasPlayedCard: false,
						},
					},
					PlayedCards: []entity.PlayedCard{
						{
							PlayerID: "player-1",
							Card:     entity.Card{Suit: entity.Hearts, Value: entity.Ace},
							PlayedAt: time.Now(),
						},
					},
					LedSuit: &ledSuit,
				}
			},
			playerID:           "player-2",
			card:               &entity.Card{Suit: entity.Clubs, Value: entity.King},
			expectViolation:    false,
			expectCanChallenge: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			engine := NewEngine()
			state := tt.setupState()
			engine.SetGameState(state)

			violation, canChallenge := engine.ValidateSuitFollowing(context.Background(), tt.playerID, tt.card)

			if violation != tt.expectViolation {
				t.Errorf("expected violation=%v, got %v", tt.expectViolation, violation)
			}
			if canChallenge != tt.expectCanChallenge {
				t.Errorf("expected canChallenge=%v, got %v", tt.expectCanChallenge, canChallenge)
			}
		})
	}
}

// TestPlayCard tests the full card play flow
func TestPlayCard(t *testing.T) {
	tests := []struct {
		name          string
		setupState    func() *entity.GameState
		playerID      string
		card          *entity.Card
		expectError   bool
		checkState    func(*testing.T, *entity.GameState)
	}{
		{
			name: "successful card play - leader plays first",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhasePlaying,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					Players: []entity.GamePlayer{
						{
							ID:       "player-1",
							Username: "Alice",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.Ace},
								{Suit: entity.Clubs, Value: entity.King},
							},
							IsLeader:      true,
							HasPlayedCard: false,
						},
						{
							ID:       "player-2",
							Username: "Bob",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.King},
							},
							IsLeader:      false,
							HasPlayedCard: false,
						},
					},
					PlayedCards:   []entity.PlayedCard{},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 15,
					LedSuit:       nil,
				}
			},
			playerID:    "player-1",
			card:        &entity.Card{Suit: entity.Hearts, Value: entity.Ace},
			expectError: false,
			checkState: func(t *testing.T, state *entity.GameState) {
				// Check led suit is set
				if state.LedSuit == nil || *state.LedSuit != entity.Hearts {
					t.Error("led suit should be set to Hearts")
				}
				// Check card added to played cards
				if len(state.PlayedCards) != 1 {
					t.Errorf("expected 1 played card, got %d", len(state.PlayedCards))
				}
				// Check card removed from player's hand
				player := state.GetPlayer("player-1")
				if len(player.Hand) != 1 {
					t.Errorf("expected player to have 1 card left, got %d", len(player.Hand))
				}
				// Check player marked as played
				if !player.HasPlayedCard {
					t.Error("player should be marked as having played")
				}
				// Check turn advanced to next player
				if state.CurrentTurn != "player-2" {
					t.Errorf("expected turn to advance to player-2, got %s", state.CurrentTurn)
				}
			},
		},
		{
			name: "successful card play - second player follows suit",
			setupState: func() *entity.GameState {
				ledSuit := entity.Hearts
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhasePlaying,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-2",
					Players: []entity.GamePlayer{
						{
							ID:            "player-1",
							Username:      "Alice",
							Hand:          []entity.Card{{Suit: entity.Clubs, Value: entity.King}},
							IsLeader:      true,
							HasPlayedCard: true,
						},
						{
							ID:       "player-2",
							Username: "Bob",
							Hand: []entity.Card{
								{Suit: entity.Hearts, Value: entity.King},
							},
							IsLeader:      false,
							HasPlayedCard: false,
						},
					},
					PlayedCards: []entity.PlayedCard{
						{
							PlayerID: "player-1",
							Card:     entity.Card{Suit: entity.Hearts, Value: entity.Ace},
							PlayedAt: time.Now(),
						},
					},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 8,
					LedSuit:       &ledSuit,
				}
			},
			playerID:    "player-2",
			card:        &entity.Card{Suit: entity.Hearts, Value: entity.King},
			expectError: false,
			checkState: func(t *testing.T, state *entity.GameState) {
				// Check both players have played
				if !state.AllPlayersPlayed() {
					t.Error("all players should have played")
				}
				// Check 2 cards in played cards
				if len(state.PlayedCards) != 2 {
					t.Errorf("expected 2 played cards, got %d", len(state.PlayedCards))
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			engine := NewEngine()
			state := tt.setupState()
			engine.SetGameState(state)

			err := engine.PlayCard(context.Background(), tt.playerID, tt.card)

			if tt.expectError && err == nil {
				t.Error("expected error, got nil")
			}
			if !tt.expectError && err != nil {
				t.Errorf("expected no error, got: %v", err)
			}

			if !tt.expectError && tt.checkState != nil {
				tt.checkState(t, engine.GetGameState())
			}
		})
	}
}

// TestConcurrentCardPlay tests thread-safety of concurrent card plays
func TestConcurrentCardPlay(t *testing.T) {
	engine := NewEngine()
	state := &entity.GameState{
		GameID:       "game-1",
		Phase:        entity.PhasePlaying,
		CurrentRound: 1,
		LeaderID:     "player-1",
		CurrentTurn:  "player-1",
		Players: []entity.GamePlayer{
			{
				ID:       "player-1",
				Username: "Alice",
				Hand: []entity.Card{
					{Suit: entity.Hearts, Value: entity.Ace},
				},
				IsLeader:      true,
				HasPlayedCard: false,
			},
			{
				ID:       "player-2",
				Username: "Bob",
				Hand: []entity.Card{
					{Suit: entity.Clubs, Value: entity.King},
				},
				IsLeader:      false,
				HasPlayedCard: false,
			},
		},
		PlayedCards:   []entity.PlayedCard{},
		TurnStartTime: time.Now(),
		TurnTimeLimit: 15,
	}
	engine.SetGameState(state)

	// Try to play card from two goroutines simultaneously
	done := make(chan bool, 2)
	successCount := 0
	var successMu sync.Mutex

	go func() {
		err := engine.PlayCard(context.Background(), "player-1", &entity.Card{Suit: entity.Hearts, Value: entity.Ace})
		if err == nil {
			successMu.Lock()
			successCount++
			successMu.Unlock()
		}
		done <- true
	}()

	go func() {
		err := engine.PlayCard(context.Background(), "player-1", &entity.Card{Suit: entity.Hearts, Value: entity.Ace})
		if err == nil {
			successMu.Lock()
			successCount++
			successMu.Unlock()
		}
		done <- true
	}()

	<-done
	<-done

	// Only one should succeed (thread-safe operation)
	if successCount != 1 {
		t.Errorf("expected exactly 1 successful play, got %d", successCount)
	}
}

// TestValidateTurnOrder tests turn order validation
func TestValidateTurnOrder(t *testing.T) {
	tests := []struct {
		name        string
		setupState  func() *entity.GameState
		playerID    string
		expectError bool
	}{
		{
			name: "valid - player's turn",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					CurrentTurn: "player-1",
					Players: []entity.GamePlayer{
						{ID: "player-1", Username: "Alice"},
					},
				}
			},
			playerID:    "player-1",
			expectError: false,
		},
		{
			name: "invalid - not player's turn",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					CurrentTurn: "player-1",
					Players: []entity.GamePlayer{
						{ID: "player-1", Username: "Alice"},
						{ID: "player-2", Username: "Bob"},
					},
				}
			},
			playerID:    "player-2",
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			engine := NewEngine()
			state := tt.setupState()
			engine.SetGameState(state)

			err := engine.ValidateTurnOrder(context.Background(), tt.playerID)

			if tt.expectError && err == nil {
				t.Error("expected error, got nil")
			}
			if !tt.expectError && err != nil {
				t.Errorf("expected no error, got: %v", err)
			}
		})
	}
}

// TestAdvanceTurn tests turn advancement logic
func TestAdvanceTurn(t *testing.T) {
	tests := []struct {
		name             string
		setupState       func() *entity.GameState
		expectedNextTurn string
	}{
		{
			name: "advance from player 1 to player 2",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					LeaderID:    "player-1",
					CurrentTurn: "player-1",
					Players: []entity.GamePlayer{
						{ID: "player-1", Username: "Alice", IsLeader: true, HasPlayedCard: true},
						{ID: "player-2", Username: "Bob", IsLeader: false, HasPlayedCard: false},
					},
					PlayedCards: []entity.PlayedCard{
						{PlayerID: "player-1", Card: entity.Card{Suit: entity.Hearts, Value: entity.Ace}},
					},
				}
			},
			expectedNextTurn: "player-2",
		},
		{
			name: "all players played - no next turn",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					LeaderID:    "player-1",
					CurrentTurn: "player-2",
					Players: []entity.GamePlayer{
						{ID: "player-1", Username: "Alice", IsLeader: true, HasPlayedCard: true},
						{ID: "player-2", Username: "Bob", IsLeader: false, HasPlayedCard: true},
					},
					PlayedCards: []entity.PlayedCard{
						{PlayerID: "player-1", Card: entity.Card{Suit: entity.Hearts, Value: entity.Ace}},
						{PlayerID: "player-2", Card: entity.Card{Suit: entity.Hearts, Value: entity.King}},
					},
				}
			},
			expectedNextTurn: "",
		},
		{
			name: "4 players - advance to third player",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					LeaderID:    "player-1",
					CurrentTurn: "player-2",
					Players: []entity.GamePlayer{
						{ID: "player-1", Username: "Alice", IsLeader: true, HasPlayedCard: true},
						{ID: "player-2", Username: "Bob", IsLeader: false, HasPlayedCard: true},
						{ID: "player-3", Username: "Charlie", IsLeader: false, HasPlayedCard: false},
						{ID: "player-4", Username: "Diana", IsLeader: false, HasPlayedCard: false},
					},
					PlayedCards: []entity.PlayedCard{
						{PlayerID: "player-1", Card: entity.Card{Suit: entity.Hearts, Value: entity.Ace}},
						{PlayerID: "player-2", Card: entity.Card{Suit: entity.Hearts, Value: entity.King}},
					},
				}
			},
			expectedNextTurn: "player-3",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			engine := NewEngine()
			state := tt.setupState()
			engine.SetGameState(state)

			engine.AdvanceTurn(context.Background())

			updatedState := engine.GetGameState()
			if updatedState != nil && updatedState.CurrentTurn != tt.expectedNextTurn {
				t.Errorf("expected next turn to be '%s', got '%s'", tt.expectedNextTurn, updatedState.CurrentTurn)
			}
		})
	}

	// Test with nil state separately to avoid panic
	t.Run("nil state - no advance", func(t *testing.T) {
		engine := NewEngine()
		// Don't call AdvanceTurn with nil state - it should be safe but not crash
		engine.AdvanceTurn(context.Background())
		// No assertions needed - just verify it doesn't panic
	})
}

// TestValidateGamePhase tests game phase validation
func TestValidateGamePhase(t *testing.T) {
	tests := []struct {
		name          string
		currentPhase  entity.GamePhase
		requiredPhase entity.GamePhase
		expectError   bool
	}{
		{
			name:          "valid phase - playing",
			currentPhase:  entity.PhasePlaying,
			requiredPhase: entity.PhasePlaying,
			expectError:   false,
		},
		{
			name:          "invalid phase - waiting when playing required",
			currentPhase:  entity.PhaseWaiting,
			requiredPhase: entity.PhasePlaying,
			expectError:   true,
		},
		{
			name:          "valid phase - declaring",
			currentPhase:  entity.PhaseDeclaring,
			requiredPhase: entity.PhaseDeclaring,
			expectError:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			engine := NewEngine()
			state := &entity.GameState{
				GameID: "game-1",
				Phase:  tt.currentPhase,
			}
			engine.SetGameState(state)

			err := engine.ValidateGamePhase(context.Background(), tt.requiredPhase)

			if tt.expectError && err == nil {
				t.Error("expected error, got nil")
			}
			if !tt.expectError && err != nil {
				t.Errorf("expected no error, got: %v", err)
			}
		})
	}

	// Test with nil state
	t.Run("nil state", func(t *testing.T) {
		engine := NewEngine()
		err := engine.ValidateGamePhase(context.Background(), entity.PhasePlaying)
		if err == nil {
			t.Error("expected error with nil state, got nil")
		}
	})
}

// TestIsRoundComplete tests round completion detection
func TestIsRoundComplete(t *testing.T) {
	tests := []struct {
		name     string
		state    *entity.GameState
		expected bool
	}{
		{
			name: "round not complete - not all played",
			state: &entity.GameState{
				Players: []entity.GamePlayer{
					{ID: "player-1", HasPlayedCard: true},
					{ID: "player-2", HasPlayedCard: false},
				},
				PlayedCards: []entity.PlayedCard{
					{PlayerID: "player-1"},
				},
			},
			expected: false,
		},
		{
			name: "round complete - all played",
			state: &entity.GameState{
				Players: []entity.GamePlayer{
					{ID: "player-1", HasPlayedCard: true},
					{ID: "player-2", HasPlayedCard: true},
				},
				PlayedCards: []entity.PlayedCard{
					{PlayerID: "player-1"},
					{PlayerID: "player-2"},
				},
				RoundWinner: "player-1",
			},
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			engine := NewEngine()
			engine.SetGameState(tt.state)

			result := engine.IsRoundComplete()

			if result != tt.expected {
				t.Errorf("expected %v, got %v", tt.expected, result)
			}
		})
	}
}

// TestGetCurrentTurn tests getting current turn player ID
func TestGetCurrentTurn(t *testing.T) {
	engine := NewEngine()
	state := &entity.GameState{
		GameID:      "game-1",
		CurrentTurn: "player-1",
	}
	engine.SetGameState(state)

	turn := engine.GetCurrentTurn()
	if turn != "player-1" {
		t.Errorf("expected 'player-1', got '%s'", turn)
	}
}

// TestGetLedSuit tests getting the led suit
func TestGetLedSuit(t *testing.T) {
	tests := []struct {
		name     string
		state    *entity.GameState
		expected *entity.Suit
	}{
		{
			name: "led suit set",
			state: &entity.GameState{
				GameID: "game-1",
				LedSuit: func() *entity.Suit {
					suit := entity.Hearts
					return &suit
				}(),
			},
			expected: func() *entity.Suit {
				suit := entity.Hearts
				return &suit
			}(),
		},
		{
			name: "no led suit yet",
			state: &entity.GameState{
				GameID:  "game-1",
				LedSuit: nil,
			},
			expected: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			engine := NewEngine()
			engine.SetGameState(tt.state)

			ledSuit := engine.GetLedSuit()

			if tt.expected == nil && ledSuit != nil {
				t.Error("expected nil led suit, got non-nil")
			}
			if tt.expected != nil && ledSuit == nil {
				t.Error("expected non-nil led suit, got nil")
			}
			if tt.expected != nil && ledSuit != nil && *ledSuit != *tt.expected {
				t.Errorf("expected %s, got %s", *tt.expected, *ledSuit)
			}
		})
	}
}

// TestGetPlayedCards tests getting played cards
func TestGetPlayedCards(t *testing.T) {
	engine := NewEngine()
	state := &entity.GameState{
		GameID: "game-1",
		PlayedCards: []entity.PlayedCard{
			{PlayerID: "player-1", Card: entity.Card{Suit: entity.Hearts, Value: entity.Ace}},
			{PlayerID: "player-2", Card: entity.Card{Suit: entity.Hearts, Value: entity.King}},
		},
	}
	engine.SetGameState(state)

	cards := engine.GetPlayedCards()

	if len(cards) != 2 {
		t.Errorf("expected 2 played cards, got %d", len(cards))
	}

	// Verify it's a copy (modifying returned slice shouldn't affect state)
	cards[0].PlayerID = "modified"
	originalState := engine.GetGameState()
	if originalState.PlayedCards[0].PlayerID == "modified" {
		t.Error("GetPlayedCards should return a copy, not a reference")
	}
}

// TestUpdateGameState tests updating game state
func TestUpdateGameState(t *testing.T) {
	engine := NewEngine()
	initialState := &entity.GameState{
		GameID:       "game-1",
		Phase:        entity.PhaseWaiting,
		CurrentRound: 0,
	}
	engine.SetGameState(initialState)

	// Update to a new state
	newState := &entity.GameState{
		GameID:       "game-1",
		Phase:        entity.PhasePlaying,
		CurrentRound: 1,
		Players: []entity.GamePlayer{
			{ID: "player-1", Username: "Alice"},
		},
	}
	engine.UpdateGameState(context.Background(), newState)

	// Verify state was updated
	currentState := engine.GetGameState()
	if currentState.Phase != entity.PhasePlaying {
		t.Errorf("expected phase %s, got %s", entity.PhasePlaying, currentState.Phase)
	}
	if currentState.CurrentRound != 1 {
		t.Errorf("expected round 1, got %d", currentState.CurrentRound)
	}
}

// TestNilStateHandling tests handling of nil state
func TestNilStateHandling(t *testing.T) {
	engine := NewEngine()

	// Test methods with nil state
	t.Run("ValidateCardPlay with nil state", func(t *testing.T) {
		err := engine.ValidateCardPlay(context.Background(), "player-1", &entity.Card{Suit: entity.Hearts, Value: entity.Ace})
		if err == nil {
			t.Error("expected error with nil state, got nil")
		}
	})

	t.Run("ValidateSuitFollowing with nil state", func(t *testing.T) {
		violation, canChallenge := engine.ValidateSuitFollowing(context.Background(), "player-1", &entity.Card{Suit: entity.Hearts, Value: entity.Ace})
		if violation || canChallenge {
			t.Error("expected false with nil state")
		}
	})

	t.Run("PlayCard with nil state", func(t *testing.T) {
		err := engine.PlayCard(context.Background(), "player-1", &entity.Card{Suit: entity.Hearts, Value: entity.Ace})
		if err == nil {
			t.Error("expected error with nil state, got nil")
		}
	})

	t.Run("IsRoundComplete with nil state", func(t *testing.T) {
		if engine.IsRoundComplete() {
			t.Error("expected false with nil state")
		}
	})

	t.Run("GetCurrentTurn with nil state", func(t *testing.T) {
		if turn := engine.GetCurrentTurn(); turn != "" {
			t.Errorf("expected empty string with nil state, got '%s'", turn)
		}
	})

	t.Run("GetLedSuit with nil state", func(t *testing.T) {
		if suit := engine.GetLedSuit(); suit != nil {
			t.Error("expected nil with nil state, got non-nil")
		}
	})

	t.Run("GetPlayedCards with nil state", func(t *testing.T) {
		if cards := engine.GetPlayedCards(); cards != nil {
			t.Error("expected nil with nil state, got non-nil")
		}
	})
}

// TestPlayCardErrorPaths tests error paths in PlayCard
func TestPlayCardErrorPaths(t *testing.T) {
	tests := []struct {
		name        string
		setupState  func() *entity.GameState
		playerID    string
		card        *entity.Card
		expectError string
	}{
		{
			name: "invalid card value",
			setupState: func() *entity.GameState {
				return &entity.GameState{
					GameID:       "game-1",
					Phase:        entity.PhasePlaying,
					CurrentRound: 1,
					LeaderID:     "player-1",
					CurrentTurn:  "player-1",
					Players: []entity.GamePlayer{
						{
							ID:       "player-1",
							Username: "Alice",
							Hand:     []entity.Card{{Suit: entity.Hearts, Value: entity.Ace}},
							IsLeader: true,
						},
					},
					TurnStartTime: time.Now(),
					TurnTimeLimit: 15,
				}
			},
			playerID:    "player-1",
			card:        &entity.Card{Suit: entity.Hearts, Value: "invalid"},
			expectError: "invalid card",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			engine := NewEngine()
			state := tt.setupState()
			engine.SetGameState(state)

			err := engine.PlayCard(context.Background(), tt.playerID, tt.card)

			if err == nil {
				t.Error("expected error, got nil")
			} else if !contains(err.Error(), tt.expectError) {
				t.Errorf("expected error containing '%s', got '%s'", tt.expectError, err.Error())
			}
		})
	}
}

// TestValidateSuitFollowingEdgeCases tests edge cases in suit following
func TestValidateSuitFollowingEdgeCases(t *testing.T) {
	t.Run("nil card", func(t *testing.T) {
		engine := NewEngine()
		state := &entity.GameState{
			GameID: "game-1",
			Phase:  entity.PhasePlaying,
			Players: []entity.GamePlayer{
				{ID: "player-1", Username: "Alice"},
			},
		}
		engine.SetGameState(state)

		violation, canChallenge := engine.ValidateSuitFollowing(context.Background(), "player-1", nil)
		if violation || canChallenge {
			t.Error("expected false for nil card")
		}
	})

	t.Run("player not found", func(t *testing.T) {
		engine := NewEngine()
		ledSuit := entity.Hearts
		state := &entity.GameState{
			GameID: "game-1",
			Phase:  entity.PhasePlaying,
			Players: []entity.GamePlayer{
				{ID: "player-1", Username: "Alice"},
			},
			LedSuit: &ledSuit,
		}
		engine.SetGameState(state)

		violation, canChallenge := engine.ValidateSuitFollowing(context.Background(), "player-999", &entity.Card{Suit: entity.Clubs, Value: entity.King})
		if violation || canChallenge {
			t.Error("expected false for non-existent player")
		}
	})
}

// TestValidateTurnOrderEdgeCases tests edge cases in turn order
func TestValidateTurnOrderEdgeCases(t *testing.T) {
	t.Run("nil state", func(t *testing.T) {
		engine := NewEngine()
		err := engine.ValidateTurnOrder(context.Background(), "player-1")
		if err == nil {
			t.Error("expected error for nil state")
		}
	})
}

// Helper function to check if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) &&
		(s[:len(substr)] == substr || s[len(s)-len(substr):] == substr ||
		 findInString(s, substr)))
}

func findInString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
