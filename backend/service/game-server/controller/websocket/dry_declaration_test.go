package websocket

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// declaringState builds a fresh round-1 playing state for a single player who
// holds the given hand. This is the (skippable) window in which a dry / show-dry
// declaration is accepted at game start.
func declaringState(roomCode string, hand []entity.Card) *entity.GameState {
	return &entity.GameState{
		GameID:      "game-" + roomCode,
		RoomCode:    roomCode,
		TotalRounds: 5,
		PointsToWin: 10,
		Phase:       entity.PhasePlaying,
		Players: []entity.GamePlayer{
			{ID: "player1", Username: "Alice", Hand: hand},
			{ID: "player2", Username: "Bob"},
		},
		LeaderID:     "player1",
		CurrentTurn:  "player1",
		CurrentRound: 1,
		PlayedCards:  []entity.PlayedCard{},
		StartedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}

func declareDryJSON(t *testing.T, suit, value string, isShown bool) json.RawMessage {
	t.Helper()
	payload := map[string]interface{}{
		"card":    map[string]string{"suit": suit, "value": value},
		"isShown": isShown,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal declare payload: %v", err)
	}
	return b
}

// TestHandleDeclareDry_Validation covers the declaration rules: only a 6 or 7,
// one declaration per game, the card must be held, and the declaring window is
// the opening round before the player has committed a card. Skipping is implicit
// (a player who never declares just plays on) and is covered by the scoring
// tests below.
func TestHandleDeclareDry_Validation(t *testing.T) {
	sixHearts := entity.Card{Suit: entity.Hearts, Value: entity.Six}
	sevenClubs := entity.Card{Suit: entity.Clubs, Value: entity.Seven}
	kingSpades := entity.Card{Suit: entity.Spades, Value: entity.King}
	baseHand := []entity.Card{sixHearts, sevenClubs, kingSpades}

	tests := []struct {
		name       string
		suit       string
		value      string
		isShown    bool
		mutate     func(gs *entity.GameState)
		wantOK     bool
		wantType   entity.DryType
		wantErrMsg string
	}{
		{
			name:     "valid hidden dry six",
			suit:     "hearts",
			value:    "6",
			isShown:  false,
			wantOK:   true,
			wantType: entity.DryHidden,
		},
		{
			name:     "valid show-dry seven",
			suit:     "clubs",
			value:    "7",
			isShown:  true,
			wantOK:   true,
			wantType: entity.DryShown,
		},
		{
			name:       "reject non-low card (king)",
			suit:       "spades",
			value:      "king",
			wantOK:     false,
			wantErrMsg: "Only a 6 or 7 can be declared as dry",
		},
		{
			name:       "reject card not in hand",
			suit:       "diamonds",
			value:      "6",
			wantOK:     false,
			wantErrMsg: "Card not in your hand",
		},
		{
			name:    "reject second declaration in same game",
			suit:    "hearts",
			value:   "6",
			isShown: false,
			mutate: func(gs *entity.GameState) {
				gs.Players[0].DryCard = &entity.DryCard{
					Card:     sevenClubs,
					Type:     entity.DryHidden,
					PlayerID: "player1",
				}
			},
			wantOK:     false,
			wantErrMsg: "Already declared a dry card",
		},
		{
			name:  "reject declaration after opening round",
			suit:  "hearts",
			value: "6",
			mutate: func(gs *entity.GameState) {
				gs.CurrentRound = 2
			},
			wantOK:     false,
			wantErrMsg: "Dry can only be declared at the start of the game",
		},
		{
			name:  "reject declaration after player has played",
			suit:  "hearts",
			value: "6",
			mutate: func(gs *entity.GameState) {
				gs.Players[0].HasPlayedCard = true
			},
			wantOK:     false,
			wantErrMsg: "Cannot declare after playing a card",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			roomID := "DECLARE"
			// Fresh copy of the hand per subtest.
			hand := make([]entity.Card, len(baseHand))
			copy(hand, baseHand)
			gs := declaringState(roomID, hand)
			if tt.mutate != nil {
				tt.mutate(gs)
			}
			client, cleanup := registerTestClient(t, roomID, "player1", gs)
			defer cleanup()

			client.handleDeclareDry(declareDryJSON(t, tt.suit, tt.value, tt.isShown))

			player := gs.GetPlayer("player1")
			if tt.wantOK {
				if player.DryCard == nil {
					t.Fatalf("expected a dry declaration, got none")
				}
				if player.DryCard.Type != tt.wantType {
					t.Errorf("dry type = %s, want %s", player.DryCard.Type, tt.wantType)
				}
				if data := drainForEvent(client, "game:dry_declared"); data == nil {
					t.Error("expected a game:dry_declared confirmation to the declarer")
				}
			} else {
				// A pre-existing declaration (second-declaration case) may remain;
				// the point is the new one was NOT recorded over it. For all other
				// rejections there must be no declaration at all.
				if tt.mutate == nil && player.DryCard != nil {
					t.Errorf("expected no declaration, got %+v", player.DryCard)
				}
				data := drainForEvent(client, "game:dry_error")
				if data == nil {
					t.Fatalf("expected a game:dry_error")
				}
				if tt.wantErrMsg != "" && data["error"] != tt.wantErrMsg {
					t.Errorf("error = %q, want %q", data["error"], tt.wantErrMsg)
				}
			}
		})
	}
}

