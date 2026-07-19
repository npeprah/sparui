package websocket

import (
	"testing"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

func TestMapBackendRankToFrontend(t *testing.T) {
	tests := []struct {
		name         string
		backendValue entity.Value
		expectedRank string
	}{
		{
			name:         "ace converts to A",
			backendValue: entity.Ace,
			expectedRank: "A",
		},
		{
			name:         "king converts to K",
			backendValue: entity.King,
			expectedRank: "K",
		},
		{
			name:         "queen converts to Q",
			backendValue: entity.Queen,
			expectedRank: "Q",
		},
		{
			name:         "jack converts to J",
			backendValue: entity.Jack,
			expectedRank: "J",
		},
		{
			name:         "ten converts to 10",
			backendValue: entity.Ten,
			expectedRank: "10",
		},
		{
			name:         "nine converts to 9",
			backendValue: entity.Nine,
			expectedRank: "9",
		},
		{
			name:         "eight converts to 8",
			backendValue: entity.Eight,
			expectedRank: "8",
		},
		{
			name:         "seven converts to 7",
			backendValue: entity.Seven,
			expectedRank: "7",
		},
		{
			name:         "six converts to 6",
			backendValue: entity.Six,
			expectedRank: "6",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := mapBackendRankToFrontend(tt.backendValue)
			if result != tt.expectedRank {
				t.Errorf("mapBackendRankToFrontend(%q) = %q, want %q",
					tt.backendValue, result, tt.expectedRank)
			}
		})
	}
}

func TestConvertCardToFrontendFormat(t *testing.T) {
	tests := []struct {
		name         string
		card         *entity.Card
		expectedCard map[string]interface{}
	}{
		{
			name: "converts king of spades correctly",
			card: &entity.Card{
				Suit:  entity.Spades,
				Value: entity.King,
			},
			expectedCard: map[string]interface{}{
				"suit": "spades",
				"rank": "K",
				"id":   "spades-K",
			},
		},
		{
			name: "converts ace of hearts correctly",
			card: &entity.Card{
				Suit:  entity.Hearts,
				Value: entity.Ace,
			},
			expectedCard: map[string]interface{}{
				"suit": "hearts",
				"rank": "A",
				"id":   "hearts-A",
			},
		},
		{
			name: "converts queen of diamonds correctly",
			card: &entity.Card{
				Suit:  entity.Diamonds,
				Value: entity.Queen,
			},
			expectedCard: map[string]interface{}{
				"suit": "diamonds",
				"rank": "Q",
				"id":   "diamonds-Q",
			},
		},
		{
			name: "converts jack of clubs correctly",
			card: &entity.Card{
				Suit:  entity.Clubs,
				Value: entity.Jack,
			},
			expectedCard: map[string]interface{}{
				"suit": "clubs",
				"rank": "J",
				"id":   "clubs-J",
			},
		},
		{
			name: "converts ten of spades correctly",
			card: &entity.Card{
				Suit:  entity.Spades,
				Value: entity.Ten,
			},
			expectedCard: map[string]interface{}{
				"suit": "spades",
				"rank": "10",
				"id":   "spades-10",
			},
		},
		{
			name: "converts nine of hearts correctly",
			card: &entity.Card{
				Suit:  entity.Hearts,
				Value: entity.Nine,
			},
			expectedCard: map[string]interface{}{
				"suit": "hearts",
				"rank": "9",
				"id":   "hearts-9",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertCardToFrontendFormat(tt.card)

			// Check suit
			if result["suit"] != tt.expectedCard["suit"] {
				t.Errorf("suit = %v, want %v", result["suit"], tt.expectedCard["suit"])
			}

			// Check rank
			if result["rank"] != tt.expectedCard["rank"] {
				t.Errorf("rank = %v, want %v", result["rank"], tt.expectedCard["rank"])
			}

			// Check id
			if result["id"] != tt.expectedCard["id"] {
				t.Errorf("id = %v, want %v", result["id"], tt.expectedCard["id"])
			}
		})
	}
}

func TestConvertPlayedCardsToFrontendFormat(t *testing.T) {
	tests := []struct {
		name                string
		playedCards         []entity.PlayedCard
		expectedCardFormats int
		firstCardCheck      map[string]string
	}{
		{
			name: "converts multiple played cards correctly",
			playedCards: []entity.PlayedCard{
				{
					PlayerID: "player1",
					Card: entity.Card{
						Suit:  entity.Spades,
						Value: entity.King,
					},
				},
				{
					PlayerID: "player2",
					Card: entity.Card{
						Suit:  entity.Hearts,
						Value: entity.Ace,
					},
				},
			},
			expectedCardFormats: 2,
			firstCardCheck: map[string]string{
				"suit": "spades",
				"rank": "K",
				"id":   "spades-K",
			},
		},
		{
			name:                "handles empty played cards",
			playedCards:         []entity.PlayedCard{},
			expectedCardFormats: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertPlayedCardsToFrontendFormat(tt.playedCards)

			if len(result) != tt.expectedCardFormats {
				t.Errorf("got %d cards, want %d", len(result), tt.expectedCardFormats)
			}

			if tt.expectedCardFormats > 0 && tt.firstCardCheck != nil {
				firstCard := result[0].(map[string]interface{})
				cardData := firstCard["card"].(map[string]interface{})

				if cardData["suit"] != tt.firstCardCheck["suit"] {
					t.Errorf("first card suit = %v, want %v",
						cardData["suit"], tt.firstCardCheck["suit"])
				}

				if cardData["rank"] != tt.firstCardCheck["rank"] {
					t.Errorf("first card rank = %v, want %v",
						cardData["rank"], tt.firstCardCheck["rank"])
				}

				if cardData["id"] != tt.firstCardCheck["id"] {
					t.Errorf("first card id = %v, want %v",
						cardData["id"], tt.firstCardCheck["id"])
				}
			}
		})
	}
}

