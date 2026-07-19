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

// CompareValue compares the value of this card with another card
// Returns: 1 if this card is stronger, -1 if weaker, 0 if equal
// Only compares cards of the same suit
func (c *Card) CompareValue(other Card) int {
	// Cards can only be compared if they're the same suit
	if c.Suit != other.Suit {
		return 0
	}

	thisRank := c.Value.Rank()
	otherRank := other.Value.Rank()

	if thisRank > otherRank {
		return 1
	}
	if thisRank < otherRank {
		return -1
	}
	return 0
}

// IsLowCard checks if the card is a 6 or 7 (eligible for dry declaration)
func (c *Card) IsLowCard() bool {
	return c.Value == Six || c.Value == Seven
}

// GameWinValue returns the points awarded for winning the final (5th) round
// with a card of this value. Per the Spar ruleset the winner of the final
// round wins the game and scores by the value of their winning card:
// 6 -> 3, 7 -> 2, and any 8-or-higher card (8, 9, 10, J, Q, K, A) -> 1.
// An invalid value yields 0.
func (v Value) GameWinValue() int {
	switch v {
	case Six:
		return 3
	case Seven:
		return 2
	case Eight, Nine, Ten, Jack, Queen, King, Ace:
		return 1
	default:
		return 0
	}
}

// DryType represents the type of dry declaration
type DryType string

const (
	DryHidden DryType = "dry"      // Face-down declaration
	DryShown  DryType = "show_dry" // Face-up declaration
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
	Card     Card      `json:"card"`
	PlayerID string    `json:"playerId"`
	PlayedAt time.Time `json:"playedAt"`
	IsOnFire bool      `json:"isOnFire"` // True if played during a fire streak
	IsFrozen bool      `json:"isFrozen"` // True if played to break a fire streak
}

// GamePlayer represents a player's state during an active game
type GamePlayer struct {
	// Basic player info
	ID       string `json:"id"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`

	// Game state
	Hand       []Card   `json:"hand"`              // Cards in player's hand
	DryCard    *DryCard `json:"dryCard,omitempty"` // Declared dry card
	Score      int      `json:"score"`             // Score earned this game (value points from winning the final round)
	MatchScore int      `json:"matchScore"`        // Cumulative match score across all games in this room
	RoundsWon  int      `json:"roundsWon"`         // Number of rounds (tricks) won this game
	WinStreak  int      `json:"winStreak"`         // Current win streak count
	IsLeader   bool     `json:"isLeader"`          // True if current leader
	IsOnFire   bool     `json:"isOnFire"`          // True if has 3+ win streak

	// Turn state
	HasPlayedCard  bool      `json:"hasPlayedCard"`            // True if played card this round
	LastPlayedCard *Card     `json:"lastPlayedCard,omitempty"` // Last card played
	PlayedAt       time.Time `json:"playedAt,omitempty"`       // When card was played
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
	PhaseWaiting   GamePhase = "waiting"   // Waiting for players
	PhaseDeclaring GamePhase = "declaring" // Dry card declaration phase
	PhasePlaying   GamePhase = "playing"   // Active gameplay
	PhaseRoundEnd  GamePhase = "round_end" // Round just ended
	PhaseGameOver  GamePhase = "game_over" // Game completed
)

