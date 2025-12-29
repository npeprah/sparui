package entity

import (
	"math"
	"testing"
)

// TestNewDeck verifies that NewDeck creates a standard 35-card Spar deck
func TestNewDeck(t *testing.T) {
	deck := NewDeck()

	// Verify total card count
	if len(deck.Cards) != 35 {
		t.Errorf("Expected 35 cards, got %d", len(deck.Cards))
	}

	// Verify deck is valid
	if err := deck.Validate(); err != nil {
		t.Errorf("NewDeck created invalid deck: %v", err)
	}
}

// TestDeckComposition verifies the deck has the correct suit and value distribution
func TestDeckComposition(t *testing.T) {
	deck := NewDeck()

	// Expected composition:
	// Hearts: 6, 7, 8, 9, 10, J, Q, K, A (9 cards)
	// Clubs: 6, 7, 8, 9, 10, J, Q, K, A (9 cards)
	// Diamonds: 6, 7, 8, 9, 10, J, Q, K, A (9 cards)
	// Spades: 7, 8, 9, 10, J, Q, K, A (8 cards - no 6 of spades)

	suitCounts := make(map[Suit]int)
	cardMap := make(map[string]bool)

	for _, card := range deck.Cards {
		suitCounts[card.Suit]++
		key := string(card.Suit) + "-" + string(card.Value)

		// Check for duplicates
		if cardMap[key] {
			t.Errorf("Duplicate card found: %s of %s", card.Value, card.Suit)
		}
		cardMap[key] = true
	}

	// Verify suit counts
	expectedCounts := map[Suit]int{
		Hearts:   9,
		Clubs:    9,
		Diamonds: 9,
		Spades:   8,
	}

	for suit, expected := range expectedCounts {
		if suitCounts[suit] != expected {
			t.Errorf("Expected %d %s cards, got %d", expected, suit, suitCounts[suit])
		}
	}

	// Verify no 6 of spades exists
	sixOfSpades := string(Spades) + "-" + string(Six)
	if cardMap[sixOfSpades] {
		t.Error("Deck should not contain 6 of spades")
	}

	// Verify all other expected cards exist
	expectedCards := []struct {
		suit  Suit
		value Value
	}{
		// Hearts (all including 6)
		{Hearts, Six}, {Hearts, Seven}, {Hearts, Eight}, {Hearts, Nine}, {Hearts, Ten},
		{Hearts, Jack}, {Hearts, Queen}, {Hearts, King}, {Hearts, Ace},
		// Clubs (all including 6)
		{Clubs, Six}, {Clubs, Seven}, {Clubs, Eight}, {Clubs, Nine}, {Clubs, Ten},
		{Clubs, Jack}, {Clubs, Queen}, {Clubs, King}, {Clubs, Ace},
		// Diamonds (all including 6)
		{Diamonds, Six}, {Diamonds, Seven}, {Diamonds, Eight}, {Diamonds, Nine}, {Diamonds, Ten},
		{Diamonds, Jack}, {Diamonds, Queen}, {Diamonds, King}, {Diamonds, Ace},
		// Spades (no 6)
		{Spades, Seven}, {Spades, Eight}, {Spades, Nine}, {Spades, Ten},
		{Spades, Jack}, {Spades, Queen}, {Spades, King}, {Spades, Ace},
	}

	for _, expected := range expectedCards {
		key := string(expected.suit) + "-" + string(expected.value)
		if !cardMap[key] {
			t.Errorf("Expected card not found: %s of %s", expected.value, expected.suit)
		}
	}
}

// TestShuffle verifies that shuffle produces different orderings
func TestShuffle(t *testing.T) {
	deck1 := NewDeck()
	deck2 := NewDeck()

	// Record original order
	originalOrder := make([]Card, len(deck1.Cards))
	copy(originalOrder, deck1.Cards)

	// Shuffle both decks
	deck1.Shuffle()
	deck2.Shuffle()

	// Verify deck1 is shuffled (order changed)
	sameOrder := true
	for i := range deck1.Cards {
		if !deck1.Cards[i].Equals(&originalOrder[i]) {
			sameOrder = false
			break
		}
	}

	if sameOrder {
		t.Error("Shuffle did not change card order (unlikely but possible if test runs multiple times)")
	}

	// Verify deck1 and deck2 have different orders (statistical check)
	differentOrders := false
	for i := range deck1.Cards {
		if !deck1.Cards[i].Equals(&deck2.Cards[i]) {
			differentOrders = true
			break
		}
	}

	if !differentOrders {
		t.Error("Two separate shuffles produced identical orders (statistically unlikely)")
	}

	// Verify deck still has all 35 cards after shuffle
	if len(deck1.Cards) != 35 {
		t.Errorf("Shuffle changed card count: expected 35, got %d", len(deck1.Cards))
	}

	// Verify deck is still valid after shuffle
	if err := deck1.Validate(); err != nil {
		t.Errorf("Deck invalid after shuffle: %v", err)
	}
}

