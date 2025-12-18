package entity

import (
	"fmt"
	"time"
)

// Suit represents a card suit
type Suit string

const (
	Hearts   Suit = "hearts"
	Clubs    Suit = "clubs"
	Diamonds Suit = "diamonds"
	Spades   Suit = "spades"
)

// String returns the string representation of the suit
func (s Suit) String() string {
	return string(s)
}

// IsValid checks if the suit is valid
func (s Suit) IsValid() bool {
	switch s {
	case Hearts, Clubs, Diamonds, Spades:
		return true
	}
	return false
}

// Value represents a card value
type Value string

const (
	Six   Value = "6"
	Seven Value = "7"
	Eight Value = "8"
	Nine  Value = "9"
	Ten   Value = "10"
	Jack  Value = "jack"
	Queen Value = "queen"
	King  Value = "king"
	Ace   Value = "ace"
)

// String returns the string representation of the value
func (v Value) String() string {
	return string(v)
}

// IsValid checks if the value is valid
func (v Value) IsValid() bool {
	switch v {
	case Six, Seven, Eight, Nine, Ten, Jack, Queen, King, Ace:
		return true
	}
	return false
}

// Rank returns the numeric rank of the card value for comparison
// Higher rank = stronger card
func (v Value) Rank() int {
	switch v {
	case Six:
		return 6
	case Seven:
		return 7
	case Eight:
		return 8
	case Nine:
		return 9
	case Ten:
		return 10
	case Jack:
		return 11
	case Queen:
		return 12
	case King:
		return 13
	case Ace:
		return 14
	default:
		return 0
	}
}

// Card represents a playing card
type Card struct {
	Suit  Suit  `json:"suit"`
	Value Value `json:"value"`
}

// String returns a string representation of the card
func (c *Card) String() string {
	return fmt.Sprintf("%s of %s", c.Value, c.Suit)
}

// IsValid checks if the card is valid
func (c *Card) IsValid() bool {
	return c.Suit.IsValid() && c.Value.IsValid()
}

// Equals checks if two cards are equal
func (c *Card) Equals(other *Card) bool {
	if other == nil {
		return false
	}
	return c.Suit == other.Suit && c.Value == other.Value
}

// IsStrongerThan checks if this card is stronger than another card of the same suit
func (c *Card) IsStrongerThan(other *Card) bool {
	if other == nil {
		return true
	}
	// Cards can only be compared if they're the same suit
	if c.Suit != other.Suit {
		return false
	}
	return c.Value.Rank() > other.Value.Rank()
}

// IsLowCard checks if the card is a 6 or 7 (eligible for dry declaration)
func (c *Card) IsLowCard() bool {
	return c.Value == Six || c.Value == Seven
}

// DryType represents the type of dry declaration
type DryType string

const (
	DryHidden DryType = "dry"       // Face-down declaration
	DryShown  DryType = "show_dry"  // Face-up declaration
)

// DryCard represents a declared dry card
type DryCard struct {
	Card     Card    `json:"card"`
	Type     DryType `json:"type"`
	PlayerID string  `json:"playerId"`
}

// BonusPoints returns the bonus points for winning with this dry card
func (dc *DryCard) BonusPoints() int {
	if dc.Type == DryShown {
		// Show Dry: 6 = 12 points, 7 = 8 points
		if dc.Card.Value == Six {
			return 12
		}
		if dc.Card.Value == Seven {
			return 8
		}
	} else if dc.Type == DryHidden {
		// Dry: 6 = 6 points, 7 = 4 points
		if dc.Card.Value == Six {
			return 6
		}
		if dc.Card.Value == Seven {
			return 4
		}
	}
	return 0
}

// PlayedCard represents a card that has been played in a round
type PlayedCard struct {
	Card      Card      `json:"card"`
	PlayerID  string    `json:"playerId"`
	PlayedAt  time.Time `json:"playedAt"`
	IsOnFire  bool      `json:"isOnFire"`  // True if played during a fire streak
	IsFrozen  bool      `json:"isFrozen"`  // True if played to break a fire streak
}

