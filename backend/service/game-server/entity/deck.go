package entity

import (
	"fmt"
	"math/rand"
)

// Deck represents a deck of cards for the Spar game
// A Spar deck contains 35 cards total:
// - Hearts: 6, 7, 8, 9, 10, J, Q, K, A (9 cards)
// - Clubs: 6, 7, 8, 9, 10, J, Q, K, A (9 cards)
// - Diamonds: 6, 7, 8, 9, 10, J, Q, K, A (9 cards)
// - Spades: 6, 7, 8, 9, 10, J, Q, K (8 cards - no Ace of spades)
type Deck struct {
	Cards []Card
}

// NewDeck creates and returns a new standard 35-card Spar deck
// The deck is created in a deterministic order and should be shuffled before use
func NewDeck() *Deck {
	deck := &Deck{
		Cards: make([]Card, 0, 35),
	}

	// Standard card values in Spar (6-Ace)
	values := []Value{Six, Seven, Eight, Nine, Ten, Jack, Queen, King, Ace}

	// Hearts: all values including 6
	for _, value := range values {
		deck.Cards = append(deck.Cards, Card{Suit: Hearts, Value: value})
	}

	// Clubs: all values including 6
	for _, value := range values {
		deck.Cards = append(deck.Cards, Card{Suit: Clubs, Value: value})
	}

	// Diamonds: all values including 6
	for _, value := range values {
		deck.Cards = append(deck.Cards, Card{Suit: Diamonds, Value: value})
	}

	// Spades: no Ace of spades (6-King only)
	spadesValues := []Value{Six, Seven, Eight, Nine, Ten, Jack, Queen, King}
	for _, value := range spadesValues {
		deck.Cards = append(deck.Cards, Card{Suit: Spades, Value: value})
	}

	return deck
}

// Shuffle randomizes the order of cards in the deck using Fisher-Yates algorithm
// This provides uniform distribution with O(n) time complexity
func (d *Deck) Shuffle() {
	n := len(d.Cards)
	for i := n - 1; i > 0; i-- {
		j := rand.Intn(i + 1)
		d.Cards[i], d.Cards[j] = d.Cards[j], d.Cards[i]
	}
}

// Deal distributes cards to players and returns their hands
// Each player receives 5 cards, and the remaining cards stay in the deck
// - 2 players: 10 cards dealt, 25 remain
// - 3 players: 15 cards dealt, 20 remain
// - 4 players: 20 cards dealt, 15 remain
// Returns an error if the player count is invalid or insufficient cards remain
func (d *Deck) Deal(numPlayers int) ([][]Card, error) {
	// Validate player count (Spar supports 2-4 players)
	if numPlayers < 2 || numPlayers > 4 {
		return nil, fmt.Errorf("must have between 2 and 4 players, got %d", numPlayers)
	}

	cardsPerPlayer := 5
	totalCardsNeeded := numPlayers * cardsPerPlayer

	// Validate sufficient cards remain
	if len(d.Cards) < totalCardsNeeded {
		return nil, fmt.Errorf("insufficient cards: need %d, have %d", totalCardsNeeded, len(d.Cards))
	}

	// Create hands for each player
	hands := make([][]Card, numPlayers)
	cardIndex := 0

	for playerIdx := 0; playerIdx < numPlayers; playerIdx++ {
		hands[playerIdx] = make([]Card, cardsPerPlayer)

		for cardIdx := 0; cardIdx < cardsPerPlayer; cardIdx++ {
			hands[playerIdx][cardIdx] = d.Cards[cardIndex]
			cardIndex++
		}
	}

	// Remove dealt cards from deck
	d.Cards = d.Cards[totalCardsNeeded:]

	return hands, nil
}

// Validate checks if the deck has the correct composition for Spar
// Returns an error if:
// - Total card count is not 35
// - Duplicate cards exist
// - Required cards are missing
// - Invalid cards are present (including Ace of spades)
func (d *Deck) Validate() error {
	// Check total card count
	totalCards := len(d.Cards)
	if totalCards != 35 {
		return fmt.Errorf("deck must have 35 cards, got %d", totalCards)
	}

	// Build expected card set and check for duplicates
	cardMap := make(map[string]bool)
	invalidCards := []string{}

	for _, card := range d.Cards {
		// Check if card is valid
		if !card.IsValid() {
			invalidCards = append(invalidCards, fmt.Sprintf("%s of %s", card.Value, card.Suit))
			continue
		}

		// Check for Ace of spades (should not exist in Spar)
		if card.Suit == Spades && card.Value == Ace {
			return fmt.Errorf("deck must not contain Ace of spades")
		}

		// Check for duplicates
		key := string(card.Suit) + "-" + string(card.Value)
		if cardMap[key] {
			return fmt.Errorf("duplicate card found: %s of %s", card.Value, card.Suit)
		}
		cardMap[key] = true
	}

	if len(invalidCards) > 0 {
		return fmt.Errorf("deck contains invalid cards: %v", invalidCards)
	}

	// Verify all required cards are present
	expectedCards := []Card{
		// Hearts (9 cards including 6)
		{Hearts, Six}, {Hearts, Seven}, {Hearts, Eight}, {Hearts, Nine}, {Hearts, Ten},
		{Hearts, Jack}, {Hearts, Queen}, {Hearts, King}, {Hearts, Ace},
		// Clubs (9 cards including 6)
		{Clubs, Six}, {Clubs, Seven}, {Clubs, Eight}, {Clubs, Nine}, {Clubs, Ten},
		{Clubs, Jack}, {Clubs, Queen}, {Clubs, King}, {Clubs, Ace},
		// Diamonds (9 cards including 6)
		{Diamonds, Six}, {Diamonds, Seven}, {Diamonds, Eight}, {Diamonds, Nine}, {Diamonds, Ten},
		{Diamonds, Jack}, {Diamonds, Queen}, {Diamonds, King}, {Diamonds, Ace},
		// Spades (8 cards, no Ace)
		{Spades, Six}, {Spades, Seven}, {Spades, Eight}, {Spades, Nine}, {Spades, Ten},
		{Spades, Jack}, {Spades, Queen}, {Spades, King},
	}

	missingCards := []string{}
	for _, expected := range expectedCards {
		key := string(expected.Suit) + "-" + string(expected.Value)
		if !cardMap[key] {
			missingCards = append(missingCards, fmt.Sprintf("%s of %s", expected.Value, expected.Suit))
		}
	}

	if len(missingCards) > 0 {
		return fmt.Errorf("deck missing required cards: %v", missingCards)
	}

	return nil
}

// RemainingCards returns the number of cards left in the deck
func (d *Deck) RemainingCards() int {
	return len(d.Cards)
}

// IsEmpty returns true if the deck has no cards remaining
func (d *Deck) IsEmpty() bool {
	return len(d.Cards) == 0
}

// String returns a string representation of the deck (useful for debugging)
func (d *Deck) String() string {
	return fmt.Sprintf("Deck with %d cards", len(d.Cards))
}