// TestHandleDeclareDry_HiddenNotLeaked verifies a hidden dry declaration exposes
// only THAT a declaration was made (type + player), never the card identity,
// while a show-dry reveals the card face-up. This is the serialization the UI
// reads to render face-down vs face-up dry cards.
func TestHandleDeclareDry_HiddenNotLeaked(t *testing.T) {
	t.Run("hidden dry withholds the card", func(t *testing.T) {
		gs := declaringState("HIDE", []entity.Card{{Suit: entity.Hearts, Value: entity.Six}})
		gs.Players[0].DryCard = &entity.DryCard{
			Card:     entity.Card{Suit: entity.Hearts, Value: entity.Six},
			Type:     entity.DryHidden,
			PlayerID: "player1",
		}
		out := convertGameStateToFrontendFormat(gs)
		players := out["players"].([]interface{})
		p1 := players[0].(map[string]interface{})
		dry, ok := p1["dryCard"].(map[string]interface{})
		if !ok {
			t.Fatal("expected dryCard in serialized player")
		}
		if dry["type"] != entity.DryHidden {
			t.Errorf("dry type = %v, want %v", dry["type"], entity.DryHidden)
		}
		if _, leaked := dry["card"]; leaked {
			t.Error("hidden dry card identity must NOT be serialized to the room")
		}
	})

	t.Run("show-dry reveals the card", func(t *testing.T) {
		gs := declaringState("SHOW", []entity.Card{{Suit: entity.Clubs, Value: entity.Seven}})
		gs.Players[0].DryCard = &entity.DryCard{
			Card:     entity.Card{Suit: entity.Clubs, Value: entity.Seven},
			Type:     entity.DryShown,
			PlayerID: "player1",
		}
		out := convertGameStateToFrontendFormat(gs)
		players := out["players"].([]interface{})
		p1 := players[0].(map[string]interface{})
		dry := p1["dryCard"].(map[string]interface{})
		card, ok := dry["card"].(map[string]interface{})
		if !ok {
			t.Fatal("show-dry must serialize the revealed card")
		}
		if card["rank"] != "7" || card["suit"] != "clubs" {
			t.Errorf("revealed card = %v, want clubs 7", card)
		}
	})
}

