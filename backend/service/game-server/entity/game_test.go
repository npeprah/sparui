package entity

import (
	"testing"
	"time"
)

// TestSuit tests the Suit type and its methods
func TestSuit(t *testing.T) {
	tests := []struct {
		name    string
		suit    Suit
		isValid bool
	}{
		{"Valid Hearts", Hearts, true},
		{"Valid Clubs", Clubs, true},
		{"Valid Diamonds", Diamonds, true},
		{"Valid Spades", Spades, true},
		{"Invalid Suit", Suit("invalid"), false},
		{"Empty Suit", Suit(""), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.suit.IsValid(); got != tt.isValid {
				t.Errorf("Suit.IsValid() = %v, want %v", got, tt.isValid)
			}

			if tt.isValid {
				if got := tt.suit.String(); got != string(tt.suit) {
					t.Errorf("Suit.String() = %v, want %v", got, string(tt.suit))
				}
			}
		})
	}
}

// TestValue tests the Value type and its methods
func TestValue(t *testing.T) {
	tests := []struct {
		name    string
		value   Value
		isValid bool
		rank    int
	}{
		{"Valid Six", Six, true, 6},
		{"Valid Seven", Seven, true, 7},
		{"Valid Eight", Eight, true, 8},
		{"Valid Nine", Nine, true, 9},
		{"Valid Ten", Ten, true, 10},
		{"Valid Jack", Jack, true, 11},
		{"Valid Queen", Queen, true, 12},
		{"Valid King", King, true, 13},
		{"Valid Ace", Ace, true, 14},
		{"Invalid Value", Value("invalid"), false, 0},
		{"Empty Value", Value(""), false, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.value.IsValid(); got != tt.isValid {
				t.Errorf("Value.IsValid() = %v, want %v", got, tt.isValid)
			}

			if got := tt.value.Rank(); got != tt.rank {
				t.Errorf("Value.Rank() = %v, want %v", got, tt.rank)
			}

			if tt.isValid {
				if got := tt.value.String(); got != string(tt.value) {
					t.Errorf("Value.String() = %v, want %v", got, string(tt.value))
				}
			}
		})
	}
}

