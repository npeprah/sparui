package websocket

import (
	"fmt"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// mapBackendRankToFrontend converts backend card values (ace, king, queen, jack, 2-10)
// to frontend rank notation (A, K, Q, J, 2-10)
func mapBackendRankToFrontend(value entity.Value) string {
	switch value {
	case entity.Ace:
		return "A"
	case entity.King:
		return "K"
	case entity.Queen:
		return "Q"
	case entity.Jack:
		return "J"
	case entity.Ten:
		return "10"
	case entity.Nine:
		return "9"
	case entity.Eight:
		return "8"
	case entity.Seven:
		return "7"
	case entity.Six:
		return "6"
	default:
		// Fallback to the string value if unknown
		return string(value)
	}
}

// convertCardToFrontendFormat converts a backend Card to frontend format
// Backend format: {suit: "spades", value: "king"}
// Frontend format: {suit: "spades", rank: "K", id: "spades-K"}
func convertCardToFrontendFormat(card *entity.Card) map[string]interface{} {
	rank := mapBackendRankToFrontend(card.Value)
	return map[string]interface{}{
		"suit": string(card.Suit),
		"rank": rank,
		"id":   fmt.Sprintf("%s-%s", card.Suit, rank),
	}
}

// convertPlayedCardsToFrontendFormat converts a slice of PlayedCard to frontend format
func convertPlayedCardsToFrontendFormat(playedCards []entity.PlayedCard) []interface{} {
	result := make([]interface{}, 0, len(playedCards))
	for _, pc := range playedCards {
		result = append(result, map[string]interface{}{
			"playerId": pc.PlayerID,
			"card":     convertCardToFrontendFormat(&pc.Card),
		})
	}
	return result
}

// convertCardsToFrontendFormat converts a slice of Card to frontend format
func convertCardsToFrontendFormat(cards []entity.Card) []interface{} {
	result := make([]interface{}, 0, len(cards))
	for i := range cards {
		result = append(result, convertCardToFrontendFormat(&cards[i]))
	}
	return result
}

// convertGameStateToFrontendFormat converts a GameState to frontend format
// This ensures all cards (hands, played cards, dry cards) use frontend format
func convertGameStateToFrontendFormat(gs *entity.GameState) map[string]interface{} {
	// Convert players with frontend-formatted cards
	players := make([]interface{}, 0, len(gs.Players))
	for _, player := range gs.Players {
		playerData := map[string]interface{}{
			"id":        player.ID,
			"username":  player.Username,
			"avatar":    player.Avatar,
			"hand":      convertCardsToFrontendFormat(player.Hand),
			"score":     player.Score,
			"roundsWon": player.RoundsWon,
			"winStreak": player.WinStreak,
			"isLeader":  player.IsLeader,
			"isOnFire":  player.IsOnFire,
		}

		// Add dry card if present
		if player.DryCard != nil {
			playerData["dryCard"] = map[string]interface{}{
				"card":     convertCardToFrontendFormat(&player.DryCard.Card),
				"type":     player.DryCard.Type,
				"playerId": player.DryCard.PlayerID,
			}
		}

		players = append(players, playerData)
	}

	// Build the game state with frontend-formatted data
	result := map[string]interface{}{
		"gameId":             gs.GameID,
		"roomCode":           gs.RoomCode,
		"totalRounds":        gs.TotalRounds,
		"pointsToWin":        gs.PointsToWin,
		"phase":              gs.Phase,
		"players":            players,
		"leaderId":           gs.LeaderID,
		"currentTurn":        gs.CurrentTurn,
		"currentRound":       gs.CurrentRound,
		"playedCards":        convertPlayedCardsToFrontendFormat(gs.PlayedCards),
		"turnStartTime":      gs.TurnStartTime,
		"turnTimeLimit":      gs.TurnTimeLimit,
		"turnExpired":        gs.TurnExpired,
		"fireStreakPlayer":   gs.FireStreakPlayer,
		"freezeTriggered":    gs.FreezeTriggered,
		"startedAt":          gs.StartedAt,
		"updatedAt":          gs.UpdatedAt,
	}

	// Add optional fields
	if gs.LedSuit != nil {
		result["ledSuit"] = string(*gs.LedSuit)
	}
	if gs.RoundWinner != "" {
		result["roundWinner"] = gs.RoundWinner
	}

	return result
}