func TestConvertCardsToFrontendFormat(t *testing.T) {
	tests := []struct {
		name          string
		cards         []entity.Card
		expectedCount int
		firstCardRank string
	}{
		{
			name: "converts multiple cards correctly",
			cards: []entity.Card{
				{Suit: entity.Spades, Value: entity.King},
				{Suit: entity.Hearts, Value: entity.Ace},
				{Suit: entity.Diamonds, Value: entity.Queen},
			},
			expectedCount: 3,
			firstCardRank: "K",
		},
		{
			name:          "handles empty card slice",
			cards:         []entity.Card{},
			expectedCount: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertCardsToFrontendFormat(tt.cards)

			if len(result) != tt.expectedCount {
				t.Errorf("got %d cards, want %d", len(result), tt.expectedCount)
			}

			if tt.expectedCount > 0 {
				firstCard := result[0].(map[string]interface{})
				if firstCard["rank"] != tt.firstCardRank {
					t.Errorf("first card rank = %v, want %v",
						firstCard["rank"], tt.firstCardRank)
				}
			}
		})
	}
}

func TestConvertGameStateToFrontendFormat(t *testing.T) {
	// Create a sample game state
	ledSuit := entity.Spades
	gameState := &entity.GameState{
		GameID:       "game-123",
		RoomCode:     "ABC123",
		TotalRounds:  5,
		PointsToWin:  10,
		Phase:        entity.PhasePlaying,
		LeaderID:     "player1",
		CurrentTurn:  "player1",
		CurrentRound: 1,
		LedSuit:      &ledSuit,
		RoundWinner:  "player2",
		Players: []entity.GamePlayer{
			{
				ID:       "player1",
				Username: "Player 1",
				Avatar:   "avatar1",
				Hand: []entity.Card{
					{Suit: entity.Spades, Value: entity.King},
					{Suit: entity.Hearts, Value: entity.Ace},
				},
				Score:     10,
				RoundsWon: 2,
				WinStreak: 1,
				IsLeader:  true,
				IsOnFire:  false,
			},
		},
		PlayedCards: []entity.PlayedCard{
			{
				PlayerID: "player1",
				Card:     entity.Card{Suit: entity.Spades, Value: entity.King},
			},
		},
		TurnTimeLimit:    30,
		TurnExpired:      false,
		FireStreakPlayer: "player1",
		FreezeTriggered:  false,
	}

	result := convertGameStateToFrontendFormat(gameState)

	// Check basic fields
	if result["gameId"] != "game-123" {
		t.Errorf("gameId = %v, want game-123", result["gameId"])
	}

	if result["roomCode"] != "ABC123" {
		t.Errorf("roomCode = %v, want ABC123", result["roomCode"])
	}

	if result["currentRound"] != 1 {
		t.Errorf("currentRound = %v, want 1", result["currentRound"])
	}

	// Check led suit
	if result["ledSuit"] != "spades" {
		t.Errorf("ledSuit = %v, want spades", result["ledSuit"])
	}

	// Check round winner
	if result["roundWinner"] != "player2" {
		t.Errorf("roundWinner = %v, want player2", result["roundWinner"])
	}

	// Check players array
	players := result["players"].([]interface{})
	if len(players) != 1 {
		t.Errorf("got %d players, want 1", len(players))
	}

	// Check first player's hand is converted
	player1 := players[0].(map[string]interface{})
	if player1["username"] != "Player 1" {
		t.Errorf("player username = %v, want Player 1", player1["username"])
	}

	hand := player1["hand"].([]interface{})
	if len(hand) != 2 {
		t.Errorf("got %d cards in hand, want 2", len(hand))
	}

	// Check first card in hand uses frontend format
	firstCard := hand[0].(map[string]interface{})
	if firstCard["rank"] != "K" {
		t.Errorf("first card rank = %v, want K", firstCard["rank"])
	}
	if firstCard["suit"] != "spades" {
		t.Errorf("first card suit = %v, want spades", firstCard["suit"])
	}
	if firstCard["id"] != "spades-K" {
		t.Errorf("first card id = %v, want spades-K", firstCard["id"])
	}

	// Check played cards are converted
	playedCards := result["playedCards"].([]interface{})
	if len(playedCards) != 1 {
		t.Errorf("got %d played cards, want 1", len(playedCards))
	}

	playedCard := playedCards[0].(map[string]interface{})
	cardData := playedCard["card"].(map[string]interface{})
	if cardData["rank"] != "K" {
		t.Errorf("played card rank = %v, want K", cardData["rank"])
	}
}