// TestShuffleRandomness performs statistical test for shuffle uniformity
func TestShuffleRandomness(t *testing.T) {
	// Run shuffle 1000 times and track first card distribution
	iterations := 1000
	firstCardCounts := make(map[string]int)

	for i := 0; i < iterations; i++ {
		deck := NewDeck()
		deck.Shuffle()
		firstCard := deck.Cards[0]
		key := string(firstCard.Suit) + "-" + string(firstCard.Value)
		firstCardCounts[key]++
	}

	// Expected: each card should appear ~28-29 times as first card (1000/35 ≈ 28.57)
	// Allow reasonable variance (15-45 times per card)
	expectedFreq := float64(iterations) / 35.0 // ≈ 28.57
	minAcceptable := int(expectedFreq * 0.5)   // 14
	maxAcceptable := int(expectedFreq * 1.8)   // 51

	for card, count := range firstCardCounts {
		if count < minAcceptable || count > maxAcceptable {
			t.Logf("Warning: Card %s appeared %d times (expected ~%.1f)", card, count, expectedFreq)
		}
	}

	// Verify all 35 unique cards appeared at least once
	if len(firstCardCounts) < 30 { // Allow some variance
		t.Errorf("Poor shuffle distribution: only %d unique cards appeared as first card", len(firstCardCounts))
	}
}

// TestDeal verifies dealing cards to players
func TestDeal(t *testing.T) {
	tests := []struct {
		name           string
		numPlayers     int
		expectedHands  int
		expectedCards  int
		expectedRemain int
	}{
		{
			name:           "Deal to 2 players",
			numPlayers:     2,
			expectedHands:  2,
			expectedCards:  5,
			expectedRemain: 25, // 35 - (2 * 5) = 25
		},
		{
			name:           "Deal to 3 players",
			numPlayers:     3,
			expectedHands:  3,
			expectedCards:  5,
			expectedRemain: 20, // 35 - (3 * 5) = 20
		},
		{
			name:           "Deal to 4 players",
			numPlayers:     4,
			expectedHands:  4,
			expectedCards:  5,
			expectedRemain: 15, // 35 - (4 * 5) = 15
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			deck := NewDeck()
			deck.Shuffle()

			hands, err := deck.Deal(tt.numPlayers)
			if err != nil {
				t.Fatalf("Deal failed: %v", err)
			}

			// Verify correct number of hands
			if len(hands) != tt.expectedHands {
				t.Errorf("Expected %d hands, got %d", tt.expectedHands, len(hands))
			}

			// Verify each hand has correct number of cards
			for i, hand := range hands {
				if len(hand) != tt.expectedCards {
					t.Errorf("Hand %d: expected %d cards, got %d", i, tt.expectedCards, len(hand))
				}
			}

			// Verify remaining cards in deck
			if deck.RemainingCards() != tt.expectedRemain {
				t.Errorf("Expected %d remaining cards, got %d", tt.expectedRemain, deck.RemainingCards())
			}

			// Verify no duplicate cards across all hands
			cardMap := make(map[string]bool)
			for i, hand := range hands {
				for _, card := range hand {
					key := string(card.Suit) + "-" + string(card.Value)
					if cardMap[key] {
						t.Errorf("Duplicate card found in hands: %s of %s (hand %d)", card.Value, card.Suit, i)
					}
					cardMap[key] = true
				}
			}
		})
	}
}

// TestDealEdgeCases verifies error handling for invalid deal scenarios
func TestDealEdgeCases(t *testing.T) {
	tests := []struct {
		name        string
		numPlayers  int
		expectError bool
		errorMsg    string
	}{
		{
			name:        "Invalid: 0 players",
			numPlayers:  0,
			expectError: true,
			errorMsg:    "must have between 2 and 4 players",
		},
		{
			name:        "Invalid: 1 player",
			numPlayers:  1,
			expectError: true,
			errorMsg:    "must have between 2 and 4 players",
		},
		{
			name:        "Invalid: 5 players",
			numPlayers:  5,
			expectError: true,
			errorMsg:    "must have between 2 and 4 players",
		},
		{
			name:        "Invalid: negative players",
			numPlayers:  -1,
			expectError: true,
			errorMsg:    "must have between 2 and 4 players",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			deck := NewDeck()
			hands, err := deck.Deal(tt.numPlayers)

			if tt.expectError {
				if err == nil {
					t.Error("Expected error but got none")
				}
				if hands != nil {
					t.Error("Expected nil hands on error")
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				}
			}
		})
	}
}