// TestCard tests the Card type and its methods
func TestCard(t *testing.T) {
	t.Run("Card String Representation", func(t *testing.T) {
		card := Card{Suit: Hearts, Value: Ace}
		expected := "ace of hearts"
		if got := card.String(); got != expected {
			t.Errorf("Card.String() = %v, want %v", got, expected)
		}
	})

	t.Run("Card IsValid", func(t *testing.T) {
		tests := []struct {
			name  string
			card  Card
			valid bool
		}{
			{"Valid Card", Card{Hearts, Ace}, true},
			{"Invalid Suit", Card{Suit("invalid"), Ace}, false},
			{"Invalid Value", Card{Hearts, Value("invalid")}, false},
			{"Both Invalid", Card{Suit("invalid"), Value("invalid")}, false},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				if got := tt.card.IsValid(); got != tt.valid {
					t.Errorf("Card.IsValid() = %v, want %v", got, tt.valid)
				}
			})
		}
	})

	t.Run("Card Equals", func(t *testing.T) {
		card1 := Card{Hearts, Ace}
		card2 := Card{Hearts, Ace}
		card3 := Card{Diamonds, Ace}

		if !card1.Equals(&card2) {
			t.Error("Expected identical cards to be equal")
		}

		if card1.Equals(&card3) {
			t.Error("Expected different cards to not be equal")
		}

		if card1.Equals(nil) {
			t.Error("Expected card to not equal nil")
		}
	})

	t.Run("Card IsStrongerThan", func(t *testing.T) {
		tests := []struct {
			name     string
			card1    Card
			card2    Card
			stronger bool
		}{
			{"Ace stronger than King (same suit)", Card{Hearts, Ace}, Card{Hearts, King}, true},
			{"King not stronger than Ace (same suit)", Card{Hearts, King}, Card{Hearts, Ace}, false},
			{"Different suits - not comparable", Card{Hearts, Ace}, Card{Diamonds, Six}, false},
			{"Six not stronger than Ace (same suit)", Card{Hearts, Six}, Card{Hearts, Ace}, false},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				if got := tt.card1.IsStrongerThan(&tt.card2); got != tt.stronger {
					t.Errorf("Card.IsStrongerThan() = %v, want %v", got, tt.stronger)
				}
			})
		}

		// Test nil case
		card := Card{Hearts, Ace}
		if !card.IsStrongerThan(nil) {
			t.Error("Expected card to be stronger than nil")
		}
	})

	t.Run("Card IsLowCard", func(t *testing.T) {
		tests := []struct {
			name   string
			card   Card
			isLow  bool
		}{
			{"Six is low", Card{Hearts, Six}, true},
			{"Seven is low", Card{Hearts, Seven}, true},
			{"Eight is not low", Card{Hearts, Eight}, false},
			{"Ace is not low", Card{Hearts, Ace}, false},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				if got := tt.card.IsLowCard(); got != tt.isLow {
					t.Errorf("Card.IsLowCard() = %v, want %v", got, tt.isLow)
				}
			})
		}
	})

	t.Run("Card CompareValue", func(t *testing.T) {
		tests := []struct {
			name     string
			card1    Card
			card2    Card
			expected int
		}{
			{"Ace > King (same suit)", Card{Hearts, Ace}, Card{Hearts, King}, 1},
			{"King < Ace (same suit)", Card{Hearts, King}, Card{Hearts, Ace}, -1},
			{"Same card value", Card{Hearts, Seven}, Card{Hearts, Seven}, 0},
			{"Different suits - not comparable", Card{Hearts, Ace}, Card{Diamonds, Six}, 0},
			{"Six < Ace (same suit)", Card{Clubs, Six}, Card{Clubs, Ace}, -1},
			{"Queen > Nine (same suit)", Card{Spades, Queen}, Card{Spades, Nine}, 1},
			{"Nine > Seven (same suit)", Card{Diamonds, Nine}, Card{Diamonds, Seven}, 1},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				if got := tt.card1.CompareValue(tt.card2); got != tt.expected {
					t.Errorf("Card.CompareValue() = %v, want %v", got, tt.expected)
				}
			})
		}
	})
}

// TestDryCard tests the DryCard type and bonus points
func TestDryCard(t *testing.T) {
	tests := []struct {
		name          string
		dryCard       DryCard
		expectedBonus int
	}{
		{"Dry Six - 6 points", DryCard{Card{Hearts, Six}, DryHidden, "player1"}, 6},
		{"Dry Seven - 4 points", DryCard{Card{Hearts, Seven}, DryHidden, "player1"}, 4},
		{"Show Dry Six - 12 points", DryCard{Card{Hearts, Six}, DryShown, "player1"}, 12},
		{"Show Dry Seven - 8 points", DryCard{Card{Hearts, Seven}, DryShown, "player1"}, 8},
		{"Dry Eight - 0 points (invalid)", DryCard{Card{Hearts, Eight}, DryHidden, "player1"}, 0},
		{"Show Dry Ace - 0 points (invalid)", DryCard{Card{Hearts, Ace}, DryShown, "player1"}, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.dryCard.BonusPoints(); got != tt.expectedBonus {
				t.Errorf("DryCard.BonusPoints() = %v, want %v", got, tt.expectedBonus)
			}
		})
	}
}