// GameState represents the complete state of an active game
type GameState struct {
	// Game identification
	GameID   string `json:"gameId"`
	RoomCode string `json:"roomCode"`

	// Game configuration
	TotalRounds int `json:"totalRounds"` // Always 5 for Spar
	PointsToWin int `json:"pointsToWin"` // From room settings (10, 15, or 21)

	// Game phase
	Phase GamePhase `json:"phase"`

	// Players
	Players     []GamePlayer `json:"players"`
	LeaderID    string       `json:"leaderId"`    // Current round leader
	CurrentTurn string       `json:"currentTurn"` // Player whose turn it is

	// Round state
	CurrentRound int          `json:"currentRound"`          // Current round number (1-5)
	LedSuit      *Suit        `json:"ledSuit,omitempty"`     // Suit led this round
	PlayedCards  []PlayedCard `json:"playedCards"`           // Cards played this round
	RoundWinner  string       `json:"roundWinner,omitempty"` // Winner of current round

	// Timer state
	TurnStartTime time.Time `json:"turnStartTime"`
	TurnTimeLimit int       `json:"turnTimeLimit"` // Seconds for this turn
	TurnExpired   bool      `json:"turnExpired"`

	// Win streaks
	FireStreakPlayer string `json:"fireStreakPlayer,omitempty"` // Player with active fire streak
	FreezeTriggered  bool   `json:"freezeTriggered"`            // True if freeze just triggered

	// Game timestamps
	StartedAt   time.Time  `json:"startedAt"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
	UpdatedAt   time.Time  `json:"updatedAt"`
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
	for i := range gs.Players[1:] {
		if gs.Players[i+1].Score > winner.Score {
			winner = &gs.Players[i+1]
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

// StreakEventType represents the type of win streak event
type StreakEventType string

const (
	// StreakEventStreakStarted indicates a player won their first round (streak = 1)
	StreakEventStreakStarted StreakEventType = "streak_started"

	// StreakEventFireActivated indicates fire effect activated (streak reached 2)
	StreakEventFireActivated StreakEventType = "fire_activated"

	// StreakEventFireContinued indicates fire effect continues (streak 3+)
	StreakEventFireContinued StreakEventType = "fire_continued"

	// StreakEventFreezeTriggered indicates freeze effect triggered (broke 3+ streak)
	StreakEventFreezeTriggered StreakEventType = "freeze_triggered"

	// StreakEventStreakBroken indicates a player's streak was broken
	StreakEventStreakBroken StreakEventType = "streak_broken"
)

// StreakEvent represents a win streak event that occurred in a round
// These events are used to trigger frontend animations and track bonuses
type StreakEvent struct {
	Type         StreakEventType `json:"type"`         // Type of streak event
	PlayerID     string          `json:"playerId"`     // Player who triggered the event
	Username     string          `json:"username"`     // Player's username for display
	Streak       int             `json:"streak"`       // Current streak count
	Bonus        int             `json:"bonus"`        // Bonus points awarded (if any)
	BrokenStreak int             `json:"brokenStreak"` // Streak that was broken (for freeze events)
}

// GameResult represents the final result of a game
type GameResult struct {
	GameID       string         `json:"gameId"`
	WinnerID     string         `json:"winnerId"`
	WinningCard  *Card          `json:"winningCard"`
	TotalRounds  int            `json:"totalRounds"`
	Duration     time.Duration  `json:"duration"`
	PlayerScores map[string]int `json:"playerScores"`
	FireStreak   bool           `json:"fireStreak"`
	FreezeUsed   bool           `json:"freezeUsed"`
	DryBonus     bool           `json:"dryBonus"`
	CompletedAt  time.Time      `json:"completedAt"`
}

// FinalScore represents a player's detailed final score breakdown
// Used in game over calculations to show how each bonus contributed
type FinalScore struct {
	PlayerID         string `json:"playerId"`
	Username         string `json:"username"`
	BaseScore        int    `json:"baseScore"`        // Points from rounds won (1 point per round)
	DryCardBonus     int    `json:"dryCardBonus"`     // Total bonus from dry cards (3x/6x)
	StreakBonus      int    `json:"streakBonus"`      // Total bonus from fire streaks (+5 per round)
	FreezeBonus      int    `json:"freezeBonus"`      // Bonus from freeze effects (+10)
	ChallengeBonus   int    `json:"challengeBonus"`   // Bonus from valid challenges (+10)
	ChallengePenalty int    `json:"challengePenalty"` // Penalty from invalid challenges (-5)
	TotalScore       int    `json:"totalScore"`       // Final computed score
	RoundsWon        int    `json:"roundsWon"`        // Number of rounds won
}

// GameSummary represents the comprehensive final summary of a completed game
// This is broadcast to all players and saved to the database
type GameSummary struct {
	GameID          string                 `json:"gameId"`
	RoomCode        string                 `json:"roomCode"`
	Winners         []string               `json:"winners"`         // Can be multiple in case of tie
	FinalScores     map[string]*FinalScore `json:"finalScores"`     // Player ID -> Final score breakdown
	TotalRounds     int                    `json:"totalRounds"`     // Total rounds played (always 5 for Spar)
	DurationSeconds int                    `json:"durationSeconds"` // Game duration in seconds
	IsFireWin       bool                   `json:"isFireWin"`       // True if winner(s) had fire effect
	IsFreezeWin     bool                   `json:"isFreezeWin"`     // True if winner(s) used freeze
	CompletionType  GameCompletionType     `json:"completionType"`  // How the game ended
	CompletedAt     time.Time              `json:"completedAt"`     // When the game ended
	PlayerResults   []*PlayerGameResult    `json:"playerResults"`   // Detailed results for each player
}

// GameCompletionType represents how a game ended
type GameCompletionType string

const (
	// CompletionRounds indicates game ended after completing all 5 rounds
	CompletionRounds GameCompletionType = "rounds_complete"

	// CompletionPointsTarget indicates game ended when a player reached points target
	CompletionPointsTarget GameCompletionType = "target_reached"

	// CompletionForfeit indicates game ended due to all but one player disconnecting
	CompletionForfeit GameCompletionType = "forfeit"
)

// PlayerGameResult represents an individual player's result in a game
// This is saved to the player_game_results table for stats tracking
type PlayerGameResult struct {
	GameID         string `json:"gameId"`
	UserID         string `json:"userId"`
	FinalScore     int    `json:"finalScore"`
	RoundsWon      int    `json:"roundsWon"`
	DeclaredDry    bool   `json:"declaredDry"`
	DryCardValue   int    `json:"dryCardValue"`   // Value of dry card (6 or 7), 0 if none
	DryType        string `json:"dryType"`        // "dry" or "show_dry", empty if none
	ChallengesMade int    `json:"challengesMade"` // Number of challenges initiated
	ChallengesWon  int    `json:"challengesWon"`  // Number of valid challenges
	Placement      int    `json:"placement"`      // Final ranking (1st, 2nd, 3rd, 4th)
	IsWinner       bool   `json:"isWinner"`       // True if this player won
}