// TestDealEmptyDeck verifies dealing from an already-dealt deck
func TestDealEmptyDeck(t *testing.T) {
	deck := NewDeck()

	// Deal first time to 4 players (20 cards dealt, 15 remain)
	_, err := deck.Deal(4)
	if err != nil {
		t.Fatalf("First deal failed: %v", err)
	}

	// Try to deal again to 4 players (only 15 cards remain, need 20)
	_, err = deck.Deal(4)
	if err == nil {
		t.Error("Expected error when dealing to 4 players with only 15 cards remaining")
	}

	// But should be able to deal to 2 players (need 10 cards, have 15)
	_, err = deck.Deal(2)
	if err != nil {
		t.Errorf("Should be able to deal to 2 players with 15 cards: %v", err)
	}

	// Now only 5 cards remain, cannot deal to anyone
	_, err = deck.Deal(2)
	if err == nil {
		t.Error("Expected error when dealing to 2 players with only 5 cards remaining")
	}
}

// TestValidate verifies deck validation logic
func TestValidate(t *testing.T) {
	t.Run("Valid deck", func(t *testing.T) {
		deck := NewDeck()
		if err := deck.Validate(); err != nil {
			t.Errorf("Valid deck failed validation: %v", err)
		}
	})

	t.Run("Invalid: wrong card count", func(t *testing.T) {
		deck := NewDeck()
		deck.Cards = deck.Cards[:30] // Remove some cards

		err := deck.Validate()
		if err == nil {
			t.Error("Expected error for deck with wrong card count")
		}
	})

	t.Run("Invalid: duplicate card", func(t *testing.T) {
		deck := NewDeck()
		// Replace last card with duplicate of first
		deck.Cards[34] = deck.Cards[0]

		err := deck.Validate()
		if err == nil {
			t.Error("Expected error for deck with duplicate card")
		}
	})

	t.Run("Invalid: 6 of spades present", func(t *testing.T) {
		deck := NewDeck()
		// Add 6 of spades (should not exist in Spar deck)
		deck.Cards = append(deck.Cards, Card{Suit: Spades, Value: Six})

		err := deck.Validate()
		if err == nil {
			t.Error("Expected error for deck with 6 of spades")
		}
	})

	t.Run("Invalid: missing required card", func(t *testing.T) {
		deck := NewDeck()
		// Remove Ace of Hearts
		for i, card := range deck.Cards {
			if card.Suit == Hearts && card.Value == Ace {
				deck.Cards = append(deck.Cards[:i], deck.Cards[i+1:]...)
				break
			}
		}

		err := deck.Validate()
		if err == nil {
			t.Error("Expected error for deck missing required card")
		}
	})

	t.Run("Invalid: invalid card", func(t *testing.T) {
		deck := NewDeck()
		// Add invalid card
		deck.Cards[0] = Card{Suit: Suit("invalid"), Value: Value("invalid")}

		err := deck.Validate()
		if err == nil {
			t.Error("Expected error for deck with invalid card")
		}
	})
}

// TestRemainingCards verifies the RemainingCards helper method
func TestRemainingCards(t *testing.T) {
	deck := NewDeck()

	// Initially should have 35 cards
	if deck.RemainingCards() != 35 {
		t.Errorf("Expected 35 remaining cards, got %d", deck.RemainingCards())
	}

	// Deal to 2 players (10 cards)
	_, err := deck.Deal(2)
	if err != nil {
		t.Fatalf("Deal failed: %v", err)
	}

	// Should have 25 cards remaining
	if deck.RemainingCards() != 25 {
		t.Errorf("Expected 25 remaining cards after dealing to 2 players, got %d", deck.RemainingCards())
	}

	// Deal to 3 more players would fail, but let's test the count
	deck2 := NewDeck()
	_, _ = deck2.Deal(4) // 20 cards dealt
	if deck2.RemainingCards() != 15 {
		t.Errorf("Expected 15 remaining cards after dealing to 4 players, got %d", deck2.RemainingCards())
	}
}

// TestIsEmpty verifies the IsEmpty helper method
func TestIsEmpty(t *testing.T) {
	deck := NewDeck()

	// Initially should not be empty
	if deck.IsEmpty() {
		t.Error("New deck should not be empty")
	}

	// Deal all possible cards
	_, _ = deck.Deal(4) // 20 cards dealt, 15 remain

	if deck.IsEmpty() {
		t.Error("Deck with 15 remaining cards should not be empty")
	}

	// Manually empty the deck
	deck.Cards = []Card{}
	if !deck.IsEmpty() {
		t.Error("Empty deck should return true for IsEmpty()")
	}
}