// TestGamePlayer tests the GamePlayer type and its methods
func TestGamePlayer(t *testing.T) {
	t.Run("CanDeclareDry", func(t *testing.T) {
		tests := []struct {
			name    string
			hand    []Card
			canDry  bool
		}{
			{"Has Six", []Card{{Hearts, Six}, {Clubs, Ace}}, true},
			{"Has Seven", []Card{{Hearts, Seven}, {Clubs, King}}, true},
			{"No low cards", []Card{{Hearts, Ace}, {Clubs, King}}, false},
			{"Empty hand", []Card{}, false},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				player := GamePlayer{Hand: tt.hand}
				if got := player.CanDeclareDry(); got != tt.canDry {
					t.Errorf("GamePlayer.CanDeclareDry() = %v, want %v", got, tt.canDry)
				}
			})
		}
	})

	t.Run("HasCard", func(t *testing.T) {
		player := GamePlayer{
			Hand: []Card{
				{Hearts, Ace},
				{Clubs, King},
				{Diamonds, Six},
			},
		}

		// Card exists
		card := Card{Hearts, Ace}
		if !player.HasCard(&card) {
			t.Error("Expected player to have Ace of Hearts")
		}

		// Card doesn't exist
		card2 := Card{Spades, Queen}
		if player.HasCard(&card2) {
			t.Error("Expected player to not have Queen of Spades")
		}

		// Nil card
		if player.HasCard(nil) {
			t.Error("Expected player to not have nil card")
		}
	})

	t.Run("HasSuit", func(t *testing.T) {
		player := GamePlayer{
			Hand: []Card{
				{Hearts, Ace},
				{Hearts, King},
				{Clubs, Six},
			},
		}

		if !player.HasSuit(Hearts) {
			t.Error("Expected player to have Hearts")
		}

		if !player.HasSuit(Clubs) {
			t.Error("Expected player to have Clubs")
		}

		if player.HasSuit(Diamonds) {
			t.Error("Expected player to not have Diamonds")
		}
	})

	t.Run("RemoveCard", func(t *testing.T) {
		player := GamePlayer{
			Hand: []Card{
				{Hearts, Ace},
				{Clubs, King},
				{Diamonds, Six},
			},
		}

		initialCount := len(player.Hand)

		// Remove existing card
		card := Card{Clubs, King}
		if !player.RemoveCard(&card) {
			t.Error("Expected RemoveCard to return true")
		}

		if len(player.Hand) != initialCount-1 {
			t.Errorf("Expected hand count to be %d, got %d", initialCount-1, len(player.Hand))
		}

		if player.HasCard(&card) {
			t.Error("Expected card to be removed from hand")
		}

		// Try to remove non-existent card
		card2 := Card{Spades, Queen}
		if player.RemoveCard(&card2) {
			t.Error("Expected RemoveCard to return false for non-existent card")
		}

		// Try to remove nil card
		if player.RemoveCard(nil) {
			t.Error("Expected RemoveCard to return false for nil card")
		}
	})

	t.Run("HandCount", func(t *testing.T) {
		player := GamePlayer{
			Hand: []Card{
				{Hearts, Ace},
				{Clubs, King},
			},
		}

		if got := player.HandCount(); got != 2 {
			t.Errorf("Expected hand count to be 2, got %d", got)
		}

		player.Hand = []Card{}
		if got := player.HandCount(); got != 0 {
			t.Errorf("Expected hand count to be 0, got %d", got)
		}
	})
}