// GamePlayer represents a player's state during an active game
type GamePlayer struct {
	// Basic player info
	ID       string `json:"id"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`

	// Game state
	Hand         []Card   `json:"hand"`                    // Cards in player's hand
	DryCard      *DryCard `json:"dryCard,omitempty"`       // Declared dry card
	Score        int      `json:"score"`                   // Current score
	RoundsWon    int      `json:"roundsWon"`               // Number of rounds won
	WinStreak    int      `json:"winStreak"`               // Current win streak count
	IsLeader     bool     `json:"isLeader"`                // True if current leader
	IsOnFire     bool     `json:"isOnFire"`                // True if has 3+ win streak

	// Turn state
	HasPlayedCard  bool      `json:"hasPlayedCard"`         // True if played card this round
	LastPlayedCard *Card     `json:"lastPlayedCard,omitempty"` // Last card played
	PlayedAt       time.Time `json:"playedAt,omitempty"`    // When card was played
}

// CanDeclareD checks if player can declare a dry card (has 6 or 7)
func (gp *GamePlayer) CanDeclareDry() bool {
	for _, card := range gp.Hand {
		if card.IsLowCard() {
			return true
		}
	}
	return false
}

// HasCard checks if player has a specific card in their hand
func (gp *GamePlayer) HasCard(card *Card) bool {
	if card == nil {
		return false
	}
	for _, c := range gp.Hand {
		if c.Equals(card) {
			return true
		}
	}
	return false
}

// HasSuit checks if player has any card of the given suit
func (gp *GamePlayer) HasSuit(suit Suit) bool {
	for _, card := range gp.Hand {
		if card.Suit == suit {
			return true
		}
	}
	return false
}

// RemoveCard removes a card from the player's hand
func (gp *GamePlayer) RemoveCard(card *Card) bool {
	if card == nil {
		return false
	}
	for i, c := range gp.Hand {
		if c.Equals(card) {
			gp.Hand = append(gp.Hand[:i], gp.Hand[i+1:]...)
			return true
		}
	}
	return false
}

// HandCount returns the number of cards in the player's hand
func (gp *GamePlayer) HandCount() int {
	return len(gp.Hand)
}

// GamePhase represents the current phase of the game
type GamePhase string

const (
	PhaseWaiting    GamePhase = "waiting"      // Waiting for players
	PhaseDeclaring  GamePhase = "declaring"    // Dry card declaration phase
	PhasePlaying    GamePhase = "playing"      // Active gameplay
	PhaseRoundEnd   GamePhase = "round_end"    // Round just ended
	PhaseGameOver   GamePhase = "game_over"    // Game completed
)

// GameState represents the complete state of an active game
type GameState struct {
	// Game identification
	GameID   string    `json:"gameId"`
	RoomCode string    `json:"roomCode"`

	// Game configuration
	TotalRounds  int           `json:"totalRounds"`  // Always 5 for Spar
	PointsToWin  int           `json:"pointsToWin"`  // From room settings (10, 15, or 21)

	// Game phase
	Phase        GamePhase     `json:"phase"`

	// Players
	Players      []GamePlayer  `json:"players"`
	LeaderID     string        `json:"leaderId"`      // Current round leader
	CurrentTurn  string        `json:"currentTurn"`   // Player whose turn it is

	// Round state
	CurrentRound int           `json:"currentRound"`  // Current round number (1-5)
	LedSuit      *Suit         `json:"ledSuit,omitempty"` // Suit led this round
	PlayedCards  []PlayedCard  `json:"playedCards"`   // Cards played this round
	RoundWinner  string        `json:"roundWinner,omitempty"` // Winner of current round

	// Timer state
	TurnStartTime   time.Time  `json:"turnStartTime"`
	TurnTimeLimit   int        `json:"turnTimeLimit"`   // Seconds for this turn
	TurnExpired     bool       `json:"turnExpired"`

	// Win streaks
	FireStreakPlayer string    `json:"fireStreakPlayer,omitempty"` // Player with active fire streak
	FreezeTriggered  bool      `json:"freezeTriggered"`            // True if freeze just triggered

	// Game timestamps
	StartedAt    time.Time     `json:"startedAt"`
	CompletedAt  *time.Time    `json:"completedAt,omitempty"`
	UpdatedAt    time.Time     `json:"updatedAt"`
}

// GetPlayer finds a player by ID
func (gs *GameState) GetPlayer(playerID string) *GamePlayer {
	for i := range gs.Players {
		if gs.Players[i].ID == playerID {
			return &gs.Players[i]
		}
	}
	return nil
}