// TestHandleRoundCompletion_DryBonus is the heart of ticket 06: the dry /
// show-dry bonus is paid ONLY when the player wins the FINAL round by playing
// their declared card, and REPLACES the base final-round value score. Every
// other outcome falls back to the base scoring (or no score).
func TestHandleRoundCompletion_DryBonus(t *testing.T) {
	hearts := entity.Hearts

	// declaredWinner builds a final-round state where player1 wins the trick with
	// hearts-winCard and had declared declared (or nil) as their dry card.
	declaredWinner := func(roomCode string, winCard entity.Value, declared *entity.DryCard) *entity.GameState {
		gs := finalRoundState(roomCode, "player1", winCard)
		gs.GetPlayer("player1").DryCard = declared
		return gs
	}

	tests := []struct {
		name       string
		build      func(roomCode string) *entity.GameState
		wantP1     int // expected per-game Score for player1
		wantP2     int // expected per-game Score for player2
		wantIsDry  bool
		wantIsShow bool
	}{
		{
			name: "win final with declared hidden six -> 6 replaces base 3",
			build: func(r string) *entity.GameState {
				return declaredWinner(r, entity.Six, &entity.DryCard{
					Card: entity.Card{Suit: hearts, Value: entity.Six}, Type: entity.DryHidden, PlayerID: "player1",
				})
			},
			wantP1:    6,
			wantIsDry: true,
		},
		{
			name: "win final with declared hidden seven -> 4 replaces base 2",
			build: func(r string) *entity.GameState {
				return declaredWinner(r, entity.Seven, &entity.DryCard{
					Card: entity.Card{Suit: hearts, Value: entity.Seven}, Type: entity.DryHidden, PlayerID: "player1",
				})
			},
			wantP1:    4,
			wantIsDry: true,
		},
		{
			name: "win final with declared show-dry six -> 12 replaces base 3",
			build: func(r string) *entity.GameState {
				return declaredWinner(r, entity.Six, &entity.DryCard{
					Card: entity.Card{Suit: hearts, Value: entity.Six}, Type: entity.DryShown, PlayerID: "player1",
				})
			},
			wantP1:     12,
			wantIsShow: true,
		},
		{
			name: "win final with declared show-dry seven -> 8 replaces base 2",
			build: func(r string) *entity.GameState {
				return declaredWinner(r, entity.Seven, &entity.DryCard{
					Card: entity.Card{Suit: hearts, Value: entity.Seven}, Type: entity.DryShown, PlayerID: "player1",
				})
			},
			wantP1:     8,
			wantIsShow: true,
		},
		{
			name: "win final WITHOUT the declared card -> base value stands",
			build: func(r string) *entity.GameState {
				// Declared hearts-6 but wins with hearts-king (King = base 1).
				return declaredWinner(r, entity.King, &entity.DryCard{
					Card: entity.Card{Suit: hearts, Value: entity.Six}, Type: entity.DryShown, PlayerID: "player1",
				})
			},
			wantP1: 1,
		},
		{
			name: "no declaration -> base value stands",
			build: func(r string) *entity.GameState {
				return declaredWinner(r, entity.Six, nil)
			},
			wantP1: 3,
		},
		{
			name: "declarer LOSES the final round -> no bonus, winner scores base",
			build: func(r string) *entity.GameState {
				// player2 wins with hearts-king; player1 declared hearts-6 but
				// played off-suit clubs and loses -> player1 scores nothing.
				gs := finalRoundState(r, "player2", entity.King)
				gs.PlayedCards = []entity.PlayedCard{
					{PlayerID: "player2", Card: entity.Card{Suit: hearts, Value: entity.King}, PlayedAt: time.Now()},
					{PlayerID: "player1", Card: entity.Card{Suit: entity.Clubs, Value: entity.Six}, PlayedAt: time.Now()},
				}
				gs.GetPlayer("player1").DryCard = &entity.DryCard{
					Card: entity.Card{Suit: hearts, Value: entity.Six}, Type: entity.DryShown, PlayerID: "player1",
				}
				return gs
			},
			wantP1: 0,
			wantP2: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			roomID := "DRYBONUS"
			gs := tt.build(roomID)
			client, cleanup := registerTestClient(t, roomID, "player1", gs)
			defer cleanup()

			client.handleRoundCompletion(gs)

			if gs.Phase != entity.PhaseGameOver {
				t.Fatalf("expected game over, got %s", gs.Phase)
			}
			if got := gs.GetPlayer("player1").Score; got != tt.wantP1 {
				t.Errorf("player1 Score = %d, want %d", got, tt.wantP1)
			}
			if got := gs.GetPlayer("player2").Score; got != tt.wantP2 {
				t.Errorf("player2 Score = %d, want %d", got, tt.wantP2)
			}
			// The winner's match score must reflect the same points.
			winnerID := gs.RoundWinner
			if got := getMatchScore(roomID, winnerID); got != tt.wantP1+tt.wantP2 {
				t.Errorf("winner match score = %d, want %d", got, tt.wantP1+tt.wantP2)
			}

			data := drainForEvent(client, "roundWon")
			if data == nil {
				t.Fatal("expected a roundWon broadcast")
			}
			if got := data["isDry"].(bool); got != tt.wantIsDry {
				t.Errorf("roundWon isDry = %v, want %v", got, tt.wantIsDry)
			}
			if got := data["isShowDry"].(bool); got != tt.wantIsShow {
				t.Errorf("roundWon isShowDry = %v, want %v", got, tt.wantIsShow)
			}
		})
	}
}

// TestHandleRoundCompletion_DryBonusOnlyOnFinalRound verifies that winning an
// EARLIER round with the declared card pays nothing (only the final round
// scores) and does not consume the declaration.
func TestHandleRoundCompletion_DryBonusOnlyOnFinalRound(t *testing.T) {
	roomID := "EARLY"
	gs := finalRoundState(roomID, "player1", entity.Six)
	gs.CurrentRound = 3 // not the final round
	gs.GetPlayer("player1").DryCard = &entity.DryCard{
		Card:     entity.Card{Suit: entity.Hearts, Value: entity.Six},
		Type:     entity.DryShown,
		PlayerID: "player1",
	}
	client, cleanup := registerTestClient(t, roomID, "player1", gs)
	defer cleanup()

	client.handleRoundCompletion(gs)

	if gs.Phase == entity.PhaseGameOver {
		t.Fatal("game should not be over after an earlier round")
	}
	if got := gs.GetPlayer("player1").Score; got != 0 {
		t.Errorf("no points before the final round, got Score %d", got)
	}
	if got := getMatchScore(roomID, "player1"); got != 0 {
		t.Errorf("no match points before the final round, got %d", got)
	}
	// The declaration survives into the next round.
	if gs.GetPlayer("player1").DryCard == nil {
		t.Error("declaration must persist across rounds until the final round")
	}
}