// TestGameState tests the GameState type and its methods
func TestGameState(t *testing.T) {
	// Helper function to create a test game state
	createTestGameState := func() *GameState {
		return &GameState{
			GameID:      "game123",
			RoomCode:    "ABC123",
			TotalRounds: 5,
			PointsToWin: 10,
			Phase:       PhasePlaying,
			Players: []GamePlayer{
				{ID: "player1", Username: "Alice", IsLeader: true},
				{ID: "player2", Username: "Bob"},
				{ID: "player3", Username: "Charlie"},
			},
			LeaderID:     "player1",
			CurrentRound: 1,
			PlayedCards:  []PlayedCard{},
			StartedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
	}

	t.Run("GetPlayer", func(t *testing.T) {
		gs := createTestGameState()

		player := gs.GetPlayer("player2")
		if player == nil {
			t.Fatal("Expected to find player2")
		}
		if player.Username != "Bob" {
			t.Errorf("Expected username 'Bob', got '%s'", player.Username)
		}

		player = gs.GetPlayer("nonexistent")
		if player != nil {
			t.Error("Expected nil for non-existent player")
		}
	})

	t.Run("GetLeader", func(t *testing.T) {
		gs := createTestGameState()

		leader := gs.GetLeader()
		if leader == nil {
			t.Fatal("Expected to find leader")
		}
		if leader.ID != "player1" {
			t.Errorf("Expected leader to be player1, got %s", leader.ID)
		}
	})

	t.Run("IsLeader", func(t *testing.T) {
		gs := createTestGameState()

		if !gs.IsLeader("player1") {
			t.Error("Expected player1 to be leader")
		}

		if gs.IsLeader("player2") {
			t.Error("Expected player2 to not be leader")
		}
	})

	t.Run("AllPlayersPlayed", func(t *testing.T) {
		gs := createTestGameState()

		// No one has played
		if gs.AllPlayersPlayed() {
			t.Error("Expected AllPlayersPlayed to be false when no one has played")
		}

		// Some players have played
		gs.Players[0].HasPlayedCard = true
		gs.PlayedCards = []PlayedCard{
			{Card: Card{Hearts, Ace}, PlayerID: "player1", PlayedAt: time.Now()},
		}
		if gs.AllPlayersPlayed() {
			t.Error("Expected AllPlayersPlayed to be false when not all have played")
		}

		// All players have played
		gs.Players[1].HasPlayedCard = true
		gs.Players[2].HasPlayedCard = true
		gs.PlayedCards = append(gs.PlayedCards,
			PlayedCard{Card: Card{Clubs, King}, PlayerID: "player2", PlayedAt: time.Now()},
			PlayedCard{Card: Card{Diamonds, Six}, PlayerID: "player3", PlayedAt: time.Now()},
		)
		if !gs.AllPlayersPlayed() {
			t.Error("Expected AllPlayersPlayed to be true when all have played")
		}
	})

	t.Run("GetPlayedCard", func(t *testing.T) {
		gs := createTestGameState()
		gs.PlayedCards = []PlayedCard{
			{Card: Card{Hearts, Ace}, PlayerID: "player1", PlayedAt: time.Now()},
			{Card: Card{Clubs, King}, PlayerID: "player2", PlayedAt: time.Now()},
		}

		card := gs.GetPlayedCard("player1")
		if card == nil {
			t.Fatal("Expected to find played card for player1")
		}
		if card.Card.Value != Ace {
			t.Errorf("Expected Ace, got %s", card.Card.Value)
		}

		card = gs.GetPlayedCard("player3")
		if card != nil {
			t.Error("Expected nil for player who hasn't played")
		}
	})

	t.Run("IsRoundComplete", func(t *testing.T) {
		gs := createTestGameState()

		// Not complete - no winner yet
		if gs.IsRoundComplete() {
			t.Error("Expected round to not be complete")
		}

		// Set all players as played
		for i := range gs.Players {
			gs.Players[i].HasPlayedCard = true
		}
		gs.PlayedCards = []PlayedCard{
			{Card: Card{Hearts, Ace}, PlayerID: "player1"},
			{Card: Card{Hearts, King}, PlayerID: "player2"},
			{Card: Card{Hearts, Six}, PlayerID: "player3"},
		}

		// Still not complete - no winner determined
		if gs.IsRoundComplete() {
			t.Error("Expected round to not be complete without winner")
		}

		// Set winner
		gs.RoundWinner = "player1"
		if !gs.IsRoundComplete() {
			t.Error("Expected round to be complete")
		}
	})

	t.Run("IsGameComplete", func(t *testing.T) {
		gs := createTestGameState()

		// Not complete - only round 1
		if gs.IsGameComplete() {
			t.Error("Expected game to not be complete at round 1")
		}

		// Round 5, but round not complete
		gs.CurrentRound = 5
		if gs.IsGameComplete() {
			t.Error("Expected game to not be complete without round completion")
		}

		// Round 5 and round complete
		for i := range gs.Players {
			gs.Players[i].HasPlayedCard = true
		}
		gs.PlayedCards = []PlayedCard{
			{Card: Card{Hearts, Ace}, PlayerID: "player1"},
			{Card: Card{Hearts, King}, PlayerID: "player2"},
			{Card: Card{Hearts, Six}, PlayerID: "player3"},
		}
		gs.RoundWinner = "player1"

		if !gs.IsGameComplete() {
			t.Error("Expected game to be complete at round 5 with complete round")
		}
	})

	t.Run("GetNextPlayer", func(t *testing.T) {
		gs := createTestGameState()

		// No one has played - leader goes first
		next := gs.GetNextPlayer()
		if next == nil || next.ID != "player1" {
			t.Error("Expected leader to be next when no one has played")
		}

		// Leader has played
		gs.Players[0].HasPlayedCard = true
		gs.PlayedCards = []PlayedCard{
			{Card: Card{Hearts, Ace}, PlayerID: "player1"},
		}

		// Next should be player2 (clockwise from leader)
		next = gs.GetNextPlayer()
		if next == nil || next.ID != "player2" {
			t.Error("Expected player2 to be next")
		}

		// Player2 has played
		gs.Players[1].HasPlayedCard = true
		gs.PlayedCards = append(gs.PlayedCards,
			PlayedCard{Card: Card{Clubs, King}, PlayerID: "player2"},
		)

		// Next should be player3
		next = gs.GetNextPlayer()
		if next == nil || next.ID != "player3" {
			t.Error("Expected player3 to be next")
		}

		// All have played
		gs.Players[2].HasPlayedCard = true
		gs.PlayedCards = append(gs.PlayedCards,
			PlayedCard{Card: Card{Diamonds, Six}, PlayerID: "player3"},
		)

		// No next player - round is over
		next = gs.GetNextPlayer()
		if next != nil {
			t.Error("Expected no next player when all have played")
		}
	})

	t.Run("GetPlayerCount", func(t *testing.T) {
		gs := createTestGameState()

		if got := gs.GetPlayerCount(); got != 3 {
			t.Errorf("Expected player count to be 3, got %d", got)
		}
	})

	t.Run("GetWinningPlayer", func(t *testing.T) {
		gs := createTestGameState()
		gs.Players[0].Score = 5
		gs.Players[1].Score = 10
		gs.Players[2].Score = 3

		winner := gs.GetWinningPlayer()
		if winner == nil {
			t.Fatal("Expected to find winning player")
		}
		if winner.ID != "player2" {
			t.Errorf("Expected player2 to be winner, got %s", winner.ID)
		}

		// Test with empty players
		gs.Players = []GamePlayer{}
		winner = gs.GetWinningPlayer()
		if winner != nil {
			t.Error("Expected nil winner for empty players")
		}
	})

	t.Run("ResetRound", func(t *testing.T) {
		gs := createTestGameState()
		gs.PlayedCards = []PlayedCard{
			{Card: Card{Hearts, Ace}, PlayerID: "player1"},
		}
		ledSuit := Hearts
		gs.LedSuit = &ledSuit
		gs.RoundWinner = "player1"
		gs.FreezeTriggered = true
		gs.Players[0].HasPlayedCard = true

		gs.ResetRound()

		if len(gs.PlayedCards) != 0 {
			t.Error("Expected played cards to be cleared")
		}
		if gs.LedSuit != nil {
			t.Error("Expected led suit to be nil")
		}
		if gs.RoundWinner != "" {
			t.Error("Expected round winner to be empty")
		}
		if gs.FreezeTriggered {
			t.Error("Expected freeze triggered to be false")
		}
		if gs.Players[0].HasPlayedCard {
			t.Error("Expected player's HasPlayedCard to be reset")
		}
	})
}

// TestGamePhase tests game phase constants
func TestGamePhase(t *testing.T) {
	phases := []GamePhase{
		PhaseWaiting,
		PhaseDeclaring,
		PhasePlaying,
		PhaseRoundEnd,
		PhaseGameOver,
	}

	// Just verify they're defined and not empty
	for _, phase := range phases {
		if phase == "" {
			t.Error("Expected phase to not be empty")
		}
	}
}