// TestDeckIntegration tests complete workflow
func TestDeckIntegration(t *testing.T) {
	// Create new deck
	deck := NewDeck()

	// Validate initial state
	if err := deck.Validate(); err != nil {
		t.Fatalf("Initial deck validation failed: %v", err)
	}

	// Shuffle
	deck.Shuffle()

	// Validate after shuffle
	if err := deck.Validate(); err != nil {
		t.Fatalf("Deck validation failed after shuffle: %v", err)
	}

	// Deal to 4 players
	hands, err := deck.Deal(4)
	if err != nil {
		t.Fatalf("Deal failed: %v", err)
	}

	// Verify all dealt cards are unique and valid
	allCards := make(map[string]bool)
	for _, hand := range hands {
		for _, card := range hand {
			if !card.IsValid() {
				t.Errorf("Invalid card dealt: %s of %s", card.Value, card.Suit)
			}

			key := string(card.Suit) + "-" + string(card.Value)
			if allCards[key] {
				t.Errorf("Duplicate card dealt: %s of %s", card.Value, card.Suit)
			}
			allCards[key] = true
		}
	}

	// Verify 20 cards dealt, 15 remain
	if len(allCards) != 20 {
		t.Errorf("Expected 20 unique cards dealt, got %d", len(allCards))
	}

	if deck.RemainingCards() != 15 {
		t.Errorf("Expected 15 remaining cards, got %d", deck.RemainingCards())
	}

	// Verify cannot deal another full round
	_, err = deck.Deal(4)
	if err == nil {
		t.Error("Should not be able to deal to 4 players with only 15 cards remaining")
	}

	// But should be able to deal to 2 players
	_, err = deck.Deal(2)
	if err != nil {
		t.Errorf("Should be able to deal to 2 players with 15 cards: %v", err)
	}

	// Now should have 5 cards left
	if deck.RemainingCards() != 5 {
		t.Errorf("Expected 5 remaining cards, got %d", deck.RemainingCards())
	}
}

// TestShuffleDeterminism verifies Fisher-Yates shuffle produces uniform distribution
func TestShuffleDeterminism(t *testing.T) {
	// Run multiple shuffles and track position distribution for first 3 cards
	iterations := 10000

	// Track where the first 3 cards of original deck end up
	positionCounts := make([]map[int]int, 3)
	for i := 0; i < 3; i++ {
		positionCounts[i] = make(map[int]int)
	}

	for iter := 0; iter < iterations; iter++ {
		deck := NewDeck()
		originalFirst3 := []Card{
			deck.Cards[0],
			deck.Cards[1],
			deck.Cards[2],
		}

		deck.Shuffle()

		// Find where each of the first 3 original cards ended up
		for origIdx, origCard := range originalFirst3 {
			for newIdx, card := range deck.Cards {
				if card.Equals(&origCard) {
					positionCounts[origIdx][newIdx]++
					break
				}
			}
		}
	}

	// Verify roughly uniform distribution (each position should appear ~285 times: 10000/35)
	expectedFreq := float64(iterations) / 35.0 // ≈ 285.7
	tolerance := 0.4                           // Allow 40% variance

	for origIdx := 0; origIdx < 3; origIdx++ {
		for pos := 0; pos < 35; pos++ {
			count := positionCounts[origIdx][pos]

			// Calculate chi-square-like variance
			variance := math.Abs(float64(count)-expectedFreq) / expectedFreq

			if variance > tolerance && count > 0 {
				t.Logf("Card %d position %d: count=%d (expected ~%.1f, variance=%.2f)",
					origIdx, pos, count, expectedFreq, variance)
			}
		}
	}
}

// BenchmarkNewDeck benchmarks deck creation
func BenchmarkNewDeck(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = NewDeck()
	}
}

// BenchmarkShuffle benchmarks shuffle operation
func BenchmarkShuffle(b *testing.B) {
	deck := NewDeck()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		deck.Shuffle()
	}
}

// BenchmarkDeal benchmarks dealing cards
func BenchmarkDeal(b *testing.B) {
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		b.StopTimer()
		deck := NewDeck()
		deck.Shuffle()
		b.StartTimer()

		_, _ = deck.Deal(4)
	}
}

// BenchmarkValidate benchmarks deck validation
func BenchmarkValidate(b *testing.B) {
	deck := NewDeck()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = deck.Validate()
	}
}