// GetLeader returns the current leader player
func (gs *GameState) GetLeader() *GamePlayer {
	return gs.GetPlayer(gs.LeaderID)
}

// IsLeader checks if a player is the current leader
func (gs *GameState) IsLeader(playerID string) bool {
	return gs.LeaderID == playerID
}

// AllPlayersPlayed checks if all players have played a card this round
func (gs *GameState) AllPlayersPlayed() bool {
	if len(gs.PlayedCards) != len(gs.Players) {
		return false
	}
	// Double-check each player has played
	for _, player := range gs.Players {
		if !player.HasPlayedCard {
			return false
		}
	}
	return true
}

// GetPlayedCard finds a played card by player ID
func (gs *GameState) GetPlayedCard(playerID string) *PlayedCard {
	for i := range gs.PlayedCards {
		if gs.PlayedCards[i].PlayerID == playerID {
			return &gs.PlayedCards[i]
		}
	}
	return nil
}

// IsRoundComplete checks if the current round is complete
func (gs *GameState) IsRoundComplete() bool {
	return gs.AllPlayersPlayed() && gs.RoundWinner != ""
}

// IsGameComplete checks if the game is complete (5 rounds played)
func (gs *GameState) IsGameComplete() bool {
	return gs.CurrentRound >= gs.TotalRounds && gs.IsRoundComplete()
}

// GetNextPlayer returns the player who should play next
// In Spar, play order is clockwise from the leader
func (gs *GameState) GetNextPlayer() *GamePlayer {
	if len(gs.Players) == 0 {
		return nil
	}

	// If no one has played yet, leader goes first
	if len(gs.PlayedCards) == 0 {
		return gs.GetLeader()
	}

	// If everyone has played, round is over
	if gs.AllPlayersPlayed() {
		return nil
	}

	// Find next player in clockwise order who hasn't played
	leaderIndex := -1
	for i, p := range gs.Players {
		if p.ID == gs.LeaderID {
			leaderIndex = i
			break
		}
	}

	if leaderIndex == -1 {
		return nil // Leader not found (shouldn't happen)
	}

	// Check players in clockwise order starting from leader
	for i := 1; i <= len(gs.Players); i++ {
		nextIndex := (leaderIndex + i) % len(gs.Players)
		player := &gs.Players[nextIndex]
		if !player.HasPlayedCard {
			return player
		}
	}

	return nil
}

// GetPlayerCount returns the number of players in the game
func (gs *GameState) GetPlayerCount() int {
	return len(gs.Players)
}

// GetWinningPlayer returns the player with the highest score
func (gs *GameState) GetWinningPlayer() *GamePlayer {
	if len(gs.Players) == 0 {
		return nil
	}

	winner := &gs.Players[0]
	for i := 1; i < len(gs.Players); i++ {
		if gs.Players[i].Score > winner.Score {
			winner = &gs.Players[i]
		}
	}
	return winner
}

// ResetRound resets the round state for the next round
func (gs *GameState) ResetRound() {
	gs.PlayedCards = []PlayedCard{}
	gs.LedSuit = nil
	gs.RoundWinner = ""
	gs.FreezeTriggered = false

	// Reset player round state
	for i := range gs.Players {
		gs.Players[i].HasPlayedCard = false
		gs.Players[i].LastPlayedCard = nil
	}

	gs.UpdatedAt = time.Now()
}

// Challenge represents a suit violation challenge
type Challenge struct {
	ChallengerID string    `json:"challengerId"`
	TargetID     string    `json:"targetId"`
	RequiredSuit Suit      `json:"requiredSuit"`
	PlayedCard   Card      `json:"playedCard"`
	Timestamp    time.Time `json:"timestamp"`
	IsCorrect    bool      `json:"isCorrect"`
}

// GameResult represents the final result of a game
type GameResult struct {
	GameID       string            `json:"gameId"`
	WinnerID     string            `json:"winnerId"`
	WinningCard  *Card             `json:"winningCard"`
	TotalRounds  int               `json:"totalRounds"`
	Duration     time.Duration     `json:"duration"`
	PlayerScores map[string]int    `json:"playerScores"`
	FireStreak   bool              `json:"fireStreak"`
	FreezeUsed   bool              `json:"freezeUsed"`
	DryBonus     bool              `json:"dryBonus"`
	CompletedAt  time.Time         `json:"completedAt"`
}
