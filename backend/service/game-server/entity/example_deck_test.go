package entity_test

import (
	"fmt"
	"log"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// ExampleDeck_basicUsage demonstrates basic deck operations
func ExampleDeck_basicUsage() {
	// Create a new deck
	deck := entity.NewDeck()
	fmt.Printf("Created deck with %d cards\n", deck.RemainingCards())

	// Shuffle the deck
	deck.Shuffle()
	fmt.Println("Deck shuffled")

	// Deal cards to 4 players
	hands, err := deck.Deal(4)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Dealt %d hands of 5 cards each\n", len(hands))
	fmt.Printf("Remaining cards: %d\n", deck.RemainingCards())

	// Output:
	// Created deck with 35 cards
	// Deck shuffled
	// Dealt 4 hands of 5 cards each
	// Remaining cards: 15
}

// ExampleDeck_validation demonstrates deck validation
func ExampleDeck_validation() {
	deck := entity.NewDeck()

	// Validate the deck
	if err := deck.Validate(); err != nil {
		log.Fatal(err)
	}

	fmt.Println("Deck is valid")
	fmt.Printf("Hearts: 9 cards, Clubs: 9 cards, Diamonds: 9 cards, Spades: 8 cards (no 6)\n")

	// Output:
	// Deck is valid
	// Hearts: 9 cards, Clubs: 9 cards, Diamonds: 9 cards, Spades: 8 cards (no 6)
}

// ExampleDeck_multipleDeals demonstrates dealing multiple times
func ExampleDeck_multipleDeals() {
	deck := entity.NewDeck()
	deck.Shuffle()

	// First deal to 2 players
	hands1, _ := deck.Deal(2)
	fmt.Printf("First deal: %d players, %d remaining\n", len(hands1), deck.RemainingCards())

	// Second deal to 2 players
	hands2, _ := deck.Deal(2)
	fmt.Printf("Second deal: %d players, %d remaining\n", len(hands2), deck.RemainingCards())

	// Check if we can deal again (need 10 cards for 2 players, have 15)
	remaining := deck.RemainingCards()
	if remaining < 20 { // Need 20 for 4 players
		fmt.Printf("Cannot deal to 4 more players (only %d cards)\n", remaining)
	}

	// Output:
	// First deal: 2 players, 25 remaining
	// Second deal: 2 players, 15 remaining
	// Cannot deal to 4 more players (only 15 cards)
}
